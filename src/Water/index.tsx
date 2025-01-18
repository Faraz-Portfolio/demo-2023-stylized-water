import { useTexture } from "@react-three/drei";
import { GroupProps, useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";

import { folder, useControls } from "leva";
import CSM from "three-custom-shader-material";
import Fresnel from "./Fresnel";
import HSVLerp from "./HSVLerp";
import { useWaterControls } from "./useWaterControls";

import { patchShaders } from "gl-noise/build/glNoise.m";
import Blend from "./Blend";
import DistortUv from "./DistortUv";
import { usePlanarReflections } from "./usePlanarReflections";

export function Water(props: GroupProps) {
  const waterRef = React.useRef<THREE.Mesh>(null!);
  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);

  const depthFBO = React.useMemo(() => {
    const w = size.width * viewport.dpr;
    const h = size.height * viewport.dpr;
    const depthFBO = new THREE.WebGLRenderTarget(w, h);
    depthFBO.depthTexture = new THREE.DepthTexture(w, h);
    depthFBO.depthTexture.type = THREE.FloatType;
    depthFBO.depthTexture.minFilter = THREE.NearestFilter;
    depthFBO.depthTexture.magFilter = THREE.NearestFilter;
    depthFBO.depthTexture.generateMipmaps = false;

    depthFBO.texture.minFilter = THREE.NearestFilter;
    depthFBO.texture.magFilter = THREE.NearestFilter;
    depthFBO.texture.generateMipmaps = false;
    depthFBO.stencilBuffer = false;
    return depthFBO;
  }, []);

  const { hasReflection } = useControls({
    Reflection: folder({
      hasReflection: {
        label: "Enabled",
        value: false,
      },
    }),
  });

  const vertexShader = React.useMemo(
    () => /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vViewVector;
    varying vec3 vCameraPosition;
    varying vec4 vReflectionUv;

    varying float vWaveHeight;

    uniform float uTime;

    uniform float uWaveSteepness;
    uniform float uWaveLength;
    uniform float uWaveSpeed;
    uniform vec3 uWaveDirection;
    uniform mat4 uReflectionTextureMatrix;

    vec2 angleToDirection(float angle) {
      float angleRadians = angle * (PI / 180.0);
      return vec2(cos(angleRadians), sin(angleRadians));
    }

    vec3 displace(vec3 point) {
      float time = uTime * uWaveSpeed;

      vec2 directionA = angleToDirection(uWaveDirection.x);
      vec2 directionB = angleToDirection(uWaveDirection.y);
      vec2 directionC = angleToDirection(uWaveDirection.z);

      float steepnessA = uWaveSteepness;
      float steepnessB = uWaveSteepness * 0.5;
      float steepnessC = uWaveSteepness * 0.25;

      float wavelengthA = uWaveLength;
      float wavelengthB = uWaveLength * 0.5;
      float wavelengthC = uWaveLength * 0.25;

      gln_tGerstnerWaveOpts A = gln_tGerstnerWaveOpts(directionA, steepnessA, wavelengthA);
      gln_tGerstnerWaveOpts B = gln_tGerstnerWaveOpts(directionB, steepnessB, wavelengthB);
      gln_tGerstnerWaveOpts C = gln_tGerstnerWaveOpts(directionC, steepnessC, wavelengthC);

      vec3 n = vec3(0.0);

      gln_tFBMOpts fbmOpts = gln_tFBMOpts(1.0, 0.4, 2.3, 0.4, 1.0, 5, false, false);
      float fbm = gln_normalize(gln_pfbm((point.xy * 0.5) + (time), fbmOpts));

      n.z = fbm * 0.5;
      n += gln_GerstnerWave(point, A, time).xzy;
      // n += gln_GerstnerWave(point, B, time).xzy;
      // n += gln_GerstnerWave(point, C, time).xzy;
    

      vWaveHeight = n.z;

      return point + n;
    }  

    vec3 orthogonal(vec3 v) {
      return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
      : vec3(0.0, -v.z, v.y));
    }

    vec3 recalcNormals(vec3 newPos) {
      float offset = 0.001;
      vec3 tangent = orthogonal(normal);
      vec3 bitangent = normalize(cross(normal, tangent));
      vec3 neighbour1 = position + tangent * offset;
      vec3 neighbour2 = position + bitangent * offset;

      vec3 displacedNeighbour1 = displace(neighbour1);
      vec3 displacedNeighbour2 = displace(neighbour2);

      vec3 displacedTangent = displacedNeighbour1 - newPos;
      vec3 displacedBitangent = displacedNeighbour2 - newPos;

      return normalize(cross(displacedTangent, displacedBitangent));
    }

    void main() {
      csm_Position = displace(position);
      csm_Normal = recalcNormals(csm_Position);

      vUv = uv;
      vWorldPosition = (modelMatrix * vec4(csm_Position, 1.0)).xyz;
      vViewVector = cameraPosition - vWorldPosition;
      vCameraPosition = cameraPosition;
      vReflectionUv = uReflectionTextureMatrix * vec4(csm_Position, 1.0);
    }
  `,
    []
  );

  const fragmentShader = React.useMemo(
    () => /* glsl */ `
    uniform sampler2D uDepthTexture;
    uniform sampler2D uColorTexture;
    uniform sampler2D uReflectedTexture;
    uniform vec2 uCameraNearFar;
    uniform vec2 uResolution;
    uniform float uTime;


    // Opts
    uniform float uWaterDepth;
    uniform vec3 uWaterShallowColor;
    uniform float uWaterShallowColorAlpha;
    uniform vec3 uWaterDeepColor;
    uniform float uWaterDeepColorAlpha;
    uniform vec3 uHorizonColor;
    uniform float uHorizonDistance;
    uniform float uRefractionScale;
    uniform float uRefractionSpeed;
    uniform float uRefractionStrength;
    uniform float uFoamAngle;
    uniform float uFoamSpeed;
    uniform float uFoamTiling;
    uniform float uFoamDistortion;
    uniform sampler2D uFoamTexture;
    uniform vec3 uFoamColor;
    uniform float uFoamAlpha;
    uniform float uFoamBlend;
    uniform float uFoamIntersectionFade;
    uniform float uFoamIntersectionCutoff;
    uniform sampler2D uNormalsTexture;
    uniform float uNormalsScale;
    uniform float uNormalsSpeed;
    uniform float uNormalsStrength;
    uniform float uWaveFalloff;
    uniform vec3 uWaveCrestColor;
		uniform float uReflectionFresnelPower;
    uniform float uReflectionStrength;
    uniform float uReflectionMix;
    uniform bool uReflectionEnabled;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vViewVector;
    varying vec3 vCameraPosition;
    varying vec4 vReflectionUv;

    varying float vWaveHeight;

    float getDepth(vec2 screenPosition) {
        return texture2D( uDepthTexture, screenPosition ).x;
    }

    float getViewZ(float depth) {
        return perspectiveDepthToViewZ(depth, uCameraNearFar.x, uCameraNearFar.y);
    }

    vec3 getWorldSpaceScenePosition(vec2 uv) {
        vec3 viewVector = -vViewVector;
        float screenPositionZ = getViewZ(gl_FragCoord.z);
        float sceneDepthZ = getViewZ(getDepth(uv));

        viewVector = viewVector / screenPositionZ;
        viewVector = viewVector * sceneDepthZ;
        viewVector = viewVector + vCameraPosition;

        return viewVector;
    }

    ${HSVLerp}
    ${Fresnel}
    ${DistortUv}
    ${Blend}

    vec4 overlay(vec4 base, vec4 over, float blend) {
      float overAlpha = saturate(over.a);

      vec4 overwriteResult = Overwrite(base, over, overAlpha);
      vec4 linearDodgedResult = LinearDodge(base, over, overAlpha);

      return mix(overwriteResult, linearDodgedResult, blend);
    }

    vec2 panUV(vec2 _uv, float _tiling, float _direction, float _speed) {
      float angleRadian =  _direction * (PI / 180.0);
      vec2 direction = normalize(vec2(cos(angleRadian), sin(angleRadian)));
      float speed = uTime * _speed;
      direction *= speed;

      vec2 uv = mod((_uv * _tiling) + direction, vec2(1.0));
      return uv;
    }

    vec3 normalBlend(vec3 A, vec3 B) {
      return normalize(vec3(A.rg + B.rg, A.b * B.b));
    }

    vec3 normalStrength(vec3 inp, float Strength) {
      return vec3(inp.rg * Strength, mix(1.0, inp.b, saturate(Strength)));
    }

    vec3 tangentToWorld(vec3 normal) {
      vec3 worldNormal = normal;
      vec3 worldTangent = normalize(cross(worldNormal, vec3(0.0, 0.0, 1.0)));
      vec3 worldBitangent = normalize(cross(worldNormal, worldTangent));
     
      mat3 transposeTangent = transpose(mat3(worldTangent, worldBitangent, worldNormal));
      return transposeTangent * normal; 
    }

    float sdfCircle(vec2 uv, vec2 center, float radius) {
      return length(uv - center) - radius;
    }

    void main() {
        vec2 screenUV = gl_FragCoord.xy / uResolution;
        vec3 worldPosition = vWorldPosition;
      
        // World space Uv
        vec2 worldUv = vWorldPosition.xz;
        worldUv = -(worldUv * 0.1);
        worldUv = mod(worldUv, 1.0);

        // Refraction
        float scaleReciprocal = 1.0 / uRefractionScale;
        float time = uTime * uRefractionSpeed;

        vec2 modifiedUv = vUv * scaleReciprocal + time;
        float refractionNoise = gln_simplex(modifiedUv) * uRefractionStrength;
        vec2 distortedScreenUV = screenUV + vec2(refractionNoise, 0.0);
       
        // Water Depth

        // remove Refraction from stuff sticking out of the water but overlapping the water
        vec3 worldSpaceScenePosition = getWorldSpaceScenePosition(distortedScreenUV);
        
        float cmpWaterDepth = (worldPosition - worldSpaceScenePosition).g;
        if(cmpWaterDepth <= 0.0) {
          distortedScreenUV = screenUV;
          worldSpaceScenePosition = getWorldSpaceScenePosition(distortedScreenUV);
        }

        float shoreDepth = (worldPosition - worldSpaceScenePosition).g;
        float shore = saturate(exp(-shoreDepth / uWaterDepth));

        // Depth color
        vec4 color = HSVLerp(
          vec4(uWaterDeepColor, uWaterDeepColorAlpha),
          vec4(uWaterShallowColor, uWaterShallowColorAlpha), 
          shore
        );

        // Horizon color
        float fresnel = Fresnel(uHorizonDistance);
        color = HSVLerp(color, vec4(uHorizonColor, 1.0), fresnel);

        // Underwater color
        vec4 sceneColor = texture2D(uColorTexture, distortedScreenUV);
        float underwaterFactor = 1.0 - color.a;
        color.rgb += sceneColor.rgb * underwaterFactor;

        // Intersection foam
        float intersectionFoamDepth = saturate(exp(-shoreDepth / uFoamIntersectionFade));
        float intersectionFoamMask = intersectionFoamDepth + 0.1;

        intersectionFoamMask = smoothstep(
          1.0 - uFoamIntersectionFade, 
          1.0, 
          intersectionFoamMask
        );

        // Surface Foam
        vec2 foamUv = panUV(worldUv, uFoamTiling, uFoamAngle, uFoamSpeed);
        foamUv = DistortUv(foamUv, uFoamDistortion);
        float foamTexColor = texture2D(uFoamTexture, foamUv).r;
        // float foamTexColor = gln_normalize(gln_perlin(foamUv * 10.0));
        foamTexColor = step(intersectionFoamDepth * uFoamIntersectionCutoff, foamTexColor);

        vec4 foam = vec4(uFoamColor * smoothstep(0.2, 0.3, foamTexColor), uFoamAlpha);
        foam.a *= intersectionFoamMask;

        color = overlay(color, foam, uFoamBlend);

        // Wave height colors
        float waveHeight = smoothstep(
          1.0 - (uWaveFalloff * 2.0), 
          1.0, 
          vWaveHeight
        );

        color.rgb = mix(color.rgb, uWaveCrestColor, waveHeight);

        // Normals
        float normalScaleA = 1.0 / (uNormalsScale * 0.5);
        vec2 normalUvA = panUV(worldUv, normalScaleA, 1.0, uNormalsSpeed * -0.5);
        vec3 normalsA = texture2D(uNormalsTexture, normalUvA).rgb;

        float normalScaleB = 1.0 / uNormalsScale;
        vec2 normalUvB = panUV(worldUv, normalScaleB, 1.0, uNormalsSpeed);
        vec3 normalsB = texture2D(uNormalsTexture, normalUvB).rgb;

        vec3 normals = normalBlend(normalsA, normalsB);
        normals = normalStrength(normals, uNormalsStrength);
        // normals = tangentToWorld(normals);

        if(uReflectionEnabled) {
          // Reflections
          vec4 distortedReflectionUv = vReflectionUv + vec4(normals, 1.0);
          vec4 reflected = texture2DProj(uReflectedTexture, distortedReflectionUv);

          float reflectionFresnel = Fresnel(uReflectionFresnelPower);
          reflectionFresnel *= uReflectionStrength;

          vec4 finalReflectionColor = mix(vec4(0.0), reflected, reflectionFresnel);

          color = overlay(color, finalReflectionColor, uReflectionMix);
        }
        
        

        float circle = sdfCircle(vUv, vec2(0.5), 0.2);
        circle = 1. - abs(circle);
        circle = smoothstep(0.75, 0.8, circle);


        csm_DiffuseColor = vec4(color.rgb, circle);
        vec3 csm_FragNormal = normalize(normals);

        // Debug
        // csm_FragColor = vec4(vec3(sceneColor.rgb), 1.0);
    }
  `,
    []
  );

  const [foamTexture, normalsTexture] = useTexture([
    "/foam.png",
    "/normal.jpg",
  ]);

  const planarReflections = usePlanarReflections(waterRef, hasReflection);

  const uniforms = React.useMemo(
    () => ({
      uDepthTexture: { value: depthFBO.depthTexture },
      uColorTexture: { value: depthFBO.texture },
      uCameraNearFar: { value: new THREE.Vector2() },
      uResolution: { value: new THREE.Vector2() },
      uTime: { value: 0 },

      // Opts
      uWaterDepth: { value: 3.0 },
      uWaterShallowColor: { value: new THREE.Color("#ff0000") },
      uWaterShallowColorAlpha: { value: 1 },
      uWaterDeepColor: { value: new THREE.Color("#00ff00") },
      uWaterDeepColorAlpha: { value: 1 },

      uHorizonColor: { value: new THREE.Color("#0000ff") },
      uHorizonDistance: { value: 1.0 },

      uRefractionScale: { value: 0.02 },
      uRefractionSpeed: { value: 0.01 },
      uRefractionStrength: { value: 0.01 },

      uFoamAngle: { value: 0 },
      uFoamSpeed: { value: 1 },
      uFoamTiling: { value: 1 },
      uFoamDistortion: { value: 1 },
      uFoamTexture: { value: foamTexture },
      uFoamColor: { value: new THREE.Color("#ffffff") },
      uFoamAlpha: { value: 1 },
      uFoamBlend: { value: 1 },
      uFoamIntersectionFade: { value: 1 },
      uFoamIntersectionCutoff: { value: 1 },

      uNormalsTexture: { value: normalsTexture },
      uNormalsScale: { value: 1 },
      uNormalsSpeed: { value: 1 },
      uNormalsStrength: { value: 1 },

      uWaveSteepness: { value: 0.8 },
      uWaveLength: { value: 0.8 },
      uWaveSpeed: { value: 0.8 },
      uWaveDirection: { value: new THREE.Vector3() },
      uWaveFalloff: { value: 0.8 },
      uWaveCrestColor: { value: new THREE.Color("#ffffff") },

      ...planarReflections.uniforms,
      uReflectionFresnelPower: { value: 0.7 },
      uReflectionStrength: { value: 1.0 },
      uReflectionMix: { value: 1.0 },
    }),
    []
  );

  useWaterControls(uniforms);

  useFrame((state) => {
    const { scene, gl, camera, size, viewport, clock } = state;

    // Update uniforms'
    uniforms.uCameraNearFar.value.x = camera.near;
    uniforms.uCameraNearFar.value.y = camera.far;
    uniforms.uResolution.value.x = size.width * viewport.dpr;
    uniforms.uResolution.value.y = size.height * viewport.dpr;

    uniforms.uTime.value = clock.getElapsedTime();

    // Render depth
    waterRef.current.visible = false;
    // scene.overrideMaterial = depthMaterial;

    gl.setRenderTarget(depthFBO);
    gl.clear();

    gl.render(scene, camera);
    gl.setRenderTarget(null);

    planarReflections.render(state);

    // scene.overrideMaterial = null;
    waterRef.current.visible = true;
  });

  return (
    <group {...props}>
      <mesh
        receiveShadow
        position-y={2.2}
        rotation-x={-Math.PI / 2}
        ref={waterRef}
      >
        <planeGeometry args={[100, 100, 128, 128]} />
        <CSM
          baseMaterial={THREE.MeshStandardMaterial}
          key={vertexShader + fragmentShader} //
          uniforms={uniforms}
          vertexShader={patchShaders(vertexShader)}
          fragmentShader={patchShaders(fragmentShader)}
          patchMap={{
            csm_FragNormal: {
              "#include <normal_fragment_maps>": /* glsl */ `
              normal = csm_FragNormal;
            `,
            },
          }}
          transparent
          roughness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

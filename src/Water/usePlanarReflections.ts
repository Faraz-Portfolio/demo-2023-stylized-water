import * as THREE from "three";
import * as React from "react";
import { RootState, useThree } from "@react-three/fiber";

const resolution = 512,
  reflectorOffset = 0;

export function usePlanarReflections(
  waterRef: React.MutableRefObject<THREE.Mesh>,
  hasReflection: boolean
) {
  const gl = useThree(({ gl }) => gl);
  const camera = useThree(({ camera }) => camera);
  const [reflectorPlane] = React.useState(() => new THREE.Plane());
  const [normal] = React.useState(() => new THREE.Vector3());
  const [reflectorWorldPosition] = React.useState(() => new THREE.Vector3());
  const [cameraWorldPosition] = React.useState(() => new THREE.Vector3());
  const [rotationMatrix] = React.useState(() => new THREE.Matrix4());
  const [lookAtPosition] = React.useState(() => new THREE.Vector3(0, 0, -1));
  const [clipPlane] = React.useState(() => new THREE.Vector4());
  const [view] = React.useState(() => new THREE.Vector3());
  const [target] = React.useState(() => new THREE.Vector3());
  const [q] = React.useState(() => new THREE.Vector4());
  const [textureMatrix] = React.useState(() => new THREE.Matrix4());
  const [virtualCamera] = React.useState(() => new THREE.PerspectiveCamera());

  const beforeRender = React.useCallback(() => {
    // TODO: As of R3f 7-8 this should be __r3f.parent
    const parent = waterRef.current;
    if (!parent) return;

    reflectorWorldPosition.setFromMatrixPosition(parent.matrixWorld);
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
    rotationMatrix.extractRotation(parent.matrixWorld);
    normal.set(0, 0, 1);
    normal.applyMatrix4(rotationMatrix);
    reflectorWorldPosition.addScaledVector(normal, reflectorOffset);
    view.subVectors(reflectorWorldPosition, cameraWorldPosition);
    // Avoid rendering when reflector is facing away
    if (view.dot(normal) > 0) return;
    view.reflect(normal).negate();
    view.add(reflectorWorldPosition);
    rotationMatrix.extractRotation(camera.matrixWorld);
    lookAtPosition.set(0, 0, -1);
    lookAtPosition.applyMatrix4(rotationMatrix);
    lookAtPosition.add(cameraWorldPosition);
    target.subVectors(reflectorWorldPosition, lookAtPosition);
    target.reflect(normal).negate();
    target.add(reflectorWorldPosition);
    virtualCamera.position.copy(view);
    virtualCamera.up.set(0, 1, 0);
    virtualCamera.up.applyMatrix4(rotationMatrix);
    virtualCamera.up.reflect(normal);
    virtualCamera.lookAt(target);
    virtualCamera.far = camera.far; // Used in WebGLBackground
    virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
    // Update the texture matrix
    textureMatrix.set(
      0.5,
      0.0,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.0,
      0.5,
      0.5,
      0.0,
      0.0,
      0.0,
      1.0
    );
    textureMatrix.multiply(virtualCamera.projectionMatrix);
    textureMatrix.multiply(virtualCamera.matrixWorldInverse);
    textureMatrix.multiply(parent.matrixWorld);
    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    reflectorPlane.setFromNormalAndCoplanarPoint(
      normal,
      reflectorWorldPosition
    );
    reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);
    clipPlane.set(
      reflectorPlane.normal.x,
      reflectorPlane.normal.y,
      reflectorPlane.normal.z,
      reflectorPlane.constant
    );
    const projectionMatrix = virtualCamera.projectionMatrix;
    q.x =
      (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) /
      projectionMatrix.elements[0];
    q.y =
      (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) /
      projectionMatrix.elements[5];
    q.z = -1.0;
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
    // Calculate the scaled plane vector
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = clipPlane.x;
    projectionMatrix.elements[6] = clipPlane.y;
    projectionMatrix.elements[10] = clipPlane.z + 1.0;
    projectionMatrix.elements[14] = clipPlane.w;
  }, [camera, reflectorOffset]);

  const fbo1 = React.useMemo(() => {
    const parameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
    };
    const fbo1 = new THREE.WebGLRenderTarget(
      resolution,
      resolution,
      parameters
    );
    fbo1.depthBuffer = true;
    fbo1.depthTexture = new THREE.DepthTexture(resolution, resolution);
    fbo1.depthTexture.format = THREE.DepthFormat;
    fbo1.depthTexture.type = THREE.UnsignedShortType;
    return fbo1;
  }, [gl, textureMatrix, resolution]);

  const uniforms = React.useMemo(
    () => ({
      uReflectionEnabled: { value: hasReflection },
      uReflectedTexture: { value: fbo1.texture },
      uReflectionTextureMatrix: { value: textureMatrix },
    }),
    []
  );

  React.useEffect(
    () => void (uniforms.uReflectionEnabled.value = hasReflection),
    [hasReflection]
  );

  return {
    uniforms,
    render: ({ gl, camera, scene }: RootState) => {
      const parent = waterRef.current;
      if (!parent || !hasReflection) return;

      parent.visible = false;
      const currentXrEnabled = gl.xr.enabled;
      const currentShadowAutoUpdate = gl.shadowMap.autoUpdate;
      beforeRender();
      gl.xr.enabled = false;
      gl.shadowMap.autoUpdate = false;
      gl.setRenderTarget(fbo1);
      gl.state.buffers.depth.setMask(true);
      if (!gl.autoClear) gl.clear();
      gl.render(scene, virtualCamera);
      gl.xr.enabled = currentXrEnabled;
      gl.shadowMap.autoUpdate = currentShadowAutoUpdate;
      parent.visible = true;
      gl.setRenderTarget(null);
    },
  };
}

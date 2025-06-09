import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  TransformControls,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  Autofocus,
  EffectComposer,
  N8AO,
  Vignette,
} from "@react-three/postprocessing";
import { Leva, useControls } from "leva";
import { Creds } from "./Creds";
import { Model } from "./PirateIsland";
import "./styles.css";
import { Water } from "./Water";

function Lights() {
  return (
    <>
      <Environment
        files={"/demo-2023-stylized-water/animestyled_hdr.hdr"}
        background
      />
      <hemisphereLight intensity={0.5} color="white" groundColor="#f88" />
      <directionalLight
        color="orange"
        intensity={2}
        // @ts-ignore
        angle={0.3}
        penumbra={1}
        position={[-30, 20, -30]}
        castShadow
        shadow-mapSize={1024}
        shadow-bias={-0.0004}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-40, 40, 40, -40, 1, 1000]}
        />
      </directionalLight>
    </>
  );
}

export default function App() {
  const { blur, AO, PostProcessing } = useControls({
    PostProcessing: {
      value: false,
    },
    blur: {
      value: false,
    },
    AO: {
      value: false,
    },
  });

  return (
    <>
      <Canvas shadows>
        <PerspectiveCamera position={[30, 30, 30]} fov={40} makeDefault />
        <OrbitControls makeDefault />

        <Model />
        <Lights />

        <TransformControls>
          <Water />
        </TransformControls>

        {PostProcessing && (
          <EffectComposer>
            <Vignette offset={0.4} darkness={0.4} />
            {AO && <N8AO aoRadius={20} intensity={8} screenSpaceRadius />}
            {blur && <Autofocus bokehScale={8} focusRange={0.01} />}
          </EffectComposer>
        )}
      </Canvas>
      <Leva collapsed />
      <Creds />
    </>
  );
}

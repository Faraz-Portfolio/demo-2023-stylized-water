import { folder, useControls } from "leva";

export function useWaterControls(uniforms: {
  [key: string]: {
    value: any;
  };
}) {
  useControls({
    Water: folder({
      uWaterDepth: {
        label: "Depth",
        value: 0.4,
        min: 0.0,
        max: 10.0,
        step: 0.1,
        onChange: (value: number) => {
          uniforms.uWaterDepth.value = value;
        },
      },
      Colors: folder({
        Shallow: folder({
          uWaterShallowColor: {
            label: "Color",
            value: "#56aacb",
            onChange: (value: string) => {
              uniforms.uWaterShallowColor.value.set(value);
            },
          },
          uWaterShallowColorAlpha: {
            label: "Alpha",
            value: 0.38,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            onChange: (value: number) => {
              uniforms.uWaterShallowColorAlpha.value = value;
            },
          },
        }),
        Deep: folder({
          uWaterDeepColor: {
            label: "Color",
            value: "#00252e",
            onChange: (value: string) => {
              uniforms.uWaterDeepColor.value.set(value);
            },
          },
          uWaterDeepColorAlpha: {
            label: "Alpha",
            value: 0.94,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            onChange: (value: number) => {
              uniforms.uWaterDeepColorAlpha.value = value;
            },
          },
        }),
      }),
    }),

    Horizon: folder({
      uHorizonDistance: {
        label: "Distance",
        value: 6,
        min: 0.0,
        max: 10,
        step: 1.0,
        onChange: (value: number) => {
          uniforms.uHorizonDistance.value = value;
        },
      },
      uHorizonColor: {
        label: "Color",
        value: "#abeaff",
        onChange: (value: string) => {
          uniforms.uHorizonColor.value.set(value);
        },
      },
    }),

    Refraction: folder({
      uRefractionScale: {
        label: "Scale",
        value: 0.02,
        min: 0.0,
        max: 5.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uRefractionScale.value = value;
        },
      },
      uRefractionSpeed: {
        label: "Speed",
        value: 0.34,
        min: 0.0,
        max: 5.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uRefractionSpeed.value = value;
        },
      },
      uRefractionStrength: {
        label: "Strength",
        value: 0.01,
        min: 0.0,
        max: 5.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uRefractionStrength.value = value;
        },
      },
    }),

    Reflection: folder({
      uReflectionFresnelPower: {
        label: "Distance",
        value: 3.59,
        min: 0.0,
        max: 10.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uReflectionFresnelPower.value = value;
        },
      },
      uReflectionStrength: {
        label: "Strength",
        value: 2.06,
        min: 0.0,
        max: 10.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uReflectionStrength.value = value;
        },
      },
      uReflectionMix: {
        label: "Blend",
        value: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uReflectionMix.value = value;
        },
      },
    }),

    Foam: folder({
      Color: folder({
        uFoamColor: {
          label: "Color",
          value: "#c1e6ff",
          onChange: (value: string) => {
            uniforms.uFoamColor.value.set(value);
          },
        },
        uFoamAlpha: {
          label: "Alpha",
          value: 0.11,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          onChange: (value: number) => {
            uniforms.uFoamAlpha.value = value;
          },
        },
        uFoamBlend: {
          label: "Blend",
          value: 0.63,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          onChange: (value: number) => {
            uniforms.uFoamBlend.value = value;
          },
        },
      }),

      Rendering: folder({
        uFoamAngle: {
          label: "Direction",
          value: 445,
          min: 0.0,
          max: 360,
          step: 0.01,
          onChange: (value: number) => {
            uniforms.uFoamAngle.value = value;
          },
        },
        uFoamSpeed: {
          label: "Speed",
          value: 0.1,
          min: 0.0,
          max: 5.0,
          step: 0.01,
          onChange: (value: number) => {
            uniforms.uFoamSpeed.value = value;
          },
        },
        uFoamTiling: {
          label: "Scale",
          value: 4.63,
          min: 0.0,
          max: 5.0,
          step: 0.01,
          onChange: (value: number) => {
            uniforms.uFoamTiling.value = value;
          },
        },
        uFoamDistortion: {
          label: "Distortion",
          value: 1.41,
          min: 0.0,
          max: 5.0,
          step: 0.01,
          onChange: (value: number) => {
            uniforms.uFoamDistortion.value = value;
          },
        },
      }),

      Intersection: folder({
        uFoamIntersectionFade: {
          label: "Fade",
          value: 0.75,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          onChange: (value: number) => {
            uniforms.uFoamIntersectionFade.value = value;
          },
        },
        uFoamIntersectionCutoff: {
          label: "Cutoff",
          value: 0.29,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          onChange: (value: number) => {
            uniforms.uFoamIntersectionCutoff.value = value;
          },
        },
      }),
    }),

    Normals: folder({
      uNormalsScale: {
        label: "Scale",
        value: 0.63,
        min: 0.0,
        max: 5.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uNormalsScale.value = value;
        },
      },
      uNormalsSpeed: {
        label: "Speed",
        value: 0.1,
        min: 0.0,
        max: 5.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uNormalsSpeed.value = value;
        },
      },
      uNormalsStrength: {
        label: "Strength",
        value: 1.05,
        min: 0.0,
        max: 5.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uNormalsStrength.value = value;
        },
      },
    }),

    Waves: folder({
      uWaveCrestColor: {
        label: "Crest Color",
        value: "#10667c",
        onChange: (value: string) => {
          uniforms.uWaveCrestColor.value.set(value);
        },
      },
      uWaveFalloff: {
        label: "Crest Blend",
        value: 0.43,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uWaveFalloff.value = value;
        },
      },
      uWaveSteepness: {
        label: "Steepness",
        value: 0.25,
        min: 0.0,
        max: 5.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uWaveSteepness.value = value;
        },
      },
      uWaveLength: {
        label: "Wavelength",
        value: 4.06,
        min: 0.0,
        max: 5.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uWaveLength.value = value;
        },
      },
      uWaveSpeed: {
        label: "Speed",
        value: 0.12,
        min: 0.0,
        max: 5.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uWaveSpeed.value = value;
        },
      },
      uWaveDirection: {
        label: "Directions (deg)",
        value: [10.0, 20, 30],
        min: 0.0,
        max: 360.0,
        step: 0.01,
        onChange: (value: number) => {
          uniforms.uWaveDirection.value.x = value[0];
          uniforms.uWaveDirection.value.y = value[1];
          uniforms.uWaveDirection.value.z = value[2];
        },
      },
    }),
  });
}

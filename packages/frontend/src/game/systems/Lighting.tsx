import type { BackgroundTheme } from "@super-mel/shared";

interface LightConfig {
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
}

const LIGHT_CONFIGS: Record<BackgroundTheme, LightConfig> = {
  forest: {
    ambientIntensity: 0.4,
    hemiSky: "#87ceeb",
    hemiGround: "#3a5a2a",
    hemiIntensity: 0.5,
    sunColor: "#ffffff",
    sunIntensity: 1.0,
    sunPosition: [50, 50, 30],
  },
  desert: {
    ambientIntensity: 0.5,
    hemiSky: "#f4e4a0",
    hemiGround: "#8a6a30",
    hemiIntensity: 0.6,
    sunColor: "#ffe8a0",
    sunIntensity: 1.3,
    sunPosition: [40, 60, 25],
  },
  night: {
    ambientIntensity: 0.15,
    hemiSky: "#1a1a4e",
    hemiGround: "#0a0a1e",
    hemiIntensity: 0.2,
    sunColor: "#8888cc",
    sunIntensity: 0.3,
    sunPosition: [30, 40, 30],
  },
  space: {
    ambientIntensity: 0.1,
    hemiSky: "#110033",
    hemiGround: "#050010",
    hemiIntensity: 0.15,
    sunColor: "#aaaaff",
    sunIntensity: 0.4,
    sunPosition: [60, 30, 20],
  },
  ocean: {
    ambientIntensity: 0.35,
    hemiSky: "#4a90d9",
    hemiGround: "#1a3a5a",
    hemiIntensity: 0.45,
    sunColor: "#e0e8ff",
    sunIntensity: 0.9,
    sunPosition: [45, 55, 35],
  },
};

export function Lighting({ theme = "forest" }: { theme?: BackgroundTheme }) {
  const cfg = LIGHT_CONFIGS[theme];

  return (
    <>
      <ambientLight intensity={cfg.ambientIntensity} />
      <hemisphereLight args={[cfg.hemiSky, cfg.hemiGround, cfg.hemiIntensity]} />
      <directionalLight
        color={cfg.sunColor}
        position={cfg.sunPosition}
        intensity={cfg.sunIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
  );
}

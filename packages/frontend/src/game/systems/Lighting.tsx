import * as THREE from "three";
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

// ---------------------------------------------------------------------------
// Lerp helpers
// ---------------------------------------------------------------------------

const _ca = new THREE.Color();
const _cb = new THREE.Color();

function lerpColor(a: string, b: string, t: number): string {
  _ca.set(a);
  _cb.set(b);
  _ca.lerp(_cb, t);
  return "#" + _ca.getHexString();
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerpNum(a[0], b[0], t), lerpNum(a[1], b[1], t), lerpNum(a[2], b[2], t)];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LightingProps {
  theme?: BackgroundTheme;
  nextTheme?: BackgroundTheme | null;
  transitionFactor?: number;
}

export function Lighting({ theme = "forest", nextTheme, transitionFactor = 0 }: LightingProps) {
  const cfgA = LIGHT_CONFIGS[theme];
  const transitioning = nextTheme != null && transitionFactor > 0;
  const cfgB = transitioning ? LIGHT_CONFIGS[nextTheme!] : cfgA;
  const t = transitioning ? transitionFactor : 0;

  const ambientIntensity = transitioning ? lerpNum(cfgA.ambientIntensity, cfgB.ambientIntensity, t) : cfgA.ambientIntensity;
  const hemiSky = transitioning ? lerpColor(cfgA.hemiSky, cfgB.hemiSky, t) : cfgA.hemiSky;
  const hemiGround = transitioning ? lerpColor(cfgA.hemiGround, cfgB.hemiGround, t) : cfgA.hemiGround;
  const hemiIntensity = transitioning ? lerpNum(cfgA.hemiIntensity, cfgB.hemiIntensity, t) : cfgA.hemiIntensity;
  const sunColor = transitioning ? lerpColor(cfgA.sunColor, cfgB.sunColor, t) : cfgA.sunColor;
  const sunIntensity = transitioning ? lerpNum(cfgA.sunIntensity, cfgB.sunIntensity, t) : cfgA.sunIntensity;
  const sunPosition = transitioning ? lerpVec3(cfgA.sunPosition, cfgB.sunPosition, t) : cfgA.sunPosition;

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <hemisphereLight args={[hemiSky, hemiGround, hemiIntensity]} />
      <directionalLight
        color={sunColor}
        position={sunPosition}
        intensity={sunIntensity}
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

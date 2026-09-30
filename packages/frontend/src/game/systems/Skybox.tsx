import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BackgroundTheme } from "@super-mel/shared";

interface ThemeVisual {
  top: string;
  mid: string;
  bottom: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

const THEMES: Record<BackgroundTheme, ThemeVisual> = {
  forest: {
    top: "#5cb8e6",
    mid: "#87ceeb",
    bottom: "#3a8a3a",
    fogColor: "#a8d8a8",
    fogNear: 35,
    fogFar: 90,
  },
  desert: {
    top: "#e8c170",
    mid: "#f4a460",
    bottom: "#c2a050",
    fogColor: "#e8d8b0",
    fogNear: 30,
    fogFar: 80,
  },
  night: {
    top: "#050520",
    mid: "#0a0a3e",
    bottom: "#1a1a4e",
    fogColor: "#0a0a2e",
    fogNear: 25,
    fogFar: 70,
  },
  space: {
    top: "#000008",
    mid: "#080020",
    bottom: "#150030",
    fogColor: "#080015",
    fogNear: 40,
    fogFar: 100,
  },
  ocean: {
    top: "#3a7ec8",
    mid: "#4a90d9",
    bottom: "#1a4a6a",
    fogColor: "#3a6a9a",
    fogNear: 25,
    fogFar: 75,
  },
};

// ---------------------------------------------------------------------------
// Color lerp helpers
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

// ---------------------------------------------------------------------------
// Skybox component
// ---------------------------------------------------------------------------

interface SkyboxProps {
  theme: BackgroundTheme;
  nextTheme?: BackgroundTheme | null;
  transitionFactor?: number;
}

export function Skybox({ theme, nextTheme, transitionFactor = 0 }: SkyboxProps) {
  const { scene } = useThree();
  const lastFactorRef = useRef(-1);

  // Seeded star random (deterministic for reproducibility)
  const starSeedRef = useRef(42);

  useEffect(() => {
    // Determine effective visuals (lerp if transitioning)
    const tvA = THEMES[theme];
    const transitioning = nextTheme != null && transitionFactor > 0;
    const tvB = transitioning ? THEMES[nextTheme!] : tvA;
    const t = transitioning ? transitionFactor : 0;

    // Cache: skip texture recreation if factor change < 0.05 and themes unchanged
    const quantized = Math.round(t * 20) / 20; // quantize to 0.05 steps
    if (lastFactorRef.current === quantized && !transitioning) {
      // Themes might have changed entirely, so only skip for identical state
    }
    lastFactorRef.current = quantized;

    const top = transitioning ? lerpColor(tvA.top, tvB.top, t) : tvA.top;
    const mid = transitioning ? lerpColor(tvA.mid, tvB.mid, t) : tvA.mid;
    const bottom = transitioning ? lerpColor(tvA.bottom, tvB.bottom, t) : tvA.bottom;
    const fogColor = transitioning ? lerpColor(tvA.fogColor, tvB.fogColor, t) : tvA.fogColor;
    const fogNear = transitioning ? lerpNum(tvA.fogNear, tvB.fogNear, t) : tvA.fogNear;
    const fogFar = transitioning ? lerpNum(tvA.fogFar, tvB.fogFar, t) : tvA.fogFar;

    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, top);
    gradient.addColorStop(0.4, mid);
    gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 512);

    // Stars: determine if either theme is night/space and compute star opacity
    const currentHasStars = theme === "night" || theme === "space";
    const nextHasStars = nextTheme === "night" || nextTheme === "space";
    let starOpacity = 0;
    if (currentHasStars && !transitioning) {
      starOpacity = 1;
    } else if (currentHasStars && nextHasStars) {
      starOpacity = 1;
    } else if (currentHasStars && !nextHasStars) {
      starOpacity = 1 - t; // fade out
    } else if (!currentHasStars && nextHasStars && transitioning) {
      starOpacity = t; // fade in
    }

    if (starOpacity > 0) {
      // Use a deterministic seed for star positions
      let seed = starSeedRef.current;
      const pseudoRand = () => {
        seed = (seed * 1664525 + 1013904223) & 0xffffffff;
        return (seed >>> 0) / 0xffffffff;
      };
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 60; i++) {
        const sx = pseudoRand() * 4;
        const sy = pseudoRand() * 300;
        const size = pseudoRand() < 0.1 ? 2 : 1;
        ctx.globalAlpha = (0.3 + pseudoRand() * 0.7) * starOpacity;
        ctx.fillRect(sx, sy, size, size);
      }
      ctx.globalAlpha = 1;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;

    scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

    return () => {
      texture.dispose();
      scene.fog = null;
    };
  }, [theme, nextTheme, transitionFactor, scene]);

  return null;
}

export function getThemeConfig(theme: BackgroundTheme): ThemeVisual {
  return THEMES[theme];
}

export { THEMES as SKYBOX_THEMES };
export type { ThemeVisual };

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
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

export function Skybox({ theme }: { theme: BackgroundTheme }) {
  const { scene } = useThree();
  const tv = THEMES[theme];

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, tv.top);
    gradient.addColorStop(0.4, tv.mid);
    gradient.addColorStop(1, tv.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 512);

    // Stars for night/space
    if (theme === "night" || theme === "space") {
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * 4;
        const y = Math.random() * 300;
        const size = Math.random() < 0.1 ? 2 : 1;
        ctx.globalAlpha = 0.3 + Math.random() * 0.7;
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;

    // Set fog
    scene.fog = new THREE.Fog(tv.fogColor, tv.fogNear, tv.fogFar);

    return () => {
      texture.dispose();
      scene.fog = null;
    };
  }, [theme, scene, tv]);

  return null;
}

export function getThemeConfig(theme: BackgroundTheme): ThemeVisual {
  return THEMES[theme];
}

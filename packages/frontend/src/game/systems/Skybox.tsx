import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import type { BackgroundTheme } from "@super-mel/shared";

const THEME_COLORS: Record<BackgroundTheme, [top: string, bottom: string]> = {
  forest: ["#87ceeb", "#228b22"],
  desert: ["#f4a460", "#deb887"],
  night: ["#0a0a2e", "#1a1a4e"],
  space: ["#000011", "#110022"],
  ocean: ["#4a90d9", "#1a5276"],
};

export function Skybox({ theme }: { theme: BackgroundTheme }) {
  const { scene } = useThree();

  useEffect(() => {
    const [top, bottom] = THEME_COLORS[theme];
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;

    return () => {
      texture.dispose();
    };
  }, [theme, scene]);

  return null;
}

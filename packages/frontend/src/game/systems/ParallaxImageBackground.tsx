import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { BackgroundTheme } from "@super-mel/shared";

const PARALLAX_FACTOR = 0.002;
const PLANE_WIDTH = 200;
const PLANE_HEIGHT = 40;
const PLANE_Z = -35;
const PLANE_Y = 5;
const REPEAT_X = 4;

const IMAGE_URLS = ["/backgrounds/montanhas.jpg", "/backgrounds/deserto.jpg"] as const;

const THEME_IMAGE_INDEX: Record<BackgroundTheme, number> = {
  forest: 0,
  desert: 1,
  night: 0,
  space: 1,
  ocean: 0,
};

interface ParallaxImageBackgroundProps {
  theme: BackgroundTheme;
  playerXRef: React.RefObject<{ x: number; y: number }>;
  nextTheme?: BackgroundTheme | null;
  transitionFactor?: number;
}

export function ParallaxImageBackground({
  theme,
  playerXRef,
  nextTheme,
  transitionFactor = 0,
}: ParallaxImageBackgroundProps) {
  const currentIdx = THEME_IMAGE_INDEX[theme];
  const nextIdx = nextTheme ? THEME_IMAGE_INDEX[nextTheme] : currentIdx;
  const transitioning = transitionFactor > 0 && nextIdx !== currentIdx;

  // Preload ALL images eagerly so biome transitions never trigger Suspense
  const allTextures = useLoader(THREE.TextureLoader, IMAGE_URLS as unknown as string[]);
  const currentTexture = allTextures[currentIdx];
  const nextTexture = allTextures[nextIdx];

  const groupRef = useRef<THREE.Group>(null);
  const currentMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const nextMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Configure textures once
  useMemo(() => {
    for (const tex of allTextures) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(REPEAT_X, 1);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
    }
  }, [allTextures]);

  useFrame(() => {
    const px = playerXRef.current?.x ?? 0;
    const offset = px * PARALLAX_FACTOR;

    if (groupRef.current) {
      groupRef.current.position.x = px;
    }

    if (currentMatRef.current) {
      currentMatRef.current.map!.offset.x = offset;
      currentMatRef.current.opacity = transitioning ? 1 - transitionFactor : 1;
    }
    if (nextMatRef.current && transitioning) {
      nextMatRef.current.map!.offset.x = offset;
      nextMatRef.current.opacity = transitionFactor;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, PLANE_Y, PLANE_Z]}>
        <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
        <meshBasicMaterial
          ref={currentMatRef}
          map={currentTexture}
          transparent={transitioning}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {transitioning && (
        <mesh position={[0, PLANE_Y, PLANE_Z - 0.1]}>
          <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
          <meshBasicMaterial
            ref={nextMatRef}
            map={nextTexture}
            transparent
            opacity={transitionFactor}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      )}
    </group>
  );
}

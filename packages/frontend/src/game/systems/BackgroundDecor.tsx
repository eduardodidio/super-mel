import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BackgroundTheme } from "@super-mel/shared";

interface BackgroundDecorProps {
  theme: BackgroundTheme;
  playerXRef: React.RefObject<{ x: number; y: number }>;
  nextTheme?: BackgroundTheme | null;
  transitionFactor?: number;
}

interface CloudData {
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  speed: number;
}

interface MountainData {
  x: number;
  height: number;
  width: number;
  z: number;
  color: string;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const THEME_DECOR: Record<BackgroundTheme, {
  cloudColor: string;
  cloudCount: number;
  mountainColor: string;
  mountainDarkColor: string;
  hasMountains: boolean;
}> = {
  forest: { cloudColor: "#ffffff", cloudCount: 12, mountainColor: "#2a6a2a", mountainDarkColor: "#1a4a1a", hasMountains: true },
  desert: { cloudColor: "#e8d8b0", cloudCount: 4, mountainColor: "#b8963c", mountainDarkColor: "#8a6a28", hasMountains: true },
  night: { cloudColor: "#2a2a5e", cloudCount: 6, mountainColor: "#1a1a3e", mountainDarkColor: "#0a0a2e", hasMountains: true },
  space: { cloudColor: "#220044", cloudCount: 3, mountainColor: "#150030", mountainDarkColor: "#0a0018", hasMountains: false },
  ocean: { cloudColor: "#c8d8f0", cloudCount: 10, mountainColor: "#1a4a6a", mountainDarkColor: "#0a3050", hasMountains: true },
};

export function BackgroundDecor({ theme, playerXRef, nextTheme, transitionFactor = 0 }: BackgroundDecorProps) {
  const cloudsRef = useRef<THREE.Group>(null);
  const decor = THEME_DECOR[theme];
  const transitioning = nextTheme != null && transitionFactor > 0;
  const nextDecor = transitioning ? THEME_DECOR[nextTheme!] : decor;

  const clouds = useMemo<CloudData[]>(() => {
    const rand = seededRandom(42);
    return Array.from({ length: decor.cloudCount }, () => ({
      x: (rand() - 0.5) * 120,
      y: 8 + rand() * 12,
      z: -12 - rand() * 15,
      scaleX: 1.5 + rand() * 3,
      scaleY: 0.6 + rand() * 0.8,
      speed: 0.1 + rand() * 0.3,
    }));
  }, [decor.cloudCount]);

  const mountains = useMemo<MountainData[]>(() => {
    if (!decor.hasMountains) return [];
    const rand = seededRandom(99);
    return Array.from({ length: 8 }, (_, i) => ({
      x: i * 20 - 40,
      height: 4 + rand() * 8,
      width: 6 + rand() * 8,
      z: -18 - rand() * 8,
      color: rand() < 0.5 ? decor.mountainColor : decor.mountainDarkColor,
    }));
  }, [decor]);

  const mountainsRef = useRef<THREE.Group>(null);
  const starsGroupRef = useRef<THREE.Group>(null);

  // Star data for night/space themes (must be defined before useFrame that references it)
  const starsData = useMemo(() => {
    if (theme !== "night" && theme !== "space") return [];
    const rand = seededRandom(777);
    return Array.from({ length: 40 }, () => ({
      x: (rand() - 0.5) * 100,
      y: 10 + rand() * 20,
      z: -20 - rand() * 10,
      size: 0.05 + rand() * 0.1,
      twinkleSpeed: 2 + rand() * 4,
    }));
  }, [theme]);

  // Compute lerped colors for transitions
  const _lerpColor = new THREE.Color();
  const _targetColor = new THREE.Color();

  // Move clouds slowly + update parallax positions each frame from ref
  useFrame((_, delta) => {
    const playerX = playerXRef.current?.x ?? 0;
    const t = transitioning ? transitionFactor : 0;

    if (cloudsRef.current) {
      // Compute blended cloud color
      if (transitioning) {
        _lerpColor.set(decor.cloudColor);
        _targetColor.set(nextDecor.cloudColor);
        _lerpColor.lerp(_targetColor, t);
      }

      cloudsRef.current.children.forEach((child, i) => {
        const c = clouds[i];
        child.position.x += c.speed * delta;
        // Wrap clouds around player
        const relX = child.position.x - playerX;
        if (relX > 70) child.position.x -= 140;
        if (relX < -70) child.position.x += 140;

        // Update cloud material colors during transitions
        if (transitioning) {
          const group = child as THREE.Group;
          group.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
              mat.color.copy(_lerpColor);
            }
          });
        }
      });
    }

    // Update mountain parallax + transition opacity/color
    if (mountainsRef.current) {
      // Compute mountain opacity for cross-fade
      const mountainOpacity = transitioning
        ? (decor.hasMountains && !nextDecor.hasMountains ? 1 - t
          : !decor.hasMountains && nextDecor.hasMountains ? t
          : 1)
        : 1;

      mountainsRef.current.children.forEach((child, i) => {
        const m = mountains[i];
        if (m) {
          child.position.x = m.x + playerX * 0.05;
        }

        if (transitioning) {
          const group = child as THREE.Group;
          group.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mountainOpacity < 1) {
                mat.transparent = true;
                mat.opacity = mountainOpacity;
              }
              if (m && decor.hasMountains && nextDecor.hasMountains) {
                _lerpColor.set(decor.mountainColor);
                _targetColor.set(nextDecor.mountainColor);
                _lerpColor.lerp(_targetColor, t);
                mat.color.copy(_lerpColor);
              }
            }
          });
        }
      });
    }

    // Update star parallax
    if (starsGroupRef.current) {
      starsGroupRef.current.children.forEach((child, i) => {
        const s = starsData[i];
        if (s) {
          child.position.x = s.x + playerX * 0.02;
        }
      });
    }
  });

  return (
    <>
      {/* Clouds */}
      <group ref={cloudsRef}>
        {clouds.map((c, i) => (
          <Cloud
            key={i}
            position={[c.x, c.y, c.z]}
            scale={[c.scaleX, c.scaleY, 1.5]}
            color={decor.cloudColor}
          />
        ))}
      </group>

      {/* Mountains / distant terrain */}
      <group ref={mountainsRef}>
        {mountains.map((m, i) => (
          <Mountain
            key={i}
            position={[m.x, m.height / 2 - 3, m.z]}
            size={[m.width, m.height, 3]}
            color={m.color}
          />
        ))}
      </group>

      {/* Stars for night/space themes */}
      {(theme === "night" || theme === "space") && (
        <StarsInline starsData={starsData} groupRef={starsGroupRef} />
      )}
    </>
  );
}

function Cloud({ position, scale, color }: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <boxGeometry args={[2, 1, 1]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} roughness={1} />
      </mesh>
      <mesh position={[0.8, 0.3, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.9]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} roughness={1} />
      </mesh>
      <mesh position={[-0.6, 0.2, 0.1]}>
        <boxGeometry args={[1, 0.7, 0.8]} />
        <meshStandardMaterial color={color} transparent opacity={0.65} roughness={1} />
      </mesh>
    </group>
  );
}

function Mountain({ position, size, color }: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <group position={position}>
      {/* Main body */}
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {/* Peak */}
      <mesh position={[0, size[1] * 0.4, 0]}>
        <boxGeometry args={[size[0] * 0.6, size[1] * 0.4, size[2] * 0.8]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, size[1] * 0.65, 0]}>
        <boxGeometry args={[size[0] * 0.3, size[1] * 0.25, size[2] * 0.6]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </group>
  );
}

interface StarData {
  x: number;
  y: number;
  z: number;
  size: number;
  twinkleSpeed: number;
}

function StarsInline({ starsData, groupRef }: {
  starsData: StarData[];
  groupRef: React.RefObject<THREE.Group>;
}) {
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const star = starsData[i];
      if (star) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.5 + Math.sin(t * star.twinkleSpeed) * 0.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {starsData.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}>
          <boxGeometry args={[s.size, s.size, s.size]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EffectSpriteProps {
  type: "dust" | "stars" | "heart" | "exclamation" | "zzz";
  position: [number, number, number];
  onComplete: () => void;
  scale?: number;
}

// ---------------------------------------------------------------------------
// Effect Configurations
// ---------------------------------------------------------------------------

interface EffectConfig {
  /** Total duration in seconds before auto-destroy */
  duration: number;
}

const EFFECT_CONFIGS: Record<EffectSpriteProps["type"], EffectConfig> = {
  dust: { duration: 0.3 },
  stars: { duration: 0.5 },
  heart: { duration: 0.8 },
  exclamation: { duration: 1.0 },
  zzz: { duration: 2.0 },
};

// ---------------------------------------------------------------------------
// Procedural Effect Components
// ---------------------------------------------------------------------------

/** Dust: white sphere that scales up and fades out */
function DustEffect({
  position,
  onComplete,
  scale = 1,
}: Omit<EffectSpriteProps, "type">) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const elapsed = useRef(0);
  const config = EFFECT_CONFIGS.dust;

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current / config.duration;

    if (t >= 1) {
      onComplete();
      return;
    }

    if (meshRef.current) {
      const s = THREE.MathUtils.lerp(0.1, 0.5, t) * scale;
      meshRef.current.scale.set(s, s, s);
    }
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(0.6, 0, t);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.15, 8, 6]} />
      <meshBasicMaterial
        ref={matRef}
        color={0xdddddd}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Stars: 3 small yellow spheres orbiting and fading out */
function StarsEffect({
  position,
  onComplete,
  scale = 1,
}: Omit<EffectSpriteProps, "type">) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const config = EFFECT_CONFIGS.stars;
  const matRefs = [
    useRef<THREE.MeshBasicMaterial>(null),
    useRef<THREE.MeshBasicMaterial>(null),
    useRef<THREE.MeshBasicMaterial>(null),
  ];

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current / config.duration;

    if (t >= 1) {
      onComplete();
      return;
    }

    if (groupRef.current) {
      // Rotate the group so stars orbit
      groupRef.current.rotation.z = elapsed.current * 8;

      // Fade out
      const opacity = THREE.MathUtils.lerp(1, 0, t);
      for (const ref of matRefs) {
        if (ref.current) {
          ref.current.opacity = opacity;
        }
      }
    }
  });

  const starRadius = 0.35 * scale;
  const starPositions: [number, number, number][] = [
    [starRadius, 0, 0.1],
    [
      -starRadius * Math.cos(Math.PI / 3),
      starRadius * Math.sin(Math.PI / 3),
      0.1,
    ],
    [
      -starRadius * Math.cos(Math.PI / 3),
      -starRadius * Math.sin(Math.PI / 3),
      0.1,
    ],
  ];

  return (
    <group ref={groupRef} position={position}>
      {starPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.06 * scale, 6, 4]} />
          <meshBasicMaterial
            ref={matRefs[i]}
            color={0xffdd00}
            transparent
            opacity={1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Heart: red diamond-ish shape that floats up and fades */
function HeartEffect({
  position,
  onComplete,
  scale = 1,
}: Omit<EffectSpriteProps, "type">) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const elapsed = useRef(0);
  const config = EFFECT_CONFIGS.heart;

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current / config.duration;

    if (t >= 1) {
      onComplete();
      return;
    }

    if (meshRef.current) {
      // Float upward
      meshRef.current.position.y = position[1] + t * 0.8;
      // Gentle pulse
      const pulse = 1 + Math.sin(elapsed.current * 6) * 0.15;
      const s = 0.2 * scale * pulse;
      meshRef.current.scale.set(s, s, s);
    }
    if (matRef.current) {
      // Fade out in the last 30%
      matRef.current.opacity = t > 0.7 ? THREE.MathUtils.lerp(1, 0, (t - 0.7) / 0.3) : 1;
    }
  });

  return (
    <mesh ref={meshRef} position={[position[0], position[1], position[2]]}>
      {/* Use an octahedron as a simple heart-like shape */}
      <octahedronGeometry args={[0.15, 0]} />
      <meshBasicMaterial
        ref={matRef}
        color={0xff3366}
        transparent
        opacity={1}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Exclamation: "!" shaped mesh that bobs up and down */
function ExclamationEffect({
  position,
  onComplete,
  scale = 1,
}: Omit<EffectSpriteProps, "type">) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef1 = useRef<THREE.MeshBasicMaterial>(null);
  const matRef2 = useRef<THREE.MeshBasicMaterial>(null);
  const elapsed = useRef(0);
  const config = EFFECT_CONFIGS.exclamation;

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current / config.duration;

    if (t >= 1) {
      onComplete();
      return;
    }

    if (groupRef.current) {
      // Bob up and down
      groupRef.current.position.y =
        position[1] + Math.sin(elapsed.current * 5) * 0.08;

      // Fade out in the last 25%
      const opacity = t > 0.75 ? THREE.MathUtils.lerp(1, 0, (t - 0.75) / 0.25) : 1;
      if (matRef1.current) matRef1.current.opacity = opacity;
      if (matRef2.current) matRef2.current.opacity = opacity;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      scale={[scale, scale, scale]}
    >
      {/* Exclamation bar */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.02]} />
        <meshBasicMaterial
          ref={matRef1}
          color={0xffff00}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </mesh>
      {/* Exclamation dot */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshBasicMaterial
          ref={matRef2}
          color={0xffff00}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Zzz: three small light-blue boxes floating upward with staggered timing */
function ZzzEffect({
  position,
  onComplete,
  scale = 1,
}: Omit<EffectSpriteProps, "type">) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const config = EFFECT_CONFIGS.zzz;

  const zData = useRef([
    { delay: 0.0, offsetX: 0 },
    { delay: 0.4, offsetX: 0.15 },
    { delay: 0.8, offsetX: -0.1 },
  ]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current / config.duration;

    if (t >= 1) {
      onComplete();
      return;
    }

    if (!groupRef.current) return;
    const children = groupRef.current.children;

    for (let i = 0; i < zData.current.length; i++) {
      const z = zData.current[i];
      const localT = Math.max(0, (elapsed.current - z.delay) / (config.duration - z.delay));
      if (localT <= 0) {
        children[i].visible = false;
        continue;
      }
      children[i].visible = true;

      // Float upward with gentle sway
      const yOffset = localT * 1.2;
      const xSway = Math.sin(elapsed.current * 3 + i * 2) * 0.08;
      children[i].position.set(
        z.offsetX + xSway,
        yOffset,
        0.1
      );

      // Scale: grow in, then stable
      const s = Math.min(localT * 4, 1) * 0.08 * scale * (1 - i * 0.15);
      children[i].scale.setScalar(s);

      // Fade out in last 40%
      const mat = (children[i] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = localT > 0.6 ? THREE.MathUtils.lerp(0.9, 0, (localT - 0.6) / 0.4) : 0.9;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {zData.current.map((_, i) => (
        <mesh key={i} visible={false}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
          <meshBasicMaterial
            color={0xaaddff}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main EffectSprite Component
// ---------------------------------------------------------------------------

export function EffectSprite({ type, position, onComplete, scale }: EffectSpriteProps) {
  const props = { position, onComplete, scale };

  switch (type) {
    case "dust":
      return <DustEffect {...props} />;
    case "stars":
      return <StarsEffect {...props} />;
    case "heart":
      return <HeartEffect {...props} />;
    case "exclamation":
      return <ExclamationEffect {...props} />;
    case "zzz":
      return <ZzzEffect {...props} />;
    default:
      return null;
  }
}

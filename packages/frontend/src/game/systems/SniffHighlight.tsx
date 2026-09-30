import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SniffTarget {
  x: number;
  y: number;
  z: number;
  type: "item_block" | "bone";
}

interface SniffHighlightProps {
  active: boolean;
  playerX: number;
  playerY: number;
  radius: number;
  highlightTargets: SniffTarget[];
}

// ---------------------------------------------------------------------------
// SniffHighlight Component
// ---------------------------------------------------------------------------

export function SniffHighlight({
  active,
  highlightTargets,
}: SniffHighlightProps) {
  const fadeRef = useRef(0);

  useFrame((_, delta) => {
    if (active) {
      fadeRef.current = Math.min(1, fadeRef.current + delta / 0.3); // fade in over 0.3s
    } else {
      fadeRef.current = Math.max(0, fadeRef.current - delta / 0.2); // fade out over 0.2s
    }
  });

  if (fadeRef.current <= 0 && !active) return null;

  return (
    <>
      {highlightTargets.map((target, i) => (
        <SniffRing
          key={`sniff-${target.x}-${target.y}-${i}`}
          target={target}
          fadeRef={fadeRef}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// SniffRing sub-component
// ---------------------------------------------------------------------------

function SniffRing({
  target,
  fadeRef,
}: {
  target: SniffTarget;
  fadeRef: React.RefObject<number>;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (matRef.current) {
      const pulseBase = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(timeRef.current * 4));
      matRef.current.opacity = pulseBase * (fadeRef.current ?? 0);
    }
  });

  return (
    <group position={[target.x, target.y, target.z + 0.01]}>
      <mesh>
        <ringGeometry args={[0.45, 0.55, 16]} />
        <meshBasicMaterial
          ref={matRef}
          color="#FFD700"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {target.type === "item_block" && (
        <sprite position={[0, 0.8, 0.1]} scale={[0.3, 0.3, 1]}>
          <spriteMaterial color="#FFD700" opacity={fadeRef.current ?? 0} transparent />
        </sprite>
      )}
    </group>
  );
}

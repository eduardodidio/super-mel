import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useGameFrame } from "../hooks/useGameFrame";
import type { Controls } from "../hooks/useControls";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BarkSystemProps {
  controlsRef: React.RefObject<Controls>;
  playerPosRef: React.RefObject<{ x: number; y: number }>;
  onBarkWave: (x: number, y: number, radius: number) => void;
  onBarkStart?: () => void;
}

interface BarkWaveData {
  id: number;
  x: number;
  y: number;
  elapsed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BARK_COOLDOWN = 1.0; // seconds between barks
const BARK_WAVE_DURATION = 0.5; // seconds for wave to expand
const BARK_WAVE_START_RADIUS = 0.5;
const BARK_WAVE_END_RADIUS = 4;

// ---------------------------------------------------------------------------
// BarkWave sub-component
// ---------------------------------------------------------------------------

function BarkWave({
  wave,
  onComplete,
}: {
  wave: BarkWaveData;
  onComplete: (id: number) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const elapsed = useRef(wave.elapsed);

  useGameFrame((_, delta) => {
    elapsed.current += delta;
    const t = Math.min(elapsed.current / BARK_WAVE_DURATION, 1);

    if (t >= 1) {
      onComplete(wave.id);
      return;
    }

    if (meshRef.current) {
      const radius = THREE.MathUtils.lerp(BARK_WAVE_START_RADIUS, BARK_WAVE_END_RADIUS, t);
      meshRef.current.scale.set(radius, radius, 1);
    }
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(0.8, 0, t);
    }
  });

  return (
    <mesh ref={meshRef} position={[wave.x, wave.y, 0.05]} scale={[BARK_WAVE_START_RADIUS, BARK_WAVE_START_RADIUS, 1]}>
      <torusGeometry args={[1, 0.08, 8, 32]} />
      <meshStandardMaterial
        ref={matRef}
        color="#FFD700"
        emissive="#FFD700"
        emissiveIntensity={1.5}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// BarkSystem Component
// ---------------------------------------------------------------------------

let barkIdCounter = 0;

export function BarkSystem({
  controlsRef,
  playerPosRef,
  onBarkWave,
  onBarkStart,
}: BarkSystemProps) {
  const [waves, setWaves] = useState<BarkWaveData[]>([]);
  const cooldownRef = useRef(0);
  const lastBarkRef = useRef(false);
  const pendingCallbackRef = useRef<{ x: number; y: number; id: number } | null>(null);

  const removeWave = useCallback((id: number) => {
    setWaves((prev) => prev.filter((w) => w.id !== id));
  }, []);

  useGameFrame((_, delta) => {
    // Decrement cooldown
    if (cooldownRef.current > 0) {
      cooldownRef.current -= delta;
    }

    const barkPressed = controlsRef.current?.bark ?? false;
    const justPressed = barkPressed && !lastBarkRef.current;
    lastBarkRef.current = barkPressed;

    if (justPressed && cooldownRef.current <= 0) {
      const x = playerPosRef.current?.x ?? 0;
      const y = playerPosRef.current?.y ?? 0;

      barkIdCounter++;
      const newWave: BarkWaveData = {
        id: barkIdCounter,
        x,
        y,
        elapsed: 0,
      };

      setWaves((prev) => [...prev, newWave]);
      cooldownRef.current = BARK_COOLDOWN;
      onBarkStart?.();

      // Schedule the onBarkWave callback for when wave reaches full extent
      pendingCallbackRef.current = { x, y, id: barkIdCounter };
    }

    // Fire onBarkWave after wave duration (check pending)
    if (pendingCallbackRef.current) {
      // We track via cooldown: wave fires at BARK_COOLDOWN, callback after BARK_WAVE_DURATION
      // Since cooldown starts at BARK_COOLDOWN, callback fires when cooldown <= BARK_COOLDOWN - BARK_WAVE_DURATION
      const timeSinceBark = BARK_COOLDOWN - cooldownRef.current;
      if (timeSinceBark >= BARK_WAVE_DURATION) {
        const { x, y } = pendingCallbackRef.current;
        onBarkWave(x, y, BARK_WAVE_END_RADIUS);
        pendingCallbackRef.current = null;
      }
    }
  });

  return (
    <>
      {waves.map((wave) => (
        <BarkWave key={wave.id} wave={wave} onComplete={removeWave} />
      ))}
    </>
  );
}

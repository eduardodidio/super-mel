import { useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectSprite } from "../entities/EffectSprite";
import type { EffectSpriteProps } from "../entities/EffectSprite";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EffectManagerProps {
  playerX: number;
  playerY: number;
  playerState: string; // AnimState
  playerGrounded: boolean;
  playerVelX: number;
}

interface ActiveEffect {
  id: number;
  type: EffectSpriteProps["type"];
  position: [number, number, number];
  scale?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum simultaneous effects to prevent GC pressure */
const MAX_EFFECTS = 10;

/** Minimum interval between run-dust spawns (seconds) */
const RUN_DUST_INTERVAL = 0.15;

// ---------------------------------------------------------------------------
// EffectManager Component
// ---------------------------------------------------------------------------

let nextEffectId = 0;

export function EffectManager({
  playerX,
  playerY,
  playerState,
  playerGrounded,
  playerVelX,
}: EffectManagerProps) {
  const [effects, setEffects] = useState<ActiveEffect[]>([]);

  // Refs for tracking state transitions and spawn timing
  const prevStateRef = useRef<string>(playerState);
  const runDustTimerRef = useRef(0);
  const zzzTimerRef = useRef(0);

  // Stable callback for removing a completed effect
  const removeEffect = useCallback((id: number) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Spawn helper — respects pool limit
  const spawnEffect = useCallback(
    (type: EffectSpriteProps["type"], position: [number, number, number], scale?: number) => {
      setEffects((prev) => {
        if (prev.length >= MAX_EFFECTS) {
          // Drop the oldest effect to make room
          const trimmed = prev.slice(1);
          return [...trimmed, { id: nextEffectId++, type, position, scale }];
        }
        return [...prev, { id: nextEffectId++, type, position, scale }];
      });
    },
    []
  );

  useFrame((_, delta) => {
    const prevState = prevStateRef.current;
    const stateChanged = prevState !== playerState;

    // --- Dust: while running, spawn every RUN_DUST_INTERVAL ---
    if (playerState === "run" && playerGrounded) {
      runDustTimerRef.current += delta;
      if (runDustTimerRef.current >= RUN_DUST_INTERVAL) {
        runDustTimerRef.current = 0;
        // Spawn at feet position, slightly behind player
        const offsetX = playerVelX > 0 ? -0.2 : 0.2;
        spawnEffect("dust", [playerX + offsetX, playerY - 0.4, 0.1]);
      }
    } else {
      runDustTimerRef.current = 0;
    }

    // --- Dust (land): when transitioning into jump_land ---
    if (stateChanged && playerState === "jump_land") {
      spawnEffect("dust", [playerX, playerY - 0.4, 0.1], 1.5);
    }

    // --- Stars: when entering hurt_medium ---
    if (stateChanged && playerState === "hurt_medium") {
      spawnEffect("stars", [playerX, playerY + 0.8, 0.1]);
    }

    // --- Heart: when entering affection or jump_on_owner ---
    if (
      stateChanged &&
      (playerState === "affection" || playerState === "jump_on_owner")
    ) {
      spawnEffect("heart", [playerX, playerY + 0.6, 0.1]);
    }

    // --- Zzz: when entering lie_down ---
    if (stateChanged && playerState === "lie_down") {
      spawnEffect("zzz", [playerX, playerY + 0.8, 0.1]);
    }

    // --- Zzz: recurring while in lie_down (every 2.5s) ---
    if (playerState === "lie_down") {
      zzzTimerRef.current += delta;
      if (zzzTimerRef.current >= 2.5) {
        zzzTimerRef.current = 0;
        spawnEffect("zzz", [playerX, playerY + 0.8, 0.1]);
      }
    } else {
      zzzTimerRef.current = 0;
    }

    // Update prev state
    prevStateRef.current = playerState;
  });

  return (
    <>
      {effects.map((effect) => (
        <EffectSprite
          key={effect.id}
          type={effect.type}
          position={effect.position}
          scale={effect.scale}
          onComplete={() => removeEffect(effect.id)}
        />
      ))}
    </>
  );
}

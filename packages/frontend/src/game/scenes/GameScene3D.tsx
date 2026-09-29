import { useRef, useCallback } from "react";
import * as THREE from "three";
import { Mel } from "../entities/Mel";
import { CameraRig } from "../systems/CameraRig";
import { ChunkRenderer } from "../systems/ChunkRenderer";
import { useControls } from "../hooks/useControls";
import { useGameState } from "../hooks/useGameState";
import { GAME_CONFIG } from "@super-mel/shared";

export function GameScene3D() {
  const melTracker = useRef<THREE.Object3D>(new THREE.Object3D());
  const controlsRef = useControls();
  const addScore = useGameState((s) => s.addScore);
  const loseLife = useGameState((s) => s.loseLife);
  const invincibleRef = useRef(false);
  const lastX = useRef(0);
  const playerX = useRef(0);

  const handlePositionUpdate = useCallback((x: number, y: number) => {
    melTracker.current.position.set(x, y, 0);
    playerX.current = x;
    const dx = x - lastX.current;
    if (dx > 0) {
      addScore(dx);
    }
    lastX.current = x;
  }, [addScore]);

  const handleDamage = useCallback(() => {
    if (invincibleRef.current) return;
    loseLife();
    invincibleRef.current = true;
    window.setTimeout(() => {
      invincibleRef.current = false;
    }, GAME_CONFIG.invincibilityMs);
  }, [loseLife]);

  return (
    <>
      <CameraRig targetRef={melTracker} offset={[6, 3, 18]} lerpSpeed={0.06} />

      <Mel
        controlsRef={controlsRef}
        onPositionUpdate={handlePositionUpdate}
        onCollisionDamage={handleDamage}
        invincible={invincibleRef.current}
      />

      <ChunkRenderer playerX={playerX.current} />

      {/* Fog floor for depth */}
      <fog attach="fog" args={["#87ceeb", 30, 80]} />
    </>
  );
}

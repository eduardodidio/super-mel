import { useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { Mel } from "../entities/Mel";
import { CameraRig } from "../systems/CameraRig";
import { ChunkRenderer } from "../systems/ChunkRenderer";
import { ProjectileManager } from "../systems/ProjectileManager";
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
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 5 });

  const handlePositionUpdate = useCallback((x: number, y: number) => {
    melTracker.current.position.set(x, y, 0);
    setPlayerPos({ x, y });
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

  const handleBlockHit = useCallback((blockName: string) => {
    // Block destruction is handled by the chunk system
    // Could add score bonus here
  }, []);

  return (
    <>
      <CameraRig targetRef={melTracker} offset={[6, 3, 18]} lerpSpeed={0.06} />

      <Mel
        controlsRef={controlsRef}
        onPositionUpdate={handlePositionUpdate}
        onCollisionDamage={handleDamage}
        invincible={invincibleRef.current}
      />

      <ProjectileManager
        controlsRef={controlsRef}
        playerX={playerPos.x}
        playerY={playerPos.y}
        onBlockHit={handleBlockHit}
      />

      <ChunkRenderer playerX={playerPos.x} />

      <fog attach="fog" args={["#87ceeb", 30, 80]} />
    </>
  );
}

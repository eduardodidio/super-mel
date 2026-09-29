import { useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { Mel } from "../entities/Mel";
import { CameraRig } from "../systems/CameraRig";
import { ChunkRenderer } from "../systems/ChunkRenderer";
import { ProjectileManager } from "../systems/ProjectileManager";
import { useControls } from "../hooks/useControls";
import { useGameState } from "../hooks/useGameState";

const INVINCIBILITY_MS = 1500;

export function GameScene3D() {
  const melTracker = useRef<THREE.Object3D>(new THREE.Object3D());
  const controlsRef = useControls();
  const addScore = useGameState((s) => s.addScore);
  const loseLife = useGameState((s) => s.loseLife);
  const lives = useGameState((s) => s.lives);
  const setLives = useGameState((s) => s.setLives);
  const invincibleRef = useRef(false);
  const lastX = useRef(0);
  const [playerPos, setPlayerPos] = useState({ x: 2, y: 5 });
  const [facingRight, setFacingRight] = useState(true);

  const handlePositionUpdate = useCallback((x: number, y: number) => {
    melTracker.current.position.set(x, y, 0);
    setPlayerPos({ x, y });
    const dx = x - lastX.current;
    if (Math.abs(dx) > 0.01) {
      addScore(Math.abs(dx));
      setFacingRight(dx > 0);
    }
    lastX.current = x;
  }, [addScore]);

  const handleDamage = useCallback(() => {
    if (invincibleRef.current) return;
    loseLife();
    invincibleRef.current = true;
    window.setTimeout(() => {
      invincibleRef.current = false;
    }, INVINCIBILITY_MS);
  }, [loseLife]);

  const handleHeartCollected = useCallback(() => {
    if (lives < 3) {
      setLives(lives + 1);
    }
  }, [lives, setLives]);

  return (
    <>
      <CameraRig
        targetRef={melTracker}
        offset={[0, 3, 18]}
        lerpSpeed={0.08}
        deadzone={{ x: 2, y: 1.5 }}
      />

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
        facingRight={facingRight}
      />

      <ChunkRenderer
        playerX={playerPos.x}
        onHeartCollected={handleHeartCollected}
      />

      <fog attach="fog" args={["#87ceeb", 30, 80]} />
    </>
  );
}

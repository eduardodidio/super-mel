import { useRef, useCallback, useState, useMemo } from "react";
import * as THREE from "three";
import { Mel } from "../entities/Mel";
import { CameraRig } from "../systems/CameraRig";
import { ChunkRenderer } from "../systems/ChunkRenderer";
import { ProjectileManager } from "../systems/ProjectileManager";
import { BackgroundDecor } from "../systems/BackgroundDecor";
import { useControls } from "../hooks/useControls";
import { useGameState } from "../hooks/useGameState";
import { generateTestLevel } from "../systems/TestLevelData";

const INVINCIBILITY_MS = 1500;

interface GameScene3DProps {
  testMode?: boolean;
}

export function GameScene3D({ testMode = false }: GameScene3DProps) {
  const melTracker = useRef<THREE.Object3D>(new THREE.Object3D());
  const controlsRef = useControls();
  const addScore = useGameState((s) => s.addScore);
  const loseLife = useGameState((s) => s.loseLife);
  const lives = useGameState((s) => s.lives);
  const theme = useGameState((s) => s.theme);
  const addCoin = useGameState((s) => s.addCoin);
  const healLife = useGameState((s) => s.healLife);
  const invincibleRef = useRef(false);
  const lastX = useRef(0);
  const playerPosRef = useRef({ x: 2, y: 5 });
  const facingRightRef = useRef(true);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const testChunks = useMemo(() => testMode ? generateTestLevel() : undefined, [testMode]);

  const handlePositionUpdate = useCallback((x: number, y: number) => {
    melTracker.current.position.set(x, y, 0);
    playerPosRef.current.x = x;
    playerPosRef.current.y = y;
    const dx = x - lastX.current;
    if (Math.abs(dx) > 0.01) {
      addScore(Math.abs(dx));
      facingRightRef.current = dx > 0;
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

  const handleCoinCollected = useCallback(() => {
    addCoin();
  }, [addCoin]);

  return (
    <>
      <CameraRig
        targetRef={melTracker}
        offset={[0, 3, 18]}
        lerpSpeed={0.08}
        deadzone={{ x: 2, y: 1.5 }}
        isLookingUp={isLookingUp}
        lookUpOffset={5}
      />

      <BackgroundDecor theme={theme} playerXRef={playerPosRef} />

      <Mel
        controlsRef={controlsRef}
        onPositionUpdate={handlePositionUpdate}
        onCollisionDamage={handleDamage}
        invincible={invincibleRef.current}
        dead={lives <= 0}
        onLookUp={setIsLookingUp}
      />

      <ProjectileManager
        controlsRef={controlsRef}
        playerPosRef={playerPosRef}
        facingRightRef={facingRightRef}
      />

      <ChunkRenderer
        playerPosRef={playerPosRef}
        onHeartCollected={healLife}
        onCoinCollected={handleCoinCollected}
        testChunks={testChunks}
      />
    </>
  );
}

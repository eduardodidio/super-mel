import { useRef, useCallback, useState, useMemo } from "react";
import * as THREE from "three";
import { BLOCK_PROPERTIES, type BlockType } from "@super-mel/shared";
import { Mel } from "../entities/Mel";
import { DroppedCoin } from "../entities/DroppedCoin";
import { CameraRig } from "../systems/CameraRig";
import { ChunkRenderer, type ChunkRendererHandle } from "../systems/ChunkRenderer";
import { ProjectileManager } from "../systems/ProjectileManager";
import { BackgroundDecor } from "../systems/BackgroundDecor";
import { useControls } from "../hooks/useControls";
import { useGameState } from "../hooks/useGameState";
import { generateTestLevel } from "../systems/TestLevelData";

const INVINCIBILITY_MS = 1500;
const MAX_DROPPED_COINS = 20;
const DROP_CHANCE = 0.4;
const ITEM_BLOCK_POP_VELOCITY = 8;
const DROP_VELOCITY_Y = 5;

interface GameScene3DProps {
  testMode?: boolean;
}

interface DroppedCoinData {
  id: string;
  position: [number, number, number];
  velocity: [number, number];
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
  const setFlyState = useGameState((s) => s.setFlyState);
  const invincibleRef = useRef(false);
  const lastX = useRef(0);
  const playerPosRef = useRef({ x: 2, y: 5 });
  const facingRightRef = useRef(true);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const testChunks = useMemo(() => testMode ? generateTestLevel() : undefined, [testMode]);

  // Coin drop system
  const chunkRef = useRef<ChunkRendererHandle>(null);
  const [droppedCoins, setDroppedCoins] = useState<DroppedCoinData[]>([]);
  const dropIdRef = useRef(0);

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

  const handleFlyStateUpdate = useCallback((isFlying: boolean, timeRemaining: number) => {
    setFlyState(isFlying, timeRemaining);
  }, [setFlyState]);

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

  const spawnDroppedCoins = useCallback((x: number, y: number, count: number, popVelocity: number) => {
    const newCoins: DroppedCoinData[] = [];
    for (let i = 0; i < count; i++) {
      dropIdRef.current++;
      newCoins.push({
        id: `drop-${dropIdRef.current}`,
        position: [x, y, 0],
        velocity: [(Math.random() - 0.5) * 2, popVelocity + Math.random() * 2],
      });
    }
    setDroppedCoins(prev => {
      const combined = [...prev, ...newCoins];
      return combined.slice(-MAX_DROPPED_COINS);
    });
  }, []);

  const handleBlockHit = useCallback((blockName: string, blockPos: { x: number; y: number; z: number }) => {
    const blockType = blockName.replace("block-", "") as Exclude<BlockType, "empty">;

    if (blockType === "item_block") {
      const activated = chunkRef.current?.activateBlock(blockPos.x, blockPos.y, blockPos.z);
      if (activated) {
        const coinCount = 1 + Math.floor(Math.random() * 3);
        spawnDroppedCoins(blockPos.x, blockPos.y + 1, coinCount, ITEM_BLOCK_POP_VELOCITY);
      }
    } else if (BLOCK_PROPERTIES[blockType]?.destructible) {
      chunkRef.current?.destroyBlock(blockPos.x, blockPos.y, blockPos.z);
      if (Math.random() < DROP_CHANCE) {
        const coinCount = 1 + Math.floor(Math.random() * 2);
        spawnDroppedCoins(blockPos.x, blockPos.y, coinCount, DROP_VELOCITY_Y);
      }
    }
  }, [spawnDroppedCoins]);

  const handleDroppedCoinCollect = useCallback((coinId: string) => {
    addCoin();
    setDroppedCoins(prev => prev.filter(c => c.id !== coinId));
  }, [addCoin]);

  const handleDroppedCoinExpire = useCallback((coinId: string) => {
    setDroppedCoins(prev => prev.filter(c => c.id !== coinId));
  }, []);

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
        onFlyStateUpdate={handleFlyStateUpdate}
      />

      <ProjectileManager
        controlsRef={controlsRef}
        playerPosRef={playerPosRef}
        facingRightRef={facingRightRef}
        onBlockHit={handleBlockHit}
      />

      <ChunkRenderer
        ref={chunkRef}
        playerPosRef={playerPosRef}
        onHeartCollected={healLife}
        onCoinCollected={handleCoinCollected}
        testChunks={testChunks}
      />

      {droppedCoins.map(coin => (
        <DroppedCoin
          key={coin.id}
          id={coin.id}
          position={coin.position}
          velocity={coin.velocity}
          playerPosRef={playerPosRef}
          onCollect={handleDroppedCoinCollect}
          onExpire={handleDroppedCoinExpire}
        />
      ))}
    </>
  );
}

import { useRef, useCallback, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { BLOCK_PROPERTIES, type BlockType, type LevelDataV2 } from "@super-mel/shared";
import { Mel } from "../entities/Mel";
import { Goal } from "../entities/Goal";
import { Checkpoint } from "../entities/Checkpoint";
import { DroppedCoin } from "../entities/DroppedCoin";
import { CameraRig } from "../systems/CameraRig";
import { ChunkRenderer, type ChunkRendererHandle } from "../systems/ChunkRenderer";
import { ProjectileManager } from "../systems/ProjectileManager";
import { BackgroundDecor } from "../systems/BackgroundDecor";
import { EffectManager } from "../systems/EffectManager";
import { useScreenShake } from "../systems/useScreenShake";
import { useControls, type Controls } from "../hooks/useControls";
import { useGameState } from "../hooks/useGameState";
import { useAssistMode } from "../hooks/useAssistMode";
import { generateTestLevel } from "../systems/TestLevelData";
import { levelToSceneObjects, sceneObjectsToChunks } from "../systems/LevelSceneConverter";
import { sharedCoinPopup } from "../systems/CoinPopup";

const INVINCIBILITY_MS = 1500;
const MAX_DROPPED_COINS = 20;
const DROP_CHANCE = 0.4;
const ITEM_BLOCK_POP_VELOCITY = 8;
const DROP_VELOCITY_Y = 5;

interface GameScene3DProps {
  testMode?: boolean;
  levelData?: LevelDataV2;
}

interface DroppedCoinData {
  id: string;
  position: [number, number, number];
  velocity: [number, number];
}

// Frozen controls ref for level-completing state (no input)
const FROZEN_CONTROLS: Controls = {
  left: false, right: false, up: false, down: false,
  jump: false, shoot: false,
};

export function GameScene3D({ testMode = false, levelData }: GameScene3DProps) {
  const melTracker = useRef<THREE.Object3D>(new THREE.Object3D());
  const controlsRef = useControls();
  const addScore = useGameState((s) => s.addScore);
  const loseLife = useGameState((s) => s.loseLife);
  const lives = useGameState((s) => s.lives);
  const theme = useGameState((s) => s.theme);
  const addCoin = useGameState((s) => s.addCoin);
  const healLife = useGameState((s) => s.healLife);
  const setFlyState = useGameState((s) => s.setFlyState);
  const assistInvincible = useAssistMode((s) => s.invincible);
  const dailyMode = useGameState((s) => s.dailyMode);
  const dailySeed = useGameState((s) => s.dailySeed);
  const baseSeed = dailyMode ? dailySeed : 0;
  const invincibleRef = useRef(false);
  const lastX = useRef(0);
  const maxX = useRef(0);
  const playerPosRef = useRef({ x: 2, y: 5 });
  const facingRightRef = useRef(true);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const testChunks = useMemo(() => testMode ? generateTestLevel() : undefined, [testMode]);

  // Level mode state
  const gameMode = useGameState((s) => s.gameMode);
  const levelCompleting = useGameState((s) => s.levelCompleting);
  const setLevelCompleting = useGameState((s) => s.setLevelCompleting);
  const completeLevel = useGameState((s) => s.completeLevel);
  const setLastCheckpoint = useGameState((s) => s.setLastCheckpoint);
  const lastCheckpoint = useGameState((s) => s.lastCheckpoint);

  // Parse level entities from LevelDataV2
  const sceneObjects = useMemo(() => {
    if (!levelData) return null;
    return levelToSceneObjects(levelData);
  }, [levelData]);

  const levelChunks = useMemo(() => {
    if (!sceneObjects) return undefined;
    return sceneObjectsToChunks(sceneObjects);
  }, [sceneObjects]);

  const goalEntities = sceneObjects?.goal ? [sceneObjects.goal] : [];
  const checkpointEntities = sceneObjects?.checkpoints ?? [];
  const spawnPoint = sceneObjects?.spawnPoint ?? { x: 2, y: 5 };

  // Warn if level has no goal
  if (levelData && goalEntities.length === 0) {
    // eslint-disable-next-line no-console
    console.warn("Level has no goal entity");
  }

  // Respawn point: last checkpoint or spawn point
  const respawnPoint = lastCheckpoint || spawnPoint;

  // Checkpoint activation state
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(null);

  // Goal position ref for celebration sprite
  const goalPositionRef = useRef<{ x: number; y: number } | null>(
    goalEntities.length > 0 ? goalEntities[0] : null
  );

  // Celebration sprite texture
  const jumpOnOwnerTexture = useMemo(() => {
    const tex = new THREE.TextureLoader().load("/sprites/mel/jump_on_owner.png");
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Frozen controls ref for levelCompleting
  const frozenControlsRef = useRef<Controls>(FROZEN_CONTROLS);

  // Coin drop system
  const chunkRef = useRef<ChunkRendererHandle>(null);
  const [droppedCoins, setDroppedCoins] = useState<DroppedCoinData[]>([]);
  const dropIdRef = useRef(0);

  // Heart collection signal for affection animation (T01)
  const heartCollectedRef = useRef(false);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mel state ref for EffectManager (T02)
  const melStateRef = useRef({ state: "idle", grounded: true, velX: 0 });

  // Screen shake (T04)
  const shake = useScreenShake((s) => s.shake);

  // Hit-stop (T04)
  const hitStopRef = useRef(false);

  // Coin popup uses sharedCoinPopup (module-level ref set by CoinPopupLayer outside Canvas)

  // --- Goal collision handler ---
  const handleGoalReached = useCallback(() => {
    if (gameMode !== "level") return;
    if (levelCompleting) return; // guard against double trigger
    setLevelCompleting(true);
    // After 1.5s celebration delay, transition to result screen
    setTimeout(() => {
      completeLevel(); // sets scene to "levelclear"
    }, 1500);
  }, [gameMode, levelCompleting, setLevelCompleting, completeLevel]);

  // --- Checkpoint activation handler ---
  const handleCheckpointActivate = useCallback((id: string, x: number, y: number) => {
    setActiveCheckpointId(id);
    setLastCheckpoint(x, y);
  }, [setLastCheckpoint]);

  const handlePositionUpdate = useCallback((x: number, y: number) => {
    melTracker.current.position.set(x, y, 0);
    playerPosRef.current.x = x;
    playerPosRef.current.y = y;
    const dx = x - lastX.current;
    if (dx > 0.01) {
      facingRightRef.current = true;
    } else if (dx < -0.01) {
      facingRightRef.current = false;
    }
    if (x > maxX.current) {
      addScore(x - maxX.current);
      maxX.current = x;
    }
    lastX.current = x;
  }, [addScore]);

  const handleFlyStateUpdate = useCallback((isFlying: boolean, timeRemaining: number) => {
    setFlyState(isFlying, timeRemaining);
  }, [setFlyState]);

  const handleDamage = useCallback(() => {
    if (invincibleRef.current || assistInvincible) return;
    loseLife();
    shake(0.15, 0.2);
    hitStopRef.current = true;
    invincibleRef.current = true;
    window.setTimeout(() => {
      invincibleRef.current = false;
    }, INVINCIBILITY_MS);
  }, [loseLife, shake, assistInvincible]);

  const handleCoinCollected = useCallback(() => {
    addCoin();
    sharedCoinPopup.current?.spawn(playerPosRef.current.x, playerPosRef.current.y + 1);
  }, [addCoin]);

  const handleHeartCollected = useCallback(() => {
    healLife();
    heartCollectedRef.current = true;
    if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    heartTimerRef.current = setTimeout(() => {
      heartCollectedRef.current = false;
    }, 50);
  }, [healLife]);

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
        shake(0.06, 0.1);
        const coinCount = 1 + Math.floor(Math.random() * 3);
        spawnDroppedCoins(blockPos.x, blockPos.y + 1, coinCount, ITEM_BLOCK_POP_VELOCITY);
      }
    } else if (BLOCK_PROPERTIES[blockType]?.destructible) {
      chunkRef.current?.destroyBlock(blockPos.x, blockPos.y, blockPos.z);
      shake(0.1, 0.12);
      if (Math.random() < DROP_CHANCE) {
        const coinCount = 1 + Math.floor(Math.random() * 2);
        spawnDroppedCoins(blockPos.x, blockPos.y, coinCount, DROP_VELOCITY_Y);
      }
    }
  }, [spawnDroppedCoins, shake]);

  const handleDroppedCoinCollect = useCallback((coinId: string) => {
    addCoin();
    sharedCoinPopup.current?.spawn(playerPosRef.current.x, playerPosRef.current.y + 1);
    setDroppedCoins(prev => prev.filter(c => c.id !== coinId));
  }, [addCoin]);

  const handleDroppedCoinExpire = useCallback((coinId: string) => {
    setDroppedCoins(prev => prev.filter(c => c.id !== coinId));
  }, []);

  // Determine which chunks to use: level data chunks vs infinite/test chunks
  const effectiveChunks = levelChunks ?? testChunks;

  // Mel initial position: from spawn point (level mode) or default
  const melInitialPosition: [number, number, number] = levelData
    ? [spawnPoint.x, spawnPoint.y + 1, 0]
    : [2, 5, 0];

  return (
    <>
      <CameraRig
        targetRef={melTracker}
        offset={[0, 3, 18]}
        lerpSpeed={0.08}
        deadzone={{ x: 2, y: 1.5 }}
        isLookingUp={isLookingUp}
        lookUpOffset={5}
        facingRightRef={facingRightRef}
        lookaheadX={1.5}
      />

      <BackgroundDecor theme={theme} playerXRef={playerPosRef} />

      <Mel
        controlsRef={levelCompleting ? frozenControlsRef : controlsRef}
        onPositionUpdate={handlePositionUpdate}
        onCollisionDamage={handleDamage}
        invincible={invincibleRef.current}
        dead={lives <= 0}
        onLookUp={setIsLookingUp}
        onFlyStateUpdate={handleFlyStateUpdate}
        heartJustCollected={heartCollectedRef.current}
        stateRef={melStateRef}
        respawnPoint={gameMode === "level" ? respawnPoint : undefined}
        initialPosition={melInitialPosition}
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
        onHeartCollected={handleHeartCollected}
        onCoinCollected={handleCoinCollected}
        testChunks={effectiveChunks}
        baseSeed={baseSeed}
      />

      {/* Goal entities from level data */}
      {goalEntities.map((g, i) => (
        <Goal
          key={`goal-${i}`}
          position={[g.x, g.y, 0]}
          onGoalReached={handleGoalReached}
        />
      ))}

      {/* Checkpoint entities from level data */}
      {checkpointEntities.map((cp) => {
        const cpId = `checkpoint-${cp.x}-${cp.y}`;
        return (
          <Checkpoint
            key={cpId}
            id={cpId}
            position={[cp.x, cp.y, 0]}
            active={activeCheckpointId === cpId}
            onActivate={handleCheckpointActivate}
          />
        );
      })}

      {/* Celebration sprite during levelCompleting */}
      {levelCompleting && goalPositionRef.current && (
        <sprite
          position={[goalPositionRef.current.x, goalPositionRef.current.y + 1.5, 0.1]}
          scale={[2.5, 2.5, 1]}
        >
          <spriteMaterial
            map={jumpOnOwnerTexture}
            transparent
            depthTest={false}
          />
        </sprite>
      )}

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

      <EffectManager
        playerX={playerPosRef.current.x}
        playerY={playerPosRef.current.y}
        playerState={melStateRef.current.state}
        playerGrounded={melStateRef.current.grounded}
        playerVelX={melStateRef.current.velX}
      />

      <HitStop triggerRef={hitStopRef} />
    </>
  );
}

// ---------------------------------------------------------------------------
// HitStop -- 40ms physics freeze on damage
// ---------------------------------------------------------------------------

function HitStop({ triggerRef }: { triggerRef: React.RefObject<boolean> }) {
  const { world } = useRapier();
  const originalTimestep = useRef(1 / 60);
  const timerRef = useRef(0);
  const active = useRef(false);

  useFrame((_, delta) => {
    if (triggerRef.current && !active.current) {
      originalTimestep.current = world.timestep;
      world.timestep = 0;
      active.current = true;
      timerRef.current = 0;
      (triggerRef as React.MutableRefObject<boolean>).current = false;
    }

    if (active.current) {
      timerRef.current += delta;
      if (timerRef.current >= 0.04) {
        world.timestep = originalTimestep.current;
        active.current = false;
      }
    }
  });

  return null;
}

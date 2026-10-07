import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { BLOCK_PROPERTIES, type BlockType, type LevelDataV2 } from "@super-mel/shared";
import { Mel, type MelHandle } from "../entities/Mel";
import { Goal } from "../entities/Goal";
import { Checkpoint } from "../entities/Checkpoint";
import { Bone } from "../entities/Bone";
import { Sign } from "../entities/Sign";
import { Spring } from "../entities/Spring";
import { MovingPlatform } from "../entities/MovingPlatform";
import { Spikes } from "../entities/Spikes";
import { DroppedCoin } from "../entities/DroppedCoin";
import { CameraRig } from "../systems/CameraRig";
import { ChunkRenderer, type ChunkRendererHandle } from "../systems/ChunkRenderer";
import { ProjectileManager } from "../systems/ProjectileManager";
import { EnemyManager, type EnemySpawnData, type EnemyManagerHandle } from "../systems/EnemyManager";
import { BackgroundDecor } from "../systems/BackgroundDecor";
import { EffectManager } from "../systems/EffectManager";
import { BarkSystem } from "../systems/BarkSystem";
import { SniffHighlight, type SniffTarget } from "../systems/SniffHighlight";
import { tryDig } from "../systems/DigSystem";
import { useGameFrame } from "../hooks/useGameFrame";
import { BiomeTransition } from "../systems/BiomeTransition";
import { getBiomeForChunk, type BiomeState } from "../systems/BiomeManager";
import { CHUNK_WIDTH } from "../systems/ChunkGenerator";
import { useScreenShake } from "../systems/useScreenShake";
import type { Controls } from "../hooks/useControls";
import { useGameState } from "../hooks/useGameState";
import { useAssistMode } from "../hooks/useAssistMode";
import { generateTestLevel } from "../systems/TestLevelData";
import { levelToSceneObjects, sceneObjectsToChunks } from "../systems/LevelSceneConverter";
import { preloadCustomTextures, disposeCustomTextures, getCustomTexture, setCustomBlockLookup } from "../systems/CustomTextureCache";
import { disposeCustomBlockMaterials } from "../systems/BlockTextures3D";
import { sharedCoinPopup } from "../systems/CoinPopup";
import { gameEventBus } from "../systems/GameEventBus";
import type { EnemyChunkData } from "../systems/ChunkGenerator";

const INVINCIBILITY_MS = 1500;
const MAX_DROPPED_COINS = 20;
const DROP_CHANCE = 0.4;
const ITEM_BLOCK_POP_VELOCITY = 8;
const DROP_VELOCITY_Y = 5;

interface GameScene3DProps {
  testMode?: boolean;
  levelData?: LevelDataV2;
  controlsRef: React.MutableRefObject<Controls>;
}

interface DroppedCoinData {
  id: string;
  position: [number, number, number];
  velocity: [number, number];
}

// Frozen controls ref for level-completing state (no input)
const FROZEN_CONTROLS: Controls = {
  left: false, right: false, up: false, down: false,
  jump: false, shoot: false, bark: false,
};

export function GameScene3D({ testMode = false, levelData, controlsRef }: GameScene3DProps) {
  const melTracker = useRef<THREE.Object3D>(new THREE.Object3D());
  const addScore = useGameState((s) => s.addScore);
  const loseLife = useGameState((s) => s.loseLife);
  const lives = useGameState((s) => s.lives);
  const theme = useGameState((s) => s.theme);
  const addCoin = useGameState((s) => s.addCoin);
  const healLife = useGameState((s) => s.healLife);
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

  // Biome tracking for infinite mode (F48)
  const setCurrentBiome = useGameState((s) => s.setCurrentBiome);
  const biomeStateRef = useRef<BiomeState>(getBiomeForChunk(0));
  const [biomeState, setBiomeState] = useState<BiomeState>(getBiomeForChunk(0));

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

  // Preload custom textures when level data is available
  useEffect(() => {
    if (sceneObjects && sceneObjects.customAssets.length > 0) {
      preloadCustomTextures(sceneObjects.customAssets);
      setCustomBlockLookup(sceneObjects.customBlockAssets, sceneObjects.customAssets);
    }
    return () => {
      disposeCustomTextures();
      disposeCustomBlockMaterials();
    };
  }, [sceneObjects]);

  const levelChunks = useMemo(() => {
    if (!sceneObjects) return undefined;
    return sceneObjectsToChunks(sceneObjects);
  }, [sceneObjects]);

  const goalEntities = sceneObjects?.goal ? [sceneObjects.goal] : [];
  const checkpointEntities = sceneObjects?.checkpoints ?? [];
  const boneEntities = sceneObjects?.bones ?? [];
  const signEntities = sceneObjects?.signs ?? [];
  const springEntities = sceneObjects?.springs ?? [];
  const movingPlatformEntities = sceneObjects?.movingPlatforms ?? [];
  const spikesEntities = sceneObjects?.spikes ?? [];
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
  const melStateRef = useRef({ state: "idle", grounded: true, velX: 0, sniffing: false });

  // Screen shake (T04)
  const shake = useScreenShake((s) => s.shake);

  // Hit-stop (T04)
  const hitStopRef = useRef(false);

  // Enemy system (F43)
  const melRef = useRef<MelHandle>(null);
  const enemyManagerRef = useRef<EnemyManagerHandle>(null);
  const [chunkEnemies, setChunkEnemies] = useState<EnemySpawnData[]>([]);

  // Coin popup uses sharedCoinPopup (module-level ref set by CoinPopupLayer outside Canvas)

  // --- Dropped coins ---
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

  // --- Dog abilities (F47) ---
  const digActiveRef = useRef(false);
  const digCooldownRef = useRef(0);
  const suppressNextShotRef = useRef(false);
  const [sniffActive, setSniffActive] = useState(false);

  // Bark wave handler
  const handleBarkWave = useCallback((x: number, y: number, radius: number) => {
    // Find item_blocks in radius and log (future: enemy stun/flee)
    // BarkWave: find item_blocks in radius and stun enemies
  }, []);

  const handleBarkStart = useCallback(() => {
    shake(0.04, 0.08);
  }, [shake]);

  // Dig handler
  const handleDigAttempt = useCallback((): boolean => {
    if (digCooldownRef.current > 0) return false;
    if (!chunkRef.current) return false;

    const result = tryDig(
      playerPosRef.current.x,
      playerPosRef.current.y,
      chunkRef.current.getBlockAt,
    );

    if (!result.success) return false;

    chunkRef.current.destroyBlock(result.blockX, result.blockY, result.blockZ);
    shake(0.06, 0.1);
    digCooldownRef.current = 0.4;

    if (result.dropType === "coin") {
      spawnDroppedCoins(result.blockX, result.blockY, 1, DROP_VELOCITY_Y);
    } else if (result.dropType === "bone") {
      addScore(50);
    }

    digActiveRef.current = true;
    setTimeout(() => { digActiveRef.current = false; }, 500);

    return true;
  }, [shake, spawnDroppedCoins, addScore]);

  // Return coin collection handler
  const handleReturnCoinCollect = useCallback(() => {
    addCoin();
    sharedCoinPopup.current?.spawn(playerPosRef.current.x, playerPosRef.current.y + 1);
    gameEventBus.emit("coin_collected", {
      x: playerPosRef.current.x,
      y: playerPosRef.current.y,
      source: "return",
    });
  }, [addCoin]);

  // Sniff targets computation
  const sniffTargets = useMemo<SniffTarget[]>(() => {
    if (!sniffActive) return [];
    const targets: SniffTarget[] = [];
    const cx = Math.round(playerPosRef.current.x);
    const cy = Math.round(playerPosRef.current.y);
    const r = 8;

    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (dx * dx + dy * dy > r * r) continue;
        const bx = cx + dx;
        const by = cy + dy;
        const blockType = chunkRef.current?.getBlockAt(bx, by, 0);
        if (blockType === "item_block" && !chunkRef.current?.isBlockActivated(bx, by, 0)) {
          targets.push({ x: bx, y: by, z: 0, type: "item_block" });
        }
      }
    }

    // Bone entities from level data (now in dedicated bones array)
    if (sceneObjects?.bones) {
      for (const bone of sceneObjects.bones) {
        const dist = Math.sqrt(
          (bone.x - playerPosRef.current.x) ** 2 +
          (bone.y - playerPosRef.current.y) ** 2,
        );
        if (dist <= r) {
          targets.push({ x: bone.x, y: bone.y, z: 0, type: "bone" });
        }
      }
    }

    return targets;
  }, [sniffActive, sceneObjects]);

  // Dog abilities frame update (dig cooldown + sniff polling)
  useGameFrame((_, delta) => {
    if (digCooldownRef.current > 0) {
      digCooldownRef.current -= delta;
    }

    const isSniffing = melStateRef.current.sniffing ?? false;
    if (isSniffing !== sniffActive) {
      setSniffActive(isSniffing);
    }
  });

  // Attack frame handler with dig interception
  const handleAttackFrame = useCallback(() => {
    const melState = melStateRef.current;
    if (melState.grounded && controlsRef.current?.down) {
      const didDig = handleDigAttempt();
      if (didDig) {
        suppressNextShotRef.current = true;
        return;
      }
    }
    // Normal attack (ProjectileManager handles spawning via its own shoot detection)
  }, [handleDigAttempt]);

  // --- Biome tracking (F48) ---
  // In infinite mode (not test, not level), track the biome based on player position
  const isInfiniteMode = gameMode === "infinite" && !testMode && !levelData;
  const lastBiomeKeyRef = useRef("");
  useFrame(() => {
    if (!isInfiniteMode) return;
    const playerX = playerPosRef.current?.x ?? 0;
    const chunkIndex = Math.max(0, Math.floor(playerX / CHUNK_WIDTH));
    const newBiomeState = getBiomeForChunk(chunkIndex);
    biomeStateRef.current = newBiomeState;

    // Quantize transition factor to avoid excessive re-renders (steps of ~0.05)
    const quantizedFactor = Math.round(newBiomeState.transitionFactor * 20) / 20;
    const key = `${newBiomeState.current}|${newBiomeState.next ?? ""}|${quantizedFactor}`;
    if (key !== lastBiomeKeyRef.current) {
      lastBiomeKeyRef.current = key;
      setBiomeState(newBiomeState);
    }

    // Update the store's currentBiome when the primary biome changes
    if (newBiomeState.current !== useGameState.getState().currentBiome) {
      setCurrentBiome(newBiomeState.current);
    }
  });

  // --- GameEventBus: run lifecycle ---
  const lastEmittedDistance = useRef(0);

  useEffect(() => {
    gameEventBus.emit("run_start", {
      mode: gameMode,
      levelId: gameMode === "level" ? useGameState.getState().levelId ?? undefined : undefined,
    });
    lastEmittedDistance.current = 0;
    return () => {
      gameEventBus.emit("run_end", { mode: gameMode });
    };
  }, [gameMode]);

  // --- Goal collision handler ---
  const handleGoalReached = useCallback(() => {
    if (gameMode !== "level") return;
    if (levelCompleting) return; // guard against double trigger
    setLevelCompleting(true);

    // Emit level_complete event for mission tracking
    const state = useGameState.getState();
    const elapsed = state.levelStartTime > 0
      ? (Date.now() - state.levelStartTime) / 1000
      : 0;
    gameEventBus.emit("level_complete", {
      levelId: state.levelId || "unknown",
      timeSeconds: elapsed,
      coins: state.levelCoins,
      deaths: state.deaths,
    });

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

  // --- Bone collection handler ---
  const addBone = useGameState((s) => s.addBone);
  const handleBoneCollected = useCallback((boneId: string) => {
    if (addBone) addBone();
    shake(0.08, 0.12);
  }, [addBone, shake]);

  const handleSpringBounce = useCallback((force: number) => {
    melRef.current?.springBounce(force);
    shake(0.06, 0.1);
  }, [shake]);

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

    // Emit distance_reached at each whole-meter milestone
    const currentMeters = Math.floor(maxX.current);
    if (currentMeters > lastEmittedDistance.current) {
      gameEventBus.emit("distance_reached", { distance: currentMeters });
      lastEmittedDistance.current = currentMeters;
    }
  }, [addScore]);

  const handleDamage = useCallback(() => {
    if (invincibleRef.current || assistInvincible) return;
    loseLife();
    shake(0.15, 0.2);
    hitStopRef.current = true;
    gameEventBus.emit("damage_taken", {} as Record<string, never>);
    invincibleRef.current = true;
    window.setTimeout(() => {
      invincibleRef.current = false;
    }, INVINCIBILITY_MS);
  }, [loseLife, shake, assistInvincible]);

  const handleCoinCollected = useCallback(() => {
    addCoin();
    sharedCoinPopup.current?.spawn(playerPosRef.current.x, playerPosRef.current.y + 1);
    gameEventBus.emit("coin_collected", {
      x: playerPosRef.current.x,
      y: playerPosRef.current.y,
      source: "placed",
    });
  }, [addCoin]);

  const handleHeartCollected = useCallback(() => {
    healLife();
    heartCollectedRef.current = true;
    if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    heartTimerRef.current = setTimeout(() => {
      heartCollectedRef.current = false;
    }, 50);
    gameEventBus.emit("heart_collected", {
      x: playerPosRef.current.x,
      y: playerPosRef.current.y,
    });
  }, [healLife]);

  const handleBlockHit = useCallback((blockName: string, blockPos: { x: number; y: number; z: number }) => {
    const blockType = blockName.replace("block-", "") as Exclude<BlockType, "empty">;

    if (blockType === "item_block") {
      const activated = chunkRef.current?.activateBlock(blockPos.x, blockPos.y, blockPos.z);
      if (activated) {
        shake(0.06, 0.1);
        const coinCount = 1 + Math.floor(Math.random() * 3);
        spawnDroppedCoins(blockPos.x, blockPos.y + 1, coinCount, ITEM_BLOCK_POP_VELOCITY);
        gameEventBus.emit("item_block_activated", {
          x: blockPos.x,
          y: blockPos.y,
          coinCount,
        });
      }
    } else if (BLOCK_PROPERTIES[blockType]?.destructible) {
      chunkRef.current?.destroyBlock(blockPos.x, blockPos.y, blockPos.z);
      shake(0.1, 0.12);
      gameEventBus.emit("block_destroyed", {
        x: blockPos.x,
        y: blockPos.y,
        blockType,
      });
      if (Math.random() < DROP_CHANCE) {
        const coinCount = 1 + Math.floor(Math.random() * 2);
        spawnDroppedCoins(blockPos.x, blockPos.y, coinCount, DROP_VELOCITY_Y);
      }
    }
  }, [spawnDroppedCoins, shake]);

  const handleDroppedCoinCollect = useCallback((coinId: string) => {
    addCoin();
    sharedCoinPopup.current?.spawn(playerPosRef.current.x, playerPosRef.current.y + 1);
    gameEventBus.emit("coin_collected", {
      x: playerPosRef.current.x,
      y: playerPosRef.current.y,
      source: "dropped",
    });
    setDroppedCoins(prev => prev.filter(c => c.id !== coinId));
  }, [addCoin]);

  const handleDroppedCoinExpire = useCallback((coinId: string) => {
    setDroppedCoins(prev => prev.filter(c => c.id !== coinId));
  }, []);

  // --- Enemy system callbacks (F43) ---
  const handleEnemiesUpdate = useCallback((enemies: EnemyChunkData[]) => {
    setChunkEnemies(
      enemies.map(e => ({
        id: `chunk-enemy-${e.x}-${e.y}`,
        subtype: e.subtype,
        x: e.x,
        y: e.y,
      }))
    );
  }, []);

  const handleEnemyDamage = useCallback(() => {
    handleDamage();
  }, [handleDamage]);

  const handleStompBounce = useCallback(() => {
    melRef.current?.stompBounce();
    shake(0.06, 0.1);
  }, [shake]);

  const handleEnemyCoinDrop = useCallback((x: number, y: number, count: number) => {
    spawnDroppedCoins(x, y, count, DROP_VELOCITY_Y);
  }, [spawnDroppedCoins]);

  const handleProjectileEnemyHit = useCallback((enemyName: string) => {
    enemyManagerRef.current?.onProjectileHitEnemy(enemyName);
  }, []);

  // Level mode enemies from sceneObjects
  const levelEnemies: EnemySpawnData[] = useMemo(() => {
    if (!sceneObjects?.enemies) return [];
    return sceneObjects.enemies.map(e => ({
      id: e.id,
      subtype: e.subtype,
      x: e.x,
      y: e.y,
    }));
  }, [sceneObjects]);

  // Pick the right enemy source
  const activeEnemies = levelData ? levelEnemies : chunkEnemies;

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

      {/* In infinite mode (no test/level), BiomeTransition handles Skybox+Lighting+BackgroundDecor
          with auto-cycling biomes. In other modes, only BackgroundDecor is rendered here
          (Skybox+Lighting come from SceneContent in Game3D). */}
      {isInfiniteMode ? (
        <BiomeTransition biomeState={biomeState} playerXRef={playerPosRef} />
      ) : (
        <BackgroundDecor theme={theme} playerXRef={playerPosRef} />
      )}

      <Mel
        ref={melRef}
        controlsRef={levelCompleting ? frozenControlsRef : controlsRef}
        onPositionUpdate={handlePositionUpdate}
        onCollisionDamage={handleDamage}
        invincible={invincibleRef.current}
        dead={lives <= 0}
        onAttackFrame={handleAttackFrame}
        onBarkFrame={handleBarkStart}
        onLookUp={setIsLookingUp}
        heartJustCollected={heartCollectedRef.current}
        stateRef={melStateRef}
        digActiveRef={digActiveRef}
        respawnPoint={gameMode === "level" ? respawnPoint : undefined}
        initialPosition={melInitialPosition}
      />

      <ProjectileManager
        controlsRef={controlsRef}
        playerPosRef={playerPosRef}
        facingRightRef={facingRightRef}
        onBlockHit={handleBlockHit}
        onEnemyHit={handleProjectileEnemyHit}
        onReturnCoinCollect={handleReturnCoinCollect}
        suppressNextShot={suppressNextShotRef}
      />

      <ChunkRenderer
        ref={chunkRef}
        playerPosRef={playerPosRef}
        onHeartCollected={handleHeartCollected}
        onCoinCollected={handleCoinCollected}
        onEnemiesUpdate={handleEnemiesUpdate}
        testChunks={effectiveChunks}
        baseSeed={baseSeed}
        biomeEnabled={isInfiniteMode}
      />

      <EnemyManager
        ref={enemyManagerRef}
        enemies={activeEnemies}
        playerPosRef={playerPosRef}
        onMelDamage={handleEnemyDamage}
        onMelStompBounce={handleStompBounce}
        onSpawnCoins={handleEnemyCoinDrop}
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

      {/* Bone entities from level data */}
      {boneEntities.map((b) => (
        <Bone
          key={b.id}
          position={[b.x, b.y, 0]}
          onCollect={() => handleBoneCollected(b.id)}
        />
      ))}

      {/* Sign entities from level data */}
      {signEntities.map((s, i) => (
        <Sign
          key={`sign-${s.x}-${s.y}-${i}`}
          position={[s.x, s.y, 0]}
          text={s.text}
          icon={s.icon}
        />
      ))}

      {/* Springs */}
      {springEntities.map((s, i) => (
        <Spring
          key={`spring-${s.x}-${s.y}-${i}`}
          position={[s.x, s.y, 0]}
          bounceForce={s.bounceForce}
          onBounce={handleSpringBounce}
        />
      ))}

      {/* Moving Platforms */}
      {movingPlatformEntities.map((mp, i) => (
        <MovingPlatform
          key={`platform-${mp.x}-${mp.y}-${i}`}
          position={[mp.x, mp.y, 0]}
          direction={mp.direction}
          speed={mp.speed}
          range={mp.range}
        />
      ))}

      {/* Spikes */}
      {spikesEntities.map((sp, i) => (
        <Spikes
          key={`spikes-${sp.x}-${sp.y}-${i}`}
          position={[sp.x, sp.y, 0]}
          facing={sp.facing}
          onDamage={handleDamage}
        />
      ))}

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

      {/* Custom signs from level data (Galeria do Rafa) */}
      {sceneObjects?.otherEntities
        .filter((e) => e.type === "sign" && e.props?.customAssetId)
        .map((e, i) => {
          const signAsset = sceneObjects.customAssets.find(
            (a) => a.id === (e.props?.customAssetId as string)
          );
          if (!signAsset) return null;
          return (
            <CustomSign
              key={`custom-sign-${e.x}-${e.y}-${i}`}
              position={[e.x, e.y, 0]}
              dataUri={signAsset.dataUri}
            />
          );
        })}

      <BarkSystem
        controlsRef={levelCompleting ? frozenControlsRef : controlsRef}
        playerPosRef={playerPosRef}
        onBarkWave={handleBarkWave}
        onBarkStart={handleBarkStart}
      />

      <SniffHighlight
        active={sniffActive}
        playerX={playerPosRef.current.x}
        playerY={playerPosRef.current.y}
        radius={8}
        highlightTargets={sniffTargets}
      />

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
// CustomSign -- Billboard sign with custom image (Galeria do Rafa)
// ---------------------------------------------------------------------------

function CustomSign({ position, dataUri }: { position: [number, number, number]; dataUri: string }) {
  const texture = useMemo(() => getCustomTexture(dataUri), [dataUri]);

  return (
    <group position={position}>
      {/* Sign face */}
      <mesh position={[0, 0.7, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>
      {/* Post */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#8B4513" roughness={1} />
      </mesh>
    </group>
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

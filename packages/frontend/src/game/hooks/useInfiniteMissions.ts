/**
 * useInfiniteMissions -- Hook that manages 3 active infinite-mode missions.
 *
 * Tracks progress via MissionTracker + GameEventBus, rewards coins on
 * completion, rotates completed missions, persists to localStorage,
 * and syncs via useProgressSync for registered users.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { gameEventBus } from "../systems/GameEventBus";
import { MissionTracker, type MissionStatus } from "../systems/MissionTracker";
import { useGameState } from "./useGameState";
import type { Mission } from "@super-mel/shared";

// ---------------------------------------------------------------------------
// Infinite mission pool
// ---------------------------------------------------------------------------

interface InfinitePoolMission extends Mission {
  reward: number;
  xp: number;
}

const INFINITE_MISSION_POOL: InfinitePoolMission[] = [
  {
    id: "inf-coins-20",
    description: "Colete 20 moedas",
    condition: { type: "collect_coins", params: { count: 20 } },
    reward: 10,
    xp: 50,
  },
  {
    id: "inf-coins-50",
    description: "Colete 50 moedas",
    condition: { type: "collect_coins", params: { count: 50 } },
    reward: 25,
    xp: 100,
  },
  {
    id: "inf-blocks-10",
    description: "Quebre 10 blocos",
    condition: { type: "break_blocks", params: { count: 10 } },
    reward: 15,
    xp: 75,
  },
  {
    id: "inf-blocks-20",
    description: "Quebre 20 blocos",
    condition: { type: "break_blocks", params: { count: 20 } },
    reward: 30,
    xp: 100,
  },
  {
    id: "inf-dist-100",
    description: "Chegue a 100m",
    condition: { type: "reach_distance", params: { meters: 100 } },
    reward: 15,
    xp: 75,
  },
  {
    id: "inf-dist-300",
    description: "Chegue a 300m",
    condition: { type: "reach_distance", params: { meters: 300 } },
    reward: 40,
    xp: 150,
  },
  {
    id: "inf-djump-10",
    description: "Faca 10 pulos duplos",
    condition: { type: "double_jump_count", params: { count: 10 } },
    reward: 20,
    xp: 100,
  },
  {
    id: "inf-no-dmg-100",
    description: "100m sem dano",
    condition: { type: "no_damage_distance", params: { meters: 100 } },
    reward: 30,
    xp: 125,
  },
  {
    id: "inf-no-dmg-200",
    description: "200m sem dano",
    condition: { type: "no_damage_distance", params: { meters: 200 } },
    reward: 50,
    xp: 200,
  },
  {
    id: "inf-wood-15",
    description: "Quebre 15 blocos de madeira",
    condition: { type: "break_blocks", params: { blockType: "wood", count: 15 } },
    reward: 25,
    xp: 100,
  },
];

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "supermel_infinite_missions";
const XP_PER_LEVEL = 500;

interface InfiniteMissionsState {
  activeMissionIds: string[];
  completedIds: string[];
  melXp: number;
  melLevel: number;
}

function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function xpToNext(xp: number): number {
  return XP_PER_LEVEL - (xp % XP_PER_LEVEL);
}

function loadState(): InfiniteMissionsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as InfiniteMissionsState;
      if (
        Array.isArray(parsed.activeMissionIds) &&
        Array.isArray(parsed.completedIds) &&
        typeof parsed.melXp === "number"
      ) {
        return {
          ...parsed,
          melLevel: calculateLevel(parsed.melXp),
        };
      }
    }
  } catch {
    // corrupted -- fall through
  }
  return initState();
}

function initState(): InfiniteMissionsState {
  // Pick 3 random missions from pool
  const shuffled = [...INFINITE_MISSION_POOL].sort(() => Math.random() - 0.5);
  const ids = shuffled.slice(0, 3).map((m) => m.id);
  const state: InfiniteMissionsState = {
    activeMissionIds: ids,
    completedIds: [],
    melXp: 0,
    melLevel: 1,
  };
  saveState(state);
  return state;
}

function saveState(state: InfiniteMissionsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

function getPoolMission(id: string): InfinitePoolMission | undefined {
  return INFINITE_MISSION_POOL.find((m) => m.id === id);
}

function pickNextMission(excludeIds: string[]): InfinitePoolMission {
  const available = INFINITE_MISSION_POOL.filter((m) => !excludeIds.includes(m.id));
  if (available.length === 0) {
    // All exhausted -- pick random from full pool (recycling)
    return INFINITE_MISSION_POOL[Math.floor(Math.random() * INFINITE_MISSION_POOL.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseInfiniteMissionsResult {
  activeMissions: MissionStatus[];
  melLevel: number;
  melXp: number;
  xpToNextLevel: number;
}

export function useInfiniteMissions(active: boolean): UseInfiniteMissionsResult {
  const trackerRef = useRef<MissionTracker | null>(null);
  const persistRef = useRef<InfiniteMissionsState>(loadState());
  const [activeMissions, setActiveMissions] = useState<MissionStatus[]>([]);
  const [melXp, setMelXp] = useState(persistRef.current.melXp);
  const completedThisRunRef = useRef<Set<string>>(new Set());

  const getMissions = useCallback((): Mission[] => {
    return persistRef.current.activeMissionIds
      .map((id) => getPoolMission(id))
      .filter((m): m is InfinitePoolMission => m !== undefined);
  }, []);

  useEffect(() => {
    if (!active) {
      trackerRef.current = null;
      setActiveMissions([]);
      return;
    }

    // Reload persisted state at the start of each run
    persistRef.current = loadState();
    completedThisRunRef.current = new Set();
    setMelXp(persistRef.current.melXp);

    const missions = getMissions();
    const tracker = new MissionTracker(missions);
    trackerRef.current = tracker;

    // Helper: check completion and handle rewards/rotation
    const checkCompletion = () => {
      if (!trackerRef.current) return;
      const statuses = trackerRef.current.getStatus();
      setActiveMissions([...statuses]);

      for (const ms of statuses) {
        if (ms.completed && !completedThisRunRef.current.has(ms.mission.id)) {
          completedThisRunRef.current.add(ms.mission.id);
          const poolMission = getPoolMission(ms.mission.id);
          if (!poolMission) continue;

          // Award coins
          const state = useGameState.getState();
          for (let i = 0; i < poolMission.reward; i++) {
            state.addCoin();
          }

          // Award XP
          persistRef.current.melXp += poolMission.xp;
          persistRef.current.melLevel = calculateLevel(persistRef.current.melXp);
          setMelXp(persistRef.current.melXp);

          // Update melLevel in game state for menu display
          useGameState.setState({ melLevel: persistRef.current.melLevel });

          // Mark completed
          if (!persistRef.current.completedIds.includes(ms.mission.id)) {
            persistRef.current.completedIds.push(ms.mission.id);
          }

          // Rotate: replace this mission with a new one from pool
          const next = pickNextMission([
            ...persistRef.current.activeMissionIds,
            ...persistRef.current.completedIds,
          ]);
          const idx = persistRef.current.activeMissionIds.indexOf(ms.mission.id);
          if (idx >= 0) {
            persistRef.current.activeMissionIds[idx] = next.id;
          }

          // Save
          saveState(persistRef.current);

          // Emit event for MissionToast
          gameEventBus.emit("mission_completed", {
            mission: ms.mission,
            reward: poolMission.reward,
          });

          // Recreate tracker with updated missions
          const newMissions = getMissions();
          const newTracker = new MissionTracker(newMissions);
          trackerRef.current = newTracker;
          setActiveMissions(newTracker.getStatus());
        }
      }
    };

    // Subscribe to GameEventBus
    const unsubs = [
      gameEventBus.on("coin_collected", () => {
        trackerRef.current?.onCoinCollected();
        checkCompletion();
      }),
      gameEventBus.on("block_destroyed", (d) => {
        trackerRef.current?.onBlockDestroyed(d.blockType);
        checkCompletion();
      }),
      gameEventBus.on("damage_taken", () => {
        trackerRef.current?.onDamageTaken();
        checkCompletion();
      }),
      gameEventBus.on("heart_collected", () => {
        trackerRef.current?.onHeartCollected();
        checkCompletion();
      }),
      gameEventBus.on("bone_collected", () => {
        trackerRef.current?.onBoneCollected();
        checkCompletion();
      }),
      gameEventBus.on("distance_reached", (d) => {
        trackerRef.current?.onDistanceReached(d.distance);
        checkCompletion();
      }),
      gameEventBus.on("double_jump", () => {
        trackerRef.current?.onDoubleJump();
        checkCompletion();
      }),
      gameEventBus.on("stomp_enemy", () => {
        trackerRef.current?.onEnemyStomped();
        checkCompletion();
      }),
    ];

    // Time tick for elapsed-based missions
    let lastTime = performance.now();
    let rafId: number;
    const tickTime = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      trackerRef.current?.onTimeTick(delta);
      checkCompletion();
      rafId = requestAnimationFrame(tickTime);
    };
    rafId = requestAnimationFrame(tickTime);

    // Initial status
    setActiveMissions(tracker.getStatus());

    return () => {
      unsubs.forEach((fn) => fn());
      cancelAnimationFrame(rafId);
      // Save on unmount
      saveState(persistRef.current);
    };
  }, [active, getMissions]);

  return {
    activeMissions,
    melLevel: calculateLevel(melXp),
    melXp,
    xpToNextLevel: xpToNext(melXp),
  };
}

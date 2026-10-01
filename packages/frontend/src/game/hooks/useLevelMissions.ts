/**
 * useLevelMissions -- Hook that reads LevelDataV2.missions[],
 * creates a MissionTracker, subscribes to GameEventBus, and
 * exposes mission completion state for LevelClearOverlay.
 */

import { useEffect, useRef, useState } from "react";
import { gameEventBus } from "../systems/GameEventBus";
import { MissionTracker, type MissionStatus } from "../systems/MissionTracker";
import type { Mission } from "@super-mel/shared";

export interface UseLevelMissionsResult {
  missions: MissionStatus[];
  allComplete: boolean;
}

export function useLevelMissions(
  levelMissions: Mission[] | undefined,
  active: boolean,
): UseLevelMissionsResult {
  const trackerRef = useRef<MissionTracker | null>(null);
  const [status, setStatus] = useState<MissionStatus[]>([]);
  const lastStatusRef = useRef<MissionStatus[]>([]);

  useEffect(() => {
    if (!active || !levelMissions?.length) {
      trackerRef.current = null;
      setStatus([]);
      lastStatusRef.current = [];
      return;
    }

    const tracker = new MissionTracker(levelMissions);
    trackerRef.current = tracker;

    // Helper: check if any mission newly completed and emit toast event
    const checkCompletion = () => {
      const newStatus = tracker.getStatus();
      const prevStatus = lastStatusRef.current;
      for (let i = 0; i < newStatus.length; i++) {
        if (newStatus[i].completed && !prevStatus[i]?.completed) {
          gameEventBus.emit("mission_completed", {
            mission: newStatus[i].mission,
            reward: 0, // level missions reward on result screen, not mid-game
          });
        }
      }
      lastStatusRef.current = newStatus;
      setStatus(newStatus);
    };

    // Subscribe to GameEventBus
    const unsubs = [
      gameEventBus.on("coin_collected", () => {
        tracker.onCoinCollected();
        checkCompletion();
      }),
      gameEventBus.on("block_destroyed", (d) => {
        tracker.onBlockDestroyed(d.blockType);
        checkCompletion();
      }),
      gameEventBus.on("damage_taken", () => {
        tracker.onDamageTaken();
        checkCompletion();
      }),
      gameEventBus.on("heart_collected", () => {
        tracker.onHeartCollected();
        checkCompletion();
      }),
      gameEventBus.on("bone_collected", () => {
        tracker.onBoneCollected();
        checkCompletion();
      }),
      gameEventBus.on("distance_reached", (d) => {
        tracker.onDistanceReached(d.distance);
        checkCompletion();
      }),
      gameEventBus.on("double_jump", () => {
        tracker.onDoubleJump();
        checkCompletion();
      }),
      gameEventBus.on("stomp_enemy", () => {
        tracker.onEnemyStomped();
        checkCompletion();
      }),
      // level_complete: snapshot final status
      gameEventBus.on("level_complete", () => {
        tracker.onTimeTick(0); // ensure elapsed is up to date
        const finalStatus = tracker.getStatus();
        lastStatusRef.current = finalStatus;
        setStatus(finalStatus);
      }),
    ];

    // Time tick: use a RAF loop to feed elapsed time
    let lastTime = performance.now();
    let rafId: number;
    const tickTime = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      tracker.onTimeTick(delta);
      // Check time-based missions periodically (every time tick)
      checkCompletion();
      rafId = requestAnimationFrame(tickTime);
    };
    rafId = requestAnimationFrame(tickTime);

    return () => {
      unsubs.forEach((fn) => fn());
      cancelAnimationFrame(rafId);
      // Snapshot final status on cleanup
      if (trackerRef.current) {
        const finalStatus = trackerRef.current.getStatus();
        lastStatusRef.current = finalStatus;
        setStatus(finalStatus);
      }
    };
  }, [active, levelMissions]);

  const allComplete = status.length > 0 && status.every((s) => s.completed);

  return { missions: status, allComplete };
}

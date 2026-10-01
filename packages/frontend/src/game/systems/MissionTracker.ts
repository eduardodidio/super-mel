/**
 * MissionTracker -- Pure-logic mission evaluation engine.
 *
 * Accumulates gameplay event counters and evaluates Mission conditions.
 * NO React or Zustand dependencies. Shared by level and infinite mission hooks.
 */

import type { Mission } from "@super-mel/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventCounters {
  coinsCollected: number;
  blocksDestroyed: number;
  blocksDestroyedByType: Record<string, number>;
  damageTaken: number;
  heartsCollected: number;
  bonesCollected: number;
  distanceReached: number;
  flyTimeSeconds: number;          // DEPRECATED (F53): kept for type compat, always 0
  doubleJumpsPerformed: number;
  enemiesStomped: number;
  elapsedSeconds: number;
}

export interface MissionStatus {
  mission: Mission;
  completed: boolean;
  progress: number;     // 0.0 to 1.0
  progressText: string; // e.g. "15/30" or "42s/60s"
}

// ---------------------------------------------------------------------------
// MissionTracker
// ---------------------------------------------------------------------------

function emptyCounters(): EventCounters {
  return {
    coinsCollected: 0,
    blocksDestroyed: 0,
    blocksDestroyedByType: {},
    damageTaken: 0,
    heartsCollected: 0,
    bonesCollected: 0,
    distanceReached: 0,
    flyTimeSeconds: 0,
    doubleJumpsPerformed: 0,
    enemiesStomped: 0,
    elapsedSeconds: 0,
  };
}

export class MissionTracker {
  private counters: EventCounters;
  private missions: Mission[];

  constructor(missions: Mission[]) {
    this.missions = missions;
    this.counters = emptyCounters();
  }

  // ---- Event feed methods ----

  onCoinCollected(): void {
    this.counters.coinsCollected++;
  }

  onBlockDestroyed(blockType: string): void {
    this.counters.blocksDestroyed++;
    this.counters.blocksDestroyedByType[blockType] =
      (this.counters.blocksDestroyedByType[blockType] || 0) + 1;
  }

  onDamageTaken(): void {
    this.counters.damageTaken++;
  }

  onHeartCollected(): void {
    this.counters.heartsCollected++;
  }

  onBoneCollected(): void {
    this.counters.bonesCollected++;
  }

  onDistanceReached(distance: number): void {
    if (distance > this.counters.distanceReached) {
      this.counters.distanceReached = distance;
    }
  }

  onFlyTick(deltaSeconds: number): void {
    this.counters.flyTimeSeconds += deltaSeconds;
  }

  onDoubleJump(): void {
    this.counters.doubleJumpsPerformed++;
  }

  onEnemyStomped(): void {
    this.counters.enemiesStomped++;
  }

  onTimeTick(deltaSeconds: number): void {
    this.counters.elapsedSeconds += deltaSeconds;
  }

  // ---- Query methods ----

  getStatus(): MissionStatus[] {
    return this.missions.map((m) => this.evaluate(m));
  }

  reset(): void {
    this.counters = emptyCounters();
  }

  getCounters(): Readonly<EventCounters> {
    return this.counters;
  }

  // ---- Internal evaluation ----

  private evaluate(mission: Mission): MissionStatus {
    const condition = mission.condition;
    if (!condition || !condition.type) {
      return { mission, completed: false, progress: 0, progressText: "???" };
    }

    const { type, params } = condition;
    const c = this.counters;

    switch (type) {
      case "collect_coins": {
        const target = (params.count as number) || 1;
        return {
          mission,
          completed: c.coinsCollected >= target,
          progress: Math.min(1, c.coinsCollected / target),
          progressText: `${c.coinsCollected}/${target}`,
        };
      }

      case "no_damage":
        return {
          mission,
          completed: c.damageTaken === 0,
          progress: c.damageTaken === 0 ? 1 : 0,
          progressText: c.damageTaken === 0 ? "Sem dano!" : `${c.damageTaken} dano(s)`,
        };

      case "find_bone":
        return {
          mission,
          completed: c.bonesCollected > 0,
          progress: c.bonesCollected > 0 ? 1 : 0,
          progressText: c.bonesCollected > 0 ? "Encontrado!" : "0/1",
        };

      case "time_limit": {
        const target = (params.seconds as number) || 60;
        return {
          mission,
          completed: c.elapsedSeconds <= target,
          progress: Math.min(1, Math.max(0, 1 - c.elapsedSeconds / target)),
          progressText: `${Math.floor(c.elapsedSeconds)}s/${target}s`,
        };
      }

      case "break_blocks": {
        const target = (params.count as number) || 1;
        const blockType = params.blockType as string | undefined;
        const actual = blockType
          ? (c.blocksDestroyedByType[blockType] || 0)
          : c.blocksDestroyed;
        return {
          mission,
          completed: actual >= target,
          progress: Math.min(1, actual / target),
          progressText: `${actual}/${target}`,
        };
      }

      case "fly_duration": {
        // DEPRECATED (F53): fly mechanic removed
        return {
          mission,
          completed: false,
          progress: 0,
          progressText: "0/0",
        };
      }

      case "double_jump_count": {
        const target = (params.count as number) || 10;
        return {
          mission,
          completed: c.doubleJumpsPerformed >= target,
          progress: Math.min(1, c.doubleJumpsPerformed / target),
          progressText: `${c.doubleJumpsPerformed}/${target}`,
        };
      }

      case "reach_distance": {
        const target = (params.meters as number) || 100;
        return {
          mission,
          completed: c.distanceReached >= target,
          progress: Math.min(1, c.distanceReached / target),
          progressText: `${Math.floor(c.distanceReached)}/${target}m`,
        };
      }

      case "no_damage_distance": {
        const target = (params.meters as number) || 100;
        const valid = c.damageTaken === 0;
        return {
          mission,
          completed: valid && c.distanceReached >= target,
          progress: valid ? Math.min(1, c.distanceReached / target) : 0,
          progressText: valid
            ? `${Math.floor(c.distanceReached)}/${target}m`
            : "Dano tomado!",
        };
      }

      case "stomp_enemies": {
        const target = (params.count as number) || 1;
        return {
          mission,
          completed: c.enemiesStomped >= target,
          progress: Math.min(1, c.enemiesStomped / target),
          progressText: `${c.enemiesStomped}/${target}`,
        };
      }

      default:
        return { mission, completed: false, progress: 0, progressText: "???" };
    }
  }
}

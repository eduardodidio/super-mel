/**
 * GameEventBus -- Typed event emitter for gameplay events.
 *
 * Module-level singleton. GameScene3D emits events; mission hooks subscribe.
 * No external dependencies.
 */

import type { Mission } from "@super-mel/shared";

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export interface GameEvents {
  run_start: { mode: "level" | "infinite"; levelId?: string };
  run_end: { mode: "level" | "infinite" };
  coin_collected: { x: number; y: number; source: "placed" | "dropped" | "item_block" | "return" };
  block_destroyed: { x: number; y: number; blockType: string };
  damage_taken: Record<string, never>;
  heart_collected: { x: number; y: number };
  bone_collected: { x: number; y: number };
  distance_reached: { distance: number };
  // DEPRECATED (F53): fly mechanic removed. Kept for type compat.
  fly_tick: { deltaSeconds: number; continuous: boolean };
  double_jump: Record<string, never>;
  stomp_enemy: { enemyType?: string };
  level_complete: { levelId: string; timeSeconds: number; coins: number; deaths: number };
  item_block_activated: { x: number; y: number; coinCount: number };
  mission_completed: { mission: Mission; reward: number };
}

// ---------------------------------------------------------------------------
// EventBus implementation
// ---------------------------------------------------------------------------

type Listener<T> = (data: T) => void;

class EventBus<Events extends { [K in keyof Events]: unknown }> {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<K extends keyof Events & string>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    return () => {
      this.listeners.get(event)?.delete(listener as Listener<unknown>);
    };
  }

  emit<K extends keyof Events & string>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  reset(): void {
    this.listeners.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const gameEventBus = new EventBus<GameEvents>();

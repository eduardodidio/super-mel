import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useGameFrame } from "../hooks/useGameFrame";
import { EnemyVacuum } from "../entities/EnemyVacuum";
import { EnemyPigeon } from "../entities/EnemyPigeon";
import { EnemyBee } from "../entities/EnemyBee";

// --- Types ---

export interface EnemySpawnData {
  id: string;
  subtype: "vacuum" | "pigeon" | "bee";
  x: number;
  y: number;
}

export interface EnemyManagerHandle {
  onProjectileHitEnemy: (enemyName: string) => void;
}

interface EnemyManagerProps {
  enemies: EnemySpawnData[];
  playerPosRef: React.RefObject<{ x: number; y: number }>;
  onMelDamage: () => void;
  onMelStompBounce: () => void;
  onSpawnCoins: (x: number, y: number, count: number) => void;
}

// --- Coin drop counts by subtype ---

function getCoinDropCount(subtype: "vacuum" | "pigeon" | "bee"): number {
  switch (subtype) {
    case "vacuum":
      return 1 + Math.floor(Math.random() * 2); // 1-2
    case "pigeon":
      return 2 + Math.floor(Math.random() * 2); // 2-3
    case "bee":
      return 2 + Math.floor(Math.random() * 2); // 2-3
  }
}

// --- Distance culling threshold ---
const CULL_DISTANCE = 30;

// --- Defeat cleanup delay (ms) ---
const DEFEAT_CLEANUP_MS = 800;

// --- Component ---

export const EnemyManager = forwardRef<EnemyManagerHandle, EnemyManagerProps>(
  function EnemyManager({ enemies, playerPosRef, onMelDamage, onMelStompBounce, onSpawnCoins }, ref) {
    // Track defeated enemies across chunk reloads
    const destroyedEnemies = useRef(new Set<string>());

    // Active enemy state: map of id -> { defeated, defeatTime, data }
    const [activeEnemies, setActiveEnemies] = useState<
      Map<string, { data: EnemySpawnData; defeated: boolean; defeatTime: number }>
    >(new Map());

    // Keep the map in sync with the enemies prop
    const lastEnemyIdsRef = useRef<string>("");
    const currentEnemyIds = enemies.map(e => e.id).sort().join(",");

    if (currentEnemyIds !== lastEnemyIdsRef.current) {
      lastEnemyIdsRef.current = currentEnemyIds;
      setActiveEnemies(prev => {
        const next = new Map(prev);
        const newIds = new Set(enemies.map(e => e.id));

        // Add new enemies (if not already defeated)
        for (const enemy of enemies) {
          if (!next.has(enemy.id) && !destroyedEnemies.current.has(enemy.id)) {
            next.set(enemy.id, { data: enemy, defeated: false, defeatTime: 0 });
          }
        }

        // Remove enemies no longer in the prop list
        for (const [id] of next) {
          if (!newIds.has(id)) {
            next.delete(id);
          }
        }

        return next;
      });
    }

    // --- Defeat an enemy (shared logic for stomp and projectile) ---
    const defeatEnemy = useCallback((enemyId: string) => {
      setActiveEnemies(prev => {
        const entry = prev.get(enemyId);
        if (!entry || entry.defeated) return prev;

        const next = new Map(prev);
        next.set(enemyId, { ...entry, defeated: true, defeatTime: performance.now() });
        destroyedEnemies.current.add(enemyId);

        // Coin drop
        const count = getCoinDropCount(entry.data.subtype);
        // Use setTimeout to avoid calling during render
        setTimeout(() => {
          onSpawnCoins(entry.data.x, entry.data.y, count);
        }, 0);

        return next;
      });
    }, [onSpawnCoins]);

    // --- Contact handler ---
    const handleContactMel = useCallback((enemyId: string, isStompable: boolean) => {
      if (isStompable) {
        defeatEnemy(enemyId);
        onMelStompBounce();
      } else {
        onMelDamage();
      }
    }, [defeatEnemy, onMelStompBounce, onMelDamage]);

    // --- Projectile hit handler (exposed via ref) ---
    const handleProjectileHit = useCallback((enemyName: string) => {
      // Parse enemy ID from rigid body name: "enemy-{subtype}-{id}"
      // The name format is enemy-vacuum-xxx, enemy-pigeon-xxx, enemy-bee-xxx
      // We need to find which active enemy matches
      // The id stored in the name is the id we passed as the prop
      const parts = enemyName.split("-");
      // parts[0]="enemy", parts[1]="vacuum"|"pigeon"|"bee", rest is the id
      if (parts.length >= 3) {
        const enemyId = parts.slice(2).join("-");
        defeatEnemy(enemyId);
      }
    }, [defeatEnemy]);

    useImperativeHandle(ref, () => ({
      onProjectileHitEnemy: handleProjectileHit,
    }));

    // --- Cleanup defeated enemies after animation ---
    useGameFrame(() => {
      const now = performance.now();
      setActiveEnemies(prev => {
        let changed = false;
        const next = new Map(prev);
        for (const [id, entry] of next) {
          if (entry.defeated && entry.defeatTime > 0 && now - entry.defeatTime > DEFEAT_CLEANUP_MS) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });

    // --- Render enemies (with distance culling) ---
    const playerX = playerPosRef.current?.x ?? 0;
    const rendered: React.ReactElement[] = [];

    for (const [, entry] of activeEnemies) {
      const { data, defeated: isDefeated } = entry;
      const dist = Math.abs(data.x - playerX);

      // Distance culling (but always render defeated enemies so animation plays)
      if (dist > CULL_DISTANCE && !isDefeated) continue;

      const pos: [number, number, number] = [data.x, data.y, 0];

      switch (data.subtype) {
        case "vacuum":
          rendered.push(
            <EnemyVacuum
              key={data.id}
              id={data.id}
              position={pos}
              onContactMel={handleContactMel}
              defeated={isDefeated}
            />
          );
          break;
        case "pigeon":
          rendered.push(
            <EnemyPigeon
              key={data.id}
              id={data.id}
              position={pos}
              onContactMel={handleContactMel}
              defeated={isDefeated}
            />
          );
          break;
        case "bee":
          rendered.push(
            <EnemyBee
              key={data.id}
              id={data.id}
              position={pos}
              playerPosRef={playerPosRef}
              onContactMel={handleContactMel}
              defeated={isDefeated}
            />
          );
          break;
      }
    }

    return <>{rendered}</>;
  }
);

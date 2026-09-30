import { useEffect, useRef } from "react";
import { useGameState } from "./useGameState";

const DEBOUNCE_MS = 2000;
const FLUSH_SCENES = ["gameover", "menu"]; // flush immediately on these scene changes

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getAuthToken(): string | null {
  return localStorage.getItem("supermel_token");
}

function isGuest(): boolean {
  const token = getAuthToken();
  const playerId = localStorage.getItem("supermel_player_id") || "";
  return !token || playerId.startsWith("local-");
}

// ---------------------------------------------------------------------------
// API helpers (fire-and-forget, errors are silenced)
// ---------------------------------------------------------------------------

async function fetchProgress(
  token: string
): Promise<{ totalCoins: number; data: Record<string, unknown> } | null> {
  try {
    const res = await fetch("/api/progress", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function putProgress(
  token: string,
  payload: { totalCoins: number; data?: Record<string, unknown> }
): Promise<void> {
  try {
    await fetch("/api/progress", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silently fail -- localStorage remains source of truth for resilience
  }
}

// ---------------------------------------------------------------------------
// Exported flush helper (called externally, e.g. on logout)
// ---------------------------------------------------------------------------

/**
 * Immediately sync current totalCoins to the backend.
 * No-op for guests. Safe to call anywhere (fire-and-forget).
 */
export function flushProgress(): void {
  if (isGuest()) return;
  const token = getAuthToken();
  if (!token) return;
  const state = useGameState.getState();
  putProgress(token, { totalCoins: state.totalCoins });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useProgressSync -- side-effect-only hook.
 *
 * For registered (non-guest) players:
 *   1. On mount: loads progress from backend, resolves conflicts with
 *      localStorage via Math.max.
 *   2. Subscribes to Zustand: debounces PUT calls when totalCoins changes.
 *   3. Flushes immediately when the scene changes to gameover or menu.
 *
 * For guests: complete no-op (no network calls).
 *
 * Extension notes for future mutations:
 *   When adding new progress fields (levelsCleared, achievements, etc.),
 *   include them in the subscribe callback and pass them in the `data`
 *   field of putProgress. The backend merges arrays via set-union and
 *   objects via shallow overwrite.
 */
export function useProgressSync() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedCoins = useRef<number>(-1);

  // 1. Load progress from backend on mount (registered users only)
  useEffect(() => {
    if (isGuest()) return;
    const token = getAuthToken();
    if (!token) return;

    fetchProgress(token).then((progress) => {
      if (!progress) return;
      const state = useGameState.getState();

      // Conflict resolution: take the max to avoid data loss
      const backendCoins = progress.totalCoins;
      const localCoins = state.totalCoins;
      const resolvedCoins = Math.max(backendCoins, localCoins);

      if (resolvedCoins !== state.totalCoins) {
        useGameState.setState({ totalCoins: resolvedCoins });
        try {
          localStorage.setItem("supermel_total_coins", String(resolvedCoins));
        } catch {
          // localStorage quota or access error -- ignore
        }
      }

      // If local had more, push the higher value to backend
      if (localCoins > backendCoins) {
        putProgress(token, { totalCoins: localCoins });
      }

      lastSyncedCoins.current = resolvedCoins;
    });
  }, []);

  // 2. Subscribe to totalCoins changes and debounce writes
  useEffect(() => {
    if (isGuest()) return;

    const unsubscribe = useGameState.subscribe((state, prevState) => {
      // Only sync when totalCoins actually changes
      if (state.totalCoins === prevState.totalCoins) return;
      if (state.totalCoins === lastSyncedCoins.current) return;

      const token = getAuthToken();
      if (!token) return;

      // Clear previous debounce timer
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const current = useGameState.getState();
        lastSyncedCoins.current = current.totalCoins;
        putProgress(token, { totalCoins: current.totalCoins });
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 3. Flush immediately on critical scene changes (gameover, menu)
  useEffect(() => {
    if (isGuest()) return;

    const unsubscribe = useGameState.subscribe((state, prevState) => {
      if (state.scene === prevState.scene) return;
      if (!FLUSH_SCENES.includes(state.scene)) return;

      const token = getAuthToken();
      if (!token) return;

      // Cancel pending debounce and flush now
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const current = useGameState.getState();
      if (current.totalCoins !== lastSyncedCoins.current) {
        lastSyncedCoins.current = current.totalCoins;
        putProgress(token, { totalCoins: current.totalCoins });
      }
    });

    return () => unsubscribe();
  }, []);
}

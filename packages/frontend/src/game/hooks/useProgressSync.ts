import { useEffect, useRef } from "react";
import { useGameState } from "./useGameState";

const DEBOUNCE_MS = 2000;
const FLUSH_SCENES = ["gameover", "menu", "worldmap", "levelclear"]; // flush immediately on these scene changes

// ---------------------------------------------------------------------------
// Campaign progress types and merge logic (F49)
// ---------------------------------------------------------------------------

interface CampaignProgress {
  levelsCleared: string[];
  stars: Record<string, number>;
  bones: Record<string, number>;
}

function getLocalCampaignProgress(): CampaignProgress {
  try {
    const raw = localStorage.getItem("supermel_campaign_progress");
    if (raw) return JSON.parse(raw) as CampaignProgress;
  } catch { /* ignore */ }
  return { levelsCleared: [], stars: {}, bones: {} };
}

function mergeCampaignProgress(a: CampaignProgress, b: CampaignProgress): CampaignProgress {
  const levelsCleared = [...new Set([...a.levelsCleared, ...b.levelsCleared])];
  const stars: Record<string, number> = { ...a.stars };
  const bones: Record<string, number> = { ...a.bones };

  for (const [key, val] of Object.entries(b.stars)) {
    stars[key] = Math.max(stars[key] ?? 0, val);
  }
  for (const [key, val] of Object.entries(b.bones)) {
    bones[key] = Math.max(bones[key] ?? 0, val);
  }

  return { levelsCleared, stars, bones };
}

function campaignNeedsSync(backend: CampaignProgress, merged: CampaignProgress): boolean {
  if (merged.levelsCleared.length > backend.levelsCleared.length) return true;
  for (const key of Object.keys(merged.stars)) {
    if ((merged.stars[key] ?? 0) > (backend.stars[key] ?? 0)) return true;
  }
  for (const key of Object.keys(merged.bones)) {
    if ((merged.bones[key] ?? 0) > (backend.bones[key] ?? 0)) return true;
  }
  return false;
}

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
// Helper: build data payload with optional extras
// ---------------------------------------------------------------------------

function buildDataPayload(): Record<string, unknown> | undefined {
  const data: Record<string, unknown> = {};

  // Infinite missions
  const infData = localStorage.getItem("supermel_infinite_missions");
  if (infData) {
    try {
      data.infiniteMissions = JSON.parse(infData);
    } catch { /* ignore */ }
  }

  // Campaign progress
  const campaignRaw = localStorage.getItem("supermel_campaign_progress");
  if (campaignRaw) {
    try {
      data.campaign = JSON.parse(campaignRaw);
    } catch { /* ignore */ }
  }

  return Object.keys(data).length > 0 ? data : undefined;
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
 * Immediately sync current totalCoins + campaign progress to the backend.
 * No-op for guests. Safe to call anywhere (fire-and-forget).
 */
export function flushProgress(): void {
  if (isGuest()) return;
  const token = getAuthToken();
  if (!token) return;
  const state = useGameState.getState();

  putProgress(token, {
    totalCoins: state.totalCoins,
    data: buildDataPayload(),
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useProgressSync -- side-effect-only hook.
 *
 * For registered (non-guest) players:
 *   1. On mount: loads progress from backend, resolves conflicts with
 *      localStorage via Math.max. Also merges campaign progress (F49).
 *   2. Subscribes to Zustand: debounces PUT calls when totalCoins changes.
 *   3. Flushes immediately when the scene changes to gameover, menu,
 *      worldmap, or levelclear.
 *
 * For guests: complete no-op (no network calls).
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

      // Merge infinite missions data from backend if available
      const backendInfMissions = progress.data?.infiniteMissions;
      if (backendInfMissions && typeof backendInfMissions === "object") {
        const localInfRaw = localStorage.getItem("supermel_infinite_missions");
        if (!localInfRaw) {
          // No local data -- use backend data
          try {
            localStorage.setItem("supermel_infinite_missions", JSON.stringify(backendInfMissions));
          } catch { /* ignore */ }
        }
      }

      // Merge campaign progress from backend (F49)
      const backendCampaign = (progress.data?.campaign as CampaignProgress | undefined) ?? {
        levelsCleared: [],
        stars: {},
        bones: {},
      };
      const localCampaign = getLocalCampaignProgress();
      const mergedCampaign = mergeCampaignProgress(backendCampaign, localCampaign);

      // Write merged back to localStorage
      try {
        localStorage.setItem("supermel_campaign_progress", JSON.stringify(mergedCampaign));
      } catch { /* ignore */ }

      // If local had data not in backend, push to backend
      if (campaignNeedsSync(backendCampaign, mergedCampaign)) {
        putProgress(token, {
          totalCoins: resolvedCoins,
          data: { campaign: mergedCampaign },
        });
      }
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

        putProgress(token, {
          totalCoins: current.totalCoins,
          data: buildDataPayload(),
        });
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 3. Flush immediately on critical scene changes
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
      lastSyncedCoins.current = current.totalCoins;

      putProgress(token, {
        totalCoins: current.totalCoins,
        data: buildDataPayload(),
      });
    });

    return () => unsubscribe();
  }, []);
}

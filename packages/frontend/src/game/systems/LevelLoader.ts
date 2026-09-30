import { migrateLevelData } from "@super-mel/shared";
import type { LevelDataV2 } from "@super-mel/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignManifest {
  levels: CampaignLevelMeta[];
}

export interface CampaignLevelMeta {
  id: string;       // e.g. "1-1"
  name: string;     // e.g. "Quintal da Mel"
  file: string;     // e.g. "1-1.json"
  theme: string;    // e.g. "forest"
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const levelCache = new Map<string, LevelDataV2>();
let manifestCache: CampaignManifest | null = null;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function loadCampaignManifest(): Promise<CampaignManifest> {
  if (manifestCache) return manifestCache;
  const res = await fetch("/levels/campaign/manifest.json");
  if (!res.ok) throw new Error("Failed to load campaign manifest");
  manifestCache = (await res.json()) as CampaignManifest;
  return manifestCache;
}

export async function loadCampaignLevel(fileOrId: string): Promise<LevelDataV2> {
  if (levelCache.has(fileOrId)) return levelCache.get(fileOrId)!;
  const file = fileOrId.endsWith(".json") ? fileOrId : `${fileOrId}.json`;
  const res = await fetch(`/levels/campaign/${file}`);
  if (!res.ok) throw new Error(`Failed to load level: ${file}`);
  const raw = await res.json();
  const level = migrateLevelData(raw);
  levelCache.set(fileOrId, level);
  return level;
}

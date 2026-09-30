type TrackName = "maintheme" | "comeco";

const TRACKS: Record<TrackName, string> = {
  maintheme: "/audio/maintheme.mp4",
  comeco: "/audio/comeco.mp4",
};

let currentAudio: HTMLAudioElement | null = null;
let currentTrack: TrackName | null = null;
let muted = false;
let volume = 0.4;

export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  if (currentAudio) {
    currentAudio.volume = volume;
  }
}

export function getVolume(): number {
  return volume;
}

export function playTrack(name: TrackName, loop = true) {
  if (currentTrack === name && currentAudio && !currentAudio.paused) return;

  stopTrack();

  const audio = new Audio(TRACKS[name]);
  audio.loop = loop;
  audio.volume = volume;
  audio.muted = muted;
  audio.play().catch(() => {
    // Autoplay blocked — will play on next user interaction
    const unlock = () => {
      audio.play().catch(() => {});
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
  });

  currentAudio = audio;
  currentTrack = name;
}

export function stopTrack() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    currentTrack = null;
  }
}

export function toggleMute(): boolean {
  muted = !muted;
  if (currentAudio) {
    currentAudio.muted = muted;
  }
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

// ---------------------------------------------------------------------------
// SFX Infrastructure
// ---------------------------------------------------------------------------

export type SFXName = "coin" | "block_break" | "jump" | "hurt" | "attack" | "heart";

const SFX_PATHS: Record<SFXName, string> = {
  coin: "/audio/sfx/coin.mp3",
  block_break: "/audio/sfx/block_break.mp3",
  jump: "/audio/sfx/jump.mp3",
  hurt: "/audio/sfx/hurt.mp3",
  attack: "/audio/sfx/attack.mp3",
  heart: "/audio/sfx/heart.mp3",
};

export interface SFXOptions {
  /** Override volume (0-1). Default: 0.5 */
  volume?: number;
  /** Pitch randomization range (0 = none, 0.1 = +-10%). Default: 0.1 */
  pitchVariation?: number;
  /** Force a specific playback rate (overrides randomization). */
  playbackRate?: number;
}

const SFX_POOL_SIZE = 3;
const sfxPools: Map<SFXName, HTMLAudioElement[]> = new Map();

function getSFXPool(name: SFXName): HTMLAudioElement[] {
  let pool = sfxPools.get(name);
  if (!pool) {
    pool = [];
    for (let i = 0; i < SFX_POOL_SIZE; i++) {
      const audio = new Audio(SFX_PATHS[name]);
      audio.preload = "auto";
      audio.volume = 0.5;
      pool.push(audio);
    }
    sfxPools.set(name, pool);
  }
  return pool;
}

export function playSFX(name: SFXName, opts?: SFXOptions): void {
  if (muted) return;

  const pool = getSFXPool(name);

  // Find a free (ended or not-yet-played) element in the pool
  let audio = pool.find(a => a.paused || a.ended);
  if (!audio) {
    // All instances busy -- steal the oldest one
    audio = pool[0];
  }

  // Configure
  audio.volume = opts?.volume ?? 0.5;

  if (opts?.playbackRate !== undefined) {
    audio.playbackRate = opts.playbackRate;
  } else {
    const variation = opts?.pitchVariation ?? 0.1;
    audio.playbackRate = 1 + (Math.random() * 2 - 1) * variation;
  }

  // Reset and play
  audio.currentTime = 0;
  audio.play().catch(() => {
    // Autoplay blocked -- silently skip (SFX are not critical)
  });
}

export function preloadSFX(): void {
  for (const name of Object.keys(SFX_PATHS) as SFXName[]) {
    getSFXPool(name);
  }
}

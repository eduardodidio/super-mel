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

import { create } from "zustand";

interface ShakeState {
  intensity: number;
  duration: number;
  offsetX: number;
  offsetY: number;
  shake: (intensity: number, duration: number) => void;
  tick: (delta: number) => void;
}

export const useScreenShake = create<ShakeState>((set, get) => ({
  intensity: 0,
  duration: 0,
  offsetX: 0,
  offsetY: 0,

  shake: (intensity: number, duration: number) => {
    const current = get();
    // Only override if new shake is stronger than remaining shake
    if (intensity >= current.intensity) {
      set({ intensity, duration });
    }
  },

  tick: (delta: number) => {
    const s = get();
    if (s.duration <= 0) {
      if (s.offsetX !== 0 || s.offsetY !== 0) {
        set({ offsetX: 0, offsetY: 0, intensity: 0 });
      }
      return;
    }

    const remaining = Math.max(0, s.duration - delta);
    const decay = s.duration > 0 ? remaining / s.duration : 0;
    const amp = s.intensity * decay;

    set({
      duration: remaining,
      offsetX: (Math.random() - 0.5) * 2 * amp,
      offsetY: (Math.random() - 0.5) * 2 * amp,
    });
  },
}));

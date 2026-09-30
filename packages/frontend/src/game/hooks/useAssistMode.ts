import { create } from "zustand";

export interface AssistModeSettings {
  invincible: boolean;
  unlimitedFlight: boolean;
  fiveHearts: boolean;
  gameSpeed: number;
}

const STORAGE_KEY = "supermel_assist_mode";

const DEFAULT_SETTINGS: AssistModeSettings = {
  invincible: false,
  unlimitedFlight: false,
  fiveHearts: false,
  gameSpeed: 1.0,
};

function loadSettings(): AssistModeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      invincible: Boolean(parsed.invincible),
      unlimitedFlight: Boolean(parsed.unlimitedFlight),
      fiveHearts: Boolean(parsed.fiveHearts),
      gameSpeed: [0.7, 0.85, 1.0].includes(parsed.gameSpeed) ? parsed.gameSpeed : 1.0,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AssistModeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

interface AssistModeState extends AssistModeSettings {
  setInvincible: (v: boolean) => void;
  setUnlimitedFlight: (v: boolean) => void;
  setFiveHearts: (v: boolean) => void;
  setGameSpeed: (v: number) => void;
  isAnyAssistEnabled: () => boolean;
}

export const useAssistMode = create<AssistModeState>((set, get) => {
  const initial = loadSettings();
  return {
    ...initial,
    setInvincible: (v) => {
      set({ invincible: v });
      saveSettings({ ...get(), invincible: v });
    },
    setUnlimitedFlight: (v) => {
      set({ unlimitedFlight: v });
      saveSettings({ ...get(), unlimitedFlight: v });
    },
    setFiveHearts: (v) => {
      set({ fiveHearts: v });
      saveSettings({ ...get(), fiveHearts: v });
    },
    setGameSpeed: (v) => {
      const valid = [0.7, 0.85, 1.0].includes(v) ? v : 1.0;
      set({ gameSpeed: valid });
      saveSettings({ ...get(), gameSpeed: valid });
    },
    isAnyAssistEnabled: () => {
      const s = get();
      return s.invincible || s.unlimitedFlight || s.fiveHearts || s.gameSpeed !== 1.0;
    },
  };
});

import { create } from "zustand";
import type { BackgroundTheme } from "@super-mel/shared";

export type GameScene = "menu" | "playing" | "gameover" | "editor" | "levelselect" | "leaderboard";

interface GameState {
  scene: GameScene;
  score: number;
  lives: number;
  theme: BackgroundTheme;
  paused: boolean;

  setScene: (scene: GameScene) => void;
  setScore: (score: number) => void;
  addScore: (delta: number) => void;
  setLives: (lives: number) => void;
  loseLife: () => void;
  setTheme: (theme: BackgroundTheme) => void;
  setPaused: (paused: boolean) => void;
  resetGame: () => void;
}

export const useGameState = create<GameState>((set) => ({
  scene: "menu",
  score: 0,
  lives: 3,
  theme: "forest",
  paused: false,

  setScene: (scene) => set({ scene }),
  setScore: (score) => set({ score }),
  addScore: (delta) => set((s) => ({ score: s.score + delta })),
  setLives: (lives) => set({ lives }),
  loseLife: () =>
    set((s) => {
      const lives = s.lives - 1;
      return { lives, scene: lives <= 0 ? "gameover" : s.scene };
    }),
  setTheme: (theme) => set({ theme }),
  setPaused: (paused) => set({ paused }),
  resetGame: () => set({ score: 0, lives: 3, scene: "playing", paused: false }),
}));

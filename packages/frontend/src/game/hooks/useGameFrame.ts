import { useFrame, type RootState } from "@react-three/fiber";
import { useAssistMode } from "./useAssistMode";
import { useGameState } from "./useGameState";

type FrameCallback = (state: RootState, delta: number) => void;

/**
 * Custom hook wrapping R3F's useFrame with:
 * 1. Pause guard — skips callback when game is paused
 * 2. Game speed scaling — scales delta by assist mode gameSpeed
 */
export function useGameFrame(callback: FrameCallback, priority?: number): void {
  useFrame((state, delta) => {
    // Skip if paused
    if (useGameState.getState().paused) return;

    // Scale delta by game speed
    const gameSpeed = useAssistMode.getState().gameSpeed;
    const scaledDelta = delta * gameSpeed;

    callback(state, scaledDelta);
  }, priority);
}

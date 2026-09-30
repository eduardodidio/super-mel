import { useEffect, useRef } from "react";
import { useGameState } from "./useGameState";

export interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
  down: boolean;
  up: boolean;
  bark: boolean;
}

const DEADZONE = 0.2;

// Separate keyboard and gamepad states to avoid conflicts
const kbState: Controls = { left: false, right: false, jump: false, shoot: false, down: false, up: false, bark: false };
const gpState: Controls = { left: false, right: false, jump: false, shoot: false, down: false, up: false, bark: false };

// Start button edge detection
let prevStartPressed = false;

/**
 * Polls the first connected gamepad and updates gpState.
 * Returns whether the Start button was just pressed (edge detection).
 */
export function pollGamepad(): boolean {
  const gamepads = navigator.getGamepads();
  const gp = gamepads[0];

  if (!gp) {
    // Clear gamepad state when no gamepad
    gpState.left = false;
    gpState.right = false;
    gpState.jump = false;
    gpState.shoot = false;
    gpState.down = false;
    gpState.up = false;
    gpState.bark = false;
    prevStartPressed = false;
    return false;
  }

  // Left stick or D-pad
  const axisX = gp.axes[0] ?? 0;
  const axisY = gp.axes[1] ?? 0;

  // D-pad buttons (standard mapping): up=12, down=13, left=14, right=15
  const dpadUp = gp.buttons[12]?.pressed ?? false;
  const dpadDown = gp.buttons[13]?.pressed ?? false;
  const dpadLeft = gp.buttons[14]?.pressed ?? false;
  const dpadRight = gp.buttons[15]?.pressed ?? false;

  gpState.left = axisX < -DEADZONE || dpadLeft;
  gpState.right = axisX > DEADZONE || dpadRight;
  gpState.up = axisY < -DEADZONE || dpadUp;
  gpState.down = axisY > DEADZONE || dpadDown;

  // A/Cross = button 0 = jump
  gpState.jump = gp.buttons[0]?.pressed ?? false;
  // X/Square = button 2 = shoot
  gpState.shoot = gp.buttons[2]?.pressed ?? false;
  // Y/Triangle = button 3 = bark
  gpState.bark = gp.buttons[3]?.pressed ?? false;

  // Track last input type
  const hasGamepadInput = gpState.left || gpState.right || gpState.up || gpState.down || gpState.jump || gpState.shoot || gpState.bark;
  if (hasGamepadInput) {
    const state = useGameState.getState();
    if (state.lastInputType !== "gamepad") {
      state.setLastInputType("gamepad");
    }
  }

  // Start button (button 9) edge detection
  const startPressed = gp.buttons[9]?.pressed ?? false;
  const startJustPressed = startPressed && !prevStartPressed;
  prevStartPressed = startPressed;

  return startJustPressed;
}

/**
 * Merges keyboard + gamepad states into a single controls ref.
 */
function mergeControls(merged: Controls): void {
  merged.left = kbState.left || gpState.left;
  merged.right = kbState.right || gpState.right;
  merged.jump = kbState.jump || gpState.jump;
  merged.shoot = kbState.shoot || gpState.shoot;
  merged.down = kbState.down || gpState.down;
  merged.up = kbState.up || gpState.up;
  merged.bark = kbState.bark || gpState.bark;
}

export function useControls(): React.MutableRefObject<Controls> {
  const controls = useRef<Controls>({ left: false, right: false, jump: false, shoot: false, down: false, up: false, bark: false });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Track keyboard input type
      const state = useGameState.getState();
      if (state.lastInputType !== "keyboard") {
        state.setLastInputType("keyboard");
      }

      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          kbState.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          kbState.right = true;
          break;
        case "Space":
          e.preventDefault();
          kbState.jump = true;
          break;
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          kbState.up = true;
          break;
        case "ArrowDown":
        case "KeyS":
          e.preventDefault();
          kbState.down = true;
          break;
        case "KeyZ":
        case "KeyJ":
          kbState.shoot = true;
          break;
        case "KeyX":
        case "KeyK":
          kbState.bark = true;
          break;
      }
      mergeControls(controls.current);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          kbState.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          kbState.right = false;
          break;
        case "Space":
          kbState.jump = false;
          break;
        case "ArrowUp":
        case "KeyW":
          kbState.up = false;
          break;
        case "ArrowDown":
        case "KeyS":
          kbState.down = false;
          break;
        case "KeyZ":
        case "KeyJ":
          kbState.shoot = false;
          break;
        case "KeyX":
        case "KeyK":
          kbState.bark = false;
          break;
      }
      mergeControls(controls.current);
    };

    // Gamepad hot-plug events
    const onGamepadConnected = (e: GamepadEvent) => {
      console.log("Gamepad connected:", e.gamepad.id);
      useGameState.getState().setGamepadConnected(true);
    };

    const onGamepadDisconnected = () => {
      console.log("Gamepad disconnected");
      useGameState.getState().setGamepadConnected(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("gamepadconnected", onGamepadConnected);
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);

    // Gamepad polling loop (runs every frame via RAF)
    let rafId: number;
    const pollLoop = () => {
      pollGamepad();
      mergeControls(controls.current);
      rafId = requestAnimationFrame(pollLoop);
    };
    rafId = requestAnimationFrame(pollLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("gamepadconnected", onGamepadConnected);
      window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return controls;
}

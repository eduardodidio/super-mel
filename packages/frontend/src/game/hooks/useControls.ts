import { useEffect, useRef } from "react";

export interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
  down: boolean;
  up: boolean;
}

export function useControls(): React.MutableRefObject<Controls> {
  const controls = useRef<Controls>({ left: false, right: false, jump: false, shoot: false, down: false, up: false });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          controls.current.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          controls.current.right = true;
          break;
        case "Space":
          e.preventDefault();
          controls.current.jump = true;
          break;
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          controls.current.up = true;
          break;
        case "ArrowDown":
        case "KeyS":
          e.preventDefault();
          controls.current.down = true;
          break;
        case "KeyZ":
        case "KeyJ":
          controls.current.shoot = true;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          controls.current.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          controls.current.right = false;
          break;
        case "Space":
          controls.current.jump = false;
          break;
        case "ArrowUp":
        case "KeyW":
          controls.current.up = false;
          break;
        case "ArrowDown":
        case "KeyS":
          controls.current.down = false;
          break;
        case "KeyZ":
        case "KeyJ":
          controls.current.shoot = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return controls;
}

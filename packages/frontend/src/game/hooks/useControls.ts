import { useEffect, useRef } from "react";

export interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
}

export function useControls(): React.MutableRefObject<Controls> {
  const controls = useRef<Controls>({ left: false, right: false, jump: false, shoot: false });

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
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          controls.current.jump = true;
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
        case "ArrowUp":
        case "KeyW":
          controls.current.jump = false;
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

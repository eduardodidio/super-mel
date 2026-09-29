import { useEffect, useRef } from "react";

export interface Controls {
  flap: boolean;
  shoot: boolean;
}

export function useControls(): React.MutableRefObject<Controls> {
  const controls = useRef<Controls>({ flap: false, shoot: false });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        controls.current.flap = true;
      }
      if (e.code === "KeyZ") {
        controls.current.shoot = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        controls.current.flap = false;
      }
      if (e.code === "KeyZ") {
        controls.current.shoot = false;
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

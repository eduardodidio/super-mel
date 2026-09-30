import { useState, useCallback, useRef, useEffect } from "react";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Shared camera ref -- set by CameraRig each frame
// ---------------------------------------------------------------------------

export const sharedCameraRef: { current: THREE.Camera | null } = { current: null };
export const sharedCanvasSize: { current: { width: number; height: number } } = {
  current: { width: window.innerWidth, height: window.innerHeight },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PopupData {
  id: number;
  worldX: number;
  worldY: number;
  createdAt: number;
}

const POPUP_DURATION = 600; // ms
const POPUP_RISE_PX = 40;
const MAX_POPUPS = 8;

let nextPopupId = 0;

export interface CoinPopupHandle {
  spawn: (worldX: number, worldY: number) => void;
}

/** Module-level shared handle so GameScene3D (inside Canvas) can call spawn */
export const sharedCoinPopup: { current: CoinPopupHandle | null } = { current: null };

// ---------------------------------------------------------------------------
// CoinPopupLayer -- rendered OUTSIDE Canvas, next to HUD3D
// ---------------------------------------------------------------------------

export function CoinPopupLayer({
  popupRef,
}: {
  popupRef: React.MutableRefObject<CoinPopupHandle | null>;
}) {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const rafRef = useRef<number>(0);

  // Expose spawn function via ref and shared module-level ref
  useEffect(() => {
    const handle: CoinPopupHandle = {
      spawn: (worldX: number, worldY: number) => {
        setPopups((prev) => {
          const newPopup: PopupData = {
            id: nextPopupId++,
            worldX,
            worldY,
            createdAt: performance.now(),
          };
          const combined = [...prev, newPopup];
          return combined.slice(-MAX_POPUPS);
        });
      },
    };
    popupRef.current = handle;
    sharedCoinPopup.current = handle;
  }, [popupRef]);

  // Animation loop to update/remove popups
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const now = performance.now();
      setPopups((prev) => prev.filter((p) => now - p.createdAt < POPUP_DURATION));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Project world coordinates to screen coordinates
  const projectToScreen = useCallback(
    (worldX: number, worldY: number): { x: number; y: number } | null => {
      const camera = sharedCameraRef.current;
      if (!camera) return null;
      const vec = new THREE.Vector3(worldX, worldY, 0);
      vec.project(camera);
      const { width, height } = sharedCanvasSize.current;
      return {
        x: (vec.x * 0.5 + 0.5) * width,
        y: (-vec.y * 0.5 + 0.5) * height,
      };
    },
    []
  );

  if (popups.length === 0) return null;

  const now = performance.now();

  return (
    <>
      {popups.map((popup) => {
        const age = now - popup.createdAt;
        const t = Math.min(age / POPUP_DURATION, 1);
        const screen = projectToScreen(popup.worldX, popup.worldY + 0.5);
        if (!screen) return null;

        const risePx = t * POPUP_RISE_PX;
        const opacity = t > 0.5 ? 1 - (t - 0.5) / 0.5 : 1;

        return (
          <div
            key={popup.id}
            style={{
              position: "absolute",
              left: screen.x,
              top: screen.y - risePx,
              transform: "translate(-50%, -50%)",
              color: "#DC143C",
              fontSize: "18px",
              fontWeight: "bold",
              fontFamily: "monospace",
              textShadow:
                "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
              opacity,
              pointerEvents: "none",
              zIndex: 15,
              transition: "none",
              willChange: "transform, opacity",
            }}
          >
            +1
          </div>
        );
      })}
    </>
  );
}

/**
 * MissionToast -- Toast notification overlay for mission completions.
 *
 * Subscribes to `mission_completed` events on GameEventBus and displays
 * celebratory notifications that auto-dismiss after 2.5s with a fade-out.
 * Multiple toasts queue vertically.
 */

import { useState, useEffect, useRef } from "react";
import { gameEventBus } from "./GameEventBus";

interface ToastItem {
  id: number;
  description: string;
  reward: number;
  visible: boolean;
}

const TOAST_DURATION = 2500; // 2.5s display
const FADE_DURATION = 500;   // 0.5s fade out

export function MissionToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounter = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const unsub = gameEventBus.on("mission_completed", (data) => {
      if (!mountedRef.current) return;

      const id = ++idCounter.current;
      const newToast: ToastItem = {
        id,
        description: data.mission.description,
        reward: data.reward,
        visible: true,
      };

      setToasts((prev) => [...prev, newToast]);

      // Start fade after TOAST_DURATION
      setTimeout(() => {
        if (!mountedRef.current) return;
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, visible: false } : t)),
        );
      }, TOAST_DURATION);

      // Remove after fade completes
      setTimeout(() => {
        if (!mountedRef.current) return;
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_DURATION + FADE_DURATION);
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            ...styles.toast,
            opacity: toast.visible ? 1 : 0,
            transform: toast.visible
              ? "translateY(0) scale(1)"
              : "translateY(-10px) scale(0.95)",
          }}
        >
          <div style={styles.toastHeader}>MISSAO COMPLETA!</div>
          <div style={styles.toastDesc}>{toast.description}</div>
          {toast.reward > 0 && (
            <div style={styles.toastReward}>+{toast.reward} moedas</div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    top: 80,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    pointerEvents: "none",
    zIndex: 20,
  },
  toast: {
    background: "rgba(0, 0, 0, 0.85)",
    border: "2px solid #FFD700",
    borderRadius: 8,
    padding: "10px 20px",
    textAlign: "center" as const,
    fontFamily: "monospace",
    transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease`,
    minWidth: 200,
  },
  toastHeader: {
    color: "#FFD700",
    fontSize: "14px",
    fontWeight: "bold",
    textShadow: "1px 1px 0 #000",
    marginBottom: 4,
  },
  toastDesc: {
    color: "#fff",
    fontSize: "12px",
  },
  toastReward: {
    color: "#DC143C",
    fontSize: "12px",
    fontWeight: "bold",
    marginTop: 4,
  },
};

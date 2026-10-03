import { useState, useEffect } from "react";
import { Game3D } from "./game/Game3D";
import { AuthScreen } from "./components/AuthScreen";

export function App() {
  const [authenticated, setAuthenticated] = useState(() => {
    return !!localStorage.getItem("supermel_player_id");
  });

  // Request fullscreen on first user interaction (mobile only)
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    const requestFS = () => {
      const el = document.documentElement;
      const rfs =
        el.requestFullscreen ||
        (el as any).webkitRequestFullscreen ||
        (el as any).msRequestFullscreen;
      if (rfs) rfs.call(el).catch(() => {});

      // Lock orientation to landscape if supported
      if ((screen as any).orientation?.lock) {
        (screen as any).orientation.lock("landscape").catch(() => {});
      }
    };

    document.addEventListener("pointerdown", requestFS, { once: true });
    return () => document.removeEventListener("pointerdown", requestFS);
  }, []);

  if (!authenticated) {
    return <AuthScreen onAuth={() => setAuthenticated(true)} />;
  }

  return <Game3D />;
}

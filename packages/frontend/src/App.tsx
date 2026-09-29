import { useState } from "react";
import { Game3D } from "./game/Game3D";
import { AuthScreen } from "./components/AuthScreen";

export function App() {
  const [authenticated, setAuthenticated] = useState(() => {
    return !!localStorage.getItem("supermel_player_id");
  });

  if (!authenticated) {
    return <AuthScreen onAuth={() => setAuthenticated(true)} />;
  }

  return <Game3D />;
}

import { useState } from "react";
import { GameView } from "./components/GameView";
import { AuthScreen } from "./components/AuthScreen";
import { LeaderboardView } from "./components/LeaderboardView";

type Screen = "auth" | "game" | "leaderboard";

export function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    return localStorage.getItem("supermel_player_id") ? "game" : "auth";
  });

  if (screen === "auth") {
    return <AuthScreen onAuth={() => setScreen("game")} />;
  }

  if (screen === "leaderboard") {
    return <LeaderboardView onBack={() => setScreen("game")} />;
  }

  return <GameView />;
}

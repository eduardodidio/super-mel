import { useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import type { BlockType, BackgroundTheme } from "@super-mel/shared";
import { EditorScene3D } from "./EditorScene3D";
import { EditorUI } from "./EditorUI";
import { Lighting } from "../systems/Lighting";
import { Skybox } from "../systems/Skybox";
import { useGameState } from "../hooks/useGameState";

interface EditorBlock {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
}

export function EditorWrapper() {
  const setScene = useGameState((s) => s.setScene);
  const theme = useGameState((s) => s.theme);

  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [selectedTool, setSelectedTool] = useState<Exclude<BlockType, "empty"> | "eraser" | "spawn">("stone");
  const [currentZ, setCurrentZ] = useState(0);
  const [spawnPoint, setSpawnPoint] = useState({ x: 2, y: 2 });
  const [levelName, setLevelName] = useState("");

  const handlePlaceBlock = useCallback((x: number, y: number) => {
    if (selectedTool === "eraser" || selectedTool === "spawn") return;
    setBlocks((prev) => {
      // Remove existing block at this position
      const filtered = prev.filter((b) => !(b.x === x && b.y === y && b.z === currentZ));
      return [...filtered, { type: selectedTool, x, y, z: currentZ }];
    });
  }, [selectedTool, currentZ]);

  const handleRemoveBlock = useCallback((x: number, y: number) => {
    setBlocks((prev) => prev.filter((b) => !(b.x === x && b.y === y && b.z === currentZ)));
  }, [currentZ]);

  const handleSetSpawn = useCallback((x: number, y: number) => {
    setSpawnPoint({ x, y });
  }, []);

  const handleTest = useCallback(() => {
    // Store level data for testing
    const levelData = {
      blocks,
      spawnPoint,
      theme,
    };
    sessionStorage.setItem("supermel_test_level", JSON.stringify(levelData));
    setScene("playing");
  }, [blocks, spawnPoint, theme, setScene]);

  const handleSave = useCallback(async () => {
    const name = prompt("Nome da fase:", levelName || "Minha Fase");
    if (!name) return;
    setLevelName(name);

    const playerId = localStorage.getItem("supermel_player_id") || "";
    const data = {
      blocks,
      spawnPoint,
      width: 32,
      height: 16,
    };

    try {
      const res = await fetch("/api/levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: playerId,
          name,
          data,
          background: theme,
        }),
      });
      if (res.ok) {
        alert("Fase salva com sucesso!");
      } else {
        alert("Erro ao salvar fase.");
      }
    } catch {
      alert("Erro de conexao.");
    }
  }, [blocks, spawnPoint, theme, levelName]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        shadows
        camera={{ position: [15, 6, 25], fov: 50 }}
        style={{ background: "#1a1a2e" }}
      >
        <Skybox theme={theme} />
        <Lighting theme={theme} />
        <EditorScene3D
          blocks={blocks}
          currentZ={currentZ}
          selectedTool={selectedTool}
          spawnPoint={spawnPoint}
          onPlaceBlock={handlePlaceBlock}
          onRemoveBlock={handleRemoveBlock}
          onSetSpawn={handleSetSpawn}
          theme={theme}
        />
      </Canvas>

      <EditorUI
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        currentZ={currentZ}
        onChangeZ={setCurrentZ}
        blocks={blocks}
        spawnPoint={spawnPoint}
        onTest={handleTest}
        onSave={handleSave}
        onBack={() => setScene("menu")}
      />
    </div>
  );
}

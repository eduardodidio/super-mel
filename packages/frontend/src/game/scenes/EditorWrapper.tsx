import { useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import type { BlockType, EntityData, LevelDataV2, BlockCell } from "@super-mel/shared";
import { EditorScene3D } from "./EditorScene3D";
import { EditorUI, type EditorTool } from "./EditorUI";
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
  const [entities, setEntities] = useState<EntityData[]>([
    { type: "spawn", x: 2, y: 2 },
  ]);
  const [selectedTool, setSelectedTool] = useState<EditorTool>("stone");
  const [itemBlockContent, setItemBlockContent] = useState<string>("coin");
  const [currentZ, setCurrentZ] = useState(0);
  const [spawnPoint, setSpawnPoint] = useState({ x: 2, y: 2 });
  const [levelName, setLevelName] = useState("");

  const handlePlaceBlock = useCallback((x: number, y: number) => {
    // Determine the actual block type to place
    let blockType: Exclude<BlockType, "empty">;
    if (selectedTool === "entity_item_block") {
      blockType = "item_block";
    } else if (selectedTool === "eraser" || selectedTool.startsWith("entity_")) {
      return; // Not a block tool
    } else {
      blockType = selectedTool as Exclude<BlockType, "empty">;
    }

    setBlocks((prev) => {
      // Remove existing block at this position
      const filtered = prev.filter((b) => !(b.x === x && b.y === y && b.z === currentZ));
      return [...filtered, { type: blockType, x, y, z: currentZ }];
    });
  }, [selectedTool, currentZ]);

  const handleRemoveBlock = useCallback((x: number, y: number) => {
    setBlocks((prev) => prev.filter((b) => !(b.x === x && b.y === y && b.z === currentZ)));
  }, [currentZ]);

  const handleSetSpawn = useCallback((x: number, y: number) => {
    setSpawnPoint({ x, y });
    // Update spawn entity
    setEntities((prev) => {
      const filtered = prev.filter((e) => e.type !== "spawn");
      return [...filtered, { type: "spawn" as const, x, y }];
    });
  }, []);

  const handlePlaceEntity = useCallback((entity: EntityData) => {
    setEntities((prev) => {
      // For singleton types (spawn, goal), remove existing before adding
      if (entity.type === "spawn" || entity.type === "goal") {
        const filtered = prev.filter((e) => e.type !== entity.type);
        if (entity.type === "spawn") {
          setSpawnPoint({ x: entity.x, y: entity.y });
        }
        return [...filtered, entity];
      }
      // For item_block_content, replace at same position
      if (entity.type === "item_block_content") {
        const filtered = prev.filter(
          (e) => !(e.type === "item_block_content" && e.x === entity.x && e.y === entity.y)
        );
        return [...filtered, entity];
      }
      // For others, allow multiple at different positions but not duplicates
      const exists = prev.some(
        (e) => e.type === entity.type && e.x === entity.x && e.y === entity.y
      );
      if (exists) return prev;
      return [...prev, entity];
    });
  }, []);

  const handleRemoveEntity = useCallback((x: number, y: number) => {
    setEntities((prev) => prev.filter((e) => !(e.x === x && e.y === y)));
  }, []);

  const buildLevelDataV2 = useCallback((): LevelDataV2 => {
    // Determine grid dimensions from blocks
    let maxX = 32;
    let maxY = 16;
    for (const b of blocks) {
      if (b.x >= maxX) maxX = b.x + 1;
      if (b.y >= maxY) maxY = b.y + 1;
    }
    const width = Math.max(32, maxX);
    const height = Math.max(16, maxY);

    // Build grid as 2D array
    const grid: BlockCell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: BlockCell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({ type: "empty" as BlockType, x, y });
      }
      grid.push(row);
    }

    // Place blocks into the grid (only z=0 gameplay layer)
    for (const b of blocks) {
      if (b.z === 0 && b.y >= 0 && b.y < height && b.x >= 0 && b.x < width) {
        grid[b.y][b.x] = { type: b.type, x: b.x, y: b.y };
      }
    }

    return {
      version: 2,
      grid,
      width,
      height,
      entities,
      theme,
    };
  }, [blocks, entities, theme]);

  const handleTest = useCallback(() => {
    // Store level data for testing
    const levelData = buildLevelDataV2();
    sessionStorage.setItem("supermel_test_level", JSON.stringify(levelData));
    setScene("playing");
  }, [buildLevelDataV2, setScene]);

  const handleSave = useCallback(async () => {
    const name = prompt("Nome da fase:", levelName || "Minha Fase");
    if (!name) return;
    setLevelName(name);

    const playerId = localStorage.getItem("supermel_player_id") || "";
    const data = buildLevelDataV2();

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
  }, [buildLevelDataV2, theme, levelName]);

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
          entities={entities}
          currentZ={currentZ}
          selectedTool={selectedTool}
          itemBlockContent={itemBlockContent}
          spawnPoint={spawnPoint}
          onPlaceBlock={handlePlaceBlock}
          onRemoveBlock={handleRemoveBlock}
          onSetSpawn={handleSetSpawn}
          onPlaceEntity={handlePlaceEntity}
          onRemoveEntity={handleRemoveEntity}
          theme={theme}
        />
      </Canvas>

      <EditorUI
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        itemBlockContent={itemBlockContent}
        onItemBlockContentChange={setItemBlockContent}
        currentZ={currentZ}
        onChangeZ={setCurrentZ}
        blocks={blocks}
        entities={entities}
        spawnPoint={spawnPoint}
        onTest={handleTest}
        onSave={handleSave}
        onBack={() => setScene("menu")}
      />
    </div>
  );
}

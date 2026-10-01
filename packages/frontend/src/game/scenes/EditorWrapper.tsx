import { useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import type { BlockType, EntityData, LevelDataV2, BlockCell, CustomAsset, EnemySubtype } from "@super-mel/shared";
import { EditorScene3D } from "./EditorScene3D";
import { EditorUI, type EditorTool } from "./EditorUI";
import { ImageUploader } from "../editor/ImageUploader";
import { Lighting } from "../systems/Lighting";
import { Skybox } from "../systems/Skybox";
import { useGameState } from "../hooks/useGameState";
import { validateLevelName } from "../../utils/wordFilter";

interface EditorBlock {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
}

export function EditorWrapper() {
  const scene = useGameState((s) => s.scene);
  const setScene = useGameState((s) => s.setScene);
  const theme = useGameState((s) => s.theme);

  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [entities, setEntities] = useState<EntityData[]>([
    { type: "spawn", x: 2, y: 2 },
  ]);
  const [selectedTool, setSelectedTool] = useState<EditorTool>("stone");
  const [itemBlockContent, setItemBlockContent] = useState<string>("coin");
  const [signText, setSignText] = useState<string>("Texto aqui");
  const [enemySubtype, setEnemySubtype] = useState<EnemySubtype>("vacuum");
  const [currentZ, setCurrentZ] = useState(0);

  // Camera state (F56-T02)
  const [cameraPos, setCameraPos] = useState({ x: 15, y: 6, z: 25 });
  const [spawnPoint, setSpawnPoint] = useState({ x: 2, y: 2 });
  const [levelName, setLevelName] = useState("");

  // Custom assets state (Galeria do Rafa)
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([]);
  const [selectedCustomAssetId, setSelectedCustomAssetId] = useState<string | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);

  // F46: Clear check + publish state
  const [levelCleared, setLevelCleared] = useState(false);
  const [levelCode, setLevelCode] = useState<string | null>(null);
  const [savedLevelId, setSavedLevelId] = useState<string | null>(null);
  const [dataChangedSinceClear, setDataChangedSinceClear] = useState(false);

  // F46: Detect return from editor test clear
  useEffect(() => {
    if (scene === "editor") {
      const cleared = sessionStorage.getItem("supermel_editor_test_cleared");
      if (cleared === "true") {
        sessionStorage.removeItem("supermel_editor_test_cleared");
        setLevelCleared(true);
        setDataChangedSinceClear(false);
      }
    }
  }, [scene]);

  // F46: Helper to mark data as changed (invalidates clear check)
  const markDataChanged = useCallback(() => {
    if (levelCleared) {
      setDataChangedSinceClear(true);
    }
  }, [levelCleared]);

  const handlePlaceBlock = useCallback((x: number, y: number) => {
    // Determine the actual block type to place
    let blockType: Exclude<BlockType, "empty">;
    if (selectedTool === "entity_item_block") {
      blockType = "item_block";
    } else if (selectedTool === "custom_block") {
      // Custom block: place "custom" block + custom_block_asset entity
      if (!selectedCustomAssetId) return;
      blockType = "custom";
      // Also place the custom_block_asset entity linking this position to the asset
      setEntities((prev) => {
        // Remove existing custom_block_asset at this position
        const filtered = prev.filter(
          (e) => !(e.type === "custom_block_asset" && e.x === x && e.y === y)
        );
        return [...filtered, {
          type: "custom_block_asset" as const,
          x,
          y,
          props: { customAssetId: selectedCustomAssetId },
        }];
      });
    } else if (selectedTool === "eraser" || selectedTool.startsWith("entity_") || selectedTool === "custom_sign") {
      return; // Not a block tool
    } else {
      blockType = selectedTool as Exclude<BlockType, "empty">;
    }

    setBlocks((prev) => {
      // Remove existing block at this position
      const filtered = prev.filter((b) => !(b.x === x && b.y === y && b.z === currentZ));
      return [...filtered, { type: blockType, x, y, z: currentZ }];
    });
    markDataChanged();
  }, [selectedTool, currentZ, selectedCustomAssetId, markDataChanged]);

  const handleRemoveBlock = useCallback((x: number, y: number) => {
    setBlocks((prev) => prev.filter((b) => !(b.x === x && b.y === y && b.z === currentZ)));
    markDataChanged();
  }, [currentZ, markDataChanged]);

  const handleSetSpawn = useCallback((x: number, y: number) => {
    setSpawnPoint({ x, y });
    // Update spawn entity
    setEntities((prev) => {
      const filtered = prev.filter((e) => e.type !== "spawn");
      return [...filtered, { type: "spawn" as const, x, y }];
    });
    markDataChanged();
  }, [markDataChanged]);

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
      // For custom_block_asset, replace at same position
      if (entity.type === "custom_block_asset") {
        const filtered = prev.filter(
          (e) => !(e.type === "custom_block_asset" && e.x === entity.x && e.y === entity.y)
        );
        return [...filtered, entity];
      }
      // For sign with customAssetId, replace sign at same position
      if (entity.type === "sign" && entity.props?.customAssetId) {
        const filtered = prev.filter(
          (e) => !(e.type === "sign" && e.x === entity.x && e.y === entity.y)
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
    markDataChanged();
  }, [markDataChanged]);

  const handleRemoveEntity = useCallback((x: number, y: number) => {
    setEntities((prev) => prev.filter((e) => !(e.x === x && e.y === y)));
    markDataChanged();
  }, [markDataChanged]);

  // --- Custom asset handlers (Galeria do Rafa) ---

  const handleCustomAssetUpload = useCallback(() => {
    if (customAssets.length >= 10) return;
    setShowImageUploader(true);
  }, [customAssets.length]);

  const handleImageUploaderConfirm = useCallback((asset: CustomAsset) => {
    setCustomAssets((prev) => [...prev, asset]);
    setShowImageUploader(false);
    setSelectedCustomAssetId(asset.id);
    setSelectedTool("custom_block");
  }, []);

  const handleRemoveCustomAsset = useCallback((assetId: string) => {
    setCustomAssets((prev) => prev.filter((a) => a.id !== assetId));
    // Remove custom_block_asset entities referencing this asset
    setEntities((prev) =>
      prev.filter((e) => {
        if (e.type === "custom_block_asset" && e.props?.customAssetId === assetId) return false;
        return true;
      })
    );
    if (selectedCustomAssetId === assetId) {
      setSelectedCustomAssetId(null);
      setSelectedTool("stone");
    }
  }, [selectedCustomAssetId]);

  const handleSelectCustomAsset = useCallback((assetId: string, mode: "block" | "sign") => {
    setSelectedCustomAssetId(assetId);
    setSelectedTool(mode === "block" ? "custom_block" : "custom_sign");
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
      customAssets: customAssets.length > 0 ? customAssets : undefined,
    };
  }, [blocks, entities, theme, customAssets]);

  const startLevel = useGameState((s) => s.startLevel);

  const handleTest = useCallback(() => {
    // Build level data and start in level mode
    const data = buildLevelDataV2();
    // Check if the level has a goal entity — if so, use level mode; otherwise fallback to test mode
    const hasGoal = data.entities.some((e) => e.type === "goal");
    if (hasGoal) {
      startLevel(`editor-test-${Date.now()}`, data);
    } else {
      // No goal: use legacy test mode (infinite mode with level chunks)
      sessionStorage.setItem("supermel_test_level", JSON.stringify(data));
      setScene("playing");
    }
  }, [buildLevelDataV2, setScene, startLevel]);

  // F46: Save draft (no publish)
  const handleSave = useCallback(async () => {
    const name = levelName.trim() || "Minha Fase";

    // F46: Validate level name (word filter)
    const nameValidation = validateLevelName(name);
    if (!nameValidation.valid) {
      alert(nameValidation.reason);
      return;
    }

    const playerId = localStorage.getItem("supermel_player_id") || "";
    const data = buildLevelDataV2();

    try {
      if (savedLevelId) {
        // Update existing level
        const res = await fetch(`/api/levels/${savedLevelId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, data, background: theme }),
        });
        if (res.ok) {
          // After editing saved level data, reset clear check
          setLevelCleared(false);
          setDataChangedSinceClear(false);
          alert("Fase atualizada!");
        } else {
          alert("Erro ao atualizar fase.");
        }
      } else {
        // Create new level
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
          const result = await res.json();
          if (result.id && !result.offline) {
            setSavedLevelId(result.id);
          }
          alert("Fase salva!");
        } else {
          alert("Erro ao salvar fase.");
        }
      }
    } catch {
      alert("Erro de conexao.");
    }
  }, [buildLevelDataV2, theme, levelName, savedLevelId]);

  // F46: Publish (requires clear check)
  const handlePublish = useCallback(async () => {
    if (!savedLevelId) {
      alert("Salve a fase primeiro.");
      return;
    }

    try {
      // First, mark as cleared on the server
      await fetch(`/api/levels/${savedLevelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleared: true }),
      });

      // Then publish
      const res = await fetch(`/api/levels/${savedLevelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.code) {
          setLevelCode(result.code);
        }
        alert("Fase publicada com sucesso!");
      } else {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        alert(err.error || "Erro ao publicar fase.");
      }
    } catch {
      alert("Erro de conexao.");
    }
  }, [savedLevelId]);

  // F46: Effective cleared state: cleared AND no data changes since clear
  const effectiveCleared = levelCleared && !dataChangedSinceClear;

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
          signText={signText}
          spawnPoint={spawnPoint}
          onPlaceBlock={handlePlaceBlock}
          onRemoveBlock={handleRemoveBlock}
          onSetSpawn={handleSetSpawn}
          onPlaceEntity={handlePlaceEntity}
          onRemoveEntity={handleRemoveEntity}
          theme={theme}
          customAssets={customAssets}
          selectedCustomAssetId={selectedCustomAssetId}
          cameraPos={cameraPos}
          onCameraChange={setCameraPos}
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
        onPublish={handlePublish}
        onBack={() => setScene("menu")}
        customAssets={customAssets}
        selectedCustomAssetId={selectedCustomAssetId}
        onUploadCustomAsset={handleCustomAssetUpload}
        onRemoveCustomAsset={handleRemoveCustomAsset}
        onSelectCustomAsset={handleSelectCustomAsset}
        enemySubtype={enemySubtype}
        onEnemySubtypeChange={setEnemySubtype}
        cameraPos={cameraPos}
        signText={signText}
        onSignTextChange={setSignText}
        levelName={levelName}
        onLevelNameChange={setLevelName}
        levelCleared={effectiveCleared}
        levelCode={levelCode}
        savedLevelId={savedLevelId}
      />

      {showImageUploader && (
        <ImageUploader
          onConfirm={handleImageUploaderConfirm}
          onCancel={() => setShowImageUploader(false)}
          existingCount={customAssets.length}
        />
      )}
    </div>
  );
}

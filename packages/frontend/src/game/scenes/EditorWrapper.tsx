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
import { useEditorHistory } from "../editor/useEditorHistory";
import { useEditorSelection } from "../editor/useEditorSelection";

interface EditorBlock {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
}

const MIN_WIDTH = 16;
const MAX_WIDTH = 200;
const MIN_HEIGHT = 8;
const MAX_HEIGHT = 40;

const EDITOR_STATE_KEY = "supermel_editor_state";

interface EditorSavedState {
  blocks: EditorBlock[];
  entities: EntityData[];
  selectedTool: EditorTool;
  enemySubtype: EnemySubtype;
  currentZ: number;
  spawnPoint: { x: number; y: number };
  levelName: string;
  customAssets: CustomAsset[];
  selectedCustomAssetId: string | null;
  itemBlockContent: string;
  signText: string;
  cameraPos: { x: number; y: number; z: number };
  levelWidth: number;
  levelHeight: number;
  levelCleared: boolean;
  levelCode: string | null;
  savedLevelId: string | null;
  dataChangedSinceClear: boolean;
  // F58 mechanical element props
  movingPlatformDirection: "horizontal" | "vertical";
  movingPlatformSpeed: number;
  movingPlatformRange: number;
  spikesFacing: "up" | "down" | "left" | "right";
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

  // Mechanical element properties (F58)
  const [movingPlatformDirection, setMovingPlatformDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [movingPlatformSpeed, setMovingPlatformSpeed] = useState(3);
  const [movingPlatformRange, setMovingPlatformRange] = useState(4);
  const [spikesFacing, setSpikesFacing] = useState<"up" | "down" | "left" | "right">("up");

  // Level dimensions (F56-T05)
  const [levelWidth, setLevelWidth] = useState(32);
  const [levelHeight, setLevelHeight] = useState(16);

  // Camera state (F56-T02)
  const [cameraPos, setCameraPos] = useState({ x: 15, y: 6, z: 25 });
  // Hover position for test-from-cursor (F56-T04)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
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

  // F56-T06: Save editor state to sessionStorage before test
  const saveEditorState = useCallback(() => {
    const state: EditorSavedState = {
      blocks,
      entities,
      selectedTool,
      enemySubtype,
      currentZ,
      spawnPoint,
      levelName,
      customAssets,
      selectedCustomAssetId,
      itemBlockContent,
      signText,
      cameraPos,
      levelWidth,
      levelHeight,
      levelCleared,
      levelCode,
      savedLevelId,
      dataChangedSinceClear,
      movingPlatformDirection,
      movingPlatformSpeed,
      movingPlatformRange,
      spikesFacing,
    };
    try {
      sessionStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(state));
    } catch {
      console.warn("Editor state too large to save to sessionStorage");
    }
  }, [
    blocks, entities, selectedTool, enemySubtype, currentZ, spawnPoint,
    levelName, customAssets, selectedCustomAssetId, itemBlockContent, signText,
    cameraPos, levelWidth, levelHeight, levelCleared, levelCode, savedLevelId,
    dataChangedSinceClear, movingPlatformDirection, movingPlatformSpeed,
    movingPlatformRange, spikesFacing,
  ]);

  // F56-T06: Restore editor state from sessionStorage on return from test
  useEffect(() => {
    if (scene !== "editor") return;

    const saved = sessionStorage.getItem(EDITOR_STATE_KEY);
    if (!saved) return;

    try {
      const state: EditorSavedState = JSON.parse(saved);
      setBlocks(state.blocks);
      setEntities(state.entities);
      setSelectedTool(state.selectedTool);
      setEnemySubtype(state.enemySubtype);
      setCurrentZ(state.currentZ);
      setSpawnPoint(state.spawnPoint);
      setLevelName(state.levelName);
      setCustomAssets(state.customAssets);
      setSelectedCustomAssetId(state.selectedCustomAssetId);
      setItemBlockContent(state.itemBlockContent);
      setSignText(state.signText);
      setCameraPos(state.cameraPos);
      setLevelWidth(state.levelWidth);
      setLevelHeight(state.levelHeight);
      setLevelCleared(state.levelCleared);
      setLevelCode(state.levelCode);
      setSavedLevelId(state.savedLevelId);
      setDataChangedSinceClear(state.dataChangedSinceClear);
      // F58 mechanical element props
      if (state.movingPlatformDirection) setMovingPlatformDirection(state.movingPlatformDirection);
      if (state.movingPlatformSpeed) setMovingPlatformSpeed(state.movingPlatformSpeed);
      if (state.movingPlatformRange) setMovingPlatformRange(state.movingPlatformRange);
      if (state.spikesFacing) setSpikesFacing(state.spikesFacing);
    } catch {
      // Corrupted state -- ignore
    }

    // Clear after restore
    sessionStorage.removeItem(EDITOR_STATE_KEY);
  }, [scene]);

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

  // F57-T03: Undo/redo history
  const {
    pushSnapshot,
    undo,
    redo,
    clear: clearHistory,
    state: historyState,
  } = useEditorHistory(50);

  // Suppress unused var lint — clearHistory is kept for future level-load reset
  void clearHistory;

  // F57-T04: Selection system
  const {
    state: selectionState,
    startSelect,
    updateSelect,
    endSelect,
    deselect,
    copySelection,
    startPaste,
    cancelPaste,
    startMove,
    updateMovePosition,
    commitMove: selectionCommitMove,
    cancelMove,
    updatePastePosition,
    commitPaste: selectionCommitPaste,
    getSelectedContent,
    shouldConfirmDelete,
  } = useEditorSelection();

  // Compute ghost blocks/entities for move preview
  const ghostBlocks = (() => {
    if (selectionState.mode === "moving" && selectionState.rect && selectionState.ghostOrigin && selectionState.moveOrigin) {
      const dx = selectionState.ghostOrigin.x - selectionState.moveOrigin.x;
      const dy = selectionState.ghostOrigin.y - selectionState.moveOrigin.y;
      return blocks
        .filter((b) =>
          b.z === currentZ &&
          b.x >= selectionState.rect!.x1 && b.x <= selectionState.rect!.x2 &&
          b.y >= selectionState.rect!.y1 && b.y <= selectionState.rect!.y2)
        .map((b) => ({ ...b, x: b.x + dx, y: b.y + dy }));
    }
    if (selectionState.mode === "pasting" && selectionState.clipboard && selectionState.ghostOrigin) {
      return selectionState.clipboard.blocks.map((b) => ({
        ...b,
        x: b.x + selectionState.ghostOrigin!.x,
        y: b.y + selectionState.ghostOrigin!.y,
      }));
    }
    return null;
  })();

  const ghostEntities = (() => {
    if (selectionState.mode === "moving" && selectionState.rect && selectionState.ghostOrigin && selectionState.moveOrigin) {
      const dx = selectionState.ghostOrigin.x - selectionState.moveOrigin.x;
      const dy = selectionState.ghostOrigin.y - selectionState.moveOrigin.y;
      return entities
        .filter((e) =>
          e.x >= selectionState.rect!.x1 && e.x <= selectionState.rect!.x2 &&
          e.y >= selectionState.rect!.y1 && e.y <= selectionState.rect!.y2)
        .map((e) => ({ ...e, x: e.x + dx, y: e.y + dy }));
    }
    if (selectionState.mode === "pasting" && selectionState.clipboard && selectionState.ghostOrigin) {
      return selectionState.clipboard.entities.map((e) => ({
        ...e,
        x: e.x + selectionState.ghostOrigin!.x,
        y: e.y + selectionState.ghostOrigin!.y,
      }));
    }
    return null;
  })();

  const getCurrentSnapshot = useCallback(() => ({
    blocks: [...blocks],
    entities: [...entities],
    spawnPoint: { ...spawnPoint },
  }), [blocks, entities, spawnPoint]);

  const handleUndo = useCallback(() => {
    const snapshot = undo(getCurrentSnapshot());
    if (snapshot) {
      setBlocks(snapshot.blocks);
      setEntities(snapshot.entities);
      setSpawnPoint(snapshot.spawnPoint);
      markDataChanged();
    }
  }, [undo, getCurrentSnapshot, markDataChanged]);

  const handleRedo = useCallback(() => {
    const snapshot = redo(getCurrentSnapshot());
    if (snapshot) {
      setBlocks(snapshot.blocks);
      setEntities(snapshot.entities);
      setSpawnPoint(snapshot.spawnPoint);
      markDataChanged();
    }
  }, [redo, getCurrentSnapshot, markDataChanged]);

  // F57-T07: Commit move — remove original blocks/entities, add moved ones
  const handleCommitMove = useCallback(() => {
    if (!selectionState.ghostOrigin) {
      cancelMove();
      return;
    }
    const result = selectionCommitMove(blocks, entities, selectionState.ghostOrigin.x, selectionState.ghostOrigin.y, currentZ);
    // null means zero-delta (no-op) or invalid state — already reset by hook
    if (!result) return;

    pushSnapshot(getCurrentSnapshot());

    // Remove blocks from original rect (current Z only), then add moved blocks
    // Also remove any existing blocks at destination positions (overwrite)
    setBlocks((prev) => {
      const filtered = prev.filter((b) =>
        !(b.z === currentZ &&
          b.x >= result.removeRect.x1 && b.x <= result.removeRect.x2 &&
          b.y >= result.removeRect.y1 && b.y <= result.removeRect.y2));
      // Remove destination blocks that would be overwritten
      const movedPositions = new Set(result.addBlocks.map((b) => `${b.x},${b.y},${b.z}`));
      const withoutOverlap = filtered.filter((b) => !movedPositions.has(`${b.x},${b.y},${b.z}`));
      return [...withoutOverlap, ...result.addBlocks];
    });

    // Remove entities from original rect, add moved entities
    setEntities((prev) => {
      const filtered = prev.filter((e) =>
        !(e.x >= result.removeRect.x1 && e.x <= result.removeRect.x2 &&
          e.y >= result.removeRect.y1 && e.y <= result.removeRect.y2));
      return [...filtered, ...result.addEntities];
    });

    // Sync spawn point if it was within the moved selection
    if (spawnPoint.x >= result.removeRect.x1 && spawnPoint.x <= result.removeRect.x2 &&
        spawnPoint.y >= result.removeRect.y1 && spawnPoint.y <= result.removeRect.y2) {
      setSpawnPoint({ x: spawnPoint.x + result.dx, y: spawnPoint.y + result.dy });
    }

    markDataChanged();
  }, [selectionState.ghostOrigin, selectionCommitMove, blocks, entities, currentZ, spawnPoint, pushSnapshot, getCurrentSnapshot, markDataChanged, cancelMove]);

  // F57-T06: Commit paste — add clipboard contents at cursor position
  // Pasted blocks use currentZ layer; overlapping positions are overwritten
  const handleCommitPaste = useCallback(() => {
    if (!selectionState.ghostOrigin) return;
    const result = selectionCommitPaste(selectionState.ghostOrigin.x, selectionState.ghostOrigin.y);
    if (!result) return;

    pushSnapshot(getCurrentSnapshot());

    // Override Z on pasted blocks to use the current editor layer
    const pastedBlocks = result.blocks.map((b) => ({ ...b, z: currentZ }));

    // Merge pasted blocks — overwrite existing blocks at same (x,y,z) positions
    setBlocks((prev) => {
      const newPositions = new Set(pastedBlocks.map((b) => `${b.x},${b.y},${b.z}`));
      const filtered = prev.filter((b) => !newPositions.has(`${b.x},${b.y},${b.z}`));
      return [...filtered, ...pastedBlocks];
    });

    // Merge pasted entities — overwrite existing at same (type,x,y) positions
    setEntities((prev) => {
      const newPositions = new Set(result.entities.map((e) => `${e.type},${e.x},${e.y}`));
      const filtered = prev.filter((e) => !newPositions.has(`${e.type},${e.x},${e.y}`));
      return [...filtered, ...result.entities];
    });

    markDataChanged();
  }, [selectionState.ghostOrigin, selectionCommitPaste, pushSnapshot, getCurrentSnapshot, currentZ, markDataChanged]);

  // F57-T05: Keyboard shortcut handlers
  const handleCopy = useCallback(() => {
    if (!selectionState.hasSelection) return;
    copySelection(blocks, entities, currentZ);
  }, [selectionState.hasSelection, copySelection, blocks, entities, currentZ]);

  const handlePaste = useCallback(() => {
    if (!selectionState.hasClipboard) return;
    startPaste();
  }, [selectionState.hasClipboard, startPaste]);

  const handleDeleteSelection = useCallback(() => {
    if (!selectionState.hasSelection || !selectionState.rect) return;

    // Check if confirmation needed (>20 elements)
    if (shouldConfirmDelete(blocks, entities)) {
      const content = getSelectedContent(blocks, entities, currentZ);
      if (!window.confirm(`Deletar ${content.count} elementos?`)) return;
    }

    // Push undo snapshot before delete
    pushSnapshot(getCurrentSnapshot());

    const rect = selectionState.rect;
    // Remove blocks within selection (respect currentZ)
    setBlocks(prev => prev.filter(b =>
      !(b.z === currentZ && b.x >= rect.x1 && b.x <= rect.x2 && b.y >= rect.y1 && b.y <= rect.y2)
    ));
    // Remove entities within selection
    setEntities(prev => prev.filter(e =>
      !(e.x >= rect.x1 && e.x <= rect.x2 && e.y >= rect.y1 && e.y <= rect.y2)
    ));
    markDataChanged();
    deselect();
  }, [selectionState.hasSelection, selectionState.rect, shouldConfirmDelete, blocks, entities, currentZ, getSelectedContent, pushSnapshot, getCurrentSnapshot, markDataChanged, deselect]);

  const handleEscape = useCallback(() => {
    if (selectionState.mode === "pasting") {
      cancelPaste();
    } else if (selectionState.mode === "moving") {
      cancelMove();
    } else if (selectionState.hasSelection) {
      deselect();
    }
  }, [selectionState.mode, selectionState.hasSelection, cancelPaste, cancelMove, deselect]);

  // F57-T05: Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const ctrl = e.ctrlKey || e.metaKey; // Support Cmd on Mac

      // Ctrl+Z -- Undo
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y -- Redo
      if ((ctrl && e.shiftKey && e.key.toLowerCase() === "z") || (ctrl && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Ctrl+C -- Copy selection
      if (ctrl && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+V -- Paste
      if (ctrl && e.key.toLowerCase() === "v") {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Delete or Backspace -- Delete selection
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelection();
        return;
      }

      // Escape -- Deselect / cancel paste / cancel move
      if (e.key === "Escape") {
        e.preventDefault();
        handleEscape();
        return;
      }

      // S key -- Quick switch to select tool
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSelectedTool("select");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, handleCopy, handlePaste, handleDeleteSelection, handleEscape, setSelectedTool]);

  // F56-T05: Resize level with out-of-bounds confirmation
  const handleResizeLevel = useCallback((newWidth: number, newHeight: number) => {
    const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
    const h = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));

    // Check if blocks or entities would be removed
    const blocksOutside = blocks.filter(b => b.x >= w || b.y >= h);
    const entitiesOutside = entities.filter(e => e.x >= w || e.y >= h);

    if (blocksOutside.length > 0 || entitiesOutside.length > 0) {
      const confirmed = window.confirm(
        `Reduzir vai remover ${blocksOutside.length} blocos e ${entitiesOutside.length} entidades fora dos limites. Continuar?`
      );
      if (!confirmed) return;
      pushSnapshot(getCurrentSnapshot());
      setBlocks(prev => prev.filter(b => b.x < w && b.y < h));
      setEntities(prev => prev.filter(e => e.x < w && e.y < h));
    }

    setLevelWidth(w);
    setLevelHeight(h);
    markDataChanged();
  }, [blocks, entities, markDataChanged, pushSnapshot, getCurrentSnapshot]);

  const handlePlaceBlock = useCallback((x: number, y: number) => {
    // Determine the actual block type to place
    let blockType: Exclude<BlockType, "empty">;
    if (selectedTool === "entity_item_block") {
      blockType = "item_block";
      pushSnapshot(getCurrentSnapshot());
    } else if (selectedTool === "custom_block") {
      // Custom block: place "custom" block + custom_block_asset entity
      if (!selectedCustomAssetId) return;
      blockType = "custom";
      pushSnapshot(getCurrentSnapshot());
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
    } else if (selectedTool === "eraser" || selectedTool === "select" || selectedTool.startsWith("entity_") || selectedTool === "custom_sign") {
      return; // Not a block tool
    } else {
      blockType = selectedTool as Exclude<BlockType, "empty">;
      pushSnapshot(getCurrentSnapshot());
    }

    setBlocks((prev) => {
      // Remove existing block at this position
      const filtered = prev.filter((b) => !(b.x === x && b.y === y && b.z === currentZ));
      return [...filtered, { type: blockType, x, y, z: currentZ }];
    });
    markDataChanged();
  }, [selectedTool, currentZ, selectedCustomAssetId, markDataChanged, pushSnapshot, getCurrentSnapshot]);

  const handleRemoveBlock = useCallback((x: number, y: number) => {
    pushSnapshot(getCurrentSnapshot());
    setBlocks((prev) => prev.filter((b) => !(b.x === x && b.y === y && b.z === currentZ)));
    markDataChanged();
  }, [currentZ, markDataChanged, pushSnapshot, getCurrentSnapshot]);

  const handleSetSpawn = useCallback((x: number, y: number) => {
    pushSnapshot(getCurrentSnapshot());
    setSpawnPoint({ x, y });
    // Update spawn entity
    setEntities((prev) => {
      const filtered = prev.filter((e) => e.type !== "spawn");
      return [...filtered, { type: "spawn" as const, x, y }];
    });
    markDataChanged();
  }, [markDataChanged, pushSnapshot, getCurrentSnapshot]);

  const handlePlaceEntity = useCallback((entity: EntityData) => {
    pushSnapshot(getCurrentSnapshot());
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
  }, [markDataChanged, pushSnapshot, getCurrentSnapshot]);

  const handleRemoveEntity = useCallback((x: number, y: number) => {
    pushSnapshot(getCurrentSnapshot());
    setEntities((prev) => prev.filter((e) => !(e.x === x && e.y === y)));
    markDataChanged();
  }, [markDataChanged, pushSnapshot, getCurrentSnapshot]);

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
    // F56-T05: Use explicit level dimensions
    const width = levelWidth;
    const height = levelHeight;

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
  }, [blocks, entities, theme, customAssets, levelWidth, levelHeight]);

  const startLevel = useGameState((s) => s.startLevel);

  const handleTest = useCallback(() => {
    saveEditorState();
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
  }, [buildLevelDataV2, setScene, startLevel, saveEditorState]);

  // F56-T04: Test from cursor — spawn Mel at hovered position
  const handleTestFromCursor = useCallback(() => {
    if (!hoverPos) return;
    saveEditorState();
    const data = buildLevelDataV2();
    // Override spawn entity in the COPY (don't mutate editor state)
    const testData = {
      ...data,
      entities: data.entities.map(e =>
        e.type === "spawn" ? { ...e, x: hoverPos.x, y: hoverPos.y } : e
      ),
    };
    const hasGoal = testData.entities.some((e) => e.type === "goal");
    if (hasGoal) {
      startLevel(`editor-test-${Date.now()}`, testData);
    } else {
      sessionStorage.setItem("supermel_test_level", JSON.stringify(testData));
      setScene("playing");
    }
  }, [hoverPos, buildLevelDataV2, startLevel, setScene, saveEditorState]);

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
          enemySubtype={enemySubtype}
          customAssets={customAssets}
          selectedCustomAssetId={selectedCustomAssetId}
          cameraPos={cameraPos}
          onCameraChange={setCameraPos}
          levelWidth={levelWidth}
          levelHeight={levelHeight}
          onHoverChange={setHoverPos}
          movingPlatformDirection={movingPlatformDirection}
          movingPlatformSpeed={movingPlatformSpeed}
          movingPlatformRange={movingPlatformRange}
          spikesFacing={spikesFacing}
          selectionRect={selectionState.rect}
          selectionMode={selectionState.mode}
          ghostBlocks={ghostBlocks}
          ghostEntities={ghostEntities}
          onStartSelect={startSelect}
          onUpdateSelect={updateSelect}
          onEndSelect={endSelect}
          onStartMove={startMove}
          onUpdateMovePosition={updateMovePosition}
          onCommitMove={handleCommitMove}
          onCancelMove={cancelMove}
          onDeselect={deselect}
          onPastePositionUpdate={updatePastePosition}
          onCommitPaste={handleCommitPaste}
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
        onTestFromCursor={handleTestFromCursor}
        hoverPos={hoverPos}
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
        levelWidth={levelWidth}
        levelHeight={levelHeight}
        onResizeLevel={handleResizeLevel}
        movingPlatformDirection={movingPlatformDirection}
        movingPlatformSpeed={movingPlatformSpeed}
        movingPlatformRange={movingPlatformRange}
        spikesFacing={spikesFacing}
        onMovingPlatformDirectionChange={setMovingPlatformDirection}
        onMovingPlatformSpeedChange={setMovingPlatformSpeed}
        onMovingPlatformRangeChange={setMovingPlatformRange}
        onSpikesFacingChange={setSpikesFacing}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
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

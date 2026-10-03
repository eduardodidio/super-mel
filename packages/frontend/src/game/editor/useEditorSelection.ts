import { useState, useCallback } from "react";
import type { BlockType, EntityData } from "@super-mel/shared";

// --- Types ---

interface EditorBlock {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
}

/** Normalized selection rectangle (x1 <= x2, y1 <= y2) */
export interface SelectionRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Clipboard contents with positions relative to selection origin */
export interface EditorClipboard {
  blocks: EditorBlock[];
  entities: EntityData[];
  width: number; // x2 - x1 + 1
  height: number; // y2 - y1 + 1
}

export type SelectionMode = "idle" | "selecting" | "selected" | "pasting" | "moving";

export interface SelectionState {
  mode: SelectionMode;
  rect: SelectionRect | null;
  clipboard: EditorClipboard | null;
  hasSelection: boolean;
  hasClipboard: boolean;
  /** During paste/move, the cursor grid position for ghost preview */
  ghostOrigin: { x: number; y: number } | null;
  /** During move, the grid position where the drag started */
  moveOrigin: { x: number; y: number } | null;
}

// --- Helpers ---

/** Normalize raw drag coordinates into a rect where x1<=x2, y1<=y2 */
function normalizeRect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): SelectionRect {
  return {
    x1: Math.min(ax, bx),
    y1: Math.min(ay, by),
    x2: Math.max(ax, bx),
    y2: Math.max(ay, by),
  };
}

/** Check if a point is inside a selection rect (inclusive) */
function isInRect(x: number, y: number, rect: SelectionRect): boolean {
  return x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2;
}

// --- Hook ---

export function useEditorSelection() {
  const [mode, setMode] = useState<SelectionMode>("idle");
  const [rawStart, setRawStart] = useState<{ x: number; y: number } | null>(null);
  const [rawEnd, setRawEnd] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<SelectionRect | null>(null);
  const [clipboard, setClipboard] = useState<EditorClipboard | null>(null);
  const [ghostOrigin, setGhostOrigin] = useState<{ x: number; y: number } | null>(null);
  const [moveOrigin, setMoveOrigin] = useState<{ x: number; y: number } | null>(null);

  // --- Computed state ---

  const state: SelectionState = {
    mode,
    rect,
    clipboard,
    hasSelection: rect !== null && mode !== "idle",
    hasClipboard: clipboard !== null,
    ghostOrigin,
    moveOrigin,
  };

  // --- Selection drag lifecycle ---

  const startSelect = useCallback((x: number, y: number): void => {
    setRawStart({ x, y });
    setRawEnd({ x, y });
    setRect(normalizeRect(x, y, x, y));
    setMode("selecting");
    setGhostOrigin(null);
  }, []);

  const updateSelect = useCallback(
    (x: number, y: number): void => {
      if (!rawStart) return;
      setRawEnd({ x, y });
      setRect(normalizeRect(rawStart.x, rawStart.y, x, y));
    },
    [rawStart],
  );

  const endSelect = useCallback((): void => {
    if (!rawStart || !rawEnd) {
      setMode("idle");
      return;
    }
    // Zero-area select (click without drag) => deselect
    if (rawStart.x === rawEnd.x && rawStart.y === rawEnd.y) {
      setMode("idle");
      setRect(null);
      setRawStart(null);
      setRawEnd(null);
      return;
    }
    setMode("selected");
  }, [rawStart, rawEnd]);

  const deselect = useCallback((): void => {
    setMode("idle");
    setRect(null);
    setRawStart(null);
    setRawEnd(null);
    setGhostOrigin(null);
    setMoveOrigin(null);
  }, []);

  // --- Copy ---

  const copySelection = useCallback(
    (blocks: EditorBlock[], entities: EntityData[], currentZ?: number): void => {
      if (!rect) return;

      // Filter blocks within rect (respect Z layer if provided)
      const selectedBlocks = blocks
        .filter((b) => {
          const inRect = isInRect(b.x, b.y, rect);
          if (currentZ !== undefined) {
            return inRect && b.z === currentZ;
          }
          return inRect;
        })
        .map((b) => ({
          ...b,
          x: b.x - rect.x1,
          y: b.y - rect.y1,
        }));

      // Filter entities within rect (entities are 2D, no Z filtering)
      // Exclude singleton entities (spawn, goal) — they must not be duplicated via paste
      const SINGLETON_ENTITY_TYPES = new Set(["spawn", "goal"]);
      const selectedEntities = entities
        .filter((e) => isInRect(e.x, e.y, rect) && !SINGLETON_ENTITY_TYPES.has(e.type))
        .map((e) => ({
          ...e,
          x: e.x - rect.x1,
          y: e.y - rect.y1,
        }));

      setClipboard({
        blocks: selectedBlocks,
        entities: selectedEntities,
        width: rect.x2 - rect.x1 + 1,
        height: rect.y2 - rect.y1 + 1,
      });
    },
    [rect],
  );

  // --- Paste workflow ---

  const startPaste = useCallback((): void => {
    if (!clipboard) return;
    setMode("pasting");
    setGhostOrigin(null);
  }, [clipboard]);

  const updatePastePosition = useCallback((x: number, y: number): void => {
    setGhostOrigin({ x, y });
  }, []);

  const commitPaste = useCallback(
    (
      cursorX: number,
      cursorY: number,
    ): { blocks: EditorBlock[]; entities: EntityData[] } | null => {
      if (!clipboard) return null;

      const newBlocks = clipboard.blocks.map((b) => ({
        ...b,
        x: b.x + cursorX,
        y: b.y + cursorY,
      }));

      const newEntities = clipboard.entities.map((e) => ({
        ...e,
        x: e.x + cursorX,
        y: e.y + cursorY,
      }));

      setMode("selected");
      setGhostOrigin(null);

      return { blocks: newBlocks, entities: newEntities };
    },
    [clipboard],
  );

  const cancelPaste = useCallback((): void => {
    setMode("selected");
    setGhostOrigin(null);
  }, []);

  // --- Move workflow ---

  const startMove = useCallback(
    (x: number, y: number): void => {
      if (!rect) return;
      setMode("moving");
      setMoveOrigin({ x, y });
      setGhostOrigin({ x, y });
    },
    [rect],
  );

  const updateMovePosition = useCallback((x: number, y: number): void => {
    setGhostOrigin({ x, y });
  }, []);

  const commitMove = useCallback(
    (
      blocks: EditorBlock[],
      entities: EntityData[],
      cursorX: number,
      cursorY: number,
      currentZ?: number,
    ): {
      removeRect: SelectionRect;
      addBlocks: EditorBlock[];
      addEntities: EntityData[];
      dx: number;
      dy: number;
    } | null => {
      if (!rect || !moveOrigin) return null;

      // Compute delta from drag start to current cursor
      const dx = cursorX - moveOrigin.x;
      const dy = cursorY - moveOrigin.y;

      // Zero-delta move is a no-op
      if (dx === 0 && dy === 0) {
        setMode("selected");
        setGhostOrigin(null);
        setMoveOrigin(null);
        return null;
      }

      // Get blocks from the original selection rect (respect Z layer)
      const movedBlocks = blocks
        .filter((b) => {
          const inRect = isInRect(b.x, b.y, rect);
          if (currentZ !== undefined) {
            return inRect && b.z === currentZ;
          }
          return inRect;
        })
        .map((b) => ({
          ...b,
          x: b.x + dx,
          y: b.y + dy,
        }));

      // Get entities from the original selection rect
      const movedEntities = entities
        .filter((e) => isInRect(e.x, e.y, rect))
        .map((e) => ({
          ...e,
          x: e.x + dx,
          y: e.y + dy,
        }));

      const removeRect = { ...rect };

      // Update the selection rect to the new position
      const newRect: SelectionRect = {
        x1: rect.x1 + dx,
        y1: rect.y1 + dy,
        x2: rect.x2 + dx,
        y2: rect.y2 + dy,
      };
      setRect(newRect);
      setMode("selected");
      setGhostOrigin(null);
      setMoveOrigin(null);

      return {
        removeRect,
        addBlocks: movedBlocks,
        addEntities: movedEntities,
        dx,
        dy,
      };
    },
    [rect, moveOrigin],
  );

  const cancelMove = useCallback((): void => {
    setMode("selected");
    setGhostOrigin(null);
    setMoveOrigin(null);
  }, []);

  // --- Query helpers ---

  const getSelectedContent = useCallback(
    (
      blocks: EditorBlock[],
      entities: EntityData[],
      currentZ?: number,
    ): {
      blocks: EditorBlock[];
      entities: EntityData[];
      count: number;
    } => {
      if (!rect) return { blocks: [], entities: [], count: 0 };

      const selectedBlocks = blocks.filter((b) => {
        const inRect = isInRect(b.x, b.y, rect);
        if (currentZ !== undefined) {
          return inRect && b.z === currentZ;
        }
        return inRect;
      });

      const selectedEntities = entities.filter((e) => isInRect(e.x, e.y, rect));

      return {
        blocks: selectedBlocks,
        entities: selectedEntities,
        count: selectedBlocks.length + selectedEntities.length,
      };
    },
    [rect],
  );

  const shouldConfirmDelete = useCallback(
    (blocks: EditorBlock[], entities: EntityData[]): boolean => {
      if (!rect) return false;
      const { count } = getSelectedContent(blocks, entities);
      return count > 20;
    },
    [rect, getSelectedContent],
  );

  return {
    state,
    startSelect,
    updateSelect,
    endSelect,
    deselect,
    copySelection,
    startPaste,
    updatePastePosition,
    commitPaste,
    cancelPaste,
    startMove,
    updateMovePosition,
    commitMove,
    cancelMove,
    getSelectedContent,
    shouldConfirmDelete,
  };
}

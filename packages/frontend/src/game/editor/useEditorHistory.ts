import { useRef, useState, useCallback } from "react";
import type { BlockType, EntityData } from "@super-mel/shared";

// --- Types ---

interface EditorBlock {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
}

export interface EditorSnapshot {
  blocks: EditorBlock[];
  entities: EntityData[];
  spawnPoint: { x: number; y: number };
}

export interface EditorHistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

// --- Deep clone helper ---

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// --- Default max snapshots ---

const DEFAULT_MAX_SNAPSHOTS = 50;

// --- Hook ---

export function useEditorHistory(maxSnapshots: number = DEFAULT_MAX_SNAPSHOTS) {
  const undoStack = useRef<EditorSnapshot[]>([]);
  const redoStack = useRef<EditorSnapshot[]>([]);

  // Version counter to trigger re-renders when stacks change
  const [version, setVersion] = useState(0);

  const bumpVersion = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const pushSnapshot = useCallback(
    (snapshot: EditorSnapshot): void => {
      // Deep-clone and push to undo stack
      undoStack.current.push(deepClone(snapshot));

      // Trim undo stack if over limit (drop oldest)
      while (undoStack.current.length > maxSnapshots) {
        undoStack.current.shift();
      }

      // New mutation clears redo stack
      redoStack.current.length = 0;

      bumpVersion();
    },
    [maxSnapshots, bumpVersion],
  );

  const undo = useCallback(
    (currentState: EditorSnapshot): EditorSnapshot | null => {
      if (undoStack.current.length === 0) {
        return null;
      }

      // Pop last entry from undo stack
      const restored = undoStack.current.pop()!;

      // Push deep-clone of current state to redo stack
      redoStack.current.push(deepClone(currentState));

      bumpVersion();
      return restored;
    },
    [bumpVersion],
  );

  const redo = useCallback(
    (currentState: EditorSnapshot): EditorSnapshot | null => {
      if (redoStack.current.length === 0) {
        return null;
      }

      // Pop last entry from redo stack
      const restored = redoStack.current.pop()!;

      // Push deep-clone of current state to undo stack
      undoStack.current.push(deepClone(currentState));

      bumpVersion();
      return restored;
    },
    [bumpVersion],
  );

  const clear = useCallback((): void => {
    undoStack.current.length = 0;
    redoStack.current.length = 0;
    bumpVersion();
  }, [bumpVersion]);

  // Reactive state object (recalculated on each version bump)
  const state: EditorHistoryState = {
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    undoCount: undoStack.current.length,
    redoCount: redoStack.current.length,
  };

  // Suppress unused variable lint — version drives re-renders
  void version;

  return { pushSnapshot, undo, redo, clear, state };
}

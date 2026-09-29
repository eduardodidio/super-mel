import { useState, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Block } from "../entities/Block";
import { Heart } from "../entities/Heart";
import { generateChunk, getVisibleChunkIndices, type Chunk } from "./ChunkGenerator";

interface ChunkRendererProps {
  playerX: number;
  onBlockDestroyed?: (x: number, y: number) => void;
  onHeartCollected?: () => void;
}

export function ChunkRenderer({ playerX, onBlockDestroyed, onHeartCollected }: ChunkRendererProps) {
  const [chunks, setChunks] = useState<Map<number, Chunk>>(new Map());
  const lastUpdate = useRef(0);
  const destroyedBlocks = useRef(new Set<string>());
  const collectedHearts = useRef(new Set<string>());

  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdate.current < 200) return;
    lastUpdate.current = now;

    const visibleIndices = getVisibleChunkIndices(playerX, 4);
    setChunks((prev) => {
      let changed = false;
      const next = new Map(prev);

      for (const idx of visibleIndices) {
        if (!next.has(idx)) {
          next.set(idx, generateChunk(idx));
          changed = true;
        }
      }

      for (const [idx] of next) {
        if (!visibleIndices.includes(idx)) {
          next.delete(idx);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  });

  const handleDestroy = useCallback((key: string, x: number, y: number) => {
    destroyedBlocks.current.add(key);
    onBlockDestroyed?.(x, y);
  }, [onBlockDestroyed]);

  const handleHeartCollect = useCallback((key: string) => {
    collectedHearts.current.add(key);
    onHeartCollected?.();
  }, [onHeartCollected]);

  return (
    <>
      {Array.from(chunks.values()).flatMap((chunk) => [
        ...chunk.blocks
          .filter((b) => !destroyedBlocks.current.has(`${b.x},${b.y},${b.z}`))
          .map((b) => (
            <Block
              key={`${b.x},${b.y},${b.z}`}
              type={b.type}
              position={[b.x, b.y, b.z]}
              isBackground={b.isBackground}
              onDestroy={() => handleDestroy(`${b.x},${b.y},${b.z}`, b.x, b.y)}
            />
          )),
        ...chunk.hearts
          .filter((h) => !collectedHearts.current.has(`h-${h.x},${h.y}`))
          .map((h) => (
            <Heart
              key={`h-${h.x},${h.y}`}
              position={[h.x, h.y, 0]}
              onCollect={() => handleHeartCollect(`h-${h.x},${h.y}`)}
            />
          )),
      ])}
    </>
  );
}

import { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Block } from "../entities/Block";
import { generateChunk, getVisibleChunkIndices, type Chunk } from "./ChunkGenerator";

interface ChunkRendererProps {
  playerX: number;
  onBlockDestroyed?: (x: number, y: number) => void;
}

export function ChunkRenderer({ playerX, onBlockDestroyed }: ChunkRendererProps) {
  const [chunks, setChunks] = useState<Map<number, Chunk>>(new Map());
  const lastUpdate = useRef(0);
  const destroyedBlocks = useRef(new Set<string>());

  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdate.current < 200) return; // throttle updates
    lastUpdate.current = now;

    const visibleIndices = getVisibleChunkIndices(playerX, 4);
    setChunks((prev) => {
      let changed = false;
      const next = new Map(prev);

      // Add new chunks
      for (const idx of visibleIndices) {
        if (!next.has(idx)) {
          next.set(idx, generateChunk(idx));
          changed = true;
        }
      }

      // Remove far chunks
      for (const [idx] of next) {
        if (!visibleIndices.includes(idx) && idx < visibleIndices[0]) {
          next.delete(idx);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  });

  const handleDestroy = (key: string, x: number, y: number) => {
    destroyedBlocks.current.add(key);
    onBlockDestroyed?.(x, y);
  };

  return (
    <>
      {Array.from(chunks.values()).flatMap((chunk) =>
        chunk.blocks
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
      )}
    </>
  );
}

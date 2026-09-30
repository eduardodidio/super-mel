import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import { Block } from "../entities/Block";
import { Heart } from "../entities/Heart";
import { Coin } from "../entities/Coin";
import { generateChunk, getVisibleChunkIndices, type Chunk } from "./ChunkGenerator";

interface ChunkRendererProps {
  playerPosRef: React.RefObject<{ x: number; y: number }>;
  onBlockDestroyed?: (x: number, y: number) => void;
  onHeartCollected?: () => void;
  onCoinCollected?: () => void;
  testChunks?: Chunk[];
}

export interface ChunkRendererHandle {
  destroyBlock: (x: number, y: number, z: number) => boolean;
  activateBlock: (x: number, y: number, z: number) => boolean;
}

export const ChunkRenderer = forwardRef<ChunkRendererHandle, ChunkRendererProps>(
  function ChunkRenderer({ playerPosRef, onBlockDestroyed, onHeartCollected, onCoinCollected, testChunks }, ref) {
    const [chunks, setChunks] = useState<Map<number, Chunk>>(() => {
      if (testChunks) {
        const map = new Map<number, Chunk>();
        testChunks.forEach((chunk, i) => map.set(i, chunk));
        return map;
      }
      return new Map();
    });
    const lastUpdate = useRef(0);
    const destroyedBlocks = useRef(new Set<string>());
    const activatedBlocks = useRef(new Set<string>());
    const collectedHearts = useRef(new Set<string>());
    const collectedCoins = useRef(new Set<string>());
    const [renderTick, setRenderTick] = useState(0);

    useImperativeHandle(ref, () => ({
      destroyBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        if (destroyedBlocks.current.has(key)) return false;
        destroyedBlocks.current.add(key);
        setRenderTick(t => t + 1);
        onBlockDestroyed?.(x, y);
        return true;
      },
      activateBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        if (activatedBlocks.current.has(key)) return false;
        activatedBlocks.current.add(key);
        setRenderTick(t => t + 1);
        return true;
      },
    }));

    useFrame(() => {
      if (testChunks) return;
      const now = performance.now();
      if (now - lastUpdate.current < 200) return;
      lastUpdate.current = now;

      const playerX = playerPosRef.current?.x ?? 0;
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

    const handleCoinCollect = useCallback((key: string) => {
      collectedCoins.current.add(key);
      onCoinCollected?.();
    }, [onCoinCollected]);

    // renderTick is used to force re-render when blocks are destroyed/activated externally
    void renderTick;

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
                activated={activatedBlocks.current.has(`${b.x},${b.y},${b.z}`)}
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
          ...chunk.coins
            .filter((c) => !collectedCoins.current.has(`c-${c.x},${c.y}`))
            .map((c) => (
              <Coin
                key={`c-${c.x},${c.y}`}
                position={[c.x, c.y, 0]}
                onCollect={() => handleCoinCollect(`c-${c.x},${c.y}`)}
              />
            )),
        ])}
      </>
    );
  }
);

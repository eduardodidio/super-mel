import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import { Block, BlockParticles } from "../entities/Block";
import { Heart } from "../entities/Heart";
import { Coin } from "../entities/Coin";
import { generateChunk, generateChunkBiome, getVisibleChunkIndices, type Chunk, type EnemyChunkData } from "./ChunkGenerator";
import { getBiomeForChunk } from "./BiomeManager";
import { getPrefabCandidates, chunkDifficultyRange } from "./PrefabLibrary";
import { useGameState } from "../hooks/useGameState";
import type { BlockType } from "@super-mel/shared";

interface ChunkRendererProps {
  playerPosRef: React.RefObject<{ x: number; y: number }>;
  onBlockDestroyed?: (x: number, y: number) => void;
  onHeartCollected?: () => void;
  onCoinCollected?: () => void;
  onEnemiesUpdate?: (enemies: EnemyChunkData[]) => void;
  testChunks?: Chunk[];
  baseSeed?: number;
  biomeEnabled?: boolean;
}

export interface ChunkRendererHandle {
  destroyBlock: (x: number, y: number, z: number) => boolean;
  activateBlock: (x: number, y: number, z: number) => boolean;
  getBlockAt: (x: number, y: number, z: number) => BlockType | null;
  isBlockActivated: (x: number, y: number, z: number) => boolean;
}

interface DestroyEffect {
  key: string;
  position: [number, number, number];
  type: Exclude<BlockType, "empty">;
}

export const ChunkRenderer = forwardRef<ChunkRendererHandle, ChunkRendererProps>(
  function ChunkRenderer({ playerPosRef, onBlockDestroyed, onHeartCollected, onCoinCollected, onEnemiesUpdate, testChunks, baseSeed, biomeEnabled }, ref) {
    const [chunks, setChunks] = useState<Map<number, Chunk>>(() => {
      if (testChunks) {
        const map = new Map<number, Chunk>();
        testChunks.forEach((chunk, i) => map.set(i, chunk));
        return map;
      }
      return new Map();
    });
    const lastUpdate = useRef(0);

    // Destroyed blocks: state drives re-renders, ref provides synchronous deduplication guard
    const [destroyedBlocks, setDestroyedBlocks] = useState<Set<string>>(() => new Set());
    const destroyedKeysRef = useRef(new Set<string>());

    // Activated blocks: same dual pattern
    const [activatedBlocks, setActivatedBlocks] = useState<Set<string>>(() => new Set());
    const activatedKeysRef = useRef(new Set<string>());

    const collectedHearts = useRef(new Set<string>());
    const collectedCoins = useRef(new Set<string>());

    // Particle effects for destroyed blocks
    const [destroyEffects, setDestroyEffects] = useState<DestroyEffect[]>([]);

    useImperativeHandle(ref, () => ({
      destroyBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        if (destroyedKeysRef.current.has(key)) return false;

        // Find block type for particle effect before marking destroyed
        let blockType: Exclude<BlockType, "empty"> | null = null;
        for (const chunk of chunks.values()) {
          for (const b of chunk.blocks) {
            if (b.x === x && b.y === y && b.z === z) {
              blockType = b.type;
              break;
            }
          }
          if (blockType) break;
        }

        // Mark destroyed: ref for sync guard, state for re-render
        destroyedKeysRef.current.add(key);
        setDestroyedBlocks(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });

        // Spawn particle effect
        if (blockType) {
          setDestroyEffects(prev => [
            ...prev,
            { key: `fx-${key}`, position: [x, y, z], type: blockType! }
          ]);
        }

        onBlockDestroyed?.(x, y);
        return true;
      },
      activateBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        if (activatedKeysRef.current.has(key)) return false;
        activatedKeysRef.current.add(key);
        setActivatedBlocks(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
        return true;
      },
      getBlockAt(x, y, z) {
        const key = `${x},${y},${z}`;
        if (destroyedKeysRef.current.has(key)) return null;
        for (const chunk of chunks.values()) {
          for (const b of chunk.blocks) {
            if (b.x === x && b.y === y && b.z === z) {
              return b.type;
            }
          }
        }
        return null;
      },
      isBlockActivated(x, y, z) {
        const key = `${x},${y},${z}`;
        return activatedKeysRef.current.has(key);
      },
    }), [chunks, onBlockDestroyed]);

    useFrame(() => {
      if (useGameState.getState().paused) return;
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
            if (biomeEnabled) {
              const biomeState = getBiomeForChunk(idx);
              const { min, max } = chunkDifficultyRange(idx);
              const candidates = getPrefabCandidates(min, max, biomeState.current);
              next.set(idx, generateChunkBiome(idx, baseSeed ?? 0, biomeState.current, candidates));
            } else {
              next.set(idx, generateChunk(idx, baseSeed ?? 0));
            }
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

    const handleHeartCollect = useCallback((key: string) => {
      collectedHearts.current.add(key);
      onHeartCollected?.();
    }, [onHeartCollected]);

    const handleCoinCollect = useCallback((key: string) => {
      collectedCoins.current.add(key);
      onCoinCollected?.();
    }, [onCoinCollected]);

    // Notify parent about enemies from all visible chunks
    const lastEnemyHashRef = useRef("");
    useEffect(() => {
      if (!onEnemiesUpdate) return;
      const allEnemies: EnemyChunkData[] = [];
      for (const chunk of chunks.values()) {
        if (chunk.enemies) {
          allEnemies.push(...chunk.enemies);
        }
      }
      // Only fire if enemies actually changed (avoid infinite loops)
      const hash = allEnemies.map(e => `${e.subtype}-${e.x}-${e.y}`).join("|");
      if (hash !== lastEnemyHashRef.current) {
        lastEnemyHashRef.current = hash;
        onEnemiesUpdate(allEnemies);
      }
    }, [chunks, onEnemiesUpdate]);

    return (
      <>
        {Array.from(chunks.values()).flatMap((chunk) => [
          ...chunk.blocks
            .filter((b) => !destroyedBlocks.has(`${b.x},${b.y},${b.z}`))
            .map((b) => (
              <Block
                key={`${b.x},${b.y},${b.z}`}
                type={b.type}
                position={[b.x, b.y, b.z]}
                isBackground={b.isBackground}
                activated={activatedBlocks.has(`${b.x},${b.y},${b.z}`)}
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
        {destroyEffects.map(fx => (
          <BlockParticles
            key={fx.key}
            position={fx.position}
            type={fx.type}
            onComplete={() => {
              setDestroyEffects(prev => prev.filter(e => e.key !== fx.key));
            }}
          />
        ))}
      </>
    );
  }
);

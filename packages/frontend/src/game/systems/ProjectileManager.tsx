import React, { useRef, useCallback, useState } from "react";
import { Projectile } from "../entities/Projectile";
import type { Controls } from "../hooks/useControls";
import { useGameFrame } from "../hooks/useGameFrame";

interface ProjectileManagerProps {
  controlsRef: React.RefObject<Controls>;
  playerPosRef: React.RefObject<{ x: number; y: number }>;
  facingRightRef: React.RefObject<boolean>;
  onBlockHit?: (blockName: string, blockPos: { x: number; y: number; z: number }) => void;
  onEnemyHit?: (enemyName: string) => void;
  onReturnCoinCollect?: () => void;
  /** When true, suppresses projectile spawn on the next shoot press (dig consumed it). */
  suppressNextShot?: React.MutableRefObject<boolean>;
}

interface ProjectileData {
  id: string;
  position: [number, number, number];
  direction: number;
}

export function ProjectileManager({
  controlsRef,
  playerPosRef,
  facingRightRef,
  onBlockHit,
  onEnemyHit,
  onReturnCoinCollect,
  suppressNextShot,
}: ProjectileManagerProps) {
  const [projectiles, setProjectiles] = useState<ProjectileData[]>([]);
  const cooldownRef = useRef(0);
  const lastShootRef = useRef(false);
  const idCounter = useRef(0);

  const cooldownMs = 300;

  useGameFrame((_, delta) => {
    cooldownRef.current = Math.max(0, cooldownRef.current - delta * 1000);

    const wantsShoot = controlsRef.current?.shoot ?? false;

    if (wantsShoot && !lastShootRef.current && cooldownRef.current <= 0) {
      // Check if dig consumed this shot
      if (suppressNextShot?.current) {
        suppressNextShot.current = false;
        lastShootRef.current = wantsShoot;
        cooldownRef.current = cooldownMs;
        return;
      }

      idCounter.current++;
      const playerX = playerPosRef.current?.x ?? 0;
      const playerY = playerPosRef.current?.y ?? 0;
      const facing = facingRightRef.current ?? true;
      const dir = facing ? 1 : -1;
      const newProjectile: ProjectileData = {
        id: `proj-${idCounter.current}`,
        position: [playerX + dir * 0.8, playerY + 0.1, 0],
        direction: dir,
      };
      setProjectiles((prev) => [...prev, newProjectile]);
      cooldownRef.current = cooldownMs;
    }

    lastShootRef.current = wantsShoot;
  });

  const handleHit = useCallback((id: string, targetName?: string, blockPos?: { x: number; y: number; z: number }) => {
    if (targetName && blockPos) onBlockHit?.(targetName, blockPos);
  }, [onBlockHit]);

  const handleEnemyHit = useCallback((id: string, enemyName: string) => {
    onEnemyHit?.(enemyName);
  }, [onEnemyHit]);

  const handleExpire = useCallback((id: string) => {
    setProjectiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleReturnCoinCollect = useCallback((_projId: string) => {
    onReturnCoinCollect?.();
  }, [onReturnCoinCollect]);

  return (
    <>
      {projectiles.map((p) => (
        <Projectile
          key={p.id}
          id={p.id}
          startPosition={p.position}
          direction={p.direction}
          onHit={handleHit}
          onExpire={handleExpire}
          onEnemyHit={handleEnemyHit}
          returnMode={true}
          playerPosRef={playerPosRef}
          onReturnCoinCollect={handleReturnCoinCollect}
        />
      ))}
    </>
  );
}

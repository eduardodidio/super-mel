import React, { useRef, useCallback, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Projectile } from "../entities/Projectile";
import type { Controls } from "../hooks/useControls";

interface ProjectileManagerProps {
  controlsRef: React.RefObject<Controls>;
  playerPosRef: React.RefObject<{ x: number; y: number }>;
  facingRightRef: React.RefObject<boolean>;
  onBlockHit?: (blockName: string, blockPos: { x: number; y: number; z: number }) => void;
}

interface ProjectileData {
  id: string;
  position: [number, number, number];
  direction: number;
}

export function ProjectileManager({ controlsRef, playerPosRef, facingRightRef, onBlockHit }: ProjectileManagerProps) {
  const [projectiles, setProjectiles] = useState<ProjectileData[]>([]);
  const cooldownRef = useRef(0);
  const lastShootRef = useRef(false);
  const idCounter = useRef(0);

  const cooldownMs = 300;

  useFrame((_, delta) => {
    cooldownRef.current = Math.max(0, cooldownRef.current - delta * 1000);

    const wantsShoot = controlsRef.current?.shoot ?? false;

    if (wantsShoot && !lastShootRef.current && cooldownRef.current <= 0) {
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

  const handleExpire = useCallback((id: string) => {
    setProjectiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

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
        />
      ))}
    </>
  );
}

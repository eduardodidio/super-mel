import { useRef, useCallback, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Projectile } from "../entities/Projectile";
import type { Controls } from "../hooks/useControls";
import { GAME_CONFIG } from "@super-mel/shared";

interface ProjectileData {
  id: string;
  position: [number, number, number];
}

interface ProjectileManagerProps {
  controlsRef: React.RefObject<Controls>;
  playerX: number;
  playerY: number;
  onBlockHit?: (blockName: string) => void;
}

export function ProjectileManager({ controlsRef, playerX, playerY, onBlockHit }: ProjectileManagerProps) {
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
      const newProjectile: ProjectileData = {
        id: `proj-${idCounter.current}`,
        position: [playerX + 0.8, playerY + 0.1, 0],
      };
      setProjectiles((prev) => [...prev, newProjectile]);
      cooldownRef.current = cooldownMs;
    }

    lastShootRef.current = wantsShoot;
  });

  const handleHit = useCallback((id: string, targetName?: string) => {
    if (targetName) onBlockHit?.(targetName);
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
          onHit={handleHit}
          onExpire={handleExpire}
        />
      ))}
    </>
  );
}

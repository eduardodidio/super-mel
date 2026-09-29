import { useRef, useCallback } from "react";
import * as THREE from "three";
import { Mel } from "../entities/Mel";
import { CameraRig } from "../systems/CameraRig";
import { useControls } from "../hooks/useControls";
import { useGameState } from "../hooks/useGameState";
import { GAME_CONFIG } from "@super-mel/shared";

export function GameScene3D() {
  const melTracker = useRef<THREE.Object3D>(new THREE.Object3D());
  const controlsRef = useControls();
  const addScore = useGameState((s) => s.addScore);
  const loseLife = useGameState((s) => s.loseLife);
  const invincibleRef = useRef(false);
  const invincibleTimer = useRef<number>(0);
  const lastX = useRef(0);

  const handlePositionUpdate = useCallback((x: number, y: number) => {
    melTracker.current.position.set(x, y, 0);
    // Score based on distance
    const dx = x - lastX.current;
    if (dx > 0) {
      addScore(dx);
    }
    lastX.current = x;
  }, [addScore]);

  const handleDamage = useCallback(() => {
    if (invincibleRef.current) return;
    loseLife();
    invincibleRef.current = true;
    invincibleTimer.current = window.setTimeout(() => {
      invincibleRef.current = false;
    }, GAME_CONFIG.invincibilityMs);
  }, [loseLife]);

  return (
    <>
      <CameraRig targetRef={melTracker} offset={[6, 3, 18]} lerpSpeed={0.06} />

      <Mel
        controlsRef={controlsRef}
        onPositionUpdate={handlePositionUpdate}
        onCollisionDamage={handleDamage}
        invincible={invincibleRef.current}
      />

      {/* Ground - temporary for testing */}
      <mesh position={[50, -2, 0]} receiveShadow>
        <boxGeometry args={[200, 0.5, 10]} />
        <meshStandardMaterial color="#3a7a3a" roughness={0.9} />
      </mesh>

      {/* Test blocks scattered */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh
          key={i}
          position={[8 + i * 5, Math.random() * 4, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={["#808080", "#8B4513", "#228B22", "#C2B280", "#B22222"][i % 5]}
            roughness={0.8}
          />
        </mesh>
      ))}

      {/* Some background decorative blocks (Z depth) */}
      {Array.from({ length: 15 }, (_, i) => (
        <mesh
          key={`bg-${i}`}
          position={[i * 8, Math.random() * 3 - 1, -4 - Math.random() * 3]}
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#2a5a2a" roughness={1} transparent opacity={0.6} />
        </mesh>
      ))}
    </>
  );
}

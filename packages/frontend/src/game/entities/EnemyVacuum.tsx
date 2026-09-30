import { useRef } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody, useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { useGameFrame } from "../hooks/useGameFrame";

const PATROL_SPEED = 2;

interface EnemyVacuumProps {
  id: string;
  position: [number, number, number];
  onContactMel: (enemyId: string, isStompable: boolean) => void;
  defeated?: boolean;
}

export function EnemyVacuum({ id, position, onContactMel, defeated = false }: EnemyVacuumProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.Mesh>(null);

  const timeRef = useRef(0);
  const dirRef = useRef(1); // 1 = right, -1 = left
  const posRef = useRef({ x: position[0], y: position[1], z: position[2] });
  const defeatAnimRef = useRef(0);
  const contactCooldownRef = useRef(0);
  const { world } = useRapier();

  useGameFrame((_, delta) => {
    if (!rbRef.current) return;
    timeRef.current += delta;

    // Contact cooldown
    if (contactCooldownRef.current > 0) {
      contactCooldownRef.current -= delta;
    }

    // --- Defeat animation ---
    if (defeated) {
      defeatAnimRef.current += delta;
      const t = defeatAnimRef.current / 0.6; // 0.6s animation
      if (groupRef.current) {
        // Fly away: translate up + shrink + slight rotation
        groupRef.current.position.y = t * 3;
        const scale = Math.max(0, 1 - t);
        groupRef.current.scale.setScalar(scale);
        groupRef.current.rotation.z = t * 1.5;
      }
      return;
    }

    const rb = rbRef.current;

    // --- Edge detection: cast ray forward and down to check for ground ---
    const forwardX = posRef.current.x + dirRef.current * 0.6;
    const rayOrigin = { x: forwardX, y: posRef.current.y, z: 0 };
    const rayDir = { x: 0, y: -1, z: 0 };
    const groundHit = world.castRay(
      { origin: rayOrigin, dir: rayDir } as any,
      2.0,
      true,
      undefined,
      undefined,
      undefined,
      rb,
    );

    if (!groundHit) {
      // No ground ahead, reverse direction
      dirRef.current *= -1;
    }

    // --- Wall detection: cast ray horizontally ---
    const wallRayOrigin = { x: posRef.current.x, y: posRef.current.y + 0.1, z: 0 };
    const wallRayDir = { x: dirRef.current, y: 0, z: 0 };
    const wallHit = world.castRay(
      { origin: wallRayOrigin, dir: wallRayDir } as any,
      0.5,
      true,
      undefined,
      undefined,
      undefined,
      rb,
    );

    if (wallHit) {
      dirRef.current *= -1;
    }

    // --- Move ---
    posRef.current.x += dirRef.current * PATROL_SPEED * delta;

    // Subtle vertical bob
    const bobY = position[1] + Math.sin(timeRef.current * 4) * 0.03;
    posRef.current.y = bobY;

    rb.setNextKinematicTranslation({
      x: posRef.current.x,
      y: posRef.current.y,
      z: posRef.current.z,
    });

    // --- Update visual ---
    if (groupRef.current) {
      groupRef.current.scale.x = dirRef.current > 0 ? 1 : -1;
    }

    // --- Pulsing light ---
    if (lightRef.current) {
      const mat = lightRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(timeRef.current * 6) * 0.5;
    }
  });

  const handleCollision = (payload: any) => {
    if (defeated) return;
    if (contactCooldownRef.current > 0) return;
    const otherName = payload.other.rigidBodyObject?.name || "";
    if (otherName !== "mel") return;

    contactCooldownRef.current = 0.5;

    // Determine stomp vs lateral contact
    const melRb = payload.other.rigidBody;
    if (melRb) {
      const melVel = melRb.linvel();
      const melPos = melRb.translation();
      const enemyPos = rbRef.current?.translation();
      if (melVel && enemyPos && melPos) {
        // Stomp: Mel is moving downward and is above the enemy
        const isAbove = melPos.y > enemyPos.y + 0.2;
        const isMovingDown = melVel.y < -1;
        if (isAbove && isMovingDown) {
          onContactMel(id, true);
          return;
        }
      }
    }

    onContactMel(id, false);
  };

  return (
    <RigidBody
      ref={rbRef}
      position={position}
      type="kinematicPosition"
      colliders={false}
      name={`enemy-vacuum-${id}`}
    >
      <CuboidCollider
        args={[0.35, 0.2, 0.25]}
        onCollisionEnter={handleCollision}
      />
      <group ref={groupRef}>
        {/* Body: metallic gray rounded box */}
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.5, 0.6]} />
          <meshStandardMaterial
            color="#808080"
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* Front bumper */}
        <mesh position={[0.35, -0.15, 0]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.55]} />
          <meshStandardMaterial
            color="#606060"
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>

        {/* Top indicator light (pulsing red) */}
        <mesh ref={lightRef} position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#FF0000"
            emissive="#FF0000"
            emissiveIntensity={2}
          />
        </mesh>

        {/* Wheels (small dark boxes on bottom) */}
        <mesh position={[-0.25, -0.28, 0.2]}>
          <boxGeometry args={[0.15, 0.1, 0.1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[-0.25, -0.28, -0.2]}>
          <boxGeometry args={[0.15, 0.1, 0.1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[0.25, -0.28, 0.2]}>
          <boxGeometry args={[0.15, 0.1, 0.1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[0.25, -0.28, -0.2]}>
          <boxGeometry args={[0.15, 0.1, 0.1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>
    </RigidBody>
  );
}

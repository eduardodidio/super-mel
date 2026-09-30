import { useRef } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameFrame } from "../hooks/useGameFrame";

const FLY_SPEED = 3;
const WAVE_AMPLITUDE = 2;
const WAVE_FREQ = 2.1;
const PATROL_RANGE = 8;

interface EnemyPigeonProps {
  id: string;
  position: [number, number, number];
  onContactMel: (enemyId: string, isStompable: boolean) => void;
  defeated?: boolean;
}

export function EnemyPigeon({ id, position, onContactMel, defeated = false }: EnemyPigeonProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  const timeRef = useRef(0);
  const dirRef = useRef(1); // 1 = right, -1 = left
  const offsetXRef = useRef(0); // distance from spawn
  const defeatAnimRef = useRef(0);
  const contactCooldownRef = useRef(0);
  const spawnX = position[0];
  const baseY = position[1];

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
      const t = defeatAnimRef.current / 0.5; // 0.5s animation
      if (groupRef.current) {
        groupRef.current.position.y = t * 5; // Fly away fast upward
        const scale = Math.max(0, 1 - t);
        groupRef.current.scale.setScalar(scale);
        groupRef.current.rotation.z = t * 2;
      }
      return;
    }

    const rb = rbRef.current;

    // --- Horizontal movement ---
    offsetXRef.current += dirRef.current * FLY_SPEED * delta;

    // Reverse at patrol range
    if (Math.abs(offsetXRef.current) > PATROL_RANGE) {
      dirRef.current *= -1;
      offsetXRef.current = Math.sign(offsetXRef.current) * PATROL_RANGE;
    }

    // --- Sine wave vertical ---
    const currentX = spawnX + offsetXRef.current;
    const currentY = baseY + Math.sin(timeRef.current * WAVE_FREQ) * WAVE_AMPLITUDE;

    rb.setNextKinematicTranslation({
      x: currentX,
      y: currentY,
      z: position[2],
    });

    // --- Visual updates ---
    if (groupRef.current) {
      groupRef.current.scale.x = dirRef.current > 0 ? 1 : -1;
    }

    // Wing flapping
    const wingAngle = Math.sin(timeRef.current * 12) * 0.4;
    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = 0.3 + wingAngle;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = -0.3 - wingAngle;
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
        const isAbove = melPos.y > enemyPos.y + 0.15;
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
      name={`enemy-pigeon-${id}`}
    >
      <CuboidCollider
        args={[0.2, 0.15, 0.15]}
        onCollisionEnter={handleCollision}
      />
      <group ref={groupRef}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.35, 0.35]} />
          <meshStandardMaterial
            color="#7B8FA1"
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>

        {/* Head */}
        <mesh position={[0.3, 0.12, 0]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial
            color="#6B7F91"
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>

        {/* Beak */}
        <mesh position={[0.44, 0.1, 0]}>
          <boxGeometry args={[0.08, 0.06, 0.06]} />
          <meshStandardMaterial color="#FF8C00" />
        </mesh>

        {/* Eyes */}
        <mesh position={[0.35, 0.18, 0.08]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.35, 0.18, -0.08]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#111111" />
        </mesh>

        {/* Left wing */}
        <mesh ref={leftWingRef} position={[0, 0.1, 0.22]}>
          <boxGeometry args={[0.35, 0.04, 0.15]} />
          <meshStandardMaterial
            color="#8FA0B2"
            metalness={0.1}
            roughness={0.7}
          />
        </mesh>

        {/* Right wing */}
        <mesh ref={rightWingRef} position={[0, 0.1, -0.22]}>
          <boxGeometry args={[0.35, 0.04, 0.15]} />
          <meshStandardMaterial
            color="#8FA0B2"
            metalness={0.1}
            roughness={0.7}
          />
        </mesh>

        {/* Tail */}
        <mesh position={[-0.3, 0.05, 0]}>
          <boxGeometry args={[0.15, 0.06, 0.12]} />
          <meshStandardMaterial
            color="#7B8FA1"
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}

import React, { useRef } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameFrame } from "../hooks/useGameFrame";

const CHASE_SPEED = 2.5;
const RETURN_SPEED = 1.5;
const DETECT_RADIUS = 6;
const LOSE_RADIUS = 10;

type BeeState = "idle" | "chasing" | "returning";

interface EnemyBeeProps {
  id: string;
  position: [number, number, number];
  playerPosRef: React.RefObject<{ x: number; y: number }>;
  onContactMel: (enemyId: string, isStompable: boolean) => void;
  defeated?: boolean;
}

export function EnemyBee({ id, position, playerPosRef, onContactMel, defeated = false }: EnemyBeeProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const timeRef = useRef(0);
  const stateRef = useRef<BeeState>("idle");
  const posRef = useRef({ x: position[0], y: position[1], z: position[2] });
  const spawnPos = useRef({ x: position[0], y: position[1] });
  const defeatAnimRef = useRef(0);
  const contactCooldownRef = useRef(0);

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
      const t = defeatAnimRef.current / 0.5;
      if (groupRef.current) {
        // Spiral fly-away
        groupRef.current.position.y = t * 4;
        const scale = Math.max(0, 1 - t);
        groupRef.current.scale.setScalar(scale);
        groupRef.current.rotation.y = t * 12; // Spiral
        groupRef.current.rotation.z = t * 2;
      }
      return;
    }

    const rb = rbRef.current;
    const playerX = playerPosRef.current?.x ?? 0;
    const playerY = playerPosRef.current?.y ?? 0;

    const dx = playerX - posRef.current.x;
    const dy = playerY - posRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const state = stateRef.current;

    // --- State transitions ---
    if (state === "idle" && dist < DETECT_RADIUS) {
      stateRef.current = "chasing";
    } else if (state === "chasing" && dist > LOSE_RADIUS) {
      stateRef.current = "returning";
    } else if (state === "returning") {
      const dsx = spawnPos.current.x - posRef.current.x;
      const dsy = spawnPos.current.y - posRef.current.y;
      const distToSpawn = Math.sqrt(dsx * dsx + dsy * dsy);
      if (distToSpawn < 0.5) {
        stateRef.current = "idle";
      }
    }

    // --- Movement ---
    const currentState = stateRef.current;

    if (currentState === "idle") {
      // Gentle hover oscillation
      posRef.current.x = spawnPos.current.x + Math.sin(timeRef.current * 1.5) * 0.1;
      posRef.current.y = spawnPos.current.y + Math.sin(timeRef.current * 3) * 0.15;
    } else if (currentState === "chasing") {
      // Move toward player
      if (dist > 0.1) {
        const nx = dx / dist;
        const ny = dy / dist;
        posRef.current.x += nx * CHASE_SPEED * delta;
        posRef.current.y += ny * CHASE_SPEED * delta;
      }
      // Add gentle oscillation even while chasing
      posRef.current.y += Math.sin(timeRef.current * 5) * 0.02;
    } else if (currentState === "returning") {
      // Move toward spawn
      const dsx = spawnPos.current.x - posRef.current.x;
      const dsy = spawnPos.current.y - posRef.current.y;
      const distToSpawn = Math.sqrt(dsx * dsx + dsy * dsy);
      if (distToSpawn > 0.1) {
        const nx = dsx / distToSpawn;
        const ny = dsy / distToSpawn;
        posRef.current.x += nx * RETURN_SPEED * delta;
        posRef.current.y += ny * RETURN_SPEED * delta;
      }
    }

    rb.setNextKinematicTranslation({
      x: posRef.current.x,
      y: posRef.current.y,
      z: posRef.current.z,
    });

    // --- Visual state indicator ---
    const isChasing = currentState === "chasing";
    const wingSpeed = isChasing ? 25 : 15;
    const wingAngle = Math.sin(timeRef.current * wingSpeed) * 0.3;

    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = 0.4 + wingAngle;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = -0.4 - wingAngle;
    }

    // Glow intensity changes when chasing
    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity = isChasing ? 0.8 : 0.3;
    }

    // Face toward movement direction
    if (groupRef.current) {
      if (currentState === "chasing" && dx !== 0) {
        groupRef.current.scale.x = dx > 0 ? 1 : -1;
      }
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
        const isAbove = melPos.y > enemyPos.y + 0.1;
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
      name={`enemy-bee-${id}`}
    >
      <CuboidCollider
        args={[0.18, 0.13, 0.13]}
        onCollisionEnter={handleCollision}
      />
      <group ref={groupRef}>
        {/* Body: 3 striped segments (yellow-black-yellow) */}
        {/* Top stripe - yellow */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.4, 0.1, 0.3]} />
          <meshStandardMaterial
            ref={bodyMatRef}
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Middle stripe - black */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.4, 0.1, 0.3]} />
          <meshStandardMaterial color="#1A1A1A" />
        </mesh>
        {/* Bottom stripe - yellow */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.4, 0.1, 0.3]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Stinger */}
        <mesh position={[-0.25, -0.05, 0]}>
          <boxGeometry args={[0.1, 0.04, 0.04]} />
          <meshStandardMaterial color="#444444" />
        </mesh>

        {/* Eyes (red emissive dots) */}
        <mesh position={[0.2, 0.06, 0.1]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial
            color="#FF0000"
            emissive="#FF0000"
            emissiveIntensity={1}
          />
        </mesh>
        <mesh position={[0.2, 0.06, -0.1]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial
            color="#FF0000"
            emissive="#FF0000"
            emissiveIntensity={1}
          />
        </mesh>

        {/* Left wing (transparent) */}
        <mesh ref={leftWingRef} position={[0.05, 0.2, 0.15]}>
          <boxGeometry args={[0.25, 0.02, 0.12]} />
          <meshStandardMaterial
            color="#AADDFF"
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Right wing (transparent) */}
        <mesh ref={rightWingRef} position={[0.05, 0.2, -0.15]}>
          <boxGeometry args={[0.25, 0.02, 0.12]} />
          <meshStandardMaterial
            color="#AADDFF"
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}

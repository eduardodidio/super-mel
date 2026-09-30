import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

interface GoalProps {
  position: [number, number, number];
  onGoalReached: () => void;
}

export function Goal({ position, onGoalReached }: GoalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const reached = useRef(false);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  // Emissive material for the glow pulse
  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a90d9",
        emissive: "#4a90d9",
        emissiveIntensity: 0.2,
        roughness: 0.6,
      }),
    [],
  );

  const headMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#DEB887",
        emissive: "#DEB887",
        emissiveIntensity: 0.15,
        roughness: 0.5,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!groupRef.current || reached.current) return;
    timeRef.current += delta;
    // Gentle bob
    groupRef.current.position.y = Math.sin(timeRef.current * 2) * 0.15;
    // Pulsing glow
    const pulse = 0.15 + Math.sin(timeRef.current * 3) * 0.1;
    bodyMat.emissiveIntensity = pulse;
    headMat.emissiveIntensity = pulse;
  });

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      sensor
      name="goal"
      onIntersectionEnter={(payload) => {
        if (reached.current) return;
        if (payload.other.rigidBodyObject?.name === "mel") {
          reached.current = true;
          onGoalReached();
        }
      }}
    >
      <group ref={groupRef}>
        {/* Body — tall box representing the owner */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[0.6, 1.2, 0.4]} />
          <primitive object={bodyMat} attach="material" />
        </mesh>

        {/* Head */}
        <mesh castShadow position={[0, 1.3, 0]}>
          <boxGeometry args={[0.45, 0.45, 0.4]} />
          <primitive object={headMat} attach="material" />
        </mesh>

        {/* Arms */}
        <mesh castShadow position={[-0.42, 0.6, 0]}>
          <boxGeometry args={[0.2, 0.7, 0.3]} />
          <primitive object={bodyMat} attach="material" />
        </mesh>
        <mesh castShadow position={[0.42, 0.6, 0]}>
          <boxGeometry args={[0.2, 0.7, 0.3]} />
          <primitive object={bodyMat} attach="material" />
        </mesh>

        {/* Legs */}
        <mesh castShadow position={[-0.15, -0.3, 0]}>
          <boxGeometry args={[0.25, 0.6, 0.35]} />
          <meshStandardMaterial color="#3a3a5a" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0.15, -0.3, 0]}>
          <boxGeometry args={[0.25, 0.6, 0.35]} />
          <meshStandardMaterial color="#3a3a5a" roughness={0.7} />
        </mesh>

        {/* Point light to attract attention */}
        <pointLight
          color="#FFD700"
          intensity={0.6}
          distance={6}
          position={[0, 1.5, 0.5]}
        />
      </group>
    </RigidBody>
  );
}

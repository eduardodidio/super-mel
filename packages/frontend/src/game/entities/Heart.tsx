import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

interface HeartProps {
  position: [number, number, number];
  onCollect: () => void;
}

export function Heart({ position, onCollect }: HeartProps) {
  const meshRef = useRef<THREE.Group>(null);
  const collected = useRef(false);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!meshRef.current || collected.current) return;
    timeRef.current += delta;
    // Float and rotate
    meshRef.current.position.y = Math.sin(timeRef.current * 2) * 0.15;
    meshRef.current.rotation.y += delta * 2;
  });

  const handleCollision = () => {
    if (collected.current) return;
    collected.current = true;
    onCollect();
  };

  if (collected.current) return null;

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      sensor
      name="heart"
      onIntersectionEnter={(payload) => {
        if (payload.other.rigidBodyObject?.name === "mel") {
          handleCollision();
        }
      }}
    >
      <group ref={meshRef}>
        {/* Heart shape from cubes */}
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial
            color="#FF2222"
            emissive="#FF0000"
            emissiveIntensity={0.4}
            roughness={0.5}
          />
        </mesh>
        {/* Top bumps */}
        <mesh castShadow position={[-0.15, 0.2, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.35]} />
          <meshStandardMaterial
            color="#FF4444"
            emissive="#FF0000"
            emissiveIntensity={0.3}
            roughness={0.5}
          />
        </mesh>
        <mesh castShadow position={[0.15, 0.2, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.35]} />
          <meshStandardMaterial
            color="#FF4444"
            emissive="#FF0000"
            emissiveIntensity={0.3}
            roughness={0.5}
          />
        </mesh>
        {/* Glow */}
        <pointLight color="#FF4444" intensity={1} distance={3} />
      </group>
    </RigidBody>
  );
}

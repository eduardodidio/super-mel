import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

interface CoinProps {
  position: [number, number, number];
  onCollect: () => void;
}

export function Coin({ position, onCollect }: CoinProps) {
  const meshRef = useRef<THREE.Group>(null);
  const collected = useRef(false);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!meshRef.current || collected.current) return;
    timeRef.current += delta;
    // Spin and bob
    meshRef.current.rotation.y += delta * 3;
    meshRef.current.position.y = Math.sin(timeRef.current * 2) * 0.1;
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
      name="coin"
      onIntersectionEnter={(payload) => {
        if (payload.other.rigidBodyObject?.name === "mel") {
          handleCollision();
        }
      }}
    >
      <group ref={meshRef}>
        {/* Coin shape — flat cylinder */}
        <mesh castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFA500"
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}

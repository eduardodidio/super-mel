import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameState } from "../hooks/useGameState";

interface BoneProps {
  position: [number, number, number];
  onCollect: () => void;
}

export function Bone({ position, onCollect }: BoneProps) {
  const meshRef = useRef<THREE.Group>(null);
  const collected = useRef(false);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  // Shared materials to avoid re-creation per render
  const boneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#F5F5DC",
        emissive: "#FFD700",
        emissiveIntensity: 0.15,
        roughness: 0.4,
        metalness: 0.1,
      }),
    []
  );

  const knobGeometry = useMemo(() => new THREE.SphereGeometry(0.12, 8, 8), []);
  const shaftGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8),
    []
  );

  useFrame((_, delta) => {
    if (useGameState.getState().paused) return;
    if (!meshRef.current || collected.current) return;
    timeRef.current += delta;
    // Spin and bob
    meshRef.current.rotation.y += delta * 1.5;
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
      name="bone"
      onIntersectionEnter={(payload) => {
        if (payload.other.rigidBodyObject?.name === "mel") {
          handleCollision();
        }
      }}
    >
      <group ref={meshRef} rotation={[0, 0, Math.PI / 6]}>
        {/* Central shaft */}
        <mesh
          castShadow
          geometry={shaftGeometry}
          material={boneMaterial}
          rotation={[0, 0, Math.PI / 2]}
        />
        {/* Left knob top */}
        <mesh
          castShadow
          geometry={knobGeometry}
          material={boneMaterial}
          position={[-0.25, 0.08, 0]}
        />
        {/* Left knob bottom */}
        <mesh
          castShadow
          geometry={knobGeometry}
          material={boneMaterial}
          position={[-0.25, -0.08, 0]}
        />
        {/* Right knob top */}
        <mesh
          castShadow
          geometry={knobGeometry}
          material={boneMaterial}
          position={[0.25, 0.08, 0]}
        />
        {/* Right knob bottom */}
        <mesh
          castShadow
          geometry={knobGeometry}
          material={boneMaterial}
          position={[0.25, -0.08, 0]}
        />
        {/* Golden glow light */}
        <pointLight color="#FFD700" intensity={0.3} distance={3} />
      </group>
    </RigidBody>
  );
}

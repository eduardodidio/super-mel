import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

interface CheckpointProps {
  position: [number, number, number];
  id: string;
  active: boolean;
  onActivate: (id: string, x: number, y: number) => void;
}

export function Checkpoint({ position, id, active, onActivate }: CheckpointProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(Math.random() * Math.PI * 2);
  const scaleRef = useRef(1);
  const prevActive = useRef(active);

  // Materials that respond to active state
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#A0522D",
        roughness: 0.7,
      }),
    [],
  );

  const roofMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#D2691E",
        roughness: 0.6,
      }),
    [],
  );

  const flagMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#888888",
        emissive: "#000000",
        emissiveIntensity: 0,
        roughness: 0.4,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    // Detect activation transition for scale pulse
    if (active && !prevActive.current) {
      scaleRef.current = 1.15;
    }
    prevActive.current = active;

    // Ease scale back to 1.0
    if (scaleRef.current > 1.001) {
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 1.0, delta * 6);
    } else {
      scaleRef.current = 1.0;
    }
    const s = scaleRef.current;
    groupRef.current.scale.set(s, s, s);

    // Update materials based on active state
    if (active) {
      wallMat.emissive = new THREE.Color("#FFD700");
      wallMat.emissiveIntensity = 0.2 + Math.sin(timeRef.current * 3) * 0.05;
      roofMat.emissive = new THREE.Color("#FFD700");
      roofMat.emissiveIntensity = 0.15;
      flagMat.color = new THREE.Color("#FFD700");
      flagMat.emissive = new THREE.Color("#FFD700");
      flagMat.emissiveIntensity = 0.4;
    } else {
      wallMat.emissive = new THREE.Color("#000000");
      wallMat.emissiveIntensity = 0;
      roofMat.emissive = new THREE.Color("#000000");
      roofMat.emissiveIntensity = 0;
      flagMat.color = new THREE.Color("#888888");
      flagMat.emissive = new THREE.Color("#000000");
      flagMat.emissiveIntensity = 0;
    }
  });

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      sensor
      name="checkpoint"
      onIntersectionEnter={(payload) => {
        if (payload.other.rigidBodyObject?.name === "mel") {
          onActivate(id, position[0], position[1]);
        }
      }}
    >
      <group ref={groupRef}>
        {/* Base / floor */}
        <mesh castShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[1.2, 0.1, 1.0]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>

        {/* Walls — back wall */}
        <mesh castShadow position={[0, 0.5, -0.35]}>
          <boxGeometry args={[1.0, 0.8, 0.1]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
        {/* Left wall */}
        <mesh castShadow position={[-0.45, 0.5, 0]}>
          <boxGeometry args={[0.1, 0.8, 0.8]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
        {/* Right wall */}
        <mesh castShadow position={[0.45, 0.5, 0]}>
          <boxGeometry args={[0.1, 0.8, 0.8]} />
          <primitive object={wallMat} attach="material" />
        </mesh>

        {/* Roof — two angled planes forming a triangle */}
        <mesh castShadow position={[-0.25, 1.05, 0]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.65, 0.08, 1.0]} />
          <primitive object={roofMat} attach="material" />
        </mesh>
        <mesh castShadow position={[0.25, 1.05, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[0.65, 0.08, 1.0]} />
          <primitive object={roofMat} attach="material" />
        </mesh>

        {/* Flag pole on top */}
        <mesh castShadow position={[0, 1.45, 0]}>
          <boxGeometry args={[0.06, 0.6, 0.06]} />
          <meshStandardMaterial color="#666666" roughness={0.5} />
        </mesh>

        {/* Flag */}
        <mesh castShadow position={[0.2, 1.55, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.04]} />
          <primitive object={flagMat} attach="material" />
        </mesh>

        {/* Conditional point light for active state */}
        {active && (
          <pointLight
            color="#FFD700"
            intensity={0.4}
            distance={4}
            position={[0, 1.0, 0.5]}
          />
        )}
      </group>
    </RigidBody>
  );
}

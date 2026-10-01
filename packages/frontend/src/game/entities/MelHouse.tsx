import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// MelHouse -- Mel's home for the cutscene (F54-T03)
// ---------------------------------------------------------------------------
// Simple house with animated door. Purely visual, no physics.
// ---------------------------------------------------------------------------

interface MelHouseProps {
  position: [number, number, number];
  doorOpen: boolean;
  doorProgress?: number; // 0..1 optional override for fine control
}

export function MelHouse({ position, doorOpen, doorProgress }: MelHouseProps) {
  const doorGroupRef = useRef<THREE.Group>(null);
  const doorRotationRef = useRef(0);

  // Materials
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#FAEBD7", roughness: 0.8 }),
    [],
  );
  const roofMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#B22222", roughness: 0.7 }),
    [],
  );
  const doorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8B4513", roughness: 0.6 }),
    [],
  );
  const doorframeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#654321", roughness: 0.7 }),
    [],
  );
  const windowMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: "#87CEEB",
      emissive: "#FFE4B5",
      emissiveIntensity: 0.3,
      roughness: 0.3,
    }),
    [],
  );
  const chimneyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#A0522D", roughness: 0.8 }),
    [],
  );
  const petDoorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#6B3410", roughness: 0.7 }),
    [],
  );

  useFrame((_, delta) => {
    if (!doorGroupRef.current) return;

    const targetRotation = doorProgress !== undefined
      ? -doorProgress * (Math.PI / 2)
      : doorOpen ? -Math.PI / 2 : 0;

    doorRotationRef.current = THREE.MathUtils.lerp(
      doorRotationRef.current,
      targetRotation,
      delta * 4,
    );
    doorGroupRef.current.rotation.y = doorRotationRef.current;
  });

  return (
    <group position={position}>
      {/* Walls */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[2.5, 2.0, 2.0]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* Roof left */}
      <mesh castShadow position={[-0.45, 2.25, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[1.6, 0.12, 2.2]} />
        <primitive object={roofMat} attach="material" />
      </mesh>

      {/* Roof right */}
      <mesh castShadow position={[0.45, 2.25, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[1.6, 0.12, 2.2]} />
        <primitive object={roofMat} attach="material" />
      </mesh>

      {/* Doorframe (behind door) */}
      <mesh position={[-0.3, 0.65, 1.01]}>
        <boxGeometry args={[0.7, 1.3, 0.04]} />
        <primitive object={doorframeMat} attach="material" />
      </mesh>

      {/* Door group -- pivot at left edge */}
      <group ref={doorGroupRef} position={[-0.65, 0.65, 1.03]}>
        {/* Door mesh offset so left edge is at group origin */}
        <mesh castShadow position={[0.3, 0, 0]}>
          <boxGeometry args={[0.6, 1.2, 0.08]} />
          <primitive object={doorMat} attach="material" />
        </mesh>

        {/* Door knob */}
        <mesh position={[0.5, 0, 0.05]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Pet door (small flap at bottom of doorframe) */}
      <mesh position={[-0.3, 0.17, 1.02]}>
        <boxGeometry args={[0.3, 0.35, 0.04]} />
        <primitive object={petDoorMat} attach="material" />
      </mesh>

      {/* Window (above and to the right of door) */}
      <mesh position={[0.5, 1.3, 1.02]}>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <primitive object={windowMat} attach="material" />
      </mesh>

      {/* Warm interior point light (visible through window) */}
      <pointLight
        color="#FFE4B5"
        intensity={0.3}
        distance={3}
        position={[0.5, 1.3, 0.5]}
      />

      {/* Chimney */}
      <mesh castShadow position={[0.7, 2.6, -0.3]}>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <primitive object={chimneyMat} attach="material" />
      </mesh>
    </group>
  );
}

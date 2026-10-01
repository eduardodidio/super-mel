import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// HidingSpot -- Bush or doghouse for the cutscene (F54-T03)
// ---------------------------------------------------------------------------
// Purely visual, no physics. Mel walks behind it to remove her cape.
// ---------------------------------------------------------------------------

interface HidingSpotProps {
  position: [number, number, number];
  variant?: "bush" | "doghouse";
  showCape?: boolean;
}

export function HidingSpot({ position, variant = "bush", showCape = false }: HidingSpotProps) {
  if (variant === "doghouse") {
    return <DoghouseVariant position={position} showCape={showCape} />;
  }
  return <BushVariant position={position} showCape={showCape} />;
}

// ---------------------------------------------------------------------------
// Bush Variant
// ---------------------------------------------------------------------------

function BushVariant({ position, showCape }: { position: [number, number, number]; showCape: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  const baseMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2E8B57", roughness: 0.9 }),
    [],
  );
  const topMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3CB371", roughness: 0.9 }),
    [],
  );
  const sideMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#228B22", roughness: 0.9 }),
    [],
  );
  const capeMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: "#DC143C",
      roughness: 0.6,
      side: THREE.DoubleSide,
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    // Subtle wind sway
    groupRef.current.rotation.z = Math.sin(timeRef.current * 0.8 * Math.PI * 2) * 0.02;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Base sphere */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.8, 8, 6]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Top sphere */}
      <mesh castShadow position={[0.1, 1.2, 0.1]}>
        <sphereGeometry args={[0.6, 8, 6]} />
        <primitive object={topMat} attach="material" />
      </mesh>

      {/* Side sphere */}
      <mesh castShadow position={[-0.3, 0.7, 0.2]}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <primitive object={sideMat} attach="material" />
      </mesh>

      {/* Additional sphere for volume */}
      <mesh castShadow position={[0.3, 0.8, -0.1]}>
        <sphereGeometry args={[0.55, 8, 6]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Folded cape behind the bush */}
      {showCape && (
        <mesh position={[-0.2, 0.08, -0.3]} rotation={[0.17, 0, 0.09]}>
          <planeGeometry args={[0.3, 0.15]} />
          <primitive object={capeMat} attach="material" />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Doghouse Variant (simplified Checkpoint mesh, no physics)
// ---------------------------------------------------------------------------

function DoghouseVariant({ position, showCape }: { position: [number, number, number]; showCape: boolean }) {
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#A0522D", roughness: 0.7 }),
    [],
  );
  const roofMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#D2691E", roughness: 0.6 }),
    [],
  );
  const baseMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8B4513", roughness: 0.8 }),
    [],
  );
  const capeMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: "#DC143C",
      roughness: 0.6,
      side: THREE.DoubleSide,
    }),
    [],
  );

  return (
    <group position={position} scale={[1.2, 1.2, 1.2]}>
      {/* Base */}
      <mesh castShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[1.2, 0.1, 1.0]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Back wall */}
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

      {/* Roof left */}
      <mesh castShadow position={[-0.25, 1.05, 0]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.65, 0.08, 1.0]} />
        <primitive object={roofMat} attach="material" />
      </mesh>

      {/* Roof right */}
      <mesh castShadow position={[0.25, 1.05, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.65, 0.08, 1.0]} />
        <primitive object={roofMat} attach="material" />
      </mesh>

      {/* Folded cape behind */}
      {showCape && (
        <mesh position={[-0.3, 0.12, -0.5]} rotation={[0.17, 0, 0.09]}>
          <planeGeometry args={[0.3, 0.15]} />
          <primitive object={capeMat} attach="material" />
        </mesh>
      )}
    </group>
  );
}

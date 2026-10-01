import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Rafa -- Voxel-style boy character for the end-of-level cutscene (F54-T02)
// ---------------------------------------------------------------------------
// Built entirely from THREE box primitives. No physics, purely visual.
// ---------------------------------------------------------------------------

interface RafaProps {
  position: [number, number, number];
  state: "idle" | "crouch" | "hug" | "happy";
  facingRight?: boolean;
}

// State target values for smooth interpolation
const STATE_TARGETS: Record<RafaProps["state"], {
  bodyY: number;
  leftArmRotZ: number;
  rightArmRotZ: number;
  leftArmRotX: number;
  rightArmRotX: number;
  bounceAmp: number;
  bounceFreq: number;
}> = {
  idle: {
    bodyY: 0,
    leftArmRotZ: 0,
    rightArmRotZ: 0,
    leftArmRotX: 0,
    rightArmRotX: 0,
    bounceAmp: 0.02,
    bounceFreq: 1,
  },
  crouch: {
    bodyY: -0.3,
    leftArmRotZ: 0,
    rightArmRotZ: 0,
    leftArmRotX: 0,
    rightArmRotX: 0,
    bounceAmp: 0,
    bounceFreq: 0,
  },
  hug: {
    bodyY: -0.15,
    leftArmRotZ: 0.3,
    rightArmRotZ: -0.3,
    leftArmRotX: -1.0,
    rightArmRotX: -1.0,
    bounceAmp: 0,
    bounceFreq: 0,
  },
  happy: {
    bodyY: 0,
    leftArmRotZ: -0.8,
    rightArmRotZ: 0.8,
    leftArmRotX: 0,
    rightArmRotX: 0,
    bounceAmp: 0.05,
    bounceFreq: 3,
  },
};

export function Rafa({ position, state, facingRight = true }: RafaProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  // Interpolated values
  const currentValues = useRef({
    bodyY: 0,
    leftArmRotZ: 0,
    rightArmRotZ: 0,
    leftArmRotX: 0,
    rightArmRotX: 0,
  });

  // Materials (memoized to avoid per-frame allocation)
  const skinMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#DEB887", roughness: 0.7 }),
    [],
  );
  const hairMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4a3728", roughness: 0.8 }),
    [],
  );
  const eyeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.5 }),
    [],
  );
  const shirtMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#E74C3C", roughness: 0.7 }),
    [],
  );
  const pantsMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3498DB", roughness: 0.7 }),
    [],
  );
  const shoeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2C3E50", roughness: 0.8 }),
    [],
  );

  useFrame((_, delta) => {
    if (!groupRef.current || !bodyGroupRef.current) return;
    timeRef.current += delta;

    const targets = STATE_TARGETS[state];
    const lerpFactor = 1 - Math.pow(0.001, delta); // ~0.3s smooth transition

    // Interpolate values
    const cv = currentValues.current;
    cv.bodyY = THREE.MathUtils.lerp(cv.bodyY, targets.bodyY, lerpFactor);
    cv.leftArmRotZ = THREE.MathUtils.lerp(cv.leftArmRotZ, targets.leftArmRotZ, lerpFactor);
    cv.rightArmRotZ = THREE.MathUtils.lerp(cv.rightArmRotZ, targets.rightArmRotZ, lerpFactor);
    cv.leftArmRotX = THREE.MathUtils.lerp(cv.leftArmRotX, targets.leftArmRotX, lerpFactor);
    cv.rightArmRotX = THREE.MathUtils.lerp(cv.rightArmRotX, targets.rightArmRotX, lerpFactor);

    // Bounce/breathing animation
    const bounce = Math.sin(timeRef.current * Math.PI * 2 * targets.bounceFreq) * targets.bounceAmp;

    // Apply body offset
    bodyGroupRef.current.position.y = cv.bodyY + bounce;

    // Apply arm rotations
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = cv.leftArmRotZ;
      leftArmRef.current.rotation.x = cv.leftArmRotX;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = cv.rightArmRotZ;
      rightArmRef.current.rotation.x = cv.rightArmRotX;
    }

    // Facing direction
    groupRef.current.scale.x = facingRight ? 1 : -1;
  });

  return (
    <group ref={groupRef} position={position}>
      <group ref={bodyGroupRef}>
        {/* Head */}
        <mesh castShadow position={[0, 1.55, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.45]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        {/* Hair */}
        <mesh castShadow position={[0, 1.85, 0]}>
          <boxGeometry args={[0.5, 0.15, 0.45]} />
          <primitive object={hairMat} attach="material" />
        </mesh>

        {/* Left eye */}
        <mesh position={[-0.12, 1.58, 0.23]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <primitive object={eyeMat} attach="material" />
        </mesh>

        {/* Right eye */}
        <mesh position={[0.12, 1.58, 0.23]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <primitive object={eyeMat} attach="material" />
        </mesh>

        {/* Torso */}
        <mesh castShadow position={[0, 0.95, 0]}>
          <boxGeometry args={[0.5, 0.7, 0.35]} />
          <primitive object={shirtMat} attach="material" />
        </mesh>

        {/* Left arm (pivot at shoulder) */}
        <group ref={leftArmRef} position={[-0.34, 1.15, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <boxGeometry args={[0.18, 0.6, 0.25]} />
            <primitive object={shirtMat} attach="material" />
          </mesh>
        </group>

        {/* Right arm (pivot at shoulder) */}
        <group ref={rightArmRef} position={[0.34, 1.15, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <boxGeometry args={[0.18, 0.6, 0.25]} />
            <primitive object={shirtMat} attach="material" />
          </mesh>
        </group>

        {/* Left leg */}
        <mesh castShadow position={[-0.13, 0.3, 0]}>
          <boxGeometry args={[0.22, 0.55, 0.3]} />
          <primitive object={pantsMat} attach="material" />
        </mesh>

        {/* Right leg */}
        <mesh castShadow position={[0.13, 0.3, 0]}>
          <boxGeometry args={[0.22, 0.55, 0.3]} />
          <primitive object={pantsMat} attach="material" />
        </mesh>

        {/* Left shoe */}
        <mesh castShadow position={[-0.13, 0.02, 0.03]}>
          <boxGeometry args={[0.24, 0.12, 0.35]} />
          <primitive object={shoeMat} attach="material" />
        </mesh>

        {/* Right shoe */}
        <mesh castShadow position={[0.13, 0.02, 0.03]}>
          <boxGeometry args={[0.24, 0.12, 0.35]} />
          <primitive object={shoeMat} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

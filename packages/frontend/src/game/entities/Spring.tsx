import { useRef, useMemo } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useGameFrame } from "../hooks/useGameFrame";

interface SpringProps {
  position: [number, number, number];
  bounceForce?: number;
  onBounce: (force: number) => void;
}

const DEFAULT_BOUNCE_FORCE = 18;

/** Animation phases for squash/stretch on bounce */
const enum Phase {
  Idle,
  Squash,
  Stretch,
  Recover,
}

export function Spring({ position, bounceForce = DEFAULT_BOUNCE_FORCE, onBounce }: SpringProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Animation state
  const phaseRef = useRef<Phase>(Phase.Idle);
  const phaseTimeRef = useRef(0);
  const scaleY = useRef(1);
  const scaleXZ = useRef(1);

  // Prevent double-trigger on the same collision
  const bounceCooldown = useRef(0);

  // Materials
  const baseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#444444",
        roughness: 0.6,
        metalness: 0.4,
      }),
    [],
  );

  const coilMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#CC2222",
        roughness: 0.3,
        metalness: 0.6,
        emissive: "#330000",
        emissiveIntensity: 0.2,
      }),
    [],
  );

  const topMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#666666",
        roughness: 0.5,
        metalness: 0.4,
      }),
    [],
  );

  useGameFrame((_, delta) => {
    if (!groupRef.current) return;

    // Cooldown
    if (bounceCooldown.current > 0) {
      bounceCooldown.current -= delta;
    }

    // Animation state machine
    phaseTimeRef.current += delta;

    switch (phaseRef.current) {
      case Phase.Squash:
        if (phaseTimeRef.current < 0.05) {
          // Squash: scaleY -> 0.5, scaleXZ -> 1.3
          scaleY.current = THREE.MathUtils.lerp(scaleY.current, 0.5, delta * 40);
          scaleXZ.current = THREE.MathUtils.lerp(scaleXZ.current, 1.3, delta * 40);
        } else {
          phaseRef.current = Phase.Stretch;
          phaseTimeRef.current = 0;
        }
        break;

      case Phase.Stretch:
        if (phaseTimeRef.current < 0.1) {
          // Stretch: scaleY -> 1.4, scaleXZ -> 0.8
          scaleY.current = THREE.MathUtils.lerp(scaleY.current, 1.4, delta * 30);
          scaleXZ.current = THREE.MathUtils.lerp(scaleXZ.current, 0.8, delta * 30);
        } else {
          phaseRef.current = Phase.Recover;
          phaseTimeRef.current = 0;
        }
        break;

      case Phase.Recover:
        // Ease back to 1.0
        scaleY.current = THREE.MathUtils.lerp(scaleY.current, 1.0, delta * 8);
        scaleXZ.current = THREE.MathUtils.lerp(scaleXZ.current, 1.0, delta * 8);
        if (
          Math.abs(scaleY.current - 1.0) < 0.01 &&
          Math.abs(scaleXZ.current - 1.0) < 0.01
        ) {
          scaleY.current = 1.0;
          scaleXZ.current = 1.0;
          phaseRef.current = Phase.Idle;
          phaseTimeRef.current = 0;
        }
        break;

      default:
        // Idle — no animation
        break;
    }

    groupRef.current.scale.set(scaleXZ.current, scaleY.current, scaleXZ.current);
  });

  const triggerBounce = () => {
    phaseRef.current = Phase.Squash;
    phaseTimeRef.current = 0;
    scaleY.current = 1.0;
    scaleXZ.current = 1.0;
  };

  const handleSensorEnter = (payload: any) => {
    if (bounceCooldown.current > 0) return;

    const otherName = payload.other.rigidBodyObject?.name || "";
    if (otherName !== "mel") return;

    // Check that Mel is falling downward
    const melRb = payload.other.rigidBody;
    if (!melRb) return;

    const melVel = melRb.linvel();
    if (!melVel || melVel.y > -0.5) return;

    // Mel is landing from above — trigger bounce
    bounceCooldown.current = 0.2;
    triggerBounce();
    onBounce(bounceForce);
  };

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders={false}
      name="spring"
    >
      {/* Solid collider so Mel doesn't fall through */}
      <CuboidCollider args={[0.45, 0.25, 0.3]} position={[0, 0.25, 0]} />

      {/* Sensor on top to detect landing */}
      <CuboidCollider
        args={[0.4, 0.08, 0.28]}
        position={[0, 0.52, 0]}
        sensor
        onIntersectionEnter={handleSensorEnter}
      />

      <group ref={groupRef}>
        {/* Base plate — dark gray */}
        <mesh castShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[0.9, 0.1, 0.6]} />
          <primitive object={baseMat} attach="material" />
        </mesh>

        {/* Spring coils — 3 stacked, decreasing width, metallic red */}
        {/* Bottom coil */}
        <mesh castShadow position={[0, 0.15, 0]}>
          <boxGeometry args={[0.7, 0.08, 0.5]} />
          <primitive object={coilMat} attach="material" />
        </mesh>
        {/* Middle coil */}
        <mesh castShadow position={[0, 0.25, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.45]} />
          <primitive object={coilMat} attach="material" />
        </mesh>
        {/* Top coil */}
        <mesh castShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.4]} />
          <primitive object={coilMat} attach="material" />
        </mesh>

        {/* Top plate — lighter gray */}
        <mesh castShadow position={[0, 0.47, 0]}>
          <boxGeometry args={[0.7, 0.08, 0.5]} />
          <primitive object={topMat} attach="material" />
        </mesh>
      </group>
    </RigidBody>
  );
}

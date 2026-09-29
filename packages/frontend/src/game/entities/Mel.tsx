import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { GAME_CONFIG } from "@super-mel/shared";
import type { Controls } from "../hooks/useControls";

interface MelProps {
  controlsRef: React.RefObject<Controls>;
  onPositionUpdate?: (x: number, y: number) => void;
  onCollisionDamage?: () => void;
  invincible?: boolean;
}

export function Mel({ controlsRef, onPositionUpdate, onCollisionDamage, invincible = false }: MelProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [flapCooldown, setFlapCooldown] = useState(false);
  const flashRef = useRef(0);
  const timeRef = useRef(0);
  const lastFlapRef = useRef(false);

  // Invincibility blink
  const visibleRef = useRef(true);

  // Colors for the yorkshire
  const colors = useMemo(() => ({
    body: "#8B6914",
    bodyDark: "#6B4F10",
    head: "#A0782C",
    nose: "#2a2a2a",
    eye: "#111111",
    eyeWhite: "#ffffff",
    ear: "#5C4A1E",
    tongue: "#FF6B8A",
    collar: "#FF4444",
    tail: "#A0782C",
    legDark: "#6B4F10",
    belly: "#C4A44A",
  }), []);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || !groupRef.current) return;

    timeRef.current += delta;
    const rb = rigidBodyRef.current;
    const pos = rb.translation();
    const vel = rb.linvel();

    // Report position for camera and score
    onPositionUpdate?.(pos.x, pos.y);

    // Flap
    const wantsFlap = controlsRef.current?.flap ?? false;
    if (wantsFlap && !lastFlapRef.current && !flapCooldown) {
      rb.setLinvel({ x: GAME_CONFIG.scrollSpeed / 25, y: -GAME_CONFIG.flapForce / 50, z: 0 }, true);
      setFlapCooldown(true);
      setTimeout(() => setFlapCooldown(false), 100);
    }
    lastFlapRef.current = wantsFlap;

    // Constant forward movement
    const currentVel = rb.linvel();
    rb.setLinvel({ x: GAME_CONFIG.scrollSpeed / 25, y: currentVel.y, z: 0 }, true);

    // Tilt based on Y velocity
    const tiltTarget = THREE.MathUtils.clamp(vel.y * 0.08, -0.5, 0.5);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltTarget, 0.1);

    // Idle breathing (subtle scale oscillation)
    const breathe = 1 + Math.sin(timeRef.current * 3) * 0.02;
    groupRef.current.scale.setScalar(breathe);

    // Invincibility blink
    if (invincible) {
      flashRef.current += delta;
      visibleRef.current = Math.sin(flashRef.current * 20) > 0;
      groupRef.current.visible = visibleRef.current;
    } else {
      flashRef.current = 0;
      groupRef.current.visible = true;
    }

    // Fall death
    if (pos.y < -20) {
      onCollisionDamage?.();
      rb.setTranslation({ x: pos.x, y: 5, z: 0 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 5, 0]}
      mass={1}
      linearDamping={0.1}
      lockRotations
      enabledTranslations={[true, true, false]}
      colliders="cuboid"
      name="mel"
    >
      <group ref={groupRef}>
        {/* Body - main torso */}
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.9, 0.55, 0.55]} />
          <meshStandardMaterial color={colors.body} roughness={0.9} />
        </mesh>

        {/* Belly (lighter underside) */}
        <mesh castShadow position={[0, -0.18, 0]}>
          <boxGeometry args={[0.7, 0.2, 0.5]} />
          <meshStandardMaterial color={colors.belly} roughness={0.9} />
        </mesh>

        {/* Head */}
        <mesh castShadow position={[0.45, 0.2, 0]}>
          <boxGeometry args={[0.45, 0.45, 0.45]} />
          <meshStandardMaterial color={colors.head} roughness={0.9} />
        </mesh>

        {/* Snout */}
        <mesh castShadow position={[0.7, 0.12, 0]}>
          <boxGeometry args={[0.18, 0.2, 0.3]} />
          <meshStandardMaterial color={colors.head} roughness={0.9} />
        </mesh>

        {/* Nose */}
        <mesh position={[0.8, 0.16, 0]}>
          <boxGeometry args={[0.06, 0.08, 0.1]} />
          <meshStandardMaterial color={colors.nose} roughness={0.5} />
        </mesh>

        {/* Left eye white */}
        <mesh position={[0.62, 0.28, 0.15]}>
          <boxGeometry args={[0.08, 0.1, 0.06]} />
          <meshStandardMaterial color={colors.eyeWhite} />
        </mesh>
        {/* Left eye pupil */}
        <mesh position={[0.66, 0.28, 0.16]}>
          <boxGeometry args={[0.05, 0.06, 0.06]} />
          <meshStandardMaterial color={colors.eye} />
        </mesh>

        {/* Right eye white */}
        <mesh position={[0.62, 0.28, -0.15]}>
          <boxGeometry args={[0.08, 0.1, 0.06]} />
          <meshStandardMaterial color={colors.eyeWhite} />
        </mesh>
        {/* Right eye pupil */}
        <mesh position={[0.66, 0.28, -0.16]}>
          <boxGeometry args={[0.05, 0.06, 0.06]} />
          <meshStandardMaterial color={colors.eye} />
        </mesh>

        {/* Left ear */}
        <mesh castShadow position={[0.42, 0.48, 0.15]}>
          <boxGeometry args={[0.1, 0.2, 0.08]} />
          <meshStandardMaterial color={colors.ear} roughness={0.9} />
        </mesh>

        {/* Right ear */}
        <mesh castShadow position={[0.42, 0.48, -0.15]}>
          <boxGeometry args={[0.1, 0.2, 0.08]} />
          <meshStandardMaterial color={colors.ear} roughness={0.9} />
        </mesh>

        {/* Tongue (small, sticking out) */}
        <mesh position={[0.78, 0.05, 0.05]}>
          <boxGeometry args={[0.1, 0.03, 0.06]} />
          <meshStandardMaterial color={colors.tongue} />
        </mesh>

        {/* Collar */}
        <mesh position={[0.3, 0.02, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.58]} />
          <meshStandardMaterial color={colors.collar} roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Front left leg */}
        <mesh castShadow position={[0.2, -0.4, 0.18]}>
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={colors.legDark} roughness={0.9} />
        </mesh>

        {/* Front right leg */}
        <mesh castShadow position={[0.2, -0.4, -0.18]}>
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={colors.legDark} roughness={0.9} />
        </mesh>

        {/* Back left leg */}
        <mesh castShadow position={[-0.25, -0.4, 0.18]}>
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={colors.legDark} roughness={0.9} />
        </mesh>

        {/* Back right leg */}
        <mesh castShadow position={[-0.25, -0.4, -0.18]}>
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={colors.legDark} roughness={0.9} />
        </mesh>

        {/* Tail (up and curly) */}
        <mesh castShadow position={[-0.5, 0.2, 0]}>
          <boxGeometry args={[0.1, 0.25, 0.1]} />
          <meshStandardMaterial color={colors.tail} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.5, 0.35, 0]}>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
          <meshStandardMaterial color={colors.tail} roughness={0.9} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// Expose ref to the group for camera tracking
export function MelWithRef(props: MelProps & { melRef: React.RefObject<THREE.Group | null> }) {
  const { melRef, ...melProps } = props;
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  useFrame(() => {
    if (rigidBodyRef.current && melRef.current) {
      const pos = rigidBodyRef.current.translation();
      melRef.current.position.set(pos.x, pos.y, pos.z);
    }
  });

  return (
    <>
      <group ref={melRef} />
      <Mel {...melProps} />
    </>
  );
}

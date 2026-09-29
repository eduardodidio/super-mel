import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody, useRapier } from "@react-three/rapier";
import * as THREE from "three";
import type { Controls } from "../hooks/useControls";

const MOVE_SPEED = 6;
const MOVE_ACCEL = 25;
const FRICTION = 12;
const JUMP_FORCE = 10;
const JUMP_HOLD_FORCE = 6;
const MAX_JUMP_HOLD = 0.25;
const COYOTE_TIME = 0.1;

interface MelProps {
  controlsRef: React.RefObject<Controls>;
  onPositionUpdate?: (x: number, y: number) => void;
  onCollisionDamage?: () => void;
  invincible?: boolean;
}

export function Mel({ controlsRef, onPositionUpdate, onCollisionDamage, invincible = false }: MelProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { world } = useRapier();

  const timeRef = useRef(0);
  const facingRight = useRef(true);
  const grounded = useRef(false);
  const coyoteTimer = useRef(0);
  const jumpHoldTimer = useRef(0);
  const jumping = useRef(false);
  const lastJumpPressed = useRef(false);

  const colors = useMemo(() => ({
    body: "#8B6914",
    belly: "#C4A44A",
    head: "#A0782C",
    nose: "#2a2a2a",
    eye: "#111111",
    eyeWhite: "#ffffff",
    ear: "#5C4A1E",
    tongue: "#FF6B8A",
    collar: "#FF4444",
    tail: "#A0782C",
    legDark: "#6B4F10",
  }), []);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || !groupRef.current) return;

    timeRef.current += delta;
    const rb = rigidBodyRef.current;
    const pos = rb.translation();
    const vel = rb.linvel();
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    // --- Ground check via raycast ---
    const rayOrigin = { x: pos.x, y: pos.y - 0.55, z: pos.z };
    const rayDir = { x: 0, y: -1, z: 0 };
    const ray = new (world as any).raw.RawRayRay(rayOrigin, rayDir);
    let wasGrounded = grounded.current;

    // Simple ground check: if Y velocity is ~0 and we have something below
    const hit = world.castRay(
      { origin: rayOrigin, dir: rayDir } as any,
      0.3,
      true,
      undefined,
      undefined,
      undefined,
      rb,
    );
    grounded.current = hit !== null && Math.abs(vel.y) < 1;

    // Coyote time
    if (wasGrounded && !grounded.current && !jumping.current) {
      coyoteTimer.current = COYOTE_TIME;
    }
    if (coyoteTimer.current > 0) {
      coyoteTimer.current -= delta;
    }

    // --- Horizontal movement ---
    let targetVelX = 0;
    if (ctrl.left) targetVelX -= MOVE_SPEED;
    if (ctrl.right) targetVelX += MOVE_SPEED;

    let newVelX = vel.x;
    if (targetVelX !== 0) {
      // Accelerate towards target
      newVelX = THREE.MathUtils.lerp(vel.x, targetVelX, MOVE_ACCEL * delta / (Math.abs(vel.x) + 1));
      facingRight.current = targetVelX > 0;
    } else {
      // Friction
      if (Math.abs(vel.x) > 0.1) {
        newVelX = vel.x * Math.max(0, 1 - FRICTION * delta);
      } else {
        newVelX = 0;
      }
    }

    // --- Jump ---
    const canJump = grounded.current || coyoteTimer.current > 0;
    const jumpPressed = ctrl.jump;

    // Initial jump
    if (jumpPressed && !lastJumpPressed.current && canJump) {
      jumping.current = true;
      jumpHoldTimer.current = 0;
      coyoteTimer.current = 0;
      rb.setLinvel({ x: newVelX, y: JUMP_FORCE, z: 0 }, true);
    }
    // Variable height: hold for higher jump
    else if (jumpPressed && jumping.current && jumpHoldTimer.current < MAX_JUMP_HOLD) {
      jumpHoldTimer.current += delta;
      const holdVel = vel.y + JUMP_HOLD_FORCE * delta;
      rb.setLinvel({ x: newVelX, y: Math.max(vel.y, holdVel), z: 0 }, true);
    }
    // Normal physics
    else {
      if (!jumpPressed) {
        jumping.current = false;
      }
      if (grounded.current) {
        jumping.current = false;
      }
      rb.setLinvel({ x: newVelX, y: vel.y, z: 0 }, true);
    }

    lastJumpPressed.current = jumpPressed;

    onPositionUpdate?.(pos.x, pos.y);

    // --- Visual ---
    // Flip direction
    groupRef.current.scale.x = facingRight.current ? 1 : -1;

    // Idle breathing
    const breathe = 1 + Math.sin(timeRef.current * 3) * 0.015;
    groupRef.current.scale.y = breathe;

    // Invincibility blink
    if (invincible) {
      groupRef.current.visible = Math.sin(timeRef.current * 20) > 0;
    } else {
      groupRef.current.visible = true;
    }

    // Fall death
    if (pos.y < -15) {
      onCollisionDamage?.();
      rb.setTranslation({ x: pos.x, y: 8, z: 0 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[2, 5, 0]}
      mass={1}
      linearDamping={0}
      lockRotations
      enabledTranslations={[true, true, false]}
      colliders="cuboid"
      name="mel"
      friction={0}
    >
      <group ref={groupRef}>
        {/* Body */}
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.9, 0.55, 0.55]} />
          <meshStandardMaterial color={colors.body} roughness={0.9} />
        </mesh>

        {/* Belly */}
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

        {/* Eyes */}
        <mesh position={[0.62, 0.28, 0.15]}>
          <boxGeometry args={[0.08, 0.1, 0.06]} />
          <meshStandardMaterial color={colors.eyeWhite} />
        </mesh>
        <mesh position={[0.66, 0.28, 0.16]}>
          <boxGeometry args={[0.05, 0.06, 0.06]} />
          <meshStandardMaterial color={colors.eye} />
        </mesh>
        <mesh position={[0.62, 0.28, -0.15]}>
          <boxGeometry args={[0.08, 0.1, 0.06]} />
          <meshStandardMaterial color={colors.eyeWhite} />
        </mesh>
        <mesh position={[0.66, 0.28, -0.16]}>
          <boxGeometry args={[0.05, 0.06, 0.06]} />
          <meshStandardMaterial color={colors.eye} />
        </mesh>

        {/* Ears */}
        <mesh castShadow position={[0.42, 0.48, 0.15]}>
          <boxGeometry args={[0.1, 0.2, 0.08]} />
          <meshStandardMaterial color={colors.ear} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.42, 0.48, -0.15]}>
          <boxGeometry args={[0.1, 0.2, 0.08]} />
          <meshStandardMaterial color={colors.ear} roughness={0.9} />
        </mesh>

        {/* Tongue */}
        <mesh position={[0.78, 0.05, 0.05]}>
          <boxGeometry args={[0.1, 0.03, 0.06]} />
          <meshStandardMaterial color={colors.tongue} />
        </mesh>

        {/* Collar */}
        <mesh position={[0.3, 0.02, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.58]} />
          <meshStandardMaterial color={colors.collar} roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Legs */}
        <mesh castShadow position={[0.2, -0.4, 0.18]}>
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={colors.legDark} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.2, -0.4, -0.18]}>
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={colors.legDark} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.25, -0.4, 0.18]}>
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={colors.legDark} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.25, -0.4, -0.18]}>
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={colors.legDark} roughness={0.9} />
        </mesh>

        {/* Tail */}
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

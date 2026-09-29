import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody, useRapier } from "@react-three/rapier";
import * as THREE from "three";
import type { Controls } from "../hooks/useControls";
import { loadSpritesheet, updateSpriteUV } from "../systems/SpriteAnimator";

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

type MelAnim = "idle" | "walk" | "run" | "jump" | "fall" | "attack" | "hurt";

export function Mel({ controlsRef, onPositionUpdate, onCollisionDamage, invincible = false }: MelProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const spriteRef = useRef<THREE.Mesh>(null);
  const { world } = useRapier();

  const texture = useMemo(() => loadSpritesheet().clone(), []);

  const timeRef = useRef(0);
  const facingRight = useRef(true);
  const grounded = useRef(false);
  const coyoteTimer = useRef(0);
  const jumpHoldTimer = useRef(0);
  const jumping = useRef(false);
  const lastJumpPressed = useRef(false);
  const animTime = useRef(0);
  const [currentAnim, setCurrentAnim] = useState<MelAnim>("idle");
  const lastAnim = useRef<MelAnim>("idle");
  const attackTimer = useRef(0);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || !spriteRef.current) return;

    timeRef.current += delta;
    const rb = rigidBodyRef.current;
    const pos = rb.translation();
    const vel = rb.linvel();
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    // --- Ground check ---
    const rayOrigin = { x: pos.x, y: pos.y - 0.55, z: pos.z };
    const rayDir = { x: 0, y: -1, z: 0 };
    const wasGrounded = grounded.current;

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
      newVelX = THREE.MathUtils.lerp(vel.x, targetVelX, MOVE_ACCEL * delta / (Math.abs(vel.x) + 1));
      facingRight.current = targetVelX > 0;
    } else {
      if (Math.abs(vel.x) > 0.1) {
        newVelX = vel.x * Math.max(0, 1 - FRICTION * delta);
      } else {
        newVelX = 0;
      }
    }

    // --- Jump ---
    const canJump = grounded.current || coyoteTimer.current > 0;
    const jumpPressed = ctrl.jump;

    if (jumpPressed && !lastJumpPressed.current && canJump) {
      jumping.current = true;
      jumpHoldTimer.current = 0;
      coyoteTimer.current = 0;
      rb.setLinvel({ x: newVelX, y: JUMP_FORCE, z: 0 }, true);
    } else if (jumpPressed && jumping.current && jumpHoldTimer.current < MAX_JUMP_HOLD) {
      jumpHoldTimer.current += delta;
      const holdVel = vel.y + JUMP_HOLD_FORCE * delta;
      rb.setLinvel({ x: newVelX, y: Math.max(vel.y, holdVel), z: 0 }, true);
    } else {
      if (!jumpPressed) jumping.current = false;
      if (grounded.current) jumping.current = false;
      rb.setLinvel({ x: newVelX, y: vel.y, z: 0 }, true);
    }

    lastJumpPressed.current = jumpPressed;
    onPositionUpdate?.(pos.x, pos.y);

    // --- Attack timer ---
    if (ctrl.shoot && attackTimer.current <= 0) {
      attackTimer.current = 0.3;
    }
    if (attackTimer.current > 0) {
      attackTimer.current -= delta;
    }

    // --- Animation selection ---
    let newAnim: MelAnim = "idle";
    if (invincible && attackTimer.current <= 0) {
      newAnim = "hurt";
    } else if (attackTimer.current > 0) {
      newAnim = "attack";
    } else if (!grounded.current && vel.y > 1) {
      newAnim = "jump";
    } else if (!grounded.current && vel.y < -1) {
      newAnim = "fall";
    } else if (Math.abs(vel.x) > 4) {
      newAnim = "run";
    } else if (Math.abs(vel.x) > 0.5) {
      newAnim = "walk";
    }

    if (newAnim !== lastAnim.current) {
      animTime.current = 0;
      lastAnim.current = newAnim;
      setCurrentAnim(newAnim);
    }

    // --- Sprite update ---
    animTime.current += delta;
    updateSpriteUV(texture, currentAnim, animTime.current);

    // Flip sprite
    spriteRef.current.scale.x = facingRight.current ? 2 : -2;

    // Invincibility blink
    if (invincible) {
      spriteRef.current.visible = Math.sin(timeRef.current * 20) > 0;
    } else {
      spriteRef.current.visible = true;
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
      {/* Sprite billboard */}
      <mesh ref={spriteRef} position={[0, 0.3, 0]} scale={[2, 2, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Invisible collider box (smaller than sprite) */}
      <mesh visible={false}>
        <boxGeometry args={[0.6, 0.9, 0.5]} />
        <meshBasicMaterial />
      </mesh>
    </RigidBody>
  );
}

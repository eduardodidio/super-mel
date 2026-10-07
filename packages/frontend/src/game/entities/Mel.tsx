import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { RigidBody, CuboidCollider, BallCollider, type RapierRigidBody, useRapier } from "@react-three/rapier";
import * as THREE from "three";
import type { Controls } from "../hooks/useControls";
import { useGameFrame } from "../hooks/useGameFrame";
import { loadSprites, getFrame, getFrameEvent, getFrameNormalizedScale } from "../systems/SpriteAnimator";
import { AnimationStateMachine, type AnimInput } from "../systems/AnimationStateMachine";
import { gameEventBus } from "../systems/GameEventBus";

const MOVE_SPEED = 6;
const MOVE_ACCEL = 25;
const FRICTION = 12;
const JUMP_FORCE = 10;
const JUMP_HOLD_FORCE = 6;
const MAX_JUMP_HOLD = 0.25;
const COYOTE_TIME = 0.1;
const DOUBLE_JUMP_FORCE = 9;
const CROUCH_SPEED_MULT = 0.4;
const STOMP_BOUNCE_FORCE = 7;

const SPRITE_HEIGHT = 2;

export interface MelHandle {
  stompBounce: () => void;
  springBounce: (force: number) => void;
}

interface MelProps {
  controlsRef: React.RefObject<Controls>;
  onPositionUpdate?: (x: number, y: number) => void;
  onCollisionDamage?: () => void;
  invincible?: boolean;
  dead?: boolean;
  onAttackFrame?: () => void;
  onBarkFrame?: () => void;
  onLookUp?: (looking: boolean) => void;
  heartJustCollected?: boolean;
  stateRef?: React.MutableRefObject<{ state: string; grounded: boolean; velX: number; sniffing: boolean }>;
  digActiveRef?: React.RefObject<boolean>;
  respawnPoint?: { x: number; y: number };
  initialPosition?: [number, number, number];
}

export const Mel = forwardRef<MelHandle, MelProps>(function Mel({
  controlsRef,
  onPositionUpdate,
  onCollisionDamage,
  invincible = false,
  dead = false,
  onAttackFrame,
  onBarkFrame,
  onLookUp,
  heartJustCollected,
  stateRef,
  digActiveRef,
  respawnPoint,
  initialPosition,
}, ref) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const spriteRef = useRef<THREE.Mesh>(null);
  const { world } = useRapier();

  // New animation system
  const stateMachine = useRef(new AnimationStateMachine());
  const spritesLoaded = useRef(false);
  const lastEvent = useRef<string | undefined>(undefined);

  // Damage edge-detection: true only on the frame invincible flips from false->true
  const wasInvincible = useRef(false);

  // Physics refs
  const timeRef = useRef(0);
  const facingRight = useRef(true);
  const grounded = useRef(false);
  const coyoteTimer = useRef(0);
  const jumpHoldTimer = useRef(0);
  const jumping = useRef(false);
  const lastJumpPressed = useRef(false);
  const attackTimer = useRef(0);
  const idleTime = useRef(0);
  const doubleJumpUsed = useRef(false);
  const crouching = useRef(false);
  const lookingUp = useRef(false);
  const lastLookingUp = useRef(false);
  const lookUpTime = useRef(0);
  const wasHeartCollected = useRef(false);
  const lastBarkPressed = useRef(false);
  const sniffTimer = useRef(0);

  // Smoothing refs for sprite scale transitions
  const prevWorldW = useRef(SPRITE_HEIGHT);
  const prevWorldH = useRef(SPRITE_HEIGHT);

  // Expose stomp bounce via imperative handle
  useImperativeHandle(ref, () => ({
    stompBounce() {
      if (!rigidBodyRef.current) return;
      const vel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel(
        { x: vel.x, y: STOMP_BOUNCE_FORCE, z: 0 },
        true,
      );
      // Reset jump state so Mel can re-jump
      jumping.current = false;
      doubleJumpUsed.current = false;
    },
    springBounce(force: number) {
      if (!rigidBodyRef.current) return;
      const vel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel({ x: vel.x, y: force, z: 0 }, true);
      // Reset jump state so Mel can double-jump after spring bounce
      jumping.current = false;
      doubleJumpUsed.current = false;
    },
  }));

  // Load sprites once on mount
  useEffect(() => {
    loadSprites().then(() => {
      spritesLoaded.current = true;
    });
  }, []);

  useGameFrame((_, delta) => {
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
      0.4,
      true,
      undefined,
      undefined,
      undefined,
      rb,
    );
    grounded.current = hit !== null;

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
      const changingDirection = (vel.x > 0.5 && targetVelX < 0) || (vel.x < -0.5 && targetVelX > 0);
      const accel = changingDirection ? MOVE_ACCEL * 2 : MOVE_ACCEL;
      newVelX = THREE.MathUtils.lerp(vel.x, targetVelX, Math.min(1, accel * delta));
      facingRight.current = targetVelX > 0;
    } else {
      if (Math.abs(vel.x) > 0.1) {
        newVelX = vel.x * Math.max(0, 1 - FRICTION * delta);
      } else {
        newVelX = 0;
      }
    }

    // --- Crouch ---
    crouching.current = ctrl.down && grounded.current;
    if (crouching.current) {
      newVelX *= CROUCH_SPEED_MULT;
    }

    // --- Jump ---
    const canJump = grounded.current || coyoteTimer.current > 0;
    const jumpPressed = ctrl.jump;

    if (jumpPressed && !lastJumpPressed.current && canJump) {
      // Normal ground jump (includes coyote time)
      jumping.current = true;
      jumpHoldTimer.current = 0;
      coyoteTimer.current = 0;
      rb.setLinvel({ x: newVelX, y: JUMP_FORCE, z: 0 }, true);
    } else if (jumpPressed && !lastJumpPressed.current && !canJump && !doubleJumpUsed.current) {
      // Double jump (airborne, not yet used)
      doubleJumpUsed.current = true;
      jumpHoldTimer.current = 0;
      jumping.current = true;
      rb.setLinvel({ x: newVelX, y: DOUBLE_JUMP_FORCE, z: 0 }, true);
      gameEventBus.emit("double_jump", {} as Record<string, never>);
    } else if (jumpPressed && jumping.current && jumpHoldTimer.current < MAX_JUMP_HOLD) {
      // Variable height hold (works for both normal and double jump)
      jumpHoldTimer.current += delta;
      const holdVel = vel.y + JUMP_HOLD_FORCE * delta;
      rb.setLinvel({ x: newVelX, y: Math.max(vel.y, holdVel), z: 0 }, true);
    } else {
      if (!jumpPressed) jumping.current = false;
      if (grounded.current) jumping.current = false;
      rb.setLinvel({ x: newVelX, y: vel.y, z: 0 }, true);
    }

    lastJumpPressed.current = jumpPressed;

    // --- Reset double jump on ground ---
    if (grounded.current) {
      doubleJumpUsed.current = false;
    }

    onPositionUpdate?.(pos.x, pos.y);

    // --- Attack timer ---
    if (ctrl.shoot && attackTimer.current <= 0) {
      attackTimer.current = 0.3;
    }
    if (attackTimer.current > 0) {
      attackTimer.current -= delta;
    }

    // --- Look up ---
    lookingUp.current = ctrl.up && grounded.current && !ctrl.left && !ctrl.right;
    if (lookingUp.current !== lastLookingUp.current) {
      onLookUp?.(lookingUp.current);
      lastLookingUp.current = lookingUp.current;
    }

    // --- Look up time tracking ---
    if (lookingUp.current) {
      lookUpTime.current += delta;
    } else {
      lookUpTime.current = 0;
    }

    // --- Idle time tracking ---
    const hasHorizontalInput = ctrl.left || ctrl.right;
    if (hasHorizontalInput || !grounded.current) {
      idleTime.current = 0;
    } else {
      idleTime.current += delta;
    }

    // --- Damage edge detection (true only on the frame damage occurs) ---
    const justDamaged = invincible && !wasInvincible.current;
    wasInvincible.current = invincible;

    // --- Heart collection edge detection ---
    const justCollectedHeart = (heartJustCollected ?? false) && !wasHeartCollected.current;
    wasHeartCollected.current = heartJustCollected ?? false;

    // --- Bark edge detection ---
    const justBarked = ctrl.bark && !lastBarkPressed.current;
    lastBarkPressed.current = ctrl.bark;

    // --- Sniff timer: holding down while grounded and still ---
    if (ctrl.down && grounded.current && Math.abs(vel.x) < 0.1 && !ctrl.left && !ctrl.right) {
      sniffTimer.current += delta;
    } else {
      sniffTimer.current = 0;
    }

    // --- Animation state machine update ---
    const animInput: AnimInput = {
      velX: vel.x,
      velY: vel.y,
      grounded: grounded.current,
      attackPressed: ctrl.shoot && attackTimer.current > 0.25, // only on first frame
      damaged: justDamaged,
      damageLevel: 1,
      dead,
      idleTime: idleTime.current,
      crouching: crouching.current,
      lookingUp: lookingUp.current,
      flying: false,  // Fly disabled (F53: replaced by double jump)
      doubleJumping: doubleJumpUsed.current && !grounded.current,
      lookUpTime: lookUpTime.current,
      heartCollected: justCollectedHeart,
      barkPressed: justBarked,
      digging: digActiveRef?.current ?? false,
      sniffing: sniffTimer.current >= 1.0,
    };

    stateMachine.current.update(animInput, delta);

    // --- Check for attack frame event (bark_fire) ---
    const animName = stateMachine.current.getAnimName();
    const event = getFrameEvent(animName, stateMachine.current.stateTime);
    if (event === "bark_fire" && lastEvent.current !== "bark_fire") {
      // Differentiate bark from attack: check current ASM state
      if (stateMachine.current.state === "bark") {
        onBarkFrame?.();
      } else {
        onAttackFrame?.();
      }
    }
    lastEvent.current = event;

    // --- Sprite texture update ---
    if (spritesLoaded.current) {
      const texture = getFrame(animName, stateMachine.current.stateTime);
      const mat = (spriteRef.current as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat.map !== texture) {
        mat.map = texture;
        mat.needsUpdate = true;
      }

      // Use normalized scale from manifest frameSize for correct proportions
      const { scaleX, scaleY } = getFrameNormalizedScale(
        animName,
        stateMachine.current.stateTime
      );
      const targetW = SPRITE_HEIGHT * scaleX;
      const targetH = SPRITE_HEIGHT * scaleY;

      // Smooth scale transitions to avoid jarring size jumps between animations
      const smoothFactor = Math.min(1, delta * 15);
      const smoothW = THREE.MathUtils.lerp(prevWorldW.current, targetW, smoothFactor);
      const smoothH = THREE.MathUtils.lerp(prevWorldH.current, targetH, smoothFactor);
      prevWorldW.current = smoothW;
      prevWorldH.current = smoothH;

      spriteRef.current.scale.set(
        facingRight.current ? smoothW : -smoothW,
        smoothH,
        1
      );

      // Anchor feet to collider bottom: offset sprite Y so bottom aligns with collider
      // PlaneGeometry pivot is at center, so offset = halfHeight - collider half-height offset
      const meshOffsetY = smoothH / 2 - 0.15;
      spriteRef.current.position.y = meshOffsetY;
    }

    // --- Update facing direction ---
    const facing = stateMachine.current.facing;
    facingRight.current = facing === "right";

    // --- Expose state for EffectManager ---
    if (stateRef) {
      stateRef.current = {
        state: stateMachine.current.state,
        grounded: grounded.current,
        velX: vel.x,
        sniffing: sniffTimer.current >= 1.0,
      };
    }

    // --- Invincibility blink ---
    if (invincible) {
      spriteRef.current.visible = Math.sin(timeRef.current * 20) > 0;
    } else {
      spriteRef.current.visible = true;
    }

    // --- Fall death ---
    if (pos.y < -15) {
      onCollisionDamage?.();
      const rx = respawnPoint?.x ?? pos.x;
      const ry = (respawnPoint?.y ?? 8) + 2;
      rb.setTranslation({ x: rx, y: ry, z: 0 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={initialPosition ?? [2, 5, 0]}
      mass={1}
      linearDamping={0}
      lockRotations
      enabledTranslations={[true, true, false]}
      colliders={false}
      name="mel"
      friction={0}
    >
      {/* Compound collider: cuboid body + ball feet for smooth ground sliding */}
      <CuboidCollider args={[0.3, 0.25, 0.25]} position={[0, 0.1, 0]} />
      <BallCollider args={[0.3]} position={[0, -0.2, 0]} />
      {/* Sprite billboard */}
      <mesh ref={spriteRef} position={[0, 0.3, 0]} scale={[SPRITE_HEIGHT, SPRITE_HEIGHT, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </RigidBody>
  );
});

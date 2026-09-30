import { useRef, useEffect } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody, useRapier } from "@react-three/rapier";
import * as THREE from "three";
import type { Controls } from "../hooks/useControls";
import { useGameFrame } from "../hooks/useGameFrame";
import { useAssistMode } from "../hooks/useAssistMode";
import { loadSprites, getFrame, getFrameEvent, getFrameAspectRatio } from "../systems/SpriteAnimator";
import { AnimationStateMachine, type AnimInput } from "../systems/AnimationStateMachine";

const MOVE_SPEED = 6;
const MOVE_ACCEL = 25;
const FRICTION = 12;
const JUMP_FORCE = 10;
const JUMP_HOLD_FORCE = 6;
const MAX_JUMP_HOLD = 0.25;
const COYOTE_TIME = 0.1;
const FLY_FORCE = 8;
const FLY_GRAVITY_SCALE = 0.4;
const FLY_MAX_VEL_Y = 4;
const MAX_FLY_TIME = 5;
const CROUCH_SPEED_MULT = 0.4;

const SPRITE_HEIGHT = 2;

interface MelProps {
  controlsRef: React.RefObject<Controls>;
  onPositionUpdate?: (x: number, y: number) => void;
  onCollisionDamage?: () => void;
  invincible?: boolean;
  dead?: boolean;
  onAttackFrame?: () => void;
  onLookUp?: (looking: boolean) => void;
  onFlyStateUpdate?: (flying: boolean, timeRemaining: number) => void;
  heartJustCollected?: boolean;
  stateRef?: React.MutableRefObject<{ state: string; grounded: boolean; velX: number }>;
}

export function Mel({
  controlsRef,
  onPositionUpdate,
  onCollisionDamage,
  invincible = false,
  dead = false,
  onAttackFrame,
  onLookUp,
  onFlyStateUpdate,
  heartJustCollected,
  stateRef,
}: MelProps) {
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
  const flying = useRef(false);
  const flyTimer = useRef(0);
  const crouching = useRef(false);
  const lookingUp = useRef(false);
  const lastLookingUp = useRef(false);
  const lookUpTime = useRef(0);
  const wasHeartCollected = useRef(false);

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

    // --- Crouch ---
    crouching.current = ctrl.down && grounded.current;
    if (crouching.current) {
      newVelX *= CROUCH_SPEED_MULT;
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

    // --- Fly (max 5s, or unlimited with assist mode) ---
    const unlimitedFlight = useAssistMode.getState().unlimitedFlight;

    if (ctrl.jump && !grounded.current && jumping.current && jumpHoldTimer.current >= MAX_JUMP_HOLD) {
      flying.current = true;
    }
    if (flying.current) {
      flyTimer.current += delta;
    }
    if (flyTimer.current >= MAX_FLY_TIME && !unlimitedFlight) {
      flying.current = false;
    }
    if (flying.current && ctrl.jump && !grounded.current) {
      const flyVelY = Math.min(vel.y + FLY_FORCE * delta, FLY_MAX_VEL_Y);
      rb.setLinvel({ x: newVelX, y: flyVelY, z: 0 }, true);
    }
    if (!ctrl.jump) {
      flying.current = false;
    }
    if (grounded.current) {
      flying.current = false;
      flyTimer.current = 0;
    }

    onPositionUpdate?.(pos.x, pos.y);

    // Report fly state — unlimited flight always shows full stamina bar
    const reportedTime = unlimitedFlight
      ? MAX_FLY_TIME
      : Math.max(0, MAX_FLY_TIME - flyTimer.current);
    onFlyStateUpdate?.(flying.current, reportedTime);

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
      flying: flying.current,
      lookUpTime: lookUpTime.current,
      heartCollected: justCollectedHeart,
    };

    stateMachine.current.update(animInput, delta);

    // --- Check for attack frame event (bark_fire) ---
    const animName = stateMachine.current.getAnimName();
    const event = getFrameEvent(animName, stateMachine.current.stateTime);
    if (event === "bark_fire" && lastEvent.current !== "bark_fire") {
      onAttackFrame?.();
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

      const ratio = getFrameAspectRatio(animName, stateMachine.current.stateTime);
      const frameWidth = SPRITE_HEIGHT * ratio;
      spriteRef.current.scale.set(
        facingRight.current ? frameWidth : -frameWidth,
        SPRITE_HEIGHT,
        1
      );
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
      colliders={false}
      name="mel"
      friction={0}
    >
      <CuboidCollider args={[0.3, 0.45, 0.25]} />
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
}

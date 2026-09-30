import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useScreenShake } from "./useScreenShake";
import { sharedCameraRef, sharedCanvasSize } from "./CoinPopup";
import { useGameState } from "../hooks/useGameState";

interface CameraRigProps {
  targetRef: React.RefObject<THREE.Object3D | null>;
  offset?: [number, number, number];
  lerpSpeed?: number;
  deadzone?: { x: number; y: number };
  isLookingUp?: boolean;
  lookUpOffset?: number;
  facingRightRef?: React.RefObject<boolean>;
  lookaheadX?: number;
}

export function CameraRig({
  targetRef,
  offset = [0, 3, 18],
  lerpSpeed = 0.08,
  deadzone = { x: 2, y: 1.5 },
  isLookingUp = false,
  lookUpOffset = 5,
  facingRightRef,
  lookaheadX = 1.5,
}: CameraRigProps) {
  const { camera, size } = useThree();
  // Share camera and canvas size for CoinPopup world-to-screen projection
  sharedCameraRef.current = camera;
  sharedCanvasSize.current = { width: size.width, height: size.height };
  const smoothPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const lookOffsetRef = useRef(0);
  const lookaheadRef = useRef(0);

  useFrame((_, delta) => {
    if (useGameState.getState().paused) return;
    if (!targetRef.current) return;
    const target = targetRef.current.position;

    // Tick screen shake
    const shakeTick = useScreenShake.getState().tick;
    shakeTick(delta);
    const { offsetX: shakeX, offsetY: shakeY } = useScreenShake.getState();

    // Smooth look-up offset
    const targetLookOffset = isLookingUp ? (lookUpOffset ?? 5) : 0;
    lookOffsetRef.current = THREE.MathUtils.lerp(lookOffsetRef.current, targetLookOffset, lerpSpeed);

    // Smooth lookahead in facing direction
    const isFacingRight = facingRightRef?.current ?? true;
    const targetLookahead = isFacingRight ? lookaheadX : -lookaheadX;

    if (!initialized.current) {
      lookaheadRef.current = targetLookahead;
      smoothPos.current.set(target.x + offset[0] + lookaheadRef.current, target.y + offset[1] + lookOffsetRef.current, offset[2]);
      camera.position.copy(smoothPos.current);
      camera.lookAt(target.x + offset[0] + lookaheadRef.current, target.y + offset[1] + lookOffsetRef.current, 0);
      initialized.current = true;
      return;
    }

    lookaheadRef.current = THREE.MathUtils.lerp(lookaheadRef.current, targetLookahead, lerpSpeed);

    // Deadzone: only move camera when target is far enough from center
    const camLookX = camera.position.x - offset[0];
    const camLookY = camera.position.y - offset[1] - lookOffsetRef.current;

    let targetX = camLookX;
    let targetY = camLookY;

    const dx = target.x - camLookX;
    const dy = target.y - camLookY;

    if (Math.abs(dx) > deadzone.x) {
      targetX = target.x - Math.sign(dx) * deadzone.x;
    }
    if (Math.abs(dy) > deadzone.y) {
      targetY = target.y - Math.sign(dy) * deadzone.y;
    }

    const goalPos = new THREE.Vector3(
      targetX + offset[0] + lookaheadRef.current + shakeX,
      targetY + offset[1] + lookOffsetRef.current + shakeY,
      offset[2]
    );
    camera.position.lerp(goalPos, lerpSpeed);
    camera.lookAt(targetX + offset[0] + lookaheadRef.current, targetY + offset[1] + lookOffsetRef.current, 0);
  });

  return null;
}

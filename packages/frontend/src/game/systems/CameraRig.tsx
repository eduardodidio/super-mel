import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface CameraRigProps {
  targetRef: React.RefObject<THREE.Object3D | null>;
  offset?: [number, number, number];
  lerpSpeed?: number;
  deadzone?: { x: number; y: number };
}

export function CameraRig({
  targetRef,
  offset = [0, 3, 18],
  lerpSpeed = 0.08,
  deadzone = { x: 2, y: 1.5 },
}: CameraRigProps) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(() => {
    if (!targetRef.current) return;
    const target = targetRef.current.position;

    if (!initialized.current) {
      smoothPos.current.set(target.x + offset[0], target.y + offset[1], offset[2]);
      camera.position.copy(smoothPos.current);
      camera.lookAt(target.x + offset[0], target.y + offset[1], 0);
      initialized.current = true;
      return;
    }

    // Deadzone: only move camera when target is far enough from center
    const camLookX = camera.position.x - offset[0];
    const camLookY = camera.position.y - offset[1];

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

    const goalPos = new THREE.Vector3(targetX + offset[0], targetY + offset[1], offset[2]);
    camera.position.lerp(goalPos, lerpSpeed);
    camera.lookAt(targetX + offset[0], targetY + offset[1], 0);
  });

  return null;
}

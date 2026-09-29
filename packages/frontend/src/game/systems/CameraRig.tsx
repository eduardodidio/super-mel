import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface CameraRigProps {
  targetRef: React.RefObject<THREE.Object3D | null>;
  offset?: [number, number, number];
  lerpSpeed?: number;
}

export function CameraRig({
  targetRef,
  offset = [5, 2, 20],
  lerpSpeed = 0.05,
}: CameraRigProps) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!targetRef.current) return;
    const pos = targetRef.current.position;
    targetPos.current.set(pos.x + offset[0], pos.y + offset[1], offset[2]);
    camera.position.lerp(targetPos.current, lerpSpeed);
    camera.lookAt(pos.x + offset[0], pos.y + offset[1], 0);
  });

  return null;
}

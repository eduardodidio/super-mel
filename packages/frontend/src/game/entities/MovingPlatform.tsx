import { useRef } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameFrame } from "../hooks/useGameFrame";

interface MovingPlatformProps {
  position: [number, number, number];
  direction?: "horizontal" | "vertical"; // default "horizontal"
  speed?: number; // default 3
  range?: number; // default 4 (blocks from center)
}

const PLATFORM_COLOR = "#5577AA";
const ARROW_COLOR = "#AACCFF";

export function MovingPlatform({
  position,
  direction = "horizontal",
  speed = 3,
  range = 4,
}: MovingPlatformProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const timeRef = useRef(0);

  useGameFrame((_, delta) => {
    if (!rbRef.current) return;
    timeRef.current += delta;

    const offset = Math.sin(timeRef.current * speed) * range;

    if (direction === "horizontal") {
      rbRef.current.setNextKinematicTranslation({
        x: position[0] + offset,
        y: position[1],
        z: position[2],
      });
    } else {
      rbRef.current.setNextKinematicTranslation({
        x: position[0],
        y: position[1] + offset,
        z: position[2],
      });
    }
  });

  return (
    <RigidBody
      ref={rbRef}
      position={position}
      type="kinematicPosition"
      colliders={false}
      name="moving_platform"
    >
      {/* Solid collider matching the visual platform size */}
      <CuboidCollider args={[0.9, 0.125, 0.4]} />

      <group>
        {/* Main platform body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.25, 0.8]} />
          <meshStandardMaterial
            color={PLATFORM_COLOR}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>

        {/* Top edge trim — thin strip on top for visual depth */}
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[1.85, 0.02, 0.85]} />
          <meshStandardMaterial
            color="#6688BB"
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>

        {/* Bottom edge trim */}
        <mesh position={[0, -0.13, 0]}>
          <boxGeometry args={[1.85, 0.02, 0.85]} />
          <meshStandardMaterial
            color="#445588"
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>

        {/* Direction arrows */}
        {direction === "horizontal" ? (
          <>
            {/* Right arrow (3 small boxes forming a ">") */}
            <mesh position={[0.55, 0.02, 0.41]}>
              <boxGeometry args={[0.2, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[0.68, 0.02, 0.41]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.15, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[0.68, 0.02, 0.41]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.15, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>

            {/* Left arrow (3 small boxes forming a "<") */}
            <mesh position={[-0.55, 0.02, 0.41]}>
              <boxGeometry args={[0.2, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[-0.68, 0.02, 0.41]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.15, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[-0.68, 0.02, 0.41]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.15, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
          </>
        ) : (
          <>
            {/* Up arrow */}
            <mesh position={[0, 0.02, 0.41]}>
              <boxGeometry args={[0.08, 0.2, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[0, 0.14, 0.41]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.15, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[0, 0.14, 0.41]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.15, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>

            {/* Down arrow */}
            <mesh position={[0, -0.08, 0.41]}>
              <boxGeometry args={[0.08, 0.12, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[0, -0.14, 0.41]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.15, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[0, -0.14, 0.41]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.15, 0.08, 0.02]} />
              <meshStandardMaterial
                color={ARROW_COLOR}
                emissive={ARROW_COLOR}
                emissiveIntensity={0.6}
              />
            </mesh>
          </>
        )}

        {/* Corner rivets — small metallic cubes for voxel detail */}
        {[
          [0.8, 0.05, 0.35],
          [-0.8, 0.05, 0.35],
          [0.8, 0.05, -0.35],
          [-0.8, 0.05, -0.35],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial
              color="#334466"
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}

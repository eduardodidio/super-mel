import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { BlockType } from "@super-mel/shared";
import { BLOCK_PROPERTIES } from "@super-mel/shared";
import { getBlockMaterials } from "../systems/BlockTextures3D";

interface BlockProps {
  type: Exclude<BlockType, "empty">;
  position: [number, number, number];
  onDestroy?: () => void;
  isBackground?: boolean;
}

export function Block({ type, position, onDestroy, isBackground = false }: BlockProps) {
  const [destroyed, setDestroyed] = useState(false);
  const props = BLOCK_PROPERTIES[type];
  const materials = getBlockMaterials(type);

  if (destroyed) {
    return <BlockParticles position={position} type={type} />;
  }

  if (isBackground) {
    return (
      <mesh position={position} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={materials[0].color}
          roughness={1}
          transparent
          opacity={0.4}
        />
      </mesh>
    );
  }

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      name={`block-${type}`}
      userData={{ blockType: type, destructible: props.destructible, dangerous: props.dangerous }}
      sensor={!props.solid && !props.dangerous}
    >
      <mesh castShadow receiveShadow material={materials}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
    </RigidBody>
  );
}

function BlockParticles({ position, type }: { position: [number, number, number]; type: Exclude<BlockType, "empty"> }) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef(
    Array.from({ length: 8 }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5,
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 3,
      ),
      scale: 0.15 + Math.random() * 0.15,
    })),
  );
  const lifeRef = useRef(0);
  const [visible, setVisible] = useState(true);
  const color = getBlockMaterials(type)[0].color ?? new THREE.Color("#888");

  useFrame((_, delta) => {
    if (!groupRef.current || !visible) return;
    lifeRef.current += delta;
    if (lifeRef.current > 1) {
      setVisible(false);
      return;
    }
    const children = groupRef.current.children;
    particlesRef.current.forEach((p, i) => {
      p.vel.y -= 15 * delta;
      p.pos.x += p.vel.x * delta;
      p.pos.y += p.vel.y * delta;
      p.pos.z += p.vel.z * delta;
      if (children[i]) {
        children[i].position.copy(p.pos);
        const s = p.scale * (1 - lifeRef.current);
        children[i].scale.setScalar(s);
      }
    });
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position}>
      {particlesRef.current.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { BlockType } from "@super-mel/shared";
import { BLOCK_PROPERTIES } from "@super-mel/shared";
import { getBlockMaterials, getCustomBlockMaterials } from "../systems/BlockTextures3D";
import { getCustomBlockDataUri } from "../systems/CustomTextureCache";

interface BlockProps {
  type: Exclude<BlockType, "empty">;
  position: [number, number, number];
  onDestroy?: () => void;
  isBackground?: boolean;
  activated?: boolean;
}

export function Block({ type, position, onDestroy, isBackground = false, activated = false }: BlockProps) {
  const [destroyed, setDestroyed] = useState(false);
  const props = BLOCK_PROPERTIES[type];

  // For custom blocks, look up the data URI and use custom materials
  let materials: THREE.MeshStandardMaterial[];
  if (type === "custom") {
    const dataUri = getCustomBlockDataUri(position[0], position[1]);
    materials = dataUri ? getCustomBlockMaterials(dataUri) : getBlockMaterials("custom");
  } else {
    materials = getBlockMaterials(type);
  }

  // Item block bump animation refs
  const bumpMeshRef = useRef<THREE.Mesh>(null);
  const bumpRef = useRef({ active: false, timer: 0 });
  const prevActivated = useRef(activated);

  useFrame((_, delta) => {
    // Only animate item_block bump
    if (type !== "item_block") return;

    // Detect activation edge
    if (activated && !prevActivated.current) {
      bumpRef.current = { active: true, timer: 0 };
    }
    prevActivated.current = activated;

    // Animate bump
    if (bumpRef.current.active && bumpMeshRef.current) {
      bumpRef.current.timer += delta;
      const t = bumpRef.current.timer;
      const UP_DURATION = 0.06;
      const DOWN_DURATION = 0.12;
      const BUMP_HEIGHT = 0.15;

      if (t < UP_DURATION) {
        bumpMeshRef.current.position.y = THREE.MathUtils.lerp(0, BUMP_HEIGHT, t / UP_DURATION);
      } else if (t < UP_DURATION + DOWN_DURATION) {
        const dt = (t - UP_DURATION) / DOWN_DURATION;
        bumpMeshRef.current.position.y = THREE.MathUtils.lerp(BUMP_HEIGHT, 0, dt);
      } else {
        bumpMeshRef.current.position.y = 0;
        bumpRef.current.active = false;
      }
    }
  });

  if (destroyed) {
    return <BlockParticles position={position} type={type} />;
  }

  // Activated item_block: gray empty block (no "?", no glow)
  if (type === "item_block" && activated) {
    return (
      <RigidBody
        type="fixed"
        position={position}
        colliders="cuboid"
        name={`block-${type}`}
        userData={{ blockType: type, destructible: false, dangerous: false }}
      >
        <mesh ref={bumpMeshRef} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#555555" roughness={0.9} metalness={0} />
        </mesh>
      </RigidBody>
    );
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

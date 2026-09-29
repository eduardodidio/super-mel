import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody, type CollisionPayload } from "@react-three/rapier";
import * as THREE from "three";
import { GAME_CONFIG } from "@super-mel/shared";

interface ProjectileProps {
  id: string;
  startPosition: [number, number, number];
  onHit: (id: string, targetName?: string) => void;
  onExpire: (id: string) => void;
}

export function Projectile({ id, startPosition, onHit, onExpire }: ProjectileProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const lifeRef = useRef(0);
  const [exploding, setExploding] = useState(false);
  const explodeRef = useRef(0);
  const explodePosRef = useRef(new THREE.Vector3(...startPosition));

  const speed = GAME_CONFIG.projectileSpeed / 50;

  useFrame((_, delta) => {
    if (exploding) {
      explodeRef.current += delta;
      if (meshRef.current) {
        const s = 1 + explodeRef.current * 8;
        meshRef.current.scale.setScalar(s);
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = 1 - explodeRef.current * 3;
      }
      if (lightRef.current) {
        lightRef.current.intensity = (1 - explodeRef.current * 3) * 5;
      }
      if (explodeRef.current > 0.3) {
        onExpire(id);
      }
      return;
    }

    if (!rbRef.current) return;

    lifeRef.current += delta;

    // Keep velocity constant
    rbRef.current.setLinvel({ x: speed, y: 0, z: 0 }, true);

    // Spin the projectile
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 10;
      meshRef.current.rotation.z += delta * 8;
    }

    // Pulse the light
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(lifeRef.current * 15) * 1;
    }

    // Expire after 3 seconds
    if (lifeRef.current > 3) {
      onExpire(id);
    }
  });

  const handleCollision = (payload: CollisionPayload) => {
    if (exploding) return;
    const otherName = (payload.other.rigidBody?.userData as any)?.blockType
      ? `block-${(payload.other.rigidBody?.userData as any).blockType}`
      : payload.other.rigidBodyObject?.name || "";

    if (otherName.startsWith("block-")) {
      const pos = rbRef.current?.translation();
      if (pos) explodePosRef.current.set(pos.x, pos.y, pos.z);
      setExploding(true);
      onHit(id, otherName);
    }
  };

  if (exploding) {
    return (
      <group position={explodePosRef.current}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={2}
            transparent
            opacity={1}
          />
        </mesh>
        <pointLight ref={lightRef} color="#FFD700" intensity={5} distance={6} />
      </group>
    );
  }

  return (
    <RigidBody
      ref={rbRef}
      position={startPosition}
      gravityScale={0}
      linearDamping={0}
      lockRotations
      colliders="ball"
      sensor
      name="projectile"
      onIntersectionEnter={handleCollision}
    >
      {/* Core sphere */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFA500"
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Glow light */}
      <pointLight ref={lightRef} color="#FFD700" intensity={2} distance={5} />

      {/* Trail ring */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.25, 0.03, 6, 12]} />
        <meshStandardMaterial
          color="#FFA500"
          emissive="#FF8C00"
          emissiveIntensity={1}
          transparent
          opacity={0.5}
        />
      </mesh>
    </RigidBody>
  );
}

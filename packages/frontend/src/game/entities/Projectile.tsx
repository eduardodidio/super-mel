import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody, type CollisionPayload } from "@react-three/rapier";
import * as THREE from "three";
import { getFrame, ANIMATIONS } from "../systems/SpriteAnimator";

interface ProjectileProps {
  id: string;
  startPosition: [number, number, number];
  direction?: number;
  onHit: (id: string, targetName?: string, blockPos?: { x: number; y: number; z: number }) => void;
  onExpire: (id: string) => void;
}

const SPEED = 15;

// Scale interpolation for the bark wave sprite
const SCALE_START = 0.8;
const SCALE_END = 1.5;
const LIFETIME = 3; // seconds

export function Projectile({ id, startPosition, direction = 1, onHit, onExpire }: ProjectileProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const lifeRef = useRef(0);
  const [exploding, setExploding] = useState(false);
  const explodeRef = useRef(0);
  const explodePosRef = useRef(new THREE.Vector3(...startPosition));

  // Check if bark_wave sprites are available
  const hasBarkSprites = useMemo(() => {
    const barkAnim = ANIMATIONS["bark_wave"];
    if (!barkAnim || barkAnim.frames.length === 0) return false;
    // Try to get the first frame texture — if its image is loaded, sprites exist
    const tex = getFrame("bark_wave", 0);
    const img = tex?.image as HTMLImageElement | undefined;
    return !!(img && img.width > 0);
  }, []);

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
    rbRef.current.setLinvel({ x: SPEED * direction, y: 0, z: 0 }, true);

    if (meshRef.current) {
      if (hasBarkSprites) {
        // Animate sprite texture
        const texture = getFrame("bark_wave", lifeRef.current);
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        if (mat.map !== texture) {
          mat.map = texture;
          mat.needsUpdate = true;
        }

        // Scale up over lifetime
        const t = Math.min(lifeRef.current / LIFETIME, 1);
        const scale = SCALE_START + (SCALE_END - SCALE_START) * t;
        meshRef.current.scale.setScalar(scale);
      } else {
        // Fallback: original sphere rotation animation
        meshRef.current.rotation.x += delta * 10;
        meshRef.current.rotation.z += delta * 8;
      }
    }

    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(lifeRef.current * 15) * 1;
    }

    if (lifeRef.current > LIFETIME) {
      onExpire(id);
    }
  });

  const handleCollision = (payload: CollisionPayload) => {
    if (exploding) return;
    const otherName = payload.other.rigidBodyObject?.name || "";

    if (otherName.startsWith("block-")) {
      const pos = rbRef.current?.translation();
      if (pos) explodePosRef.current.set(pos.x, pos.y, pos.z);
      const bp = payload.other.rigidBody?.translation();
      const blockPos = bp ? { x: Math.round(bp.x), y: Math.round(bp.y), z: Math.round(bp.z) } : undefined;
      setExploding(true);
      onHit(id, otherName, blockPos);
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
      {hasBarkSprites ? (
        /* Animated bark wave sprite on a plane */
        <mesh ref={meshRef} castShadow>
          <planeGeometry args={[1, 0.75]} />
          <meshStandardMaterial
            transparent
            alphaTest={0.1}
            emissive="#ffaa00"
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>
      ) : (
        /* Fallback: original glowing sphere */
        <>
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
        </>
      )}
      <pointLight ref={lightRef} color="#FFD700" intensity={2} distance={5} />
    </RigidBody>
  );
}

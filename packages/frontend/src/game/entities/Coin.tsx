import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameState } from "../hooks/useGameState";

interface CoinProps {
  position: [number, number, number];
  onCollect: () => void;
}

// Aspect ratio from moedaDoJogo.png (1072x394)
const COIN_WIDTH = 0.7;
const COIN_HEIGHT = COIN_WIDTH * (394 / 1072); // ~0.257

const textureLoader = new THREE.TextureLoader();
let sharedTexture: THREE.Texture | null = null;

function getCoinTexture(): THREE.Texture {
  if (sharedTexture) return sharedTexture;
  sharedTexture = textureLoader.load("/sprites/coin.png");
  sharedTexture.magFilter = THREE.NearestFilter;
  sharedTexture.minFilter = THREE.NearestFilter;
  sharedTexture.colorSpace = THREE.SRGBColorSpace;
  return sharedTexture;
}

export function Coin({ position, onCollect }: CoinProps) {
  const meshRef = useRef<THREE.Group>(null);
  const collected = useRef(false);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  const texture = useMemo(() => getCoinTexture(), []);

  useFrame((_, delta) => {
    if (useGameState.getState().paused) return;
    if (!meshRef.current || collected.current) return;
    timeRef.current += delta;
    // Spin and bob
    meshRef.current.rotation.y += delta * 3;
    meshRef.current.position.y = Math.sin(timeRef.current * 2) * 0.1;
  });

  const handleCollision = () => {
    if (collected.current) return;
    collected.current = true;
    onCollect();
  };

  if (collected.current) return null;

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      sensor
      name="coin"
      onIntersectionEnter={(payload) => {
        if (payload.other.rigidBodyObject?.name === "mel") {
          handleCollision();
        }
      }}
    >
      <group ref={meshRef}>
        {/* Coin sprite — flat plane with moedaDoJogo texture */}
        <mesh castShadow>
          <planeGeometry args={[COIN_WIDTH, COIN_HEIGHT]} />
          <meshStandardMaterial
            map={texture}
            side={THREE.DoubleSide}
            emissive="#8B0000"
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DroppedCoinProps {
  id: string;
  position: [number, number, number];
  velocity: [number, number];
  playerPosRef: React.RefObject<{ x: number; y: number }>;
  onCollect: (id: string) => void;
  onExpire: (id: string) => void;
}

const LIFETIME = 8;
const COLLECT_RADIUS = 1.2;
const GRAVITY = 15;
const COIN_WIDTH = 0.5;
const COIN_HEIGHT = COIN_WIDTH * (394 / 1072);

const textureLoader = new THREE.TextureLoader();
let sharedTexture: THREE.Texture | null = null;

function getDropCoinTexture(): THREE.Texture {
  if (sharedTexture) return sharedTexture;
  sharedTexture = textureLoader.load("/sprites/coin.png");
  sharedTexture.magFilter = THREE.NearestFilter;
  sharedTexture.minFilter = THREE.NearestFilter;
  sharedTexture.colorSpace = THREE.SRGBColorSpace;
  return sharedTexture;
}

export function DroppedCoin({ id, position, velocity, playerPosRef, onCollect, onExpire }: DroppedCoinProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const collected = useRef(false);
  const lifeRef = useRef(0);
  const posRef = useRef({ x: position[0], y: position[1] });
  const velRef = useRef({ x: velocity[0], y: velocity[1] });
  const texture = useMemo(() => getDropCoinTexture(), []);

  useFrame((_, delta) => {
    if (collected.current || !meshRef.current) return;
    lifeRef.current += delta;

    // Gravity + movement
    velRef.current.y -= GRAVITY * delta;
    posRef.current.x += velRef.current.x * delta;
    posRef.current.y += velRef.current.y * delta;

    meshRef.current.position.set(posRef.current.x, posRef.current.y, 0);
    meshRef.current.rotation.y += delta * 5;

    // Distance-based collection
    const px = playerPosRef.current?.x ?? 0;
    const py = playerPosRef.current?.y ?? 0;
    const dx = posRef.current.x - px;
    const dy = posRef.current.y - py;
    if (dx * dx + dy * dy < COLLECT_RADIUS * COLLECT_RADIUS) {
      collected.current = true;
      onCollect(id);
      return;
    }

    // Blink before expire
    if (lifeRef.current > LIFETIME - 2) {
      meshRef.current.visible = Math.floor(lifeRef.current * 8) % 2 === 0;
    }

    // Expire
    if (lifeRef.current > LIFETIME || posRef.current.y < -10) {
      onExpire(id);
    }
  });

  if (collected.current) return null;

  return (
    <mesh ref={meshRef} position={[position[0], position[1], 0]} castShadow>
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
  );
}

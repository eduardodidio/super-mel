import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export function MenuScene3D() {
  const cubeRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (cubeRef.current) {
      cubeRef.current.rotation.x += delta * 0.5;
      cubeRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <>
      <mesh ref={cubeRef} position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      <mesh position={[3, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} />
      </mesh>

      <mesh position={[-3, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#808080" roughness={0.7} />
      </mesh>

      <mesh position={[0, -3, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#3a7a3a" />
      </mesh>

      <Text
        position={[0, 4, 0]}
        fontSize={1.2}
        color="#ffcc00"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        SUPER MEL 3D
      </Text>
    </>
  );
}

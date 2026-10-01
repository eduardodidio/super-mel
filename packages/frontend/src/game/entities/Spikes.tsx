import { RigidBody } from "@react-three/rapier";

interface SpikesProps {
  position: [number, number, number];
  facing?: "up" | "down" | "left" | "right";
  onDamage: () => void;
}

const FACING_ROTATION: Record<string, [number, number, number]> = {
  up: [0, 0, 0],
  down: [0, 0, Math.PI],
  left: [0, 0, Math.PI / 2],
  right: [0, 0, -Math.PI / 2],
};

/**
 * Single spike pyramid built from stacked voxel boxes.
 * Positioned relative to the base center.
 */
function SpikePyramid({ x }: { x: number }) {
  return (
    <group position={[x, 0.075 + 0.06, 0]}>
      {/* Bottom tier */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.12, 0.15]} />
        <meshStandardMaterial
          color="#666666"
          emissive="#330000"
          emissiveIntensity={0.15}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      {/* Middle tier */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[0.10, 0.12, 0.10]} />
        <meshStandardMaterial
          color="#666666"
          emissive="#330000"
          emissiveIntensity={0.15}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      {/* Top tier */}
      <mesh castShadow position={[0, 0.24, 0]}>
        <boxGeometry args={[0.05, 0.12, 0.05]} />
        <meshStandardMaterial
          color="#666666"
          emissive="#330000"
          emissiveIntensity={0.15}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

export function Spikes({ position, facing = "up", onDamage }: SpikesProps) {
  const rotation = FACING_ROTATION[facing];

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      sensor
      name="spikes"
      onIntersectionEnter={(payload) => {
        if (payload.other.rigidBodyObject?.name === "mel") {
          onDamage();
        }
      }}
    >
      <group rotation={rotation}>
        {/* Dark gray base plate */}
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.15, 0.6]} />
          <meshStandardMaterial color="#444444" roughness={0.8} />
        </mesh>

        {/* 4 spike pyramids evenly distributed along the base */}
        <SpikePyramid x={-0.3} />
        <SpikePyramid x={-0.1} />
        <SpikePyramid x={0.1} />
        <SpikePyramid x={0.3} />
      </group>
    </RigidBody>
  );
}

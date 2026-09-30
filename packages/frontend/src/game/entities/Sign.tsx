import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useGameState } from "../hooks/useGameState";

interface SignProps {
  position: [number, number, number];
  text: string;
  icon?: string;
}

export function Sign({ position, text, icon }: SignProps) {
  const [showBalloon, setShowBalloon] = useState(false);
  const exclamationRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  // Materials
  const postMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6B4226",
        roughness: 0.9,
      }),
    []
  );

  const boardMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#A0522D",
        roughness: 0.8,
      }),
    []
  );

  const exclamationMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#FFD700",
        emissive: "#FFD700",
        emissiveIntensity: 0.4,
        roughness: 0.3,
      }),
    []
  );

  // Pulse the exclamation mark emissive
  useFrame((_, delta) => {
    if (useGameState.getState().paused) return;
    if (!exclamationRef.current) return;
    timeRef.current += delta;
    const mat = exclamationRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 3) * 0.2;
  });

  return (
    <group position={position}>
      {/* Visual signpost (no physics) */}
      {/* Post */}
      <mesh castShadow position={[0, 0.6, 0]} material={postMaterial}>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
      </mesh>
      {/* Board */}
      <mesh castShadow position={[0, 1.25, 0]} material={boardMaterial}>
        <boxGeometry args={[0.8, 0.5, 0.08]} />
      </mesh>
      {/* Exclamation mark on board */}
      <mesh
        ref={exclamationRef}
        castShadow
        position={[0, 1.3, 0.05]}
        material={exclamationMaterial}
      >
        <boxGeometry args={[0.08, 0.2, 0.02]} />
      </mesh>
      {/* Exclamation dot */}
      <mesh castShadow position={[0, 1.14, 0.05]} material={exclamationMaterial}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
      </mesh>

      {/* Proximity sensor (separate RigidBody) */}
      <RigidBody
        type="fixed"
        position={[0, 1, 0]}
        colliders="cuboid"
        sensor
        name="sign-sensor"
        onIntersectionEnter={(payload) => {
          if (payload.other.rigidBodyObject?.name === "mel") {
            setShowBalloon(true);
          }
        }}
        onIntersectionExit={(payload) => {
          if (payload.other.rigidBodyObject?.name === "mel") {
            setShowBalloon(false);
          }
        }}
      >
        {/* Invisible sensor collider: 6 x 4 x 2 (3 blocks radius horiz, 2 blocks vert) */}
        <mesh visible={false}>
          <boxGeometry args={[6, 4, 2]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>

      {/* Text balloon (HTML overlay) */}
      {showBalloon && (
        <Html
          position={[0, 2.2, 0]}
          center
          zIndexRange={[0, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.85)",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "13px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #555",
              maxWidth: "220px",
              textAlign: "center",
              whiteSpace: "pre-wrap",
              lineHeight: "1.4",
              transform: "scale(1)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
              pointerEvents: "none",
            }}
          >
            {icon && (
              <img
                src={icon}
                alt=""
                style={{
                  width: "24px",
                  height: "24px",
                  display: "block",
                  margin: "0 auto 4px",
                  imageRendering: "pixelated",
                }}
              />
            )}
            {text}
          </div>
        </Html>
      )}
    </group>
  );
}

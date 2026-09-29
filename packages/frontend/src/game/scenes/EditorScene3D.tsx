import { useRef, useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BlockType, BackgroundTheme } from "@super-mel/shared";
import { getBlockMaterials } from "../systems/BlockTextures3D";

interface EditorBlock {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
}

interface EditorSceneProps {
  blocks: EditorBlock[];
  currentZ: number;
  selectedTool: Exclude<BlockType, "empty"> | "eraser" | "spawn";
  spawnPoint: { x: number; y: number };
  onPlaceBlock: (x: number, y: number) => void;
  onRemoveBlock: (x: number, y: number) => void;
  onSetSpawn: (x: number, y: number) => void;
  theme: BackgroundTheme;
}

export function EditorScene3D({
  blocks,
  currentZ,
  selectedTool,
  spawnPoint,
  onPlaceBlock,
  onRemoveBlock,
  onSetSpawn,
}: EditorSceneProps) {
  const { camera, raycaster, pointer } = useThree();
  const gridPlaneRef = useRef<THREE.Mesh>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const lastPlaced = useRef<string>("");

  // Camera setup - orthographic-like view
  useFrame(() => {
    // Keep camera looking at grid center
  });

  const getGridPos = useCallback((): { x: number; y: number } | null => {
    if (!gridPlaneRef.current) return null;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(gridPlaneRef.current);
    if (intersects.length === 0) return null;
    const pt = intersects[0].point;
    return { x: Math.round(pt.x), y: Math.round(pt.y) };
  }, [camera, raycaster, pointer]);

  const handleAction = useCallback((pos: { x: number; y: number }) => {
    const key = `${pos.x},${pos.y}`;
    if (key === lastPlaced.current) return;
    lastPlaced.current = key;

    if (selectedTool === "eraser") {
      onRemoveBlock(pos.x, pos.y);
    } else if (selectedTool === "spawn") {
      onSetSpawn(pos.x, pos.y);
    } else {
      onPlaceBlock(pos.x, pos.y);
    }
  }, [selectedTool, onPlaceBlock, onRemoveBlock, onSetSpawn]);

  const onPointerDown = useCallback(() => {
    isDragging.current = true;
    lastPlaced.current = "";
    const pos = getGridPos();
    if (pos) handleAction(pos);
  }, [getGridPos, handleAction]);

  const onPointerMove = useCallback(() => {
    const pos = getGridPos();
    setHoverPos(pos);
    if (isDragging.current && pos) {
      handleAction(pos);
    }
  }, [getGridPos, handleAction]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    lastPlaced.current = "";
  }, []);

  return (
    <>
      {/* Invisible click plane */}
      <mesh
        ref={gridPlaneRef}
        position={[15, 5, 0]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <planeGeometry args={[60, 30]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Grid lines */}
      <EditorGrid />

      {/* Placed blocks */}
      {blocks.map((b) => {
        const isCurrentLayer = b.z === currentZ;
        const materials = getBlockMaterials(b.type);
        return (
          <mesh
            key={`${b.x},${b.y},${b.z}`}
            position={[b.x, b.y, b.z]}
            castShadow={isCurrentLayer}
            receiveShadow={isCurrentLayer}
          >
            <boxGeometry args={[0.95, 0.95, 0.95]} />
            {isCurrentLayer ? (
              <meshStandardMaterial
                color={materials[0].color}
                map={materials[0].map}
                roughness={materials[0].roughness}
                emissive={materials[0].emissive}
                emissiveIntensity={materials[0].emissiveIntensity}
              />
            ) : (
              <meshStandardMaterial
                color={materials[0].color}
                transparent
                opacity={0.3}
                roughness={1}
              />
            )}
          </mesh>
        );
      })}

      {/* Spawn point marker */}
      <group position={[spawnPoint.x, spawnPoint.y, currentZ]}>
        <mesh>
          <boxGeometry args={[0.6, 0.9, 0.6]} />
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
            wireframe
          />
        </mesh>
        {/* Arrow */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>

      {/* Hover preview */}
      {hoverPos && (
        <mesh position={[hoverPos.x, hoverPos.y, currentZ]}>
          <boxGeometry args={[0.98, 0.98, 0.98]} />
          <meshStandardMaterial
            color={selectedTool === "eraser" ? "#ff0000" : selectedTool === "spawn" ? "#00ff00" : "#ffffff"}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}
    </>
  );
}

function EditorGrid() {
  return (
    <gridHelper
      args={[35, 35, "#333355", "#222244"]}
      position={[15, 6, 0.01]}
      rotation={[Math.PI / 2, 0, 0]}
    />
  );
}

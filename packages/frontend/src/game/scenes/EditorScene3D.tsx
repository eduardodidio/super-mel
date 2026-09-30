import { useRef, useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BlockType, BackgroundTheme, EntityData, EntityType, CustomAsset } from "@super-mel/shared";
import type { EditorTool } from "./EditorUI";
import { getBlockMaterials, getCustomBlockMaterials } from "../systems/BlockTextures3D";

interface EditorBlock {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
}

interface EditorSceneProps {
  blocks: EditorBlock[];
  entities: EntityData[];
  currentZ: number;
  selectedTool: EditorTool;
  itemBlockContent: string;
  signText: string;
  spawnPoint: { x: number; y: number };
  onPlaceBlock: (x: number, y: number) => void;
  onRemoveBlock: (x: number, y: number) => void;
  onSetSpawn: (x: number, y: number) => void;
  onPlaceEntity: (entity: EntityData) => void;
  onRemoveEntity: (x: number, y: number) => void;
  theme: BackgroundTheme;
  // Custom assets (Galeria do Rafa)
  customAssets: CustomAsset[];
  selectedCustomAssetId: string | null;
}

// --- Tool classification helpers ---

function isBlockTool(tool: EditorTool): boolean {
  const blockTypes = new Set([
    "stone", "sand", "wood", "iron", "dirt", "brick",
    "glass", "leaf", "water", "lava", "item_block",
    "custom", "custom_block",
  ]);
  return blockTypes.has(tool);
}

function isEntityTool(tool: EditorTool): boolean {
  return tool.startsWith("entity_") || tool === "custom_sign";
}

function entityToolToType(tool: EditorTool): EntityType | null {
  const map: Record<string, EntityType> = {
    entity_coin: "coin",
    entity_heart: "heart",
    entity_item_block: "item_block_content",
    entity_spawn: "spawn",
    entity_checkpoint: "checkpoint",
    entity_goal: "goal",
    entity_bone: "bone",
    entity_sign: "sign",
  };
  return map[tool] ?? null;
}

// --- Entity visual rendering ---

const ENTITY_VISUALS: Record<string, { color: string; emissive: string; shape: "sphere" | "box" | "diamond"; scale: number }> = {
  coin: { color: "#FFD700", emissive: "#FFD700", shape: "sphere", scale: 0.4 },
  heart: { color: "#FF4466", emissive: "#FF4466", shape: "box", scale: 0.35 },
  goal: { color: "#FF8800", emissive: "#FF8800", shape: "diamond", scale: 0.6 },
  checkpoint: { color: "#4488FF", emissive: "#4488FF", shape: "diamond", scale: 0.5 },
  item_block_content: { color: "#FFD700", emissive: "#FFAA00", shape: "sphere", scale: 0.25 },
  sign: { color: "#8B5A2B", emissive: "#8B5A2B", shape: "box", scale: 0.3 },
  bone: { color: "#FFFFFF", emissive: "#CCCCCC", shape: "box", scale: 0.3 },
  enemy: { color: "#FF0000", emissive: "#FF0000", shape: "box", scale: 0.5 },
};

interface EntityMarkerProps {
  entity: EntityData;
  currentZ: number;
}

function EntityMarker({ entity, currentZ }: EntityMarkerProps) {
  const visual = ENTITY_VISUALS[entity.type] ?? { color: "#888", emissive: "#888", shape: "sphere", scale: 0.3 };

  return (
    <group position={[entity.x, entity.y, currentZ]}>
      {visual.shape === "sphere" ? (
        <mesh>
          <sphereGeometry args={[visual.scale, 8, 8]} />
          <meshStandardMaterial
            color={visual.color}
            emissive={visual.emissive}
            emissiveIntensity={0.6}
            transparent
            opacity={0.8}
          />
        </mesh>
      ) : visual.shape === "diamond" ? (
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[visual.scale, visual.scale, visual.scale]} />
          <meshStandardMaterial
            color={visual.color}
            emissive={visual.emissive}
            emissiveIntensity={0.6}
            transparent
            opacity={0.8}
          />
        </mesh>
      ) : (
        <mesh>
          <boxGeometry args={[visual.scale, visual.scale, visual.scale]} />
          <meshStandardMaterial
            color={visual.color}
            emissive={visual.emissive}
            emissiveIntensity={0.6}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}

// --- Hover color helper ---

function getHoverColor(selectedTool: EditorTool): string {
  if (selectedTool === "eraser") return "#ff0000";
  if (selectedTool === "entity_spawn") return "#00ff00";
  if (selectedTool === "entity_coin") return "#FFD700";
  if (selectedTool === "entity_heart") return "#FF4466";
  if (selectedTool === "entity_item_block") return "#FFD700";
  if (selectedTool === "entity_checkpoint") return "#4488FF";
  if (selectedTool === "entity_goal") return "#FF8800";
  if (selectedTool === "entity_bone") return "#F5F5DC";
  if (selectedTool === "entity_sign") return "#A0522D";
  if (selectedTool === "custom_block") return "#CC88FF";
  if (selectedTool === "custom_sign") return "#8B5A2B";
  return "#ffffff";
}

// --- Main component ---

export function EditorScene3D({
  blocks,
  entities,
  currentZ,
  selectedTool,
  itemBlockContent,
  signText,
  spawnPoint,
  onPlaceBlock,
  onRemoveBlock,
  onSetSpawn,
  onPlaceEntity,
  onRemoveEntity,
  customAssets,
  selectedCustomAssetId,
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
      // Eraser removes both blocks and entities at the position
      onRemoveBlock(pos.x, pos.y);
      onRemoveEntity(pos.x, pos.y);
    } else if (selectedTool === "custom_block") {
      // Custom block: handled by onPlaceBlock which places block + entity
      onPlaceBlock(pos.x, pos.y);
    } else if (selectedTool === "custom_sign") {
      // Custom sign: place a sign entity with customAssetId
      if (!selectedCustomAssetId) return;
      const entity: EntityData = {
        type: "sign",
        x: pos.x,
        y: pos.y,
        props: { customAssetId: selectedCustomAssetId },
      };
      onPlaceEntity(entity);
    } else if (isBlockTool(selectedTool)) {
      onPlaceBlock(pos.x, pos.y);
    } else if (isEntityTool(selectedTool)) {
      const entityType = entityToolToType(selectedTool);
      if (!entityType) return;

      // Special case: spawn moves (remove old spawn, place new)
      if (entityType === "spawn") {
        onSetSpawn(pos.x, pos.y);
        return;
      }

      // Build entity data
      const entity: EntityData = { type: entityType, x: pos.x, y: pos.y };

      // Special case: item_block_content includes content prop
      if (entityType === "item_block_content") {
        entity.props = { content: itemBlockContent };
        // Also place an item_block block at the same position
        onPlaceBlock(pos.x, pos.y);
      }

      // Special case: sign entity includes text prop
      if (entityType === "sign") {
        entity.props = { text: signText };
      }

      onPlaceEntity(entity);
    }
  }, [selectedTool, selectedCustomAssetId, itemBlockContent, signText, onPlaceBlock, onRemoveBlock, onSetSpawn, onPlaceEntity, onRemoveEntity]);

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

        // For custom blocks, look up the custom asset texture
        let materials: THREE.MeshStandardMaterial[];
        if (b.type === "custom") {
          const assetEntity = entities.find(
            (e) => e.type === "custom_block_asset" && e.x === b.x && e.y === b.y
          );
          const assetId = assetEntity?.props?.customAssetId as string | undefined;
          const asset = customAssets.find((a) => a.id === assetId);
          materials = asset
            ? getCustomBlockMaterials(asset.dataUri)
            : getBlockMaterials("custom");
        } else {
          materials = getBlockMaterials(b.type);
        }

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

      {/* Entity markers */}
      {entities
        .filter((e) => e.type !== "spawn" && e.type !== "custom_block_asset") // spawn has its own marker, custom_block_asset is invisible
        .map((e, i) => (
          <EntityMarker key={`entity-${e.type}-${e.x}-${e.y}-${i}`} entity={e} currentZ={currentZ} />
        ))}

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
            color={getHoverColor(selectedTool)}
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

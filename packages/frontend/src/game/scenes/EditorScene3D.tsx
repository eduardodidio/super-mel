import { useRef, useState, useCallback, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BlockType, BackgroundTheme, EntityData, EntityType, CustomAsset } from "@super-mel/shared";
import type { EditorTool } from "./EditorUI";
import type { SelectionRect, SelectionMode } from "../editor/useEditorSelection";
import { getBlockMaterials, getCustomBlockMaterials } from "../systems/BlockTextures3D";

// --- Camera constants ---
const CAMERA_PAN_SPEED = 15; // units per second
const ZOOM_SPEED = 2; // Z units per scroll step
const MIN_ZOOM = 8;
const MAX_ZOOM = 50;
const MIDDLE_DRAG_SCALE = 0.003; // pixels to world units factor (multiplied by camera Z)

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
  enemySubtype: string;
  // Custom assets (Galeria do Rafa)
  customAssets: CustomAsset[];
  selectedCustomAssetId: string | null;
  // Camera controls
  cameraPos: { x: number; y: number; z: number };
  onCameraChange: (pos: { x: number; y: number; z: number }) => void;
  levelWidth?: number;
  levelHeight?: number;
  // Hover tracking (F56-T04: test-from-cursor)
  onHoverChange?: (pos: { x: number; y: number } | null) => void;
  // Mechanical element properties (F58)
  movingPlatformDirection?: "horizontal" | "vertical";
  movingPlatformSpeed?: number;
  movingPlatformRange?: number;
  spikesFacing?: "up" | "down" | "left" | "right";
  // Selection system (F57)
  selectionRect: SelectionRect | null;
  selectionMode: SelectionMode;
  ghostBlocks: EditorBlock[] | null;
  ghostEntities: EntityData[] | null;
  onStartSelect: (x: number, y: number) => void;
  onUpdateSelect: (x: number, y: number) => void;
  onEndSelect: () => void;
  onStartMove: (x: number, y: number) => void;
  onUpdateMovePosition: (x: number, y: number) => void;
  onCommitMove: () => void;
  onCancelMove: () => void;
  onDeselect: () => void;
  onPastePositionUpdate?: (x: number, y: number) => void;
  onCommitPaste?: () => void;
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
    entity_enemy: "enemy",
    entity_spring: "spring",
    entity_moving_platform: "moving_platform",
    entity_spikes: "spikes",
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
  spring: { color: "#CC2222", emissive: "#CC2222", shape: "box", scale: 0.4 },
  moving_platform: { color: "#5577AA", emissive: "#5577AA", shape: "box", scale: 0.5 },
  spikes: { color: "#666666", emissive: "#FF4400", shape: "diamond", scale: 0.35 },
};

interface EntityMarkerProps {
  entity: EntityData;
  currentZ: number;
  isSelected?: boolean;
  isBeingMoved?: boolean;
}

function EntityMarker({ entity, currentZ, isSelected, isBeingMoved }: EntityMarkerProps) {
  const visual = ENTITY_VISUALS[entity.type] ?? { color: "#888", emissive: "#888", shape: "sphere", scale: 0.3 };
  const emissiveIntensity = isSelected && !isBeingMoved ? 1.2 : 0.6;
  const emissiveColor = isSelected && !isBeingMoved ? "#00CCFF" : visual.emissive;
  const opacity = isBeingMoved ? 0.3 : 0.8;

  return (
    <group position={[entity.x, entity.y, currentZ]}>
      {visual.shape === "sphere" ? (
        <mesh>
          <sphereGeometry args={[visual.scale, 8, 8]} />
          <meshStandardMaterial
            color={visual.color}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={opacity}
          />
        </mesh>
      ) : visual.shape === "diamond" ? (
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[visual.scale, visual.scale, visual.scale]} />
          <meshStandardMaterial
            color={visual.color}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={opacity}
          />
        </mesh>
      ) : (
        <mesh>
          <boxGeometry args={[visual.scale, visual.scale, visual.scale]} />
          <meshStandardMaterial
            color={visual.color}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={opacity}
          />
        </mesh>
      )}
    </group>
  );
}

// --- Hover color helper ---

function getHoverColor(selectedTool: EditorTool): string {
  if (selectedTool === "select") return "#00CCFF";
  if (selectedTool === "eraser") return "#ff0000";
  if (selectedTool === "entity_spawn") return "#00ff00";
  if (selectedTool === "entity_coin") return "#FFD700";
  if (selectedTool === "entity_heart") return "#FF4466";
  if (selectedTool === "entity_item_block") return "#FFD700";
  if (selectedTool === "entity_checkpoint") return "#4488FF";
  if (selectedTool === "entity_goal") return "#FF8800";
  if (selectedTool === "entity_bone") return "#F5F5DC";
  if (selectedTool === "entity_sign") return "#A0522D";
  if (selectedTool === "entity_enemy") return "#CC2222";
  if (selectedTool === "custom_block") return "#CC88FF";
  if (selectedTool === "custom_sign") return "#8B5A2B";
  if (selectedTool === "entity_spring") return "#CC2222";
  if (selectedTool === "entity_moving_platform") return "#5577AA";
  if (selectedTool === "entity_spikes") return "#FF6600";
  return "#ffffff";
}

// --- Helper: check if active element is an input ---
function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
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
  enemySubtype,
  customAssets,
  selectedCustomAssetId,
  cameraPos,
  onCameraChange,
  levelWidth = 32,
  levelHeight = 16,
  onHoverChange,
  movingPlatformDirection = "horizontal",
  movingPlatformSpeed = 3,
  movingPlatformRange = 4,
  spikesFacing = "up",
  // Selection system (F57)
  selectionRect,
  selectionMode,
  ghostBlocks,
  ghostEntities,
  onStartSelect,
  onUpdateSelect,
  onEndSelect,
  onStartMove,
  onUpdateMovePosition,
  onCommitMove,
  onCancelMove,
  onDeselect,
  onPastePositionUpdate,
  onCommitPaste,
}: EditorSceneProps) {
  const { camera, raycaster, pointer, gl } = useThree();
  const gridPlaneRef = useRef<THREE.Mesh>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const lastPlaced = useRef<string>("");

  // --- Camera control refs ---
  const keysPressed = useRef<Set<string>>(new Set());
  const initialSyncDone = useRef(false);
  const middleButtonDown = useRef(false);
  const lastPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // --- Keyboard listeners for WASD/arrow pan ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // --- Scroll zoom ---
  useEffect(() => {
    const domElement = gl.domElement;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.position.z + direction * ZOOM_SPEED));
      camera.position.z = newZ;
      onCameraChange({ x: camera.position.x, y: camera.position.y, z: newZ });
    };

    domElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      domElement.removeEventListener("wheel", handleWheel);
    };
  }, [camera, gl.domElement, onCameraChange]);

  // --- Middle-click drag pan ---
  useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        middleButtonDown.current = true;
        lastPointerPos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!middleButtonDown.current) return;

      const deltaX = e.clientX - lastPointerPos.current.x;
      const deltaY = e.clientY - lastPointerPos.current.y;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };

      const scale = camera.position.z * MIDDLE_DRAG_SCALE;
      let newX = camera.position.x - deltaX * scale;
      let newY = camera.position.y + deltaY * scale;

      // Clamp
      newX = Math.min(levelWidth, Math.max(0, newX));
      newY = Math.min(levelHeight, Math.max(0, newY));

      camera.position.x = newX;
      camera.position.y = newY;
      onCameraChange({ x: newX, y: newY, z: camera.position.z });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 1) {
        middleButtonDown.current = false;
      }
    };

    domElement.addEventListener("pointerdown", handlePointerDown);
    domElement.addEventListener("pointermove", handlePointerMove);
    domElement.addEventListener("pointerup", handlePointerUp);
    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown);
      domElement.removeEventListener("pointermove", handlePointerMove);
      domElement.removeEventListener("pointerup", handlePointerUp);
    };
  }, [camera, gl.domElement, levelWidth, levelHeight, onCameraChange]);

  // --- Prevent context menu on middle-click ---
  useEffect(() => {
    const domElement = gl.domElement;
    const handleContextMenu = (e: MouseEvent) => {
      // Prevent context menu from middle-click (some browsers)
      if (e.button === 1) {
        e.preventDefault();
      }
    };
    // Also prevent auxclick default (middle-click can trigger auto-scroll icon)
    const handleAuxClick = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    domElement.addEventListener("contextmenu", handleContextMenu);
    domElement.addEventListener("auxclick", handleAuxClick);
    return () => {
      domElement.removeEventListener("contextmenu", handleContextMenu);
      domElement.removeEventListener("auxclick", handleAuxClick);
    };
  }, [gl.domElement]);

  // --- Camera frame loop: initial sync + keyboard pan ---
  useFrame((_, delta) => {
    // Initial sync from prop
    if (!initialSyncDone.current) {
      camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
      initialSyncDone.current = true;
    }

    // Keyboard panning (only when no input is focused)
    if (keysPressed.current.size > 0 && !isInputFocused()) {
      const keys = keysPressed.current;
      let dx = 0;
      let dy = 0;

      if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
      if (keys.has("d") || keys.has("arrowright")) dx += 1;
      if (keys.has("w") || keys.has("arrowup")) dy += 1;
      if (keys.has("s") || keys.has("arrowdown")) dy -= 1;

      if (dx !== 0 || dy !== 0) {
        const speed = CAMERA_PAN_SPEED * delta;
        let newX = camera.position.x + dx * speed;
        let newY = camera.position.y + dy * speed;

        // Clamp
        newX = Math.min(levelWidth, Math.max(0, newX));
        newY = Math.min(levelHeight, Math.max(0, newY));

        camera.position.x = newX;
        camera.position.y = newY;
        onCameraChange({ x: newX, y: newY, z: camera.position.z });
      }
    }
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

      // Special case: enemy entity includes subtype prop
      if (entityType === "enemy") {
        entity.props = { subtype: enemySubtype };
      }

      // Moving platform: attach direction/speed/range props (F58)
      if (entityType === "moving_platform") {
        entity.props = {
          direction: movingPlatformDirection,
          speed: movingPlatformSpeed,
          range: movingPlatformRange,
        };
      }

      // Spikes: attach facing prop (F58)
      if (entityType === "spikes") {
        entity.props = { facing: spikesFacing };
      }

      onPlaceEntity(entity);
    }
  }, [selectedTool, selectedCustomAssetId, itemBlockContent, signText, enemySubtype, movingPlatformDirection, movingPlatformSpeed, movingPlatformRange, spikesFacing, onPlaceBlock, onRemoveBlock, onSetSpawn, onPlaceEntity, onRemoveEntity]);

  const onPointerDown = useCallback(() => {
    const pos = getGridPos();
    if (!pos) return;

    if (selectedTool === "select") {
      // Check if clicking inside existing selection (start move)
      if (selectionRect && selectionMode === "selected" &&
          pos.x >= selectionRect.x1 && pos.x <= selectionRect.x2 &&
          pos.y >= selectionRect.y1 && pos.y <= selectionRect.y2) {
        onStartMove(pos.x, pos.y);
      } else if (selectionMode === "pasting") {
        // Commit paste on click
        onCommitPaste?.();
      } else {
        // Click outside existing selection deselects, then start new
        if (selectionRect && selectionMode === "selected") {
          onDeselect();
        }
        // Start new selection drag
        onStartSelect(pos.x, pos.y);
      }
      return;
    }

    // Existing behavior for other tools
    isDragging.current = true;
    lastPlaced.current = "";
    handleAction(pos);
  }, [getGridPos, handleAction, selectedTool, selectionRect, selectionMode, onStartSelect, onStartMove, onDeselect, onCommitPaste]);

  const onPointerMove = useCallback(() => {
    const pos = getGridPos();
    setHoverPos(pos);
    onHoverChange?.(pos);

    if (selectedTool === "select" && pos) {
      if (selectionMode === "selecting") {
        onUpdateSelect(pos.x, pos.y);
      } else if (selectionMode === "moving") {
        onUpdateMovePosition(pos.x, pos.y);
      } else if (selectionMode === "pasting" && onPastePositionUpdate) {
        onPastePositionUpdate(pos.x, pos.y);
      }
      return;
    }

    // Existing behavior for other tools
    if (isDragging.current && pos) {
      handleAction(pos);
    }
  }, [getGridPos, handleAction, onHoverChange, selectedTool, selectionMode, onUpdateSelect, onUpdateMovePosition, onPastePositionUpdate]);

  const onPointerUp = useCallback(() => {
    if (selectedTool === "select") {
      if (selectionMode === "selecting") {
        onEndSelect();
      } else if (selectionMode === "moving") {
        onCommitMove();
      }
      return;
    }

    // Existing behavior for other tools
    isDragging.current = false;
    lastPlaced.current = "";
  }, [selectedTool, selectionMode, onEndSelect, onCommitMove]);

  return (
    <>
      {/* Invisible click plane */}
      <mesh
        ref={gridPlaneRef}
        position={[levelWidth / 2, levelHeight / 2, 0]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <planeGeometry args={[levelWidth + 20, levelHeight + 20]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Grid lines */}
      <EditorGrid levelWidth={levelWidth} levelHeight={levelHeight} />

      {/* Placed blocks */}
      {blocks.map((b) => {
        const isCurrentLayer = b.z === currentZ;

        // Check if block is within selection rect (F57)
        const isBlockSelected = !!(selectionRect &&
          b.z === currentZ &&
          b.x >= selectionRect.x1 && b.x <= selectionRect.x2 &&
          b.y >= selectionRect.y1 && b.y <= selectionRect.y2);

        // F57-T07: Dim blocks being moved (they are "picked up")
        const isBeingMoved = selectionMode === "moving" && isBlockSelected;

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
            castShadow={isCurrentLayer && !isBeingMoved}
            receiveShadow={isCurrentLayer && !isBeingMoved}
          >
            <boxGeometry args={[0.95, 0.95, 0.95]} />
            {isCurrentLayer ? (
              <meshStandardMaterial
                color={materials[0].color}
                map={materials[0].map}
                roughness={materials[0].roughness}
                emissive={isBlockSelected && !isBeingMoved ? "#00CCFF" : materials[0].emissive}
                emissiveIntensity={isBlockSelected && !isBeingMoved ? 0.4 : materials[0].emissiveIntensity}
                transparent={isBeingMoved}
                opacity={isBeingMoved ? 0.3 : 1}
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
        .map((e, i) => {
          const isEntitySelected = !!(selectionRect &&
            e.x >= selectionRect.x1 && e.x <= selectionRect.x2 &&
            e.y >= selectionRect.y1 && e.y <= selectionRect.y2);
          const isEntityBeingMoved = selectionMode === "moving" && isEntitySelected;
          return (
            <EntityMarker
              key={`entity-${e.type}-${e.x}-${e.y}-${i}`}
              entity={e}
              currentZ={currentZ}
              isSelected={isEntitySelected}
              isBeingMoved={isEntityBeingMoved}
            />
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

      {/* Selection rectangle overlay (F57) */}
      {selectionRect && <SelectionOverlay rect={selectionRect} currentZ={currentZ} />}

      {/* Ghost preview blocks for paste/move (F57) */}
      {ghostBlocks && ghostBlocks.map((b, i) => (
        <mesh key={`ghost-${i}`} position={[b.x, b.y, currentZ]}>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          <meshStandardMaterial
            color="#00CCFF"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      ))}
      {ghostEntities && ghostEntities.map((e, i) => (
        <mesh key={`ghost-entity-${i}`} position={[e.x, e.y, currentZ]}>
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshStandardMaterial
            color="#00CCFF"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      ))}

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

// --- Selection rectangle overlay (F57) ---

function SelectionOverlay({ rect, currentZ }: { rect: SelectionRect; currentZ: number }) {
  const width = rect.x2 - rect.x1 + 1;
  const height = rect.y2 - rect.y1 + 1;
  const centerX = rect.x1 + (width - 1) / 2;
  const centerY = rect.y1 + (height - 1) / 2;
  const lineRef = useRef<THREE.LineSegments>(null);

  // lineDashedMaterial requires computeLineDistances for dashes to render
  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances();
    }
  }, [width, height]);

  return (
    <group position={[centerX, centerY, currentZ + 0.01]}>
      {/* Dashed rectangle outline */}
      <lineSegments ref={lineRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, 0.02)]} />
        <lineDashedMaterial
          color="#00CCFF"
          dashSize={0.3}
          gapSize={0.15}
          linewidth={1}
        />
      </lineSegments>
      {/* Semi-transparent fill */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          color="#00CCFF"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function EditorGrid({ levelWidth, levelHeight }: { levelWidth: number; levelHeight: number }) {
  const gridSize = Math.max(levelWidth, levelHeight) + 5;
  return (
    <gridHelper
      args={[gridSize, gridSize, "#333355", "#222244"]}
      position={[levelWidth / 2, levelHeight / 2, 0.01]}
      rotation={[Math.PI / 2, 0, 0]}
    />
  );
}

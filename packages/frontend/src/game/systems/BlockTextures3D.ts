import * as THREE from "three";
import type { BlockType } from "@super-mel/shared";

interface BlockVisual {
  color: string;
  topColor?: string;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  roughness?: number;
  metalness?: number;
}

const BLOCK_VISUALS: Record<Exclude<BlockType, "empty">, BlockVisual> = {
  stone: { color: "#808080", roughness: 0.9 },
  sand: { color: "#C2B280", roughness: 1 },
  wood: { color: "#8B5A2B", topColor: "#A0724A", roughness: 0.95 },
  iron: { color: "#B0B0B0", roughness: 0.4, metalness: 0.6 },
  dirt: { color: "#6B4226", topColor: "#4a8a3a", roughness: 1 },
  brick: { color: "#B22222", roughness: 0.85 },
  glass: { color: "#ADD8E6", transparent: true, opacity: 0.35, roughness: 0.1 },
  leaf: { color: "#228B22", roughness: 1, transparent: true, opacity: 0.9 },
  water: { color: "#1E90FF", transparent: true, opacity: 0.5, roughness: 0.2, emissive: "#0a2a6a", emissiveIntensity: 0.1 },
  lava: { color: "#FF4500", emissive: "#FF4500", emissiveIntensity: 0.8, roughness: 0.3 },
  item_block: { color: "#FFD700", emissive: "#FFD700", emissiveIntensity: 0.3, roughness: 0.5 },
};

const textureCache = new Map<string, THREE.CanvasTexture>();

function createBlockTexture(type: Exclude<BlockType, "empty">, face: "side" | "top"): THREE.CanvasTexture {
  const key = `${type}-${face}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 16;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const visual = BLOCK_VISUALS[type];
  const baseColor = face === "top" && visual.topColor ? visual.topColor : visual.color;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Pixel noise for minecraft look
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const noise = (Math.random() - 0.5) * 30;
      ctx.fillStyle = `rgba(${noise > 0 ? 255 : 0},${noise > 0 ? 255 : 0},${noise > 0 ? 255 : 0},${Math.abs(noise) / 255})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Type-specific details
  if (type === "brick") {
    ctx.strokeStyle = "#8B1A1A";
    ctx.lineWidth = 1;
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
      const offset = row % 2 === 0 ? 0 : 8;
      ctx.beginPath();
      ctx.moveTo(offset, y);
      ctx.lineTo(offset, y + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(offset + 8, y);
      ctx.lineTo(offset + 8, y + 4);
      ctx.stroke();
    }
  } else if (type === "wood") {
    ctx.strokeStyle = "#6B3A1B";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = 1 + i * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  } else if (type === "iron") {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(2, 2, 4, 4);
    ctx.fillRect(10, 10, 4, 4);
  } else if (type === "item_block") {
    ctx.fillStyle = "#B8860B";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", size / 2, size / 2 + 1);
  }

  // Border for all blocks
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial[]>();

export function getBlockMaterials(type: Exclude<BlockType, "empty">): THREE.MeshStandardMaterial[] {
  if (materialCache.has(type)) return materialCache.get(type)!;

  const visual = BLOCK_VISUALS[type];
  const sideTexture = createBlockTexture(type, "side");
  const topTexture = createBlockTexture(type, "top");

  const baseMat = {
    roughness: visual.roughness ?? 0.8,
    metalness: visual.metalness ?? 0,
    transparent: visual.transparent ?? false,
    opacity: visual.opacity ?? 1,
    emissive: visual.emissive ? new THREE.Color(visual.emissive) : undefined,
    emissiveIntensity: visual.emissiveIntensity ?? 0,
  };

  // [+x, -x, +y, -y, +z, -z]
  const materials = [
    new THREE.MeshStandardMaterial({ map: sideTexture, ...baseMat }),
    new THREE.MeshStandardMaterial({ map: sideTexture, ...baseMat }),
    new THREE.MeshStandardMaterial({ map: topTexture, ...baseMat }),
    new THREE.MeshStandardMaterial({ map: sideTexture, ...baseMat }),
    new THREE.MeshStandardMaterial({ map: sideTexture, ...baseMat }),
    new THREE.MeshStandardMaterial({ map: sideTexture, ...baseMat }),
  ];

  materialCache.set(type, materials);
  return materials;
}

export function getBlockColor(type: Exclude<BlockType, "empty">): string {
  return BLOCK_VISUALS[type].color;
}

export function getBlockVisual(type: Exclude<BlockType, "empty">): BlockVisual {
  return BLOCK_VISUALS[type];
}

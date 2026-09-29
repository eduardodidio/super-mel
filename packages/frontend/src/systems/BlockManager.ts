import Phaser from "phaser";
import { GAME_CONFIG, BlockType, BLOCK_PROPERTIES } from "@super-mel/shared";

const TILE = GAME_CONFIG.tileSize;
const CHUNK_WIDTH = 20; // tiles
const VISIBLE_CHUNKS = 3;

interface ChunkData {
  startX: number;
  blocks: Phaser.Physics.Arcade.Sprite[];
}

export class BlockManager {
  scene: Phaser.Scene;
  solidGroup: Phaser.Physics.Arcade.StaticGroup;
  destructibleGroup: Phaser.Physics.Arcade.StaticGroup;
  dangerGroup: Phaser.Physics.Arcade.StaticGroup;
  itemGroup: Phaser.Physics.Arcade.StaticGroup;

  private chunks: ChunkData[] = [];
  private lastChunkIndex = -1;
  private readonly heightTiles: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.solidGroup = scene.physics.add.staticGroup();
    this.destructibleGroup = scene.physics.add.staticGroup();
    this.dangerGroup = scene.physics.add.staticGroup();
    this.itemGroup = scene.physics.add.staticGroup();
    this.heightTiles = Math.floor(scene.scale.height / TILE);
  }

  generateInitialChunks() {
    for (let i = 0; i < VISIBLE_CHUNKS + 1; i++) {
      this.generateChunk(i);
    }
  }

  update(playerX: number) {
    const currentChunk = Math.floor(playerX / (CHUNK_WIDTH * TILE));

    // Generate new chunks ahead
    while (this.lastChunkIndex < currentChunk + VISIBLE_CHUNKS) {
      this.lastChunkIndex++;
      this.generateChunk(this.lastChunkIndex);
    }

    // Remove old chunks behind
    this.chunks = this.chunks.filter((chunk) => {
      if (chunk.startX + CHUNK_WIDTH * TILE < playerX - 400) {
        chunk.blocks.forEach((b) => b.destroy());
        return false;
      }
      return true;
    });
  }

  destroyBlock(block: Phaser.Physics.Arcade.Sprite) {
    // Particle effect
    const particles = this.scene.add.particles(block.x, block.y, undefined, {
      speed: { min: 30, max: 80 },
      lifespan: 400,
      quantity: 6,
      scale: { start: 0.3, end: 0 },
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(500, () => particles.destroy());

    // Chance to drop heart
    const blockType = block.getData("blockType") as BlockType;
    if (blockType === "item_block" || Math.random() < 0.15) {
      this.spawnItem(block.x, block.y, "heart");
    }

    block.destroy();
  }

  private spawnItem(x: number, y: number, type: string) {
    const item = this.itemGroup.create(x, y, "item-heart") as Phaser.Physics.Arcade.Sprite;
    item.setData("itemType", type);
    item.setDepth(5);

    // Float animation
    this.scene.tweens.add({
      targets: item,
      y: y - 10,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private generateChunk(chunkIndex: number) {
    const startX = chunkIndex * CHUNK_WIDTH * TILE;
    const blocks: Phaser.Physics.Arcade.Sprite[] = [];

    // Floor
    for (let x = 0; x < CHUNK_WIDTH; x++) {
      const worldX = startX + x * TILE;
      blocks.push(this.createBlock(worldX, (this.heightTiles - 1) * TILE, "stone"));
      blocks.push(this.createBlock(worldX, (this.heightTiles - 2) * TILE, "dirt"));
    }

    // Skip obstacles on first chunk (safe start)
    if (chunkIndex <= 0) {
      this.chunks.push({ startX, blocks });
      return;
    }

    // Random obstacles
    const obstacleCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < obstacleCount; i++) {
      const ox = startX + (3 + Math.floor(Math.random() * (CHUNK_WIDTH - 6))) * TILE;
      const pattern = Math.random();

      if (pattern < 0.3) {
        // Wall with gap
        const gapStart = 3 + Math.floor(Math.random() * 4);
        const gapSize = 4;
        for (let y = 2; y < this.heightTiles - 2; y++) {
          if (y >= gapStart && y < gapStart + gapSize) continue;
          const type = Math.random() < 0.4 ? "wood" : "stone";
          blocks.push(this.createBlock(ox, y * TILE, type));
        }
      } else if (pattern < 0.55) {
        // Platform with items
        const py = 4 + Math.floor(Math.random() * 6);
        const len = 3 + Math.floor(Math.random() * 3);
        for (let x = 0; x < len; x++) {
          blocks.push(this.createBlock(ox + x * TILE, py * TILE, "leaf"));
        }
        // Item block on platform
        if (Math.random() < 0.5) {
          blocks.push(this.createBlock(ox + Math.floor(len / 2) * TILE, (py - 1) * TILE, "item_block"));
        }
      } else if (pattern < 0.7) {
        // Lava pit
        const lavaWidth = 2 + Math.floor(Math.random() * 3);
        for (let x = 0; x < lavaWidth; x++) {
          // Remove floor blocks would be complex, so place lava on top
          blocks.push(this.createBlock(ox + x * TILE, (this.heightTiles - 3) * TILE, "lava"));
        }
      } else if (pattern < 0.85) {
        // Destructible wall
        const wallHeight = 3 + Math.floor(Math.random() * 3);
        for (let y = 0; y < wallHeight; y++) {
          const type = Math.random() < 0.6 ? "wood" : "glass";
          blocks.push(this.createBlock(ox, (this.heightTiles - 3 - y) * TILE, type));
        }
      } else {
        // Iron fortress (indestructible)
        for (let y = 0; y < 3; y++) {
          blocks.push(this.createBlock(ox, (this.heightTiles - 3 - y) * TILE, "iron"));
          blocks.push(this.createBlock(ox + TILE, (this.heightTiles - 3 - y) * TILE, "iron"));
        }
      }
    }

    // Random heart item in the air
    if (Math.random() < 0.3) {
      const ix = startX + (5 + Math.floor(Math.random() * 10)) * TILE;
      const iy = (3 + Math.floor(Math.random() * 5)) * TILE;
      this.spawnItem(ix, iy, "heart");
    }

    this.chunks.push({ startX, blocks });
  }

  private createBlock(x: number, y: number, type: Exclude<BlockType, "empty">): Phaser.Physics.Arcade.Sprite {
    const props = BLOCK_PROPERTIES[type];
    let group: Phaser.Physics.Arcade.StaticGroup;

    if (props.dangerous) {
      group = this.dangerGroup;
    } else if (props.destructible) {
      group = this.destructibleGroup;
    } else if (props.solid || props.platform) {
      group = this.solidGroup;
    } else {
      // Decorative - use solid group but no collision
      group = this.solidGroup;
    }

    const block = group.create(x + TILE / 2, y + TILE / 2, `block-${type}`) as Phaser.Physics.Arcade.Sprite;
    block.setData("blockType", type);
    block.setDepth(2);

    return block;
  }
}

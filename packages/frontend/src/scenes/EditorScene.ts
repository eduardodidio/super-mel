import Phaser from "phaser";
import { BlockType, BLOCK_PROPERTIES, GAME_CONFIG, LevelData, BackgroundTheme } from "@super-mel/shared";

const TILE = GAME_CONFIG.tileSize;
const GRID_COLS = 60;
const GRID_ROWS = 18;
const PALETTE_WIDTH = 140;

const PLACEABLE_BLOCKS: { type: Exclude<BlockType, "empty">; label: string }[] = [
  { type: "stone", label: "Pedra" },
  { type: "dirt", label: "Terra" },
  { type: "sand", label: "Areia" },
  { type: "wood", label: "Madeira" },
  { type: "iron", label: "Ferro" },
  { type: "brick", label: "Tijolo" },
  { type: "glass", label: "Vidro" },
  { type: "leaf", label: "Folha" },
  { type: "water", label: "Agua" },
  { type: "lava", label: "Lava" },
  { type: "item_block", label: "Item ?" },
];

export class EditorScene extends Phaser.Scene {
  private grid: (BlockType)[][] = [];
  private blockSprites: (Phaser.GameObjects.Sprite | null)[][] = [];
  private selectedBlock: Exclude<BlockType, "empty"> = "stone";
  private paletteItems: Phaser.GameObjects.Container[] = [];
  private isDragging = false;
  private isErasing = false;
  private gridContainer!: Phaser.GameObjects.Container;
  private cameraOffsetX = 0;
  private background: BackgroundTheme = "forest";
  private levelName = "Minha Fase";
  private spawnMarker!: Phaser.GameObjects.Sprite;

  constructor() {
    super({ key: "EditorScene" });
  }

  init(data?: { levelData?: LevelData; levelName?: string; levelId?: string }) {
    this.grid = [];
    this.blockSprites = [];
    this.cameraOffsetX = 0;

    // Initialize empty grid
    for (let y = 0; y < GRID_ROWS; y++) {
      this.grid[y] = [];
      this.blockSprites[y] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        this.grid[y][x] = "empty";
        this.blockSprites[y][x] = null;
      }
    }

    // Load existing level if provided
    if (data?.levelData) {
      this.loadLevelData(data.levelData);
      this.levelName = data.levelName || this.levelName;
    } else {
      // Default floor
      for (let x = 0; x < GRID_COLS; x++) {
        this.grid[GRID_ROWS - 1][x] = "stone";
        this.grid[GRID_ROWS - 2][x] = "dirt";
      }
    }
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e).setDepth(-10);

    // Grid container (scrollable)
    this.gridContainer = this.add.container(PALETTE_WIDTH, 0);

    // Draw grid lines
    this.drawGridLines();

    // Render initial blocks
    this.renderAllBlocks();

    // Spawn marker
    this.spawnMarker = this.add.sprite(
      PALETTE_WIDTH + 3 * TILE + TILE / 2,
      (GRID_ROWS - 3) * TILE + TILE / 2,
      "mel-idle",
    ).setDepth(20).setAlpha(0.7);

    // Palette (left sidebar)
    this.createPalette();

    // Top toolbar
    this.createToolbar();

    // Input handling
    this.setupInput();

    // Camera scroll with arrow keys
    const cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        this.cameraOffsetX = Math.max(0, this.cameraOffsetX - TILE * 3);
        this.updateGridPosition();
      } else if (event.key === "ArrowRight") {
        this.cameraOffsetX = Math.min(
          (GRID_COLS - Math.floor((width - PALETTE_WIDTH) / TILE)) * TILE,
          this.cameraOffsetX + TILE * 3,
        );
        this.updateGridPosition();
      }
    });
  }

  private drawGridLines() {
    const { width, height } = this.scale;
    const gridWidth = GRID_COLS * TILE;
    const gridHeight = GRID_ROWS * TILE;

    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333355, 0.3);

    for (let x = 0; x <= GRID_COLS; x++) {
      graphics.moveTo(x * TILE, 0);
      graphics.lineTo(x * TILE, gridHeight);
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      graphics.moveTo(0, y * TILE);
      graphics.lineTo(gridWidth, y * TILE);
    }
    graphics.strokePath();
    this.gridContainer.add(graphics);
  }

  private createPalette() {
    const { height } = this.scale;

    // Palette background
    this.add.rectangle(PALETTE_WIDTH / 2, height / 2, PALETTE_WIDTH, height, 0x222244).setDepth(50);
    this.add.text(PALETTE_WIDTH / 2, 50, "BLOCOS", {
      fontSize: "14px",
      color: "#ffcc00",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(51);

    // Eraser
    const eraserY = 75;
    const eraser = this.createPaletteItem(PALETTE_WIDTH / 2, eraserY, "empty", "Apagar", 51);
    eraser.on("pointerdown", () => {
      this.isErasing = true;
      this.selectedBlock = "stone"; // doesn't matter when erasing
      this.updatePaletteSelection(null);
    });

    // Block items
    PLACEABLE_BLOCKS.forEach((block, i) => {
      const y = 105 + i * 36;
      const item = this.createPaletteItem(PALETTE_WIDTH / 2, y, block.type, block.label, 51);
      item.on("pointerdown", () => {
        this.isErasing = false;
        this.selectedBlock = block.type;
        this.updatePaletteSelection(block.type);
      });
      this.paletteItems.push(item);
    });

    // Scroll hint
    this.add.text(PALETTE_WIDTH / 2, height - 30, "← → scroll", {
      fontSize: "10px",
      color: "#666688",
    }).setOrigin(0.5).setDepth(51);
  }

  private createPaletteItem(
    x: number,
    y: number,
    type: string,
    label: string,
    depth: number,
  ): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, PALETTE_WIDTH - 10, 32, 0x3a3a5a)
      .setInteractive({ useHandCursor: true });
    const icon = type === "empty"
      ? this.add.text(-45, 0, "✕", { fontSize: "18px", color: "#ff4444" }).setOrigin(0.5)
      : this.add.sprite(-45, 0, `block-${type}`).setDisplaySize(24, 24);
    const text = this.add.text(-25, 0, label, {
      fontSize: "11px",
      color: "#cccccc",
    }).setOrigin(0, 0.5);

    const container = this.add.container(x, y, [bg, icon, text]);
    container.setSize(PALETTE_WIDTH - 10, 32);
    container.setDepth(depth);

    bg.on("pointerover", () => bg.setFillStyle(0x5a5a7a));
    bg.on("pointerout", () => bg.setFillStyle(
      !this.isErasing && this.selectedBlock === type ? 0x6a6a9a : 0x3a3a5a,
    ));

    return container;
  }

  private updatePaletteSelection(selected: string | null) {
    // Visual feedback - highlight selected palette item
    this.paletteItems.forEach((item) => {
      const bg = item.list[0] as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x3a3a5a);
    });
  }

  private createToolbar() {
    const { width } = this.scale;
    const toolbarY = 15;
    const btnStyle = { fontSize: "13px", color: "#ffffff", backgroundColor: "#4a4a8a", padding: { x: 10, y: 5 } };

    // Test button
    const testBtn = this.add.text(PALETTE_WIDTH + 10, toolbarY, "TESTAR", btnStyle)
      .setInteractive({ useHandCursor: true }).setDepth(60);
    testBtn.on("pointerdown", () => this.testLevel());

    // Save button
    const saveBtn = this.add.text(PALETTE_WIDTH + 90, toolbarY, "SALVAR", btnStyle)
      .setInteractive({ useHandCursor: true }).setDepth(60);
    saveBtn.on("pointerdown", () => this.saveLevel());

    // Clear button
    const clearBtn = this.add.text(PALETTE_WIDTH + 170, toolbarY, "LIMPAR", {
      ...btnStyle, backgroundColor: "#8a4a4a",
    }).setInteractive({ useHandCursor: true }).setDepth(60);
    clearBtn.on("pointerdown", () => this.clearGrid());

    // Background selector
    const bgBtn = this.add.text(PALETTE_WIDTH + 260, toolbarY, "BG: " + this.background, btnStyle)
      .setInteractive({ useHandCursor: true }).setDepth(60);
    bgBtn.on("pointerdown", () => {
      const themes: BackgroundTheme[] = ["forest", "desert", "night", "space", "ocean"];
      const idx = themes.indexOf(this.background);
      this.background = themes[(idx + 1) % themes.length];
      bgBtn.setText("BG: " + this.background);
    });

    // Back to menu
    const backBtn = this.add.text(width - 80, toolbarY, "MENU", {
      ...btnStyle, backgroundColor: "#6a4a4a",
    }).setInteractive({ useHandCursor: true }).setDepth(60);
    backBtn.on("pointerdown", () => this.scene.start("MenuScene"));
  }

  private setupInput() {
    const { width, height } = this.scale;

    // Click/drag to place blocks on grid
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < PALETTE_WIDTH || pointer.y < 40) return;
      this.isDragging = true;
      this.placeBlockAtPointer(pointer);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      if (pointer.x < PALETTE_WIDTH || pointer.y < 40) return;
      this.placeBlockAtPointer(pointer);
    });

    this.input.on("pointerup", () => {
      this.isDragging = false;
    });

    // Mouse wheel to scroll
    this.input.on("wheel", (_pointer: any, _gos: any, _dx: number, dy: number) => {
      this.cameraOffsetX = Phaser.Math.Clamp(
        this.cameraOffsetX + dy * 2,
        0,
        Math.max(0, (GRID_COLS * TILE) - (width - PALETTE_WIDTH)),
      );
      this.updateGridPosition();
    });
  }

  private placeBlockAtPointer(pointer: Phaser.Input.Pointer) {
    const gridX = Math.floor((pointer.x - PALETTE_WIDTH + this.cameraOffsetX) / TILE);
    const gridY = Math.floor(pointer.y / TILE);

    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return;

    if (this.isErasing) {
      this.setBlock(gridX, gridY, "empty");
    } else {
      this.setBlock(gridX, gridY, this.selectedBlock);
    }
  }

  private setBlock(x: number, y: number, type: BlockType) {
    if (this.grid[y][x] === type) return;

    this.grid[y][x] = type;

    // Remove old sprite
    const old = this.blockSprites[y][x];
    if (old) {
      old.destroy();
      this.blockSprites[y][x] = null;
    }

    // Create new sprite
    if (type !== "empty") {
      const sprite = this.add.sprite(
        x * TILE + TILE / 2,
        y * TILE + TILE / 2,
        `block-${type}`,
      ).setDepth(5);
      this.gridContainer.add(sprite);
      this.blockSprites[y][x] = sprite;
    }
  }

  private renderAllBlocks() {
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const type = this.grid[y][x];
        if (type !== "empty") {
          const sprite = this.add.sprite(
            x * TILE + TILE / 2,
            y * TILE + TILE / 2,
            `block-${type}`,
          ).setDepth(5);
          this.gridContainer.add(sprite);
          this.blockSprites[y][x] = sprite;
        }
      }
    }
  }

  private updateGridPosition() {
    this.gridContainer.x = PALETTE_WIDTH - this.cameraOffsetX;
    this.spawnMarker.x = PALETTE_WIDTH - this.cameraOffsetX + 3 * TILE + TILE / 2;
  }

  private clearGrid() {
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        this.setBlock(x, y, "empty");
      }
    }
    // Re-add default floor
    for (let x = 0; x < GRID_COLS; x++) {
      this.setBlock(x, GRID_ROWS - 1, "stone");
      this.setBlock(x, GRID_ROWS - 2, "dirt");
    }
  }

  private buildLevelData(): LevelData {
    const cells: { type: BlockType; x: number; y: number }[] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (this.grid[y][x] !== "empty") {
          cells.push({ type: this.grid[y][x], x, y });
        }
      }
    }
    return {
      grid: [cells] as any,
      width: GRID_COLS,
      height: GRID_ROWS,
      spawnPoint: { x: 3, y: GRID_ROWS - 3 },
    };
  }

  private loadLevelData(data: LevelData) {
    if (Array.isArray(data.grid) && data.grid.length > 0) {
      // Flat array of cells
      const cells = (data.grid as any).flat();
      for (const cell of cells) {
        if (cell.x >= 0 && cell.x < GRID_COLS && cell.y >= 0 && cell.y < GRID_ROWS) {
          this.grid[cell.y][cell.x] = cell.type;
        }
      }
    }
  }

  private testLevel() {
    const levelData = this.buildLevelData();
    this.scene.start("GameScene", { customLevel: levelData, background: this.background });
  }

  private async saveLevel() {
    const playerId = localStorage.getItem("supermel_player_id");
    if (!playerId) {
      this.showToast("Faca login para salvar!");
      return;
    }

    const levelData = this.buildLevelData();

    try {
      const res = await fetch("/api/levels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("supermel_token") || ""}`,
        },
        body: JSON.stringify({
          creatorId: playerId,
          name: this.levelName,
          data: levelData,
          background: this.background,
        }),
      });

      if (res.ok) {
        this.showToast("Fase salva!");
      } else {
        this.showToast("Erro ao salvar");
      }
    } catch {
      this.showToast("Servidor offline");
    }
  }

  private showToast(message: string) {
    const { width } = this.scale;
    const toast = this.add.text(width / 2, 50, message, {
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#333366",
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: 30,
      delay: 1500,
      duration: 500,
      onComplete: () => toast.destroy(),
    });
  }
}

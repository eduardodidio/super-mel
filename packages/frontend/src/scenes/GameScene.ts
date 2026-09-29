import Phaser from "phaser";
import { GAME_CONFIG, BLOCK_PROPERTIES, BlockType } from "@super-mel/shared";
import { Player } from "../systems/Player";
import { BlockManager } from "../systems/BlockManager";
import { ParallaxBackground } from "../systems/ParallaxBackground";
import { HUD } from "../systems/HUD";
import { AudioManager } from "../systems/AudioManager";
import { ProjectileManager } from "../systems/ProjectileManager";

export class GameScene extends Phaser.Scene {
  player!: Player;
  blockManager!: BlockManager;
  parallax!: ParallaxBackground;
  hud!: HUD;
  audio!: AudioManager;
  projectiles!: ProjectileManager;

  distance = 0;
  scrollSpeed = GAME_CONFIG.scrollSpeed;
  isGameOver = false;

  constructor() {
    super({ key: "GameScene" });
  }

  init() {
    this.distance = 0;
    this.isGameOver = false;
    this.scrollSpeed = GAME_CONFIG.scrollSpeed;
  }

  create() {
    const { width, height } = this.scale;

    // Systems init
    this.parallax = new ParallaxBackground(this);
    this.blockManager = new BlockManager(this);
    this.player = new Player(this, 150, height / 2);
    this.projectiles = new ProjectileManager(this);
    this.hud = new HUD(this);
    this.audio = new AudioManager(this);

    // Generate initial terrain
    this.blockManager.generateInitialChunks();

    // Camera follows player X but not Y
    this.cameras.main.startFollow(this.player.sprite, false, 1, 0);
    this.cameras.main.setFollowOffset(-width / 3, 0);

    // Input - flap
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver) return;
      // Left half = fly, right half = shoot
      if (pointer.x < width / 2) {
        this.player.flap();
      } else {
        this.shootProjectile();
      }
    });

    // Keyboard controls
    const cursors = this.input.keyboard!.createCursorKeys();
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const zKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    spaceKey.on("down", () => {
      if (!this.isGameOver) this.player.flap();
    });
    cursors.up.on("down", () => {
      if (!this.isGameOver) this.player.flap();
    });
    zKey.on("down", () => {
      if (!this.isGameOver) this.shootProjectile();
    });

    // Collisions
    this.physics.add.collider(
      this.player.sprite,
      this.blockManager.solidGroup,
      (_player, block) => this.onPlayerHitBlock(block as Phaser.Physics.Arcade.Sprite),
    );

    this.physics.add.overlap(
      this.player.sprite,
      this.blockManager.dangerGroup,
      () => this.onPlayerDamage(),
    );

    this.physics.add.overlap(
      this.player.sprite,
      this.blockManager.itemGroup,
      (_player, item) => this.onCollectItem(item as Phaser.Physics.Arcade.Sprite),
    );

    this.physics.add.collider(
      this.projectiles.group,
      this.blockManager.destructibleGroup,
      (proj, block) => this.onProjectileHitBlock(
        proj as Phaser.Physics.Arcade.Sprite,
        block as Phaser.Physics.Arcade.Sprite,
      ),
    );

    this.audio.playMusic();
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    // Auto scroll - move player forward
    this.player.sprite.setVelocityX(this.scrollSpeed);

    // Update distance
    this.distance = Math.floor(this.player.sprite.x / GAME_CONFIG.tileSize);

    // Update systems
    this.player.update(time, delta);
    this.blockManager.update(this.player.sprite.x);
    this.parallax.update(this.cameras.main.scrollX);
    this.hud.update(this.player.hearts, this.distance);
    this.projectiles.update();

    // Out of bounds (fell off screen)
    if (this.player.sprite.y > this.scale.height + 100) {
      this.triggerGameOver();
    }
  }

  private shootProjectile() {
    this.projectiles.fire(this.player.sprite.x + 20, this.player.sprite.y);
    this.audio.playSFX("shoot");
  }

  private onPlayerHitBlock(block: Phaser.Physics.Arcade.Sprite) {
    // Normal collision handled by physics
  }

  private onPlayerDamage() {
    if (this.player.isInvincible) return;
    this.player.takeDamage();
    this.audio.playSFX("damage");
    this.cameras.main.shake(100, 0.01);

    if (this.player.hearts <= 0) {
      this.triggerGameOver();
    }
  }

  private onCollectItem(item: Phaser.Physics.Arcade.Sprite) {
    const itemType = item.getData("itemType") as string;
    if (itemType === "heart") {
      this.player.heal();
      this.audio.playSFX("collect");
    }
    item.destroy();
  }

  private onProjectileHitBlock(
    projectile: Phaser.Physics.Arcade.Sprite,
    block: Phaser.Physics.Arcade.Sprite,
  ) {
    projectile.destroy();
    this.blockManager.destroyBlock(block);
    this.audio.playSFX("destroy");
  }

  private triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.audio.playSFX("gameover");
    this.audio.stopMusic();
    this.player.die();

    this.time.delayedCall(1500, () => {
      this.scene.start("GameOverScene", { distance: this.distance });
    });
  }
}

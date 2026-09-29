import Phaser from "phaser";

/**
 * Audio manager with slots for custom music and SFX.
 * All audio files are provided by the user - this system
 * handles loading, playback, and volume control.
 *
 * For now, uses placeholder (silent) since user will provide files.
 * Drop audio files in public/audio/ and update the AUDIO_FILES map.
 */

const SFX_KEYS = ["shoot", "damage", "collect", "destroy", "gameover", "flap"] as const;
type SFXKey = (typeof SFX_KEYS)[number];

export class AudioManager {
  private scene: Phaser.Scene;
  private music: Phaser.Sound.BaseSound | null = null;
  private sfx: Map<string, Phaser.Sound.BaseSound> = new Map();
  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private muted = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Load SFX if available
    for (const key of SFX_KEYS) {
      if (scene.cache.audio.exists(`sfx-${key}`)) {
        this.sfx.set(key, scene.sound.add(`sfx-${key}`, { volume: this.sfxVolume }));
      }
    }
  }

  playMusic() {
    if (this.muted) return;
    if (this.scene.cache.audio.exists("music-bg")) {
      this.music = this.scene.sound.add("music-bg", {
        volume: this.musicVolume,
        loop: true,
      });
      this.music.play();
    }
  }

  stopMusic() {
    this.music?.stop();
  }

  playSFX(key: SFXKey) {
    if (this.muted) return;
    const sound = this.sfx.get(key);
    if (sound) {
      sound.play();
    }
  }

  setMusicVolume(vol: number) {
    this.musicVolume = Phaser.Math.Clamp(vol, 0, 1);
  }

  setSFXVolume(vol: number) {
    this.sfxVolume = Phaser.Math.Clamp(vol, 0, 1);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.music?.pause();
    } else {
      this.music?.resume();
    }
    return this.muted;
  }
}

// AnimationStateMachine.ts — Pure TypeScript state machine for Mel's animations
// No React dependencies. Instantiate with `new AnimationStateMachine()`.

export type AnimState =
  | "idle"
  | "walk"
  | "run"
  | "jump_rise"
  | "jump_air"
  | "jump_fall"
  | "jump_land"
  | "attack_prep"
  | "attack_1"
  | "attack_2"
  | "attack_end"
  | "hurt_light"
  | "hurt_medium"
  | "hurt_heavy"
  | "death"
  | "sit"
  | "lie_down"
  | "crouch"
  | "look_up"
  | "fly"
  | "wait"
  | "affection";

export interface AnimInput {
  velX: number;
  velY: number;
  grounded: boolean;
  attackPressed: boolean;
  damaged: boolean;
  damageLevel: 0 | 1 | 2 | 3;
  dead: boolean;
  idleTime: number;
  crouching: boolean;
  lookingUp: boolean;
  flying: boolean;
  lookUpTime: number;
  heartCollected: boolean;
}

// Duration map for one-shot states (seconds).
// When stateTime exceeds this duration the state auto-transitions.
const ONE_SHOT_DURATIONS: Partial<Record<AnimState, number>> = {
  hurt_light: 0.25,
  hurt_medium: 0.4,
  hurt_heavy: 0.6,
  attack_prep: 0.12,
  attack_1: 0.08,
  attack_2: 0.17,
  attack_end: 0.17,
  jump_land: 0.15,
  affection: 0.6,
};

// Maps one-shot states to their default next state.
const ONE_SHOT_NEXT: Partial<Record<AnimState, AnimState>> = {
  hurt_light: "idle",
  hurt_medium: "idle",
  // hurt_heavy handled specially (may go to death)
  attack_prep: "attack_1",
  attack_1: "attack_2",
  attack_2: "attack_end",
  attack_end: "idle",
  jump_land: "idle",
  affection: "idle",
};

// States that cannot be interrupted by lower-priority input.
const NON_INTERRUPTIBLE: Set<AnimState> = new Set([
  "hurt_light",
  "hurt_medium",
  "hurt_heavy",
  "attack_prep",
  "attack_1",
  "attack_2",
  "attack_end",
  "death",
  "affection",
]);

// Maps AnimState to the animation name used by SpriteAnimator.
const ANIM_NAME_MAP: Record<AnimState, string> = {
  idle: "idle",
  walk: "walk",
  run: "run",
  jump_rise: "jump",
  jump_air: "jump",
  jump_fall: "fall",
  jump_land: "land",
  attack_prep: "attack",
  attack_1: "attack",
  attack_2: "attack",
  attack_end: "attack",
  hurt_light: "hurt",
  hurt_medium: "hurt",
  hurt_heavy: "hurt_heavy",
  death: "death",
  sit: "sit",
  lie_down: "lie_down",
  crouch: "crouch",
  look_up: "look_up",
  fly: "fly",
  wait: "wait",
  affection: "affection",
};

export class AnimationStateMachine {
  state: AnimState = "idle";
  stateTime: number = 0;
  facing: "left" | "right" = "right";

  // ---- Public API ----

  /**
   * Main update — call once per frame.
   * Returns the (possibly new) current state.
   */
  update(input: AnimInput, delta: number): AnimState {
    this.stateTime += delta;

    // Update facing from horizontal velocity
    if (input.velX > 0.1) this.facing = "right";
    else if (input.velX < -0.1) this.facing = "left";

    // --- Priority 1: Death (terminal) ---
    if (input.dead && this.state !== "death") {
      this.transition("death");
      return this.state;
    }
    if (this.state === "death") {
      return this.state; // never exits
    }

    // --- Priority 2: Damage ---
    if (input.damaged && !this.isHurt()) {
      const hurtState = this.damageToHurtState(input.damageLevel);
      this.transition(hurtState);
      return this.state;
    }

    // --- Priority 2.5: Affection (heart collected, one-shot) ---
    if (input.heartCollected && !NON_INTERRUPTIBLE.has(this.state)) {
      this.transition("affection");
      return this.state;
    }

    // --- Handle one-shot state auto-transitions ---
    if (this.isOneShot() && this.isOneShotFinished()) {
      const next = this.getOneShotNext(input);
      this.transition(next);
      // Fall through so movement logic can immediately override if applicable
      // (e.g. jump_land finishing should pick up walk/run)
    }

    // --- Non-interruptible states: wait for them to finish ---
    if (NON_INTERRUPTIBLE.has(this.state)) {
      return this.state;
    }

    // --- Priority 3: Attack ---
    if (input.attackPressed && this.canStartAttack()) {
      this.transition("attack_prep");
      return this.state;
    }

    // --- Priority 4: Jump states (airborne) ---
    if (!input.grounded) {
      // If flying and airborne, stay in fly state
      if (input.flying) {
        this.transitionIfDifferent("fly");
        return this.state;
      }
      if (input.velY > 1) {
        this.transitionIfDifferent("jump_rise");
      } else if (input.velY < -1) {
        this.transitionIfDifferent("jump_fall");
      } else {
        this.transitionIfDifferent("jump_air");
      }
      return this.state;
    }

    // --- Priority 5: Just landed ---
    if (this.isJumpState() && input.grounded) {
      this.transition("jump_land");
      return this.state;
    }

    // --- Priority 6: Run ---
    if (Math.abs(input.velX) > 4) {
      this.transitionIfDifferent("run");
      return this.state;
    }

    // --- Priority 7: Walk ---
    if (Math.abs(input.velX) > 0.5) {
      this.transitionIfDifferent("walk");
      return this.state;
    }

    // --- Priority 7.5: Crouch (grounded + holding down) ---
    if (input.crouching && input.grounded) {
      this.transitionIfDifferent("crouch");
      return this.state;
    }

    // --- Priority 7.6: Look up (grounded + holding up + not moving) ---
    if (input.lookingUp && input.grounded && Math.abs(input.velX) < 0.5) {
      // --- Priority 7.7: Wait (looking up for >3s) ---
      if (input.lookUpTime > 3) {
        this.transitionIfDifferent("wait");
        return this.state;
      }
      this.transitionIfDifferent("look_up");
      return this.state;
    }

    // --- Priority 8: Sit (idle > 5s) ---
    if (input.idleTime > 12 && (this.state === "sit" || this.state === "lie_down")) {
      this.transitionIfDifferent("lie_down");
      return this.state;
    }

    if (input.idleTime > 5) {
      this.transitionIfDifferent("sit");
      return this.state;
    }

    // --- Priority 9: Idle (default) ---
    this.transitionIfDifferent("idle");
    return this.state;
  }

  /**
   * Returns the SpriteAnimator animation name for the current state.
   * E.g. "jump_rise" -> "jump", "attack_prep" -> "attack".
   */
  getAnimName(): string {
    return ANIM_NAME_MAP[this.state] ?? "idle";
  }

  /**
   * Whether the current state can be interrupted by normal input.
   */
  canInterrupt(): boolean {
    return !NON_INTERRUPTIBLE.has(this.state);
  }

  // ---- Internal helpers ----

  private transition(next: AnimState): void {
    if (next !== this.state) {
      this.state = next;
      this.stateTime = 0;
    }
  }

  private transitionIfDifferent(next: AnimState): void {
    if (this.state !== next) {
      this.transition(next);
    }
  }

  private isHurt(): boolean {
    return (
      this.state === "hurt_light" ||
      this.state === "hurt_medium" ||
      this.state === "hurt_heavy"
    );
  }

  private isJumpState(): boolean {
    return (
      this.state === "jump_rise" ||
      this.state === "jump_air" ||
      this.state === "jump_fall"
    );
  }

  private isOneShot(): boolean {
    return ONE_SHOT_DURATIONS[this.state] !== undefined;
  }

  private isOneShotFinished(): boolean {
    const duration = ONE_SHOT_DURATIONS[this.state];
    return duration !== undefined && this.stateTime >= duration;
  }

  private getOneShotNext(input: AnimInput): AnimState {
    // hurt_heavy special case: go to death if dead
    if (this.state === "hurt_heavy") {
      return input.dead ? "death" : "idle";
    }

    // jump_land: pick up movement state if moving
    if (this.state === "jump_land") {
      if (Math.abs(input.velX) > 4) return "run";
      if (Math.abs(input.velX) > 0.5) return "walk";
      return "idle";
    }

    return ONE_SHOT_NEXT[this.state] ?? "idle";
  }

  private canStartAttack(): boolean {
    // Can only start attack from idle, walk, run, or grounded jump_land
    return (
      this.state === "idle" ||
      this.state === "walk" ||
      this.state === "run" ||
      this.state === "sit" ||
      this.state === "lie_down" ||
      this.state === "wait" ||
      this.state === "crouch" ||
      this.state === "jump_land"
    );
  }

  private damageToHurtState(level: 0 | 1 | 2 | 3): AnimState {
    switch (level) {
      case 3:
        return "hurt_heavy";
      case 2:
        return "hurt_medium";
      case 1:
      default:
        return "hurt_light";
    }
  }
}

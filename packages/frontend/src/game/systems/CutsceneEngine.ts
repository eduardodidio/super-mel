// ---------------------------------------------------------------------------
// CutsceneEngine -- Generic timeline-based cutscene system (F54-T01)
// ---------------------------------------------------------------------------
// Pure TypeScript class with no React, no THREE, no DOM dependencies.
// Drives a linear sequence of timed steps with callbacks and skip support.
// ---------------------------------------------------------------------------

export interface CutsceneStep {
  id: string;
  duration: number; // seconds
  onStart?: () => void;
  onUpdate?: (progress: number, delta: number) => void;
  onEnd?: () => void;
}

export type CutsceneStatus = "idle" | "playing" | "completed" | "skipped";

export interface CutsceneState {
  status: CutsceneStatus;
  currentStepIndex: number;
  currentStepId: string;
  stepProgress: number; // 0..1 within current step
  totalProgress: number; // 0..1 across entire cutscene
  totalDuration: number; // sum of all step durations
  elapsed: number; // total elapsed seconds
}

export class CutsceneEngine {
  private steps: CutsceneStep[];
  private status: CutsceneStatus = "idle";
  private currentStepIndex = 0;
  private stepElapsed = 0;
  private totalElapsed = 0;
  private totalDuration: number;
  private completeCallbacks: (() => void)[] = [];

  constructor(steps: CutsceneStep[]) {
    this.steps = steps;
    this.totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);
  }

  /** Start playback from the beginning */
  start(): void {
    this.status = "playing";
    this.currentStepIndex = 0;
    this.stepElapsed = 0;
    this.totalElapsed = 0;

    if (this.steps.length > 0) {
      this.steps[0].onStart?.();
    } else {
      this.finish("completed");
    }
  }

  /** Call once per frame with delta in seconds */
  update(delta: number): void {
    if (this.status !== "playing") return;
    if (this.currentStepIndex >= this.steps.length) return;

    this.stepElapsed += delta;
    this.totalElapsed += delta;

    const step = this.steps[this.currentStepIndex];

    // Check if current step is finished
    while (this.stepElapsed >= step.duration && this.currentStepIndex < this.steps.length) {
      const current = this.steps[this.currentStepIndex];

      // Call onUpdate with progress=1 for the finishing frame
      current.onUpdate?.(1, delta);
      current.onEnd?.();

      this.currentStepIndex++;

      if (this.currentStepIndex >= this.steps.length) {
        this.finish("completed");
        return;
      }

      // Carry over excess time
      this.stepElapsed -= current.duration;
      const next = this.steps[this.currentStepIndex];
      next.onStart?.();

      // If the next step also has zero or very small duration, continue loop
      if (this.stepElapsed < next.duration) break;
    }

    if (this.status !== "playing") return;

    // Call onUpdate for the current step
    const currentStep = this.steps[this.currentStepIndex];
    const progress = currentStep.duration > 0
      ? Math.min(this.stepElapsed / currentStep.duration, 1)
      : 1;
    currentStep.onUpdate?.(progress, delta);
  }

  /** Skip to the end -- calls all remaining onEnd callbacks in order */
  skip(): void {
    if (this.status === "completed" || this.status === "skipped") return;

    // If idle (never started), call onStart+onEnd for all steps
    const startIdx = this.status === "idle" ? 0 : this.currentStepIndex;

    for (let i = startIdx; i < this.steps.length; i++) {
      if (this.status === "idle" || i > this.currentStepIndex) {
        this.steps[i].onStart?.();
      }
      this.steps[i].onEnd?.();
    }

    this.finish("skipped");
  }

  /** Get current state (readonly snapshot) */
  getState(): CutsceneState {
    const currentStep = this.steps[this.currentStepIndex] ?? this.steps[this.steps.length - 1];
    const stepProgress = currentStep && currentStep.duration > 0
      ? Math.min(this.stepElapsed / currentStep.duration, 1)
      : 1;
    const totalProgress = this.totalDuration > 0
      ? Math.min(this.totalElapsed / this.totalDuration, 1)
      : 1;

    return {
      status: this.status,
      currentStepIndex: this.currentStepIndex,
      currentStepId: currentStep?.id ?? "",
      stepProgress,
      totalProgress,
      totalDuration: this.totalDuration,
      elapsed: this.totalElapsed,
    };
  }

  /** Register a callback for when the entire cutscene completes */
  onComplete(callback: () => void): void {
    this.completeCallbacks.push(callback);
  }

  private finish(status: "completed" | "skipped"): void {
    this.status = status;
    this.totalElapsed = this.totalDuration;
    for (const cb of this.completeCallbacks) {
      cb();
    }
  }
}

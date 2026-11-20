/** Shared contract for the sea renderers (tier 1: 2D shader, tier 2: three.js). */
export interface SeaOptions {
  /** Called once per rendered frame with its duration in ms (tier 2 downgrade check). */
  onFrame?: (ms: number) => void;
  /**
   * Allow a software WebGL renderer (SwiftShader, llvmpipe). Off by default: without a GPU the
   * sea would only cost CPU, so the renderer refuses (failIfMajorPerformanceCaveat) and the
   * still stays. On only for ?tier= / ?gpu=software (tests, CI).
   */
  allowSoftware?: boolean;
  /**
   * Boxes the island must stay clear of (hero text, chips, buttons) in layer pixels, as they
   * sit at scroll 0. Read on mount and on every resize.
   */
  avoid?: () => DOMRect[];
}

export interface SeaRenderer {
  /** Mounts a canvas into the layer and resolves after the first frame is drawn. */
  mount(layer: HTMLElement): Promise<void>;
  /** Stops/starts the render loop (hero off-screen, tab hidden). */
  setPaused(paused: boolean): void;
  /** Day (0) → dusk (0.5) → night (1); see src/lib/sea/progress.ts. */
  setProgress?(p: number): void;
  /** Removes the canvas and frees GPU resources. */
  destroy(): void;
}

export type SeaFactory = (options: SeaOptions) => SeaRenderer;

/** Shared contract for the sea renderers (tier 1: 2D shader, tier 2: three.js). */
export interface SeaOptions {
  /** Called once per rendered frame with its duration in ms (tier 2 downgrade check). */
  onFrame?: (ms: number) => void;
}

export interface SeaRenderer {
  /** Mounts a canvas into the layer and resolves after the first frame is drawn. */
  mount(layer: HTMLElement): Promise<void>;
  /** Stops/starts the render loop (hero off-screen, tab hidden). */
  setPaused(paused: boolean): void;
  /** Removes the canvas and frees GPU resources. */
  destroy(): void;
}

export type SeaFactory = (options: SeaOptions) => SeaRenderer;

/**
 * OPEX LÍDER — VISUAL-3D-04 (Fase 4 · Capa 2: Estado y Control de Interacción)
 * Controlador determinista y desacoplado de WebGL para la selección de elementos,
 * activación de despiece espacial, navegación secuencial y restauración del modelo.
 */

import {
  PROCESS_ELEMENTS,
  PROCESS_ELEMENT_ORDER,
  OVERVIEW_CAMERA_POSE,
  OVERVIEW_EXPLODED_CAMERA_POSE,
  type ProcessElementId,
  type ProcessElementSpec,
  type CameraPose,
} from './processWorkOrderData.ts';

export type ProcessViewMode = '3d' | '2d-fallback';

export interface ProcessInteractionState {
  selectedId: ProcessElementId | null;
  isExploded: boolean;
  viewMode: ProcessViewMode;
  reducedMotion: boolean;
  webglAvailable: boolean;
}

export type InteractionListener = (state: ProcessInteractionState) => void;

export class ProcessInteractionController {
  private state: ProcessInteractionState;
  private listeners = new Set<InteractionListener>();

  constructor(initial?: Partial<ProcessInteractionState>) {
    this.state = {
      selectedId: initial?.selectedId ?? null,
      isExploded: initial?.isExploded ?? false,
      viewMode: initial?.viewMode ?? '3d',
      reducedMotion: initial?.reducedMotion ?? false,
      webglAvailable: initial?.webglAvailable ?? true,
    };
  }

  getState(): Readonly<ProcessInteractionState> {
    return { ...this.state };
  }

  getSelectedSpec(): ProcessElementSpec | null {
    if (!this.state.selectedId) return null;
    return PROCESS_ELEMENTS[this.state.selectedId] ?? null;
  }

  getActiveCameraPose(): CameraPose {
    const spec = this.getSelectedSpec();
    if (!spec) {
      return this.state.isExploded ? OVERVIEW_EXPLODED_CAMERA_POSE : OVERVIEW_CAMERA_POSE;
    }
    return this.state.isExploded ? spec.explodedCameraPose : spec.focusCameraPose;
  }

  selectElement(id: ProcessElementId | null): Readonly<ProcessInteractionState> {
    if (id !== null && !(id in PROCESS_ELEMENTS)) {
      return this.getState();
    }
    this.state = {
      ...this.state,
      selectedId: id,
    };
    this.emit();
    return this.getState();
  }

  selectNext(): Readonly<ProcessInteractionState> {
    const current = this.state.selectedId;
    if (!current) {
      return this.selectElement(PROCESS_ELEMENT_ORDER[0]);
    }
    const idx = PROCESS_ELEMENT_ORDER.indexOf(current);
    const nextIdx = (idx + 1) % PROCESS_ELEMENT_ORDER.length;
    return this.selectElement(PROCESS_ELEMENT_ORDER[nextIdx]);
  }

  selectPrev(): Readonly<ProcessInteractionState> {
    const current = this.state.selectedId;
    if (!current) {
      return this.selectElement(PROCESS_ELEMENT_ORDER[PROCESS_ELEMENT_ORDER.length - 1]);
    }
    const idx = PROCESS_ELEMENT_ORDER.indexOf(current);
    const prevIdx = (idx - 1 + PROCESS_ELEMENT_ORDER.length) % PROCESS_ELEMENT_ORDER.length;
    return this.selectElement(PROCESS_ELEMENT_ORDER[prevIdx]);
  }

  toggleExploded(force?: boolean): Readonly<ProcessInteractionState> {
    const next = typeof force === 'boolean' ? force : !this.state.isExploded;
    this.state = {
      ...this.state,
      isExploded: next,
    };
    this.emit();
    return this.getState();
  }

  setViewMode(mode: ProcessViewMode): Readonly<ProcessInteractionState> {
    this.state = {
      ...this.state,
      viewMode: mode,
    };
    this.emit();
    return this.getState();
  }

  setReducedMotion(reduced: boolean): Readonly<ProcessInteractionState> {
    this.state = {
      ...this.state,
      reducedMotion: reduced,
    };
    this.emit();
    return this.getState();
  }

  setWebglAvailable(available: boolean): Readonly<ProcessInteractionState> {
    this.state = {
      ...this.state,
      webglAvailable: available,
      viewMode: available ? this.state.viewMode : '2d-fallback',
    };
    this.emit();
    return this.getState();
  }

  /** Restaura el modelo original: vista general ensamblada */
  reset(): Readonly<ProcessInteractionState> {
    this.state = {
      ...this.state,
      selectedId: null,
      isExploded: false,
    };
    this.emit();
    return this.getState();
  }

  subscribe(listener: InteractionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.getState();
    for (const fn of this.listeners) {
      fn(snapshot);
    }
  }
}

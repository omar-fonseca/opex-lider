/**
 * OPEX LÍDER — VISUAL-3D-04 (Fase 4 · Capa 6: Ciclo de Vida WebGL)
 * Gestiona detección de soporte WebGL, renderizado bajo demanda (detenido en reposo),
 * pausa fuera de pantalla (IntersectionObserver), redimensionado (ResizeObserver),
 * pérdida/recuperación de contexto WebGL y liberación determinista de recursos GPU.
 */

import type * as THREE from 'three';

export interface LifecycleDiagnostics {
  isDisposed: boolean;
  isContextLost: boolean;
  isInViewport: boolean;
  isRenderingLoopActive: boolean;
  renderedFrameCount: number;
  disposedGeometries: number;
  disposedMaterials: number;
}

export function detectWebGLSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

export interface WebGLLifecycleOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  onBeforeRenderFrame?: () => boolean;
  onAfterRenderFrame?: () => void;
  onResize?: (width: number, height: number) => void;
  onContextLostChange?: (lost: boolean) => void;
}

export class WebGLLifecycleManager {
  private opts: WebGLLifecycleOptions;
  private rafId: number | null = null;
  private needsSingleFrame = false;
  private activeAnimationsCount = 0;
  private isDisposed = false;
  private isContextLost = false;
  private isInViewport = true;
  private isPageHidden = false;
  private renderedFrameCount = 0;
  private disposedGeometries = 0;
  private disposedMaterials = 0;

  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  private boundOnContextLost: (e: Event) => void;
  private boundOnContextRestored: () => void;
  private boundOnVisibilityChange: () => void;

  constructor(opts: WebGLLifecycleOptions) {
    this.opts = opts;

    this.boundOnContextLost = (e: Event) => {
      e.preventDefault();
      this.isContextLost = true;
      this.stopLoop();
      this.opts.onContextLostChange?.(true);
    };

    this.boundOnContextRestored = () => {
      this.isContextLost = false;
      this.opts.onContextLostChange?.(false);
      this.requestRender();
    };

    this.boundOnVisibilityChange = () => {
      this.isPageHidden = document.hidden;
      if (this.isPageHidden) {
        this.stopLoop();
      } else {
        this.requestRender();
      }
    };

    this.attachListeners();
  }

  private attachListeners(): void {
    const { canvas, container } = this.opts;
    canvas.addEventListener('webglcontextlost', this.boundOnContextLost, false);
    canvas.addEventListener('webglcontextrestored', this.boundOnContextRestored, false);
    document.addEventListener('visibilitychange', this.boundOnVisibilityChange, false);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(container);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          this.isInViewport = entry.isIntersecting;
          if (!this.isInViewport) {
            this.stopLoop();
          } else {
            this.requestRender();
          }
        },
        { threshold: 0.05 }
      );
      this.intersectionObserver.observe(container);
    }
  }

  handleResize(): void {
    if (this.isDisposed || this.isContextLost) return;
    const { container, renderer, camera, onResize } = this.opts;
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    onResize?.(width, height);
    this.requestRender();
  }

  /** Solicita renderizar un único fotograma bajo demanda (sin bucle permanente) */
  requestRender(): void {
    if (this.isDisposed || this.isContextLost || !this.isInViewport || this.isPageHidden) {
      return;
    }
    this.needsSingleFrame = true;
    this.ensureLoopRunning();
  }

  /** Incrementa el contador de transiciones activas (GSAP / inercia de cámara) */
  beginActiveTransition(): void {
    this.activeAnimationsCount += 1;
    this.ensureLoopRunning();
  }

  /** Decrementa el contador de transiciones activas; si llega a 0 el bucle se detiene en reposo */
  endActiveTransition(): void {
    this.activeAnimationsCount = Math.max(0, this.activeAnimationsCount - 1);
    this.requestRender();
  }

  private ensureLoopRunning(): void {
    if (this.rafId !== null || this.isDisposed || this.isContextLost || !this.isInViewport || this.isPageHidden) {
      return;
    }
    const tick = () => {
      this.rafId = null;
      if (this.isDisposed || this.isContextLost || !this.isInViewport || this.isPageHidden) {
        return;
      }

      const controlsNeedUpdate = this.opts.onBeforeRenderFrame?.() ?? false;
      const shouldRender =
        this.needsSingleFrame || this.activeAnimationsCount > 0 || controlsNeedUpdate;

      if (shouldRender) {
        this.needsSingleFrame = false;
        this.opts.renderer.render(this.opts.scene, this.opts.camera);
        this.renderedFrameCount += 1;
        this.opts.onAfterRenderFrame?.();
      }

      if (this.needsSingleFrame || this.activeAnimationsCount > 0 || controlsNeedUpdate) {
        this.rafId = window.requestAnimationFrame(tick);
      }
    };

    this.rafId = window.requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getDiagnostics(): LifecycleDiagnostics {
    return {
      isDisposed: this.isDisposed,
      isContextLost: this.isContextLost,
      isInViewport: this.isInViewport,
      isRenderingLoopActive: this.rafId !== null,
      renderedFrameCount: this.renderedFrameCount,
      disposedGeometries: this.disposedGeometries,
      disposedMaterials: this.disposedMaterials,
    };
  }

  /** Libera geometrías, materiales, observadores y el contexto WebGL */
  dispose(): LifecycleDiagnostics {
    if (this.isDisposed) {
      return this.getDiagnostics();
    }
    this.isDisposed = true;
    this.stopLoop();

    const { canvas, scene, renderer } = this.opts;
    canvas.removeEventListener('webglcontextlost', this.boundOnContextLost, false);
    canvas.removeEventListener('webglcontextrestored', this.boundOnContextRestored, false);
    document.removeEventListener('visibilitychange', this.boundOnVisibilityChange, false);

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;

    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        geometries.add(mesh.geometry);
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => materials.add(m));
        } else {
          materials.add(mesh.material);
        }
      }
    });

    for (const g of geometries) {
      g.dispose();
      this.disposedGeometries += 1;
    }
    for (const m of materials) {
      m.dispose();
      this.disposedMaterials += 1;
    }

    scene.clear();
    renderer.dispose();

    return this.getDiagnostics();
  }
}

/**
 * Controlador Three.js de la Página 02 — Sistema operacional 3D.
 * Ciclo de vida alineado con patrones de gears3d (sin modificar la portada):
 * lazy init, DPR limitado, pausa offscreen/tab, temas, dispose y context loss.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import {
  observeDocumentGearPalette,
  readCurrentDocumentGearPalette,
  type GearVisualPalette,
} from '../gears3d/GearThemeBridge.ts';
import { prefersReducedMotion } from '../presentationEngine.ts';
import type { ForceId } from './SystemEducationalData.ts';
import type { SystemAppStateController, SystemAppSnapshot } from './SystemAppState.ts';
import { getForceById } from './SystemEducationalData.ts';
import {
  buildSystemGeometryWorld,
  disposeObject3D,
  disposeSystemMaterials,
  type SystemGeometryWorld,
  type SystemSharedMaterials,
} from './SystemGeometry.ts';
import { SystemForceStoryDirector } from './SystemForceStories.ts';
import {
  computePoseForBox3,
  expandBoxFromObject,
  unionBoxes,
} from './SystemCameraFraming.ts';
import {
  OVERVIEW_CAMERA_POSE,
  clampOrbitOffsets,
  computeForceHighlightMap,
  isGenuinePointerClick,
  type CameraFocusPose,
  type ForceVisualState,
} from './SystemInteraction.ts';

export interface ProjectedForceLabel {
  id: ForceId | 'sistema';
  xPercent: number;
  yPercent: number;
}

export interface SystemScene3DOptions {
  appState: SystemAppStateController;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onSelectForce: (forceId: ForceId) => void;
  onHoverForce?: (forceId: ForceId | null) => void;
  onLabelsProjected?: (labels: ProjectedForceLabel[]) => void;
  onStoryBeat?: (forceId: ForceId, beatIndex: number, label: string) => void;
  onMotionStateChange?: (isRunning: boolean, isUserPaused: boolean) => void;
  onWebGLFallback?: (reason: string) => void;
}

export interface SystemSceneDiagnosticSnapshot {
  initialized: boolean;
  activeForce: ForceId | null;
  relationsMode: boolean;
  isUserPaused: boolean;
  storyPlaying: boolean;
  platformCount: number;
  connectionCount: number;
  currentBeat: string | null;
  labels: ProjectedForceLabel[];
  /** Todas las etiquetas de la vista activa quedan dentro de [0–100] con margen. */
  labelsFramed: boolean;
  canvasWidth: number;
  canvasHeight: number;
  aspect: number;
  cameraSettled: boolean;
  renderedFrames: number;
  renderCalls: number;
  triangles: number;
}

export class SystemScene3DController {
  private readonly options: SystemScene3DOptions;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private materials: SystemSharedMaterials | null = null;
  private world: SystemGeometryWorld | null = null;
  private storyDirector: SystemForceStoryDirector | null = null;

  private ambientLight: THREE.AmbientLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private rimLight: THREE.PointLight | null = null;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private pointerDownX = 0;
  private pointerDownY = 0;
  private isPointerDragging = false;
  private orbitYaw = 0;
  private orbitPitch = 0;
  private inspectEnabled = false;

  private readonly cameraPose: CameraFocusPose = { ...OVERVIEW_CAMERA_POSE };
  private cameraTween: gsap.core.Tween | null = null;

  // Effect cache only: the application controller remains the selection authority.
  private appliedSelectionRevision = -1;
  private appliedRelations: boolean | null = null;
  private unsubscribeState: (() => void) | null = null;
  private cameraSettled = true;
  private get activeForce(): ForceId | null {
    return this.options.appState.getSnapshot().activeForce;
  }
  private get relationsMode(): boolean {
    return this.options.appState.getSnapshot().relationsVisible;
  }
  private get isUserPaused(): boolean {
    return this.options.appState.getSnapshot().isPaused;
  }
  private hoveredForce: ForceId | null = null;

  private rafId: number | null = null;
  private lastFrameMs = 0;
  private ambientPhase = 0;
  private renderedFrames = 0;
  private disposed = false;
  private initialized = false;
  private viewportPaused = false;
  private tabHiddenPaused = false;
  private captureFrozen = false;
  private lastLabels: ProjectedForceLabel[] = [];
  private presentationMode = false;
  private readonly scratchBox = new THREE.Box3();
  private readonly scratchBoxes: THREE.Box3[] = [];

  private disconnectThemeObserver: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private reducedMotionQuery: MediaQueryList | null = null;

  constructor(options: SystemScene3DOptions) {
    this.options = options;
  }

  public init(): boolean {
    if (this.initialized || this.disposed) return this.initialized;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: this.options.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'WebGL initialization failed';
      this.options.onWebGLFallback?.(msg);
      return false;
    }

    const gl = renderer.getContext();
    if (!gl) {
      this.options.onWebGLFallback?.('WebGL context unavailable');
      renderer.dispose();
      return false;
    }

    this.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(OVERVIEW_CAMERA_POSE.fov ?? 36, 1, 0.1, 80);
    this.camera = camera;
    this.applyCameraPose(this.cameraPose);

    const palette = readCurrentDocumentGearPalette();
    const built = buildSystemGeometryWorld(palette.accentHex);
    this.materials = built.materials;
    this.world = built.world;
    scene.add(built.world.root);
    this.storyDirector = new SystemForceStoryDirector(built.world);

    this.ambientLight = new THREE.AmbientLight(palette.ambientLightHex, 1.25);
    scene.add(this.ambientLight);
    this.keyLight = new THREE.DirectionalLight(palette.keyLightHex, 2.15);
    this.keyLight.position.set(5.2, 9.5, 4.2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 28;
    this.keyLight.shadow.camera.left = -10;
    this.keyLight.shadow.camera.right = 10;
    this.keyLight.shadow.camera.top = 10;
    this.keyLight.shadow.camera.bottom = -10;
    this.keyLight.shadow.bias = -0.0008;
    scene.add(this.keyLight);
    this.fillLight = new THREE.DirectionalLight(palette.warmRimLightHex, 1.15);
    this.fillLight.position.set(-5.5, 4.2, -2.4);
    scene.add(this.fillLight);
    this.rimLight = new THREE.PointLight(palette.coolRimLightHex, 2.8, 20, 1.5);
    this.rimLight.position.set(0, 4.8, 0);
    scene.add(this.rimLight);
    const warmWash = new THREE.PointLight(0xff7a2e, 1.1, 28, 2);
    warmWash.position.set(0, 6.5, -8);
    scene.add(warmWash);

    this.applyPalette(palette);
    this.setupListeners();
    this.updateSize();
    this.projectLabels();
    this.renderSingleFrame(0);

    this.initialized = true;
    this.unsubscribeState = this.options.appState.subscribe((snapshot) => this.applyAppState(snapshot));
    this.lastFrameMs = performance.now();
    this.startLoop();
    this.notifyMotion();

    // Re-medir tras el layout (evita canvas 1×N cuando el contenedor aún no tiene ancho)
    requestAnimationFrame(() => {
      this.updateSize();
      this.projectLabels();
      this.renderSingleFrame(0);
      requestAnimationFrame(() => {
        this.updateSize();
        this.projectLabels();
        this.renderSingleFrame(0);
      });
    });
    return true;
  }

  private applyAppState(snapshot: SystemAppSnapshot): void {
    if (!this.world || !this.storyDirector || this.disposed) return;
    const selectionChanged = snapshot.selectionRevision !== this.appliedSelectionRevision;
    const relationsChanged = snapshot.relationsVisible !== this.appliedRelations;
    // Set caches before GSAP effects: reduced-motion callbacks may emit synchronously.
    this.appliedSelectionRevision = snapshot.selectionRevision;
    this.appliedRelations = snapshot.relationsVisible;

    if (selectionChanged || relationsChanged) {
      const connected = snapshot.activeForce ? getForceById(snapshot.activeForce).connectedIds : [];
      this.applyHighlights(computeForceHighlightMap(
        snapshot.activeForce, this.hoveredForce, connected, snapshot.relationsVisible
      ));
    }
    if (selectionChanged) {
      this.inspectEnabled = Boolean(snapshot.activeForce);
      this.orbitYaw = 0;
      this.orbitPitch = 0;
      if (snapshot.activeForce) {
        const forceId = snapshot.activeForce;
        this.tweenCamera(this.currentForcePose(forceId));
        this.storyDirector.playForce(forceId, {
          onBeat: (id, index, label) => {
            if (this.disposed || this.activeForce !== id) return;
            this.options.appState.setBeatLabel(label);
            this.options.onStoryBeat?.(id, index, label);
          },
          onComplete: () => this.notifyMotion(),
        });
      } else {
        this.storyDirector.cancel();
        this.tweenCamera(this.currentOverviewPose());
        this.pulseAllConnections(snapshot.relationsVisible);
      }
      this.projectLabels();
      this.renderSingleFrame(0);
    } else if (relationsChanged) {
      if (!snapshot.activeForce) this.pulseAllConnections(snapshot.relationsVisible);
      this.renderSingleFrame(0);
    }
    this.syncLoop();
  }

  public setCaptureFreeze(frozen: boolean): void {
    this.captureFrozen = frozen;
    if (!frozen) {
      this.lastFrameMs = performance.now();
      this.startLoop();
    } else {
      this.stopLoop();
      this.renderSingleFrame(0);
    }
    this.syncLoop();
  }

  public getDiagnosticSnapshot(): SystemSceneDiagnosticSnapshot {
    const margin = 1;
    const relevant = this.activeForce
      ? this.lastLabels.filter((label) => label.id === this.activeForce || label.id === 'sistema')
      : this.lastLabels;
    const labelsFramed =
      relevant.length > 0 &&
      relevant.every(
        (label) =>
          label.xPercent >= margin &&
          label.xPercent <= 100 - margin &&
          label.yPercent >= margin &&
          label.yPercent <= 100 - margin
      );
    const size = this.renderer?.getSize(new THREE.Vector2());
    return {
      initialized: this.initialized,
      activeForce: this.activeForce,
      relationsMode: this.relationsMode,
      isUserPaused: this.isUserPaused,
      storyPlaying: Boolean(this.storyDirector?.isPlaying()),
      platformCount: this.world ? 5 : 0,
      connectionCount: this.world?.connectionMeshes.length ?? 0,
      currentBeat: this.options.appState.getSnapshot().currentBeatLabel,
      labels: this.lastLabels,
      labelsFramed,
      canvasWidth: size?.x ?? 0,
      canvasHeight: size?.y ?? 0,
      aspect: this.camera?.aspect ?? 0,
      cameraSettled: this.cameraSettled,
      renderedFrames: this.renderedFrames,
      renderCalls: this.renderer?.info.render.calls ?? 0,
      triangles: this.renderer?.info.render.triangles ?? 0,
    };
  }

  /**
   * Recalcula renderer + cámara tras cambios de layout (modo presentación, resize, etc.).
   */
  public notifyLayoutChange(presentationMode?: boolean): void {
    if (typeof presentationMode === 'boolean') {
      this.presentationMode = presentationMode;
    }
    requestAnimationFrame(() => {
      this.updateSize();
      this.refitActiveCamera(false);
      this.projectLabels();
      this.renderSingleFrame(0);
      requestAnimationFrame(() => {
        this.updateSize();
        this.refitActiveCamera(false);
        this.projectLabels();
        this.renderSingleFrame(0);
      });
    });
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribeState?.();
    this.unsubscribeState = null;
    this.stopLoop();
    this.cancelCameraTween();
    this.storyDirector?.cancel();
    this.teardownListeners();

    if (this.world) {
      this.world.root.traverse((object) => {
        gsap.killTweensOf(object.scale);
        const material = (object as THREE.Mesh).material;
        if (Array.isArray(material)) material.forEach((item) => gsap.killTweensOf(item));
        else if (material) gsap.killTweensOf(material);
      });
      disposeObject3D(this.world.root, this.materials ?? undefined);
      this.scene?.remove(this.world.root);
    }
    if (this.materials) disposeSystemMaterials(this.materials);

    this.ambientLight = null;
    this.keyLight = null;
    this.fillLight = null;
    this.rimLight = null;
    this.world = null;
    this.materials = null;
    this.storyDirector = null;
    this.scene = null;
    this.camera = null;

    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.renderer = null;
    this.initialized = false;
  }

  private applyPalette(palette: GearVisualPalette): void {
    if (!this.materials) return;
    const accent = palette.accentHex;
    this.materials.platformEdge.color.setHex(accent);
    this.materials.platformEdge.emissive.setHex(accent);
    this.materials.platformGlow.color.setHex(accent);
    this.materials.platformGlow.emissive.setHex(accent);
    this.materials.accentEmissive.color.setHex(accent);
    this.materials.accentEmissive.emissive.setHex(accent);
    this.materials.connection.color.setHex(accent);
    this.materials.connection.emissive.setHex(accent);
    this.materials.domeGlass.emissive.setHex(accent);
    this.materials.propScreen.color.setHex(palette.accentBrightHex);
    this.materials.propScreen.emissive.setHex(accent);

    if (palette.theme === 'light') {
      this.materials.platformBody.color.setHex(0xdbe4f0);
      this.materials.propDark.color.setHex(0x475569);
    } else {
      this.materials.platformBody.color.setHex(0x1c2433);
      this.materials.propDark.color.setHex(0x0f172a);
    }

    if (this.ambientLight) this.ambientLight.color.setHex(palette.ambientLightHex);
    if (this.keyLight) this.keyLight.color.setHex(palette.keyLightHex);
    if (this.fillLight) this.fillLight.color.setHex(palette.warmRimLightHex);
    if (this.rimLight) this.rimLight.color.setHex(palette.coolRimLightHex);

    if (this.world) {
      (Object.values(this.world.forces) as typeof this.world.forces[ForceId][]).forEach((bundle) => {
        bundle.underLight.color.setHex(palette.accentBrightHex);
      });
      this.world.center.underLight.color.setHex(palette.accentBrightHex);
    }
    this.renderSingleFrame(0);
  }

  private applyHighlights(map: ReturnType<typeof computeForceHighlightMap>): void {
    if (!this.world) return;
    this.setBundleState(this.world.center, map.centerState);
    (Object.keys(map.forceStates) as ForceId[]).forEach((id) => {
      this.setBundleState(this.world!.forces[id], map.forceStates[id]);
    });

    const active = map.activeForce;
    const connected = new Set<string>([
      ...(active ? [active, 'sistema', ...map.connectedIds] : []),
      ...(map.relationsMode ? ['personas', 'procesos', 'liderazgo', 'mejora', 'sistema'] : []),
    ]);

    this.world.connectionMeshes.forEach((mesh) => {
      const pair = mesh.userData.pair as Array<ForceId | 'sistema'>;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isArrow = mesh.userData.connectionStyle === 'arrow';
      const relevant =
        map.relationsMode ||
        (active && pair.includes(active) && pair.some((p) => connected.has(p)));
      const idle = isArrow ? 0.62 : 0.18;
      const opacity = relevant ? (isArrow ? 0.92 : 0.75) : map.activeForce ? 0.06 : idle;
      const intensity = relevant ? 1.05 : isArrow ? 0.55 : 0.22;
      mat.opacity = opacity;
      mat.emissiveIntensity = intensity;
      mesh.traverse((child) => {
        if (child === mesh || !(child as THREE.Mesh).isMesh) return;
        const childMat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (!childMat || !('opacity' in childMat)) return;
        childMat.opacity = Math.min(1, opacity + 0.08);
        childMat.emissiveIntensity = intensity;
      });
    });
  }

  private setBundleState(
    bundle: SystemGeometryWorld['center'] | SystemGeometryWorld['forces'][ForceId],
    state: ForceVisualState
  ): void {
    const scale =
      state === 'active' ? 1.06 : state === 'hovered' ? 1.03 : state === 'dimmed' ? 0.96 : 1;
    const glow = state === 'active' || state === 'hovered' ? 0.95 : state === 'connected' ? 0.6 : 0.28;
    const mat = bundle.glowRing.material as THREE.MeshStandardMaterial;
    const veilMat = bundle.veil.material as THREE.MeshBasicMaterial;
    bundle.underLight.intensity = state === 'dimmed' ? 0.25 : state === 'active' ? 2.4 : 1.15;
    if (prefersReducedMotion()) {
      gsap.killTweensOf(bundle.root.scale);
      gsap.killTweensOf(mat);
      gsap.killTweensOf(veilMat);
      bundle.root.scale.setScalar(scale);
      mat.emissiveIntensity = glow;
      mat.opacity = Math.min(0.8, glow);
      veilMat.opacity = state === 'dimmed' ? 0.62 : 0;
    } else {
      gsap.to(bundle.root.scale, { x: scale, y: scale, z: scale, duration: 0.35, overwrite: true });
      gsap.to(mat, { emissiveIntensity: glow, opacity: Math.min(0.8, glow), duration: 0.35, overwrite: true });
      gsap.to(veilMat, { opacity: state === 'dimmed' ? 0.62 : 0, duration: 0.35, overwrite: true });
    }
  }

  private pulseAllConnections(strong: boolean): void {
    if (!this.world) return;
    this.world.connectionMeshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isArrow = mesh.userData.connectionStyle === 'arrow';
      mat.opacity = strong ? 0.9 : isArrow ? 0.62 : 0.2;
      mat.emissiveIntensity = strong ? 1 : isArrow ? 0.55 : 0.22;
    });
  }

  private tweenCamera(pose: CameraFocusPose): void {
    if (!this.camera) return;
    this.cancelCameraTween();
    if (prefersReducedMotion()) {
      Object.assign(this.cameraPose, pose);
      if (pose.fov) this.camera.fov = pose.fov;
      this.camera.updateProjectionMatrix();
      this.applyCameraPose(this.cameraPose);
      this.projectLabels();
      this.renderSingleFrame(0);
      return;
    }
    this.cameraSettled = false;
    const proxy = { ...this.cameraPose };
    this.cameraTween = gsap.to(proxy, {
      positionX: pose.positionX,
      positionY: pose.positionY,
      positionZ: pose.positionZ,
      lookAtX: pose.lookAtX,
      lookAtY: pose.lookAtY,
      lookAtZ: pose.lookAtZ,
      duration: 0.85,
      ease: 'power2.inOut',
      onUpdate: () => {
        Object.assign(this.cameraPose, proxy);
        if (pose.fov && this.camera) this.camera.fov = pose.fov;
        this.applyCameraPose(this.cameraPose);
        this.camera?.updateProjectionMatrix();
        this.projectLabels();
        // Pausing a story must not leave navigation displaying an old GPU frame.
        if (!this.shouldRunLoop()) this.renderSingleFrame(0);
      },
      onComplete: () => {
        this.cameraTween = null;
        this.cameraSettled = true;
        this.projectLabels();
        this.renderSingleFrame(0);
      },
    });
  }

  private cancelCameraTween(): void {
    this.cameraTween?.kill();
    this.cameraTween = null;
    this.cameraSettled = true;
  }

  private applyCameraPose(pose: CameraFocusPose): void {
    if (!this.camera) return;
    const base = new THREE.Vector3(pose.positionX, pose.positionY, pose.positionZ);
    const look = new THREE.Vector3(pose.lookAtX, pose.lookAtY, pose.lookAtZ);
    if (this.inspectEnabled && (this.orbitYaw !== 0 || this.orbitPitch !== 0)) {
      const offset = base.clone().sub(look);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += this.orbitYaw;
      spherical.phi = Math.max(0.25, Math.min(1.35, spherical.phi + this.orbitPitch));
      offset.setFromSpherical(spherical);
      this.camera.position.copy(look.clone().add(offset));
    } else {
      this.camera.position.copy(base);
    }
    this.camera.lookAt(look);
    this.camera.updateMatrixWorld();
  }

  private setupListeners(): void {
    const { canvas, container } = this.options;

    this.disconnectThemeObserver = observeDocumentGearPalette((palette) => {
      this.applyPalette(palette);
    });

    if (typeof window.matchMedia === 'function') {
      this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotionQuery.addEventListener('change', this.handleReducedMotion);
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateSize();
        this.refitActiveCamera(false);
        this.projectLabels();
        this.renderSingleFrame(0);
      });
      this.resizeObserver.observe(container);
    }
    window.addEventListener('resize', this.handleResize, { passive: true });

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.viewportPaused = !entry.isIntersecting;
          }
          this.syncLoop();
        },
        { threshold: 0.05 }
      );
      this.intersectionObserver.observe(container);
    }

    document.addEventListener('visibilitychange', this.handleVisibility);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);
  }

  private teardownListeners(): void {
    const { canvas } = this.options;
    this.disconnectThemeObserver?.();
    this.disconnectThemeObserver = null;
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.reducedMotionQuery?.removeEventListener('change', this.handleReducedMotion);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private readonly handleReducedMotion = (): void => {
    this.refitActiveCamera(false);
    const connected = this.activeForce ? getForceById(this.activeForce).connectedIds : [];
    this.applyHighlights(computeForceHighlightMap(this.activeForce, this.hoveredForce, connected, this.relationsMode));
    this.syncLoop();
    this.projectLabels();
    this.renderSingleFrame(0);
  };

  private readonly handleResize = (): void => {
    this.updateSize();
    this.refitActiveCamera(false);
    this.projectLabels();
    this.renderSingleFrame(0);
  };

  private readonly handleVisibility = (): void => {
    this.tabHiddenPaused = document.hidden;
    if (!document.hidden) this.lastFrameMs = performance.now();
    this.syncLoop();
  };

  private readonly handlePointerDown = (e: PointerEvent): void => {
    this.pointerDownX = e.clientX;
    this.pointerDownY = e.clientY;
    this.isPointerDragging = false;
    if (this.inspectEnabled) {
      this.options.canvas.setPointerCapture(e.pointerId);
    }
  };

  private readonly handlePointerMove = (e: PointerEvent): void => {
    if (this.inspectEnabled && (e.buttons & 1) === 1) {
      const dx = e.clientX - this.pointerDownX;
      const dy = e.clientY - this.pointerDownY;
      if (Math.hypot(dx, dy) > 6) this.isPointerDragging = true;
      if (this.isPointerDragging) {
        const clamped = clampOrbitOffsets(this.orbitYaw + dx * 0.004, this.orbitPitch + dy * 0.003);
        this.orbitYaw = clamped.yaw;
        this.orbitPitch = clamped.pitch;
        this.pointerDownX = e.clientX;
        this.pointerDownY = e.clientY;
        this.applyCameraPose(this.cameraPose);
        this.projectLabels();
        this.renderSingleFrame(0);
        return;
      }
    }

    const hit = this.raycastForce(e.clientX, e.clientY);
    this.hoveredForce = hit;
    this.options.onHoverForce?.(hit);
    this.options.canvas.style.cursor = hit ? 'pointer' : this.inspectEnabled ? 'grab' : 'default';
    if (!this.activeForce) {
      this.applyHighlights(computeForceHighlightMap(null, hit, [], this.relationsMode));
      this.renderSingleFrame(0);
    }
  };

  private readonly handlePointerUp = (e: PointerEvent): void => {
    try {
      this.options.canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (this.isPointerDragging) {
      this.isPointerDragging = false;
      return;
    }
    if (!isGenuinePointerClick(this.pointerDownX, this.pointerDownY, e.clientX, e.clientY)) {
      return;
    }
    const hit = this.raycastForce(e.clientX, e.clientY);
    if (hit) this.options.onSelectForce(hit);
  };

  private readonly handlePointerLeave = (): void => {
    this.hoveredForce = null;
    this.options.onHoverForce?.(null);
    this.options.canvas.style.cursor = 'default';
  };

  private readonly handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.stopLoop();
  };

  private readonly handleContextRestored = (): void => {
    this.lastFrameMs = performance.now();
    this.renderSingleFrame(0);
    this.startLoop();
  };

  private raycastForce(clientX: number, clientY: number): ForceId | null {
    if (!this.camera || !this.world) return null;
    const rect = this.options.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const targets = [
      this.world.forces.personas.hitTarget,
      this.world.forces.procesos.hitTarget,
      this.world.forces.liderazgo.hitTarget,
      this.world.forces.mejora.hitTarget,
    ];
    const hits = this.raycaster.intersectObjects(targets, false);
    if (!hits.length) return null;
    const id = hits[0].object.userData.forceId;
    return id === 'personas' || id === 'procesos' || id === 'liderazgo' || id === 'mejora'
      ? id
      : null;
  }

  private updateSize(): void {
    if (!this.renderer || !this.camera) return;
    const { container, canvas } = this.options;
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width || container.clientWidth || canvas.clientWidth));
    const height = Math.max(
      1,
      Math.floor(rect.height || container.clientHeight || canvas.clientHeight)
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    // En overview, reajustar al aspect real del contenedor (crítico en presentación).
    if (!this.activeForce) {
      this.cancelCameraTween();
      const fitted = this.currentOverviewPose();
      Object.assign(this.cameraPose, fitted);
      this.camera.fov = fitted.fov ?? 36;
      this.camera.updateProjectionMatrix();
      this.applyCameraPose(this.cameraPose);
    }
  }

  private refitActiveCamera(animate: boolean): void {
    const pose = this.activeForce
      ? this.currentForcePose(this.activeForce)
      : this.currentOverviewPose();
    if (animate) this.tweenCamera(pose);
    else {
      this.cancelCameraTween();
      Object.assign(this.cameraPose, pose);
      if (this.camera && pose.fov) this.camera.fov = pose.fov;
      this.camera?.updateProjectionMatrix();
      this.applyCameraPose(this.cameraPose);
    }
  }

  private currentOverviewPose(): CameraFocusPose {
    const aspect = this.camera?.aspect ?? 1.4;
    const box = this.computeOverviewBox();
    // Encuadre tipo Imagen 1: semisométrico, las 5 plataformas legibles.
    const padding = this.presentationMode ? 0.16 : aspect < 1 ? 0.12 : 0.09;
    const fov = this.presentationMode ? (aspect < 1.25 ? 38 : 34) : aspect < 1 ? 38 : 34;
    return computePoseForBox3(box, aspect, {
      padding,
      distanceScale: this.presentationMode ? 0.98 : 0.9,
      fovDeg: fov,
      viewDirection: new THREE.Vector3(0.18, 0.58, 0.79),
      minDistance: 9.5,
      maxDistance: 30,
    });
  }

  private currentForcePose(forceId: ForceId): CameraFocusPose {
    if (!this.world) return { ...OVERVIEW_CAMERA_POSE };
    const aspect = this.camera?.aspect ?? 1.4;
    const bundle = this.world.forces[forceId];
    expandBoxFromObject(bundle.root, this.scratchBox);
    // Incluye un poco del nexo para contexto espacial sin perder al protagonista.
    const centerBox = expandBoxFromObject(this.world.center.root, new THREE.Box3());
    const blended = this.scratchBox.clone();
    blended.expandByPoint(centerBox.getCenter(new THREE.Vector3()));
    blended.expandByScalar(0.35);

    const views: Record<ForceId, THREE.Vector3> = {
      personas: new THREE.Vector3(0.35, 0.55, 0.76),
      procesos: new THREE.Vector3(-0.72, 0.52, 0.45),
      liderazgo: new THREE.Vector3(0.4, 0.55, -0.72),
      mejora: new THREE.Vector3(0.72, 0.52, 0.42),
    };
    return computePoseForBox3(blended, aspect, {
      padding: this.presentationMode ? 0.1 : 0.08,
      fovDeg: this.presentationMode ? 34 : 32,
      viewDirection: views[forceId],
      minDistance: 3.8,
      maxDistance: 16,
    });
  }

  private computeOverviewBox(): THREE.Box3 {
    if (!this.world) return new THREE.Box3();
    this.scratchBoxes.length = 0;
    this.scratchBoxes.push(expandBoxFromObject(this.world.center.root, new THREE.Box3()));
    (Object.keys(this.world.forces) as ForceId[]).forEach((id) => {
      this.scratchBoxes.push(expandBoxFromObject(this.world!.forces[id].root, new THREE.Box3()));
    });
    const box = unionBoxes(this.scratchBoxes);
    // Reserva moderada para etiquetas HTML encima de las plataformas.
    box.max.y += 0.55;
    box.min.y -= 0.08;
    return box;
  }

  private projectLabels(): void {
    if (!this.camera || !this.world) return;
    const width = this.options.container.clientWidth || 1;
    const height = this.options.container.clientHeight || 1;
    const ids: Array<ForceId | 'sistema'> = [
      'sistema',
      'personas',
      'procesos',
      'liderazgo',
      'mejora',
    ];
    const labels: ProjectedForceLabel[] = ids.map((id) => {
      const obj = id === 'sistema' ? this.world!.center.root : this.world!.forces[id].root;
      const worldPos = new THREE.Vector3(0, 1.35, 0);
      obj.localToWorld(worldPos);
      worldPos.project(this.camera!);
      return {
        id,
        xPercent: ((worldPos.x + 1) / 2) * 100,
        yPercent: ((-worldPos.y + 1) / 2) * 100,
      };
    });
    this.lastLabels = labels;
    this.options.onLabelsProjected?.(labels);
    void width;
    void height;
  }

  private shouldRunLoop(): boolean {
    return (
      this.initialized &&
      !this.disposed &&
      !this.captureFrozen &&
      !this.isUserPaused &&
      !this.viewportPaused &&
      !this.tabHiddenPaused &&
      !this.reducedMotionQuery?.matches
    );
  }

  private syncLoop(): void {
    const suspended = this.isUserPaused || this.viewportPaused || this.tabHiddenPaused || this.captureFrozen || this.reducedMotionQuery?.matches;
    if (suspended) this.storyDirector?.pause();
    else this.storyDirector?.resume();
    // Camera navigation remains available during manual story pause.
    this.cameraTween?.paused(this.viewportPaused || this.tabHiddenPaused || this.captureFrozen);
    if (this.shouldRunLoop()) this.startLoop();
    else this.stopLoop();
  }

  private startLoop(): void {
    if (this.rafId !== null || !this.shouldRunLoop()) return;
    this.lastFrameMs = performance.now();
    const tick = (now: number) => {
      this.rafId = null;
      if (!this.shouldRunLoop()) {
        this.renderSingleFrame(0);
        this.notifyMotion();
        return;
      }
      const dt = Math.min(0.05, (now - this.lastFrameMs) / 1000);
      this.lastFrameMs = now;
      this.ambientPhase += dt;
      this.updateAmbientMotion(dt);
      this.renderSingleFrame(dt);
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
    this.notifyMotion();
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.notifyMotion();
  }

  private updateAmbientMotion(dt: number): void {
    if (!this.world || prefersReducedMotion()) return;
    const core = this.world.center.storyNodes.core;
    const gear = this.world.center.storyNodes.gear;
    if (gear) {
      gear.rotation.y += dt * 0.35;
    }
    if (core) {
      core.rotation.y += dt * 0.55;
      core.position.y = 0.55 + Math.sin(this.ambientPhase * 1.2) * 0.04;
    }
    const dome = this.world.center.storyNodes.dome;
    if (dome) dome.rotation.y -= dt * 0.12;
  }

  private renderSingleFrame(_dt: number): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
    this.renderedFrames += 1;
  }

  private notifyMotion(): void {
    this.options.onMotionStateChange?.(this.shouldRunLoop(), this.isUserPaused);
  }
}

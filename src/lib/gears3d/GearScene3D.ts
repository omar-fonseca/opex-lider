/**
 * GearScene3D.ts
 * Three.js scene controller for the 7-gear synchronized mechanism on Page 00 (GEAR-3D-01).
 * Handles WebGL rendering, PBR lighting, 3D->2D center projection, Raycasting,
 * GSAP camera focus transitions, and full resource lifecycle.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import {
  DEFAULT_GEAR_SYSTEM_CONFIG,
  GearTransmissionClock,
  buildSevenGearSpecs,
  type GearMechanicalSpec,
} from './GearTransmission.ts';
import {
  createGearMeshBundle,
  type GearMeshBundle,
  type GearSharedMaterials,
} from './GearGeometry.ts';
import {
  observeDocumentGearPalette,
  readCurrentDocumentGearPalette,
  type GearVisualPalette,
} from './GearThemeBridge.ts';
import {
  DEFAULT_CAMERA_POSE,
  computeCameraFocusPose,
  computeGearHighlightMap,
  isGenuinePointerClick,
  type CameraFocusPose,
} from './GearInteraction.ts';

export interface ProjectedGearCenter {
  id: string;
  index: number; // -1 for central, 0..5 for secondary
  xPercent: number;
  yPercent: number;
}

export interface ProjectedGearSystemCenters {
  central: ProjectedGearCenter;
  secondaries: ProjectedGearCenter[];
}

export interface GearScene3DOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onSelectConcept: (index: number) => void;
  onHoverConcept?: (index: number) => void;
  onCentersProjected?: (centers: ProjectedGearSystemCenters) => void;
  onMotionStateChange?: (isRunning: boolean, isUserPaused: boolean) => void;
  onWebGLFallback?: (reason: string) => void;
}

export interface GearSceneDiagnosticSnapshot {
  initialized: boolean;
  isRunning: boolean;
  isUserPaused: boolean;
  elapsedSeconds: number;
  centralAngleRad: number;
  secondaryAnglesRad: number[];
  activeConceptIndex: number;
  hoveredConceptIndex: number;
  gearCount: number;
  projectedCenters: ProjectedGearSystemCenters | null;
}

export class GearScene3DController {
  private readonly options: GearScene3DOptions;
  private readonly clock: GearTransmissionClock;
  private readonly specs: {
    central: GearMechanicalSpec;
    secondaries: GearMechanicalSpec[];
    all: GearMechanicalSpec[];
    centerDistance: number;
  };

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private sharedMaterials: GearSharedMaterials | null = null;
  private centralBundle: GearMeshBundle | null = null;
  private secondaryBundles: GearMeshBundle[] = [];
  private allBundles: GearMeshBundle[] = [];
  private hitTargets: THREE.Object3D[] = [];

  private ambientLight: THREE.AmbientLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private warmRimLight: THREE.DirectionalLight | null = null;
  private coolRimLight: THREE.PointLight | null = null;
  private corePointLight: THREE.PointLight | null = null;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private pointerDownClientX = 0;
  private pointerDownClientY = 0;

  private readonly currentCameraPose: CameraFocusPose = { ...DEFAULT_CAMERA_POSE };
  private cameraTween: gsap.core.Tween | null = null;

  private activeConceptIndex = -1;
  private hoveredConceptIndex = -1;
  private lastProjectedCenters: ProjectedGearSystemCenters | null = null;
  private currentPalette: GearVisualPalette;

  private rafId: number | null = null;
  private lastFrameTimeMs = 0;
  private disposed = false;
  private initialized = false;

  private disconnectThemeObserver: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private reducedMotionQuery: MediaQueryList | null = null;

  constructor(options: GearScene3DOptions) {
    this.options = options;
    this.clock = new GearTransmissionClock(DEFAULT_GEAR_SYSTEM_CONFIG);
    this.specs = buildSevenGearSpecs(DEFAULT_GEAR_SYSTEM_CONFIG);
    this.currentPalette = readCurrentDocumentGearPalette();
  }

  public init(): boolean {
    if (this.initialized || this.disposed) {
      return this.initialized;
    }

    const { canvas } = this.options;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'WebGL initialization failed';
      this.options.onWebGLFallback?.(msg);
      return false;
    }

    this.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
    this.scene = scene;

    // Subtle elevated perspective (FASE 6: "perspectiva ligeramente elevada o frontal con profundidad")
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    this.camera = camera;
    this.applyCameraPose(this.currentCameraPose);

    // Build shared PBR metallic materials
    const p = this.currentPalette;
    this.sharedMaterials = {
      centralBodyMaterial: new THREE.MeshStandardMaterial({
        color: p.centralMetalHex,
        metalness: p.metalness,
        roughness: p.roughness,
      }),
      secondaryBodyMaterial: new THREE.MeshStandardMaterial({
        color: p.secondaryMetalHex,
        metalness: p.metalness,
        roughness: p.roughness + 0.03,
      }),
      collarMaterial: new THREE.MeshStandardMaterial({
        color: p.collarMetalHex,
        metalness: Math.min(0.92, p.metalness + 0.06),
        roughness: Math.max(0.16, p.roughness - 0.05),
      }),
      recessedCoreMaterial: new THREE.MeshStandardMaterial({
        color: p.recessedCoreHex,
        metalness: 0.25,
        roughness: 0.72,
      }),
    };

    // Build 1 central gear + 6 secondary gears
    const centralBundle = createGearMeshBundle(
      this.specs.central,
      this.sharedMaterials,
      p.accentBrightHex
    );
    this.centralBundle = centralBundle;
    scene.add(centralBundle.rootGroup);

    this.secondaryBundles = this.specs.secondaries.map((spec) => {
      const bundle = createGearMeshBundle(spec, this.sharedMaterials!, p.accentHex);
      scene.add(bundle.rootGroup);
      return bundle;
    });

    this.allBundles = [centralBundle, ...this.secondaryBundles];
    this.hitTargets = this.allBundles.map((b) => b.hitTargetMesh);

    // Studio 3-point + core accent lighting matching the reference image
    this.ambientLight = new THREE.AmbientLight(p.ambientLightHex, 1.35);
    scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(p.keyLightHex, 2.5);
    this.keyLight.position.set(-3.2, 4.4, 6.2);
    scene.add(this.keyLight);

    this.warmRimLight = new THREE.DirectionalLight(p.warmRimLightHex, 1.65);
    this.warmRimLight.position.set(3.8, -3.5, 4.0);
    scene.add(this.warmRimLight);

    this.coolRimLight = new THREE.PointLight(p.coolRimLightHex, 4.2, 14, 1.4);
    this.coolRimLight.position.set(-2.6, 2.8, 3.4);
    scene.add(this.coolRimLight);

    this.corePointLight = new THREE.PointLight(p.accentBrightHex, 3.6, 9, 1.5);
    this.corePointLight.position.set(0, 0, 2.2);
    scene.add(this.corePointLight);

    this.setupListeners();
    this.updateSize();
    this.projectAndNotifyCenters();
    this.renderSingleFrame(0);

    this.initialized = true;
    this.lastFrameTimeMs = performance.now();
    this.startLoop();
    this.notifyMotionState();

    return true;
  }

  private applyCameraPose(pose: CameraFocusPose): void {
    if (!this.camera) return;
    this.camera.position.set(pose.positionX, pose.positionY, pose.positionZ);
    this.camera.lookAt(pose.lookAtX, pose.lookAtY, pose.lookAtZ);
    this.camera.updateMatrixWorld();
  }

  private setupListeners(): void {
    const { canvas, container } = this.options;

    // 1. Theme & palette observer
    this.disconnectThemeObserver = observeDocumentGearPalette((palette) => {
      this.applyPalette(palette);
    });

    // 2. Reduced motion preference
    if (typeof window.matchMedia === 'function') {
      this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.clock.setReducedMotion(this.reducedMotionQuery.matches);
      this.reducedMotionQuery.addEventListener('change', this.handleReducedMotionChange);
    }

    // 3. Resize observer on container
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateSize();
        this.projectAndNotifyCenters();
        this.renderSingleFrame(0);
      });
      this.resizeObserver.observe(container);
    }
    window.addEventListener('resize', this.handleWindowResize, { passive: true });

    // 4. IntersectionObserver to pause off-screen rendering
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.clock.setViewportPaused(!entry.isIntersecting);
          }
          this.syncLoopWithClock();
        },
        { threshold: 0.05 }
      );
      this.intersectionObserver.observe(container);
    }

    // 5. Document visibility change
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // 6. Pointer interaction on canvas
    canvas.addEventListener('pointerdown', this.handlePointerDown, { passive: true });
    canvas.addEventListener('pointerup', this.handlePointerUp, { passive: true });
    canvas.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    canvas.addEventListener('pointerleave', this.handlePointerLeave, { passive: true });

    // 7. WebGL context loss / restoration
    canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);
  }

  private readonly handleReducedMotionChange = (e: MediaQueryListEvent): void => {
    this.clock.setReducedMotion(e.matches);
    this.syncLoopWithClock();
    this.notifyMotionState();
    this.renderSingleFrame(0);
  };

  private readonly handleWindowResize = (): void => {
    this.updateSize();
    this.projectAndNotifyCenters();
    this.renderSingleFrame(0);
  };

  private readonly handleVisibilityChange = (): void => {
    this.clock.setTabHiddenPaused(document.hidden);
    if (!document.hidden) {
      this.lastFrameTimeMs = performance.now();
    }
    this.syncLoopWithClock();
  };

  private readonly handlePointerDown = (e: PointerEvent): void => {
    this.pointerDownClientX = e.clientX;
    this.pointerDownClientY = e.clientY;
  };

  private readonly handlePointerUp = (e: PointerEvent): void => {
    if (
      !isGenuinePointerClick(
        this.pointerDownClientX,
        this.pointerDownClientY,
        e.clientX,
        e.clientY
      )
    ) {
      return;
    }
    const hitIndex = this.raycastGearAtClientPoint(e.clientX, e.clientY);
    if (hitIndex >= 0 && hitIndex < 6) {
      this.options.onSelectConcept(hitIndex);
    }
  };

  private readonly handlePointerMove = (e: PointerEvent): void => {
    const hitIndex = this.raycastGearAtClientPoint(e.clientX, e.clientY);
    this.setHoveredConcept(hitIndex);
    this.options.canvas.style.cursor = hitIndex >= 0 && hitIndex < 6 ? 'pointer' : 'default';
  };

  private readonly handlePointerLeave = (): void => {
    this.setHoveredConcept(-1);
    this.options.canvas.style.cursor = 'default';
  };

  private readonly handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.stopLoop();
  };

  private readonly handleContextRestored = (): void => {
    this.lastFrameTimeMs = performance.now();
    this.renderSingleFrame(0);
    this.startLoop();
  };

  private raycastGearAtClientPoint(clientX: number, clientY: number): number {
    if (!this.camera || this.hitTargets.length === 0) {
      return -1;
    }
    const rect = this.options.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return -1;
    }
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitTargets, false);
    if (hits.length === 0) {
      return -1;
    }
    const userData = hits[0].object.userData;
    if (userData && typeof userData.gearIndex === 'number') {
      return userData.gearIndex === -1 ? -2 : userData.gearIndex;
    }
    return -1;
  }

  public setHoveredConcept(index: number): void {
    if (this.hoveredConceptIndex === index) {
      return;
    }
    this.hoveredConceptIndex = index;
    this.applyHighlightStates();
    this.options.onHoverConcept?.(index);
    if (!this.clock.isRunning()) {
      this.renderSingleFrame(0);
    }
  }

  public setActiveConcept(index: number): void {
    const nextIndex = index >= 0 && index < 6 ? index : -1;
    this.activeConceptIndex = nextIndex;
    this.applyHighlightStates();

    // Subtle bounded camera focus using GSAP (never touches gear rotation!)
    const targetPose = computeCameraFocusPose(nextIndex);
    this.cameraTween?.kill();
    this.cameraTween = gsap.to(this.currentCameraPose, {
      positionX: targetPose.positionX,
      positionY: targetPose.positionY,
      positionZ: targetPose.positionZ,
      lookAtX: targetPose.lookAtX,
      lookAtY: targetPose.lookAtY,
      lookAtZ: targetPose.lookAtZ,
      duration: 0.65,
      ease: 'power2.out',
      onUpdate: () => {
        this.applyCameraPose(this.currentCameraPose);
        this.projectAndNotifyCenters();
        if (!this.clock.isRunning()) {
          this.renderSingleFrame(0);
        }
      },
    });

    if (!this.clock.isRunning()) {
      this.renderSingleFrame(0);
    }
  }

  public toggleUserPause(): boolean {
    const paused = this.clock.toggleUserPaused();
    this.syncLoopWithClock();
    this.notifyMotionState();
    this.renderSingleFrame(0);
    return paused;
  }

  public setUserPaused(paused: boolean): void {
    this.clock.setUserPaused(paused);
    this.syncLoopWithClock();
    this.notifyMotionState();
    this.renderSingleFrame(0);
  }

  public setCaptureFreeze(frozen: boolean): void {
    if (frozen) {
      this.stopLoop();
      this.renderSingleFrame(0);
    } else {
      this.syncLoopWithClock();
    }
  }

  private syncLoopWithClock(): void {
    if (this.isRunning()) {
      this.lastFrameTimeMs = performance.now();
      this.startLoop();
    } else {
      this.stopLoop();
    }
  }

  public isRunning(): boolean {
    if (this.reducedMotionQuery) {
      this.clock.setReducedMotion(this.reducedMotionQuery.matches);
    }
    return this.clock.isRunning();
  }

  public isUserPaused(): boolean {
    return this.clock.isUserPaused();
  }

  private notifyMotionState(): void {
    this.options.onMotionStateChange?.(this.clock.isRunning(), this.clock.isUserPaused());
  }

  private applyPalette(palette: GearVisualPalette): void {
    this.currentPalette = palette;
    if (!this.sharedMaterials) return;

    this.sharedMaterials.centralBodyMaterial.color.setHex(palette.centralMetalHex);
    this.sharedMaterials.centralBodyMaterial.metalness = palette.metalness;
    this.sharedMaterials.centralBodyMaterial.roughness = palette.roughness;

    this.sharedMaterials.secondaryBodyMaterial.color.setHex(palette.secondaryMetalHex);
    this.sharedMaterials.secondaryBodyMaterial.metalness = palette.metalness;
    this.sharedMaterials.secondaryBodyMaterial.roughness = palette.roughness + 0.03;

    this.sharedMaterials.collarMaterial.color.setHex(palette.collarMetalHex);
    this.sharedMaterials.recessedCoreMaterial.color.setHex(palette.recessedCoreHex);

    this.ambientLight?.color.setHex(palette.ambientLightHex);
    this.keyLight?.color.setHex(palette.keyLightHex);
    this.warmRimLight?.color.setHex(palette.warmRimLightHex);
    this.coolRimLight?.color.setHex(palette.coolRimLightHex);
    this.corePointLight?.color.setHex(palette.accentBrightHex);

    this.applyHighlightStates();
    if (!this.clock.isRunning()) {
      this.renderSingleFrame(0);
    }
  }

  private applyHighlightStates(): void {
    const map = computeGearHighlightMap(this.activeConceptIndex, this.hoveredConceptIndex);
    const p = this.currentPalette;

    if (this.centralBundle) {
      const isCentralHighlighted = map.centralState === 'hovered' || map.activeIndex !== -1;
      this.centralBundle.innerGlowMaterial.color.setHex(p.accentBrightHex);
      this.centralBundle.innerGlowMaterial.opacity = isCentralHighlighted ? 1.0 : 0.9;
      this.centralBundle.selectionHaloMaterial.color.setHex(p.accentBrightHex);
      this.centralBundle.selectionHaloMaterial.opacity = isCentralHighlighted ? 0.24 : 0.15;
    }

    for (let i = 0; i < this.secondaryBundles.length; i++) {
      const bundle = this.secondaryBundles[i];
      const state = map.secondaryStates[i];

      let glowColor = p.accentHex;
      let glowOpacity = 0.78;
      let haloOpacity = 0.08;
      let targetZ = 0;

      if (state === 'active') {
        glowColor = p.accentBrightHex;
        glowOpacity = 1.0;
        haloOpacity = 0.36;
        targetZ = 0.16;
      } else if (state === 'hovered') {
        glowColor = p.accentBrightHex;
        glowOpacity = 0.96;
        haloOpacity = 0.26;
        targetZ = 0.08;
      } else if (state === 'connected') {
        glowColor = p.accentBrightHex;
        glowOpacity = 0.88;
        haloOpacity = 0.18;
        targetZ = 0.05;
      } else if (state === 'dimmed') {
        glowColor = p.accentHex;
        glowOpacity = 0.34;
        haloOpacity = 0.02;
        targetZ = -0.06;
      }

      bundle.innerGlowMaterial.color.setHex(glowColor);
      bundle.innerGlowMaterial.opacity = glowOpacity;
      bundle.selectionHaloMaterial.color.setHex(glowColor);
      bundle.selectionHaloMaterial.opacity = haloOpacity;

      gsap.to(bundle.rootGroup.position, {
        z: targetZ,
        duration: 0.42,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  }

  public updateSize(): void {
    if (!this.renderer || !this.camera) return;
    const rect = this.options.container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;

    // Adapt field-of-view on narrower/portrait containers so all 7 gears fit comfortably
    if (this.camera.aspect < 0.85) {
      this.camera.fov = 47;
    } else if (this.camera.aspect < 1.0) {
      this.camera.fov = 42;
    } else {
      this.camera.fov = 38;
    }
    this.camera.updateProjectionMatrix();
  }

  /**
   * Projects the 3D hub centers of the central gear and 6 secondary gears
   * into 2D container percentage coordinates (0..100%) for exact HTML/SVG alignment.
   */
  public projectAndNotifyCenters(): ProjectedGearSystemCenters | null {
    if (!this.camera) return null;
    this.camera.updateMatrixWorld();

    const projectSpec = (spec: GearMechanicalSpec): ProjectedGearCenter => {
      const worldPos = new THREE.Vector3(spec.centerX, spec.centerY, spec.thickness * 0.25);
      worldPos.project(this.camera!);
      const xPercent = (worldPos.x * 0.5 + 0.5) * 100;
      const yPercent = (-worldPos.y * 0.5 + 0.5) * 100;
      return {
        id: spec.id,
        index: spec.index,
        xPercent: Number(xPercent.toFixed(3)),
        yPercent: Number(yPercent.toFixed(3)),
      };
    };

    const projected: ProjectedGearSystemCenters = {
      central: projectSpec(this.specs.central),
      secondaries: this.specs.secondaries.map(projectSpec),
    };

    this.lastProjectedCenters = projected;
    this.options.onCentersProjected?.(projected);
    return projected;
  }

  private startLoop(): void {
    if (this.rafId !== null || this.disposed || !this.isRunning()) return;
    const tick = (nowMs: number) => {
      if (this.disposed || !this.isRunning()) {
        this.rafId = null;
        return;
      }
      const deltaSeconds = Math.max(0, (nowMs - this.lastFrameTimeMs) / 1000);
      this.lastFrameTimeMs = nowMs;

      this.renderSingleFrame(deltaSeconds);
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public renderSingleFrame(deltaSeconds: number): void {
    if (!this.renderer || !this.scene || !this.camera || !this.centralBundle) {
      return;
    }

    if (this.reducedMotionQuery) {
      this.clock.setReducedMotion(this.reducedMotionQuery.matches);
    }

    const stepResult = this.clock.step(deltaSeconds);

    // Single authoritative rotation assignment (FASE 3)
    this.centralBundle.rotatorGroup.rotation.z = stepResult.centralAngleRad;
    for (let i = 0; i < this.secondaryBundles.length; i++) {
      this.secondaryBundles[i].rotatorGroup.rotation.z = stepResult.secondaryAnglesRad[i];
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Advances simulation deterministically by `seconds` (useful for deterministic testing).
   */
  public advanceBySeconds(seconds: number): void {
    const steps = Math.max(1, Math.ceil(Math.abs(seconds) / 0.05));
    const dt = seconds / steps;
    for (let i = 0; i < steps; i++) {
      this.renderSingleFrame(dt);
    }
  }

  public getSnapshot(): GearSceneDiagnosticSnapshot {
    const stepState = this.clock.step(0);
    return {
      initialized: this.initialized,
      isRunning: this.clock.isRunning(),
      isUserPaused: this.clock.isUserPaused(),
      elapsedSeconds: stepState.elapsedSeconds,
      centralAngleRad: stepState.centralAngleRad,
      secondaryAnglesRad: [...stepState.secondaryAnglesRad],
      activeConceptIndex: this.activeConceptIndex,
      hoveredConceptIndex: this.hoveredConceptIndex,
      gearCount: this.allBundles.length,
      projectedCenters: this.lastProjectedCenters,
    };
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopLoop();
    this.cameraTween?.kill();

    this.disconnectThemeObserver?.();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.reducedMotionQuery?.removeEventListener('change', this.handleReducedMotionChange);
    window.removeEventListener('resize', this.handleWindowResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    const { canvas } = this.options;
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    for (const bundle of this.allBundles) {
      bundle.gearBodyMesh.geometry.dispose();
      bundle.collarMesh.geometry.dispose();
      bundle.recessedCoreMesh.geometry.dispose();
      bundle.innerGlowRingMesh.geometry.dispose();
      bundle.innerGlowMaterial.dispose();
      bundle.selectionHaloMesh.geometry.dispose();
      bundle.selectionHaloMaterial.dispose();
      bundle.hitTargetMesh.geometry.dispose();
      (bundle.hitTargetMesh.material as THREE.Material).dispose();
    }

    if (this.sharedMaterials) {
      this.sharedMaterials.centralBodyMaterial.dispose();
      this.sharedMaterials.secondaryBodyMaterial.dispose();
      this.sharedMaterials.collarMaterial.dispose();
      this.sharedMaterials.recessedCoreMaterial.dispose();
    }

    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}

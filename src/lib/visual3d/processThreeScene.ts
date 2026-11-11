/**
 * OPEX LÍDER — VISUAL-3D-04 (Fase 4 · Capa 3: Escena Three.js)
 * Construye el modelo tridimensional educativo de 4 componentes (Entrada, Actividades de transformación,
 * Salida y el mecanismo transversal conectado de Control y retroalimentación), gestiona selección por
 * Raycaster, OrbitControls con renderizado bajo demanda y proyección de anclajes a etiquetas HTML accesibles.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  PROCESS_ELEMENTS,
  PROCESS_ELEMENT_ORDER,
  OVERVIEW_CAMERA_POSE,
  type ProcessElementId,
} from './processWorkOrderData.ts';
import {
  resolveThreeThemeTokens,
  readDocumentThemeAndAccent,
  observeThemeAndAccentChanges,
  type ThreeThemeTokens,
} from './threeThemeAdapter.ts';
import {
  WebGLLifecycleManager,
  type LifecycleDiagnostics,
} from './webglLifecycleManager.ts';
import {
  ProcessGsapAnimator,
  type SubPartMeshBinding,
} from './processGsapTransitions.ts';

export interface ProjectedAnchor2D {
  id: string;
  elementId: ProcessElementId;
  xPercent: number;
  yPercent: number;
  visible: boolean;
}

export interface ProcessThreeSceneCallbacks {
  onSelectElement: (id: ProcessElementId) => void;
  onUpdateAnchors: (
    elementAnchors: Record<ProcessElementId, ProjectedAnchor2D>,
    subPartAnchors: Record<string, ProjectedAnchor2D>
  ) => void;
  onContextLostChange?: (lost: boolean) => void;
}

export class ProcessThreeSceneController {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private callbacks: ProcessThreeSceneCallbacks;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private lifecycle: WebGLLifecycleManager;
  private animator: ProcessGsapAnimator;

  private ambientLight: THREE.AmbientLight;
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private floorGrid: THREE.GridHelper | null = null;

  private elementGroups = new Map<ProcessElementId, THREE.Group>();
  private subPartBindings: SubPartMeshBinding[] = [];
  private subPartByElement = new Map<ProcessElementId, SubPartMeshBinding[]>();
  private pickableMeshes: THREE.Object3D[] = [];

  private accentMaterials = new Map<ProcessElementId, THREE.MeshStandardMaterial>();
  private baseMaterials = new Map<ProcessElementId, THREE.MeshStandardMaterial>();
  private coreMaterials = new Map<ProcessElementId, THREE.MeshStandardMaterial>();
  private connectorMaterial: THREE.MeshStandardMaterial;
  private feedbackBridgeMaterial: THREE.MeshStandardMaterial;

  private selectedId: ProcessElementId | null = null;
  private isExploded = false;
  private stopThemeObserver: (() => void) | null = null;

  private raycaster = new THREE.Raycaster();
  private pointerDownPos = { x: 0, y: 0 };
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    callbacks: ProcessThreeSceneCallbacks
  ) {
    this.container = container;
    this.canvas = canvas;
    this.callbacks = callbacks;

    const { theme, accent } = readDocumentThemeAndAccent();
    const tokens = resolveThreeThemeTokens(theme, accent);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(tokens.sceneBackground);

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width || 860));
    const height = Math.max(1, Math.floor(rect.height || 480));

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(...OVERVIEW_CAMERA_POSE.position);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);

    this.ambientLight = new THREE.AmbientLight(
      tokens.ambientLightColor,
      tokens.ambientIntensity
    );
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(
      tokens.dirLightColor,
      tokens.dirIntensity
    );
    this.keyLight.position.set(7, 12, 9);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(tokens.accentHighlight, 0.65);
    this.fillLight.position.set(-8, 5, -6);
    this.scene.add(this.fillLight);

    this.connectorMaterial = new THREE.MeshStandardMaterial({
      color: tokens.accentPrimary,
      roughness: 0.35,
      metalness: 0.25,
    });

    this.feedbackBridgeMaterial = new THREE.MeshStandardMaterial({
      color: tokens.feedbackColor,
      roughness: 0.3,
      metalness: 0.2,
    });

    this.buildFloorGrid(tokens);
    this.buildProcessGeometry(tokens);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(...OVERVIEW_CAMERA_POSE.target);
    this.controls.enableDamping = false;
    this.controls.minDistance = 4.2;
    this.controls.maxDistance = 19.5;
    this.controls.maxPolarAngle = Math.PI * 0.62;
    this.controls.minPolarAngle = Math.PI * 0.12;
    this.controls.update();

    this.lifecycle = new WebGLLifecycleManager({
      container: this.container,
      canvas: this.canvas,
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      onAfterRenderFrame: () => {
        this.projectAnchorsToScreen();
      },
      onContextLostChange: (lost) => {
        this.callbacks.onContextLostChange?.(lost);
      },
    });

    this.animator = new ProcessGsapAnimator(this.lifecycle);

    this.controls.addEventListener('change', () => {
      this.lifecycle.requestRender();
    });

    this.boundPointerDown = (e: PointerEvent) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    this.boundPointerUp = (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - this.pointerDownPos.x);
      const dy = Math.abs(e.clientY - this.pointerDownPos.y);
      if (dx <= 6 && dy <= 6) {
        this.handleCanvasTap(e.clientX, e.clientY);
      }
    };

    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    this.canvas.addEventListener('pointerup', this.boundPointerUp);

    this.stopThemeObserver = observeThemeAndAccentChanges((newTokens) => {
      this.applyThemeTokens(newTokens);
    });

    this.lifecycle.requestRender();
  }

  private buildFloorGrid(tokens: ThreeThemeTokens): void {
    if (this.floorGrid) {
      this.scene.remove(this.floorGrid);
      this.floorGrid.geometry.dispose();
      if (Array.isArray(this.floorGrid.material)) {
        this.floorGrid.material.forEach((m) => m.dispose());
      } else {
        this.floorGrid.material.dispose();
      }
    }
    this.floorGrid = new THREE.GridHelper(
      18,
      18,
      tokens.floorGridMain,
      tokens.floorGridSub
    );
    this.floorGrid.position.set(0, -2.55, 0);
    this.scene.add(this.floorGrid);
  }

  private buildProcessGeometry(tokens: ThreeThemeTokens): void {
    // 1. Construir los 4 elementos del sistema
    for (const id of PROCESS_ELEMENT_ORDER) {
      const spec = PROCESS_ELEMENTS[id];
      const group = new THREE.Group();
      group.position.set(...spec.worldPosition);
      group.userData = { elementId: id };

      const isControl = spec.isFeedbackMechanism;
      const baseMat = new THREE.MeshStandardMaterial({
        color: tokens.neutralSurface,
        roughness: 0.45,
        metalness: 0.15,
      });
      const accentMat = new THREE.MeshStandardMaterial({
        color: isControl ? tokens.feedbackColor : tokens.accentPrimary,
        emissive: isControl ? tokens.feedbackEmissive : tokens.accentEmissive,
        emissiveIntensity: 0.18,
        roughness: 0.3,
        metalness: 0.25,
      });
      const coreMat = new THREE.MeshStandardMaterial({
        color: isControl ? tokens.feedbackColor : tokens.accentHighlight,
        emissive: isControl ? tokens.feedbackEmissive : tokens.accentEmissive,
        emissiveIntensity: 0.28,
        roughness: 0.25,
        metalness: 0.3,
      });

      this.baseMaterials.set(id, baseMat);
      this.accentMaterials.set(id, accentMat);
      this.coreMaterials.set(id, coreMat);

      const elementBindings: SubPartMeshBinding[] = [];

      for (const part of spec.subParts) {
        const partMesh = this.createPartMesh(
          part.geometryKind,
          baseMat,
          accentMat,
          coreMat
        );
        partMesh.position.set(...part.assembledOffset);
        partMesh.userData = {
          elementId: id,
          subPartId: part.id,
          subPartCode: part.code,
        };
        partMesh.traverse((child) => {
          child.userData = {
            elementId: id,
            subPartId: part.id,
            subPartCode: part.code,
          };
          if ((child as THREE.Mesh).isMesh) {
            this.pickableMeshes.push(child);
          }
        });

        group.add(partMesh);
        const binding: SubPartMeshBinding = { spec: part, mesh: partMesh };
        this.subPartBindings.push(binding);
        elementBindings.push(binding);
      }

      this.subPartByElement.set(id, elementBindings);
      this.elementGroups.set(id, group);
      this.scene.add(group);
    }

    // 2. Conectores de flujo directo: Entrada -> Transformación y Transformación -> Salida
    const directFlowGroup = new THREE.Group();
    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.9, 16);
    pipeGeo.rotateZ(Math.PI / 2);

    const pipe1 = new THREE.Mesh(pipeGeo, this.connectorMaterial);
    pipe1.position.set(-2.2, 0.35, 0);
    directFlowGroup.add(pipe1);

    const pipe2 = new THREE.Mesh(pipeGeo, this.connectorMaterial);
    pipe2.position.set(2.2, 0.35, 0);
    directFlowGroup.add(pipe2);

    const arrowGeo = new THREE.ConeGeometry(0.18, 0.38, 16);
    arrowGeo.rotateZ(-Math.PI / 2);

    const arrow1 = new THREE.Mesh(arrowGeo, this.connectorMaterial);
    arrow1.position.set(-1.35, 0.35, 0);
    directFlowGroup.add(arrow1);

    const arrow2 = new THREE.Mesh(arrowGeo, this.connectorMaterial);
    arrow2.position.set(3.05, 0.35, 0);
    directFlowGroup.add(arrow2);

    this.scene.add(directFlowGroup);

    // 3. Acoplamientos verticales del mecanismo conectado de Control y Retroalimentación
    // Conecta físicamente Salida (X = +4.4) -> Puente de Control (Y = -1.75) -> Transformación (X = 0) y Entrada (X = -4.4)
    const feedbackSpanGeo = new THREE.BoxGeometry(8.9, 0.14, 0.22);
    const feedbackSpan = new THREE.Mesh(
      feedbackSpanGeo,
      this.feedbackBridgeMaterial
    );
    feedbackSpan.position.set(0, -1.75, 0.65);
    feedbackSpan.userData = { elementId: 'control' };
    this.pickableMeshes.push(feedbackSpan);
    this.scene.add(feedbackSpan);

    const riserGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.65, 12);
    for (const xPos of [-4.4, 0, 4.4]) {
      const riser = new THREE.Mesh(riserGeo, this.feedbackBridgeMaterial);
      riser.position.set(xPos, -0.82, 0.32);
      riser.rotation.x = -0.35;
      riser.userData = { elementId: 'control' };
      this.pickableMeshes.push(riser);
      this.scene.add(riser);
    }
  }

  private createPartMesh(
    kind: string,
    baseMat: THREE.Material,
    accentMat: THREE.Material,
    coreMat: THREE.Material
  ): THREE.Object3D {
    const holder = new THREE.Group();

    if (kind === 'plate') {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.28, 1.65), baseMat);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.08, 1.72), accentMat);
      rim.position.y = -0.12;
      holder.add(mesh, rim);
      return holder;
    }

    if (kind === 'module') {
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 1.12), accentMat);
      const header = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.14, 1.15), coreMat);
      header.position.y = 0.28;
      holder.add(card, header);
      return holder;
    }

    if (kind === 'core') {
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.46, 0),
        coreMat
      );
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.58, 0.055, 12, 32),
        accentMat
      );
      ring.rotation.x = Math.PI / 2;
      holder.add(core, ring);
      return holder;
    }

    if (kind === 'gate') {
      const leftPillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.88, 0.16),
        accentMat
      );
      leftPillar.position.z = 0.55;
      const rightPillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.88, 0.16),
        accentMat
      );
      rightPillar.position.z = -0.55;
      const topBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.16, 1.32),
        coreMat
      );
      topBar.position.y = 0.42;
      holder.add(leftPillar, rightPillar, topBar);
      return holder;
    }

    if (kind === 'sensor') {
      const node = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.34, 0.36, 18),
        coreMat
      );
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        accentMat
      );
      beacon.position.y = 0.26;
      holder.add(node, beacon);
      return holder;
    }

    // 'bridge'
    const consoleBox = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.42, 0.92),
      baseMat
    );
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.14, 0.65),
      coreMat
    );
    screen.position.y = 0.22;
    holder.add(consoleBox, screen);
    return holder;
  }

  private handleCanvasTap(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const hits = this.raycaster.intersectObjects(this.pickableMeshes, true);
    if (hits.length > 0) {
      const hitObj = hits[0].object;
      const elementId = hitObj.userData?.elementId as ProcessElementId | undefined;
      if (elementId && elementId in PROCESS_ELEMENTS) {
        this.callbacks.onSelectElement(elementId);
      }
    }
  }

  applyThemeTokens(tokens: ThreeThemeTokens): void {
    this.scene.background = new THREE.Color(tokens.sceneBackground);
    this.ambientLight.color.setHex(tokens.ambientLightColor);
    this.ambientLight.intensity = tokens.ambientIntensity;
    this.keyLight.color.setHex(tokens.dirLightColor);
    this.keyLight.intensity = tokens.dirIntensity;
    this.fillLight.color.setHex(tokens.accentHighlight);

    this.connectorMaterial.color.setHex(tokens.accentPrimary);
    this.feedbackBridgeMaterial.color.setHex(tokens.feedbackColor);

    this.buildFloorGrid(tokens);
    this.syncVisualSelectionHighlights(tokens);
    this.lifecycle.requestRender();
  }

  private syncVisualSelectionHighlights(tokens?: ThreeThemeTokens): void {
    const activeTokens =
      tokens ??
      resolveThreeThemeTokens(
        readDocumentThemeAndAccent().theme,
        readDocumentThemeAndAccent().accent
      );

    for (const id of PROCESS_ELEMENT_ORDER) {
      const isSelected = this.selectedId === id;
      const isAnySelected = this.selectedId !== null;
      const isControl = PROCESS_ELEMENTS[id].isFeedbackMechanism;

      const baseMat = this.baseMaterials.get(id);
      const accentMat = this.accentMaterials.get(id);
      const coreMat = this.coreMaterials.get(id);

      if (baseMat) {
        baseMat.color.setHex(
          isSelected ? activeTokens.neutralSubtle : activeTokens.neutralSurface
        );
      }
      if (accentMat) {
        accentMat.color.setHex(
          isControl ? activeTokens.feedbackColor : activeTokens.accentPrimary
        );
        accentMat.emissive.setHex(
          isControl ? activeTokens.feedbackEmissive : activeTokens.accentEmissive
        );
        accentMat.emissiveIntensity = isSelected
          ? 0.52
          : isAnySelected
          ? 0.1
          : 0.22;
      }
      if (coreMat) {
        coreMat.color.setHex(
          isControl ? activeTokens.feedbackColor : activeTokens.accentHighlight
        );
        coreMat.emissive.setHex(
          isControl ? activeTokens.feedbackEmissive : activeTokens.accentEmissive
        );
        coreMat.emissiveIntensity = isSelected ? 0.65 : 0.28;
      }
    }
  }

  async syncState(
    selectedId: ProcessElementId | null,
    isExploded: boolean,
    targetPose: { position: [number, number, number]; target: [number, number, number] },
    reducedMotion: boolean
  ): Promise<void> {
    this.selectedId = selectedId;
    this.isExploded = isExploded;
    this.syncVisualSelectionHighlights();

    const shouldExplodeIds = new Set<string>();
    if (isExploded) {
      const targetElements = selectedId ? [selectedId] : PROCESS_ELEMENT_ORDER;
      for (const elId of targetElements) {
        const bindings = this.subPartByElement.get(elId) || [];
        for (const b of bindings) {
          shouldExplodeIds.add(b.spec.id);
        }
      }
    }

    await Promise.all([
      this.animator.animateCameraToPose(
        this.camera,
        this.controls.target,
        targetPose,
        reducedMotion,
        () => this.controls.update()
      ),
      this.animator.animateSubPartsExplode(
        this.subPartBindings,
        shouldExplodeIds,
        reducedMotion
      ),
    ]);
  }

  private projectAnchorsToScreen(): void {
    const elementAnchors = {} as Record<ProcessElementId, ProjectedAnchor2D>;
    const subPartAnchors: Record<string, ProjectedAnchor2D> = {};

    for (const id of PROCESS_ELEMENT_ORDER) {
      const spec = PROCESS_ELEMENTS[id];
      const worldVec = new THREE.Vector3(
        spec.worldPosition[0],
        spec.worldPosition[1] + (spec.isFeedbackMechanism ? -0.55 : 1.25),
        spec.worldPosition[2]
      );
      elementAnchors[id] = this.projectVector(id, id, worldVec);
    }

    if (this.isExploded) {
      const targetElements = this.selectedId
        ? [this.selectedId]
        : PROCESS_ELEMENT_ORDER;
      for (const elId of targetElements) {
        const spec = PROCESS_ELEMENTS[elId];
        for (const part of spec.subParts) {
          const worldVec = new THREE.Vector3(
            spec.worldPosition[0] + part.labelAnchorOffset[0],
            spec.worldPosition[1] + part.labelAnchorOffset[1],
            spec.worldPosition[2] + part.labelAnchorOffset[2]
          );
          subPartAnchors[part.id] = this.projectVector(part.id, elId, worldVec);
        }
      }
    }

    this.callbacks.onUpdateAnchors(elementAnchors, subPartAnchors);
  }

  private projectVector(
    id: string,
    elementId: ProcessElementId,
    worldVec: THREE.Vector3
  ): ProjectedAnchor2D {
    const projected = worldVec.clone().project(this.camera);
    const xPercent = ((projected.x + 1) / 2) * 100;
    const yPercent = ((-projected.y + 1) / 2) * 100;
    const visible =
      projected.z >= -1 &&
      projected.z <= 1 &&
      xPercent >= 2 &&
      xPercent <= 98 &&
      yPercent >= 4 &&
      yPercent <= 96;

    return {
      id,
      elementId,
      xPercent: Math.round(xPercent * 10) / 10,
      yPercent: Math.round(yPercent * 10) / 10,
      visible,
    };
  }

  getDiagnostics(): LifecycleDiagnostics {
    return this.lifecycle.getDiagnostics();
  }

  dispose(): LifecycleDiagnostics {
    this.stopThemeObserver?.();
    this.stopThemeObserver = null;
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointerup', this.boundPointerUp);
    this.animator.dispose();
    this.controls.dispose();
    return this.lifecycle.dispose();
  }
}

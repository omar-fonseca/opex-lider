/**
 * OPEX LÍDER — VISUAL-3D-04 (Fase 4 · Capa 4: Transiciones Espaciales GSAP)
 * Gestiona el enfoque de cámara hacia cada elemento del proceso y el despiece espacial
 * de sub-componentes, respetando prefers-reduced-motion y activando el bucle WebGL
 * únicamente mientras dura la transición.
 */

import { gsap } from 'gsap';
import type * as THREE from 'three';
import type { CameraPose, ExplodedSubPart } from './processWorkOrderData.ts';
import type { WebGLLifecycleManager } from './webglLifecycleManager.ts';

export interface SubPartMeshBinding {
  spec: ExplodedSubPart;
  mesh: THREE.Object3D;
}

export class ProcessGsapAnimator {
  private lifecycle: WebGLLifecycleManager;
  private activeCameraTimeline: gsap.core.Timeline | null = null;
  private activeExplodeTimeline: gsap.core.Timeline | null = null;

  constructor(lifecycle: WebGLLifecycleManager) {
    this.lifecycle = lifecycle;
  }

  animateCameraToPose(
    camera: THREE.PerspectiveCamera,
    controlsTarget: THREE.Vector3,
    pose: CameraPose,
    reducedMotion: boolean,
    onUpdate?: () => void
  ): Promise<void> {
    if (this.activeCameraTimeline) {
      this.activeCameraTimeline.kill();
      this.activeCameraTimeline = null;
      this.lifecycle.endActiveTransition();
    }

    const [px, py, pz] = pose.position;
    const [tx, ty, tz] = pose.target;

    if (reducedMotion) {
      camera.position.set(px, py, pz);
      controlsTarget.set(tx, ty, tz);
      camera.lookAt(controlsTarget);
      onUpdate?.();
      this.lifecycle.requestRender();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.lifecycle.beginActiveTransition();
      const tl = gsap.timeline({
        defaults: { duration: 0.68, ease: 'power3.out' },
        onUpdate: () => {
          camera.lookAt(controlsTarget);
          onUpdate?.();
          this.lifecycle.requestRender();
        },
        onComplete: () => {
          this.activeCameraTimeline = null;
          this.lifecycle.endActiveTransition();
          resolve();
        },
      });

      tl.to(camera.position, { x: px, y: py, z: pz }, 0);
      tl.to(controlsTarget, { x: tx, y: ty, z: tz }, 0);
      this.activeCameraTimeline = tl;
    });
  }

  animateSubPartsExplode(
    bindings: SubPartMeshBinding[],
    shouldExplodeIds: Set<string>,
    reducedMotion: boolean,
    onUpdate?: () => void
  ): Promise<void> {
    if (this.activeExplodeTimeline) {
      this.activeExplodeTimeline.kill();
      this.activeExplodeTimeline = null;
      this.lifecycle.endActiveTransition();
    }

    if (reducedMotion) {
      for (const b of bindings) {
        const targetOffset = shouldExplodeIds.has(b.spec.id)
          ? b.spec.explodedOffset
          : b.spec.assembledOffset;
        b.mesh.position.set(targetOffset[0], targetOffset[1], targetOffset[2]);
      }
      onUpdate?.();
      this.lifecycle.requestRender();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.lifecycle.beginActiveTransition();
      const tl = gsap.timeline({
        defaults: { duration: 0.55, ease: 'back.out(1.25)' },
        onUpdate: () => {
          onUpdate?.();
          this.lifecycle.requestRender();
        },
        onComplete: () => {
          this.activeExplodeTimeline = null;
          this.lifecycle.endActiveTransition();
          resolve();
        },
      });

      bindings.forEach((b, idx) => {
        const targetOffset = shouldExplodeIds.has(b.spec.id)
          ? b.spec.explodedOffset
          : b.spec.assembledOffset;
        tl.to(
          b.mesh.position,
          {
            x: targetOffset[0],
            y: targetOffset[1],
            z: targetOffset[2],
          },
          idx * 0.03
        );
      });

      this.activeExplodeTimeline = tl;
    });
  }

  dispose(): void {
    if (this.activeCameraTimeline) {
      this.activeCameraTimeline.kill();
      this.activeCameraTimeline = null;
    }
    if (this.activeExplodeTimeline) {
      this.activeExplodeTimeline.kill();
      this.activeExplodeTimeline = null;
    }
  }
}

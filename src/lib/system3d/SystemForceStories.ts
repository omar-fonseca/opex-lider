/**
 * Timelines GSAP educativas por fuerza.
 * Una sola propiedad animada por timeline activo; cancelación limpia al cambiar.
 */
import gsap from 'gsap';
import type * as THREE from 'three';
import type { ForceId } from './SystemEducationalData.ts';
import type { ForcePlatformBundle, SystemGeometryWorld } from './SystemGeometry.ts';
import { prefersReducedMotion } from '../presentationEngine.ts';

export interface StoryPlaybackCallbacks {
  onBeat?: (forceId: ForceId, beatIndex: number, label: string) => void;
  onComplete?: (forceId: ForceId) => void;
}

function reveal(obj: THREE.Object3D | undefined, duration = 0.35): gsap.core.Tween | null {
  if (!obj) return null;
  obj.visible = true;
  return gsap.fromTo(
    obj.scale,
    { x: 0.001, y: 0.001, z: 0.001 },
    { x: 1, y: 1, z: 1, duration, ease: 'back.out(1.6)' }
  );
}

function hide(obj: THREE.Object3D | undefined): void {
  if (!obj) return;
  obj.visible = false;
  obj.scale.setScalar(0.001);
}

function resetForceStoryVisuals(bundle: ForcePlatformBundle): void {
  Object.values(bundle.storyNodes).forEach((node) => {
    if (
      node.name === '' &&
      (node === bundle.storyNodes.warning ||
        node === bundle.storyNodes.commBeam ||
        node === bundle.storyNodes.token ||
        node === bundle.storyNodes.reviewFlag ||
        node === bundle.storyNodes.checkA ||
        node === bundle.storyNodes.checkB ||
        node === bundle.storyNodes.deviation ||
        node === bundle.storyNodes.hypothesis ||
        node === bundle.storyNodes.proposal)
    ) {
      hide(node);
    }
  });
  hide(bundle.storyNodes.warning);
  hide(bundle.storyNodes.commBeam);
  hide(bundle.storyNodes.token);
  hide(bundle.storyNodes.reviewFlag);
  hide(bundle.storyNodes.checkA);
  hide(bundle.storyNodes.checkB);
  hide(bundle.storyNodes.deviation);
  hide(bundle.storyNodes.hypothesis);
  hide(bundle.storyNodes.proposal);

  const observer = bundle.storyNodes.observer as THREE.Object3D | undefined;
  if (observer) {
    observer.rotation.y = 0.35;
    const head = observer.userData.head as THREE.Object3D | undefined;
    if (head) head.rotation.set(0, 0, 0);
  }
  const partner = bundle.storyNodes.partner as THREE.Object3D | undefined;
  if (partner) partner.rotation.y = -0.55;
  const teammate = bundle.storyNodes.teammate as THREE.Object3D | undefined;
  if (teammate) teammate.rotation.y = 0.55;
  const leader = bundle.storyNodes.leader as THREE.Object3D | undefined;
  if (leader) leader.rotation.y = -0.7;
}

export class SystemForceStoryDirector {
  private timeline: gsap.core.Timeline | null = null;
  private activeForce: ForceId | null = null;
  private pausedByUser = false;

  constructor(private readonly world: SystemGeometryWorld) {}

  public isPlaying(): boolean {
    return Boolean(this.timeline && this.timeline.isActive() && !this.timeline.paused());
  }

  public getActiveForce(): ForceId | null {
    return this.activeForce;
  }

  public cancel(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    (Object.keys(this.world.forces) as ForceId[]).forEach((id) => {
      resetForceStoryVisuals(this.world.forces[id]);
    });
    this.activeForce = null;
    this.pausedByUser = false;
  }

  public pause(): void {
    this.pausedByUser = true;
    this.timeline?.pause();
  }

  public resume(): void {
    this.pausedByUser = false;
    this.timeline?.resume();
  }

  public togglePause(): boolean {
    if (!this.timeline) return false;
    if (this.timeline.paused()) {
      this.resume();
      return true;
    }
    this.pause();
    return false;
  }

  public playForce(forceId: ForceId, callbacks: StoryPlaybackCallbacks = {}): void {
    this.cancel();
    this.activeForce = forceId;
    const bundle = this.world.forces[forceId];
    const reduced = prefersReducedMotion();

    if (reduced) {
      this.playReduced(forceId, bundle, callbacks);
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => callbacks.onComplete?.(forceId),
    });
    this.timeline = tl;

    switch (forceId) {
      case 'personas':
        this.buildPersonasStory(tl, bundle, callbacks);
        break;
      case 'procesos':
        this.buildProcesosStory(tl, bundle, callbacks);
        break;
      case 'liderazgo':
        this.buildLiderazgoStory(tl, bundle, callbacks);
        break;
      case 'mejora':
        this.buildMejoraStory(tl, bundle, callbacks);
        break;
    }
  }

  private playReduced(
    forceId: ForceId,
    bundle: ForcePlatformBundle,
    callbacks: StoryPlaybackCallbacks
  ): void {
    if (forceId === 'personas') {
      reveal(bundle.storyNodes.warning, 0.01);
      reveal(bundle.storyNodes.commBeam, 0.01);
      callbacks.onBeat?.(forceId, 2, 'Comunica la situación');
    } else if (forceId === 'procesos') {
      reveal(bundle.storyNodes.token, 0.01);
      const token = bundle.storyNodes.token;
      if (token) token.position.set(0.33, 0.55, 0.05);
      reveal(bundle.storyNodes.reviewFlag, 0.01);
      callbacks.onBeat?.(forceId, 2, 'Punto de revisión');
    } else if (forceId === 'liderazgo') {
      reveal(bundle.storyNodes.checkA, 0.01);
      reveal(bundle.storyNodes.checkB, 0.01);
      callbacks.onBeat?.(forceId, 3, 'Acuerdan seguimiento');
    } else {
      reveal(bundle.storyNodes.deviation, 0.01);
      reveal(bundle.storyNodes.hypothesis, 0.01);
      reveal(bundle.storyNodes.proposal, 0.01);
      callbacks.onBeat?.(forceId, 3, 'Proponen ajuste');
    }
    callbacks.onComplete?.(forceId);
  }

  private buildPersonasStory(
    tl: gsap.core.Timeline,
    bundle: ForcePlatformBundle,
    callbacks: StoryPlaybackCallbacks
  ): void {
    const observer = bundle.storyNodes.observer;
    const partner = bundle.storyNodes.partner;
    const warning = bundle.storyNodes.warning;
    const commBeam = bundle.storyNodes.commBeam;
    const head = observer?.userData.head as THREE.Object3D | undefined;

    tl.call(() => callbacks.onBeat?.('personas', 0, 'Observa la solicitud'));
    if (head) {
      tl.to(head.rotation, { x: -0.25, y: 0.15, duration: 0.55 }, 0);
    }
    if (observer) {
      tl.to(observer.rotation, { y: 0.15, duration: 0.55 }, 0);
    }

    tl.call(() => callbacks.onBeat?.('personas', 1, 'Detecta una anomalía'));
    if (warning) {
      tl.set(warning, { visible: true });
      tl.fromTo(
        warning.scale,
        { x: 0.001, y: 0.001, z: 0.001 },
        { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(1.8)' }
      );
      tl.to(warning.rotation, { y: `+=${Math.PI * 2}`, duration: 1.2, ease: 'none' }, '<');
    }

    tl.call(() => callbacks.onBeat?.('personas', 2, 'Comunica la situación'), '', '+=0.35');
    if (observer) tl.to(observer.rotation, { y: 0.85, duration: 0.5 });
    if (partner) tl.to(partner.rotation, { y: -1.05, duration: 0.5 }, '<');
    if (commBeam) {
      tl.set(commBeam, { visible: true });
      tl.fromTo(commBeam.scale, { y: 0.001 }, { y: 1, duration: 0.45, ease: 'power2.out' });
    }

    tl.call(() => callbacks.onBeat?.('personas', 3, 'Activa relaciones operacionales'), '', '+=0.25');
    tl.to({}, { duration: 0.6 });
  }

  private buildProcesosStory(
    tl: gsap.core.Timeline,
    bundle: ForcePlatformBundle,
    callbacks: StoryPlaybackCallbacks
  ): void {
    const token = bundle.storyNodes.token;
    const reviewFlag = bundle.storyNodes.reviewFlag;
    const station1 = bundle.storyNodes.station1;
    const station2 = bundle.storyNodes.station2;

    tl.call(() => callbacks.onBeat?.('procesos', 0, 'Aparece la solicitud'));
    if (token) {
      tl.set(token, { visible: true });
      tl.set(token.position, { x: -0.15, y: 0.55, z: 0.15 });
      tl.fromTo(
        token.scale,
        { x: 0.001, y: 0.001, z: 0.001 },
        { x: 1, y: 1, z: 1, duration: 0.35, ease: 'back.out(1.7)' }
      );
    }

    tl.call(() => callbacks.onBeat?.('procesos', 1, 'Avanza entre actividades'), '', '+=0.2');
    if (token) {
      tl.to(token.position, { x: 0.33, z: 0.08, duration: 0.7, ease: 'power1.inOut' });
    }
    if (station1) {
      const screen = station1.userData.screen as THREE.Mesh | undefined;
      if (screen?.material && 'emissiveIntensity' in screen.material) {
        tl.to(screen.material, { emissiveIntensity: 0.9, duration: 0.3 }, '<');
      }
    }

    tl.call(() => callbacks.onBeat?.('procesos', 2, 'Punto de revisión'));
    if (reviewFlag) {
      tl.set(reviewFlag, { visible: true });
      tl.fromTo(
        reviewFlag.scale,
        { x: 0.001, y: 0.001, z: 0.001 },
        { x: 1, y: 1, z: 1, duration: 0.35, ease: 'back.out(1.8)' }
      );
    }

    tl.call(() => callbacks.onBeat?.('procesos', 3, 'Conecta tareas y responsables'), '', '+=0.2');
    if (token) {
      tl.to(token.position, { x: 0.8, z: -0.05, duration: 0.65, ease: 'power1.inOut' });
    }
    if (station2) {
      const screen = station2.userData.screen as THREE.Mesh | undefined;
      if (screen?.material && 'emissiveIntensity' in screen.material) {
        tl.to(screen.material, { emissiveIntensity: 0.95, duration: 0.3 }, '<');
      }
    }
    tl.to({}, { duration: 0.45 });
  }

  private buildLiderazgoStory(
    tl: gsap.core.Timeline,
    bundle: ForcePlatformBundle,
    callbacks: StoryPlaybackCallbacks
  ): void {
    const teammate = bundle.storyNodes.teammate;
    const leader = bundle.storyNodes.leader;
    const checkA = bundle.storyNodes.checkA;
    const checkB = bundle.storyNodes.checkB;
    const priorities = bundle.storyNodes.priorities;

    tl.call(() => callbacks.onBeat?.('liderazgo', 0, 'El equipo comunica'));
    if (teammate) {
      const arm = teammate.userData.armR as THREE.Object3D | undefined;
      if (arm) tl.to(arm.rotation, { x: -1.1, duration: 0.45 });
      tl.to(teammate.rotation, { y: 0.85, duration: 0.45 }, '<');
    }

    tl.call(() => callbacks.onBeat?.('liderazgo', 1, 'El líder observa información'), '', '+=0.15');
    if (leader) tl.to(leader.rotation, { y: -0.35, duration: 0.5 });
    if (priorities) tl.to(priorities.rotation, { x: -0.95, duration: 0.45 }, '<');

    tl.call(() => callbacks.onBeat?.('liderazgo', 2, 'Revisan prioridades'), '', '+=0.1');
    const checkTweenA = reveal(checkA);
    const checkTweenB = reveal(checkB);
    if (checkTweenA) tl.add(checkTweenA);
    if (checkTweenB) tl.add(checkTweenB, '<');

    tl.call(() => callbacks.onBeat?.('liderazgo', 3, 'Acuerdan seguimiento'), '', '+=0.25');
    if (leader) tl.to(leader.rotation, { y: -0.9, duration: 0.4 });
    if (teammate) tl.to(teammate.rotation, { y: 0.35, duration: 0.4 }, '<');
    tl.to({}, { duration: 0.5 });
  }

  private buildMejoraStory(
    tl: gsap.core.Timeline,
    bundle: ForcePlatformBundle,
    callbacks: StoryPlaybackCallbacks
  ): void {
    const deviation = bundle.storyNodes.deviation;
    const hypothesis = bundle.storyNodes.hypothesis;
    const proposal = bundle.storyNodes.proposal;
    const collaborator = bundle.storyNodes.collaborator;
    const board = bundle.storyNodes.board;

    tl.call(() => callbacks.onBeat?.('mejora', 0, 'Aparece la desviación'));
    const deviationTween = reveal(deviation);
    if (deviationTween) tl.add(deviationTween);

    tl.call(() => callbacks.onBeat?.('mejora', 1, 'Examinan evidencia'), '', '+=0.2');
    if (collaborator) tl.to(collaborator.rotation, { y: -0.45, duration: 0.45 });
    if (board) tl.to(board.position, { y: 0.34, duration: 0.4 }, '<');

    tl.call(() => callbacks.onBeat?.('mejora', 2, 'Formulan hipótesis'), '', '+=0.15');
    const hypothesisTween = reveal(hypothesis);
    if (hypothesisTween) tl.add(hypothesisTween);

    tl.call(() => callbacks.onBeat?.('mejora', 3, 'Proponen ajuste'), '', '+=0.2');
    const proposalTween = reveal(proposal);
    if (proposalTween) tl.add(proposalTween);

    tl.call(() => callbacks.onBeat?.('mejora', 4, 'Conectan de vuelta al proceso'), '', '+=0.2');
    if (proposal) {
      tl.to(proposal.position, { x: 1.1, z: 0.45, duration: 0.7, ease: 'power2.inOut' });
    }
    tl.to({}, { duration: 0.4 });
  }
}

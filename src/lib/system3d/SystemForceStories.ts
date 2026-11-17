/**
 * Timelines GSAP educativas por fuerza.
 * Una sola timeline activa; cancelación limpia al cambiar de fuerza.
 * Los gestos usan pivotes articulares (hombros/cabeza/torso) de los personajes procedurales.
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
  if (prefersReducedMotion()) {
    obj.scale.setScalar(1);
    return null;
  }
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
  hide(bundle.storyNodes.warning);
  hide(bundle.storyNodes.commBeam);
  hide(bundle.storyNodes.token);
  hide(bundle.storyNodes.reviewFlag);
  hide(bundle.storyNodes.checkA);
  hide(bundle.storyNodes.checkB);
  hide(bundle.storyNodes.deviation);
  hide(bundle.storyNodes.hypothesis);
  hide(bundle.storyNodes.proposal);

  const resetActor = (actor: THREE.Object3D | undefined, rotY: number) => {
    if (!actor) return;
    actor.rotation.y = rotY;
    const head = actor.userData.head as THREE.Object3D | undefined;
    const torso = actor.userData.torso as THREE.Object3D | undefined;
    const armR = actor.userData.armR as THREE.Object3D | undefined;
    const armL = actor.userData.armL as THREE.Object3D | undefined;
    if (head) head.rotation.set(0, 0, 0);
    if (torso) torso.rotation.set(0, 0, 0);
    if (armR) armR.rotation.set(0, 0, 0);
    if (armL) armL.rotation.set(0, 0, 0);
  };

  resetActor(bundle.storyNodes.observer, 0.35);
  resetActor(bundle.storyNodes.partner, -0.55);
  resetActor(bundle.storyNodes.standby, 0.8);
  resetActor(bundle.storyNodes.operator, 0.9);
  resetActor(bundle.storyNodes.teammate, 0.55);
  resetActor(bundle.storyNodes.leader, -0.7);
  resetActor(bundle.storyNodes.collaborator, -0.85);
  resetActor(bundle.storyNodes.analyst, 0.4);

  const token = bundle.storyNodes.token;
  if (token) token.position.set(-0.15, 0.55, 0.15);
  const proposal = bundle.storyNodes.proposal;
  if (proposal) proposal.position.set(0.55, 0.95, 0.15);
  const priorities = bundle.storyNodes.priorities;
  if (priorities) priorities.rotation.x = -0.7;
  const board = bundle.storyNodes.board;
  if (board) board.position.y = 0.28;
}

export class SystemForceStoryDirector {
  private timeline: gsap.core.Timeline | null = null;

  constructor(private readonly world: SystemGeometryWorld) {}

  public isPlaying(): boolean {
    return Boolean(this.timeline && this.timeline.isActive() && !this.timeline.paused());
  }

  public cancel(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    (Object.keys(this.world.forces) as ForceId[]).forEach((id) => {
      resetForceStoryVisuals(this.world.forces[id]);
    });
  }

  public pause(): void {
    this.timeline?.pause();
  }

  public resume(): void {
    this.timeline?.resume();
  }

  public playForce(forceId: ForceId, callbacks: StoryPlaybackCallbacks = {}): void {
    this.cancel();
    const bundle = this.world.forces[forceId];
    const reduced = prefersReducedMotion();

    if (reduced) {
      this.playReduced(forceId, bundle, callbacks);
      return;
    }

    // Playback is derived from application/visibility state by the scene adapter.
    const tl = gsap.timeline({
      paused: true,
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
    const request = bundle.storyNodes.request;
    const head = observer?.userData.head as THREE.Object3D | undefined;
    const torso = observer?.userData.torso as THREE.Object3D | undefined;
    const armR = observer?.userData.armR as THREE.Object3D | undefined;
    const partnerHead = partner?.userData.head as THREE.Object3D | undefined;

    // 1. Observa la solicitud (inclina torso y mira la tableta)
    tl.call(() => callbacks.onBeat?.('personas', 0, 'Observa la solicitud'));
    if (torso) tl.to(torso.rotation, { x: 0.35, duration: 0.55 }, 0);
    if (head) tl.to(head.rotation, { x: -0.35, y: 0.1, duration: 0.55 }, 0);
    if (armR) tl.to(armR.rotation, { x: -0.95, duration: 0.55 }, 0);
    if (request) tl.to(request.rotation, { x: -0.85, duration: 0.45 }, 0);

    // 2. Detecta anomalía
    tl.call(() => callbacks.onBeat?.('personas', 1, 'Detecta una anomalía'), '', '+=0.15');
    if (head) tl.to(head.rotation, { x: -0.1, y: 0.25, duration: 0.35 });
    if (warning) {
      tl.set(warning, { visible: true });
      tl.fromTo(
        warning.scale,
        { x: 0.001, y: 0.001, z: 0.001 },
        { x: 1.15, y: 1.15, z: 1.15, duration: 0.4, ease: 'back.out(2)' }
      );
      tl.to(warning.position, { y: '+=0.12', yoyo: true, repeat: 3, duration: 0.22 }, '<');
    }

    // 3. Señala el problema
    tl.call(() => callbacks.onBeat?.('personas', 2, 'Señala el problema'), '', '+=0.1');
    if (torso) tl.to(torso.rotation, { x: 0.05, duration: 0.35 });
    if (armR) tl.to(armR.rotation, { x: -1.55, y: 0.35, z: -0.25, duration: 0.45 });
    if (observer) tl.to(observer.rotation, { y: 0.75, duration: 0.45 }, '<');

    // 4. Comunica al colaborador
    tl.call(() => callbacks.onBeat?.('personas', 3, 'Comunica la situación'), '', '+=0.1');
    if (partner) tl.to(partner.rotation, { y: -1.05, duration: 0.45 });
    if (partnerHead) tl.to(partnerHead.rotation, { y: -0.25, duration: 0.4 }, '<');
    if (commBeam) {
      tl.set(commBeam, { visible: true });
      tl.fromTo(commBeam.scale, { y: 0.001 }, { y: 1, duration: 0.45, ease: 'power2.out' });
    }

    // 5. Relación operacional
    tl.call(() => callbacks.onBeat?.('personas', 4, 'Activa relaciones operacionales'), '', '+=0.2');
    tl.to({}, { duration: 0.55 });
  }

  private buildProcesosStory(
    tl: gsap.core.Timeline,
    bundle: ForcePlatformBundle,
    callbacks: StoryPlaybackCallbacks
  ): void {
    const token = bundle.storyNodes.token;
    const reviewFlag = bundle.storyNodes.reviewFlag;
    const station0 = bundle.storyNodes.station0;
    const station1 = bundle.storyNodes.station1;
    const station2 = bundle.storyNodes.station2;
    const operator = bundle.storyNodes.operator;
    const armR = operator?.userData.armR as THREE.Object3D | undefined;

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
    if (station0) {
      const screen = station0.userData.screen as THREE.Mesh | undefined;
      if (screen?.material && 'emissiveIntensity' in screen.material) {
        tl.to(screen.material, { emissiveIntensity: 1.05, duration: 0.3 }, '<');
      }
    }

    tl.call(() => callbacks.onBeat?.('procesos', 1, 'Avanza entre actividades'), '', '+=0.15');
    if (token) tl.to(token.position, { x: 0.33, z: 0.08, duration: 0.75, ease: 'power1.inOut' });
    if (armR) tl.to(armR.rotation, { x: -0.9, duration: 0.4 }, '<');
    if (station1) {
      const screen = station1.userData.screen as THREE.Mesh | undefined;
      if (screen?.material && 'emissiveIntensity' in screen.material) {
        tl.to(screen.material, { emissiveIntensity: 1.1, duration: 0.3 }, '<');
      }
    }

    tl.call(() => callbacks.onBeat?.('procesos', 2, 'Punto de revisión'));
    if (token) tl.to(token.position, { y: 0.72, duration: 0.25, yoyo: true, repeat: 1 });
    if (reviewFlag) {
      tl.set(reviewFlag, { visible: true });
      tl.fromTo(
        reviewFlag.scale,
        { x: 0.001, y: 0.001, z: 0.001 },
        { x: 1.2, y: 1.2, z: 1.2, duration: 0.35, ease: 'back.out(1.8)' }
      );
      tl.to(reviewFlag.rotation, { y: `+=${Math.PI}`, duration: 0.8 }, '<');
    }

    tl.call(() => callbacks.onBeat?.('procesos', 3, 'Conecta tareas y responsables'), '', '+=0.15');
    if (token) tl.to(token.position, { x: 0.8, z: -0.05, duration: 0.7, ease: 'power1.inOut' });
    if (station2) {
      const screen = station2.userData.screen as THREE.Mesh | undefined;
      if (screen?.material && 'emissiveIntensity' in screen.material) {
        tl.to(screen.material, { emissiveIntensity: 1.15, duration: 0.3 }, '<');
      }
    }
    tl.to({}, { duration: 0.4 });
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
    const armR = teammate?.userData.armR as THREE.Object3D | undefined;
    const leaderArm = leader?.userData.armR as THREE.Object3D | undefined;
    const leaderHead = leader?.userData.head as THREE.Object3D | undefined;
    const leaderTorso = leader?.userData.torso as THREE.Object3D | undefined;

    tl.call(() => callbacks.onBeat?.('liderazgo', 0, 'El equipo comunica'));
    if (armR) tl.to(armR.rotation, { x: -1.35, y: 0.25, duration: 0.5 });
    if (teammate) tl.to(teammate.rotation, { y: 0.9, duration: 0.5 }, '<');

    tl.call(() => callbacks.onBeat?.('liderazgo', 1, 'El líder observa información'), '', '+=0.12');
    if (leader) tl.to(leader.rotation, { y: -0.25, duration: 0.5 });
    if (leaderHead) tl.to(leaderHead.rotation, { x: -0.2, duration: 0.4 }, '<');
    if (leaderTorso) tl.to(leaderTorso.rotation, { x: 0.18, duration: 0.4 }, '<');
    if (priorities) tl.to(priorities.rotation, { x: -1.05, duration: 0.45 }, '<');

    tl.call(() => callbacks.onBeat?.('liderazgo', 2, 'Revisan prioridades'), '', '+=0.1');
    if (leaderArm) tl.to(leaderArm.rotation, { x: -1.15, duration: 0.4 });
    const checkTweenA = reveal(checkA);
    const checkTweenB = reveal(checkB);
    if (checkTweenA) tl.add(checkTweenA);
    if (checkTweenB) tl.add(checkTweenB, '<');

    tl.call(() => callbacks.onBeat?.('liderazgo', 3, 'Acuerdan seguimiento'), '', '+=0.2');
    if (leader) tl.to(leader.rotation, { y: -0.85, duration: 0.4 });
    if (teammate) tl.to(teammate.rotation, { y: 0.35, duration: 0.4 }, '<');
    if (armR) tl.to(armR.rotation, { x: -0.4, duration: 0.35 }, '<');
    if (leaderArm) tl.to(leaderArm.rotation, { x: -0.55, duration: 0.35 }, '<');
    tl.to({}, { duration: 0.45 });
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
    const analyst = bundle.storyNodes.analyst;
    const board = bundle.storyNodes.board;
    const collabArm = collaborator?.userData.armR as THREE.Object3D | undefined;
    const analystHead = analyst?.userData.head as THREE.Object3D | undefined;

    tl.call(() => callbacks.onBeat?.('mejora', 0, 'Aparece la desviación'));
    const deviationTween = reveal(deviation);
    if (deviationTween) tl.add(deviationTween);
    if (deviation) tl.to(deviation.position, { y: '+=0.1', yoyo: true, repeat: 2, duration: 0.25 });

    tl.call(() => callbacks.onBeat?.('mejora', 1, 'Examinan evidencia'), '', '+=0.15');
    if (collaborator) tl.to(collaborator.rotation, { y: -0.4, duration: 0.45 });
    if (collabArm) tl.to(collabArm.rotation, { x: -1.4, duration: 0.4 }, '<');
    if (analystHead) tl.to(analystHead.rotation, { x: -0.25, duration: 0.4 }, '<');
    if (board) tl.to(board.position, { y: 0.38, duration: 0.4 }, '<');

    tl.call(() => callbacks.onBeat?.('mejora', 2, 'Formulan hipótesis'), '', '+=0.12');
    const hypothesisTween = reveal(hypothesis);
    if (hypothesisTween) tl.add(hypothesisTween);
    if (hypothesis) tl.to(hypothesis.rotation, { z: `+=${Math.PI}`, duration: 0.9 });

    tl.call(() => callbacks.onBeat?.('mejora', 3, 'Proponen ajuste'), '', '+=0.12');
    const proposalTween = reveal(proposal);
    if (proposalTween) tl.add(proposalTween);

    tl.call(() => callbacks.onBeat?.('mejora', 4, 'Pendiente de verificación'), '', '+=0.15');
    if (proposal) {
      tl.to(proposal.position, { x: 1.05, z: 0.4, duration: 0.7, ease: 'power2.inOut' });
      tl.to(proposal.scale, { x: 1.15, y: 1.15, z: 1.15, yoyo: true, repeat: 1, duration: 0.25 });
    }
    tl.to({}, { duration: 0.4 });
  }
}

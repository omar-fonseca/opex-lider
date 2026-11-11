/**
 * Fuente única de estado de aplicación para Página 02.
 * Selección, recorrido, pausa, relaciones y restauración.
 */
import {
  GUIDED_TOUR_STEPS,
  SYSTEM_FORCE_CONCEPTS,
  getForceById,
  type ForceId,
  type GuidedTourStep,
  type SystemForceConcept,
} from './SystemEducationalData.ts';

export type SystemViewMode = 'overview' | 'force' | 'relations' | 'tour' | 'inspect';

export interface SystemAppSnapshot {
  viewMode: SystemViewMode;
  activeForce: ForceId | null;
  tourStepIndex: number;
  isTourActive: boolean;
  isPaused: boolean;
  relationsVisible: boolean;
  cardOpen: boolean;
  briefOpen: boolean;
  currentBeatLabel: string | null;
  concept: SystemForceConcept | null;
  tourStep: GuidedTourStep;
}

type Listener = (snapshot: SystemAppSnapshot) => void;

export class SystemAppStateController {
  private viewMode: SystemViewMode = 'overview';
  private activeForce: ForceId | null = null;
  private tourStepIndex = 0;
  private isTourActive = false;
  private isPaused = false;
  private relationsVisible = false;
  private cardOpen = false;
  private briefOpen = false;
  private currentBeatLabel: string | null = null;
  private readonly listeners = new Set<Listener>();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  public getSnapshot(): SystemAppSnapshot {
    const tourStep = GUIDED_TOUR_STEPS[this.tourStepIndex] ?? GUIDED_TOUR_STEPS[0];
    return {
      viewMode: this.viewMode,
      activeForce: this.activeForce,
      tourStepIndex: this.tourStepIndex,
      isTourActive: this.isTourActive,
      isPaused: this.isPaused,
      relationsVisible: this.relationsVisible,
      cardOpen: this.cardOpen,
      briefOpen: this.briefOpen,
      currentBeatLabel: this.currentBeatLabel,
      concept: this.activeForce ? getForceById(this.activeForce) : null,
      tourStep,
    };
  }

  public getConnectedIds(): ForceId[] {
    if (!this.activeForce) {
      return this.relationsVisible
        ? (['personas', 'procesos', 'liderazgo', 'mejora'] as ForceId[])
        : [];
    }
    return [...getForceById(this.activeForce).connectedIds];
  }

  public selectForce(forceId: ForceId, options?: { keepTour?: boolean }): void {
    this.activeForce = forceId;
    this.briefOpen = true;
    this.cardOpen = false;
    this.viewMode = 'force';
    this.currentBeatLabel = null;
    if (!options?.keepTour) {
      this.isTourActive = false;
    }
    this.emit();
  }

  public clearForceSelection(): void {
    this.activeForce = null;
    this.briefOpen = false;
    this.cardOpen = false;
    this.currentBeatLabel = null;
    this.viewMode = this.relationsVisible ? 'relations' : 'overview';
    this.emit();
  }

  public setRelationsVisible(visible: boolean): void {
    this.relationsVisible = visible;
    if (visible && !this.activeForce) {
      this.viewMode = 'relations';
    } else if (!visible && !this.activeForce) {
      this.viewMode = 'overview';
    }
    this.emit();
  }

  public toggleRelations(): boolean {
    this.setRelationsVisible(!this.relationsVisible);
    return this.relationsVisible;
  }

  public openCard(): void {
    if (!this.activeForce) return;
    this.cardOpen = true;
    this.emit();
  }

  public closeCard(): void {
    this.cardOpen = false;
    this.emit();
  }

  public setBeatLabel(label: string | null): void {
    this.currentBeatLabel = label;
    this.emit();
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.emit();
  }

  public startTour(fromIndex = 0): void {
    this.isTourActive = true;
    this.isPaused = false;
    this.tourStepIndex = Math.max(0, Math.min(GUIDED_TOUR_STEPS.length - 1, fromIndex));
    this.applyTourStep();
  }

  public stopTour(): void {
    this.isTourActive = false;
    this.emit();
  }

  public nextTourStep(): void {
    if (!this.isTourActive) {
      this.startTour(0);
      return;
    }
    this.tourStepIndex = Math.min(GUIDED_TOUR_STEPS.length - 1, this.tourStepIndex + 1);
    this.applyTourStep();
  }

  public prevTourStep(): void {
    if (!this.isTourActive) {
      this.startTour(0);
      return;
    }
    this.tourStepIndex = Math.max(0, this.tourStepIndex - 1);
    this.applyTourStep();
  }

  public restore(): void {
    this.viewMode = 'overview';
    this.activeForce = null;
    this.tourStepIndex = 0;
    this.isTourActive = false;
    this.isPaused = false;
    this.relationsVisible = false;
    this.cardOpen = false;
    this.briefOpen = false;
    this.currentBeatLabel = null;
    this.emit();
  }

  public getAllConcepts(): SystemForceConcept[] {
    return SYSTEM_FORCE_CONCEPTS;
  }

  private applyTourStep(): void {
    const step = GUIDED_TOUR_STEPS[this.tourStepIndex];
    this.cardOpen = false;
    this.currentBeatLabel = null;
    if (step.forceId) {
      this.activeForce = step.forceId;
      this.briefOpen = true;
      this.viewMode = 'tour';
    } else {
      this.activeForce = null;
      this.briefOpen = step.id === 'integration';
      this.viewMode = 'tour';
      this.relationsVisible = step.id === 'integration';
    }
    this.emit();
  }

  private emit(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snap));
  }
}

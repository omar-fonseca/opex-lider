/**
 * Contratos de cámara, resaltado e interacción para el sistema 3D de 4 fuerzas.
 * Reutiliza isGenuinePointerClick del adaptador de portada (sin modificar gears3d).
 */
import { isGenuinePointerClick } from '../gears3d/GearInteraction.ts';
import type { ForceId } from './SystemEducationalData.ts';

export { isGenuinePointerClick };

export type ForceVisualState = 'idle' | 'hovered' | 'active' | 'connected' | 'dimmed';

export interface CameraFocusPose {
  positionX: number;
  positionY: number;
  positionZ: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
  fov?: number;
}

/** Encuadre semisométrico: PERSONAS arriba, PROCESOS derecha, LIDERAZGO abajo, MEJORA izquierda. */
export const OVERVIEW_CAMERA_POSE: CameraFocusPose = {
  positionX: 0.2,
  positionY: 8.6,
  positionZ: 9.6,
  lookAtX: 0,
  lookAtY: 0.35,
  lookAtZ: 0,
  fov: 36,
};

/** Aleja la cámara en viewports estrechos para que las cinco plataformas sigan dentro del encuadre. */
export function overviewPoseForAspect(aspect: number): CameraFocusPose {
  if (aspect < 0.9) {
    return {
      positionX: 0.05,
      positionY: 14.2,
      positionZ: 15.4,
      lookAtX: 0,
      lookAtY: 0.2,
      lookAtZ: 0,
      fov: 42,
    };
  }
  if (aspect < 1.2) {
    return {
      positionX: 0.12,
      positionY: 11.4,
      positionZ: 12.6,
      lookAtX: 0,
      lookAtY: 0.28,
      lookAtZ: 0,
      fov: 38,
    };
  }
  return { ...OVERVIEW_CAMERA_POSE };
}

export const FORCE_CAMERA_POSES: Record<ForceId, CameraFocusPose> = {
  personas: {
    positionX: 2.2,
    positionY: 4.4,
    positionZ: -0.6,
    lookAtX: 0,
    lookAtY: 0.85,
    lookAtZ: -4.05,
    fov: 32,
  },
  procesos: {
    positionX: 1.1,
    positionY: 4.3,
    positionZ: 2.8,
    lookAtX: 4.05,
    lookAtY: 0.85,
    lookAtZ: 0,
    fov: 32,
  },
  liderazgo: {
    positionX: 2.1,
    positionY: 4.3,
    positionZ: 1.15,
    lookAtX: 0,
    lookAtY: 0.85,
    lookAtZ: 4.05,
    fov: 32,
  },
  mejora: {
    positionX: -1.05,
    positionY: 4.3,
    positionZ: 2.7,
    lookAtX: -4.05,
    lookAtY: 0.85,
    lookAtZ: 0,
    fov: 32,
  },
};

/** Posiciones de plataformas en el plano XZ (Y = altura del suelo). */
export const FORCE_PLATFORM_POSITIONS: Record<ForceId, { x: number; y: number; z: number }> = {
  personas: { x: 0, y: 0, z: -4.05 },
  procesos: { x: 4.05, y: 0, z: 0 },
  liderazgo: { x: 0, y: 0, z: 4.05 },
  mejora: { x: -4.05, y: 0, z: 0 },
};

export const CENTER_PLATFORM_POSITION = { x: 0, y: 0, z: 0 };

export interface ForceHighlightMap {
  centerState: ForceVisualState;
  forceStates: Record<ForceId, ForceVisualState>;
  activeForce: ForceId | null;
  hoveredForce: ForceId | null;
  connectedIds: ForceId[];
  relationsMode: boolean;
}

export function computeForceHighlightMap(
  activeForce: ForceId | null,
  hoveredForce: ForceId | null,
  connectedIds: ForceId[],
  relationsMode = false
): ForceHighlightMap {
  const forceStates: Record<ForceId, ForceVisualState> = {
    personas: 'idle',
    procesos: 'idle',
    liderazgo: 'idle',
    mejora: 'idle',
  };

  if (relationsMode && !activeForce) {
    (Object.keys(forceStates) as ForceId[]).forEach((id) => {
      forceStates[id] = 'connected';
    });
    return {
      centerState: 'active',
      forceStates,
      activeForce: null,
      hoveredForce,
      connectedIds: ['personas', 'procesos', 'liderazgo', 'mejora'],
      relationsMode: true,
    };
  }

  if (!activeForce) {
    if (hoveredForce) {
      forceStates[hoveredForce] = 'hovered';
    }
    return {
      centerState: hoveredForce ? 'connected' : 'idle',
      forceStates,
      activeForce: null,
      hoveredForce,
      connectedIds: [],
      relationsMode: false,
    };
  }

  (Object.keys(forceStates) as ForceId[]).forEach((id) => {
    if (id === activeForce) {
      forceStates[id] = 'active';
    } else if (connectedIds.includes(id)) {
      forceStates[id] = 'connected';
    } else {
      forceStates[id] = 'dimmed';
    }
  });

  return {
    centerState: 'connected',
    forceStates,
    activeForce,
    hoveredForce,
    connectedIds,
    relationsMode: false,
  };
}

export function clampOrbitOffsets(
  yawDelta: number,
  pitchDelta: number
): { yaw: number; pitch: number } {
  const yaw = Math.max(-0.55, Math.min(0.55, yawDelta));
  const pitch = Math.max(-0.28, Math.min(0.32, pitchDelta));
  return { yaw, pitch };
}

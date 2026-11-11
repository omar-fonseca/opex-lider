/**
 * GearInteraction.ts
 * Interaction state controller for the 7-gear system on Page 00 (GEAR-3D-01).
 * Bridges 3D Raycaster events and HTML .constellation-node buttons to a single
 * deterministic selection contract.
 */
import { GEAR_CONCEPT_DEFINITIONS, buildSevenGearSpecs } from './GearTransmission.ts';

export type GearVisualHighlightState = 'idle' | 'hovered' | 'active' | 'connected' | 'dimmed';

export interface GearHighlightMap {
  centralState: GearVisualHighlightState;
  secondaryStates: GearVisualHighlightState[]; // length 6
  activeIndex: number; // -1 when no card is open, 0..5 when a concept is selected
  hoveredIndex: number; // -1 when none, 0..5 for secondary, -2 for central
  connectedIndices: number[];
}

export interface CameraFocusPose {
  positionX: number;
  positionY: number;
  positionZ: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
}

export const DEFAULT_CAMERA_POSE: CameraFocusPose = {
  positionX: 0,
  positionY: -0.42,
  positionZ: 11.15,
  lookAtX: 0,
  lookAtY: 0,
  lookAtZ: 0,
};

/**
 * Determines whether a pointerdown -> pointerup sequence is a genuine click
 * rather than a drag operation (prevents accidental selection while dragging cards).
 */
export function isGenuinePointerClick(
  downX: number,
  downY: number,
  upX: number,
  upY: number,
  maxDistancePx = 6
): boolean {
  return Math.hypot(upX - downX, upY - downY) <= maxDistancePx;
}

/**
 * Computes the highlight states for the central gear and all 6 secondary gears
 * given the currently active concept index (-1 or 0..5) and hovered index.
 */
export function computeGearHighlightMap(
  activeIndex: number,
  hoveredIndex = -1
): GearHighlightMap {
  const validActive =
    Number.isInteger(activeIndex) && activeIndex >= 0 && activeIndex < GEAR_CONCEPT_DEFINITIONS.length
      ? activeIndex
      : -1;

  const focusIndex =
    validActive !== -1
      ? validActive
      : hoveredIndex >= 0 && hoveredIndex < GEAR_CONCEPT_DEFINITIONS.length
        ? hoveredIndex
        : -1;

  if (focusIndex === -1) {
    return {
      centralState: hoveredIndex === -2 ? 'hovered' : 'idle',
      secondaryStates: GEAR_CONCEPT_DEFINITIONS.map(() => 'idle'),
      activeIndex: -1,
      hoveredIndex,
      connectedIndices: [],
    };
  }

  const conceptDef = GEAR_CONCEPT_DEFINITIONS[focusIndex];
  const connectedSet = new Set<number>(conceptDef.connectedTo);

  const secondaryStates: GearVisualHighlightState[] = GEAR_CONCEPT_DEFINITIONS.map((def) => {
    if (def.index === validActive) {
      return 'active';
    }
    if (validActive === -1 && def.index === hoveredIndex) {
      return 'hovered';
    }
    if (connectedSet.has(def.index)) {
      return 'connected';
    }
    return 'dimmed';
  });

  return {
    centralState: 'connected',
    secondaryStates,
    activeIndex: validActive,
    hoveredIndex,
    connectedIndices: [...conceptDef.connectedTo],
  };
}

/**
 * Computes a subtle, bounded camera pose when a concept gear (0..5) is selected,
 * keeping all 7 gears visible in frame while gently leaning toward the active gear.
 */
export function computeCameraFocusPose(activeIndex: number): CameraFocusPose {
  if (activeIndex < 0 || activeIndex >= GEAR_CONCEPT_DEFINITIONS.length) {
    return { ...DEFAULT_CAMERA_POSE };
  }
  const { secondaries } = buildSevenGearSpecs();
  const targetGear = secondaries[activeIndex];
  if (!targetGear) {
    return { ...DEFAULT_CAMERA_POSE };
  }

  // Subtle shift (max ~10% of gear offset) so the composition stays balanced and stable
  return {
    positionX: targetGear.centerX * 0.12,
    positionY: DEFAULT_CAMERA_POSE.positionY + targetGear.centerY * 0.1,
    positionZ: DEFAULT_CAMERA_POSE.positionZ - 0.18,
    lookAtX: targetGear.centerX * 0.09,
    lookAtY: targetGear.centerY * 0.09,
    lookAtZ: 0,
  };
}

/**
 * GearTransmission.ts
 * Pure deterministic mechanical kinematics, tooth-ratio transmission,
 * phase synchronization, and concept state controller for Page 00 (GEAR-3D-01).
 */

export interface GearMechanicalSpec {
  id: string;
  index: number; // -1 for central OPEX gear, 0..5 for the 6 secondary concept gears
  label: string;
  subtitle?: string;
  isCentral: boolean;
  teeth: number;
  module: number;
  pitchRadius: number;
  addendum: number;
  dedendum: number;
  tipRadius: number;
  rootRadius: number;
  hubRadius: number;
  innerRingRadius: number;
  thickness: number;
  bevelSize: number;
  polarAngleDeg: number; // 3D world polar angle (degrees, +Y up, +X right)
  polarAngleRad: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  initialPhaseRad: number;
  angularVelocityRadPerSec: number;
  connectedTo: number[];
}

export interface GearSystemConfig {
  module: number;
  centralTeeth: number;
  secondaryTeeth: number;
  radialClearance: number;
  centralAngularVelocity: number; // Negative = clockwise around +Z axis
  centralInitialPhase: number;
}

export const DEFAULT_GEAR_SYSTEM_CONFIG: GearSystemConfig = {
  module: 0.16,
  centralTeeth: 18,
  secondaryTeeth: 12,
  radialClearance: 0.015,
  centralAngularVelocity: -0.22, // Clockwise rotation around +Z
  centralInitialPhase: 0,
};

export interface ConceptNodeDefinition {
  index: number;
  id: string;
  label: string;
  polarAngleDeg: number; // 3D Cartesian angle (+X = 0°, +Y = 90°)
  connectedTo: number[];
}

/**
 * The 6 operational excellence concepts around the central OPEX gear,
 * matching Constellation.astro and the reference composition:
 * - 0: PERSONAS (12 o'clock -> +90° in 3D Cartesian)
 * - 1: PROCESOS (2 o'clock -> +30° in 3D Cartesian)
 * - 2: ESTRATEGIA (4 o'clock -> -30° in 3D Cartesian)
 * - 3: RESULTADOS (6 o'clock -> -90° in 3D Cartesian)
 * - 4: MEJORA (8 o'clock -> -150° in 3D Cartesian)
 * - 5: LIDERAZGO (10 o'clock -> +150° in 3D Cartesian)
 */
export const GEAR_CONCEPT_DEFINITIONS: readonly ConceptNodeDefinition[] = [
  { index: 0, id: 'personas', label: 'PERSONAS', polarAngleDeg: 90, connectedTo: [1, 4, 5] },
  { index: 1, id: 'procesos', label: 'PROCESOS', polarAngleDeg: 30, connectedTo: [0, 2, 3] },
  { index: 2, id: 'estrategia', label: 'ESTRATEGIA', polarAngleDeg: -30, connectedTo: [1, 3, 5] },
  { index: 3, id: 'resultados', label: 'RESULTADOS', polarAngleDeg: -90, connectedTo: [1, 2, 4] },
  { index: 4, id: 'mejora', label: 'MEJORA', polarAngleDeg: -150, connectedTo: [0, 3, 5] },
  { index: 5, id: 'liderazgo', label: 'LIDERAZGO', polarAngleDeg: 150, connectedTo: [0, 2, 4] },
];

/**
 * Calculates pitch radius R = (m * Z) / 2
 */
export function calculatePitchRadius(moduleValue: number, teeth: number): number {
  if (moduleValue <= 0 || teeth < 6) {
    throw new Error(`Invalid gear parameters: module=${moduleValue}, teeth=${teeth}`);
  }
  return (moduleValue * teeth) / 2;
}

/**
 * Calculates center-to-center distance between meshing external gears:
 * D = R_central + R_secundario + clearance
 */
export function calculateCenterDistance(
  centralPitchRadius: number,
  secondaryPitchRadius: number,
  radialClearance = 0.015
): number {
  return centralPitchRadius + secondaryPitchRadius + radialClearance;
}

/**
 * Calculates exact angular velocity of a driven external gear:
 * omega_secundario = - (Z_central / Z_secundario) * omega_central
 */
export function calculateSecondaryAngularVelocity(
  centralTeeth: number,
  secondaryTeeth: number,
  centralAngularVelocity: number
): number {
  if (centralTeeth <= 0 || secondaryTeeth <= 0) {
    throw new Error('Tooth counts must be positive integers.');
  }
  return -(centralTeeth / secondaryTeeth) * centralAngularVelocity;
}

/**
 * Calculates the exact initial tooth phase offset phi_0 for a secondary gear
 * placed at polar angle theta_k around the central gear, ensuring that at the
 * line of centers, a tooth peak of the central gear aligns with the valley center
 * of the secondary gear without collision or visual slip.
 */
export function calculateInitialToothPhase(
  polarAngleRad: number,
  centralTeeth: number,
  secondaryTeeth: number,
  centralInitialPhase = 0
): number {
  const ratio = centralTeeth / secondaryTeeth;
  const rawPhase =
    polarAngleRad +
    Math.PI -
    Math.PI / secondaryTeeth +
    ratio * (polarAngleRad - centralInitialPhase);
  return normalizeAngleRad(rawPhase);
}

/**
 * Normalizes an angle in radians to the range (-PI, PI].
 */
export function normalizeAngleRad(angle: number): number {
  const twoPi = Math.PI * 2;
  let normalized = ((angle % twoPi) + twoPi) % twoPi;
  if (normalized > Math.PI) {
    normalized -= twoPi;
  }
  return normalized;
}

/**
 * Builds the complete deterministic specification for all 7 gears (1 central + 6 secondary).
 */
export function buildSevenGearSpecs(
  config: GearSystemConfig = DEFAULT_GEAR_SYSTEM_CONFIG
): {
  central: GearMechanicalSpec;
  secondaries: GearMechanicalSpec[];
  all: GearMechanicalSpec[];
  centerDistance: number;
} {
  const {
    module: m,
    centralTeeth,
    secondaryTeeth,
    radialClearance,
    centralAngularVelocity,
    centralInitialPhase,
  } = config;

  const centralPitchRadius = calculatePitchRadius(m, centralTeeth);
  const secondaryPitchRadius = calculatePitchRadius(m, secondaryTeeth);
  const centerDistance = calculateCenterDistance(
    centralPitchRadius,
    secondaryPitchRadius,
    radialClearance
  );

  const addendum = m * 0.78;
  const dedendum = m * 0.96;

  const central: GearMechanicalSpec = {
    id: 'opex',
    index: -1,
    label: 'OPEX',
    subtitle: 'EXCELENCIA OPERACIONAL',
    isCentral: true,
    teeth: centralTeeth,
    module: m,
    pitchRadius: centralPitchRadius,
    addendum,
    dedendum,
    tipRadius: centralPitchRadius + addendum,
    rootRadius: centralPitchRadius - dedendum,
    hubRadius: centralPitchRadius * 0.69,
    innerRingRadius: centralPitchRadius * 0.64,
    thickness: 0.36,
    bevelSize: 0.032,
    polarAngleDeg: 0,
    polarAngleRad: 0,
    centerX: 0,
    centerY: 0,
    centerZ: 0,
    initialPhaseRad: centralInitialPhase,
    angularVelocityRadPerSec: centralAngularVelocity,
    connectedTo: [0, 1, 2, 3, 4, 5],
  };

  const secondaryOmega = calculateSecondaryAngularVelocity(
    centralTeeth,
    secondaryTeeth,
    centralAngularVelocity
  );

  const secondaries: GearMechanicalSpec[] = GEAR_CONCEPT_DEFINITIONS.map((def) => {
    const polarAngleRad = (def.polarAngleDeg * Math.PI) / 180;
    const centerX = Math.cos(polarAngleRad) * centerDistance;
    const centerY = Math.sin(polarAngleRad) * centerDistance;
    const initialPhaseRad = calculateInitialToothPhase(
      polarAngleRad,
      centralTeeth,
      secondaryTeeth,
      centralInitialPhase
    );

    return {
      id: def.id,
      index: def.index,
      label: def.label,
      isCentral: false,
      teeth: secondaryTeeth,
      module: m,
      pitchRadius: secondaryPitchRadius,
      addendum,
      dedendum,
      tipRadius: secondaryPitchRadius + addendum,
      rootRadius: secondaryPitchRadius - dedendum,
      hubRadius: secondaryPitchRadius * 0.67,
      innerRingRadius: secondaryPitchRadius * 0.62,
      thickness: 0.32,
      bevelSize: 0.028,
      polarAngleDeg: def.polarAngleDeg,
      polarAngleRad,
      centerX,
      centerY,
      centerZ: 0,
      initialPhaseRad,
      angularVelocityRadPerSec: secondaryOmega,
      connectedTo: [...def.connectedTo],
    };
  });

  return {
    central,
    secondaries,
    all: [central, ...secondaries],
    centerDistance,
  };
}

/**
 * Verifies mechanical validity of the 7-gear planetary arrangement:
 * 1. Central gear meshes with all 6 secondary gears (tip overlap > 0 and root clearance > 0).
 * 2. Adjacent secondary gears do NOT touch each other (clearance > 0), preventing mechanical lockup.
 * 3. At the line of centers for every secondary gear, the tooth-valley engagement phase error is ~0.
 */
export function validateGearSystemMechanics(
  config: GearSystemConfig = DEFAULT_GEAR_SYSTEM_CONFIG,
  sampleTimeSec = 0
): {
  valid: boolean;
  centralToSecondaryCenterDistance: number;
  toothEngagementDepth: number;
  adjacentSecondaryClearance: number;
  maxPhaseAlignmentErrorRad: number;
} {
  const { central, secondaries, centerDistance } = buildSevenGearSpecs(config);

  // 1. Tooth engagement depth between central and secondary gear
  const toothEngagementDepth = central.tipRadius + secondaries[0].tipRadius - centerDistance;

  // 2. Minimum clearance between adjacent secondary gears (separated by 60 deg)
  let minAdjacentDistance = Infinity;
  for (let i = 0; i < secondaries.length; i++) {
    const next = secondaries[(i + 1) % secondaries.length];
    const dx = secondaries[i].centerX - next.centerX;
    const dy = secondaries[i].centerY - next.centerY;
    const dist = Math.hypot(dx, dy);
    if (dist < minAdjacentDistance) {
      minAdjacentDistance = dist;
    }
  }
  const adjacentSecondaryClearance = minAdjacentDistance - 2 * secondaries[0].tipRadius;

  // 3. Phase alignment check at sampleTimeSec
  const angles = computeGearAnglesAtTime(sampleTimeSec, config);
  let maxPhaseAlignmentErrorRad = 0;

  for (const sec of secondaries) {
    const alphaCentral = angles.centralAngleRad;
    const alphaSec = angles.secondaryAnglesRad[sec.index];
    const theta = sec.polarAngleRad;

    // Tooth wave phase on central gear at contact direction theta
    const centralToothPhase = central.teeth * (theta - alphaCentral);
    // Tooth wave phase on secondary gear at contact direction (theta + PI)
    const secondaryToothPhase = sec.teeth * (theta + Math.PI - alphaSec);

    // Sum of tooth phases at contact point must equal PI (mod 2*PI) so peak meets valley
    const phaseSumError = Math.abs(
      normalizeAngleRad(centralToothPhase + secondaryToothPhase - Math.PI)
    );
    if (phaseSumError > maxPhaseAlignmentErrorRad) {
      maxPhaseAlignmentErrorRad = phaseSumError;
    }
  }

  const valid =
    toothEngagementDepth > 0.08 &&
    adjacentSecondaryClearance > 0.08 &&
    maxPhaseAlignmentErrorRad < 1e-6;

  return {
    valid,
    centralToSecondaryCenterDistance: centerDistance,
    toothEngagementDepth,
    adjacentSecondaryClearance,
    maxPhaseAlignmentErrorRad,
  };
}

/**
 * Computes exact deterministic rotation angles (in radians) for the central gear
 * and all 6 secondary gears at elapsed active time `elapsedSeconds`.
 */
export function computeGearAnglesAtTime(
  elapsedSeconds: number,
  config: GearSystemConfig = DEFAULT_GEAR_SYSTEM_CONFIG
): {
  centralAngleRad: number;
  secondaryAnglesRad: number[];
} {
  const { central, secondaries } = buildSevenGearSpecs(config);
  const centralAngleRad =
    central.initialPhaseRad + central.angularVelocityRadPerSec * elapsedSeconds;
  const secondaryAnglesRad = secondaries.map(
    (sec) => sec.initialPhaseRad + sec.angularVelocityRadPerSec * elapsedSeconds
  );
  return {
    centralAngleRad,
    secondaryAnglesRad,
  };
}

/**
 * Unified transmission clock controller that tracks elapsed mechanical time,
 * pause/resume reasons (user toggle, reduced motion, offscreen, hidden tab),
 * without ever losing tooth synchronization phase.
 */
export class GearTransmissionClock {
  private elapsedSeconds = 0;
  private userPaused = false;
  private reducedMotionPaused = false;
  private viewportPaused = false;
  private tabHiddenPaused = false;
  private readonly config: GearSystemConfig;

  constructor(config: GearSystemConfig = DEFAULT_GEAR_SYSTEM_CONFIG) {
    this.config = { ...config };
  }

  public isRunning(): boolean {
    return (
      !this.userPaused &&
      !this.reducedMotionPaused &&
      !this.viewportPaused &&
      !this.tabHiddenPaused
    );
  }

  public isUserPaused(): boolean {
    return this.userPaused;
  }

  public setUserPaused(paused: boolean): void {
    this.userPaused = Boolean(paused);
  }

  public toggleUserPaused(): boolean {
    this.userPaused = !this.userPaused;
    return this.userPaused;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotionPaused = Boolean(reduced);
  }

  public setViewportPaused(paused: boolean): void {
    this.viewportPaused = Boolean(paused);
  }

  public setTabHiddenPaused(paused: boolean): void {
    this.tabHiddenPaused = Boolean(paused);
  }

  /**
   * Advances mechanical clock by deltaSeconds (clamped to avoid huge jumps on tab restore).
   */
  public step(deltaSeconds: number): {
    centralAngleRad: number;
    secondaryAnglesRad: number[];
    elapsedSeconds: number;
    running: boolean;
  } {
    const running = this.isRunning();
    if (running && Number.isFinite(deltaSeconds) && deltaSeconds > 0) {
      const clampedDelta = Math.min(deltaSeconds, 0.1);
      this.elapsedSeconds += clampedDelta;
    }
    const angles = computeGearAnglesAtTime(this.elapsedSeconds, this.config);
    return {
      ...angles,
      elapsedSeconds: this.elapsedSeconds,
      running,
    };
  }

  public getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }
}

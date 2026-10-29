/**
 * Motor de cálculo del indicador OTIF (On-Time In-Full)
 * OPEX LÍDER — KPI-UX-01 (Página 08)
 *
 * Módulo puro: separa los cálculos matemáticos del estado interactivo y de la vista.
 */

export const TOTAL_WEEKLY_ORDERS = 200;
export const TARGET_OTIF_PERCENT = 96.0;
export const INITIAL_COMPLIANT_ORDERS = 183;
export const TARGET_COMPLIANT_ORDERS = 192; // 96% de 200

export interface OtifCalculationResult {
  totalOrders: number;
  compliantOrders: number;
  nonCompliantOrders: number;
  otifPercent: number;
  targetPercent: number;
  targetOrders: number;
  additionalOrdersNeeded: number;
  gapPercentagePoints: number;
  isTargetMet: boolean;
  statusLevel: 'met' | 'near' | 'critical';
  statusLabel: string;
  formattedOtif: string;
  formattedGap: string;
  formattedCompliant: string;
  formattedNonCompliant: string;
  formattedAdditional: string;
}

/**
 * Formatea un número con coma decimal al estilo hispano
 */
export function formatDecimalEs(val: number, decimals: number = 1): string {
  const rounded = val.toFixed(decimals);
  return rounded.replace('.', ',');
}

/**
 * Calcula todas las métricas del indicador OTIF sobre el total de 200 pedidos
 * @param compliantOrders Cantidad de pedidos conformes (a tiempo y completos)
 */
export function calculateOtif(compliantOrders: number): OtifCalculationResult {
  const total = TOTAL_WEEKLY_ORDERS;
  const clampedCompliant = Math.max(0, Math.min(total, Math.round(compliantOrders)));
  const nonCompliant = total - clampedCompliant;

  const rawPercent = (clampedCompliant / total) * 100;
  // Redondeo a 1 decimal
  const otifPercent = Math.round(rawPercent * 10) / 10;

  const targetPercent = TARGET_OTIF_PERCENT;
  const targetOrders = TARGET_COMPLIANT_ORDERS;
  const additionalOrdersNeeded = Math.max(0, targetOrders - clampedCompliant);

  const rawGap = otifPercent - targetPercent;
  const gapPercentagePoints = Math.round(rawGap * 10) / 10;

  const isTargetMet = otifPercent >= targetPercent;

  let statusLevel: 'met' | 'near' | 'critical' = 'met';
  let statusLabel = 'Meta cumplida (Proceso estable)';

  if (!isTargetMet) {
    if (otifPercent >= 90.0) {
      statusLevel = 'near';
      statusLabel = 'Por debajo de la meta (Activa análisis)';
    } else {
      statusLevel = 'critical';
      statusLabel = 'Desvío crítico (Requiere contención)';
    }
  }

  const sign = gapPercentagePoints > 0 ? '+' : gapPercentagePoints < 0 ? '−' : '';
  const absGap = Math.abs(gapPercentagePoints);
  const formattedGap = `${sign}${formatDecimalEs(absGap, 1)} pp`;

  return {
    totalOrders: total,
    compliantOrders: clampedCompliant,
    nonCompliantOrders: nonCompliant,
    otifPercent,
    targetPercent,
    targetOrders,
    additionalOrdersNeeded,
    gapPercentagePoints,
    isTargetMet,
    statusLevel,
    statusLabel,
    formattedOtif: `${formatDecimalEs(otifPercent, 1)} %`,
    formattedGap,
    formattedCompliant: String(clampedCompliant),
    formattedNonCompliant: String(nonCompliant),
    formattedAdditional: String(additionalOrdersNeeded),
  };
}

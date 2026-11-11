/**
 * OPEX LÍDER — VISUAL-3D-04 (Fase 4 · Capa 1: Datos y Descripciones del Proceso)
 * Caso multisectorial: Ciclo de una Solicitud de Trabajo / Orden de Servicio.
 *
 * Estructura conceptual:
 * - Tres bloques en el eje principal de flujo: Entrada -> Actividades de transformación -> Salida.
 * - Un mecanismo transversal conectado al sistema: Control y retroalimentación
 *   (no es una etapa secuencial aislada al final, sino un puente conectado a Salida, Transformación y Entrada).
 */

export type ProcessElementId = 'entrada' | 'transformacion' | 'salida' | 'control';

export interface ExplodedSubPart {
  id: string;
  code: string;
  label: string;
  roleDescription: string;
  /** Posición local en estado ensamblado (x, y, z) relativa al nodo padre */
  assembledOffset: [number, number, number];
  /** Posición local en estado de despiece espacial (x, y, z) relativa al nodo padre */
  explodedOffset: [number, number, number];
  /** Posición de anclaje para la etiqueta HTML accesible en despiece */
  labelAnchorOffset: [number, number, number];
  geometryKind: 'plate' | 'module' | 'core' | 'gate' | 'sensor' | 'bridge';
}

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface ProcessElementSpec {
  id: ProcessElementId;
  orderLabel: string;
  roleTag: string;
  isFeedbackMechanism: boolean;
  title: string;
  shortSubtitle: string;
  summary: string;
  operationalQuestion: string;
  multisectorExample: string;
  systemConnection: string;
  /** Coordenada base del bloque en el espacio 3D */
  worldPosition: [number, number, number];
  /** Pose de cámara al enfocar este elemento con GSAP */
  focusCameraPose: CameraPose;
  /** Pose de cámara cuando además se activa el despiece en este elemento */
  explodedCameraPose: CameraPose;
  /** Sub-componentes que se separan al activar el despiece espacial */
  subParts: ExplodedSubPart[];
}

export const OVERVIEW_CAMERA_POSE: CameraPose = {
  position: [0, 6.4, 12.2],
  target: [0, -0.35, 0],
};

export const OVERVIEW_EXPLODED_CAMERA_POSE: CameraPose = {
  position: [0, 7.4, 13.8],
  target: [0, -0.2, 0],
};

export const PROCESS_WORK_ORDER_CASE = {
  kicker: 'CASO MULTISECTORIAL · FLUJO DE UNA SOLICITUD DE TRABAJO',
  title: 'De una solicitud entrante a un resultado verificable con control conectado',
  contextSummary:
    'Aplica por igual a mantenimiento, logística, soporte técnico, salud o servicios internos: una solicitud ingresa con requerimientos, se transforma mediante trabajo coordinado, se entrega como salida verificable y es regulada continuamente por un mecanismo de control y retroalimentación conectado a todo el sistema.',
  metricsReference: [
    { label: 'Unidad de flujo', value: '1 Solicitud de Trabajo (OT)' },
    { label: 'Eje directo', value: 'Entrada → Transformación → Salida' },
    { label: 'Mecanismo regulador', value: 'Control y retroalimentación transversal' },
  ],
};

export const PROCESS_ELEMENTS: Record<ProcessElementId, ProcessElementSpec> = {
  entrada: {
    id: 'entrada',
    orderLabel: '01 · ENTRADA',
    roleTag: 'INSUMOS E INFORMACIÓN REQUERIDA',
    isFeedbackMechanism: false,
    title: 'Entrada: solicitud clara e insumos listos',
    shortSubtitle: 'Información completa, prioridad definida y recursos disponibles en la fuente.',
    summary:
      'Todo proceso inicia con lo que recibe. En una solicitud de trabajo, la entrada comprende el pedido claro del usuario, los datos técnicos del problema o necesidad y los insumos necesarios para actuar sin improvisación.',
    operationalQuestion: '¿La solicitud tiene alcance, prioridad y criterios claros antes de asignarla?',
    multisectorExample:
      'Una orden de servicio que especifica ubicación exacta, síntoma verificado, ventana horaria disponible y repuesto o documento requerido.',
    systemConnection:
      'Alimenta directamente a las Actividades de transformación y recibe ajustes preventivos desde el mecanismo de Control y retroalimentación.',
    worldPosition: [-4.4, 0.35, 0],
    focusCameraPose: {
      position: [-4.4, 3.1, 6.2],
      target: [-4.4, 0.45, 0],
    },
    explodedCameraPose: {
      position: [-4.4, 3.6, 7.1],
      target: [-4.4, 0.65, 0],
    },
    subParts: [
      {
        id: 'in-base',
        code: 'E1',
        label: 'Bandeja de Recepción e Insumos',
        roleDescription: 'Soporte de entrada donde convergen materiales, datos y disponibilidad operativa.',
        assembledOffset: [0, -0.38, 0],
        explodedOffset: [0, -1.05, 0],
        labelAnchorOffset: [0, -1.15, 0.85],
        geometryKind: 'plate',
      },
      {
        id: 'in-request',
        code: 'E2',
        label: 'Ficha de Solicitud de Trabajo',
        roleDescription: 'Define qué se requiere, quién lo solicita y cuál es el resultado esperado.',
        assembledOffset: [-0.28, 0.16, 0],
        explodedOffset: [-0.85, 0.48, 0.35],
        labelAnchorOffset: [-0.95, 0.88, 0.35],
        geometryKind: 'module',
      },
      {
        id: 'in-gate',
        code: 'E3',
        label: 'Filtro de Claridad en la Fuente',
        roleDescription: 'Verifica que la solicitud no pase incompleta hacia el equipo ejecutor.',
        assembledOffset: [0.52, 0.24, 0],
        explodedOffset: [1.02, 1.12, -0.25],
        labelAnchorOffset: [1.08, 1.55, -0.25],
        geometryKind: 'gate',
      },
    ],
  },

  transformacion: {
    id: 'transformacion',
    orderLabel: '02 · ACTIVIDADES DE TRANSFORMACIÓN',
    roleTag: 'TRABAJO Y COORDINACIÓN NECESARIOS',
    isFeedbackMechanism: false,
    title: 'Actividades de transformación: método, coordinación y valor',
    shortSubtitle: 'Secuencia de trabajo estandarizado que convierte la solicitud en solución real.',
    summary:
      'Aquí ocurre el trabajo real y la coordinación entre personas. Combina la preparación secuencial de tareas con la ejecución técnica que transforma la solicitud inicial en un producto o servicio resuelto, evitando esperas y retrabajos.',
    operationalQuestion: '¿Qué pasos agregan valor real a la solicitud y cuáles son solo esperas o búsquedas?',
    multisectorExample:
      'Coordinación del equipo, preparación del estándar de trabajo, intervención efectiva y verificación intermedia durante la ejecución.',
    systemConnection:
      'Recibe la solicitud validada desde la Entrada, entrega el trabajo concluido a la Salida y ajusta su método según las señales del mecanismo de Control.',
    worldPosition: [0, 0.35, 0],
    focusCameraPose: {
      position: [0, 3.25, 6.4],
      target: [0, 0.5, 0],
    },
    explodedCameraPose: {
      position: [0, 3.85, 7.3],
      target: [0, 0.7, 0],
    },
    subParts: [
      {
        id: 'tr-guide',
        code: 'T1',
        label: 'Base de Método y Estándar',
        roleDescription: 'Secuencia acordada para ejecutar el trabajo de forma segura y repetible.',
        assembledOffset: [0, -0.38, 0],
        explodedOffset: [0, -1.1, 0],
        labelAnchorOffset: [0, -1.2, 0.9],
        geometryKind: 'plate',
      },
      {
        id: 'tr-coord',
        code: 'T2',
        label: 'Módulo de Coordinación y Tareas',
        roleDescription: 'Sincroniza roles, herramientas y tiempos para mantener flujo continuo.',
        assembledOffset: [-0.45, 0.18, 0],
        explodedOffset: [-1.05, 0.45, 0.4],
        labelAnchorOffset: [-1.15, 0.9, 0.4],
        geometryKind: 'module',
      },
      {
        id: 'tr-core',
        code: 'T3',
        label: 'Núcleo de Transformación de Valor',
        roleDescription: 'Momento exacto donde el insumo o solicitud cambia de estado hacia la solución.',
        assembledOffset: [0.35, 0.32, 0],
        explodedOffset: [0.95, 1.18, -0.3],
        labelAnchorOffset: [1.05, 1.62, -0.3],
        geometryKind: 'core',
      },
    ],
  },

  salida: {
    id: 'salida',
    orderLabel: '03 · SALIDA',
    roleTag: 'PRODUCTO, SERVICIO O RESULTADO',
    isFeedbackMechanism: false,
    title: 'Salida: resultado verificable para quien recibe',
    shortSubtitle: 'Entrega completa, a tiempo y lista para ser utilizada sin retrabajos.',
    summary:
      'El proceso no concluye cuando el equipo termina su tarea interna, sino cuando el solicitante o la etapa siguiente recibe el producto, servicio o resultado cumpliendo las condiciones acordadas de calidad y oportunidad.',
    operationalQuestion: '¿Quien recibe esta salida puede usarla de inmediato sin hacer ajustes ni consultas extra?',
    multisectorExample:
      'Equipo operativo entregado en funcionamiento, pedido despachado completo a tiempo (OTIF) o informe técnico validado con el usuario.',
    systemConnection:
      'Consolida el valor creado en la Transformación y alimenta con datos reales de entrega al mecanismo de Control y retroalimentación.',
    worldPosition: [4.4, 0.35, 0],
    focusCameraPose: {
      position: [4.4, 3.1, 6.2],
      target: [4.4, 0.45, 0],
    },
    explodedCameraPose: {
      position: [4.4, 3.6, 7.1],
      target: [4.4, 0.65, 0],
    },
    subParts: [
      {
        id: 'out-platform',
        code: 'S1',
        label: 'Plataforma de Entrega al Receptor',
        roleDescription: 'Punto formal de transferencia hacia el cliente interno o externo.',
        assembledOffset: [0, -0.38, 0],
        explodedOffset: [0, -1.05, 0],
        labelAnchorOffset: [0, -1.15, 0.85],
        geometryKind: 'plate',
      },
      {
        id: 'out-result',
        code: 'S2',
        label: 'Resultado / Orden Completada',
        roleDescription: 'Producto o servicio finalizado que responde a la solicitud original.',
        assembledOffset: [-0.2, 0.2, 0],
        explodedOffset: [-0.78, 0.52, 0.35],
        labelAnchorOffset: [-0.88, 0.92, 0.35],
        geometryKind: 'core',
      },
      {
        id: 'out-verify',
        code: 'S3',
        label: 'Verificación de Conformidad y Plazo',
        roleDescription: 'Confirma calidad a la primera y cumplimiento del tiempo acordado.',
        assembledOffset: [0.48, 0.22, 0],
        explodedOffset: [0.98, 1.1, -0.25],
        labelAnchorOffset: [1.05, 1.52, -0.25],
        geometryKind: 'gate',
      },
    ],
  },

  control: {
    id: 'control',
    orderLabel: 'MECANISMO CONECTADO · CONTROL Y RETROALIMENTACIÓN',
    roleTag: 'EVALUACIÓN Y AJUSTES DEL PROCESO',
    isFeedbackMechanism: true,
    title: 'Control y retroalimentación: circuito regulador conectado al sistema',
    shortSubtitle: 'No es un paso aislado al final; conecta la Salida con la Entrada y la Transformación.',
    summary:
      'Representado espacialmente como un puente regulador conectado a todo el proceso: capta el desempeño real en la Salida, evalúa desviaciones frente al estándar y envía señales de ajuste tanto a las Actividades de transformación como a la Entrada.',
    operationalQuestion: '¿Qué aprendimos del resultado entregado para ajustar la entrada y el método antes del próximo ciclo?',
    multisectorExample:
      'Al detectar demoras por órdenes incompletas, el circuito actualiza la ficha de recepción en Entrada y simplifica la coordinación en Transformación.',
    systemConnection:
      'Mecanismo transversal acoplado simultáneamente a Salida (captura de datos), Transformación (ajuste de método) y Entrada (clarificación en la fuente).',
    worldPosition: [0, -1.75, 0.65],
    focusCameraPose: {
      position: [0, -0.35, 8.2],
      target: [0, -1.35, 0.2],
    },
    explodedCameraPose: {
      position: [0, 0.1, 9.2],
      target: [0, -1.25, 0.2],
    },
    subParts: [
      {
        id: 'ct-sensor',
        code: 'C1',
        label: 'Sonda de Evaluación en Salida',
        roleDescription: 'Mide calidad, tiempo de respuesta y satisfacción real al entregar el trabajo.',
        assembledOffset: [3.2, 0.32, 0],
        explodedOffset: [3.65, 0.85, 0.45],
        labelAnchorOffset: [3.65, 1.3, 0.45],
        geometryKind: 'sensor',
      },
      {
        id: 'ct-bridge',
        code: 'C2',
        label: 'Consola de Comparación y Aprendizaje',
        roleDescription: 'Contrasta el resultado real contra el estándar esperado para identificar brechas.',
        assembledOffset: [0, -0.05, 0.2],
        explodedOffset: [0, -0.75, 0.7],
        labelAnchorOffset: [0, -1.2, 0.85],
        geometryKind: 'bridge',
      },
      {
        id: 'ct-injector',
        code: 'C3',
        label: 'Nodos de Ajuste hacia Entrada y Transformación',
        roleDescription: 'Reenvía correcciones al filtro de Entrada y al estándar de Transformación.',
        assembledOffset: [-3.2, 0.32, 0],
        explodedOffset: [-3.65, 0.85, 0.45],
        labelAnchorOffset: [-3.65, 1.3, 0.45],
        geometryKind: 'sensor',
      },
    ],
  },
};

export const PROCESS_ELEMENT_ORDER: ProcessElementId[] = [
  'entrada',
  'transformacion',
  'salida',
  'control',
];

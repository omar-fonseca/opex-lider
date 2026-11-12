/**
 * Datos educativos de la Página 02 — Sistema de 4 fuerzas.
 * Conserva textos aprobados de InteractiveSystem y añade el caso compartido
 * y los textos breves de contexto (jerarquía visual > explicación breve > ficha).
 */

export type ForceId = 'personas' | 'procesos' | 'liderazgo' | 'mejora';

export interface SystemForceConcept {
  id: ForceId;
  number: string;
  badge: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  explanation: string;
  systemRelation: string;
  connectionLabel: string;
  connectedIds: ForceId[];
  leaderAction: string;
  nodeClass: string;
  svgLines: string[];
  /** Explicación contextual breve (no sustituye la ficha completa). */
  briefContext: string;
  learningOutcome: string;
  actionBeats: string[];
}

export interface SharedOperationalCase {
  title: string;
  situation: string;
  risk: string;
}

export interface GuidedTourStep {
  index: number;
  id: string;
  forceId: ForceId | null;
  label: string;
  summary: string;
}

export const SHARED_OPERATIONAL_CASE: SharedOperationalCase = {
  title: 'Solicitud de trabajo con riesgo de retraso',
  situation:
    'Una solicitud de trabajo entra al sistema operacional compartido. El equipo detecta indicios de que la entrega podría retrasarse si no se revisan criterios, flujo, prioridades y evidencias.',
  risk: 'Riesgo de retraso — no implica un fallo individual ni una cadena obligatoria de las cuatro fuerzas.',
};

export const SYSTEM_FORCE_CONCEPTS: SystemForceConcept[] = [
  {
    id: 'personas',
    number: '01',
    badge: 'FUERZA 01 · FUNDAMENTO',
    title: 'PERSONAS',
    shortTitle: 'PERSONAS',
    subtitle:
      '“La excelencia operacional no la producen los manuales: la hacen posible personas conscientes que comprenden el propósito de cada tarea.”',
    explanation:
      'En un sistema maduro, las personas no esperan órdenes pasivas; desarrollan criterio para observar su entorno, detectar anomalías y tomar decisiones fundamentadas donde ocurre el trabajo.',
    systemRelation:
      'Activa los Procesos al ejecutar el estándar con rigor y alimenta la Mejora al visibilizar desviaciones en tiempo real.',
    connectionLabel: 'Procesos · Mejora · Nexo central',
    connectedIds: ['procesos', 'mejora'],
    leaderAction:
      'Desarrollar capacidades de resolución de problemas, brindar seguridad psicológica y transferir gradualmente la toma de decisiones.',
    nodeClass: 'node-personas',
    svgLines: ['line-personas-procesos', 'line-personas-mejora', 'line-personas-nexus'],
    briefContext:
      'Observan la solicitud, detectan una posible anomalía y la comunican. Aportan criterio y energía humana que la automatización no sustituye.',
    learningOutcome:
      'Las personas aportan observación, criterio y capacidad de comunicar problemas.',
    actionBeats: [
      'Observa la solicitud',
      'Detecta una anomalía',
      'Señala el problema',
      'Comunica la situación',
      'Activa relaciones operacionales',
    ],
  },
  {
    id: 'procesos',
    number: '02',
    badge: 'FUERZA 02 · ESTRUCTURA',
    title: 'PROCESOS',
    shortTitle: 'PROCESOS',
    subtitle:
      '“El proceso es la forma compartida de hacer visible el trabajo. El estándar no es una camisa de fuerza: es la base indispensable de la mejora.”',
    explanation:
      'Hacer visible el flujo de valor permite identificar cuellos de botella, eliminar desperdicios y asegurar que la calidad se construya en la fuente, no en una inspección posterior.',
    systemRelation:
      'Traduce el criterio de las Personas en flujo predecible y ofrece al Liderazgo una referencia objetiva para observar el desempeño.',
    connectionLabel: 'Personas · Liderazgo · Nexo central',
    connectedIds: ['personas', 'liderazgo'],
    leaderAction:
      'Construir estándares junto con los operadores reales del proceso y asegurar una gestión visual que hable por sí misma.',
    nodeClass: 'node-procesos',
    svgLines: ['line-personas-procesos', 'line-procesos-liderazgo', 'line-procesos-nexus'],
    briefContext:
      'La solicitud avanza entre actividades. Un punto de revisión hace visible el riesgo de retraso y conecta tareas con responsables.',
    learningOutcome:
      'Los procesos proporcionan estructura, coordinación y visibilidad del trabajo.',
    actionBeats: [
      'Aparece la solicitud',
      'Avanza entre actividades',
      'Punto de revisión',
      'Conecta tareas y responsables',
    ],
  },
  {
    id: 'liderazgo',
    number: '03',
    badge: 'FUERZA 03 · CONEXIÓN',
    title: 'LIDERAZGO',
    shortTitle: 'LIDERAZGO',
    subtitle:
      '“Liderar no es situarse en el centro para controlarlo todo, sino crear las condiciones para que el sistema opere con autonomía y propósito.”',
    explanation:
      'El líder excelente conecta la visión de largo plazo con la disciplina de la gestión diaria. Cuando surge una desviación, no busca culpables: pregunta qué condición del proceso permitió el error.',
    systemRelation:
      'Estabiliza los Procesos mediante disciplina operativa e impulsa la Mejora eliminando obstáculos para que el equipo aprenda.',
    connectionLabel: 'Procesos · Mejora · Nexo central',
    connectedIds: ['procesos', 'mejora'],
    leaderAction:
      'Practicar preguntas reflexivas en el Gemba, modelar humildad de aprendizaje y eliminar las barreras que frenan al equipo.',
    nodeClass: 'node-liderazgo',
    svgLines: ['line-procesos-liderazgo', 'line-liderazgo-mejora', 'line-liderazgo-nexus'],
    briefContext:
      'El equipo comunica la dificultad. El líder revisa prioridades y recursos, y acuerdan un seguimiento sin buscar culpables.',
    learningOutcome:
      'El liderazgo facilita condiciones para comprender y abordar obstáculos.',
    actionBeats: [
      'El equipo comunica',
      'El líder observa información',
      'Revisan prioridades',
      'Acuerdan seguimiento',
    ],
  },
  {
    id: 'mejora',
    number: '04',
    badge: 'FUERZA 04 · EVOLUCIÓN',
    title: 'MEJORA CONTINUA',
    shortTitle: 'MEJORA',
    subtitle:
      '“La mejora continua no surge de eventos heroicos aislados, sino de la práctica rigurosa del método científico ante cada brecha operacional.”',
    explanation:
      'A través del ciclo PDCA (Planificar, Hacer, Verificar, Actuar), cada problema se convierte en información privilegiada para comprender el proceso y evolucionar el estándar hacia un nivel superior.',
    systemRelation:
      'Articula el soporte del Liderazgo con el talento de las Personas para elevar continuamente la capacidad del sistema.',
    connectionLabel: 'Liderazgo · Personas · Nexo central',
    connectedIds: ['liderazgo', 'personas'],
    leaderAction:
      'Fomentar pequeños experimentos controlados a diario y celebrar que los problemas se hagan visibles a tiempo.',
    nodeClass: 'node-mejora',
    svgLines: ['line-liderazgo-mejora', 'line-personas-mejora', 'line-mejora-nexus'],
    briefContext:
      'Se examina la desviación, se formula una hipótesis y se propone un ajuste pendiente de comprobación. No se afirma un resultado ya probado.',
    learningOutcome: 'Mejorar implica observar, experimentar y comprobar resultados.',
    actionBeats: [
      'Aparece la desviación',
      'Examinan evidencia',
      'Formulan hipótesis',
      'Proponen ajuste',
      'Pendiente de verificación',
    ],
  },
];

export const GUIDED_TOUR_STEPS: GuidedTourStep[] = [
  {
    index: 0,
    id: 'overview',
    forceId: null,
    label: 'Sistema completo',
    summary: 'Las cuatro fuerzas integran un sistema operacional vivo alrededor del nexo central.',
  },
  {
    index: 1,
    id: 'personas',
    forceId: 'personas',
    label: 'Personas',
    summary: SHARED_OPERATIONAL_CASE.situation,
  },
  {
    index: 2,
    id: 'procesos',
    forceId: 'procesos',
    label: 'Procesos',
    summary: 'El trabajo se hace visible cuando la solicitud avanza por actividades y puntos de revisión.',
  },
  {
    index: 3,
    id: 'liderazgo',
    forceId: 'liderazgo',
    label: 'Liderazgo',
    summary: 'La coordinación crea condiciones para priorizar y dar seguimiento sin culpar a las personas.',
  },
  {
    index: 4,
    id: 'mejora',
    forceId: 'mejora',
    label: 'Mejora',
    summary: 'La evidencia permite formular hipótesis y proponer ajustes que deben comprobarse.',
  },
  {
    index: 5,
    id: 'integration',
    forceId: null,
    label: 'Integración',
    summary:
      'Las cuatro fuerzas se relacionan sobre el mismo caso. No forman una cadena universal obligatoria: son una narración didáctica de interdependencia.',
  },
];

export function getForceById(id: ForceId): SystemForceConcept {
  const found = SYSTEM_FORCE_CONCEPTS.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Fuerza desconocida: ${id}`);
  }
  return found;
}

export function getForceIndex(id: ForceId): number {
  return SYSTEM_FORCE_CONCEPTS.findIndex((c) => c.id === id);
}

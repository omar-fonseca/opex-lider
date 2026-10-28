export interface BookPageMeta {
  number: string; // "00" .. "09"
  pageOrder: number; // 1 .. 10
  href: string;
  title: string;
  topbarTitle: string;
  kicker: string;
  readingEstimate: string;
  available: boolean;
  summary: string;
}

export interface BookSearchItem {
  href: string;
  label: string;
  category: string;
  keywords: string;
}

export const BOOK_PAGES: BookPageMeta[] = [
  {
    number: "00",
    pageOrder: 1,
    href: "/",
    title: "Cubierta",
    topbarTitle: "Cubierta interactiva",
    kicker: "00 · CUBIERTA",
    readingEstimate: "Cubierta · Exploración orbital",
    available: true,
    summary: "Manifiesto visual y arquitectura orbital de OPEX LÍDER.",
  },
  {
    number: "01",
    pageOrder: 2,
    href: "/introduccion",
    title: "Excelencia operacional",
    topbarTitle: "Excelencia operacional",
    kicker: "01 · INTRODUCCIÓN",
    readingEstimate: "Lectura estimada: 6 min",
    available: true,
    summary: "Comprender el sistema sociotécnico antes de implementar herramientas.",
  },
  {
    number: "02",
    pageOrder: 3,
    href: "/sistema",
    title: "Sistema interactivo",
    topbarTitle: "Las 4 fuerzas",
    kicker: "02 · SISTEMA INTERACTIVO",
    readingEstimate: "Exploración visual: 8 min",
    available: true,
    summary: "Interdependencia entre Personas, Procesos, Liderazgo y Mejora.",
  },
  {
    number: "03",
    pageOrder: 4,
    href: "/lider-proceso",
    title: "El líder en el proceso",
    topbarTitle: "El líder dentro del proceso",
    kicker: "03 · LIDERAZGO OPERACIONAL",
    readingEstimate: "Exploración visual: 8 min",
    available: true,
    summary: "Cómo el líder orienta, coordina, desarrolla capacidades y conecta objetivos con ejecución.",
  },
  {
    number: "04",
    pageOrder: 5,
    href: "/anatomia-proceso",
    title: "Anatomía de un proceso",
    topbarTitle: "Anatomía de un proceso",
    kicker: "04 · ARQUITECTURA DE FLUJO",
    readingEstimate: "Exploración de etapas: 9 min",
    available: true,
    summary: "Secuencia explorable: Entrada, Actividades, Transformación, Salida y Retroalimentación.",
  },
  {
    number: "05",
    pageOrder: 6,
    href: "/gestion-visual",
    title: "Gestión visual",
    topbarTitle: "Gestión visual en terreno",
    kicker: "05 · TRANSPARENCIA OPERACIONAL",
    readingEstimate: "Exploración de tablero: 8 min",
    available: true,
    summary: "Anatomía de un tablero operacional para entender el estado del trabajo en segundos.",
  },
  {
    number: "06",
    pageOrder: 7,
    href: "/kanban-concepto",
    title: "Kanban: concepto y señal",
    topbarTitle: "Kanban: concepto y propósito",
    kicker: "06 · SISTEMAS DE JALÓN (PULL)",
    readingEstimate: "Exploración de señal: 9 min",
    available: true,
    summary: "Diferencia entre señales de reposición/producción y visualización de flujo de trabajo.",
  },
  {
    number: "07",
    pageOrder: 8,
    href: "/kanban-flujo",
    title: "Tablero Kanban y flujo",
    topbarTitle: "Tablero Kanban y límite WIP",
    kicker: "07 · CONTROL DE FLUJO Y WIP",
    readingEstimate: "Simulación de flujo: 10 min",
    available: true,
    summary: "Avance de actividades, límite de trabajo en curso (WIP) y gestión de cuellos de botella.",
  },
  {
    number: "08",
    pageOrder: 9,
    href: "/kpi-concepto",
    title: "KPI: medir lo importante",
    topbarTitle: "KPI: árbol de medición",
    kicker: "08 · ALINEACIÓN Y MEDICIÓN",
    readingEstimate: "Árbol interactivo: 9 min",
    available: true,
    summary: "Árbol navegable: Propósito, Objetivo, Indicador, Meta y Resultado con caso ilustrativo.",
  },
  {
    number: "09",
    pageOrder: 10,
    href: "/kpi-gestion-diaria",
    title: "KPI en la gestión diaria",
    topbarTitle: "KPI aplicado a la rutina diaria",
    kicker: "09 · RUTINA DE GESTIÓN DIARIA",
    readingEstimate: "Ciclo operacional: 10 min",
    available: true,
    summary: "Del dato a la acción: observar desviación, verificar en terreno, coordinar y dar seguimiento.",
  },
];

export const TOTAL_BOOK_PAGES = BOOK_PAGES.length; // 10 páginas (00 a 09)

export function getPageNavigation(currentPath: string) {
  const normalized =
    currentPath.length > 1 && currentPath.endsWith("/")
      ? currentPath.slice(0, -1)
      : currentPath || "/";

  const index = Math.max(
    0,
    BOOK_PAGES.findIndex((p) => p.href === normalized)
  );
  const current = BOOK_PAGES[index] || BOOK_PAGES[0];
  const prev = index > 0 ? BOOK_PAGES[index - 1] : null;
  const next = index < BOOK_PAGES.length - 1 ? BOOK_PAGES[index + 1] : null;
  const progressPercent = Math.round(((index + 1) / TOTAL_BOOK_PAGES) * 100);

  return {
    current,
    currentPage: index + 1,
    totalPages: TOTAL_BOOK_PAGES,
    prevHref: prev ? prev.href : null,
    prevTitle: prev ? `${prev.number} · ${prev.title}` : null,
    nextHref: next ? next.href : null,
    nextTitle: next ? `${next.number} · ${next.title}` : null,
    progressPercent,
  };
}

export const BOOK_SEARCH_ITEMS: BookSearchItem[] = [
  {
    href: "/",
    label: "00 · Cubierta y arquitectura orbital de 6 pilares",
    category: "Página 00",
    keywords: "cubierta inicio personas procesos liderazgo estrategia resultados mejora",
  },
  {
    href: "/introduccion",
    label: "01 · Excelencia operacional: comprender el sistema antes de las herramientas",
    category: "Página 01",
    keywords: "introduccion sistema gemba herramientas seguridad psicologica metodo cientifico",
  },
  {
    href: "/sistema",
    label: "02 · Las 4 fuerzas de la excelencia operacional",
    category: "Página 02",
    keywords: "sistema interactivo cuatro fuerzas personas procesos liderazgo mejora",
  },
  {
    href: "/lider-proceso",
    label: "03 · El líder dentro del proceso: orientación, coordinación y capacidades",
    category: "Página 03",
    keywords: "lider rol equipo actividades decisiones resultados estandar acompanamiento",
  },
  {
    href: "/anatomia-proceso",
    label: "04 · Anatomía de un proceso: Entrada, Transformación, Salida y Retroalimentación",
    category: "Página 04",
    keywords: "anatomia proceso sipoc entrada insumos actividades transformacion salida retroalimentacion",
  },
  {
    href: "/gestion-visual",
    label: "05 · Gestión visual: anatomía del tablero operacional en terreno",
    category: "Página 05",
    keywords: "gestion visual tablero objetivos estado indicadores responsables seguimiento",
  },
  {
    href: "/kanban-concepto",
    label: "06 · Kanban: sistema de señales (Pull), reposición y flujo de valor",
    category: "Página 06",
    keywords: "kanban senal tarjeta pull jalon reposicion sobreproduccion inventario flujo",
  },
  {
    href: "/kanban-flujo",
    label: "07 · Tablero Kanban, trabajo en curso (WIP) y cuellos de botella",
    category: "Página 07",
    keywords: "tablero kanban wip trabajo en curso limite restriccion cuello de botella flujo",
  },
  {
    href: "/kpi-concepto",
    label: "08 · KPI: medir lo importante (Propósito → Objetivo → Indicador → Meta → Resultado)",
    category: "Página 08",
    keywords: "kpi indicador medicion proposito objetivo meta resultado arbol oee otif",
  },
  {
    href: "/kpi-gestion-diaria",
    label: "09 · KPI aplicado a la gestión diaria: del desvío numérico a la verificación en Gemba",
    category: "Página 09",
    keywords: "kpi gestion diaria desviacion verificacion gemba causa raiz accion seguimiento",
  },
];

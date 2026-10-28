/**
 * OPEX LÍDER — Motor reutilizable de expansión contextual tipo FLIP (First, Last, Invert, Play),
 * arrastre acotado por Pointer Events (Fase 5E) y utilidades nativas (Web Animations API)
 * para aproximación 2.5D, foco de cámara SVG e iluminación progresiva de conexiones.
 */

export interface FlipAnimationOptions {
  durationOpen?: number;
  durationClose?: number;
  easingOpen?: string;
  easingClose?: string;
}

export interface DraggableCardOptions {
  /** Elemento tarjeta que se desplazará */
  cardEl: HTMLElement;
  /** Asa superior desde donde se inicia el arrastre */
  handleEl?: HTMLElement | null;
  /** Contenedor escenario que define los límites del arrastre */
  boundaryEl?: HTMLElement | null;
  /** Callback opcional cada vez que cambia el desplazamiento (x, y) */
  onMove?: (x: number, y: number) => void;
}

export interface DraggableCardController {
  /** Restaura la tarjeta a su posición inicial (0, 0) */
  resetPosition: (animate?: boolean) => void;
  /** Acopla la tarjeta a la izquierda, centro o derecha dentro de los límites del escenario */
  dockTo: (side: 'left' | 'center' | 'right') => void;
  /** Desplaza incrementalmente (útil para teclado) */
  nudgeBy: (dx: number, dy: number) => void;
  /** Obtiene el desplazamiento actual en píxeles */
  getOffset: () => { x: number; y: number };
}

interface CardDragState {
  x: number;
  y: number;
  isDragging: boolean;
}

const cardDragStateMap = new WeakMap<HTMLElement, CardDragState>();

const DEFAULT_OPTIONS: Required<FlipAnimationOptions> = {
  durationOpen: 380,
  durationClose: 280,
  easingOpen: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easingClose: 'cubic-bezier(0.32, 0, 0.2, 1)',
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(max-width: 860px)').matches;
}

export function cancelActiveAnimations(el: Element | null) {
  if (el && typeof el.getAnimations === 'function') {
    el.getAnimations().forEach((anim) => anim.cancel());
  }
}

const pendingCloseAbortMap = new WeakMap<HTMLElement, () => void>();

function abortPendingClose(cardEl: HTMLElement | null) {
  if (!cardEl) return;
  const abort = pendingCloseAbortMap.get(cardEl);
  if (abort) {
    abort();
    pendingCloseAbortMap.delete(cardEl);
  }
}

export function getCardDragOffset(cardEl: HTMLElement): { x: number; y: number } {
  const st = cardDragStateMap.get(cardEl);
  return st ? { x: st.x, y: st.y } : { x: 0, y: 0 };
}

function applyCardDragTransform(cardEl: HTMLElement, x: number, y: number) {
  const roundedX = Math.round(x);
  const roundedY = Math.round(y);
  let st = cardDragStateMap.get(cardEl);
  if (!st) {
    st = { x: roundedX, y: roundedY, isDragging: false };
    cardDragStateMap.set(cardEl, st);
  } else {
    st.x = roundedX;
    st.y = roundedY;
  }

  cardEl.style.setProperty('--card-drag-x', `${roundedX}px`);
  cardEl.style.setProperty('--card-drag-y', `${roundedY}px`);

  if (isMobileViewport()) {
    cardEl.style.transform = '';
    cardEl.removeAttribute('data-card-moved');
    return;
  }

  if (roundedX === 0 && roundedY === 0) {
    cardEl.style.transform = '';
    cardEl.removeAttribute('data-card-moved');
  } else {
    cardEl.style.transform = `translate3d(${roundedX}px, ${roundedY}px, 0)`;
    cardEl.setAttribute('data-card-moved', 'true');
  }
}

export function resetCardDragOffset(cardEl: HTMLElement | null) {
  if (!cardEl) return;
  applyCardDragTransform(cardEl, 0, 0);
  cardEl.removeAttribute('data-dock-state');
}

/**
 * Anima la apertura o cambio de la tarjeta expandida desde el rectángulo del elemento origen,
 * respetando cualquier desplazamiento actual de la tarjeta.
 */
export function animateFlipOpen(
  originEl: HTMLElement | SVGElement | null,
  targetCardEl: HTMLElement,
  options?: FlipAnimationOptions
): Animation | null {
  abortPendingClose(targetCardEl);
  cancelActiveAnimations(targetCardEl);

  if (!originEl || prefersReducedMotion() || typeof targetCardEl.animate !== 'function') {
    return null;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const firstRect = originEl.getBoundingClientRect();
  const lastRect = targetCardEl.getBoundingClientRect();

  if (lastRect.width === 0 || lastRect.height === 0) return null;

  const { x: dragX, y: dragY } = getCardDragOffset(targetCardEl);
  const dx = firstRect.left + firstRect.width / 2 - (lastRect.left + lastRect.width / 2);
  const dy = firstRect.top + firstRect.height / 2 - (lastRect.top + lastRect.height / 2);
  const sx = Math.max(0.22, Math.min(1.12, firstRect.width / lastRect.width));
  const sy = Math.max(0.22, Math.min(1.12, firstRect.height / lastRect.height));

  return targetCardEl.animate(
    [
      {
        transform: `translate3d(${(dragX + dx).toFixed(1)}px, ${(dragY + dy).toFixed(1)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`,
        opacity: 0.28,
      },
      {
        transform: `translate3d(${dragX.toFixed(1)}px, ${dragY.toFixed(1)}px, 0) scale(1, 1)`,
        opacity: 1,
      },
    ],
    {
      duration: opts.durationOpen,
      easing: opts.easingOpen,
      fill: 'none',
    }
  );
}

/**
 * Anima el cierre de la tarjeta expandida regresando visualmente hacia las coordenadas de su elemento origen
 * desde la posición actual (incluyendo si fue desplazada por el usuario) y luego restablece su desplazamiento.
 */
export function animateFlipClose(
  originEl: HTMLElement | SVGElement | null,
  targetCardEl: HTMLElement,
  onFinishOrOptions?: (() => void) | FlipAnimationOptions,
  optionsOrOnFinish?: FlipAnimationOptions | (() => void)
): void {
  abortPendingClose(targetCardEl);
  cancelActiveAnimations(targetCardEl);

  const userOnFinish: () => void =
    typeof onFinishOrOptions === 'function'
      ? onFinishOrOptions
      : typeof optionsOrOnFinish === 'function'
        ? optionsOrOnFinish
        : () => {};

  const onFinish = () => {
    resetCardDragOffset(targetCardEl);
    userOnFinish();
  };

  const options: FlipAnimationOptions | undefined =
    typeof onFinishOrOptions === 'object' && onFinishOrOptions !== null
      ? onFinishOrOptions
      : typeof optionsOrOnFinish === 'object' && optionsOrOnFinish !== null
        ? optionsOrOnFinish
        : undefined;

  if (!originEl || prefersReducedMotion() || typeof targetCardEl.animate !== 'function') {
    onFinish();
    return;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const origRect = originEl.getBoundingClientRect();
  const cardRect = targetCardEl.getBoundingClientRect();

  if (cardRect.width === 0 || cardRect.height === 0 || origRect.width === 0) {
    onFinish();
    return;
  }

  const { x: dragX, y: dragY } = getCardDragOffset(targetCardEl);
  const dx = origRect.left + origRect.width / 2 - (cardRect.left + cardRect.width / 2);
  const dy = origRect.top + origRect.height / 2 - (cardRect.top + cardRect.height / 2);
  const sx = Math.max(0.22, Math.min(1.12, origRect.width / cardRect.width));
  const sy = Math.max(0.22, Math.min(1.12, origRect.height / cardRect.height));

  const anim = targetCardEl.animate(
    [
      {
        transform: `translate3d(${dragX.toFixed(1)}px, ${dragY.toFixed(1)}px, 0) scale(1, 1)`,
        opacity: 1,
      },
      {
        transform: `translate3d(${(dragX + dx).toFixed(1)}px, ${(dragY + dy).toFixed(1)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`,
        opacity: 0.14,
      },
    ],
    {
      duration: opts.durationClose,
      easing: opts.easingClose,
      fill: 'none',
    }
  );

  let finished = false;
  let timerId = 0;

  const done = () => {
    if (finished) return;
    finished = true;
    if (timerId) window.clearTimeout(timerId);
    pendingCloseAbortMap.delete(targetCardEl);
    onFinish();
  };

  pendingCloseAbortMap.set(targetCardEl, () => {
    finished = true;
    if (timerId) window.clearTimeout(timerId);
  });

  anim.onfinish = done;
  anim.oncancel = done;
  timerId = window.setTimeout(done, opts.durationClose + 40);
}

/**
 * Ilumina progresivamente un conjunto de líneas o trazos SVG activos con desfase escalonado (stagger)
 */
export function animateProgressiveConnections(
  lines: Iterable<SVGElement>,
  staggerMs = 45
): void {
  if (prefersReducedMotion()) return;
  let index = 0;
  for (const line of lines) {
    if (typeof line.animate !== 'function') continue;
    cancelActiveAnimations(line);
    line.animate(
      [
        { opacity: 0.18, strokeDashoffset: 18 },
        { opacity: 1, strokeDashoffset: 0 },
      ],
      {
        duration: 420,
        delay: index * staggerMs,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'none',
      }
    );
    index++;
  }
}

/**
 * Fase 5E — Hace que una tarjeta expandida sea desplazable en escritorio mediante Pointer Events,
 * acotada a los límites del escenario de lectura y con controles accesibles de acoplamiento (Izquierda / Centro / Derecha).
 * No persiste coordenadas globales entre páginas.
 */
export function makeCardDraggable(options: DraggableCardOptions): DraggableCardController {
  const { cardEl, onMove } = options;
  const handleEl =
    options.handleEl ||
    cardEl.querySelector<HTMLElement>(
      '[data-drag-handle], .node-insight-head, .system-card-header, .expanded-topbar, .vm-expanded-topbar'
    ) ||
    cardEl;

  cardDragStateMap.set(cardEl, { x: 0, y: 0, isDragging: false });
  cardEl.classList.add('opex-draggable-card');
  handleEl.classList.add('opex-drag-handle');

  function getBoundsElement(): HTMLElement {
    if (options.boundaryEl) return options.boundaryEl;
    const readerPage = cardEl.closest<HTMLElement>(
      '.cover-page, .system-immersive-shell, .expandable-workbench, .vm-expandable-workbench, .page'
    );
    return readerPage || document.body;
  }

  function clampDelta(proposedX: number, proposedY: number): { x: number; y: number } {
    if (isMobileViewport()) return { x: 0, y: 0 };

    const current = getCardDragOffset(cardEl);
    const cardRect = cardEl.getBoundingClientRect();
    if (cardRect.width === 0 || cardRect.height === 0) {
      return { x: proposedX, y: proposedY };
    }

    // Rectángulo base de la tarjeta cuando el desplazamiento es (0, 0)
    const baseLeft = cardRect.left - current.x;
    const baseRight = cardRect.right - current.x;
    const baseTop = cardRect.top - current.y;
    const baseBottom = cardRect.bottom - current.y;

    const boundaryRect = getBoundsElement().getBoundingClientRect();
    const topbarHeight = 76; // Evita cubrir la barra superior de lectura (.reader-topbar)
    const viewportMargin = 14;

    const minAllowedLeft = Math.max(viewportMargin, boundaryRect.left - 24);
    const maxAllowedRight = Math.min(window.innerWidth - viewportMargin, boundaryRect.right + 24);
    const minAllowedTop = Math.max(topbarHeight, boundaryRect.top - 16);
    const maxAllowedBottom = Math.min(window.innerHeight - viewportMargin, boundaryRect.bottom + 24);

    let minX = minAllowedLeft - baseLeft;
    let maxX = maxAllowedRight - baseRight;
    if (minX > maxX) {
      const midX = (minX + maxX) / 2;
      minX = midX - 180;
      maxX = midX + 180;
    }

    let minY = minAllowedTop - baseTop;
    let maxY = maxAllowedBottom - baseBottom;
    if (minY > maxY) {
      minY = Math.min(0, minAllowedTop - baseTop);
      maxY = Math.max(0, maxAllowedBottom - baseBottom);
    }

    const clampedX = Math.max(minX, Math.min(maxX, proposedX));
    const clampedY = Math.max(minY, Math.min(maxY, proposedY));

    return { x: Math.round(clampedX), y: Math.round(clampedY) };
  }

  function setPosition(newX: number, newY: number, animate = false) {
    cancelActiveAnimations(cardEl);
    const prev = getCardDragOffset(cardEl);
    const clamped = clampDelta(newX, newY);
    applyCardDragTransform(cardEl, clamped.x, clamped.y);
    onMove?.(clamped.x, clamped.y);

    if (animate && !prefersReducedMotion() && typeof cardEl.animate === 'function' && !isMobileViewport()) {
      cardEl.animate(
        [
          { transform: `translate3d(${prev.x}px, ${prev.y}px, 0)` },
          { transform: `translate3d(${clamped.x}px, ${clamped.y}px, 0)` },
        ],
        {
          duration: 240,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }
      );
    }
  }

  function resetPosition(animate = false) {
    cardEl.removeAttribute('data-dock-state');
    setPosition(0, 0, animate);
  }

  function dockTo(side: 'left' | 'center' | 'right') {
    if (isMobileViewport()) return;
    if (side === 'center') {
      resetPosition(true);
      cardEl.setAttribute('data-dock-state', 'center');
      return;
    }

    const current = getCardDragOffset(cardEl);
    const cardRect = cardEl.getBoundingClientRect();
    const baseLeft = cardRect.left - current.x;
    const baseRight = cardRect.right - current.x;
    const boundaryRect = getBoundsElement().getBoundingClientRect();

    const targetX =
      side === 'left'
        ? boundaryRect.left + 12 - baseLeft
        : boundaryRect.right - 12 - baseRight;

    cardEl.setAttribute('data-dock-state', side);
    setPosition(targetX, current.y, true);
  }

  function nudgeBy(dx: number, dy: number) {
    if (isMobileViewport()) return;
    const current = getCardDragOffset(cardEl);
    cardEl.removeAttribute('data-dock-state');
    setPosition(current.x + dx, current.y + dy, false);
  }

  // Inyectar barra de acoplamiento y restauración accesible si no existe aún en el asa
  if (!handleEl.querySelector('.card-drag-controls')) {
    const controlsWrap = document.createElement('div');
    controlsWrap.className = 'card-drag-controls';
    controlsWrap.setAttribute('role', 'group');
    controlsWrap.setAttribute('aria-label', 'Controles para desplazar o acoplar la tarjeta');

    const gripBadge = document.createElement('span');
    gripBadge.className = 'card-drag-grip-label';
    gripBadge.setAttribute('title', 'Arrastra esta barra con el mouse para descubrir el diagrama detrás');
    gripBadge.innerHTML = `<span class="grip-dots" aria-hidden="true">⋮⋮</span><span class="grip-text">Mover ficha</span>`;

    const btnLeft = document.createElement('button');
    btnLeft.type = 'button';
    btnLeft.className = 'card-dock-btn';
    btnLeft.setAttribute('data-dock-action', 'left');
    btnLeft.setAttribute('aria-label', 'Acoplar tarjeta a la izquierda');
    btnLeft.setAttribute('title', 'Acoplar a la izquierda');
    btnLeft.textContent = '⇤';

    const btnReset = document.createElement('button');
    btnReset.type = 'button';
    btnReset.className = 'card-dock-btn card-dock-reset';
    btnReset.setAttribute('data-dock-action', 'center');
    btnReset.setAttribute('aria-label', 'Restaurar posición inicial de la tarjeta');
    btnReset.setAttribute('title', 'Restaurar posición inicial');
    btnReset.textContent = 'Centrar';

    const btnRight = document.createElement('button');
    btnRight.type = 'button';
    btnRight.className = 'card-dock-btn';
    btnRight.setAttribute('data-dock-action', 'right');
    btnRight.setAttribute('aria-label', 'Acoplar tarjeta a la derecha');
    btnRight.setAttribute('title', 'Acoplar a la derecha');
    btnRight.textContent = '⇥';

    btnLeft.addEventListener('click', (e) => {
      e.stopPropagation();
      dockTo('left');
    });
    btnReset.addEventListener('click', (e) => {
      e.stopPropagation();
      resetPosition(true);
    });
    btnRight.addEventListener('click', (e) => {
      e.stopPropagation();
      dockTo('right');
    });

    controlsWrap.appendChild(gripBadge);
    controlsWrap.appendChild(btnLeft);
    controlsWrap.appendChild(btnReset);
    controlsWrap.appendChild(btnRight);

    // Insertar antes del botón de cierre para conservar la X siempre a la derecha
    const closeBtn = handleEl.querySelector<HTMLElement>(
      'button[id*="close"], .cover-insight-close-btn, .expanded-close-btn, .vm-close-button'
    );
    if (closeBtn && closeBtn.parentElement === handleEl) {
      handleEl.insertBefore(controlsWrap, closeBtn);
    } else {
      handleEl.appendChild(controlsWrap);
    }
  }

  // Gestión de Pointer Events en la barra superior (asa de arrastre)
  let activePointerId: number | null = null;
  let startClientX = 0;
  let startClientY = 0;
  let originOffsetX = 0;
  let originOffsetY = 0;
  let hasMovedThreshold = false;

  handleEl.addEventListener('pointerdown', (e: PointerEvent) => {
    if (isMobileViewport()) return;
    if (e.button !== 0) return;

    // No iniciar arrastre si se pulsó un botón interactivo o enlace dentro de la cabecera
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, a, input, select, textarea')) {
      return;
    }

    cancelActiveAnimations(cardEl);
    activePointerId = e.pointerId;
    startClientX = e.clientX;
    startClientY = e.clientY;
    const current = getCardDragOffset(cardEl);
    originOffsetX = current.x;
    originOffsetY = current.y;
    hasMovedThreshold = false;

    const st = cardDragStateMap.get(cardEl);
    if (st) st.isDragging = true;

    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {
      // Ignorar en entornos sintéticos donde setPointerCapture no aplique
    }
  });

  handleEl.addEventListener('pointermove', (e: PointerEvent) => {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;

    if (!hasMovedThreshold && Math.hypot(dx, dy) < 3) {
      return;
    }

    if (!hasMovedThreshold) {
      hasMovedThreshold = true;
      cardEl.classList.add('is-dragging');
      cardEl.removeAttribute('data-dock-state');
    }

    e.preventDefault();
    const clamped = clampDelta(originOffsetX + dx, originOffsetY + dy);
    applyCardDragTransform(cardEl, clamped.x, clamped.y);
    onMove?.(clamped.x, clamped.y);
  });

  function finishPointerDrag(e: PointerEvent) {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    try {
      if (handleEl.hasPointerCapture(e.pointerId)) {
        handleEl.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignorar
    }
    activePointerId = null;
    hasMovedThreshold = false;
    cardEl.classList.remove('is-dragging');
    const st = cardDragStateMap.get(cardEl);
    if (st) st.isDragging = false;
  }

  handleEl.addEventListener('pointerup', finishPointerDrag);
  handleEl.addEventListener('pointercancel', finishPointerDrag);

  // Doble clic sobre el asa restaura la posición inicial
  handleEl.addEventListener('dblclick', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, a')) return;
    resetPosition(true);
  });

  window.addEventListener('resize', () => {
    if (isMobileViewport()) {
      applyCardDragTransform(cardEl, 0, 0);
    } else {
      const current = getCardDragOffset(cardEl);
      if (current.x !== 0 || current.y !== 0) {
        const clamped = clampDelta(current.x, current.y);
        applyCardDragTransform(cardEl, clamped.x, clamped.y);
        onMove?.(clamped.x, clamped.y);
      }
    }
  });

  return {
    resetPosition,
    dockTo,
    nudgeBy,
    getOffset: () => getCardDragOffset(cardEl),
  };
}

/**
 * OPEX LÍDER — Motor reutilizable de Modo Presentación Inmersivo (EXP-01 v2.0)
 * Controla:
 * - Entrada, salida y ciclo de vida de la presentación.
 * - Navegación manual secuencial y selección directa de escenas/nodos.
 * - Modo Vista General (Overview) del sistema completo.
 * - Autoplay / Pausa con cadencia temporal regulable.
 * - Solicitud y salida de Fullscreen API con fallback automático.
 * - Aislamiento de atajos de teclado y trampa de foco accesible.
 * - Restauración exacta de foco, scroll y estado visual anterior.
 * - Respeto estricto a prefers-reduced-motion.
 */

export interface PresentationScene {
  id: string;
  number: string;
  tag: string;
  title: string;
  summary: string;
  relation?: string;
  application?: string;
  cameraTransform?: string;
  connectedNodes?: string[];
  bannerCopy?: string;
}

export interface PresentationEngineOptions {
  /** Contenedor principal que se eleva a modo presentación */
  containerEl: HTMLElement;
  /** Escenas del diagrama */
  scenes: PresentationScene[];
  /** Callback invocado cada vez que cambia la escena o se pasa a vista general */
  onSceneChange: (scene: PresentationScene | null, index: number, isOverview: boolean) => void;
  /** Callback al entrar en modo presentación */
  onEnter?: () => void;
  /** Callback al salir de modo presentación */
  onExit?: () => void;
  /** Intervalo en milisegundos para avance automático (predeterminado 6500ms) */
  autoPlayIntervalMs?: number;
}

export interface PresentationController {
  enter: (startSceneIndex?: number) => void;
  exit: () => void;
  next: () => void;
  prev: () => void;
  goToScene: (index: number) => void;
  showOverview: () => void;
  togglePlayPause: () => boolean;
  isPlaying: () => boolean;
  isPresented: () => boolean;
  getCurrentScene: () => PresentationScene | null;
  getCurrentIndex: () => number;
  toggleFullscreen: () => Promise<void>;
  isFullscreen: () => boolean;
  destroy: () => void;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createPresentationController(options: PresentationEngineOptions): PresentationController {
  const {
    containerEl,
    scenes,
    onSceneChange,
    onEnter,
    onExit,
    autoPlayIntervalMs = 6500,
  } = options;

  let isPresented = false;
  let isOverview = false;
  let currentIndex = 0;
  let isPlaying = false;
  let timerId: number | null = null;
  let previousFocusEl: HTMLElement | null = null;
  let previousScrollPosition = { x: 0, y: 0 };

  function isFullscreen(): boolean {
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
    );
  }

  async function requestFullscreen(): Promise<void> {
    try {
      if (containerEl.requestFullscreen) {
        await containerEl.requestFullscreen();
      } else if ((containerEl as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (containerEl as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen API denegada o no compatible; se mantiene el modo inmersivo mediante fixed viewport CSS
    }
  }

  async function exitFullscreen(): Promise<void> {
    try {
      if (isFullscreen()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        }
      }
    } catch {
      // Ignorar
    }
  }

  async function toggleFullscreen(): Promise<void> {
    if (isFullscreen()) {
      await exitFullscreen();
    } else {
      await requestFullscreen();
    }
  }

  function stopAutoPlay(): void {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    isPlaying = false;
    containerEl.setAttribute('data-presentation-playing', 'false');
  }

  function startAutoPlay(): void {
    stopAutoPlay();
    isPlaying = true;
    containerEl.setAttribute('data-presentation-playing', 'true');
    timerId = window.setInterval(() => {
      if (!isPresented) {
        stopAutoPlay();
        return;
      }
      next(false);
    }, autoPlayIntervalMs);
  }

  function togglePlayPause(): boolean {
    if (isPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
    return isPlaying;
  }

  function goToScene(index: number, userInitiated = true): void {
    if (index < 0 || index >= scenes.length) return;
    if (userInitiated && isPlaying) {
      // Pausa automática al interactuar manualmente para permitir explicar con calma
      stopAutoPlay();
    }
    currentIndex = index;
    isOverview = false;
    containerEl.setAttribute('data-presentation-scene', scenes[currentIndex].id);
    containerEl.setAttribute('data-presentation-overview', 'false');
    onSceneChange(scenes[currentIndex], currentIndex, false);
  }

  function next(userInitiated = true): void {
    if (isOverview) {
      goToScene(0, userInitiated);
      return;
    }
    const nextIdx = (currentIndex + 1) % scenes.length;
    goToScene(nextIdx, userInitiated);
  }

  function prev(userInitiated = true): void {
    if (isOverview) {
      goToScene(scenes.length - 1, userInitiated);
      return;
    }
    const prevIdx = (currentIndex - 1 + scenes.length) % scenes.length;
    goToScene(prevIdx, userInitiated);
  }

  function showOverview(): void {
    if (isPlaying) stopAutoPlay();
    isOverview = true;
    containerEl.setAttribute('data-presentation-overview', 'true');
    containerEl.setAttribute('data-presentation-scene', 'overview');
    onSceneChange(null, currentIndex, true);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (!isPresented) return;

    // Tecla Escape: salir de presentación
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      exit();
      return;
    }

    // Tecla Espacio o Flecha Derecha / PageDown: avanzar escena
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag !== 'input' && activeTag !== 'textarea') {
        e.preventDefault();
        e.stopPropagation();
        next(true);
      }
      return;
    }

    // Flecha Izquierda / PageUp: retroceder escena
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      e.stopPropagation();
      prev(true);
      return;
    }

    // Tecla Home o 'O': Vista general
    if (e.key === 'Home' || e.key.toLowerCase() === 'o') {
      e.preventDefault();
      e.stopPropagation();
      showOverview();
      return;
    }

    // Tecla 'P': Toggle reproducir / pausa
    if (e.key.toLowerCase() === 'p') {
      e.preventDefault();
      e.stopPropagation();
      togglePlayPause();
      return;
    }

    // Tecla 'F': Pantalla completa
    if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      e.stopPropagation();
      void toggleFullscreen();
      return;
    }
  }

  function handleFullscreenChange(): void {
    const fs = isFullscreen();
    containerEl.setAttribute('data-presentation-fullscreen', fs ? 'true' : 'false');
  }

  function enter(startSceneIndex = 0): void {
    if (isPresented) return;
    isPresented = true;

    // Guardar foco y scroll previos para restauración transparente
    previousFocusEl = document.activeElement as HTMLElement | null;
    previousScrollPosition = {
      x: window.scrollX || window.pageXOffset || 0,
      y: window.scrollY || window.pageYOffset || 0,
    };

    containerEl.setAttribute('data-presentation-mode', 'true');
    containerEl.setAttribute('data-presentation-overview', 'false');
    containerEl.setAttribute('data-presentation-playing', 'false');
    document.documentElement.setAttribute('data-presentation-active', 'true');

    // Escuchar teclado y pantalla completa
    window.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    onEnter?.();
    goToScene(Math.max(0, Math.min(startSceneIndex, scenes.length - 1)), false);

    // Foco inicial accesible dentro de la barra de controles de presentación
    setTimeout(() => {
      const focusTarget =
        containerEl.querySelector<HTMLElement>('#lp-pres-next-btn, #lp-pres-close-btn, .lp-pres-hud-btn') ||
        containerEl;
      focusTarget.focus({ preventScroll: true });
    }, 60);
  }

  function exit(): void {
    if (!isPresented) return;
    isPresented = false;
    stopAutoPlay();

    // Salir de pantalla completa si estaba activa
    if (isFullscreen()) {
      void exitFullscreen();
    }

    containerEl.removeAttribute('data-presentation-mode');
    containerEl.removeAttribute('data-presentation-overview');
    containerEl.removeAttribute('data-presentation-scene');
    containerEl.removeAttribute('data-presentation-playing');
    containerEl.removeAttribute('data-presentation-fullscreen');
    document.documentElement.removeAttribute('data-presentation-active');

    window.removeEventListener('keydown', handleKeydown, true);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);

    onExit?.();

    // Restaurar posición de scroll exacta
    window.scrollTo({
      left: previousScrollPosition.x,
      top: previousScrollPosition.y,
      behavior: 'auto',
    });

    // Restaurar foco al elemento que activó la presentación
    if (previousFocusEl && typeof previousFocusEl.focus === 'function') {
      previousFocusEl.focus({ preventScroll: true });
    }
  }

  function destroy(): void {
    exit();
    stopAutoPlay();
  }

  return {
    enter,
    exit,
    next: () => next(true),
    prev: () => prev(true),
    goToScene: (idx: number) => goToScene(idx, true),
    showOverview,
    togglePlayPause,
    isPlaying: () => isPlaying,
    isPresented: () => isPresented,
    getCurrentScene: () => (isOverview ? null : scenes[currentIndex] || null),
    getCurrentIndex: () => currentIndex,
    toggleFullscreen,
    isFullscreen,
    destroy,
  };
}

# REPOSITORY-HARDENING-02 — ejecución local

Fecha: 2026-11-17. OPEX LÍDER — Interactive Digital Book.
Base: `54922d6acf63f6593cd891f41eee0e3823bd75cc`.

## Cambios implementados

- `SystemAppStateController` es la autoridad de selección, pausa, relaciones, recorrido y ficha. La escena deriva esos valores del snapshot y solo conserva cachés de efectos/estado visual.
- Carga diferida reconciliada con la URL, pausa conservada al seleccionar, restauración que reanuda y recorrido sincronizado al regresar de Integración.
- Cámara con finalización explícita y cancelación al recalcular layout. La navegación dibuja su pose durante la pausa del relato.
- Movimiento reducido sin render continuo en reposo; cambios de relaciones y cámara se repintan bajo demanda. Liberación explícita del contexto al disponer la escena.
- Pruebas funcionales separadas de capturas, con servidor local gestionado, trazas DOM/red/fuentes ante fallo, capturas explícitas y liberación de la escena. Los predicados de escena se verifican en el navegador con el mismo límite de 5 segundos, evitando que una respuesta de protocolo tardía invalide una condición ya cumplida. Sin aumentar el timeout de 45 segundos ni introducir retries.
- `.gitignore` cubre variantes de entorno y claves privadas; CI existente añade regresión Chromium sin desplegar.
- Contexto canónico actualizado a `E:\opexLider` / `feature/opex-dev-unified`; corregidas rutas históricas y referencias ADR. Se conservan cinco especialistas, director, Skills, reglas e historial.

## Verificación

- Build: 10 rutas estáticas. `npm test`: 23/23.
- Playwright completa 05: 25/25, 4.8m, sin retries ni cambios de código entre confirmaciones.
- Playwright completa 06: 25/25, 3.7m, sin retries ni cambios de código entre confirmaciones.
- Regresión de las páginas 00/01 y preservación por hashes de 75 archivos fuera del alcance, incluidos sus motores/estilos, shell, páginas 03–09, geometría y datos educativos 02, CSP y dependencias.
- Auditoría npm al umbral high: 0 high/critical y 1 paquete moderado (Astro). No se actualizaron dependencias.
- Escaneo por patrones de blobs históricos, mensajes de commits y archivos de trabajo: sin coincidencias; no certifica ausencia absoluta de secretos o datos privados.
- Revisión independiente de arquitectura y calidad: cambios locales aprobados con los resultados de estas pruebas como condición. `git diff --check` sin incidencias.

## Bloqueo remoto y físico

Cloudflare redirige a inicio de sesión; no se pudieron verificar los disparadores de Workers Builds ni la configuración de ramas no productivas. No se ejecutó push, merge a main, deploy, retirada de worktrees, ramas ni backups. Las referencias remotas existentes no incluyen la consolidación ni estos commits nuevos.

El desarrollo habitual continúa en `E:\opexLider`, pero siguen registrados los worktrees históricos de integration y PoC. Conservarlos y conservar `E:\opexLider-backups` hasta comprobar recuperación remota de la consolidación y de `032a31c`/`47337f5`. Esta fase no se declara terminada globalmente mientras siga ese bloqueo.

Página 02 permanece experimental: no se aprueban visualmente los personajes ni se incorporan GLB. Permanecen el aviso de chunk superior a 500 kB, la vulnerabilidad moderada y las mejoras artísticas/accesibilidad global fuera de este incremento.

## Continuidad

Desde `E:\opexLider`: `npm run dev -- --background --host 127.0.0.1`. Controlar con `npm run astro -- dev status`, `dev logs` y `dev stop`. Los commits precisos se consultan con `git log --oneline 54922d6..HEAD`; la entrega externa registra el SHA final y evidencias.

Sitio identificado por el propietario: `https://opex-lider.devbox1000.workers.dev/`. Lectura pública HTTP 200; CSP y cabeceras de seguridad previstas presentes. Esta comprobación no expone ni acredita los disparadores de Workers Builds.

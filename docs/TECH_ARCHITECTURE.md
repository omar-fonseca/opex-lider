# OPEX LÍDER — Arquitectura técnica

**Versión:** 0.1
**Estado:** Arquitectura inicial; decisiones futuras sujetas a validación.

## 1. Objetivo

Construir un libro web interactivo, rápido, accesible y mantenible, evitando complejidad innecesaria.

La arquitectura debe facilitar la producción de 50–100 páginas y experiencias educativas reutilizables.

## 2. Tecnologías

### Confirmadas
- Astro: estructura y generación de páginas.
- TypeScript: tipado y organización del código.
- Git y GitHub: control de versiones.

### Propuestas, pendientes de integración
- React: componentes que necesiten interacción.
- Tailwind CSS: sistema de estilos.
- SVG: diagramas y representaciones visuales.
- Motion: animaciones de interfaces React.

### Opcionales
- GSAP: secuencias de animación complejas.
- Three.js: experiencias tridimensionales justificadas.

No instalar dependencias sin revisar su necesidad.

## 3. Principio de funcionamiento

Astro construye las páginas editoriales.

Los componentes interactivos se incorporan solamente donde el lector necesite manipular, explorar o tomar decisiones.

El contenido del libro debe poder mantenerse sin modificar innecesariamente el código de las interacciones.

## 4. Organización propuesta

src/
- pages/: rutas y páginas web.
- content/: capítulos y contenido editorial.
- layouts/: estructuras compartidas de las páginas.
- components/book/: navegación y componentes editoriales.
- components/interactions/: experiencias interactivas.
- components/diagrams/: diagramas y representaciones visuales.
- components/ui/: elementos visuales reutilizables.
- features/: funcionalidades como búsqueda, progreso y marcadores.
- lib/: utilidades y lógica compartida.
- styles/: estilos generales.

public/
- Recursos estáticos públicos.

docs/
- Visión, arquitectura, investigación y decisiones.

.agents/
- Reglas y habilidades de los agentes.

Esta estructura es propuesta: no crear carpetas vacías sin necesidad.

## 5. Experiencias educativas

Cada interacción deberá definir:

1. Objetivo de aprendizaje.
2. Elementos visuales.
3. Acciones disponibles para el lector.
4. Estados y transiciones.
5. Resultados y explicaciones.
6. Criterios de accesibilidad.
7. Condiciones de verificación.

Priorizar HTML, CSS y SVG antes de utilizar 3D.

## 6. Navegación del libro

El sistema deberá permitir:

- Acceso por capítulos y páginas.
- Página anterior y siguiente.
- Índice y búsqueda.
- Acceso directo a conceptos.
- Progreso y marcadores locales.

La estructura editorial definitiva se definirá por separado.

## 7. Datos y almacenamiento

V1 no requiere servidor backend, autenticación ni base de datos.

El progreso y los marcadores podrán guardarse mediante localStorage, teniendo presente que sus datos pertenecen a ese navegador y pueden eliminarse.

## 8. Calidad

- Código legible y modular.
- TypeScript con validaciones adecuadas.
- Diseño responsive.
- Accesibilidad y navegación mediante teclado.
- Soporte para movimiento reducido.
- Buen rendimiento y carga progresiva.
- Pruebas de la lógica interactiva.
- Revisión de dependencias y errores.
- Contenido fundamentado y verificable.

## 9. Despliegue

El objetivo es generar una versión estática del sitio y publicarla mediante Cloudflare.

GitHub será el repositorio central del proyecto.

## 10. Control de cambios

No introducir backend, bases de datos, autenticación, nuevos frameworks o dependencias significativas sin aprobación.

Toda decisión arquitectónica importante debe documentarse antes de implementarse.
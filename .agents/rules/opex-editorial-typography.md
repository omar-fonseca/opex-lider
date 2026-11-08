# OPEX LÍDER — Regla de Composición y Tipografía Editorial Responsive

## Propósito
Garantizar la máxima elegancia, continuidad de lectura y estabilidad visual en los títulos y subtítulos de todos los capítulos de OPEX LÍDER, tanto en escritorio como en dispositivos móviles y modos de proyección.

## Principios Fundamentales

1. **Prevención de palabras huérfanas sin `nowrap` indiscriminado:**
   - Queda expresamente prohibido aplicar `white-space: nowrap` a frases completas o subtítulos extensos, ya que genera desbordamientos horizontales (*overflow*) y saltos rígidos en anchos intermedios (900px–1150px) y móviles.
   - Para evitar que la última palabra quede aislada en un renglón independiente (palabra huérfana), se debe ligar **únicamente el último par de palabras** mediante un espacio no separable (`&nbsp;`).
   - Ejemplo:
     - Correcto: `del propósito al resultado&nbsp;verificable.`
     - Correcto: `habita y articula el&nbsp;proceso.`
     - Incorrecto: `white-space: nowrap;` sobre toda la frase.
     - Incorrecto: Permitir que «verificable» o «proceso» queden en una línea solitaria.

2. **Equilibrio nativo con CSS moderno:**
   - Emplear `text-wrap: balance;` en encabezados editoriales (`.editorial-heading h1` y sus elementos hijos `em`).
   - Permitir saltos de línea armónicos y naturales según el ancho de columna disponible.

3. **Preservación tipográfica:**
   - No reducir artificialmente los tamaños tipográficos de `clamp()` para solucionar un salto de línea puntual.
   - Conservar la redacción editorial original aprobada de los títulos y subtítulos.

4. **Aplicación controlada y progresiva:**
   - Las reglas deben verificarse capítulo a capítulo sin realizar sustituciones masivas automatizadas que puedan generar regresiones no auditadas.

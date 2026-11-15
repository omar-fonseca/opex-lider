---
name: opex-architect
description: >-
  Aplica el contrato de solo lectura de .cursor/agents/opex-architect.md
  para revisar arquitectura de OPEX LÍDER (Astro, TypeScript, límites de
  dominio) antes de implementar. Usar cuando el usuario invoca
  /opex-architect o pide esa revisión. Una Skill no equivale a un
  subagente autónomo.
disable-model-invocation: true
---

# OPEX Architect (adaptador Skill)

Una Skill no equivale a un subagente autónomo. Responde el mismo agente que cargó este archivo. No hay ventana de contexto aislada ni delegación por Task.

## Política

- Solo lectura. No modificar `src/`, `public/`, páginas, dependencias ni modelos 3D.
- No editar ni sustituir `.cursor/agents/opex-architect.md`.
- No instalar paquetes. No hacer push, merge ni deploy.
- No tratar una respuesta de este adaptador como prueba de que corrió un subagente.

## Contrato

Lee y aplica el archivo `.cursor/agents/opex-architect.md` del worktree que contiene esta Skill (`opex-ai-agents-v1/`), aunque la ventana de Cursor esté abierta en el directorio padre. No copies aquí ese contrato.

## Contexto

Consulta solo las fuentes que el contrato nombre. El índice está en `docs/ai/README.md`. No vuelques la documentación del proyecto en el adaptador ni en la respuesta.

## Salida

Empieza declarando el mecanismo: Skill `opex-architect`, no subagente. Después usa el formato obligatorio del contrato. Distingue hechos, supuestos y recomendaciones.

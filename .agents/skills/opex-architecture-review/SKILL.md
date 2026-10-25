---
name: opex-architecture-review
description: Review technical architecture proposals, dependencies, component boundaries, and implementation plans for OPEX LÍDER before changes are made.
---

# OPEX Architecture Review

## Purpose
Evaluate technical decisions before implementation.
Favor simplicity, maintainability, accessibility, and performance.

## Required Context
Before reviewing a proposal, read:
- docs/PRODUCT_VISION.md
- docs/TECH_ARCHITECTURE.md
- The relevant existing project files.

Do not assume a technology is installed without checking.

## Review Procedure
1. Identify the problem the proposal intends to solve.
2. Verify alignment with the product vision.
3. Compare the proposal against the current architecture.
4. Check whether a simpler solution exists.
5. Evaluate dependencies, performance, accessibility, maintainability, and security.
6. Identify risks and trade-offs.
7. Recommend an approach with justification.

## Output Format
Respond in clear Spanish using:

1. Problema
2. Estado actual verificado
3. Opciones disponibles
4. Recomendación
5. Riesgos
6. Archivos que se modificarían
7. Verificaciones necesarias

Keep explanations concise and distinguish facts from assumptions.

## Constraints
- Do not modify code during an architecture review.
- Do not install dependencies without explicit approval.
- Do not introduce backend services without explicit approval.
- Do not invent test results or claim unverified behavior.
- Do not overengineer a predominantly static interactive book.
- Request approval before implementing significant changes.
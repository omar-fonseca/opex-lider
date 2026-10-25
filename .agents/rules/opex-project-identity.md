---
trigger: always_on
---

# OPEX LÍDER — Project Identity

## Product
OPEX LÍDER is a Spanish-language interactive web book about leadership and operational excellence for leaders, supervisors, coordinators, and process owners across industries.

It is an educational, editorial, visual experience with approximately 50–100 pages, subject to content needs.

## Product Boundaries
- It is NOT a SaaS, LMS, ERP, analytics dashboard, or traditional corporate website.
- V1 is a predominantly static web application.
- Do not introduce authentication, databases, backend APIs, payments, or microservices without explicit approval.
- Keep the content distinct from application logic.

## Learning Experience
- Prioritize accurate explanations, operational examples, diagrams, and meaningful interactions.
- Visualizations must improve understanding, not merely decorate a page.
- Prefer accessible HTML, CSS, and SVG before adding complex animation or 3D.
- Support both individual reading and presenting concepts in meetings.
- Never reproduce proprietary corporate documents, branding, or templates verbatim.

## Engineering Principles
- Preserve the existing Astro and TypeScript foundation.
- Favor simplicity, modularity, readability, performance, and accessibility.
- Propose significant architecture or dependency changes before implementing them.
- Never claim that code, tests, or builds succeeded without executing and verifying them.
- Do not invent factual educational content or citations.

## Working Method
- Work in small, reviewable steps.
- Explain important technical decisions in clear Spanish.
- Distinguish verified facts, assumptions, and recommendations.
- Preserve approved decisions and do not expand the product scope without authorization.

## Project Documentation

The authoritative product vision is located at:
`docs/PRODUCT_VISION.md`

Before proposing product features, UI structures, or major implementation decisions:
- Read the product vision.
- Keep proposals aligned with its purpose, audience, scope, and success criteria.
- If a proposal conflicts with the vision, explain the conflict and request approval.
- Do not duplicate or silently redefine the product vision.

## Technical Architecture

The authoritative technical architecture is located at:
`docs/TECH_ARCHITECTURE.md`

Before creating components, installing dependencies, or proposing structural changes:
- Read the technical architecture document.
- Respect the distinction between confirmed and proposed technologies.
- Follow the documented modular structure.
- Do not install or introduce new technologies without explicit approval.
- Explain significant architectural decisions before implementation.
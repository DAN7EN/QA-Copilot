# CLAUDE.md

Guía permanente para Claude Code durante el desarrollo de **QA Copilot**. Este documento
tiene precedencia sobre el comportamiento genérico por defecto: léelo antes de planificar
o modificar cualquier archivo del repositorio.

## 1. Descripción del proyecto

**QA Copilot** es una plataforma conversacional especializada para **Quality Assurance**.
No es un chatbot genérico: es un producto cuyo núcleo es un motor de conversación capaz de
ejecutar capacidades específicas de QA (generación de Gherkin, casos de prueba, tests
Playwright, Karate DSL, integraciones con Jira/Azure DevOps/GitHub, RAG, etc.).

**Objetivo del producto:** ofrecer a equipos de QA un copiloto conversacional que entienda
el dominio de testing y pueda ejecutar tareas concretas de QA como capacidades desacopladas,
en lugar de respuestas de un LLM genérico.

**Estado actual:** Bootstrap del monorepo completado (Sprint 1A). Existe la estructura base
de `apps/frontend` (React + Vite, un único componente `App`), `apps/backend` (Fastify con un
endpoint `/health`) y `packages/shared` / `packages/config`. No hay todavía lógica de
negocio, dominio, chat, ni integración con IA. El tooling de calidad (ESLint, Prettier,
Vitest) aún no está configurado — es el objetivo del Sprint 1B en curso.

## 2. Arquitectura

- **Monorepo con pnpm Workspaces** — `apps/*` y `packages/*` (ver `pnpm-workspace.yaml`).
- **Arquitectura Hexagonal (Ports & Adapters)** — el dominio define puertos; los
  frameworks y servicios externos se conectan mediante adaptadores.
- **Package by Context** — el código se organiza por contexto/capacidad, no por tipo
  técnico (evitar carpetas globales tipo `controllers/`, `services/`, `utils/`).
- **Domain Driven Design ligero** — solo se aplican tácticas DDD (entidades, value
  objects, agregados) donde aportan valor real. No forzar el patrón en partes triviales.
- **Frontend:** React + Vite + TypeScript (`apps/frontend`).
- **Backend:** Fastify + TypeScript (`apps/backend`).
- **TypeScript obligatorio** en todo el código del monorepo, sin excepciones.

Estructura actual del repositorio:

```text
qa-copilot/
├─ apps/
│  ├─ frontend/    # App React (Vite)
│  └─ backend/     # API Fastify
├─ packages/
│  ├─ shared/      # Tipos compartidos entre frontend y backend
│  └─ config/      # Configuración base de TypeScript (tsconfig.base.json)
├─ docs/           # Documentación de arquitectura (fuente de verdad)
├─ package.json
├─ pnpm-workspace.yaml
└─ CLAUDE.md
```

La carpeta `docs/` es la **fuente de verdad** de las decisiones de arquitectura
(Arquitectura General, ADRs, Domain Model, Architecture Blueprint, C4 Model). Ante
cualquier duda de diseño, consultar `docs/` antes de asumir.

## 3. Principios arquitectónicos

- El dominio nunca depende del framework.
- El dominio nunca conoce React, Fastify ni proveedores de IA.
- Toda integración externa (IA, trackers, VCS, etc.) se realiza mediante puertos y
  adaptadores, nunca por acceso directo desde el dominio.
- Mantener bajo acoplamiento y alta cohesión.
- Preferir composición sobre herencia.
- Evitar sobreingeniería: no introducir abstracciones, capas o patrones que el sprint
  actual no necesita.
- Implementar únicamente lo necesario para el sprint actual — nada de adelantar trabajo
  de sprints futuros "por si acaso".

## 4. Convenciones de código

- TypeScript estricto (`strict: true`, ver `packages/config/tsconfig.base.json`).
- [Conventional Commits](https://www.conventionalcommits.org/) para todos los commits.
- ESLint como linter (pendiente de configurar — Sprint 1B).
- Prettier como formateador (pendiente de configurar — Sprint 1B).
- Vitest como framework de testing (pendiente de configurar — Sprint 1B).
- Código limpio, funciones pequeñas y con una sola responsabilidad.
- Evitar duplicación (DRY) sin caer en abstracciones prematuras.
- Nombres claros y descriptivos, sin abreviaturas ambiguas.

## 5. Flujo de trabajo

**Antes de modificar cualquier archivo:**

1. Analizar el proyecto y el contexto relevante (código existente, `docs/`, este archivo).
2. Explicar el plan antes de ejecutarlo.
3. Indicar explícitamente qué archivos serán creados o modificados.
4. Esperar aprobación del usuario cuando el cambio sea grande (nuevo contexto, nueva
   capacidad, cambio estructural, nueva dependencia).

**Después de implementar:**

- Resumir los cambios realizados.
- Listar los archivos modificados.
- Explicar las decisiones técnicas relevantes y por qué se tomaron.

## 6. Restricciones

**Nunca:**

- Cambiar la arquitectura sin justificarlo explícitamente.
- Agregar dependencias innecesarias.
- Cambiar el stack tecnológico (pnpm, React, Vite, Fastify, TypeScript).
- Crear código muerto (código sin uso, exportado "por si se necesita después").
- Implementar funcionalidades de sprints futuros antes de que corresponda.
- Romper la separación entre dominio e infraestructura.

## 7. Roadmap

| Sprint | Nombre                | Estado |
|--------|------------------------|--------|
| 1A     | Bootstrap              | ✅ |
| 1B     | Tooling                | 🔄 |
| 1C     | Foundation              | ⏳ |
| 2      | Conversation Core       | ⏳ |
| 3      | AI Integration          | ⏳ |
| 4      | Streaming               | ⏳ |
| 5      | Persistence             | ⏳ |
| 6      | Capability Framework    | ⏳ |
| 7      | Gherkin Generator       | ⏳ |
| 8      | Test Case Generator     | ⏳ |
| 9      | Playwright              | ⏳ |
| 10     | Karate DSL              | ⏳ |

## 8. Calidad

Antes de dar una tarea por terminada, verificar:

- El proyecto compila (`pnpm build`).
- No hay errores de TypeScript.
- ESLint pasa correctamente (cuando esté configurado).
- Las pruebas existentes pasan (cuando Vitest esté configurado).
- No se rompe funcionalidad existente.

## 9. Filosofía del proyecto

QA Copilot no es un chatbot genérico. Es una plataforma conversacional especializada para
Quality Assurance.

La conversación es solo una interfaz. El verdadero núcleo del sistema es el
**Conversation Core** y el **Capability Framework**.

Todas las funcionalidades futuras (Gherkin, Test Cases, Playwright, Karate DSL, Jira,
Azure DevOps, GitHub, RAG, etc.) deben construirse como **capacidades desacopladas** del
núcleo, conectadas mediante puertos y adaptadores, nunca como lógica embebida en el core
conversacional.

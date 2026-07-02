# QA Copilot

Plataforma conversacional especializada para **Quality Assurance**.

Este repositorio contiene el monorepo del proyecto. En su estado actual incluye la base
técnica sobre la que se construirá el producto (un frontend mínimo y una API con un
endpoint de salud) junto con el tooling de calidad del proyecto. Todavía no existe lógica
de negocio, chat ni integración con IA.

## Tecnologías

- **Monorepo:** pnpm Workspaces
- **Frontend:** React + Vite + TypeScript
- **Backend:** Fastify + TypeScript
- **Lenguaje:** TypeScript en todo el proyecto
- **Calidad:** ESLint, Prettier, Vitest, Husky, lint-staged, Commitlint
- **CI:** GitHub Actions

## Estructura

```text
qa-copilot/
├─ .github/
│  └─ workflows/   # CI (GitHub Actions)
├─ .husky/         # Git hooks (pre-commit, commit-msg)
├─ apps/
│  ├─ frontend/    # App React (Vite)
│  └─ backend/     # API Fastify
├─ packages/
│  ├─ shared/      # Tipos compartidos
│  └─ config/      # Configuración base de TypeScript
├─ docs/           # Documentación de arquitectura
├─ eslint.config.mjs
├─ .prettierrc.json
├─ .lintstagedrc.json
├─ commitlint.config.js
├─ vitest.config.ts
├─ package.json
├─ pnpm-workspace.yaml
├─ .gitignore
└─ .editorconfig
```

## Requisitos

- **Node.js** >= 20
- **pnpm** >= 9

## Instalación

```bash
pnpm install
```

## Ejecución

Levantar frontend y backend a la vez desde el workspace:

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Verificar el backend:

```bash
curl http://localhost:3001/health
# { "status": "ok", "service": "qa-copilot-api" }
```

## Compilación

```bash
pnpm build
```

## Calidad

Linting con ESLint:

```bash
pnpm lint       # revisa el código
pnpm lint:fix   # revisa y corrige lo que sea posible
```

Formateo con Prettier:

```bash
pnpm format        # formatea todo el repositorio
pnpm format:check  # verifica el formato sin modificar archivos
```

Pruebas con Vitest:

```bash
pnpm test        # ejecuta las pruebas una vez
pnpm test:watch  # ejecuta las pruebas en modo watch
```

### Git hooks

El proyecto usa [Husky](https://typicode.github.io/husky/) para automatizar validaciones
en cada commit:

- **pre-commit:** ejecuta `lint-staged`, que corre ESLint y Prettier sobre los archivos
  en stage.
- **commit-msg:** ejecuta Commitlint para validar que el mensaje siga la convención de
  [Conventional Commits](https://www.conventionalcommits.org/).

Los hooks se instalan automáticamente al correr `pnpm install` (script `prepare`).

## Integración continua

El workflow de GitHub Actions (`.github/workflows/ci.yml`) corre en cada push y pull
request contra `main`: instala dependencias, ejecuta lint, verifica formato, compila y
corre las pruebas.

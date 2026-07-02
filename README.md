# QA Copilot

Plataforma conversacional especializada para **Quality Assurance**.

Este repositorio contiene el monorepo del proyecto. En su estado actual (Bootstrap)
incluye únicamente la base técnica sobre la que se construirá el producto: un frontend
mínimo y una API con un endpoint de salud. Todavía no existe lógica de negocio, chat ni
integración con IA.

## Tecnologías

- **Monorepo:** pnpm Workspaces
- **Frontend:** React + Vite + TypeScript
- **Backend:** Fastify + TypeScript
- **Lenguaje:** TypeScript en todo el proyecto

## Estructura

```text
qa-copilot/
├─ apps/
│  ├─ frontend/    # App React (Vite)
│  └─ backend/     # API Fastify
├─ packages/
│  ├─ shared/      # Tipos compartidos
│  └─ config/      # Configuración base de TypeScript
├─ docs/           # Documentación de arquitectura
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

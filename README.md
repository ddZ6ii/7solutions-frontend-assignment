# 7Solutions Frontend Assignment

Solutions to both parts of the [7Solutions frontend assignment](https://github.com/7-solutions/frontend-assignment), organised as a pnpm workspace managed with [Vite+](https://viteplus.dev).

## Apps

| App                    | Assignment                       | Description                                                | Live                                                                             |
| ---------------------- | -------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`apps/web`](apps/web) | Part 1: Auto Delete List         | Items move to their type column and return after 5 seconds | [auto-delete-list-ddz6ii.vercel.app](https://auto-delete-list-ddz6ii.vercel.app) |
| [`apps/api`](apps/api) | Part 2 (optional): data from API | HTTP API grouping dummyjson users by department            | <!-- TODO: API production URL -->                                                |

Each app has its own README with design decisions and tests: see [`apps/web/README.md`](apps/web/README.md) and [`apps/api/README.md`](apps/api/README.md).

## Getting started

**Requirements**

- Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`
- [Vite+](https://viteplus.dev) (`vp`), or pnpm `12.x`

```bash
vp install
vp run dev
```

**Available commands** (run from the repo **root**)

| Command            | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `vp run dev`       | Start both apps in development mode                       |
| `vp run dev:web`   | Start only the web app (HMR)                              |
| `vp run dev:api`   | Start only the API on http://localhost:3000               |
| `vp run build`     | Type check and build every app                            |
| `vp run preview`   | Serve the web app production build locally                |
| `vp test`          | Run all tests once across apps (`vp test watch` to watch) |
| `vp run coverage`  | Run tests with a v8 coverage report in `coverage/`        |
| `vp run test:live` | Run the API contract tests against the real dummyjson     |
| `vp run bench`     | Run the API benchmark and print the timings table         |
| `vp lint`          | Lint with Oxlint                                          |
| `vp check`         | Format, lint and type check in one pass                   |

## Workspace structure

```
apps/
├── web/                 Auto Delete List (React + Vite)
└── api/                 Departments API (Hono + Zod Mini)
tsconfig.base.json       shared compiler options
tsconfig.json            TypeScript project references
vite.config.ts           workspace lint, format and test config
pnpm-workspace.yaml      workspace packages
```

Formatting, linting, tests and coverage thresholds are configured once at the root; each app keeps its own Vite config.

## Tooling

- [TypeScript 7](https://www.typescriptlang.org): strict mode, shared base config (`tsconfig.base.json`)
- [Vite+](https://viteplus.dev): Vite, Vitest, Oxlint, Oxfmt
- [pnpm workspaces](https://pnpm.io/workspaces)

Tests run from the root as Vitest projects (one per app), with coverage thresholds of 90% statements, functions and lines, and 80% branches.

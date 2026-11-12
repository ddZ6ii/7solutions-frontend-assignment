# 7Solutions Frontend Assignment

Solutions to the [7Solutions frontend assignment](https://github.com/7-solutions/frontend-assignment), organised as a pnpm workspace managed with [Vite+](https://viteplus.dev).

## Apps

| App                    | Assignment               | Description                                                | Live                                                                             |
| ---------------------- | ------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`apps/web`](apps/web) | Part 1: Auto Delete List | Items move to their type column and return after 5 seconds | [auto-delete-list-ddz6ii.vercel.app](https://auto-delete-list-ddz6ii.vercel.app) |

Each app has its own README with design decisions, accessibility notes and tests: see [`apps/web/README.md`](apps/web/README.md).

## Getting started

**Requirements**

- Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`
- [Vite+](https://viteplus.dev) (`vp`), or pnpm `12.x`

```bash
vp install
vp run dev
```

**Available commands** (run from the repo **root**)

| Command           | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `vp run dev`      | Start the web app dev server with HMR                     |
| `vp run build`    | Type check and build every app                            |
| `vp run preview`  | Serve the web app production build locally                |
| `vp test`         | Run all tests once across apps (`vp test watch` to watch) |
| `vp run coverage` | Run tests with a v8 coverage report in `coverage/`        |
| `vp lint`         | Lint with Oxlint                                          |
| `vp check`        | Format, lint and type check in one pass                   |

## Workspace structure

```
apps/
└── web/                 Auto Delete List (React + Vite)
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

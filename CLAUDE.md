# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run build` — compile `src/` (TypeScript) to `dist/` via `tsc`.
- `npm start` — run the compiled server (`node dist/server.js`). **Run `npm run build` first**; `start` does not compile.
- No test runner, linter, or watch script is configured.

The server listens on http://localhost:3000. It requires `ANTHROPIC_API_KEY` in `.env` (loaded via `dotenv/config`; the Anthropic SDK reads it from the environment automatically).

## Architecture

A single Express server backs three browser pages that share a top nav. The split that matters: **`src/` is compiled TypeScript (backend only); `public/` is hand-written ES-module JavaScript served as-is (never compiled).** Editing frontend behavior means editing `public/*.js` directly — those files are not part of the `tsc` build.

### Backend (`src/` → `dist/`)
- `server.ts` — Express app. Serves `public/` statically, and re-serves two `node_modules` packages to the browser at fixed URLs: Leaflet at `/leaflet` and simplex-noise's ESM build at `/simplex-noise`. The frontend imports these by those URLs, so the paths in `server.ts` and the `import`/`<link>` paths in `public/` are coupled. Exposes `POST /api/chat`.
- `claude.ts` — `sendMessage()` runs the full agentic loop: streams a message, and while `stop_reason === 'tool_use'` it executes each tool, appends results, and re-calls until `end_turn`. Model is hardcoded (`claude-haiku-4-5-20251001`).
- `tools.ts` — tool definitions plus `executeTool` dispatch. Adding a tool means adding both an entry to `toolDefinitions` and a `case` in `executeTool`'s switch.
- `systemPrompt.ts` — the chat system prompt string.

### Frontend (`public/`)
- `nav.js` — injected as the first `<body>` element on every page to build the shared nav before page scripts measure containers.
- `index.html` / `index.js` — Chat UI; posts the full message history to `/api/chat`.
- `generate.html` / `generate.js` — procedural map generator. Builds normalized elevation with seeded mulberry32 + fBm simplex noise and optional radial island falloff, classifies cells into terrain bands, renders to canvas, and exports run-length-merged GeoJSON polygons.
- `map.html` — Map Viewer; loads a GeoJSON file and renders it with Leaflet.

### Cross-file couplings to preserve
- **Terrain colors are duplicated**: `TERRAIN` in `generate.js` and `TERRAIN_COLORS` in `map.html`. Keep them in sync or the viewer mis-colors exported maps.
- **Coordinate system**: the generator exports plain `[x, y]` grid coordinates with `y` flipped (row 0 = north), and the viewer reads them with Leaflet's `L.CRS.Simple` (not geographic lat/lng). Both ends must agree.

### TypeScript config notes
`tsconfig.json` is strict and uses `NodeNext` modules with `verbatimModuleSyntax`, so backend imports must use explicit `.js` extensions (e.g. `./claude.js`) and type-only imports must use `import type`. `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are on.

### Project Information
My goal is to create a game using an LLM API such as Claude. It will be similar to AI Dungeon but far less open-ended with more guard rails. The goal is to generate procedural content en mass but having the structure and definition of a game. For example, items and currency should be tracked properly, this can be achieved with the use of tools for the AI rather than relying on LLM memory.
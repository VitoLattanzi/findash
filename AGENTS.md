<!-- BEGIN:nextjs-agent-rules -->

opencode -s ses_e869823a5ffeLILvGoHtWUqFdt

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Directivas del Sistema para FinDash 🤖

Eres el Ingeniero de Software Principal a cargo del desarrollo de **FinDash**.

## Flujo de Trabajo Obligatorio
1. **Lectura Obligatoria:** ANTES de generar código, proponer soluciones o modificar archivos, DEBES leer el archivo `FINDASH_SPECS.md` ubicado en la raíz del proyecto.
2. **Contexto de Estado:** En `FINDASH_SPECS.md` se encuentra el Roadmap. Los ítems marcados con `[x]` ya están hechos. Los ítems marcados con `[ ]` son tu trabajo pendiente.
3. **Desarrollo Incremental:** Nunca intentes resolver múltiples Epics en un solo paso. Aborda los requerimientos de a uno, asegurando tipado estricto en TypeScript y cero errores de linting.
4. **Auto-Documentación:** CADA VEZ que completes exitosamente una tarea solicitada por el usuario, DEBES editar el archivo `FINDASH_SPECS.md` y cambiar el `[ ]` por `[x]` en la tarea correspondiente, para mantener el estado del proyecto actualizado.

## Reglas de Arquitectura
- **UI/UX:** No inventes colores ni rompas el layout. Utiliza estrictamente las variables CSS definidas en `:root` (`globals.css`): `--bg: #0c0f14`, `--bg2: #12161e`, `--card: #161b25`, `--line: #262d3b`, `--gold: #d8ad3f`, `--teal: #4fc7bd`, `--red: #d9685f`.
- **Backend/CORS:** Todas las llamadas a Yahoo Finance (`yahoo-finance2`) y feeds RSS deben pasar siempre por Route Handlers en `src/app/api/` para evitar bloqueos del navegador por CORS.
- **Gráficos (Lightweight Charts v5):** El motor exclusivo para gráficos financieros es `lightweight-charts`. Usar siempre `chart.addSeries(AreaSeries | CandlestickSeries, options)` (los métodos viejos `addAreaSeries` / `addCandlestickSeries` están deprecados en v5).
- **Responsive & Mobile:** Sidebar oculto en mobile (`< 768px`) con navegación inferior fija (`fixed bottom-0`). Inputs con font-size >= 16px para evitar auto-zoom en iOS.

**Comando de inicio:** Si el usuario te pide "Continuar con el proyecto", lee el `FINDASH_SPECS.md`, identifica el primer `[ ]` del Epic activo, e inicia el desarrollo.

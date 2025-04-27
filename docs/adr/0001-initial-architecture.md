# 0001 – Initial Architecture for NetRise ZeroLens GitHub Action

Date: 2025-04-27

## Status

Accepted

## Context

We need an easy-to-consume GitHub Action that uploads compiled binaries to the NetRise ZeroLens API, waits for results, generates multi-layer reports, and enforces configurable policies. Several high-level choices shape the developer and user experience:

1. **Runtime / Language** – TypeScript vs plain JavaScript vs Go vs Bash.
2. **Packaging** – Node runtime vs Docker vs Composite action.
3. **Reporting channels** – Console, `GITHUB_STEP_SUMMARY`, Markdown artefact, SARIF, PR interactions.
4. **Extensibility** – Future source-mapping, webhook back-off, parallel uploads.

## Decision

1. **Plain Node 20 LTS (ES2019+) with modern JavaScript**

   - Drops the TypeScript compile step to minimise friction during repository setup.
   - Strict mode, JSDoc typings, and ESLint provide reasonable type-safety without a build step.

2. **Bundled JavaScript Action (no Docker)**

   - Uses `esbuild` to bundle all deps into `dist/index.js` (~100 KB).
   - Works on all three runner OSes instantly—no container pull or binary download.

3. **Library Stack**

   - `@actions/core`, `@actions/github` – official helper libs.
   - `undici` – modern fetch-compatible HTTP client.
   - `esbuild` – single-pass bundle & minify.
   - `jest` + `nock` for tests.

4. **Reporting Strategy** – Four layers agreed in requirements:

   - Live console summary (emoji + colours).
   - `GITHUB_STEP_SUMMARY` Markdown table.
   - Full Markdown artefact for audits.
   - Optional SARIF for code-scanning.

5. **Policy Engine** – Simple rule checks (`fail_on_cwe`, `max_findings`, etc.) emitting exit codes `0`, `78`, `1`.

6. **Collaboration Features** – Optional PR comment + draft report PR controlled via inputs.

## Consequences

- **Pros**
  - Zero external build chain (TypeScript) reduces CI boot-time and new-contributor barrier.
  - Node ecosystem aligns with GitHub Action best practices.
  - Bundled JS avoids runtime dependency havoc.
- **Cons**
  - We lose TypeScript's compile-time type-checking; mitigation via ESLint + JSDoc.
  - Future migration to source-mapped findings may require revisiting language choice.

## Alternatives Considered

| Option                  | Reasons Rejected                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------ |
| TypeScript + tsc        | Extra build step, ts-node not supported by Actions runtime; friction when vendoring. |
| Go static binary        | Need per-OS builds, larger artefacts, indirect access to `@actions/*` helpers.       |
| Docker container Action | Slower spins, limited on Windows/macOS, cannot mount GITHUB_STEP_SUMMARY easily.     |

## Next Steps

- Implement scaffolding per tasks SC-01..03.
- Keep evaluating developer ergonomics; if plain JS becomes painful, revisit TS.

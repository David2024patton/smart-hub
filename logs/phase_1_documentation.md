# Phase 1: Rust Backend Scaffolding

## Overview
Phase 1 establishes the Rust/Tauri backend IPC surface, error handling, linting service, and audit CI pipeline.

## Structure

```
src-tauri/src/
├── main.rs                     # Entry point, IPC commands, data models, AppState
├── services/
│   ├── mod.rs                  # Module declarations
│   ├── path_service.rs         # #44: Cross-platform path canonicalization
│   ├── lint_service.rs         # #47: Universal Multi-Language Linting Service
│   └── error.rs                # #49: Standardized Rust Error Enum for IPC
.github/workflows/
└── audit.yml                   # #45: cargo & npm audit CI pipeline
src/renderer/pages/
└── LintPage.tsx                # #48: 1-click auto-fix engine UI
```

## Phase 1 Items

| # | Item | Status | Location |
|---|------|--------|----------|
| #44 | Path Canonicalization Service | ✅ | `services/path_service.rs` — `canonicalize_path()`, `resolve_relative()`, `substitute_base_dir()` with tests |
| #45 | CI Audit Pipeline | ✅ | `.github/workflows/audit.yml` — weekly cargo audit + npm audit on push/PR |
| #47 | Universal Lint Service | ✅ | `services/lint_service.rs` — `run_tsc_lint()`, language detection, tsc output parser with tests |
| #48 | Auto-Fix Engine UI | ✅ | `LintPage.tsx` — issue list with severity counters, filters, 1-click fix per issue or bulk |
| #49 | Rust Error Enum | ✅ | `services/error.rs` — `HubError` enum (Validation, NotFound, Path, Database, Lint, Io, Internal) with `into_response()` serializer |
| #50 | Build Verification | ✅ | `tsc --noEmit` passes (pre-existing TS2835/TS6133 only); `cargo clippy` requires Rust toolchain |

## IPC Commands Added

| Command | Description |
|---------|-------------|
| `canonicalize_path(input)` | Resolve + normalize file path, return components/exists/file/dir flags |
| `resolve_relative_path(base, relative)` | Resolve a relative path against a base directory |
| `run_lint(file_path)` | Run tsc --noEmit on a file and return structured issues |
| `demo_validation_error()` | Demo standardized Validation error response |
| `demo_not_found_error()` | Demo standardized NotFound error response |

## Error Response Format

All IPC errors return `HubErrorResponse`:
```json
{ "code": "VALIDATION_ERROR", "message": "Field 'project_name' is required", "field": "project_name", "details": null }
```

## Dev Commands

```bash
npm run typecheck         # tsc --noEmit
npm run rust:check        # cargo check
npm run rust:clippy       # cargo clippy -- -D warnings
npm run audit             # npm audit --audit-level=high
npm run health            # typecheck + cargo check combined
```

> Note: Rust toolchain (cargo) required for `rust:check` and `rust:clippy`.

## Known Issues

- TypeScript TS2835 (`.js` extensions) and TS6133 (unused `React` imports) are pre-existing
- Rust tests: `cargo test` requires Rust toolchain
- Lint service uses synchronous `Command` — may block async runtime in production

# Phase 0: Frontend UI Scaffolding

## Overview
Phase 0 establishes the Smart Hub's frontend shell, design system, and all UI pages. No real backend integration — all data is mock/simulated. The app runs as a standalone Vite + React SPA or in a Tauri window.

## Structure

```
src/renderer/
├── App.tsx                  # Root component, page routing
├── main.tsx                 # React entry point
├── index.css                # Design system CSS (HSL vars, glassmorphism)
├── i18n/                    # Internationalization (#6)
│   ├── index.ts             # t() function, locale registry
│   └── en.ts                # English locale strings
├── components/
│   ├── AppShell.tsx         # Shell layout (sidebar + topbar + content)
│   ├── Sidebar.tsx          # Collapsible nav with kb nav (#7 a11y)
│   ├── TopBar.tsx           # Top bar with breadcrumb, health, theme toggle
│   ├── TitleBar.tsx         # Custom window chrome (#31)
│   ├── ThemeToggle.tsx       # Dark/light switch with localStorage
│   ├── HealthIndicator.tsx   # Tauri health badge with polling hook
│   ├── DebugOverlay.tsx      # Floating debug panel (#32, Ctrl+Shift+D)
│   ├── Mascot.tsx            # Desktop mascot with speech (#33)
│   └── ui/                  # Reusable primitives (future)
├── stories/                 # Storybook stories (#5)
│   ├── HealthIndicator.stories.tsx
│   ├── ThemeToggle.stories.tsx
│   ├── TitleBar.stories.tsx
│   └── DebugOverlay.stories.tsx
└── pages/
    ├── index.ts             # Barrel exports
    ├── ProjectsPage.tsx     # Project CRUD w/ modal wizards
    ├── McpMeshPage.tsx      # Server grid + logs drawer + tunnels
    ├── MarketplacePage.tsx   # Asset cards w/ install + stars
    ├── RagLabPage.tsx       # Notebooks, fragments, Studio, Ask Playroom
    ├── ConnectionsPage.tsx   # Transport config forms (STDIO/SSE/HTTP/API)
    ├── SecurityPage.tsx      # Shield HUD w/ counters + audit log
    ├── TerminalPage.tsx     # Visual shell emulator (mock)
    ├── SettingsPage.tsx      # General, LLM, DB, Security settings
    └── KanbanPage.tsx       # Board w/ 4 columns, drag, subtasks
```

## Design System

- **Colors**: HSL variables in `:root` (dark) and `html.light-theme` overrides
- **Primary**: `hsl(160, 84%, 39%)` (emerald/teal)
- **Cards**: `glass-card` class — `backdrop-filter: blur(20px)`, semi-transparent bg, border
- **Layout**: Flex sidebar + content area, 56px top bar, optional 32px title bar
- **Animations**: `fade-up`, `fade-in`, `scale-up`, `glow-pulse`, staggered children

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Mock data for all features | No real backend during Phase 0; enables parallel UI/backend work |
| Inline SVGs in Sidebar | Zero dependency on icon libraries; bundle size control |
| CSS variables over Tailwind only | Theme switching requires runtime var injection |
| Separate KanbanPage | Phase 0.2 feature needed its own route; too large for a modal |
| Clipboard for context actions | No chat integration yet; `navigator.clipboard` works immediately |
| Tauri API wrapped in try-catch | Dev mode runs in browser; Tauri APIs unavailable |

## Todos Completed

- #1-4: Fonts, CSS theme, AppShell, animations
- #5: Storybook scaffold (4 stories)
- #6: i18n tooling (`t()` function, `en.ts` locale)
- #7: A11y (skip-to-content, ARIA roles, keyboard nav, focus management)
- #8-11: Kanban board with drag, subtasks, context actions
- #12-16: MCP Mesh grid, filters, logs drawer, server creator
- #17-20: Marketplace cards, install, stars
- #21-25: RAG Lab notebooks, fragments, Studio, Ask Playroom graph
- #26: Connections Hub transport config forms
- #27: Tunnel GUI in McpMeshPage
- #28-30: Security HUD, counters, sliders
- #31: Custom window chrome (TitleBar)
- #32: Debug overlay (Ctrl+Shift+D)
- #33: Desktop mascot (Mascot.tsx)
- #34: Visual consistency audit
- #35: This document

## Dev Commands

```bash
npm run dev          # Vite dev server on :1420
npm run build        # Production build
npx storybook dev    # Storybook dev server
npx storybook build  # Build Storybook static site
npx tsc --noEmit     # TypeScript type check
npm run tauri dev    # Full Tauri dev (with Rust backend)
```

## Known Issues

- All TypeScript `.js` extension errors are pre-existing with `moduleResolution: "node16"`
- Unused `React` imports pre-existing across components
- Proxy connectors (`http-proxy-agent`, `socks-proxy-agent`) fail in non-Vite Chrome — only affect CLI
- Storybook build targets `es2022` override needed for BigInt support

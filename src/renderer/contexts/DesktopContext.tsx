import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'

export type SnapZone = 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'full'

const PADDING = 14

export interface DesktopWindow {
  id: string
  pageId: string
  title: string
  minimized: boolean
  pinned: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  restoreBounds?: { position: { x: number; y: number }; size: { width: number; height: number } }
}

interface DesktopState {
  windows: DesktopWindow[]
  activeWindowId: string | null
  nextZIndex: number
  startMenuOpen: boolean
  snapIndicator: SnapZone | null
}

type Action =
  | { type: 'OPEN_WINDOW'; pageId: string; title?: string }
  | { type: 'CLOSE_WINDOW'; id: string }
  | { type: 'MINIMIZE_WINDOW'; id: string }
  | { type: 'RESTORE_WINDOW'; id: string }
  | { type: 'FOCUS_WINDOW'; id: string }
  | { type: 'MOVE_WINDOW'; id: string; x: number; y: number }
  | { type: 'RESIZE_WINDOW'; id: string; width: number; height: number }
  | { type: 'SNAP_WINDOW'; id: string; zone: SnapZone; desktopW: number; desktopH: number }
  | { type: 'UNMAXIMIZE_WINDOW'; id: string }
  | { type: 'SET_START_MENU'; open: boolean }
  | { type: 'SET_SNAP_INDICATOR'; zone: SnapZone | null }

let nextId = 1
function genId() { return `win-${nextId++}` }

function reducer(state: DesktopState, action: Action): DesktopState {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      if (state.windows.some(w => w.pageId === action.pageId && !w.minimized)) {
        const existing = state.windows.find(w => w.pageId === action.pageId && !w.minimized)
        if (existing) return { ...state, activeWindowId: existing.id, nextZIndex: state.nextZIndex + 1 }
      }
      const existingMinimized = state.windows.find(w => w.pageId === action.pageId && w.minimized)
      if (existingMinimized) {
        return {
          ...state,
          windows: state.windows.map(w => w.id === existingMinimized.id ? { ...w, minimized: false, zIndex: state.nextZIndex } : w),
          activeWindowId: existingMinimized.id,
          nextZIndex: state.nextZIndex + 1,
        }
      }
      const offset = (state.windows.length % 10) * 28
      const id = genId()
      const win: DesktopWindow = {
        id,
        pageId: action.pageId,
        title: action.title || action.pageId.charAt(0).toUpperCase() + action.pageId.slice(1).replace('-', ' '),
        minimized: false,
        pinned: false,
        position: { x: PADDING + offset, y: PADDING + offset },
        size: action.pageId === 'terminal' ? { width: 600, height: 400 } : { width: 720, height: 500 },
        zIndex: state.nextZIndex,
      }
      return {
        ...state,
        windows: [...state.windows, win],
        activeWindowId: id,
        nextZIndex: state.nextZIndex + 1,
      }
    }
    case 'CLOSE_WINDOW': {
      const target = state.windows.find(w => w.id === action.id)
      if (target?.pinned) return state
      const remaining = state.windows.filter(w => w.id !== action.id)
      return {
        ...state,
        windows: remaining,
        activeWindowId: state.activeWindowId === action.id
          ? (remaining.length > 0 ? remaining[remaining.length - 1].id : null)
          : state.activeWindowId,
      }
    }
    case 'MINIMIZE_WINDOW': {
      const updated = state.windows.map(w => w.id === action.id ? { ...w, minimized: true } : w)
      const otherOpen = updated.filter(w => !w.minimized)
      return {
        ...state,
        windows: updated,
        activeWindowId: state.activeWindowId === action.id
          ? (otherOpen.length > 0 ? otherOpen[otherOpen.length - 1].id : null)
          : state.activeWindowId,
      }
    }
    case 'RESTORE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w => w.id === action.id ? { ...w, minimized: false, zIndex: state.nextZIndex } : w),
        activeWindowId: action.id,
        nextZIndex: state.nextZIndex + 1,
      }
    case 'FOCUS_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w => w.id === action.id ? { ...w, zIndex: state.nextZIndex } : w),
        activeWindowId: action.id,
        nextZIndex: state.nextZIndex + 1,
      }
    case 'MOVE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w => w.id === action.id ? { ...w, position: { x: action.x, y: action.y } } : w),
      }
    case 'RESIZE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(w => w.id === action.id ? { ...w, size: { width: action.width, height: action.height } } : w),
      }
    case 'SNAP_WINDOW': {
      const dw = action.desktopW
      const dh = action.desktopH
      const iw = dw - PADDING * 2
      const ih = dh - PADDING * 2
      const zones: Record<SnapZone, { position: { x: number; y: number }; size: { width: number; height: number } }> = {
        'left': { position: { x: PADDING, y: PADDING }, size: { width: Math.floor(iw / 2), height: ih } },
        'right': { position: { x: PADDING + Math.ceil(iw / 2), y: PADDING }, size: { width: Math.floor(iw / 2), height: ih } },
        'top-left': { position: { x: PADDING, y: PADDING }, size: { width: Math.floor(iw / 2), height: Math.floor(ih / 2) } },
        'top-right': { position: { x: PADDING + Math.ceil(iw / 2), y: PADDING }, size: { width: Math.floor(iw / 2), height: Math.floor(ih / 2) } },
        'bottom-left': { position: { x: PADDING, y: PADDING + Math.ceil(ih / 2) }, size: { width: Math.floor(iw / 2), height: Math.floor(ih / 2) } },
        'bottom-right': { position: { x: PADDING + Math.ceil(iw / 2), y: PADDING + Math.ceil(ih / 2) }, size: { width: Math.floor(iw / 2), height: Math.floor(ih / 2) } },
        'full': { position: { x: 0, y: 0 }, size: { width: dw, height: dh } },
      }
      const snap = zones[action.zone]
      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.id !== action.id) return w
          const restoreBounds = action.zone === 'full' ? (w.restoreBounds || { position: w.position, size: w.size }) : undefined
          return { ...w, position: snap.position, size: snap.size, restoreBounds, zIndex: state.nextZIndex }
        }),
        activeWindowId: action.id,
        nextZIndex: state.nextZIndex + 1,
        snapIndicator: null,
      }
    }
    case 'UNMAXIMIZE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.id !== action.id || !w.restoreBounds) return w
          return { ...w, ...w.restoreBounds, restoreBounds: undefined, zIndex: state.nextZIndex }
        }),
        activeWindowId: action.id,
        nextZIndex: state.nextZIndex + 1,
      }
    }
    case 'SET_START_MENU':
      return { ...state, startMenuOpen: action.open }
    case 'SET_SNAP_INDICATOR':
      return { ...state, snapIndicator: action.zone }
    default:
      return state
  }
}

function detectSnapZone(x: number, y: number): SnapZone | null {
  const ww = window.innerWidth
  const wh = window.innerHeight
  const margin = 40
  if (y < margin) {
    if (x < margin) return 'top-left'
    if (x > ww - margin) return 'top-right'
    return 'full'
  }
  if (x < margin) return y > wh - margin ? 'bottom-left' : 'left'
  if (x > ww - margin) return y > wh - margin ? 'bottom-right' : 'right'
  return null
}

const PAGE_DEFAULTS: Record<string, string> = {
  dashboard: 'Dashboard',
  terminal: 'Terminal',
  'mcp-grid': 'MCP Mesh',
  projects: 'Projects',
  kanban: 'Kanban',
  marketplace: 'Marketplace',
  'rag-lab': 'RAG Lab',
  connections: 'Connections',
  security: 'Sovereign Shield',
  lint: 'Lint Engine',
  settings: 'Settings',
  browser: 'Web Browser',
  preview: 'Project Preview',
  'file-explorer': 'File Explorer',
}

interface DesktopContextType {
  windows: DesktopWindow[]
  activeWindowId: string | null
  startMenuOpen: boolean
  snapIndicator: SnapZone | null
  openWindow: (pageId: string) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  focusWindow: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  resizeWindow: (id: string, width: number, height: number) => void
  snapWindow: (id: string, zone: SnapZone) => void
  unmaximizeWindow: (id: string) => void
  setStartMenu: (open: boolean) => void
  setSnapIndicator: (zone: SnapZone | null) => void
  detectSnap: (x: number, y: number) => SnapZone | null
}

const DesktopContext = createContext<DesktopContextType | null>(null)

const DEFAULT_WINDOWS = ['dashboard', 'terminal', 'mcp-grid', 'file-explorer']

function buildInitialState(): DesktopState {
  const windows: DesktopWindow[] = DEFAULT_WINDOWS.map((pageId, i) => ({
    id: genId(),
    pageId,
    title: PAGE_DEFAULTS[pageId] || pageId,
    minimized: false,
    pinned: pageId === 'dashboard' || pageId === 'terminal' || pageId === 'file-explorer',
    position: { x: PADDING + i * 40, y: PADDING + i * 40 },
    size: pageId === 'terminal' ? { width: 640, height: 380 } : { width: 740, height: 520 },
    zIndex: i,
  }))
  return {
    windows,
    activeWindowId: windows[windows.length - 1].id,
    nextZIndex: windows.length,
    startMenuOpen: false,
    snapIndicator: null,
  }
}

export function DesktopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState)

  const openWindow = useCallback((pageId: string) => {
    const title = PAGE_DEFAULTS[pageId] || pageId
    dispatch({ type: 'OPEN_WINDOW', pageId, title })
  }, [])

  const closeWindow = useCallback((id: string) => dispatch({ type: 'CLOSE_WINDOW', id }), [])
  const minimizeWindow = useCallback((id: string) => dispatch({ type: 'MINIMIZE_WINDOW', id }), [])
  const restoreWindow = useCallback((id: string) => dispatch({ type: 'RESTORE_WINDOW', id }), [])
  const focusWindow = useCallback((id: string) => dispatch({ type: 'FOCUS_WINDOW', id }), [])
  const moveWindow = useCallback((id: string, x: number, y: number) => dispatch({ type: 'MOVE_WINDOW', id, x, y }), [])
  const resizeWindow = useCallback((id: string, width: number, height: number) => dispatch({ type: 'RESIZE_WINDOW', id, width, height }), [])
  const snapWindow = useCallback((id: string, zone: SnapZone) => {
    const desktopEl = document.querySelector('[data-desktop]')
    const desktopW = desktopEl ? desktopEl.clientWidth : window.innerWidth
    const desktopH = desktopEl ? desktopEl.clientHeight : window.innerHeight
    dispatch({ type: 'SNAP_WINDOW', id, zone, desktopW, desktopH })
  }, [])
  const unmaximizeWindow = useCallback((id: string) => dispatch({ type: 'UNMAXIMIZE_WINDOW', id }), [])
  const setStartMenu = useCallback((open: boolean) => dispatch({ type: 'SET_START_MENU', open }), [])
  const setSnapIndicator = useCallback((zone: SnapZone | null) => dispatch({ type: 'SET_SNAP_INDICATOR', zone }), [])

  return (
    <DesktopContext.Provider value={{
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      startMenuOpen: state.startMenuOpen,
      snapIndicator: state.snapIndicator,
      openWindow,
      closeWindow,
      minimizeWindow,
      restoreWindow,
      focusWindow,
      moveWindow,
      resizeWindow,
      snapWindow,
      unmaximizeWindow,
      setStartMenu,
      setSnapIndicator,
      detectSnap: detectSnapZone,
    }}>
      {children}
    </DesktopContext.Provider>
  )
}

export function useDesktop() {
  const ctx = useContext(DesktopContext)
  if (!ctx) throw new Error('useDesktop must be used within DesktopProvider')
  return ctx
}

import type { ITheme } from '@xterm/xterm'

const STORAGE_KEY = 'smart-hub:terminal'

export interface TermProfile {
  name: string
  shell: string
  themeName: string
  fontFamily: string
  fontSize: number
  opacity: number
}

export interface TermConfig {
  activeProfile: string
  profiles: TermProfile[]
  gridCols: number
  gridRows: number
}

const DEFAULT_PROFILES: TermProfile[] = [
  { name: 'CMD', shell: 'cmd.exe', themeName: 'vs-code-dark', fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace', fontSize: 13, opacity: 1 },
  { name: 'PowerShell', shell: 'powershell.exe', themeName: 'one-dark', fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace', fontSize: 13, opacity: 1 },
  { name: 'PowerShell Core', shell: 'pwsh.exe', themeName: 'dracula', fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace', fontSize: 13, opacity: 1 },
  { name: 'Bash (Git)', shell: 'bash', themeName: 'nord', fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace', fontSize: 13, opacity: 1 },
  { name: 'WSL Default', shell: 'wsl.exe', themeName: 'monokai', fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace', fontSize: 13, opacity: 1 },
]

export const DEFAULT_CONFIG: TermConfig = {
  activeProfile: DEFAULT_PROFILES[0].name,
  profiles: DEFAULT_PROFILES,
  gridCols: 1,
  gridRows: 1,
}

export interface TermTheme extends ITheme {
  name: string
}

export const THEMES: Record<string, TermTheme> = {
  'vs-code-dark': {
    name: 'VS Code Dark',
    background: '#0c0c0c', foreground: '#d4d4d4', cursor: '#d4d4d4', cursorAccent: '#0c0c0c',
    selectionBackground: '#264f78',
    black: '#0c0c0c', red: '#f44747', green: '#4ec9b0', yellow: '#dcdcaa',
    blue: '#569cd6', magenta: '#c586c0', cyan: '#9cdcfe', white: '#d4d4d4',
    brightBlack: '#666666', brightRed: '#f44747', brightGreen: '#4ec9b0',
    brightYellow: '#dcdcaa', brightBlue: '#569cd6', brightMagenta: '#c586c0',
    brightCyan: '#9cdcfe', brightWhite: '#d4d4d4',
  },
  'one-dark': {
    name: 'One Dark',
    background: '#282c34', foreground: '#abb2bf', cursor: '#528bff', cursorAccent: '#282c34',
    selectionBackground: '#3e4451',
    black: '#282c34', red: '#e06c75', green: '#98c379', yellow: '#e5c07b',
    blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2', white: '#abb2bf',
    brightBlack: '#5c6370', brightRed: '#e06c75', brightGreen: '#98c379',
    brightYellow: '#e5c07b', brightBlue: '#61afef', brightMagenta: '#c678dd',
    brightCyan: '#56b6c2', brightWhite: '#ffffff',
  },
  'solarized-dark': {
    name: 'Solarized Dark',
    background: '#002b36', foreground: '#839496', cursor: '#839496', cursorAccent: '#002b36',
    selectionBackground: '#073642',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
    brightBlack: '#002b36', brightRed: '#cb4b16', brightGreen: '#586e75',
    brightYellow: '#657b83', brightBlue: '#839496', brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1', brightWhite: '#fdf6e3',
  },
  'dracula': {
    name: 'Dracula',
    background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f2', cursorAccent: '#282a36',
    selectionBackground: '#44475a',
    black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
    blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
    brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94',
    brightYellow: '#ffffa5', brightBlue: '#d6acff', brightMagenta: '#ff92df',
    brightCyan: '#a4ffff', brightWhite: '#ffffff',
  },
  'nord': {
    name: 'Nord',
    background: '#2e3440', foreground: '#d8dee9', cursor: '#d8dee9', cursorAccent: '#2e3440',
    selectionBackground: '#434c5e',
    black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
    blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0',
    brightBlack: '#4c566a', brightRed: '#bf616a', brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b', brightBlue: '#81a1c1', brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb', brightWhite: '#eceff4',
  },
  'monokai': {
    name: 'Monokai',
    background: '#272822', foreground: '#f8f8f2', cursor: '#f8f8f2', cursorAccent: '#272822',
    selectionBackground: '#49483e',
    black: '#272822', red: '#f92672', green: '#a6e22e', yellow: '#f4bf75',
    blue: '#66d9ef', magenta: '#ae81ff', cyan: '#a1efe4', white: '#f8f8f2',
    brightBlack: '#75715e', brightRed: '#f92672', brightGreen: '#a6e22e',
    brightYellow: '#f4bf75', brightBlue: '#66d9ef', brightMagenta: '#ae81ff',
    brightCyan: '#a1efe4', brightWhite: '#f9f8f5',
  },
}

export function loadConfig(): TermConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw), profiles: DEFAULT_CONFIG.profiles }
  } catch {}
  return DEFAULT_CONFIG
}

export function saveConfig(config: TermConfig) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch {}
}

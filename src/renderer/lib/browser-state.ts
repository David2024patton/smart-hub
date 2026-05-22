export interface BrowserConsoleEntry {
  level: string
  args: string[]
  time: number
}

export interface BrowserNetworkEntry {
  url: string
  method: string
  status: number
  statusText: string
  duration: number
  time: number
}

const consoleLogs: BrowserConsoleEntry[] = []
const networkLogs: BrowserNetworkEntry[] = []
const MAX = 500

export function pushConsole(entry: BrowserConsoleEntry) {
  consoleLogs.push(entry)
  if (consoleLogs.length > MAX) consoleLogs.shift()
}

export function pushNetwork(entry: BrowserNetworkEntry) {
  networkLogs.push(entry)
  if (networkLogs.length > MAX) networkLogs.shift()
}

export function getBrowserState() {
  return {
    console: consoleLogs,
    network: networkLogs,
    currentUrl: typeof document !== 'undefined' ? document.querySelector<HTMLInputElement>('.browser-url-input')?.value || '' : '',
  }
}

export function clearBrowserLogs() {
  consoleLogs.length = 0
  networkLogs.length = 0
}

#!/usr/bin/env node
/**
 * Smart Hub MCP Server
 *
 * Exposes MCP tools for controlling the Smart Hub desktop environment.
 * Run during `npm run dev` to connect to localhost:1420.
 *
 * Usage: node mcp-server/smart-hub-mcp.mjs
 *
 * Configure in opencode.json:
 * {
 *   "mcpServers": {
 *     "smart-hub": {
 *       "command": "node",
 *       "args": ["mcp-server/smart-hub-mcp.mjs"]
 *     }
 *   }
 * }
 */

import { spawn } from 'child_process'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const HUB_URL = process.env.HUB_URL || 'http://localhost:1420'

async function hubFetch(endpoint, options = {}) {
  const url = `${HUB_URL}${endpoint}`
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

const server = new Server(
  { name: 'smart-hub-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'ping',
      description: 'Check if the Smart Hub is reachable',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_drives',
      description: 'List all drives on the system',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_directory',
      description: 'List files and directories at a given path',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path (e.g. C:\\ or /home)' },
        },
        required: ['path'],
      },
    },
    {
      name: 'read_file_text',
      description: 'Read the text content of a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_system_info',
      description: 'Get system information (OS, CPU, RAM, hostname)',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'open_file_os',
      description: 'Open a file with the OS default application',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
        },
        required: ['path'],
      },
    },
    {
      name: 'take_screenshot',
      description: 'Capture a screenshot of the desktop. Returns base64-encoded PNG.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'start_terminal',
      description: 'Start a terminal session. Returns the WebSocket URL to connect to.',
      inputSchema: {
        type: 'object',
        properties: {
          shell: { type: 'string', description: 'Shell to use (cmd.exe, powershell.exe, bash)', default: 'cmd.exe' },
        },
      },
    },
    {
      name: 'run_command',
      description: 'Run a shell command and return its output',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          timeout: { type: 'number', description: 'Timeout in ms (default 30000)', default: 30000 },
        },
        required: ['command'],
      },
    },
    {
      name: 'click_element',
      description: 'Click a UI element in Smart Hub by CSS selector',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the element (e.g. button, #id, [data-tooltip="Terminal"])' },
        },
        required: ['selector'],
      },
    },
    {
      name: 'type_text',
      description: 'Type text into an input field in Smart Hub',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the input element' },
          text: { type: 'string', description: 'Text to type' },
        },
        required: ['selector', 'text'],
      },
    },
    {
      name: 'navigate_page',
      description: 'Navigate to a page in Smart Hub by page ID (dashboard, terminal, mcp-grid, projects, kanban, marketplace, rag-lab, connections, security, lint, settings, file-explorer)',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID to navigate to' },
        },
        required: ['pageId'],
      },
    },
    {
      name: 'get_page_state',
      description: 'Get the current state of Smart Hub: active page, open windows, visible UI elements',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'execute_javascript',
      description: 'Execute arbitrary JavaScript in the Smart Hub browser context',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'JavaScript code to execute' },
        },
        required: ['code'],
      },
    },
    {
      name: 'get_element_text',
      description: 'Get the text content of a UI element by CSS selector',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the element' },
        },
        required: ['selector'],
      },
    },
    {
      name: 'open_window',
      description: 'Open a desktop window by page ID',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID to open (dashboard, terminal, mcp-grid, file-explorer, settings, etc.)' },
        },
        required: ['pageId'],
      },
    },
    {
      name: 'list_ui_elements',
      description: 'List all visible interactive UI elements on the current page',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'browser_get_console',
      description: 'Get all browser console logs from the Smart Hub browser DevTools',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'browser_get_network',
      description: 'Get all network requests captured by the Smart Hub browser DevTools',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'browser_navigate',
      description: 'Navigate the Smart Hub browser to a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to navigate to' },
        },
        required: ['url'],
      },
    },
    {
      name: 'browser_get_state',
      description: 'Get full browser state: current URL, console logs, network requests',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'browser_clear_logs',
      description: 'Clear all browser console and network logs',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'lint_file',
      description: 'Run the appropriate linter on a specific file (detects language by extension)',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root (e.g. src/renderer/App.tsx)' },
        },
        required: ['path'],
      },
    },
    {
      name: 'lint_code',
      description: 'Lint a code snippet by specifying the language',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Code snippet to lint' },
          language: { type: 'string', description: 'Language (ts, js, rs, py, md, html, php, java, c, cs, json, css)', default: 'ts' },
        },
        required: ['code'],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'ping': {
        try {
          await hubFetch('/api/fs/ping')
          return { content: [{ type: 'text', text: 'Smart Hub is reachable' }] }
        } catch {
          return { content: [{ type: 'text', text: 'Smart Hub is not reachable' }] }
        }
      }

      case 'list_drives': {
        const data = await hubFetch('/api/fs/drives')
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'list_directory': {
        const path = args?.path || ''
        const data = await hubFetch(`/api/fs/list?path=${encodeURIComponent(path)}`)
        const formatted = data.map(f =>
          `${f.is_dir ? '📁' : '📄'} ${f.name}${f.is_dir ? '/' : ''}  ${f.is_dir ? '' : `(${f.size} bytes)`}  ${f.modified}`
        ).join('\n')
        return { content: [{ type: 'text', text: formatted || '(empty directory)' }] }
      }

      case 'read_file_text': {
        const data = await hubFetch(`/api/fs/read?path=${encodeURIComponent(args?.path || '')}`)
        return { content: [{ type: 'text', text: data.content }] }
      }

      case 'get_system_info': {
        const data = await hubFetch('/api/fs/info')
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'open_file_os': {
        await hubFetch(`/api/fs/open?path=${encodeURIComponent(args?.path || '')}`)
        return { content: [{ type: 'text', text: `Opened ${args?.path}` }] }
      }

      case 'take_screenshot': {
        const platform = process.platform
        const tmpFile = `screenshot-${Date.now()}.png`
        let cmd = ''
        if (platform === 'win32') {
          const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
[Convert]::ToBase64String($ms.ToArray())
$graphics.Dispose(); $bmp.Dispose()
`
          return new Promise((resolve) => {
            const proc = spawn('powershell.exe', ['-NoProfile', '-Command', psScript])
            let output = ''
            proc.stdout.on('data', (d) => { output += d.toString() })
            proc.stderr.on('data', (d) => { output += d.toString() })
            proc.on('close', () => {
              const lines = output.trim().split('\n')
              const base64 = lines[lines.length - 1]?.trim()
              if (base64 && base64.length > 100) {
                resolve({ content: [{ type: 'text', text: `![screenshot](data:image/png;base64,${base64})` }] })
              } else {
                resolve({ content: [{ type: 'text', text: `Screenshot failed: ${output.slice(0, 500)}` }] })
              }
            })
            proc.on('error', (err) => {
              resolve({ content: [{ type: 'text', text: `Screenshot error: ${err.message}` }] })
            })
          })
        } else if (platform === 'darwin') {
          cmd = `screencapture -x -t png /tmp/${tmpFile} && base64 < /tmp/${tmpFile}`
        } else {
          cmd = `import -window root /tmp/${tmpFile} 2>/dev/null && base64 < /tmp/${tmpFile} || echo "Need imagemagick"`
        }
        return new Promise((resolve) => {
          let output = ''
          const proc = spawn('sh', ['-c', cmd])
          proc.stdout.on('data', (d) => { output += d.toString() })
          proc.on('close', () => {
            const base64 = output.trim()
            if (base64.length > 100) {
              resolve({ content: [{ type: 'text', text: `![screenshot](data:image/png;base64,${base64})` }] })
            } else {
              resolve({ content: [{ type: 'text', text: `Screenshot failed: ${base64}` }] })
            }
          })
          proc.on('error', (err) => {
            resolve({ content: [{ type: 'text', text: `Screenshot error: ${err.message}` }] })
          })
        })
      }

      case 'start_terminal': {
        const shell = args?.shell || 'cmd.exe'
        const wsPort = new URL(HUB_URL).port || 1420
        const wsUrl = `ws://localhost:${wsPort}/ws/terminal?shell=${encodeURIComponent(shell)}`
        return { content: [{ type: 'text', text: `Connect to: ${wsUrl}\n\nUse this WebSocket URL to open a terminal. Send JSON: {"type":"stdin","data":"<base64-encoded text>"}\nReceive JSON: {"type":"output","data":"<base64-encoded output>"}` }] }
      }

      case 'run_command': {
        const cmd = args?.command || ''
        const timeout = args?.timeout || 30000
        return new Promise((resolve) => {
          let output = ''
          const proc = spawn('cmd.exe', ['/c', cmd], { shell: false, timeout })
          proc.stdout.on('data', (d) => { output += d.toString() })
          proc.stderr.on('data', (d) => { output += d.toString() })
          proc.on('close', (code) => {
            resolve({
              content: [{
                type: 'text',
                text: `$ ${cmd}\n${output}${code !== null ? `\n[exit code: ${code}]` : ''}`,
              }],
            })
          })
          proc.on('error', (err) => {
            resolve({ content: [{ type: 'text', text: `Error: ${err.message}` }] })
          })
        })
      }

      case 'click_element': {
        const data = await hubFetch('/api/hub/click', {
          method: 'POST',
          body: JSON.stringify({ selector: args?.selector }),
        })
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'type_text': {
        const data = await hubFetch('/api/hub/type', {
          method: 'POST',
          body: JSON.stringify({ selector: args?.selector, text: args?.text }),
        })
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'navigate_page': {
        const data = await hubFetch('/api/hub/navigate', {
          method: 'POST',
          body: JSON.stringify({ pageId: args?.pageId }),
        })
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'get_page_state': {
        const data = await hubFetch('/api/hub/state')
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'execute_javascript': {
        const data = await hubFetch('/api/hub/eval', {
          method: 'POST',
          body: JSON.stringify({ code: args?.code }),
        })
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'get_element_text': {
        const data = await hubFetch('/api/hub/get-text', {
          method: 'POST',
          body: JSON.stringify({ selector: args?.selector }),
        })
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'open_window': {
        const data = await hubFetch('/api/hub/open-window', {
          method: 'POST',
          body: JSON.stringify({ pageId: args?.pageId }),
        })
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'list_ui_elements': {
        const data = await hubFetch('/api/hub/list-elements')
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'browser_get_console': {
        const data = await hubFetch('/api/hub/eval', {
          method: 'POST',
          body: JSON.stringify({ code: 'return JSON.stringify(window.__browserConsole ? window.__browserConsole.slice(-100) : [])' }),
        })
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'browser_get_network': {
        const data = await hubFetch('/api/hub/eval', {
          method: 'POST',
          body: JSON.stringify({ code: 'return JSON.stringify(window.__browserNetwork ? window.__browserNetwork.slice(-100) : [])' }),
        })
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'browser_navigate': {
        const data = await hubFetch('/api/hub/type', {
          method: 'POST',
          body: JSON.stringify({ selector: 'input[placeholder="Enter URL..."]', text: args?.url || '' }),
        })
        await hubFetch('/api/hub/click', {
          method: 'POST',
          body: JSON.stringify({ selector: 'button:has-text("Go")' }),
        })
        return { content: [{ type: 'text', text: `Navigated to ${args?.url}` }] }
      }

      case 'browser_get_state': {
        const data = await hubFetch('/api/hub/state')
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'browser_clear_logs': {
        await hubFetch('/api/hub/click', {
          method: 'POST',
          body: JSON.stringify({ selector: 'button:has-text("Clear")' }),
        })
        return { content: [{ type: 'text', text: 'Browser logs cleared' }] }
      }

      case 'lint_file': {
        const data = await hubFetch(`/api/lint/file?path=${encodeURIComponent(args?.path || '')}`)
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'lint_code': {
        const lang = args?.language || 'ts'
        const linterMap: Record<string, string> = {
          ts: 'npx tsc --noEmit --pretty false 2>&1 || true',
          js: `echo '${(args?.code || '').replace(/'/g, "'\\''")}' | npx eslint --stdin --format json 2>&1 || true`,
          rs: 'echo "Lint not supported inline for Rust. Use lint_file instead."',
          py: `echo '${(args?.code || '').replace(/'/g, "'\\''")}' | ruff check --stdin-filename snippet.py --output-format json 2>&1 || true`,
          md: 'echo "Lint not supported inline for Markdown. Use lint_file instead."',
          html: `echo '${(args?.code || '').replace(/'/g, "'\\''")}' | npx html-validate --stdin --format json 2>&1 || true`,
        }
        const cmd = linterMap[lang] || 'echo "Unsupported language"'
        return new Promise((resolve) => {
          let output = ''
          const proc = spawn('cmd.exe', ['/c', cmd], { shell: false })
          proc.stdout.on('data', (d: Buffer) => { output += d.toString() })
          proc.stderr.on('data', (d: Buffer) => { output += d.toString() })
          proc.on('close', () => {
            resolve({ content: [{ type: 'text', text: output.slice(0, 5000) || '(no output)' }] })
          })
          proc.on('error', (err: Error) => {
            resolve({ content: [{ type: 'text', text: `Error: ${err.message}` }] })
          })
        })
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }] }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Smart Hub MCP server running on stdio')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})

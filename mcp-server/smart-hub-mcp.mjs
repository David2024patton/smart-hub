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

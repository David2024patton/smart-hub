#!/usr/bin/env node
/**
 * Smart Hub MCP Server
 *
 * Universal system command execution + Smart Hub UI automation.
 * Detects platform (win32, linux, darwin, android) and runs the right commands.
 *
 * Usage: node mcp-server/smart-hub-mcp.mjs
 *
 * Configure in opencode.json:
 * { "mcpServers": { "smart-hub": { "command": "node", "args": ["mcp-server/smart-hub-mcp.mjs"] } } }
 */

import { spawn, execSync } from 'child_process'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const HUB_URL = process.env.HUB_URL || 'http://localhost:1420'
const PLATFORM = process.platform // 'win32', 'linux', 'darwin'
const isWin = PLATFORM === 'win32'
const isMac = PLATFORM === 'darwin'
const isLinux = PLATFORM === 'linux'

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

function detectShell() {
  if (isWin) return { shell: 'cmd.exe', args: ['/c'], env: 'cmd.exe' }
  if (isMac) return { shell: '/bin/zsh', args: ['-c'], env: 'zsh' }
  return { shell: '/bin/bash', args: ['-c'], env: 'bash' }
}

function getPlatformInfo() {
  return {
    platform: PLATFORM,
    isWindows: isWin,
    isMac: isMac,
    isLinux: isLinux,
    hostname: require('os').hostname(),
    arch: process.arch,
    shell: detectShell().env,
    cwd: process.cwd(),
  }
}

function runCommand(cmd, timeout = 30000) {
  return new Promise((resolve) => {
    let output = ''
    const sh = detectShell()
    try {
      const proc = spawn(sh.shell, [...sh.args, cmd], { timeout, stdio: ['pipe', 'pipe', 'pipe'] })
      proc.stdout.on('data', (d) => { output += d.toString() })
      proc.stderr.on('data', (d) => { output += d.toString() })
      proc.on('close', (code) => {
        resolve({ output, exitCode: code, platform: PLATFORM, shell: sh.env })
      })
      proc.on('error', (err) => {
        resolve({ output: `Error: ${err.message}`, exitCode: -1, platform: PLATFORM, shell: sh.env })
      })
    } catch (err) {
      resolve({ output: `Fatal: ${err.message}`, exitCode: -1, platform: PLATFORM, shell: sh.env })
    }
  })
}

const server = new Server(
  { name: 'smart-hub-mcp', version: '0.2.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'ping',
      description: 'Check if Smart Hub and the system are reachable',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      inputSchema: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City and region (e.g. "New York, US" or "London, UK"). Defaults to Smart Hub user location.', default: '' },
        },
      },
    },
    {
      name: 'get_system_info',
      description: 'Get OS, CPU, RAM, hostname, platform details',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'run_command',
      description: `Run any system command. Auto-detects platform (${PLATFORM}) and uses the correct shell (${detectShell().env}). Works on Windows, Linux, macOS, and Android.`,
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute. Uses platform-native shell.' },
          timeout: { type: 'number', description: 'Timeout in ms (default 30000)', default: 30000 },
        },
        required: ['command'],
      },
    },
    {
      name: 'run_powershell',
      description: 'Run a PowerShell command (Windows only)',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'PowerShell command to execute' },
          timeout: { type: 'number', description: 'Timeout in ms', default: 30000 },
        },
        required: ['command'],
      },
    },
    {
      name: 'run_bash',
      description: 'Run a bash/zsh command (Linux/macOS only)',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' },
          timeout: { type: 'number', description: 'Timeout in ms', default: 30000 },
        },
        required: ['command'],
      },
    },
    {
      name: 'list_drives',
      description: 'List all drives/filesystems on the system',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_directory',
      description: 'List files and directories at a given path',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' },
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
      description: 'Start an interactive terminal session via WebSocket. Returns connection info.',
      inputSchema: {
        type: 'object',
        properties: {
          shell: { type: 'string', description: `Shell to use (${isWin ? 'cmd.exe, powershell.exe, pwsh.exe, wsl.exe' : '/bin/bash, /bin/zsh, /bin/sh'})`, default: isWin ? 'cmd.exe' : '/bin/bash' },
        },
      },
    },
    {
      name: 'run_script',
      description: 'Run a multi-line script in the platform-native shell',
      inputSchema: {
        type: 'object',
        properties: {
          script: { type: 'string', description: 'Script content (multi-line commands)' },
          timeout: { type: 'number', description: 'Timeout in ms', default: 60000 },
        },
        required: ['script'],
      },
    },
    {
      name: 'click_element',
      description: 'Click a UI element in Smart Hub by CSS selector',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the element' },
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
      description: 'Navigate to page: dashboard, terminal, file-explorer, settings, browser, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
        },
        required: ['pageId'],
      },
    },
    {
      name: 'get_page_state',
      description: 'Get current Smart Hub state: active page, open windows, UI elements, browser logs',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'execute_javascript',
      description: 'Execute JavaScript in the Smart Hub browser context',
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
      description: 'Get text content of a UI element by CSS selector',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector' },
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
          pageId: { type: 'string', description: 'Page ID' },
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
      description: 'Get all browser console logs from Smart Hub DevTools',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'browser_get_network',
      description: 'Get network requests from Smart Hub browser DevTools',
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
      description: 'Get full browser state: URL, console logs, network requests',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'lint_project',
      description: 'Run all linters (tsc, eslint, cargo, ruff, markdown, html) on the project',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'lint_file',
      description: 'Run the appropriate linter on a specific file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
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
          code: { type: 'string', description: 'Code snippet' },
          language: { type: 'string', description: 'Language (ts, js, rs, py, md, html)', default: 'ts' },
        },
        required: ['code'],
      },
    },
    {
      name: 'highlight_element',
      description: 'Highlight a UI element with an optional annotation. Useful for tutorials and visual guidance.',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the element to highlight' },
          text: { type: 'string', description: 'Annotation text to show near the element', default: '' },
          color: { type: 'string', description: 'Highlight color (hex or CSS color)', default: '#4ec9b0' },
        },
        required: ['selector'],
      },
    },
    {
      name: 'highlight_clear',
      description: 'Remove all highlights and tutorial overlays from the UI',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'start_tutorial',
      description: 'Start an interactive step-by-step tutorial overlay that guides the user through UI elements',
      inputSchema: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            description: 'Array of tutorial steps',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Step title' },
                text: { type: 'string', description: 'Step description/instruction' },
                selector: { type: 'string', description: 'CSS selector for the element to focus on' },
              },
              required: ['title', 'text', 'selector'],
            },
          },
        },
        required: ['steps'],
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
          const plat = getPlatformInfo()
          return { content: [{ type: 'text', text: `Smart Hub reachable\nPlatform: ${plat.platform}\nShell: ${plat.shell}\nHost: ${plat.hostname}` }] }
        } catch {
          return { content: [{ type: 'text', text: `Smart Hub not reachable (${HUB_URL})\nPlatform: ${PLATFORM}\nShell: ${detectShell().env}` }] }
        }
      }

      case 'get_weather': {
        const location = args?.location || ''
        const params = location ? `?location=${encodeURIComponent(location)}` : ''
        const data = await hubFetch(`/api/fs/weather${params}`).catch(() => null)
        if (data) return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
        // Fallback: call weather API directly
        const loc = location || 'New York'
        const res = await fetch(`https://wttr.in/${encodeURIComponent(loc)}?format=j1`)
        const weather = await res.json()
        return { content: [{ type: 'text', text: JSON.stringify(weather, null, 2) }] }
      }

      case 'get_system_info': {
        const data = await hubFetch('/api/fs/info').catch(() => null)
        if (data) return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
        // Fallback: local system info
        const os = require('os')
        return { content: [{ type: 'text', text: JSON.stringify({
          platform: PLATFORM, hostname: os.hostname(), arch: process.arch,
          cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model || '',
          totalMem: `${(os.totalmem() / 1024 ** 3).toFixed(1)} GB`,
          freeMem: `${(os.freemem() / 1024 ** 3).toFixed(1)} GB`,
          shell: detectShell().env,
        }, null, 2) }] }
      }

      case 'run_command': {
        const cmd = args?.command || ''
        const timeout = args?.timeout || 30000
        const result = await runCommand(cmd, timeout)
        return { content: [{ type: 'text', text: `$ ${cmd}\n${result.output}${result.exitCode !== null ? `\n[exit code: ${result.exitCode}]` : ''}` }] }
      }

      case 'run_powershell': {
        if (!isWin) return { content: [{ type: 'text', text: 'PowerShell is only available on Windows' }] }
        const cmd = args?.command || ''
        return new Promise((resolve) => {
          let output = ''
          const proc = spawn('powershell.exe', ['-NoProfile', '-Command', cmd], { timeout: args?.timeout || 30000 })
          proc.stdout.on('data', (d) => { output += d.toString() })
          proc.stderr.on('data', (d) => { output += d.toString() })
          proc.on('close', (code) => resolve({ content: [{ type: 'text', text: `PS> ${cmd}\n${output}${code !== null ? `\n[exit code: ${code}]` : ''}` }] }))
          proc.on('error', (err) => resolve({ content: [{ type: 'text', text: `Error: ${err.message}` }] }))
        })
      }

      case 'run_bash': {
        if (isWin) return { content: [{ type: 'text', text: 'Bash is not the native shell on Windows. Use run_command instead, or install WSL and use wsl.exe.' }] }
        const cmd = args?.command || ''
        return new Promise((resolve) => {
          let output = ''
          const proc = spawn('/bin/bash', ['-c', cmd], { timeout: args?.timeout || 30000 })
          proc.stdout.on('data', (d) => { output += d.toString() })
          proc.stderr.on('data', (d) => { output += d.toString() })
          proc.on('close', (code) => resolve({ content: [{ type: 'text', text: `$ ${cmd}\n${output}${code !== null ? `\n[exit code: ${code}]` : ''}` }] }))
          proc.on('error', (err) => resolve({ content: [{ type: 'text', text: `Error: ${err.message}` }] }))
        })
      }

      case 'run_script': {
        const script = args?.script || ''
        const timeout = args?.timeout || 60000
        const result = await runCommand(script, timeout)
        return { content: [{ type: 'text', text: result.output || '(no output)' }] }
      }

      case 'list_drives': {
        const data = await hubFetch('/api/fs/drives').catch(() => null)
        if (data) return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
        // Fallback: local
        if (isWin) {
          const result = await runCommand('wmic logicaldisk get caption,size,freespace,drivetype /format:csv 2>nul || fsutil fsinfo drives')
          return { content: [{ type: 'text', text: result.output }] }
        }
        const result = await runCommand('df -h')
        return { content: [{ type: 'text', text: result.output }] }
      }

      case 'list_directory': {
        const data = await hubFetch(`/api/fs/list?path=${encodeURIComponent(args?.path || '')}`).catch(() => null)
        if (data) {
          const formatted = data.map(f => `${f.is_dir ? '📁' : '📄'} ${f.name}${f.is_dir ? '/' : ''}  ${f.is_dir ? '' : `(${f.size} bytes)`}  ${f.modified}`).join('\n')
          return { content: [{ type: 'text', text: formatted || '(empty directory)' }] }
        }
        // Fallback
        const result = await runCommand(isWin ? `dir "${args?.path || '.'}"` : `ls -la "${args?.path || '.'}"`)
        return { content: [{ type: 'text', text: result.output }] }
      }

      case 'read_file_text': {
        const data = await hubFetch(`/api/fs/read?path=${encodeURIComponent(args?.path || '')}`).catch(() => null)
        if (data) return { content: [{ type: 'text', text: data.content }] }
        const result = await runCommand(isWin ? `type "${args?.path}"` : `cat "${args?.path}"`)
        return { content: [{ type: 'text', text: result.output }] }
      }

      case 'open_file_os': {
        await hubFetch(`/api/fs/open?path=${encodeURIComponent(args?.path || '')}`).catch(() => {})
        if (isWin) execSync(`start "" "${args?.path}"`, { timeout: 5000 })
        else if (isMac) execSync(`open "${args?.path}"`, { timeout: 5000 })
        else execSync(`xdg-open "${args?.path}"`, { timeout: 5000 })
        return { content: [{ type: 'text', text: `Opened ${args?.path}` }] }
      }

      case 'take_screenshot': {
        if (isWin) {
          const psScript = `
Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing;
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height;
$graphics = [System.Drawing.Graphics]::FromImage($bmp);
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size);
$ms = New-Object System.IO.MemoryStream;
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png);
[Convert]::ToBase64String($ms.ToArray());
$graphics.Dispose(); $bmp.Dispose();`
          return new Promise((resolve) => {
            let output = ''
            const proc = spawn('powershell.exe', ['-NoProfile', '-Command', psScript])
            proc.stdout.on('data', (d) => { output += d.toString() })
            proc.on('close', () => {
              const lines = output.trim().split('\n')
              const base64 = lines[lines.length - 1]?.trim()
              if (base64?.length > 100) resolve({ content: [{ type: 'text', text: `![screenshot](data:image/png;base64,${base64})` }] })
              else resolve({ content: [{ type: 'text', text: `Screenshot failed: ${output.slice(0, 500)}` }] })
            })
          })
        }
        if (isMac) {
          const result = await runCommand(`screencapture -x -t png /tmp/screenshot.png && base64 < /tmp/screenshot.png`)
          return { content: [{ type: 'text', text: `![screenshot](data:image/png;base64,${result.output.trim()})` }] }
        }
        const result = await runCommand(`import -window root /tmp/screenshot.png 2>/dev/null && base64 < /tmp/screenshot.png || echo "Need imagemagick"`)
        return { content: [{ type: 'text', text: `![screenshot](data:image/png;base64,${result.output.trim()})` }] }
      }

      case 'start_terminal': {
        const shell = args?.shell || (isWin ? 'cmd.exe' : '/bin/bash')
        const wsPort = new URL(HUB_URL).port || 1420
        const wsUrl = `ws://localhost:${wsPort}/ws/terminal?shell=${encodeURIComponent(shell)}`
        return { content: [{ type: 'text', text: `Connect to: ${wsUrl}\n\nSend JSON: {"type":"stdin","data":"<base64-text>"}\nReceive JSON: {"type":"output","data":"<base64-output>"}` }] }
      }

      case 'click_element': {
        const data = await hubFetch('/api/hub/click', { method: 'POST', body: JSON.stringify({ selector: args?.selector }) })
        return { content: [{ type: 'text', text: JSON.stringify(data) }] }
      }

      case 'type_text': {
        const data = await hubFetch('/api/hub/type', { method: 'POST', body: JSON.stringify({ selector: args?.selector, text: args?.text }) })
        return { content: [{ type: 'text', text: JSON.stringify(data) }] }
      }

      case 'navigate_page': {
        const data = await hubFetch('/api/hub/navigate', { method: 'POST', body: JSON.stringify({ pageId: args?.pageId }) })
        return { content: [{ type: 'text', text: JSON.stringify(data) }] }
      }

      case 'get_page_state': {
        const data = await hubFetch('/api/hub/state')
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'execute_javascript': {
        const data = await hubFetch('/api/hub/eval', { method: 'POST', body: JSON.stringify({ code: args?.code }) })
        return { content: [{ type: 'text', text: JSON.stringify(data) }] }
      }

      case 'get_element_text': {
        const data = await hubFetch('/api/hub/get-text', { method: 'POST', body: JSON.stringify({ selector: args?.selector }) })
        return { content: [{ type: 'text', text: JSON.stringify(data) }] }
      }

      case 'open_window': {
        const data = await hubFetch('/api/hub/open-window', { method: 'POST', body: JSON.stringify({ pageId: args?.pageId }) })
        return { content: [{ type: 'text', text: JSON.stringify(data) }] }
      }

      case 'list_ui_elements': {
        const data = await hubFetch('/api/hub/list-elements')
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'browser_get_console': {
        const data = await hubFetch('/api/hub/eval', { method: 'POST', body: JSON.stringify({ code: 'return JSON.stringify(window.__browserConsole ? window.__browserConsole.slice(-100) : [])' }) })
        return { content: [{ type: 'text', text: JSON.stringify(data) }] }
      }

      case 'browser_get_network': {
        const data = await hubFetch('/api/hub/eval', { method: 'POST', body: JSON.stringify({ code: 'return JSON.stringify(window.__browserNetwork ? window.__browserNetwork.slice(-100) : [])' }) })
        return { content: [{ type: 'text', text: JSON.stringify(data) }] }
      }

      case 'browser_navigate': {
        const data = await hubFetch('/api/hub/type', { method: 'POST', body: JSON.stringify({ selector: 'input[placeholder="Enter URL..."]', text: args?.url || '' }) })
        await hubFetch('/api/hub/click', { method: 'POST', body: JSON.stringify({ selector: 'button:has-text("Go")' }) })
        return { content: [{ type: 'text', text: `Navigated to ${args?.url}` }] }
      }

      case 'browser_get_state': {
        const data = await hubFetch('/api/hub/state')
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'lint_project': {
        const data = await hubFetch('/api/lint/run')
        const issues = data.issues || []
        const byLinter = {}
        for (const i of issues) {
          byLinter[i.linter] = (byLinter[i.linter] || 0) + 1
        }
        const summary = Object.entries(byLinter).map(([l, c]) => `${l}: ${c}`).join(', ')
        return { content: [{ type: 'text', text: `Found ${issues.length} issues (${summary})\n${JSON.stringify(issues.slice(0, 50), null, 2)}` }] }
      }

      case 'lint_file': {
        const data = await hubFetch(`/api/lint/file?path=${encodeURIComponent(args?.path || '')}`)
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }

      case 'lint_code': {
        const lang = args?.language || 'ts'
        const code = args?.code || ''
        const escaped = code.replace(/'/g, "'\\''")
        const cmds = {
          ts: `echo '${escaped}' | npx tsc --noEmit --pretty false --stdin 2>&1 || true`,
          py: `echo '${escaped}' | ruff check --stdin-filename snippet.py --output-format json 2>&1 || true`,
          html: `echo '${escaped}' | npx html-validate --stdin --format json 2>&1 || true`,
        }
        const cmd = cmds[lang] || `echo '${escaped}' | npx eslint --stdin --format json 2>&1 || true`
        const result = await runCommand(cmd)
        return { content: [{ type: 'text', text: result.output || '(no issues)' }] }
      }

      case 'highlight_element': {
        await hubFetch('/api/hub/eval', {
          method: 'POST',
          body: JSON.stringify({
            code: `window.dispatchEvent(new CustomEvent('hub-highlight',{detail:{type:'highlight',data:{selector:${JSON.stringify(args?.selector)},text:${JSON.stringify(args?.text || '')},color:${JSON.stringify(args?.color || '#4ec9b0')}}}}))`,
          }),
        })
        return { content: [{ type: 'text', text: `Highlighted ${args?.selector}` }] }
      }

      case 'highlight_clear': {
        await hubFetch('/api/hub/eval', {
          method: 'POST',
          body: JSON.stringify({
            code: `window.dispatchEvent(new CustomEvent('hub-highlight',{detail:{type:'highlight-clear',data:{}}}))`,
          }),
        })
        return { content: [{ type: 'text', text: 'Highlights cleared' }] }
      }

      case 'start_tutorial': {
        await hubFetch('/api/hub/eval', {
          method: 'POST',
          body: JSON.stringify({
            code: `window.dispatchEvent(new CustomEvent('hub-highlight',{detail:{type:'tutorial',data:{steps:${JSON.stringify(args?.steps || [])}}}}))`,
          }),
        })
        return { content: [{ type: 'text', text: `Tutorial started with ${args?.steps?.length || 0} steps` }] }
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
  console.error('Smart Hub MCP server v0.2.0 running on stdio')
  console.error(`Platform: ${PLATFORM}, Shell: ${detectShell().env}, Hub: ${HUB_URL}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})

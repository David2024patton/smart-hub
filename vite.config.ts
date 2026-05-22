/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';
import { Client } from 'ssh2';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

function getWindowsDiskInfo(): Record<string, { total_gb: number; available_gb: number; drive_type: string; total_space: number; available_space: number }> {
  const result: Record<string, any> = {}
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i)
    const root = letter + ':\\'
    try {
      fs.accessSync(root)
      const stat = fs.statfsSync(root)
      const total = Number(stat.blocks) * Number(stat.bsize)
      const free = Number(stat.bavail) * Number(stat.bsize)
      const typeMap: Record<number, string> = { 2: 'Fixed', 3: 'Removable', 6: 'exFAT', 11: 'ReFS' }
      result[letter + ':'] = {
        total_gb: +(total / (1024 ** 3)).toFixed(1),
        available_gb: +(free / (1024 ** 3)).toFixed(1),
        drive_type: typeMap[stat.type] || 'Fixed',
        total_space: total,
        available_space: free,
      }
    } catch {}
  }
  return result
}

function fsApiPlugin() {
  return {
    name: 'fs-api',
    configureServer(server: any) {
      // Terminal WebSocket — uses noServer to avoid conflicting with Vite's HMR WebSocket
      const termWss = new WebSocketServer({ noServer: true })
      const MAX_BUF = 500
      interface TermSession {
        id: string; type: 'local' | 'ssh'; shell?: string; proc?: any; ssh?: any; stream?: any
        buf: string[]; watchers: Set<any>
      }
      const sessions = new Map<string, TermSession>()
      let termIdCounter = 0

      function broadcast(session: TermSession, data: string) {
        const encoded = Buffer.from(data).toString('base64')
        session.buf.push(encoded)
        if (session.buf.length > MAX_BUF) session.buf.shift()
        for (const ws of session.watchers) {
          try { ws.send(JSON.stringify({ type: 'output', id: session.id, data: encoded })) } catch {}
        }
      }

      server.httpServer.on('upgrade', (req: any, socket: any, head: any) => {
        if (req.url?.startsWith('/ws/terminal')) {
          termWss.handleUpgrade(req, socket, head, (ws: any) => {
            termWss.emit('connection', ws, req)
          })
        }
      })

      termWss.on('connection', (ws: any, req: any) => {
        const params = new URL(req.url || '', 'http://localhost').searchParams
        const shell = params.get('shell') || (os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash')
        const cols = parseInt(params.get('cols') || '80')
        const rows = parseInt(params.get('rows') || '24')
        const resumeId = params.get('resume') || ''
        let session: TermSession

        // Resume existing session or create new
        if (resumeId && sessions.has(resumeId)) {
          session = sessions.get(resumeId)!
          session.watchers.add(ws)
          ws.send(JSON.stringify({ type: 'init', id: session.id }))
          // Replay output buffer
          for (const data of session.buf) {
            ws.send(JSON.stringify({ type: 'output', id: session.id, data }))
          }
        } else {
          const id = resumeId || `term-${++termIdCounter}`
          session = { id, type: 'local', shell, proc: null, buf: [], watchers: new Set([ws]) }
          let proc: any
          try {
            proc = pty.spawn(shell, [], { name: 'xterm-256color', cols, rows, useConpty: true })
            session.proc = proc
            sessions.set(id, session)
          } catch { ws.close(); return }
          ws.send(JSON.stringify({ type: 'init', id }))
          proc.onData((data: string) => broadcast(session, data))
          proc.onExit((ev: { exitCode: number }) => {
            for (const w of session.watchers) try { w.send(JSON.stringify({ type: 'exit', id, code: ev.exitCode })) } catch {}
            sessions.delete(id)
          })
        }

        ws.on('message', (raw: string) => {
          try {
            const msg = JSON.parse(raw.toString())
            if (msg.type === 'stdin' && msg.data) {
              if (session.type === 'ssh' && session.stream) session.stream.write(Buffer.from(msg.data, 'base64').toString('utf-8'))
              else if (session.proc) session.proc.write(Buffer.from(msg.data, 'base64').toString('utf-8'))
            }
            if (msg.type === 'resize' && msg.cols && msg.rows) {
              if (session.proc) session.proc.resize(msg.cols, msg.rows)
              if (session.ssh && session.stream) session.stream.setWindow(msg.rows, msg.cols, 0, 0)
            }
            if (msg.type === 'kill') {
              if (session.proc) session.proc.kill()
              if (session.ssh) session.ssh.end()
            }
            // SSH connect
            if (msg.type === 'ssh-connect' && msg.host) {
              const ssh = new Client()
              session.type = 'ssh'
              session.ssh = ssh
              ws.send(JSON.stringify({ type: 'info', id: session.id, data: btoa(`Connecting to ${msg.host}:${msg.port || 22}...\r\n`) }))
              ssh.on('ready', () => {
                ssh.shell({ term: 'xterm-256color', cols, rows }, (err: any, stream: any) => {
                  if (err) { ws.send(JSON.stringify({ type: 'info', id: session.id, data: btoa(`SSH shell error: ${err.message}\r\n`) })); return }
                  session.stream = stream
                  ws.send(JSON.stringify({ type: 'info', id: session.id, data: btoa(`Connected to ${msg.host}\r\n`) }))
                  stream.on('data', (d: Buffer) => broadcast(session, d.toString('utf-8')))
                  stream.stderr.on('data', (d: Buffer) => broadcast(session, d.toString('utf-8')))
                  stream.on('close', () => {
                    for (const w of session.watchers) try { w.send(JSON.stringify({ type: 'exit', id: session.id, code: 0 })) } catch {}
                    sessions.delete(session.id)
                  })
                })
              })
              ssh.on('error', (err: Error) => {
                ws.send(JSON.stringify({ type: 'info', id: session.id, data: btoa(`SSH error: ${err.message}\r\n`) }))
              })
              ssh.connect({ host: msg.host, port: msg.port || 22, username: msg.username, password: msg.password, readyTimeout: 10000 })
            }
          } catch {}
        })
        ws.on('close', () => {
          session.watchers.delete(ws)
          if (session.watchers.size === 0 && session.type === 'ssh') {
            if (session.ssh) session.ssh.end()
            sessions.delete(session.id)
          }
        })
      })

      // Hub Control WebSocket — bidirectional bridge for AI agent UI automation
      const hubWss = new WebSocketServer({ noServer: true })
      let hubBrowser: any = null
      const pendingCommands = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void; timer: any }>()
      let cmdIdCounter = 0

      server.httpServer.on('upgrade', (req: any, socket: any, head: any) => {
        if (req.url?.startsWith('/ws/hub')) {
          hubWss.handleUpgrade(req, socket, head, (ws: any) => {
            hubWss.emit('connection', ws, req)
          })
        }
      })

      hubWss.on('connection', (ws: any) => {
        hubBrowser = ws
        ws.on('message', (raw: string) => {
          try {
            const msg = JSON.parse(raw.toString())
            if (msg.type === 'result' && msg.cmdId && pendingCommands.has(msg.cmdId)) {
              const pc = pendingCommands.get(msg.cmdId)!
              clearTimeout(pc.timer)
              pendingCommands.delete(msg.cmdId)
              pc.resolve(msg.result)
            }
            if (msg.type === 'error' && msg.cmdId && pendingCommands.has(msg.cmdId)) {
              const pc = pendingCommands.get(msg.cmdId)!
              clearTimeout(pc.timer)
              pendingCommands.delete(msg.cmdId)
              pc.reject(new Error(msg.error || 'Unknown error'))
            }
          } catch {}
        })
        ws.on('close', () => { hubBrowser = null })
      })

      function sendToBrowser(action: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
          if (!hubBrowser) return reject(new Error('No browser connected'))
          const cmdId = `cmd-${++cmdIdCounter}`
          const timer = setTimeout(() => {
            pendingCommands.delete(cmdId)
            reject(new Error('Command timed out'))
          }, 15000)
          pendingCommands.set(cmdId, { resolve, reject, timer })
          hubBrowser.send(JSON.stringify({ type: 'execute', cmdId, action, payload }))
        })
      }

      // Hub Control HTTP API
      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/hub/')) return next()
        const url = new URL(req.url, 'http://localhost')
        const endpoint = url.pathname.replace('/api/hub/', '')
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        const body = (cb: (d: any) => void) => {
          let data = ''
          req.on('data', (c: string) => data += c)
          req.on('end', () => { try { cb(JSON.parse(data || '{}')) } catch { cb({}) } })
        }

        try {
          if (endpoint === 'ping') { res.end(JSON.stringify({ ok: true, browser: !!hubBrowser })); return }

          if (endpoint === 'state') {
            sendToBrowser('getState', {}).then(state => res.end(JSON.stringify({ ok: true, state })))
              .catch(err => res.end(JSON.stringify({ ok: false, error: err.message })))
            return
          }

          if (endpoint === 'click') {
            body(d => {
              sendToBrowser('click', d).then(r => res.end(JSON.stringify({ ok: true, result: r })))
                .catch(err => res.end(JSON.stringify({ ok: false, error: err.message })))
            })
            return
          }

          if (endpoint === 'type') {
            body(d => {
              sendToBrowser('type', d).then(r => res.end(JSON.stringify({ ok: true, result: r })))
                .catch(err => res.end(JSON.stringify({ ok: false, error: err.message })))
            })
            return
          }

          if (endpoint === 'navigate') {
            body(d => {
              sendToBrowser('navigate', d).then(r => res.end(JSON.stringify({ ok: true, result: r })))
                .catch(err => res.end(JSON.stringify({ ok: false, error: err.message })))
            })
            return
          }

          if (endpoint === 'eval') {
            body(d => {
              sendToBrowser('eval', d).then(r => res.end(JSON.stringify({ ok: true, result: r })))
                .catch(err => res.end(JSON.stringify({ ok: false, error: err.message })))
            })
            return
          }

          if (endpoint === 'open-window') {
            body(d => {
              sendToBrowser('openWindow', d).then(r => res.end(JSON.stringify({ ok: true, result: r })))
                .catch(err => res.end(JSON.stringify({ ok: false, error: err.message })))
            })
            return
          }

          if (endpoint === 'get-text') {
            body(d => {
              sendToBrowser('getText', d).then(r => res.end(JSON.stringify({ ok: true, result: r })))
                .catch(err => res.end(JSON.stringify({ ok: false, error: err.message })))
            })
            return
          }

          if (endpoint === 'list-elements') {
            sendToBrowser('listElements', {}).then(r => res.end(JSON.stringify({ ok: true, result: r })))
              .catch(err => res.end(JSON.stringify({ ok: false, error: err.message })))
            return
          }

          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Unknown hub endpoint' }))
        } catch (err: any) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })

      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/fs/')) return next()
        const url = new URL(req.url, 'http://localhost')
        const endpoint = url.pathname.replace('/api/fs/', '')
        res.setHeader('Content-Type', 'application/json')

        try {
          if (endpoint === 'ping') {
            res.end(JSON.stringify({ ok: true }))
            return
          }

          if (endpoint === 'list') {
            const dirPath = url.searchParams.get('path') || ''
            const entries = fs.readdirSync(dirPath, { withFileTypes: true })
            const result = entries.map(e => {
              const fullPath = path.join(dirPath, e.name)
              let stat
              try { stat = fs.statSync(fullPath) } catch { stat = null }
              return {
                name: e.name,
                path: fullPath,
                is_dir: e.isDirectory(),
                is_file: e.isFile(),
                size: stat?.size || 0,
                modified: stat?.mtime ? new Date(stat.mtime).toISOString().replace('T', ' ').split('.')[0] : '',
                extension: e.isFile() ? path.extname(e.name).replace(/^\./, '') : '',
              }
            })
            // dirs first, then alphabetical
            result.sort((a: any, b: any) => {
              if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
              return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            })
            res.end(JSON.stringify(result))
            return
          }

          if (endpoint === 'drives') {
            const platform = os.platform()
            const diskInfo = platform === 'win32' ? getWindowsDiskInfo() : {}
            let drives: any[] = []
            if (platform === 'win32') {
              for (let i = 65; i <= 90; i++) {
                const letter = String.fromCharCode(i)
                const root = letter + ':\\'
                try {
                  fs.statSync(root)
                  const info = diskInfo[letter + ':']
                  drives.push({
                    name: letter + ':',
                    mount_point: root,
                    total_space: info?.total_space || 0,
                    available_space: info?.available_space || 0,
                    drive_type: info?.drive_type || 'Fixed',
                  })
                } catch {}
              }
            } else {
              drives.push({ name: '/', mount_point: '/', total_space: 0, available_space: 0, drive_type: 'Root' })
            }
            res.end(JSON.stringify(drives))
            return
          }

          if (endpoint === 'read') {
            const filePath = url.searchParams.get('path') || ''
            const content = fs.readFileSync(filePath, 'utf-8')
            res.end(JSON.stringify({ content }))
            return
          }

          if (endpoint === 'read-binary') {
            const filePath = url.searchParams.get('path') || ''
            const data = fs.readFileSync(filePath)
            const base64 = data.toString('base64')
            res.end(JSON.stringify({ content: base64 }))
            return
          }

          if (endpoint === 'info') {
            const cpus = os.cpus()
            const totalMem = os.totalmem()
            const freeMem = os.freemem()
            res.end(JSON.stringify({
              os_name: os.type(),
              os_version: os.release(),
              cpu_brand: cpus.length > 0 ? cpus[0].model : 'Unknown',
              cpu_cores: cpus.length,
              memory_total_gb: +(totalMem / 1024 ** 3).toFixed(1),
              memory_used_gb: +((totalMem - freeMem) / 1024 ** 3).toFixed(1),
              hostname: os.hostname(),
              kernel_version: os.release(),
            }))
            return
          }

          if (endpoint === 'disks') {
            const platform = os.platform()
            const diskInfo = platform === 'win32' ? getWindowsDiskInfo() : {}
            let disks: any[] = []
            if (platform === 'win32') {
              for (let i = 65; i <= 90; i++) {
                const letter = String.fromCharCode(i)
                const root = letter + ':\\'
                try {
                  fs.statSync(root)
                  const info = diskInfo[letter + ':']
                  disks.push({
                    mount_point: root,
                    total_gb: info?.total_gb || 0,
                    available_gb: info?.available_gb || 0,
                    filesystem: 'NTFS',
                  })
                } catch {}
              }
            } else {
              disks.push({ mount_point: '/', total_gb: 0, available_gb: 0, filesystem: 'ext4' })
            }
            res.end(JSON.stringify(disks))
            return
          }

          if (endpoint === 'serve') {
            const filePath = url.searchParams.get('path') || ''
            const data = fs.readFileSync(filePath)
            const ext = path.extname(filePath).toLowerCase()
            const mimeTypes: Record<string, string> = {
              '.pdf': 'application/pdf',
              '.mp4': 'video/mp4',
              '.webm': 'video/webm',
              '.mov': 'video/quicktime',
              '.avi': 'video/x-msvideo',
              '.mkv': 'video/x-matroska',
              '.mp3': 'audio/mpeg',
              '.wav': 'audio/wav',
              '.flac': 'audio/flac',
              '.aac': 'audio/aac',
              '.ogg': 'audio/ogg',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
              '.bmp': 'image/bmp',
              '.ico': 'image/x-icon',
              '.webp': 'image/webp',
            }
            const contentType = mimeTypes[ext] || 'application/octet-stream'
            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Length', data.length)
            res.setHeader('Accept-Ranges', 'bytes')
            res.end(data)
            return
          }

          if (endpoint === 'open') {
            const filePath = url.searchParams.get('path') || ''
            const platform = os.platform()
            const cmd = platform === 'win32' ? `start "" "${filePath}"` : platform === 'darwin' ? `open "${filePath}"` : `xdg-open "${filePath}"`
            execSync(cmd, { timeout: 5000 })
            res.end(JSON.stringify({ ok: true }))
            return
          }

          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Unknown endpoint' }))
        } catch (err: any) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss(), fsApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
      '@components': path.resolve(__dirname, './src/renderer/components'),
      '@hooks': path.resolve(__dirname, './src/renderer/hooks'),
      '@utils': path.resolve(__dirname, './src/renderer/utils')
    }
  },
  // Prevent vite from obscuring rust errors
  clearScreen: false,
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    strictPort: true,
    port: 1420
  },
  // env variables starting with TAURI_ are exposed to the frontend
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});
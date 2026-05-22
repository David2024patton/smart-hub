/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync, spawn } from 'child_process';
import { WebSocketServer } from 'ws';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

function getWindowsDiskInfo(): Record<string, { total_gb: number; available_gb: number; drive_type: string; total_space: number; available_space: number }> {
  try {
    const out = execSync('wmic logicaldisk get caption,size,freespace,drivetype /format:csv', { encoding: 'utf8', timeout: 5000 })
    const lines = out.trim().split('\n').slice(1)
    const result: Record<string, any> = {}
    for (const line of lines) {
      const parts = line.trim().split(',')
      if (parts.length < 4) continue
      const [, caption, driveType, freeSpace, size] = parts
      const letter = caption?.trim()?.toUpperCase()
      if (!letter) continue
      const total = parseInt(size || '0')
      const free = parseInt(freeSpace || '0')
      const typeMap: Record<string, string> = { '1': 'No Root', '2': 'Removable', '3': 'Fixed', '4': 'Network', '5': 'CD-ROM', '6': 'RAM' }
      result[letter] = {
        total_gb: +(total / (1024 ** 3)).toFixed(1),
        available_gb: +(free / (1024 ** 3)).toFixed(1),
        drive_type: typeMap[driveType?.trim()] || 'Fixed',
        total_space: total,
        available_space: free,
      }
    }
    return result
  } catch {
    return {}
  }
}

function fsApiPlugin() {
  return {
    name: 'fs-api',
    configureServer(server: any) {
      // Terminal WebSocket — uses noServer to avoid conflicting with Vite's HMR WebSocket
      const termWss = new WebSocketServer({ noServer: true })
      const terminals = new Map<string, { proc: any; shell: string }>()
      let termIdCounter = 0

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
        const id = `term-${++termIdCounter}`
        let proc: any
        try {
          proc = spawn(shell, [], { stdio: ['pipe', 'pipe', 'pipe'] })
        } catch {
          ws.close()
          return
        }
        terminals.set(id, { proc, shell })
        ws.send(JSON.stringify({ type: 'init', id }))
        proc.stdout.on('data', (data: Buffer) => { ws.send(JSON.stringify({ type: 'output', id, data: data.toString('base64') })) })
        proc.stderr.on('data', (data: Buffer) => { ws.send(JSON.stringify({ type: 'output', id, data: data.toString('base64') })) })
        proc.on('error', () => { ws.close(); terminals.delete(id) })
        proc.on('close', (code: number) => { ws.send(JSON.stringify({ type: 'exit', id, code })); terminals.delete(id) })
        ws.on('message', (raw: string) => {
          try {
            const msg = JSON.parse(raw.toString())
            if (msg.type === 'stdin' && msg.data) proc.stdin.write(Buffer.from(msg.data, 'base64'))
            if (msg.type === 'kill') proc.kill()
          } catch {}
        })
        ws.on('close', () => { try { proc.kill() } catch {}; terminals.delete(id) })
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
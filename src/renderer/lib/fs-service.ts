let backendType: 'vite' | 'tauri' | 'mock' | null = null

async function detectBackend(): Promise<'vite' | 'tauri' | 'mock'> {
  if (backendType !== null) return backendType

  // Try Vite API (available during npm run dev)
  try {
    const res = await fetch('/api/fs/ping')
    if (res.ok) {
      backendType = 'vite'
      return backendType
    }
  } catch {}

  // Try Tauri IPC
  try {
    const { invoke } = await import('@tauri-apps/api/tauri')
    await invoke('health_check')
    backendType = 'tauri'
    return backendType
  } catch {}

  backendType = 'mock'
  return backendType
}

async function viteFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  const res = await fetch(`/api/fs/${endpoint}${qs}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export interface FileEntry {
  name: string
  path: string
  is_dir: boolean
  is_file: boolean
  size: number
  modified: string
  extension: string
}

export interface DriveEntry {
  name: string
  mount_point: string
  total_space: number
  available_space: number
  drive_type: string
}

export interface VolumeEntry {
  type: 'folder' | 'drive'
  name: string
  path?: string
  label?: string
  mount_point?: string
  total_gb?: number
  available_gb?: number
  total_space?: number
  available_space?: number
  drive_type?: string
}

export interface SystemInfo {
  os_name: string
  os_version: string
  cpu_brand: string
  cpu_cores: number
  memory_total_gb: number
  memory_used_gb: number
  hostname: string
  kernel_version: string
}

export interface DiskUsage {
  mount_point: string
  total_gb: number
  available_gb: number
  filesystem: string
}

export async function listDirectory(dirPath: string): Promise<FileEntry[]> {
  const backend = await detectBackend()
  if (backend === 'vite') return viteFetch<FileEntry[]>('list', { path: dirPath })
  if (backend === 'tauri') {
    const { invoke } = await import('@tauri-apps/api/tauri')
    return invoke<FileEntry[]>('list_directory', { path: dirPath })
  }
  return getMockFiles(dirPath)
}

export async function getDrives(): Promise<DriveEntry[]> {
  const backend = await detectBackend()
  if (backend === 'vite') return viteFetch<DriveEntry[]>('drives')
  if (backend === 'tauri') {
    const { invoke } = await import('@tauri-apps/api/tauri')
    return invoke<DriveEntry[]>('get_drives')
  }
  return getMockDrives()
}

export async function getVolumes(): Promise<VolumeEntry[]> {
  const backend = await detectBackend()
  if (backend === 'vite') return viteFetch<VolumeEntry[]>('volumes')
  return []
}

export async function getSystemInfo(): Promise<SystemInfo | null> {
  const backend = await detectBackend()
  if (backend === 'vite') return viteFetch<SystemInfo>('info')
  if (backend === 'tauri') {
    const { invoke } = await import('@tauri-apps/api/tauri')
    return invoke<SystemInfo>('get_system_info')
  }
  return null
}

export async function getDiskUsage(): Promise<DiskUsage[]> {
  const backend = await detectBackend()
  if (backend === 'vite') return viteFetch<DiskUsage[]>('disks')
  if (backend === 'tauri') {
    const { invoke } = await import('@tauri-apps/api/tauri')
    return invoke<DiskUsage[]>('get_disk_usage')
  }
  return getMockDiskUsage()
}

export async function readTextFile(filePath: string): Promise<string> {
  const backend = await detectBackend()
  if (backend === 'vite') {
    const data = await viteFetch<{ content: string }>('read', { path: filePath })
    return data.content
  }
  if (backend === 'tauri') {
    const { invoke } = await import('@tauri-apps/api/tauri')
    return invoke<string>('read_text_file', { path: filePath })
  }
  throw new Error('File preview not available')
}

export async function readBinaryFile(filePath: string): Promise<string> {
  const backend = await detectBackend()
  if (backend === 'vite') {
    const data = await viteFetch<{ content: string }>('read-binary', { path: filePath })
    return data.content
  }
  if (backend === 'tauri') {
    const { invoke } = await import('@tauri-apps/api/tauri')
    return invoke<string>('read_file_binary', { path: filePath })
  }
  throw new Error('Binary preview not available')
}

export async function getServeUrl(filePath: string): Promise<string | null> {
  const backend = await detectBackend()
  if (backend === 'vite') return `/api/fs/serve?path=${encodeURIComponent(filePath)}`
  if (backend === 'tauri') {
    try {
      const data = await readBinaryFile(filePath)
      const dotIdx = filePath.lastIndexOf('.')
      const ext = dotIdx !== -1 ? filePath.slice(dotIdx).toLowerCase() : ''
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm',
        '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
        '.ogg': 'audio/ogg', '.png': 'image/png', '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
      }
      const mime = mimeTypes[ext] || 'application/octet-stream'
      const binaryStr = atob(data)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
      const blob = new Blob([bytes], { type: mime })
      return URL.createObjectURL(blob)
    } catch { return null }
  }
  return null
}

export async function openFile(filePath: string): Promise<void> {
  const backend = await detectBackend()
  if (backend === 'vite') {
    // In the browser, we can try window.open or just show a message
    const res = await fetch(`/api/fs/open?path=${encodeURIComponent(filePath)}`)
    if (!res.ok) throw new Error('Cannot open file')
    return
  }
  if (backend === 'tauri') {
    const { invoke } = await import('@tauri-apps/api/tauri')
    await invoke('open_file', { path: filePath })
    return
  }
  throw new Error('Cannot open file in this environment')
}

function getMockDrives(): DriveEntry[] {
  if (typeof navigator !== 'undefined' && /Win/i.test(navigator.platform)) {
    return [
      { name: 'C:', mount_point: 'C:\\', total_space: 512_000_000_000, available_space: 128_000_000_000, drive_type: 'Fixed' },
      { name: 'D:', mount_point: 'D:\\', total_space: 1_000_000_000_000, available_space: 600_000_000_000, drive_type: 'Fixed' },
    ]
  }
  return [
    { name: 'root', mount_point: '/', total_space: 512_000_000_000, available_space: 128_000_000_000, drive_type: 'Root' },
  ]
}

function getMockDiskUsage(): DiskUsage[] {
  return [
    { mount_point: 'C:\\', total_gb: 476, available_gb: 119, filesystem: 'NTFS' },
    { mount_point: 'D:\\', total_gb: 931, available_gb: 558, filesystem: 'NTFS' },
  ]
}

function getMockFiles(_path: string): FileEntry[] {
  return [
    { name: 'Documents', path: _path + '/Documents', is_dir: true, is_file: false, size: 4096, modified: '2026-04-01 11:00:00', extension: '' },
    { name: 'Pictures', path: _path + '/Pictures', is_dir: true, is_file: false, size: 4096, modified: '2026-04-01 11:00:00', extension: '' },
    { name: 'file.txt', path: _path + '/file.txt', is_dir: false, is_file: true, size: 2048, modified: '2026-05-20 16:30:00', extension: 'txt' },
  ]
}

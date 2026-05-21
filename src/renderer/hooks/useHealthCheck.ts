// src/renderer/hooks/useHealthCheck.ts
// Smart Hub | Health Check Hook for Backend Monitoring
// Phase 1.6: Health Endpoint & Diagnostics Service

import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'

export interface HealthData {
  status: string
  timestamp: string
  system: {
    cpu_load_percent: number
    memory_used_mb: number
    memory_total_mb: number
    uptime_seconds: number
  }
  database: {
    connected: boolean
    connection_pool_size: number
    active_connections: number
  }
  active_sessions: string[]
  log_buffer: string[]
}

interface UseHealthCheckReturn {
  health: HealthData | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds

export function useHealthCheck(intervalMs: number = HEALTH_CHECK_INTERVAL): UseHealthCheckReturn {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await invoke<HealthData>('health_check')
      setHealth(result)
    } catch (err) {
      // Expected during development when backend isn't running
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      setHealth(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchHealth()
    
    // Set up polling interval
    const intervalId = setInterval(fetchHealth, intervalMs)
    
    // Cleanup
    return () => clearInterval(intervalId)
  }, [fetchHealth, intervalMs])

  return {
    health,
    isLoading,
    error,
    refresh: fetchHealth,
  }
}

// src/renderer/components/HealthIndicator.tsx
// Smart Hub | Backend Health Status Indicator
// Phase 1.6: Health Endpoint & Diagnostics Service

import React from 'react'

interface HealthIndicatorProps {
  status: string
  isLoading: boolean
  error: string | null
  dbConnected: boolean
}

export function HealthIndicator({ status, isLoading, error, dbConnected }: HealthIndicatorProps) {
  // Determine visual state
  const getStateConfig = () => {
    if (isLoading) {
      return { 
        color: 'text-warning', 
        bg: 'bg-warning/20', 
        border: 'border-warning/30',
        label: 'Checking...',
        pulse: true
      }
    }
    if (error) {
      return { 
        color: 'text-error', 
        bg: 'bg-error/20', 
        border: 'border-error/30',
        label: 'Disconnected',
        pulse: false
      }
    }
    if (status === 'healthy') {
      return { 
        color: 'text-success', 
        bg: 'bg-success/20', 
        border: 'border-success/30',
        label: 'Backend Healthy',
        pulse: false
      }
    }
    return { 
      color: 'text-warning', 
      bg: 'bg-warning/20', 
      border: 'border-warning/30',
      label: 'Degraded',
      pulse: true
    }
  }

  const config = getStateConfig()

  return (
    <div 
      className={`health-indicator flex items-center gap-2 px-3 py-1.5 rounded-full 
                  ${config.bg} ${config.border} border text-sm ${config.color}
                  transition-all duration-300`}
      role="status"
      aria-live="polite"
    >
      {/* Status Dot */}
      <span 
        className={`status-dot w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}
                    ${config.pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      
      {/* Status Label */}
      <span className="font-medium">{config.label}</span>
      
      {/* Database Status */}
      {!isLoading && !error && (
        <span 
          className={`ml-2 px-2 py-0.5 rounded text-xs ${
            dbConnected 
              ? 'bg-success/30 text-success' 
              : 'bg-warning/30 text-warning'
          }`}
          title={dbConnected ? 'PostgreSQL connected' : 'Database not configured'}
        >
          {dbConnected ? '● DB' : '○ DB'}
        </span>
      )}
      
      {/* Error Details (accessible) */}
      {error && (
        <span className="sr-only" role="alert">
          Connection error: {error}
        </span>
      )}
    </div>
  )
}

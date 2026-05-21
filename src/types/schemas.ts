// src/types/schemas.ts
// Smart Hub | Shared TypeScript Interfaces
// Phase 1.2: Codebase Refactoring & Tauri Initialization
// These interfaces map directly to Rust serde structs for type-safe IPC

// ============================================================================
// Core Domain Models
// ============================================================================

export interface BaseEntity {
  id: string // UUID v4
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}

export interface Project extends BaseEntity {
  name: string
  description: string | null
  workspace_root: string
  settings?: ProjectSettings
  resources: ProjectResource[]
}

export interface ProjectSettings {
  default_shell?: ShellType
  auto_save?: boolean
  rag_enabled?: boolean
  security_level?: SecurityLevel
}

export interface ProjectResource extends BaseEntity {
  project_id: string
  resource_type: ResourceType
  path: string
  metadata: Record<string, unknown>
}

export type ResourceType = 
  | 'document'
  | 'code'
  | 'image'
  | 'audio'
  | 'video'
  | 'database'
  | 'api_endpoint'
  | 'other'

// ============================================================================
// Task Management (Kanban)
// ============================================================================

export interface Task extends BaseEntity {
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee?: string
  tags: string[]
  subtasks?: Subtask[]
  attachments?: TaskAttachment[]
}

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Subtask {
  id: string
  title: string
  completed: boolean
  order: number
}

export interface TaskAttachment {
  id: string
  name: string
  type: string
  url: string
  size_bytes: number
}

// ============================================================================
// Agent & Skill System
// ============================================================================

export interface Persona extends BaseEntity {
  name: string
  description: string
  system_prompt: string
  skills: string[] // Skill IDs
  style_config?: PersonaStyle
}

export interface PersonaStyle {
  tone: 'professional' | 'casual' | 'concise' | 'detailed'
  verbosity: number // 1-10
  emoji_usage: 'none' | 'minimal' | 'moderate' | 'abundant'
}

export interface Skill extends BaseEntity {
  name: string
  description: string
  instructions: string
  triggers: string[] // Keywords/phrases that activate this skill
  tools: string[] // MCP tool names this skill can use
  version: string
  author?: string
  license?: string
}

// ============================================================================
// RAG & Knowledge Base
// ============================================================================

export interface RAGChunk extends BaseEntity {
  source_id: string
  content: string
  embedding?: number[] // Vector embedding (pgvector)
  metadata: RAGMetadata
  relevance_score?: number
}

export interface RAGMetadata {
  source_type: 'file' | 'url' | 'clipboard' | 'manual'
  file_path?: string
  url?: string
  title?: string
  author?: string
  created_date?: string
  word_count: number
  language: string
  tags: string[]
}

export interface Notebook extends BaseEntity {
  name: string
  description: string | null
  sources: string[] // RAGChunk IDs or source references
  settings: NotebookSettings
}

export interface NotebookSettings {
  auto_embed: boolean
  chunk_size: number
  chunk_overlap: number
  embedding_model: string
  search_hybrid: boolean // Combine vector + BM25
}

// ============================================================================
// MCP Server Configuration
// ============================================================================

export interface MCPServer extends BaseEntity {
  name: string
  description: string
  transport: TransportType
  config: Record<string, unknown>
  status: ServerStatus
  last_health_check?: string
  tools: MCPTool[]
}

export type TransportType = 'stdio' | 'sse' | 'http' | 'websocket'

export type ServerStatus = 
  | 'needs_key'
  | 'configuring'
  | 'active'
  | 'error'
  | 'disabled'

export interface MCPTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
  output_schema?: Record<string, unknown>
}

// ============================================================================
// Security & Audit
// ============================================================================

export type SecurityLevel = 'relaxed' | 'default' | 'paranoid'

export interface SecurityConfig {
  level: SecurityLevel
  pii_masking: boolean
  injection_detection: boolean
  dlp_enabled: boolean
  custom_rules: SecurityRule[]
}

export interface SecurityRule {
  id: string
  name: string
  pattern: string // Regex
  action: 'mask' | 'block' | 'alert'
  enabled: boolean
}

export interface AuditLog extends BaseEntity {
  event_type: AuditEventType
  actor: string // User or agent ID
  action: string
  resource_type: string
  resource_id: string | null
  metadata: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

export type AuditEventType = 
  | 'auth_login'
  | 'auth_logout'
  | 'resource_create'
  | 'resource_update'
  | 'resource_delete'
  | 'command_execute'
  | 'security_block'
  | 'config_change'

// ============================================================================
// Session & State
// ============================================================================

export interface SessionState {
  session_id: string
  user_id: string
  active_project_id?: string
  active_notebook_id?: string
  terminal_sessions: TerminalSession[]
  context_budget: ContextBudget
  last_activity: string
}

export interface TerminalSession {
  id: string
  shell_type: ShellType
  cwd: string
  pid: number | null
  status: 'running' | 'stopped' | 'error'
}

export type ShellType = 'powershell' | 'cmd' | 'bash' | 'zsh' | 'wsl' | 'termux'

export interface ContextBudget {
  max_tokens: number
  used_tokens: number
  priority_layers: ContextLayer[]
}

export interface ContextLayer {
  name: string
  priority: number // 1 = highest
  token_allocation: number
  content_summary: string
}

// ============================================================================
// IPC Request/Response Types
// ============================================================================

export interface IPCRequest<T = unknown> {
  command: string
  payload: T
  session_id?: string
  timestamp: string
}

export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: IPCError
  metadata?: Record<string, unknown>
}

export interface IPCError {
  code: string
  message: string
  details?: Record<string, unknown>
  retryable?: boolean
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type OmitId<T extends { id: unknown }> = Omit<T, 'id'>

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    field?: string
  }
  meta?: {
    timestamp: string
    request_id: string
    version: string
  }
}

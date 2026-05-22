import { useState } from 'react'

type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'done'
type Priority = 'low' | 'medium' | 'high' | 'critical'

interface SubTask {
  id: string
  title: string
  done: boolean
}

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  subtasks: SubTask[]
  createdAt: string
  project?: string
}

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'in-review', label: 'In Review' },
  { id: 'done', label: 'Done' },
]

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'var(--text-ghost)',
  medium: 'var(--blue)',
  high: 'var(--amber)',
  critical: 'var(--rose)',
}

let nextId = 6
const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Design system audit', description: 'Review glassmorphic consistency across all pages', status: 'todo', priority: 'high', subtasks: [], createdAt: '2026-05-19' },
  { id: '2', title: 'Implement PostgreSQL migrations', description: 'Create schema for projects, tasks, and trajectories', status: 'todo', priority: 'critical', subtasks: [{ id: 's1', title: 'Write migration SQL', done: true }, { id: 's2', title: 'Add sqlx integration', done: false }], createdAt: '2026-05-18' },
  { id: '3', title: 'PTY terminal integration', description: 'Wire portable-pty to TerminalPage', status: 'in-progress', priority: 'high', subtasks: [{ id: 's3', title: 'Spawn powershell', done: true }, { id: 's4', title: 'IPC event stream', done: false }], createdAt: '2026-05-17' },
  { id: '4', title: 'Review MCP Mesh PR', description: 'Check logs drawer + creator forms implementation', status: 'in-review', priority: 'medium', subtasks: [], createdAt: '2026-05-20' },
  { id: '5', title: 'Kanban board task management', description: 'Build drag-to-move and CRUD operations', status: 'done', priority: 'high', subtasks: [{ id: 's5', title: 'Column layout', done: true }, { id: 's6', title: 'Add task form', done: true }, { id: 's7', title: 'Status transitions', done: false }], createdAt: '2026-05-15' },
]

export function KanbanPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [moveTaskId, setMoveTaskId] = useState<string | null>(null)

  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as Priority })
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  function getColumnTasks(status: TaskStatus) {
    return tasks.filter(t => t.status === status)
  }

  function addTask() {
    if (!newTask.title.trim()) return
    setTasks(prev => [...prev, {
      id: String(nextId++),
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      status: 'todo',
      priority: newTask.priority,
      subtasks: [],
      createdAt: new Date().toISOString().slice(0, 10),
    }])
    setNewTask({ title: '', description: '', priority: 'medium' })
    setShowAddModal(false)
  }

  function moveTask(taskId: string, toStatus: TaskStatus) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: toStatus } : t))
    setMoveTaskId(null)
  }

  function toggleSubTask(taskId: string, subTaskId: string) {
    setTasks(prev => prev.map(t => t.id !== taskId ? t : {
      ...t,
      subtasks: t.subtasks.map(st => st.id === subTaskId ? { ...st, done: !st.done } : st),
    }))
  }

  function addSubTask(taskId: string, title: string) {
    if (!title.trim()) return
    setTasks(prev => prev.map(t => t.id !== taskId ? t : {
      ...t,
      subtasks: [...t.subtasks, { id: `s${Date.now()}`, title: title.trim(), done: false }],
    }))
  }

  function handleDragStart(taskId: string) {
    setDraggedTask(taskId)
  }

  function handleDrop(status: TaskStatus) {
    if (draggedTask) {
      moveTask(draggedTask, status)
      setDraggedTask(null)
    }
  }

  function copyTaskContext(task: Task) {
    const context = [
      `Task: ${task.title}`,
      `Status: ${COLUMNS.find(c => c.id === task.status)?.label}`,
      `Priority: ${task.priority}`,
      `Description: ${task.description}`,
      `Subtasks: ${task.subtasks.filter(s => s.done).length}/${task.subtasks.length}`,
      `Created: ${task.createdAt}`,
    ].join('\n')
    navigator.clipboard.writeText(context)
  }

  function getTaskProgress(task: Task): string {
    if (task.subtasks.length === 0) return ''
    const done = task.subtasks.filter(s => s.done).length
    return `${done}/${task.subtasks.length}`
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Kanban Board</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage tasks across your workflow</p>
        </div>
        <button
          className="action-chip cursor-pointer"
          style={{
            background: 'var(--accent-subtle)', color: 'var(--accent)',
            border: '1px solid hsla(160, 84%, 39%, 0.2)',
          }}
          onClick={() => setShowAddModal(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Task
        </button>
      </div>

      {/* Board summary */}
      <div className="flex gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full font-medium" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid hsla(160, 84%, 39%, 0.15)' }}>
          {tasks.length} total
        </span>
        <span className="px-2.5 py-1 rounded-full font-medium" style={{ background: 'hsla(350, 89%, 60%, 0.08)', color: 'var(--rose)', border: '1px solid hsla(350, 89%, 60%, 0.15)' }}>
          {tasks.filter(t => t.priority === 'critical' || t.priority === 'high').filter(t => t.status !== 'done').length} active high/critical
        </span>
        <span className="px-2.5 py-1 rounded-full font-medium" style={{ background: 'hsla(38, 92%, 50%, 0.08)', color: 'var(--amber)', border: '1px solid hsla(38, 92%, 50%, 0.15)' }}>
          {tasks.filter(t => t.status !== 'done').reduce((s, t) => s + t.subtasks.filter(st => !st.done).length, 0)} open subtasks
        </span>
      </div>

      {/* Board Columns */}
      <div className="grid grid-cols-4 gap-4" style={{ minHeight: '60vh' }}>
        {COLUMNS.map(col => {
          const colTasks = getColumnTasks(col.id)
          return (
            <div
              key={col.id}
              className="rounded-xl p-4 flex flex-col"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                minHeight: 400,
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{col.label}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{
                  background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
                }}>
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {colTasks.map(task => {
                  const isExpanded = expandedTaskId === task.id
                  const progress = getTaskProgress(task)
                  const hasSubtasks = task.subtasks.length > 0
                  const allSubtasksDone = hasSubtasks && task.subtasks.every(s => s.done)

                  return (
                    <div
                      key={task.id}
                      className="glass-card p-3 animate-fade-up cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    >
                      {/* Priority + Title */}
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-1.5 h-full min-h-[20px] rounded-full flex-shrink-0 mt-0.5" style={{ background: PRIORITY_COLORS[task.priority] }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug" style={{
                            color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          }}>
                            {task.title}
                          </p>
                        </div>
                      </div>

                      {/* Compact meta */}
                      <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: 'var(--text-ghost)' }}>
                        <span style={{ color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                        {hasSubtasks && <span style={{ color: allSubtasksDone ? 'var(--accent)' : 'var(--text-muted)' }}>{progress}</span>}
                      </div>

                      {/* Expanded detail (#10) */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--glass-border)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {task.description || 'No description'}
                          </p>

                          {/* Subtasks */}
                          {hasSubtasks && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Subtasks</p>
                              {task.subtasks.map(st => (
                                <label key={st.id} className="flex items-center gap-2 py-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={st.done}
                                    onChange={() => toggleSubTask(task.id, st.id)}
                                    className="rounded cursor-pointer accent-[var(--accent)]"
                                  />
                                  <span className="text-xs" style={{
                                    color: st.done ? 'var(--text-muted)' : 'var(--text-secondary)',
                                    textDecoration: st.done ? 'line-through' : 'none',
                                  }}>
                                    {st.title}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Quick add subtask */}
                          <AddSubtaskRow taskId={task.id} onAdd={addSubTask} />

                          {/* Actions row (#11) */}
                          <div className="flex gap-2 pt-1">
                            {/* Move button */}
                            <div className="relative">
                              <button
                                className="text-[10px] px-2 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}
                                onClick={() => setMoveTaskId(moveTaskId === task.id ? null : task.id)}
                              >
                                Move to...
                              </button>
                              {moveTaskId === task.id && (
                                <div className="absolute top-full left-0 mt-1 z-20 rounded-lg p-1 shadow-xl"
                                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', minWidth: 120 }}
                                >
                                  {COLUMNS.filter(c => c.id !== task.status).map(c => (
                                    <button
                                      key={c.id}
                                      className="w-full text-left text-xs px-2.5 py-1.5 rounded cursor-pointer hover:bg-white/[0.04] transition-colors"
                                      style={{ color: 'var(--text-secondary)' }}
                                      onClick={() => moveTask(task.id, c.id)}
                                    >
                                      {c.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Copy context (#11) */}
                            <button
                              className="text-[10px] px-2 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80 flex items-center gap-1"
                              style={{ background: 'hsla(217, 91%, 60%, 0.08)', color: 'var(--blue)', border: '1px solid hsla(217, 91%, 60%, 0.12)' }}
                              onClick={() => copyTaskContext(task)}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                              Copy
                            </button>

                            {/* Send to Chat (#11) */}
                            <button
                              className="text-[10px] px-2 py-1 rounded font-medium cursor-pointer transition-all hover:opacity-80 flex items-center gap-1"
                              style={{ background: 'hsla(160, 84%, 39%, 0.08)', color: 'var(--accent)', border: '1px solid hsla(160, 84%, 39%, 0.12)' }}
                              onClick={() => copyTaskContext(task)}
                              data-tooltip="Copies task context to clipboard for pasting into any chat"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                              Chat
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {colTasks.length === 0 && (
                  <div className="text-center py-12 text-xs" style={{ color: 'var(--text-ghost)' }}>
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-up"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Add Task</h2>
                <button className="p-1 rounded cursor-pointer hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                    placeholder="What needs to be done?"
                    value={newTask.title}
                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addTask()}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all"
                    style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', minHeight: 60 }}
                    placeholder="Optional details..."
                    value={newTask.description}
                    onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                    value={newTask.priority}
                    onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value as Priority }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <button
                  className="w-full text-sm px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: 'white' }}
                  disabled={!newTask.title.trim()}
                  onClick={addTask}
                >
                  Add to Todo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function AddSubtaskRow({ taskId, onAdd }: { taskId: string; onAdd: (taskId: string, title: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex gap-1">
      <input
        className="flex-1 px-2 py-1 rounded text-[11px] outline-none"
        style={{ background: 'var(--bg-deep)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
        placeholder="Add subtask..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) {
            onAdd(taskId, value)
            setValue('')
          }
        }}
      />
      <button
        className="text-[11px] px-2 py-1 rounded font-medium cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40"
        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
        disabled={!value.trim()}
        onClick={() => { onAdd(taskId, value); setValue('') }}
      >
        Add
      </button>
    </div>
  )
}

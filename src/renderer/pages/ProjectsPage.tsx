// src/renderer/pages/ProjectsPage.tsx
// Smart Hub | Projects Dashboard
// Phase 0.2: Kanban Dashboard

import { useState } from 'react'

interface Project {
  id: string
  name: string
  path: string
  tasks: number
  status: 'active' | 'paused'
  progress: number
  persona: string
  personaPath?: string
  mcps: string[]
  skills: string[]
  notebooks: string[]
}

interface CapabilityGroup {
  id: string
  name: string
  type: 'mcp' | 'skill' | 'notebook'
  items: string[]
}

// Simulated file explorer node
interface FileSystemNode {
  name: string
  type: 'folder' | 'file'
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([
    { 
      id: 'ppc-site', 
      name: 'PPC-Site', 
      path: 'H:\\PPC-Site', 
      tasks: 12, 
      status: 'active', 
      progress: 65,
      persona: 'General Architect',
      personaPath: '',
      mcps: ['filesystem', 'simple-todo-mcp'],
      skills: ['Frontend Design'],
      notebooks: ['PPC Business Docs']
    },
    { 
      id: 'smart-hub', 
      name: 'Smart Hub', 
      path: 'C:\\Users\\David\\AI\\smart-hub', 
      tasks: 110, 
      status: 'active', 
      progress: 40,
      persona: 'Code Reviewer',
      personaPath: '',
      mcps: ['smart-terminal-mcp', 'filesystem', 'docker-mcp'],
      skills: ['Frontend Design', 'Docker Container Ops'],
      notebooks: ['iTaK Architecture']
    },
    { 
      id: 'itak-torch', 
      name: 'iTaK Torch', 
      path: 'H:\\AI\\itak-torch', 
      tasks: 8, 
      status: 'paused', 
      progress: 15,
      persona: 'Mojo Expert',
      personaPath: 'H:\\AI\\itak-torch\\personas',
      mcps: ['filesystem', 'context7'],
      skills: ['Universal Agent Memory'],
      notebooks: ['Mojo Patterns']
    },
    { 
      id: 'nano-bot', 
      name: 'NANO Bot', 
      path: 'H:\\AI\\discord-bot', 
      tasks: 5, 
      status: 'active', 
      progress: 80,
      persona: 'General Architect',
      personaPath: '',
      mcps: ['simple-todo-mcp'],
      skills: ['Docker Container Ops'],
      notebooks: []
    },
  ])

  // Groups State
  const [groups, setGroups] = useState<CapabilityGroup[]>([
    { id: 'g-dev', name: 'Web Dev Pack', type: 'mcp', items: ['filesystem', 'simple-todo-mcp'] },
    { id: 'g-power', name: 'Ops Hub Pack', type: 'mcp', items: ['smart-terminal-mcp', 'docker-mcp', 'context7'] },
    { id: 'g-sov', name: 'Sovereign Core', type: 'skill', items: ['Frontend Design', 'Docker Container Ops', 'Universal Agent Memory'] },
    { id: 'g-math', name: 'Calculus Pack', type: 'skill', items: ['Aerospace Math Engine', 'Universal Agent Memory'] },
    { id: 'g-eng-kb', name: 'Engineering Bundle', type: 'notebook', items: ['iTaK Architecture', 'Mojo Patterns'] },
  ])

  // Modal Setup state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'workspace' | 'persona' | 'integrations' | 'notebook'>('workspace')

  // Project Settings Editor Modal state
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editTab, setEditTab] = useState<'workspace' | 'persona' | 'integrations' | 'notebook'>('workspace')

  // Form Field States for Creation
  const [projName, setProjName] = useState('')
  const [projPath, setProjPath] = useState('')
  const [selectedPersona, setSelectedPersona] = useState('General Architect')
  const [customPersonaPath, setCustomPersonaPath] = useState('')
  const [selectedMcps, setSelectedMcps] = useState<string[]>(['filesystem'])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedNotebooks, setSelectedNotebooks] = useState<string[]>([])

  // Custom Group Creator helper
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupType, setNewGroupType] = useState<'mcp' | 'skill' | 'notebook'>('mcp')

  // Advanced Windows Explorer Simulator Modal State
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [explorerPath, setExplorerPath] = useState('H:\\AI')
  const [explorerTargetField, setExplorerTargetField] = useState<'workspace' | 'persona'>('workspace')
  const [explorerIsEdit, setExplorerIsEdit] = useState(false)

  // GitHub Auto-Filing animation overlay state
  const [githubFilingStatus, setGithubFilingStatus] = useState<string | null>(null)
  const [githubFilingProgress, setGithubFilingProgress] = useState(0)

  const mockFileSystem: { [path: string]: FileSystemNode[] } = {
    'C:\\': [
      { name: 'Users', type: 'folder' },
      { name: 'Program Files', type: 'folder' },
      { name: 'AI', type: 'folder' },
      { name: 'Windows', type: 'folder' }
    ],
    'C:\\Users': [
      { name: 'David', type: 'folder' },
      { name: 'Public', type: 'folder' }
    ],
    'C:\\Users\\David': [
      { name: 'AI', type: 'folder' },
      { name: 'Downloads', type: 'folder' },
      { name: 'Documents', type: 'folder' },
      { name: 'Desktop', type: 'folder' }
    ],
    'C:\\Users\\David\\AI': [
      { name: 'smart-hub', type: 'folder' }
    ],
    'C:\\Users\\David\\AI\\smart-hub': [
      { name: '001', type: 'folder' },
      { name: 'package.json', type: 'file' }
    ],
    'C:\\Users\\David\\AI\\smart-hub\\001': [
      { name: 'src', type: 'folder' },
      { name: 'src-tauri', type: 'folder' },
      { name: 'package.json', type: 'file' },
      { name: 'vite.config.ts', type: 'file' }
    ],
    'C:\\Users\\David\\Downloads': [
      { name: 'installers', type: 'folder' },
      { name: 'documents', type: 'folder' }
    ],
    'C:\\Users\\David\\Desktop': [
      { name: 'projects', type: 'folder' },
      { name: 'notes.md', type: 'file' }
    ],
    'C:\\Users\\David\\Documents': [
      { name: 'work', type: 'folder' },
      { name: 'personal', type: 'folder' }
    ],
    'C:\\Program Files': [
      { name: 'nodejs', type: 'folder' },
      { name: 'Git', type: 'folder' },
      { name: 'VSCode', type: 'folder' }
    ],
    'D:\\Projects': [
      { name: 'archive', type: 'folder' },
      { name: 'experiments', type: 'folder' }
    ],
    'D:\\Backups': [
      { name: 'system', type: 'folder' },
      { name: 'documents', type: 'folder' }
    ],
    'D:\\Media': [
      { name: 'Music', type: 'folder' },
      { name: 'Photos', type: 'folder' },
      { name: 'Videos', type: 'folder' }
    ],
    'D:\\': [
      { name: 'Projects', type: 'folder' },
      { name: 'Backups', type: 'folder' },
      { name: 'Media', type: 'folder' }
    ],
    'H:\\': [
      { name: 'AI', type: 'folder' },
      { name: 'PPC-Site', type: 'folder' },
      { name: 'local-test-drive', type: 'folder' }
    ],
    'H:\\AI': [
      { name: 'itak-torch', type: 'folder' },
      { name: 'discord-bot', type: 'folder' },
      { name: 'personas', type: 'folder' },
      { name: 'skills', type: 'folder' },
      { name: 'mcp', type: 'folder' },
      { name: 'cloned-repos', type: 'folder' }
    ],
    'H:\\AI\\personas': [
      { name: 'GeneralArchitect.yaml', type: 'file' },
      { name: 'CodeReviewer.yaml', type: 'file' },
      { name: 'MojoExpert.yaml', type: 'file' }
    ],
    'H:\\AI\\cloned-repos': [
      { name: 'frontend-design', type: 'folder' },
      { name: 'smart-terminal-mcp', type: 'folder' }
    ]
  }

  const handleCreateProject = () => {
    if (!projName.trim() || !projPath.trim()) {
      alert('Please fill out Project Name and Path first!')
      setActiveTab('workspace')
      return
    }

    const newProj: Project = {
      id: Math.random().toString(36).substring(7),
      name: projName,
      path: projPath,
      tasks: 0,
      status: 'active',
      progress: 0,
      persona: selectedPersona,
      personaPath: customPersonaPath,
      mcps: selectedMcps,
      skills: selectedSkills,
      notebooks: selectedNotebooks
    }

    setProjects(prev => [...prev, newProj])
    resetCreationForm()
  }

  const resetCreationForm = () => {
    setProjName('')
    setProjPath('')
    setSelectedPersona('General Architect')
    setCustomPersonaPath('')
    setSelectedMcps(['filesystem'])
    setSelectedSkills([])
    setSelectedNotebooks([])
    setActiveTab('workspace')
    setIsModalOpen(false)
  }

  const handleSaveEditProject = () => {
    if (!editingProject) return
    if (!editingProject.name.trim() || !editingProject.path.trim()) {
      alert('Project Name and Workspace Path cannot be empty!')
      return
    }

    setProjects(prev => 
      prev.map(p => p.id === editingProject.id ? editingProject : p)
    )
    setEditingProject(null)
  }

  // GitHub Auto-Filer: Detects GitHub URL, fires beautiful status clone animation, builds folder locally!
  const checkAndFileGithubLink = (url: string, isEdit: boolean, field: 'workspace' | 'persona') => {
    const cleanUrl = url.trim()
    if (!cleanUrl.startsWith('https://github.com/')) return false

    const repoName = cleanUrl.split('/').pop()?.replace('.git', '') || 'cloned-repo'
    const targetLocalPath = `H:\\AI\\cloned-repos\\${repoName}`

    setGithubFilingStatus(`🌐 GitHub Repository Detected!\nRouting to Hub: ${targetLocalPath}\n\n[1/3] Creating target folder...`)
    setGithubFilingProgress(25)

    setTimeout(() => {
      setGithubFilingStatus(`🚚 Cloning repo codebase...\ngit clone ${cleanUrl}\n\n[2/3] Extracting and filing components...`)
      setGithubFilingProgress(65)

      setTimeout(() => {
        setGithubFilingStatus(`✨ Repo Filed Successfully!\nAssigned to: ${targetLocalPath}\n\n[3/3] Scanning for config files...`)
        setGithubFilingProgress(100)

        setTimeout(() => {
          setGithubFilingStatus(null)
          if (field === 'workspace') {
            if (isEdit && editingProject) {
              setEditingProject({
                ...editingProject,
                name: repoName,
                path: targetLocalPath
              })
            } else {
              setProjPath(targetLocalPath)
              setProjName(repoName)
            }
          } else {
            if (isEdit && editingProject) {
              setEditingProject({
                ...editingProject,
                personaPath: targetLocalPath
              })
            } else {
              setCustomPersonaPath(targetLocalPath)
            }
          }
        }, 1200)
      }, 1200)
    }, 1200)

    return true
  }

  const pasteClipboardPath = async (isEdit: boolean, field: 'workspace' | 'persona') => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        const wasGithub = checkAndFileGithubLink(text, isEdit, field)
        if (wasGithub) return

        if (field === 'workspace') {
          if (isEdit && editingProject) {
            setEditingProject({ ...editingProject, path: text })
          } else {
            setProjPath(text)
          }
        } else {
          if (isEdit && editingProject) {
            setEditingProject({ ...editingProject, personaPath: text })
          } else {
            setCustomPersonaPath(text)
          }
        }
      }
    } catch (err) {
      const fallback = prompt('Paste target directory path or GitHub URL:')
      if (fallback) {
        const wasGithub = checkAndFileGithubLink(fallback, isEdit, field)
        if (wasGithub) return

        if (field === 'workspace') {
          if (isEdit && editingProject) {
            setEditingProject({ ...editingProject, path: fallback })
          } else {
            setProjPath(fallback)
          }
        } else {
          if (isEdit && editingProject) {
            setEditingProject({ ...editingProject, personaPath: fallback })
          } else {
            setCustomPersonaPath(fallback)
          }
        }
      }
    }
  }

  const openExplorerWindow = (isEdit: boolean, field: 'workspace' | 'persona') => {
    setExplorerIsEdit(isEdit)
    setExplorerTargetField(field)
    
    // Choose start path based on current input values
    let startPath = 'C:\\'
    if (field === 'workspace') {
      const val = isEdit && editingProject ? editingProject.path : projPath
      if (val.includes('H:\\')) startPath = 'H:\\'
      else if (val.includes('D:\\')) startPath = 'D:\\'
    } else {
      const val = isEdit && editingProject ? (editingProject.personaPath || '') : customPersonaPath
      if (val.includes('H:\\')) startPath = 'H:\\'
      else if (val.includes('D:\\')) startPath = 'D:\\'
    }
    setExplorerPath(startPath)
    setExplorerOpen(true)
  }

  // Windows Explorer navigation
  const navigateExplorer = (nodeName: string) => {
    let next = explorerPath
    if (next.endsWith('\\')) {
      next = next + nodeName
    } else {
      next = next + '\\' + nodeName
    }
    setExplorerPath(next)
  }

  const goExplorerUp = () => {
    if (explorerPath === 'C:\\' || explorerPath === 'D:\\' || explorerPath === 'H:\\') return
    const parts = explorerPath.split('\\')
    parts.pop()
    const parent = parts.join('\\')
    setExplorerPath(parent.includes('\\') ? parent : parent + '\\')
  }

  const selectExplorerFolder = () => {
    const isEdit = explorerIsEdit
    const field = explorerTargetField
    const path = explorerPath

    if (field === 'workspace') {
      const name = path.split('\\').pop() || 'New Project'
      if (isEdit && editingProject) {
        setEditingProject({
          ...editingProject,
          name,
          path
        })
      } else {
        setProjPath(path)
        setProjName(name)
      }
    } else {
      if (isEdit && editingProject) {
        setEditingProject({
          ...editingProject,
          personaPath: path
        })
      } else {
        setCustomPersonaPath(path)
      }
    }
    setExplorerOpen(false)
  }

  const toggleMcp = (id: string, isEdit: boolean) => {
    if (isEdit && editingProject) {
      const has = editingProject.mcps.includes(id)
      const mcps = has ? editingProject.mcps.filter(x => x !== id) : [...editingProject.mcps, id]
      setEditingProject({ ...editingProject, mcps })
    } else {
      setSelectedMcps(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      )
    }
  }

  const toggleSkill = (id: string, isEdit: boolean) => {
    if (isEdit && editingProject) {
      const has = editingProject.skills.includes(id)
      const skills = has ? editingProject.skills.filter(x => x !== id) : [...editingProject.skills, id]
      setEditingProject({ ...editingProject, skills })
    } else {
      setSelectedSkills(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      )
    }
  }

  const toggleNotebook = (name: string, isEdit: boolean) => {
    if (isEdit && editingProject) {
      const has = editingProject.notebooks.includes(name)
      const notebooks = has ? editingProject.notebooks.filter(x => x !== name) : [...editingProject.notebooks, name]
      setEditingProject({ ...editingProject, notebooks })
    } else {
      setSelectedNotebooks(prev =>
        prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
      )
    }
  }

  const applyGroup = (grp: CapabilityGroup, isEdit: boolean) => {
    if (isEdit && editingProject) {
      if (grp.type === 'mcp') {
        const union = Array.from(new Set([...editingProject.mcps, ...grp.items]))
        setEditingProject({ ...editingProject, mcps: union })
      } else if (grp.type === 'skill') {
        const union = Array.from(new Set([...editingProject.skills, ...grp.items]))
        setEditingProject({ ...editingProject, skills: union })
      } else if (grp.type === 'notebook') {
        const union = Array.from(new Set([...editingProject.notebooks, ...grp.items]))
        setEditingProject({ ...editingProject, notebooks: union })
      }
    } else {
      if (grp.type === 'mcp') {
        setSelectedMcps(prev => Array.from(new Set([...prev, ...grp.items])))
      } else if (grp.type === 'skill') {
        setSelectedSkills(prev => Array.from(new Set([...prev, ...grp.items])))
      } else if (grp.type === 'notebook') {
        setSelectedNotebooks(prev => Array.from(new Set([...prev, ...grp.items])))
      }
    }
  }

  const createCustomGroup = (isEdit: boolean) => {
    if (!newGroupName.trim()) return
    const items = grpTypeSelectedItems(newGroupType, isEdit)
    if (items.length === 0) {
      alert(`Please select some ${newGroupType.toUpperCase()}s first to group them!`)
      return
    }

    const newGrp: CapabilityGroup = {
      id: Math.random().toString(36).substring(7),
      name: newGroupName,
      type: newGroupType,
      items
    }
    setGroups(prev => [...prev, newGrp])
    setNewGroupName('')
  }

  const grpTypeSelectedItems = (type: 'mcp' | 'skill' | 'notebook', isEdit: boolean): string[] => {
    if (isEdit && editingProject) {
      if (type === 'mcp') return editingProject.mcps
      if (type === 'skill') return editingProject.skills
      return editingProject.notebooks
    } else {
      if (type === 'mcp') return selectedMcps
      if (type === 'skill') return selectedSkills
      return selectedNotebooks
    }
  }


  return (
    <div className="space-y-6 animate-fade-up relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Projects</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your active workspaces and task boards</p>
        </div>
        <button 
          className="action-chip action-chip-primary cursor-pointer font-bold"
          onClick={() => setIsModalOpen(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Project
        </button>
      </div>

      {/* Grid changed to 4 columns to make cards exactly 1/4th the size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {projects.map((p) => (
          <div 
            key={p.id} 
            className="glass-card p-4 animate-fade-up cursor-pointer hover:border-[var(--accent)] transition-all flex flex-col justify-between" 
            style={{ minHeight: '140px' }} 
            onClick={() => {
              setEditingProject(p)
              setEditTab('workspace')
            }}
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold truncate flex-1 pr-1" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/5 border border-white/10" style={{ color: 'var(--accent)' }}>
                  ⚙️ Settings
                </span>
              </div>
              <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-ghost)' }}>{p.path}</p>
              <div className="flex gap-1.5 flex-wrap mt-2">
                <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-300">👤 {p.persona}</span>
                <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-300">🔌 {p.mcps.length} MCPs</span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>{p.tasks} tasks</span>
                <span style={{ color: 'var(--text-muted)' }}>{p.progress}%</span>
              </div>
              <div className="stat-bar-track w-full">
                <div className="stat-bar-fill" style={{ width: `${p.progress}%`, background: 'linear-gradient(90deg, var(--accent), hsl(160, 84%, 55%))' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban preview */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Task Board</h2>
        <div className="grid grid-cols-4 gap-4">
          {['Todo', 'In Progress', 'In Review', 'Done'].map((col) => (
            <div key={col} className="min-h-[200px]">
              <div className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
                {col}
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sample task card</p>
                  <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-ghost)' }}>Drag to move</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PREMIUM CREATOR WIZARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={resetCreationForm} />
          
          <div 
            className="w-full max-w-2xl p-6 relative z-10 animate-scale-up max-h-[85vh] overflow-y-auto flex flex-col justify-between" 
            style={{ 
              background: '#0d1326', 
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <h3 className="text-xl font-bold tracking-tight text-white">Create New Project</h3>
                <button className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white" onClick={resetCreationForm}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-lg border border-white/10">
                {(['workspace', 'persona', 'integrations', 'notebook'] as const).map((tab) => (
                  <button
                    key={tab}
                    className="flex-1 py-2 text-xs font-bold rounded-md capitalize"
                    style={{
                      background: activeTab === tab ? 'var(--accent-subtle)' : 'transparent',
                      color: activeTab === tab ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.45)'
                    }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'workspace' ? '📁 Workspace' : tab === 'persona' ? '👤 Persona' : tab === 'integrations' ? '🔌 Plugins' : '📚 Context'}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="min-h-[260px]">
                {activeTab === 'workspace' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Project Name</label>
                      <input 
                        type="text" 
                        value={projName}
                        onChange={(e) => setProjName(e.target.value)}
                        placeholder="e.g. Patriot Pest Site"
                        className="w-full px-4 py-3 rounded-lg text-sm bg-white/5 border border-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Workspace Path</label>
                      <div className="flex gap-2 relative">
                        <input 
                          type="text" 
                          value={projPath}
                          onChange={(e) => setProjPath(e.target.value)}
                          placeholder="Paste local path or GitHub Repository URL (https://github.com/...)"
                          className="flex-1 px-4 py-3 rounded-lg text-sm bg-white/5 border border-white/20 text-white placeholder:text-white/30"
                        />
                        <button 
                          className="px-3 rounded-lg border border-white/20 text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          onClick={() => pasteClipboardPath(false, 'workspace')}
                        >
                          📋 Paste
                        </button>
                        <button 
                          className="px-3 rounded-lg border border-white/20 text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          onClick={() => openExplorerWindow(false, 'workspace')}
                        >
                          🔍 Browse
                        </button>
                      </div>
                      <p className="text-[11px] mt-1.5 font-medium text-gray-400">Specify absolute local path or paste a GitHub link to auto-clone and file it</p>
                    </div>
                  </div>
                )}

                {activeTab === 'persona' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Select Default Agent Persona</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { id: 'General Architect', desc: 'Standard orchestrator persona, perfect for general management.', source: 'Available' },
                          { id: 'Code Reviewer', desc: 'Multi-agent code review expert focused on security, quality & architecture.', source: 'Available' },
                          { id: 'Mojo Expert', desc: 'Systems-level AI programmer with deep Modular MAX SDK and GPU knowledge.', source: 'Available' },
                          { id: 'VLM Fine-Tuner', desc: 'Visual Language Model optimization & pipeline engineer.', source: 'Marketplace' },
                          { id: 'SEO Co-Pilot', desc: 'SEO rank orchestrator with dynamic Google GSC integrations.', source: 'Marketplace' }
                        ].map((p) => {
                          const isSel = selectedPersona === p.id
                          return (
                            <div 
                              key={p.id}
                              className="p-3 cursor-pointer hover:border-[var(--accent)] transition-all border flex flex-col justify-between rounded-xl relative"
                              style={{ 
                                borderColor: isSel ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                                background: isSel ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)'
                              }}
                              onClick={() => setSelectedPersona(p.id)}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-xs font-extrabold" style={{ color: isSel ? 'var(--accent)' : '#ffffff' }}>{p.id}</h4>
                                  <span className="text-[8px] px-1 rounded font-bold uppercase tracking-wide bg-white/5 border border-white/10" style={{ color: p.source === 'Marketplace' ? 'var(--amber)' : 'var(--accent)' }}>
                                    {p.source}
                                  </span>
                                </div>
                                <p className="text-[10px] leading-normal font-medium text-gray-300">{p.desc}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Custom Local Persona Search Path (Optional)</label>
                      <div className="flex gap-2 relative">
                        <input 
                          type="text" 
                          value={customPersonaPath}
                          onChange={(e) => setCustomPersonaPath(e.target.value)}
                          placeholder="e.g. H:\AI\personas"
                          className="flex-1 px-4 py-2.5 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30"
                        />
                        <button 
                          className="px-3 rounded-lg border border-white/20 text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          onClick={() => pasteClipboardPath(false, 'persona')}
                        >
                          📋 Paste
                        </button>
                        <button 
                          className="px-3 rounded-lg border border-white/20 text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          onClick={() => openExplorerWindow(false, 'persona')}
                        >
                          🔍 Browse
                        </button>
                      </div>
                      <p className="text-[10px] mt-1.5 font-medium text-gray-400">Specify a path where smart-hub scans for custom Vibe YAML, or paste a GitHub link to clone and file custom configs</p>
                    </div>
                  </div>
                )}

                {activeTab === 'integrations' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Capability Groups Selection Row */}
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Apply Groups Bundle</label>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {groups.filter(g => g.type === 'mcp' || g.type === 'skill').map(grp => (
                          <button
                            key={grp.id}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white hover:border-[var(--accent)] font-bold cursor-pointer"
                            onClick={() => applyGroup(grp, false)}
                          >
                            ➕ {grp.name} ({grp.items.length} items)
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* MCP Selector */}
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider mb-3 text-white">Enable MCP Servers</label>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {[
                            { id: 'smart-terminal-mcp', name: 'Smart Terminal Proxy', source: 'Core' },
                            { id: 'simple-todo-mcp', name: 'SQLite Todo List', source: 'Core' },
                            { id: 'filesystem', name: 'Local Filesystem', source: 'Core' },
                            { id: 'docker-mcp', name: 'Docker Command Engine', source: 'Core' },
                            { id: 'context7', name: 'Context7 Documentation Server', source: 'Core' },
                            { id: 'neo4j-graphrag', name: 'Neo4j GraphRAG Gateway', source: 'Marketplace' },
                            { id: 'youtube-transcript', name: 'YouTube Audio transcriber', source: 'Marketplace' }
                          ].map((mcp) => {
                            const has = selectedMcps.includes(mcp.id)
                            return (
                              <div 
                                key={mcp.id}
                                className="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:bg-white/5"
                                style={{ 
                                  borderColor: has ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                                  background: has ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                                }}
                                onClick={() => toggleMcp(mcp.id, false)}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-gray-100">{mcp.name}</span>
                                  {mcp.source === 'Marketplace' && (
                                    <span className="text-[8px] bg-white/5 border border-white/10 px-1 rounded text-amber-500 font-extrabold">Market</span>
                                  )}
                                </div>
                                <input type="checkbox" checked={has} readOnly className="accent-[var(--accent)] w-4 h-4" />
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Skill Selector */}
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider mb-3 text-white">Inject Skillsets</label>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {[
                            { id: 'Frontend Design', desc: '5-Phase visually excellent web design specs', source: 'Local' },
                            { id: 'Docker Container Ops', desc: 'Resilient compose management & health audits', source: 'Local' },
                            { id: 'Universal Agent Memory', desc: 'Daily heartbeats & long-term cognitive continuity', source: 'Local' },
                            { id: 'Aerospace Math Engine', desc: 'SSM continuous ODE filter integrations', source: 'Local' },
                            { id: 'Babylonjs Engine', desc: '3D WebGPU dynamic rendering templates', source: 'Marketplace' },
                            { id: 'Brand Guidelines', desc: 'Anthropic styling brand sheet templates', source: 'Marketplace' }
                          ].map((sk) => {
                            const has = selectedSkills.includes(sk.id)
                            return (
                              <div 
                                key={sk.id}
                                className="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:bg-white/5"
                                style={{ 
                                  borderColor: has ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                                  background: has ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                                }}
                                onClick={() => toggleSkill(sk.id, false)}
                              >
                                <div className="pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-gray-100">{sk.id}</span>
                                    {sk.source === 'Marketplace' && (
                                      <span className="text-[8px] bg-white/5 border border-white/10 px-1 rounded text-amber-500 font-extrabold">Market</span>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-gray-400 font-medium mt-0.5">{sk.desc}</div>
                                </div>
                                <input type="checkbox" checked={has} readOnly className="accent-[var(--accent)] w-4 h-4" />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Group Creator utility */}
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-2 items-center">
                      <span className="text-xs font-extrabold text-white">Create Selection Group:</span>
                      <input 
                        type="text" 
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)} 
                        placeholder="Group Name (e.g. Full-Stack Bundle)"
                        className="flex-1 px-3 py-1.5 rounded bg-white/5 border border-white/15 text-xs text-white"
                      />
                      <select 
                        value={newGroupType} 
                        onChange={e => setNewGroupType(e.target.value as any)}
                        className="bg-[#141b30] text-xs text-white border border-white/15 rounded p-1.5"
                      >
                        <option value="mcp">MCPs</option>
                        <option value="skill">Skills</option>
                      </select>
                      <button 
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold rounded text-white cursor-pointer"
                        onClick={() => createCustomGroup(false)}
                      >
                        💾 Save Group
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'notebook' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Apply Notebook Group Bundle</label>
                      <div className="flex gap-2 pb-1">
                        {groups.filter(g => g.type === 'notebook').map(grp => (
                          <button
                            key={grp.id}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white hover:border-[var(--accent)] font-bold cursor-pointer"
                            onClick={() => applyGroup(grp, false)}
                          >
                            ➕ {grp.name} ({grp.items.length} items)
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Attach RAG Knowledge Base / Notebooks</label>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {[
                          { name: 'iTaK Architecture', desc: 'Mounts mojo-native tensor routing schemas and dequantization patterns.' },
                          { name: 'Mojo Patterns', desc: 'Injects system performance optimizations and zero-copy mappings.' },
                          { name: 'PPC Business Docs', desc: 'Mounts SEO blueprints and multi-tenant SaaS specs.' },
                          { name: 'Ollama Research Ops', desc: 'Injects low-latency quantization latency audits.' }
                        ].map((nb) => {
                          const has = selectedNotebooks.includes(nb.name)
                          return (
                            <div 
                              key={nb.name}
                              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-white/5"
                              style={{ 
                                borderColor: has ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                                background: has ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                              }}
                              onClick={() => toggleNotebook(nb.name, false)}
                            >
                              <input 
                                type="checkbox" 
                                checked={has}
                                readOnly
                                className="accent-[var(--accent)] w-4 h-4"
                              />
                              <div>
                                <div className="text-xs font-extrabold text-white">{nb.name}</div>
                                <div className="text-[10px] font-medium text-gray-300 mt-0.5">{nb.desc}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-2 items-center">
                      <span className="text-xs font-extrabold text-white">Create Notebook Group:</span>
                      <input 
                        type="text" 
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)} 
                        placeholder="e.g. Master Knowledge Bundle"
                        className="flex-1 px-3 py-1.5 rounded bg-white/5 border border-white/15 text-xs text-white"
                      />
                      <button 
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold rounded text-white cursor-pointer"
                        onClick={() => {
                          setNewGroupType('notebook')
                          createCustomGroup(false)
                        }}
                      >
                        💾 Save Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-8 pt-4 border-t border-white/10 flex justify-between gap-3">
              <button 
                className="action-chip cursor-pointer text-white font-bold"
                onClick={() => {
                  if (activeTab === 'notebook') setActiveTab('integrations')
                  else if (activeTab === 'integrations') setActiveTab('persona')
                  else if (activeTab === 'persona') setActiveTab('workspace')
                }}
                disabled={activeTab === 'workspace'}
                style={{ opacity: activeTab === 'workspace' ? 0.3 : 1 }}
              >
                Back
              </button>
              
              <div className="flex gap-2">
                <button className="action-chip cursor-pointer text-white font-bold" onClick={resetCreationForm}>
                  Cancel
                </button>
                
                {activeTab !== 'notebook' ? (
                  <button 
                    className="action-chip action-chip-primary cursor-pointer font-bold"
                    onClick={() => {
                      if (activeTab === 'workspace') {
                        if (!projName.trim() || !projPath.trim()) {
                          alert('Please fill out Project Name and Path first!')
                          return
                        }
                        setActiveTab('persona')
                      } else if (activeTab === 'persona') {
                        setActiveTab('integrations')
                      } else if (activeTab === 'integrations') {
                        setActiveTab('notebook')
                      }
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button className="action-chip action-chip-primary cursor-pointer font-bold" onClick={handleCreateProject}>
                    Launch Project
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT SETTINGS EDITOR MODAL */}
      {editingProject && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={() => setEditingProject(null)} />
          
          <div 
            className="w-full max-w-2xl p-6 relative z-10 animate-scale-up max-h-[85vh] overflow-y-auto flex flex-col justify-between" 
            style={{ 
              background: '#0a0f1d', 
              border: '1.5px solid var(--accent)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)'
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>⚙️ Project Settings:</span>
                  <span style={{ color: 'var(--accent)' }}>{editingProject.name}</span>
                </h3>
                <button className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white" onClick={() => setEditingProject(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Edit Tabs */}
              <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-lg border border-white/10">
                {(['workspace', 'persona', 'integrations', 'notebook'] as const).map((tab) => (
                  <button
                    key={tab}
                    className="flex-1 py-2 text-xs font-bold rounded-md capitalize"
                    style={{
                      background: editTab === tab ? 'var(--accent-subtle)' : 'transparent',
                      color: editTab === tab ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.45)'
                    }}
                    onClick={() => setEditTab(tab)}
                  >
                    {tab === 'workspace' ? '📁 Workspace' : tab === 'persona' ? '👤 Persona' : tab === 'integrations' ? '🔌 Plugins' : '📚 Context'}
                  </button>
                ))}
              </div>

              {/* Edit Tab Contents */}
              <div className="min-h-[260px]">
                {editTab === 'workspace' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Project Name</label>
                      <input 
                        type="text" 
                        value={editingProject.name}
                        onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg text-sm bg-white/5 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Workspace Path</label>
                      <div className="flex gap-2 relative">
                        <input 
                          type="text" 
                          value={editingProject.path}
                          onChange={(e) => setEditingProject({ ...editingProject, path: e.target.value })}
                          className="flex-1 px-4 py-3 rounded-lg text-sm bg-white/5 border border-white/20 text-white"
                        />
                        <button 
                          className="px-3 rounded-lg border border-white/20 text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          onClick={() => pasteClipboardPath(true, 'workspace')}
                        >
                          📋 Paste
                        </button>
                        <button 
                          className="px-3 rounded-lg border border-white/20 text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          onClick={() => openExplorerWindow(true, 'workspace')}
                        >
                          🔍 Browse
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {editTab === 'persona' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Select Default Agent Persona</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { id: 'General Architect', desc: 'Standard orchestrator persona, perfect for general management.', source: 'Available' },
                          { id: 'Code Reviewer', desc: 'Multi-agent code review expert focused on security, quality & architecture.', source: 'Available' },
                          { id: 'Mojo Expert', desc: 'Systems-level AI programmer with deep Modular MAX SDK and GPU knowledge.', source: 'Available' },
                          { id: 'VLM Fine-Tuner', desc: 'Visual Language Model optimization & pipeline engineer.', source: 'Marketplace' },
                          { id: 'SEO Co-Pilot', desc: 'SEO rank orchestrator with dynamic Google GSC integrations.', source: 'Marketplace' }
                        ].map((p) => {
                          const isSel = editingProject.persona === p.id
                          return (
                            <div 
                              key={p.id}
                              className="p-3 cursor-pointer hover:border-[var(--accent)] transition-all border flex flex-col justify-between rounded-xl"
                              style={{ 
                                borderColor: isSel ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                                background: isSel ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)'
                              }}
                              onClick={() => setEditingProject({ ...editingProject, persona: p.id })}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-xs font-extrabold" style={{ color: isSel ? 'var(--accent)' : '#ffffff' }}>{p.id}</h4>
                                  <span className="text-[8px] px-1 rounded font-bold uppercase tracking-wide bg-white/5 border border-white/10" style={{ color: p.source === 'Marketplace' ? 'var(--amber)' : 'var(--accent)' }}>
                                    {p.source}
                                  </span>
                                </div>
                                <p className="text-[10px] leading-normal font-medium text-gray-300">{p.desc}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Custom Local Persona Search Path (Optional)</label>
                      <div className="flex gap-2 relative">
                        <input 
                          type="text" 
                          value={editingProject.personaPath || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, personaPath: e.target.value })}
                          placeholder="e.g. H:\AI\personas"
                          className="flex-1 px-4 py-2.5 rounded-lg text-xs bg-white/5 border border-white/20 text-white placeholder:text-white/30"
                        />
                        <button 
                          className="px-3 rounded-lg border border-white/20 text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          onClick={() => pasteClipboardPath(true, 'persona')}
                        >
                          📋 Paste
                        </button>
                        <button 
                          className="px-3 rounded-lg border border-white/20 text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          onClick={() => openExplorerWindow(true, 'persona')}
                        >
                          🔍 Browse
                        </button>
                      </div>
                      <p className="text-[10px] mt-1.5 font-medium text-gray-400">Specify a path where smart-hub scans for custom Vibe YAML, or paste a GitHub link to clone and file custom configs</p>
                    </div>
                  </div>
                )}

                {editTab === 'integrations' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Apply Groups Bundle</label>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {groups.filter(g => g.type === 'mcp' || g.type === 'skill').map(grp => (
                          <button
                            key={grp.id}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white hover:border-[var(--accent)] font-bold cursor-pointer"
                            onClick={() => applyGroup(grp, true)}
                          >
                            ➕ {grp.name} ({grp.items.length} items)
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* MCP Selector */}
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider mb-3 text-white">Enable MCP Servers</label>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {[
                            { id: 'smart-terminal-mcp', name: 'Smart Terminal Proxy', source: 'Core' },
                            { id: 'simple-todo-mcp', name: 'SQLite Todo List', source: 'Core' },
                            { id: 'filesystem', name: 'Local Filesystem', source: 'Core' },
                            { id: 'docker-mcp', name: 'Docker Command Engine', source: 'Core' },
                            { id: 'context7', name: 'Context7 Documentation Server', source: 'Core' },
                            { id: 'neo4j-graphrag', name: 'Neo4j GraphRAG Gateway', source: 'Marketplace' },
                            { id: 'youtube-transcript', name: 'YouTube Audio transcriber', source: 'Marketplace' }
                          ].map((mcp) => {
                            const has = editingProject.mcps.includes(mcp.id)
                            return (
                              <div 
                                key={mcp.id}
                                className="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:bg-white/5"
                                style={{ 
                                  borderColor: has ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                                  background: has ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                                }}
                                onClick={() => toggleMcp(mcp.id, true)}
                              >
                                <span className="text-xs font-bold text-gray-100">{mcp.name}</span>
                                <input type="checkbox" checked={has} readOnly className="accent-[var(--accent)] w-4 h-4" />
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Skill Selector */}
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider mb-3 text-white">Inject Skillsets</label>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {[
                            { id: 'Frontend Design', desc: '5-Phase visually excellent web design specs' },
                            { id: 'Docker Container Ops', desc: 'Resilient compose management & health audits' },
                            { id: 'Universal Agent Memory', desc: 'Daily heartbeats & long-term cognitive continuity' },
                            { id: 'Aerospace Math Engine', desc: 'SSM continuous ODE filter integrations' },
                            { id: 'Babylonjs Engine', desc: '3D WebGPU dynamic rendering templates' },
                            { id: 'Brand Guidelines', desc: 'Anthropic styling brand sheet templates' }
                          ].map((sk) => {
                            const has = editingProject.skills.includes(sk.id)
                            return (
                              <div 
                                key={sk.id}
                                className="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:bg-white/5"
                                style={{ 
                                  borderColor: has ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                                  background: has ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                                }}
                                onClick={() => toggleSkill(sk.id, true)}
                              >
                                <div className="pr-2">
                                  <span className="text-xs font-bold text-gray-100">{sk.id}</span>
                                </div>
                                <input type="checkbox" checked={has} readOnly className="accent-[var(--accent)] w-4 h-4" />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Custom Group Creator */}
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-2 items-center">
                      <span className="text-xs font-extrabold text-white">Create Selection Group:</span>
                      <input 
                        type="text" 
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)} 
                        placeholder="Group Name (e.g. Dev Combo)"
                        className="flex-1 px-3 py-1.5 rounded bg-white/5 border border-white/15 text-xs text-white"
                      />
                      <select 
                        value={newGroupType} 
                        onChange={e => setNewGroupType(e.target.value as any)}
                        className="bg-[#141b30] text-xs text-white border border-white/15 rounded p-1.5"
                      >
                        <option value="mcp">MCPs</option>
                        <option value="skill">Skills</option>
                      </select>
                      <button 
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold rounded text-white cursor-pointer"
                        onClick={() => createCustomGroup(true)}
                      >
                        💾 Save Group
                      </button>
                    </div>
                  </div>
                )}

                {editTab === 'notebook' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Apply Notebook Group Bundle</label>
                      <div className="flex gap-2 pb-1">
                        {groups.filter(g => g.type === 'notebook').map(grp => (
                          <button
                            key={grp.id}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white hover:border-[var(--accent)] font-bold cursor-pointer"
                            onClick={() => applyGroup(grp, true)}
                          >
                            ➕ {grp.name} ({grp.items.length} items)
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-white">Attach RAG Knowledge Base / Notebooks</label>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {[
                          { name: 'iTaK Architecture', desc: 'Mounts mojo-native tensor routing schemas and dequantization patterns.' },
                          { name: 'Mojo Patterns', desc: 'Injects system performance optimizations and zero-copy mappings.' },
                          { name: 'PPC Business Docs', desc: 'Mounts SEO blueprints and multi-tenant SaaS specs.' },
                          { name: 'Ollama Research Ops', desc: 'Injects low-latency quantization latency audits.' }
                        ].map((nb) => {
                          const has = editingProject.notebooks.includes(nb.name)
                          return (
                            <div 
                              key={nb.name}
                              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-white/5"
                              style={{ 
                                borderColor: has ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                                background: has ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                              }}
                              onClick={() => toggleNotebook(nb.name, true)}
                            >
                              <input 
                                type="checkbox" 
                                checked={has}
                                readOnly
                                className="accent-[var(--accent)] w-4 h-4"
                              />
                              <div>
                                <div className="text-xs font-extrabold text-white">{nb.name}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-2 items-center">
                      <span className="text-xs font-extrabold text-white">Create Notebook Group:</span>
                      <input 
                        type="text" 
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)} 
                        placeholder="e.g. Master Knowledge Bundle"
                        className="flex-1 px-3 py-1.5 rounded bg-white/5 border border-white/15 text-xs text-white"
                      />
                      <button 
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold rounded text-white cursor-pointer"
                        onClick={() => {
                          setNewGroupType('notebook')
                          createCustomGroup(true)
                        }}
                      >
                        💾 Save Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-2">
              <button 
                className="action-chip cursor-pointer text-white font-bold" 
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </button>
              <button 
                className="action-chip action-chip-primary cursor-pointer font-bold" 
                onClick={handleSaveEditProject}
              >
                💾 Save Config Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WINDOWS EXPLORER SIMULATOR MODAL */}
      {explorerOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setExplorerOpen(false)} />
          <div
            className="w-full max-w-lg p-5 relative z-10 animate-scale-up"
            style={{
              background: '#0d1326',
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Browse Folders</h3>
              <button className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white" onClick={() => setExplorerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white">
              <button className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] cursor-pointer" onClick={goExplorerUp}>
                ⬆ Up
              </button>
              <span className="truncate flex-1">{explorerPath}</span>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-1 mb-4">
              {(mockFileSystem[explorerPath] || []).map((node) => (
                <div
                  key={node.name}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-white font-mono"
                  onClick={() => {
                    if (node.type === 'folder') navigateExplorer(node.name)
                  }}
                >
                  <span>{node.type === 'folder' ? '📁' : '📄'}</span>
                  <span>{node.name}</span>
                </div>
              ))}
              {(!mockFileSystem[explorerPath] || mockFileSystem[explorerPath].length === 0) && (
                <p className="text-xs text-gray-500 text-center py-4">Empty folder</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button className="action-chip cursor-pointer text-white font-bold text-xs" onClick={() => setExplorerOpen(false)}>
                Cancel
              </button>
              <button className="action-chip action-chip-primary cursor-pointer font-bold text-xs" onClick={selectExplorerFolder}>
                ✅ Select This Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GITHUB AUTO-FILING OVERLAY */}
      {githubFilingStatus && (
        <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="w-full max-w-md p-6 relative z-10 animate-scale-up text-center"
            style={{
              background: '#0d1326',
              border: '1.5px solid var(--accent)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9)'
            }}
          >
            <div className="text-lg mb-4">📦</div>
            <pre className="text-xs text-left text-gray-200 font-mono whitespace-pre-wrap mb-4 leading-relaxed">
              {githubFilingStatus}
            </pre>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${githubFilingProgress}%`,
                  background: 'linear-gradient(90deg, var(--accent), hsl(160, 84%, 55%))'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




export function TitleBar() {
  return (
    <div
      className="flex items-center justify-between h-[32px] px-3 select-none"
      data-tauri-drag-region
      style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--glass-border)' }}
    >
      <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        Smart Hub
      </div>
    </div>
  )
}

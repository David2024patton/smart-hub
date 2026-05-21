const fs = require('fs');

// 1. Fix postcss.config.js
const postcss = `module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}`;
fs.writeFileSync('postcss.config.js', postcss);
console.log('✓ Fixed postcss.config.js');

// 2. Fix index.css with Smart Hub Theme
const css = `@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@theme {
  --color-deep-space: hsl(224, 71%, 4%);
  --color-glass: hsl(222, 47%, 11%, 0.45);
  --color-emerald: hsl(142, 70%, 45%);
  --color-amber: hsl(38, 92%, 50%);
  --color-polar: hsl(210, 40%, 98%);
  --color-glass-border: rgba(255, 255, 255, 0.08);
  --font-main: "Outfit", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

body {
  font-family: var(--font-main);
  background-color: var(--color-deep-space);
  color: var(--color-polar);
  margin: 0;
  height: 100vh;
  overflow: hidden;
}

.glass-card {
  background: var(--color-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-glass-border);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.glass-card:hover {
  border-color: hsla(142, 70%, 45%, 0.3);
  box-shadow: 0 0 20px rgba(142, 240, 180, 0.1);
}`;
fs.writeFileSync('src/renderer/index.css', css);
console.log('✓ Updated index.css with Smart Hub theme');

// 3. Fix App.tsx with Glassmorphic UI
const app = `import React from 'react';

const Sidebar = () => (
  <aside className="w-64 glass-card m-4 flex flex-col p-6 gap-4 border-r border-white/5">
    <div className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
      <span className="text-emerald-400">🌌</span> Smart Hub
    </div>
    <nav className="flex flex-col gap-2">
      {['Dashboard', 'Projects', 'MCP Grid', 'RAG Lab', 'Security HUD'].map((item, i) => (
        <button key={i} className="text-left px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium text-gray-300 hover:text-white">
          {item}
        </button>
      ))}
    </nav>
  </aside>
);

const Dashboard = () => (
  <main className="flex-1 p-4 overflow-y-auto">
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, David</h1>
        <p className="text-gray-400 mt-1">Sovereign AI Orchestration OS is online.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 glass-card text-emerald-400 text-sm font-mono animate-pulse">
          ● SYSTEM HEALTHY
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 border-2 border-white/20"></div>
      </div>
    </header>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { title: 'Active Projects', icon: '📂', val: '4', color: 'from-emerald-500/20' },
        { title: 'Terminal Sessions', icon: '💻', val: '12', color: 'from-blue-500/20' },
        { title: 'RAG Sources', icon: '🧠', val: '1.2k', color: 'from-purple-500/20' },
        { title: 'Pending Tasks', icon: '✅', val: '23', color: 'from-amber-500/20' },
      ].map((card, i) => (
        <div key={i} className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden group cursor-pointer">
          <div className={\`absolute inset-0 bg-gradient-to-br \${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500\`}></div>
          <div className="relative z-10">
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-4xl font-bold mb-1">{card.val}</div>
            <div className="text-gray-400 text-sm uppercase tracking-wider">{card.title}</div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
            <span className="text-xs text-emerald-400 font-mono">Active</span>
            <span className="text-xs text-gray-500 group-hover:text-white transition-colors">View Details →</span>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-8 glass-card p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-amber-400">⚡</span> Recent Activity
      </h2>
      <div className="space-y-3">
        {[
          'Agent [Co-Driver] completed task "Update Security HUD"',
          'New MCP server "GitHub" connected successfully',
          'RAG index optimized: 450 chunks processed',
          'System health check passed with 0 warnings'
        ].map((log, i) => (
          <div key={i} className="flex items-center gap-3 text-sm p-2 rounded hover:bg-white/5 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-gray-300">{log}</span>
            <span className="ml-auto text-xs text-gray-600 font-mono">{i + 1}m ago</span>
          </div>
        ))}
      </div>
    </div>
  </main>
);

function App() {
  return (
    <div className="flex h-screen bg-deep-space text-polar">
      <Sidebar />
      <Dashboard />
    </div>
  );
}

export default App;`;
fs.writeFileSync('src/renderer/App.tsx', app);
console.log('✓ Updated App.tsx with Glassmorphic UI');

console.log('\n🎉 All patches applied successfully!');

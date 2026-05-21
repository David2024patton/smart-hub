// src/renderer/components/ThemeToggle.tsx
// Smart Hub | Theme Toggle Button Component
// Implements the dark/light theme switcher as per roadmap requirement

import React, { useEffect, useState } from 'react';

/**
 * ThemeToggle Component
 * Provides a button to switch between light and dark themes
 * Uses localStorage to persist the user's preference
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('smartHubTheme') as 'dark' | 'light' | null;
    
    // Check for system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determine initial theme
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Apply theme to document element
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme'); // Remove old class if present
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme'); // Remove opposite class
    }

    // Save preference to localStorage
    localStorage.setItem('smartHubTheme', theme);
  }, [theme, isMounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Only render button after mounting to avoid hydration issues
  if (!isMounted) {
    return (
      <button 
        className="w-10 h-10 rounded-full bg-transparent border border-transparent"
        aria-label="Loading theme"
        disabled
      >
        <span className="sr-only">Loading...</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        w-10 h-10 rounded-full flex items-center justify-center
        bg-transparent border border-white/10
        hover:bg-white/10 transition-colors
        focus:outline-none focus:ring-2 focus:ring-emerald-500
        text-lg
        ${theme === 'light' ? 'text-amber-500' : 'text-emerald-500'}
      `}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Current theme: ${theme}`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
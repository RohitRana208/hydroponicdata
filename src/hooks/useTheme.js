// src/hooks/useTheme.js
import { useState, useEffect, useCallback } from 'react'

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('nutriflow_theme')
      if (saved === 'dark' || saved === 'light') return saved
      // Default to light theme (white & green)
      return 'light'
    } catch (_) {
      return 'light'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('nutriflow_theme', theme)
    } catch (_) {}
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  }
}

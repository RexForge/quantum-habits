/**
 * Global Theme Configuration
 * Centralizes the Sectograph aesthetic across the app.
 */

export const THEME = {
  colors: {
    primary: {
      light: '#3b82f6', // Bright Blue
      dark: '#60a5fa',
      glow: 'rgba(59, 130, 246, 0.5)'
    },
    success: {
      light: '#10b981', // Emerald
      dark: '#34d399'
    },
    warning: {
      light: '#f59e0b', // Amber
      dark: '#fbbf24'
    },
    danger: {
      light: '#ef4444', // Rose
      dark: '#f87171'
    },
    background: {
      light: '#f9fafb',
      dark: '#0f172a', // Deep Slate
      cardLight: '#ffffff',
      cardDark: '#1e293b'
    }
  },

  // Glassmorphism and Depth
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    blueGlow: '0 0 20px rgba(59, 130, 246, 0.3)',
  },

  // Consistent Animation Timing
  transitions: {
    default: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // Category Colors for Habits and Tasks
  categories: {
    work: '#3b82f6',    // Blue
    health: '#10b981',  // Green
    mind: '#8b5cf6',    // Purple
    personal: '#f59e0b' // Orange
  }
};

// Helper to get color based on theme
export const getThemeColor = (theme, type) => {
  return theme === 'dark' ? THEME.colors[type].dark : THEME.colors[type].light;
};
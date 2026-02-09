// Colorful Minimalistic App Themes
export const THEMES = {
  default: {
    name: 'Default',
    primary: '#3b82f6',      // Blue
    secondary: '#8b5cf6',    // Purple
    accent: '#06b6d4',       // Cyan
    lightBg: '#ffffff',
    darkBg: '#020817',
    lightCard: '#f9fafb',
    darkCard: '#1f2937',
    icon: '✨',
  },
  ocean: {
    name: 'Ocean',
    primary: '#0369a1',      // Deep Blue
    secondary: '#0ea5e9',    // Sky Blue
    accent: '#06b6d4',       // Cyan
    lightBg: '#f0f9ff',
    darkBg: '#0c1929',
    lightCard: '#e0f2fe',
    darkCard: '#1e3a5f',
    icon: '🌊',
  },
  sunset: {
    name: 'Sunset',
    primary: '#ea580c',      // Orange
    secondary: '#f97316',    // Deep Orange
    accent: '#eab308',       // Yellow
    lightBg: '#fffbeb',
    darkBg: '#220701',
    lightCard: '#fed7aa',
    darkCard: '#5a2a0f',
    icon: '🌅',
  },
  forest: {
    name: 'Forest',
    primary: '#16a34a',      // Green
    secondary: '#22c55e',    // Light Green
    accent: '#84cc16',       // Lime
    lightBg: '#f0fdf4',
    darkBg: '#051f0d',
    lightCard: '#dcfce7',
    darkCard: '#1b4332',
    icon: '🌲',
  },
  flamingo: {
    name: 'Flamingo',
    primary: '#ec4899',      // Pink
    secondary: '#f43f5e',    // Rose
    accent: '#fbbf24',       // Amber
    lightBg: '#fff5f7',
    darkBg: '#1a0814',
    lightCard: '#fbcfe8',
    darkCard: '#5a1d4d',
    icon: '🦩',
  },
  midnight: {
    name: 'Midnight',
    primary: '#6366f1',      // Indigo
    secondary: '#7c3aed',    // Violet
    accent: '#60a5fa',       // Light Blue
    lightBg: '#f3f4f6',
    darkBg: '#0f0f1e',
    lightCard: '#e5e7eb',
    darkCard: '#1f1f3a',
    icon: '🌙',
  },
  tropical: {
    name: 'Tropical',
    primary: '#d946ef',      // Fuchsia
    secondary: '#a78bfa',    // Purple
    accent: '#f87171',       // Red
    lightBg: '#fdf4ff',
    darkBg: '#250f3d',
    lightCard: '#f5d0fe',
    darkCard: '#5a1d7f',
    icon: '🌴',
  },
};

export const getTheme = (colorTheme, mode = 'light') => {
  const theme = THEMES[colorTheme] || THEMES.default;
  return {
    ...theme,
    isDark: mode === 'dark',
  };
};

export const getThemeColors = (colorTheme, mode = 'light') => {
  const theme = getTheme(colorTheme, mode);
  const isDark = mode === 'dark';

  return {
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
    bg: isDark ? theme.darkBg : theme.lightBg,
    card: isDark ? theme.darkCard : theme.lightCard,
    text: isDark ? '#ffffff' : '#020817',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    isDark,
  };
};

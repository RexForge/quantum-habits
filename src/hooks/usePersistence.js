import { useEffect } from 'react';

export const usePersistence = (tasks, habits, theme, clockFormat, clockStyle) => {
  useEffect(() => {
    if (tasks !== undefined) {
      localStorage.setItem('sectograph_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    if (habits !== undefined) {
      localStorage.setItem('habitkit_habits', JSON.stringify(habits));
    }
  }, [habits]);

  useEffect(() => {
    if (theme !== undefined) {
      localStorage.setItem('sectograph_theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (clockFormat !== undefined) {
      localStorage.setItem('sectograph_clock_format', clockFormat);
    }
  }, [clockFormat]);

  useEffect(() => {
    if (clockStyle !== undefined) {
      localStorage.setItem('sectograph_clock_style', clockStyle);
    }
  }, [clockStyle]);
};

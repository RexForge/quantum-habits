import { useState, useEffect } from 'react';

export const useViewport = (showAddTask, showAddHabit, editingTask, editingHabit) => {
  const [paddingTop, setPaddingTop] = useState(0);
  const [paddingBottom, setPaddingBottom] = useState(0);

  useEffect(() => {
   if (!window.visualViewport) return;

    const initialHeight = window.visualViewport.height;

    const handleViewportChange = () => {
      // Skip viewport adjustments when modals are open to prevent focus loss
      if (showAddTask || showAddHabit || editingTask || editingHabit) {
        return;
      }

      const viewport = window.visualViewport;
      const heightDiff = initialHeight - viewport.height;

      // Treat >150px reduction as keyboard
      const keyboardHeight = heightDiff > 150 ? heightDiff : 0;

      // Only adjust bottom padding; top is controlled by status bar effect
      setPaddingBottom((prev) => Math.max(prev, keyboardHeight));
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    handleViewportChange();

    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
    };
  }, [showAddTask, showAddHabit, editingTask, editingHabit]);

  return { paddingTop, paddingBottom, setPaddingTop, setPaddingBottom };
};

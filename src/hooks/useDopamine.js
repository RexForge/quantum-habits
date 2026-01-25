import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * useDopamine Hook
 * Handles the Gamification Engine: XP calculation, Leveling, and Celebration triggers.
 */
export const useDopamine = () => {
  const { 
    xp, setXp, 
    level, setLevel, 
    setCelebrating,
    triggerHaptic 
  } = useAppContext();

  // --- XP Constants ---
  const XP_PER_TASK = 15;
  const XP_PER_HABIT = 25;
  const XP_TO_LEVEL_UP = 100;

  /**
   * Triggers the dopamine reward loop
   * @param {string} type - 'task' or 'habit'
   */
  const rewardUser = useCallback((type) => {
    const earnedXp = type === 'task' ? XP_PER_TASK : XP_PER_HABIT;
    
    setXp(prevXp => {
      const newXp = prevXp + earnedXp;
      
      // Check for Level Up
      if (newXp >= XP_TO_LEVEL_UP) {
        // Level Up Logic
        setLevel(prevLevel => prevLevel + 1);
        setCelebrating(true); // Fire Confetti!
        
        // Heavy Haptic for Level Up
        triggerHaptic(ImpactStyle.Heavy);
        
        return newXp - XP_TO_LEVEL_UP; // Reset XP with overflow
      }

      // Light reward feedback
      triggerHaptic(ImpactStyle.Medium);
      return newXp;
    });
  }, [setXp, setLevel, setCelebrating, triggerHaptic]);

  /**
   * Logic for "Streaks" and special multipliers could go here
   */
  const calculateMultiplier = (streakCount) => {
    if (streakCount > 5) return 1.5;
    if (streakCount > 10) return 2.0;
    return 1.0;
  };

  return { rewardUser, calculateMultiplier };
};
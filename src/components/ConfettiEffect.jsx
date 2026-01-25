import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useAppContext } from '../context/AppContext';

/**
 * Science-based Reward: Immediate visual feedback for task completion.
 * This component listens for a 'celebrate' trigger in the global context.
 */
const ConfettiEffect = () => {
  const { isCelebrating, setCelebrating } = useAppContext();
  const [windowDimension, setWindowDimension] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  // Update size if window resizes (especially important for mobile rotation)
  const detectSize = () => {
    setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
  };

  useEffect(() => {
    window.addEventListener('resize', detectSize);
    return () => window.removeEventListener('resize', detectSize);
  }, []);

  // Automatically stop confetti after 5 seconds so it doesn't drain battery
  useEffect(() => {
    if (isCelebrating) {
      const timer = setTimeout(() => {
        setCelebrating(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isCelebrating, setCelebrating]);

  if (!isCelebrating) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      <Confetti
        width={windowDimension.width}
        height={windowDimension.height}
        recycle={false} // Only fire once per trigger
        numberOfPieces={200}
        gravity={0.2}
        colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
      />
    </div>
  );
};

export default ConfettiEffect;
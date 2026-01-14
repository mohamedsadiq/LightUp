import { useState, useEffect } from 'react';

/**
 * Hook to detect if reduced motion is preferred
 * Checks both system preference AND user setting (popupAnimation === "none")
 */
export const useReducedMotion = (popupAnimationSetting?: string): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check system preference on mount
    if (typeof window !== 'undefined') {
      return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Return true if EITHER system prefers reduced motion OR user has disabled animations
  return prefersReducedMotion || popupAnimationSetting === 'none';
};

/**
 * Get static motion variants when reduced motion is preferred
 * Use this instead of animated variants for better performance
 */
export const getReducedMotionVariants = () => ({
  initial: { opacity: 1, scale: 1, x: 0, y: 0 },
  animate: { opacity: 1, scale: 1, x: 0, y: 0 },
  exit: { opacity: 0, scale: 1, x: 0, y: 0 }
});

/**
 * Wrap framer-motion transition to disable when reduced motion
 */
export const getOptimizedTransition = (reducedMotion: boolean, transition: any = {}) => {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return transition;
};

export default useReducedMotion;

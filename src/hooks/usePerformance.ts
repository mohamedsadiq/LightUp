import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for performance optimizations
 * Provides debouncing, throttling, and other performance utilities
 */
export const usePerformance = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);

  /**
   * Debounce function - delays execution until after delay has passed since last call
   */
  const debounce = useCallback((func: Function, delay: number) => {
    return (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
  }, []);

  /**
   * Throttle function - limits execution to once per delay period
   */
  const throttle = useCallback((func: Function, delay: number) => {
    return (...args: any[]) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        func.apply(null, args);
      }
    };
  }, []);

  /**
   * Request animation frame wrapper for smooth animations
   */
  const requestAnimationFrame = useCallback((callback: () => void) => {
    return window.requestAnimationFrame(callback);
  }, []);

  /**
   * Batch DOM updates to improve performance
   */
  const batchDOMUpdates = useCallback((updates: (() => void)[]) => {
    window.requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }, []);

  /**
   * Optimize scroll performance with passive listeners
   */
  const addOptimizedScrollListener = useCallback((
    element: HTMLElement,
    handler: (event: Event) => void,
    options: { passive?: boolean; throttleMs?: number } = {}
  ) => {
    const { passive = true, throttleMs = 16 } = options;
    const throttledHandler = throttle(handler, throttleMs);
    
    element.addEventListener('scroll', throttledHandler, { passive });
    
    return () => {
      element.removeEventListener('scroll', throttledHandler);
    };
  }, [throttle]);

  /**
   * Optimize resize performance
   */
  const addOptimizedResizeListener = useCallback((
    handler: (event: Event) => void,
    debounceMs: number = 250
  ) => {
    const debouncedHandler = debounce(handler, debounceMs);
    
    window.addEventListener('resize', debouncedHandler);
    
    return () => {
      window.removeEventListener('resize', debouncedHandler);
    };
  }, [debounce]);

  return {
    debounce,
    throttle,
    requestAnimationFrame,
    batchDOMUpdates,
    addOptimizedScrollListener,
    addOptimizedResizeListener
  };
};

export default usePerformance; 
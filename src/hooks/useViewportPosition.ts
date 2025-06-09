import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateFloatingPosition, needsRepositioning, getSafePosition } from '../utils/position';

interface Position {
  x: number;
  y: number;
}

interface PopupDimensions {
  width: number;
  height: number;
}

interface UseViewportPositionOptions {
  margin?: number;
  smoothRepositioning?: boolean;
  repositionOnResize?: boolean;
  repositionOnScroll?: boolean;
}

interface UseViewportPositionReturn {
  position: Position;
  setPosition: (newPosition: Position) => void;
  adjustPosition: (clientX: number, clientY: number) => void;
  forceAdjustment: () => void;
  isRepositioning: boolean;
}

export const useViewportPosition = (
  dimensions: PopupDimensions,
  options: UseViewportPositionOptions = {}
): UseViewportPositionReturn => {
  const {
    margin = 8,
    smoothRepositioning = true,
    repositionOnResize = true,
    repositionOnScroll = true
  } = options;

  const [position, setPositionState] = useState<Position>({ x: 0, y: 0 });
  const [isRepositioning, setIsRepositioning] = useState(false);
  const repositionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDimensionsRef = useRef<PopupDimensions>(dimensions);

  // Debounced adjustment function
  const debouncedAdjustment = useCallback(() => {
    if (repositionTimeoutRef.current) {
      clearTimeout(repositionTimeoutRef.current);
    }

    repositionTimeoutRef.current = setTimeout(() => {
      const currentPos = { left: position.x, top: position.y };
      
      if (needsRepositioning(currentPos, dimensions, margin)) {
        setIsRepositioning(true);
        
        const safePosition = getSafePosition(currentPos, dimensions, margin);
        
        if (smoothRepositioning) {
          // Smooth transition to new position
          setTimeout(() => {
            setPositionState({ x: safePosition.left, y: safePosition.top });
            setTimeout(() => setIsRepositioning(false), 200);
          }, 0);
        } else {
          setPositionState({ x: safePosition.left, y: safePosition.top });
          setIsRepositioning(false);
        }
      }
    }, 100);
  }, [position, dimensions, margin, smoothRepositioning]);

  // Handle viewport resize
  useEffect(() => {
    if (!repositionOnResize) return;

    const handleResize = () => {
      debouncedAdjustment();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [debouncedAdjustment, repositionOnResize]);

  // Handle viewport scroll
  useEffect(() => {
    if (!repositionOnScroll) return;

    const handleScroll = () => {
      debouncedAdjustment();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [debouncedAdjustment, repositionOnScroll]);

  // Handle dimension changes
  useEffect(() => {
    const prevDimensions = lastDimensionsRef.current;
    if (
      prevDimensions.width !== dimensions.width ||
      prevDimensions.height !== dimensions.height
    ) {
      lastDimensionsRef.current = dimensions;
      debouncedAdjustment();
    }
  }, [dimensions, debouncedAdjustment]);

  // Set position with viewport awareness
  const setPosition = useCallback((newPosition: Position) => {
    const proposedPosition = { left: newPosition.x, top: newPosition.y };
    
    if (needsRepositioning(proposedPosition, dimensions, margin)) {
      const safePosition = getSafePosition(proposedPosition, dimensions, margin);
      setPositionState({ x: safePosition.left, y: safePosition.top });
    } else {
      setPositionState(newPosition);
    }
  }, [dimensions, margin]);

  // Adjust position based on mouse/selection coordinates
  const adjustPosition = useCallback((clientX: number, clientY: number) => {
    const calculatedPosition = calculateFloatingPosition(
      clientX,
      clientY,
      dimensions,
      { margin }
    );
    
    setPositionState({ x: calculatedPosition.left, y: calculatedPosition.top });
  }, [dimensions, margin]);

  // Force adjustment of current position
  const forceAdjustment = useCallback(() => {
    debouncedAdjustment();
  }, [debouncedAdjustment]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (repositionTimeoutRef.current) {
        clearTimeout(repositionTimeoutRef.current);
      }
    };
  }, []);

  return {
    position,
    setPosition,
    adjustPosition,
    forceAdjustment,
    isRepositioning
  };
}; 
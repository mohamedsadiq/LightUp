import { useState, useRef, useEffect } from 'react';

interface ResizeState {
  width: number;
  height: number;
}

interface UseResizableProps {
  initialWidth: number;
  initialHeight: number;
}

export const useResizable = ({
  initialWidth,
  initialHeight,
}: UseResizableProps) => {
  const sizeRef = useRef<ResizeState>({ width: initialWidth, height: initialHeight });
  const [size, setSize] = useState<ResizeState>(sizeRef.current);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;

      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;

      sizeRef.current = {
        width: Math.max(resizeRef.current.startWidth + deltaX, initialWidth),
        height: Math.max(resizeRef.current.startHeight + deltaY, initialHeight)
      };

      requestAnimationFrame(() => {
        setSize(sizeRef.current);
      });

      e.preventDefault();
    };

    const handleMouseUp = () => {
      setSize(sizeRef.current);
      setIsResizing(false);
      resizeRef.current = null;
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove, { capture: true });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      document.body.style.userSelect = '';
    };
  }, [isResizing, initialWidth, initialHeight]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height
    };
  };

  return {
    width: size.width,
    height: size.height,
    isResizing,
    handleResizeStart
  };
};
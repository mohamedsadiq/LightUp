import React, { useEffect, useMemo } from "react"
import { motion, useMotionValue } from "framer-motion"
import { useReducedMotion, getReducedMotionVariants } from "~hooks/useReducedMotion"

interface FloatingLayoutProps {
  position: { x: number; y: number };
  width: number;
  height: number;
  settings: any;
  themedStyles: any;
  popupRef: React.RefObject<HTMLDivElement>;
  isInputFocused: boolean;
  handleResizeStart: (e: React.MouseEvent) => void;
  setIsInteractingWithPopup: (interacting: boolean) => void;
  renderPopupContent: () => React.ReactNode;
  Z_INDEX: any;
  scaleMotionVariants: any;
  slideMotionVariants: any;
  fadeMotionVariants: any;
  noMotionVariants: any;
}

export const FloatingLayout = ({
  position,
  width,
  height,
  settings,
  themedStyles,
  popupRef,
  isInputFocused,
  handleResizeStart,
  setIsInteractingWithPopup,
  renderPopupContent,
  Z_INDEX,
  scaleMotionVariants,
  slideMotionVariants,
  fadeMotionVariants,
  noMotionVariants,
  dragControls,
  onDragEnd
}: FloatingLayoutProps & { dragControls?: any; onDragEnd?: any }) => {
  // Check for reduced motion preference (system + user setting)
  const reducedMotion = useReducedMotion(settings?.customization?.popupAnimation);
  
  // Use motion values for direct, synchronous control over drag transforms
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Memoize variants selection to avoid recalculation
  const activeVariants = useMemo(() => {
    if (reducedMotion) return getReducedMotionVariants();
    
    const animation = settings?.customization?.popupAnimation;
    if (animation === "scale") return scaleMotionVariants;
    if (animation === "slide") return slideMotionVariants;
    if (animation === "fade") return fadeMotionVariants;
    return noMotionVariants;
  }, [reducedMotion, settings?.customization?.popupAnimation, scaleMotionVariants, slideMotionVariants, fadeMotionVariants, noMotionVariants]);

  // Reset motion values to 0 whenever position changes (after drag ends)
  // This ensures no residual transform remains
  useEffect(() => {
    x.set(0);
    y.set(0);
  }, [position.x, position.y, x, y]);

  // Calculate drag constraints to keep popup within window bounds with safe margin
  const margin = 20;
  const draggingConstraints = {
    left: -position.x + margin,
    right: typeof window !== 'undefined' ? window.innerWidth - width - position.x - margin : 0,
    top: -position.y + margin,
    bottom: typeof window !== 'undefined' ? window.innerHeight - height - position.y - margin : 0
  };

  // Internal drag end handler that resets motion values immediately
  const handleDragEndInternal = (event: any, info: any) => {
    // Call the parent handler first (this triggers position state update)
    if (onDragEnd) {
      onDragEnd(event, info);
    }
    // Immediately reset transforms to 0 - the position state now holds the final coords
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: Z_INDEX.POPUP,
        pointerEvents: 'none',
        x,
        y
      }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={draggingConstraints}
      onDragEnd={handleDragEndInternal}
      initial={{ opacity: reducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: reducedMotion ? 1 : 0 }}
      transition={{
        opacity: { duration: reducedMotion ? 0 : 0.2 }
      }}
    >
      <div style={{
        ...themedStyles.popupPositioner,
        maxHeight: '100vh',
        pointerEvents: 'auto'
      }}>
        <motion.div
          ref={popupRef}
          style={{
            ...themedStyles.popup,
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: '100vw',
            maxHeight: '100vh',
            overflow: 'hidden',
            position: 'relative',
            scrollBehavior: 'smooth',
            display: 'flex',
            flexDirection: 'column'
          }}
          data-plasmo-popup
          className="lu-no-select"
          onClick={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsInteractingWithPopup(true)}
          onMouseLeave={() => !isInputFocused && setIsInteractingWithPopup(false)}
          initial={reducedMotion ? { scale: 1, opacity: 1 } : "initial"}
          animate={reducedMotion ? { scale: 1, opacity: 1 } : "animate"}
          exit={reducedMotion ? { scale: 1, opacity: 0 } : "exit"}
          layout={false}
          variants={activeVariants}
        >
          {/* Popup Content with proper scrolling container */}
          <div
            className="lu-scroll-container"
            style={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0
            }}
          >
            {renderPopupContent()}
          </div>

          {/* Resize handle */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              cursor: 'se-resize',
              background: 'transparent',
              zIndex: 50
            }}
            onMouseDown={handleResizeStart}
            className="lu-resize-handle"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

FloatingLayout.displayName = 'FloatingLayout';
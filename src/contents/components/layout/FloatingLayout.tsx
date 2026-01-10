import React, { useEffect } from "react"
import { motion, useMotionValue } from "framer-motion"

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
  // Use motion values for direct, synchronous control over drag transforms
  const x = useMotionValue(0);
  const y = useMotionValue(0);

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
      initial={{ opacity: settings?.customization?.popupAnimation === "none" ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: settings?.customization?.popupAnimation === "none" ? 1 : 0 }}
      transition={{
        opacity: { duration: settings?.customization?.popupAnimation === "none" ? 0 : 0.2 }
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
          initial={settings?.customization?.popupAnimation === "none" ? { scale: 1, opacity: 1 } : "initial"}
          animate={settings?.customization?.popupAnimation === "none" ? { scale: 1, opacity: 1 } : "animate"}
          exit={settings?.customization?.popupAnimation === "none" ? { scale: 1, opacity: 0 } : "exit"}
          layout={false}
          variants={
            settings?.customization?.popupAnimation === "scale"
              ? scaleMotionVariants
              : settings?.customization?.popupAnimation === "slide"
                ? slideMotionVariants
                : settings?.customization?.popupAnimation === "fade"
                  ? fadeMotionVariants
                  : noMotionVariants
          }
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
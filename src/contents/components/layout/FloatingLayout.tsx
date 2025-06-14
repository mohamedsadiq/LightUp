import React from "react"
import { motion } from "framer-motion"

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
  noMotionVariants
}: FloatingLayoutProps) => {
  return (
    <motion.div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: Z_INDEX.POPUP,
        pointerEvents: 'none'
      }}
      initial={settings?.customization?.popupAnimation === "none" ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 0, y: 0 }}
      animate={{ 
        opacity: 1,
        x: 0, 
        y: 0,
        transition: {
          duration: settings?.customization?.popupAnimation === "none" ? 0 : 0.2,
          ease: "easeOut"
        }
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: settings?.customization?.popupAnimation === "none" ? 0 : 0.2 }}
    >
      <div style={{
        ...themedStyles.popupPositioner,
        pointerEvents: 'auto'
      }}>
        <motion.div 
          ref={popupRef}
          style={{
            ...themedStyles.popup,
            width: `${width}px`,
            height: `${height}px`,
            overflow: 'hidden', // Changed from 'auto' to 'hidden'
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
          layout={false} // Disable layout animations for better performance
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
              width: '15px',
              height: '15px',
              cursor: 'se-resize',
              background: 'transparent'
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
import React from "react"
import { motion } from "framer-motion"

interface CenteredLayoutProps {
  width: number;
  height: number;
  settings: any;
  themedStyles: any;
  popupRef: React.RefObject<HTMLDivElement>;
  isInputFocused: boolean;
  handleResizeStart: (e: React.MouseEvent) => void;
  setIsInteractingWithPopup: (interacting: boolean) => void;
  setIsVisible: (visible: boolean) => void;
  renderPopupContent: () => React.ReactNode;
  Z_INDEX: any;
  scaleMotionVariants: any;
  slideMotionVariants: any;
  fadeMotionVariants: any;
  noMotionVariants: any;
}

export const CenteredLayout = ({
  width,
  height,
  settings,
  themedStyles,
  popupRef,
  isInputFocused,
  handleResizeStart,
  setIsInteractingWithPopup,
  setIsVisible,
  renderPopupContent,
  Z_INDEX,
  scaleMotionVariants,
  slideMotionVariants,
  fadeMotionVariants,
  noMotionVariants
}: CenteredLayoutProps) => {
  return (
    <>
      {/* Background overlay with blur */}
      <motion.div
        style={themedStyles.centeredPopupOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setIsVisible(false)}
      />
      
      {/* Centered popup */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: Z_INDEX.CENTERED_POPUP,
        pointerEvents: 'none'
      }}>
        <motion.div
          ref={popupRef}
          style={{
            ...themedStyles.centeredPopup,
            width: `${Math.max(width, 650)}px`,
            height: `${Math.max(height, 450)}px`,
            overflow: "hidden", // Changed from 'auto' to 'hidden'
            scrollBehavior: 'smooth',
            pointerEvents: 'auto',
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
          transition={{ 
            duration: settings?.customization?.popupAnimation === "none" ? 0 : 0.2, 
            ease: "easeOut" 
          }}
          variants={
            settings?.customization?.popupAnimation === "scale" 
              ? scaleMotionVariants 
              : settings?.customization?.popupAnimation === "scale"
                ? slideMotionVariants
                : settings?.customization?.popupAnimation === "fade"
                  ? fadeMotionVariants
                  : noMotionVariants
          }
        >
          {/* Centered Popup Content with proper scrolling */}
          <div className="lu-scroll-container" style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            transform: 'translateZ(0)' // Force hardware acceleration
          }}>
            {renderPopupContent()}
          </div>
          
          {/* Resize handle - smaller and less visible */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '12px',
              height: '12px',
              cursor: 'se-resize',
              background: 'transparent'
            }}
            onMouseDown={handleResizeStart}
            className="lu-resize-handle"
          />
        </motion.div>
      </div>
    </>
  );
};

CenteredLayout.displayName = 'CenteredLayout'; 
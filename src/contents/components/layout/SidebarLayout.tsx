import React, { useEffect } from "react"
import { motion } from "framer-motion"

interface SidebarLayoutProps {
  width: number;
  settings: any;
  themedStyles: any;
  popupRef: React.RefObject<HTMLDivElement>;
  isInputFocused: boolean;
  setIsInteractingWithPopup: (interacting: boolean) => void;
  renderPopupContent: () => React.ReactNode;
  sidebarScaleMotionVariants: any;
  sidebarSlideMotionVariants: any;
  fadeMotionVariants: any;
  noMotionVariants: any;
  isPinned?: boolean;
}

export const SidebarLayout = ({
  width,
  settings,
  themedStyles,
  popupRef,
  isInputFocused,
  setIsInteractingWithPopup,
  renderPopupContent,
  sidebarScaleMotionVariants,
  sidebarSlideMotionVariants,
  fadeMotionVariants,
  noMotionVariants,
  isPinned = false
}: SidebarLayoutProps) => {
  // When pinned, we no longer adjust the page layout. Sidebar remains an overlay.

  return (
    <motion.div
      ref={popupRef}
      style={{
        ...themedStyles.sidebarPopup,
        width: `${width}px`,
        minWidth: "35%",
        maxWidth: "800px",
        resize: "horizontal",
        overflow: "hidden", // Changed from 'auto' to 'hidden'
        scrollBehavior: 'smooth',
        display: 'flex',
        flexDirection: 'column',
        // When pinned, embed in page rather than overlay
        position: isPinned ? 'fixed' as const : 'fixed' as const,
        zIndex: isPinned ? 1000 : themedStyles.sidebarPopup.zIndex
      }}
      data-plasmo-popup
      className="lu-no-select"
      onClick={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsInteractingWithPopup(true)}
      onMouseLeave={() => !isInputFocused && setIsInteractingWithPopup(false)}
      initial={settings?.customization?.popupAnimation === "none" ? { x: 0, opacity: 1 } : "initial"}
      animate={settings?.customization?.popupAnimation === "none" ? { x: 0, opacity: 1 } : "animate"}
      exit={settings?.customization?.popupAnimation === "none" ? { x: 0, opacity: 0 } : "exit"}
      transition={{ 
        type: settings?.customization?.popupAnimation === "none" ? "tween" : "spring",
        stiffness: 300,
        damping: 25,
        mass: 0.8,
        duration: settings?.customization?.popupAnimation === "none" ? 0 : undefined
      }}
      variants={
        settings?.customization?.popupAnimation === "scale" 
          ? sidebarScaleMotionVariants 
          : settings?.customization?.popupAnimation === "slide"
            ? sidebarSlideMotionVariants
            : settings?.customization?.popupAnimation === "fade"
              ? fadeMotionVariants
              : noMotionVariants
      }
    >
      {/* Sidebar Popup Content with proper scrolling */}
      <div className="lu-scroll-container" style={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        paddingTop: 0,
        WebkitOverflowScrolling: 'touch',
        transform: 'translateZ(0)' // Force hardware acceleration
      }}>
        {renderPopupContent()}
      </div>
    </motion.div>
  );
};

SidebarLayout.displayName = 'SidebarLayout'; 
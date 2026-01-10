import React, { useEffect, useState } from "react"
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
  sidebarReducedMotionVariants: any;
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
  sidebarReducedMotionVariants,
  fadeMotionVariants,
  noMotionVariants,
  isPinned = false
}: SidebarLayoutProps) => {
  // When pinned, we no longer adjust the page layout. Sidebar remains an overlay.

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)

    handleChange()

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange)
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange)
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  const animationType = settings?.customization?.popupAnimation
  const slideVariants = prefersReducedMotion ? sidebarReducedMotionVariants : sidebarSlideMotionVariants
  const variants =
    animationType === "scale"
      ? sidebarScaleMotionVariants
      : animationType === "slide"
        ? slideVariants
        : animationType === "fade"
          ? fadeMotionVariants
          : noMotionVariants

  const transitionProps =
    animationType === "none"
      ? { type: "tween", duration: 0 }
      : undefined

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
      initial={animationType === "none" ? { x: 0, opacity: 1 } : "initial"}
      animate={animationType === "none" ? { x: 0, opacity: 1 } : "animate"}
      exit={animationType === "none" ? { x: 0, opacity: 1 } : "exit"}
      transition={animationType === "none" ? { duration: 0 } : transitionProps}
      variants={variants}
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
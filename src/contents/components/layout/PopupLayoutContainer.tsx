import React from "react"
import { AnimatePresence } from "framer-motion"
import { FloatingLayout } from "./FloatingLayout"
import { SidebarLayout } from "./SidebarLayout"
import { CenteredLayout } from "./CenteredLayout"

interface PopupLayoutContainerProps {
  isVisible: boolean;
  isEnabled: boolean;
  isConfigured: boolean;
  layoutMode: string;
  position: { x: number; y: number };
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
  sidebarScaleMotionVariants: any;
  sidebarSlideMotionVariants: any;
}

export const PopupLayoutContainer = ({
  isVisible,
  isEnabled,
  isConfigured,
  layoutMode,
  position,
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
  noMotionVariants,
  sidebarScaleMotionVariants,
  sidebarSlideMotionVariants
}: PopupLayoutContainerProps) => {
  return (
    <AnimatePresence mode="sync">
      {isVisible && isEnabled && isConfigured && (
        layoutMode === "floating" ? (
          <FloatingLayout
            position={position}
            width={width}
            height={height}
            settings={settings}
            themedStyles={themedStyles}
            popupRef={popupRef}
            isInputFocused={isInputFocused}
            handleResizeStart={handleResizeStart}
            setIsInteractingWithPopup={setIsInteractingWithPopup}
            renderPopupContent={renderPopupContent}
            Z_INDEX={Z_INDEX}
            scaleMotionVariants={scaleMotionVariants}
            slideMotionVariants={slideMotionVariants}
            fadeMotionVariants={fadeMotionVariants}
            noMotionVariants={noMotionVariants}
          />
        ) : layoutMode === "sidebar" ? (
          <SidebarLayout
            width={width}
            settings={settings}
            themedStyles={themedStyles}
            popupRef={popupRef}
            isInputFocused={isInputFocused}
            setIsInteractingWithPopup={setIsInteractingWithPopup}
            renderPopupContent={renderPopupContent}
            sidebarScaleMotionVariants={sidebarScaleMotionVariants}
            sidebarSlideMotionVariants={sidebarSlideMotionVariants}
            fadeMotionVariants={fadeMotionVariants}
            noMotionVariants={noMotionVariants}
          />
        ) : (
          <CenteredLayout
            width={width}
            height={height}
            settings={settings}
            themedStyles={themedStyles}
            popupRef={popupRef}
            isInputFocused={isInputFocused}
            handleResizeStart={handleResizeStart}
            setIsInteractingWithPopup={setIsInteractingWithPopup}
            setIsVisible={setIsVisible}
            renderPopupContent={renderPopupContent}
            Z_INDEX={Z_INDEX}
            scaleMotionVariants={scaleMotionVariants}
            slideMotionVariants={slideMotionVariants}
            fadeMotionVariants={fadeMotionVariants}
            noMotionVariants={noMotionVariants}
          />
        )
      )}
    </AnimatePresence>
  );
};

PopupLayoutContainer.displayName = 'PopupLayoutContainer'; 
import React from "react"
import { motion } from "framer-motion"
import { DynamicSkeletonLines } from "./DynamicSkeletonLines"

interface LoadingSkeletonContainerProps {
  normalizedTheme: "light" | "dark";
  popupRef: React.RefObject<HTMLDivElement>;
  fontSizes: any;
  flexMotionStyle: any;
  loadingSkeletonVariants: any;
  pulseVariants: any;
}

export const LoadingSkeletonContainer = ({
  normalizedTheme,
  popupRef,
  fontSizes,
  flexMotionStyle,
  loadingSkeletonVariants,
  pulseVariants
}: LoadingSkeletonContainerProps) => {
  return (
    <motion.div 
      // className="skeleton-container skeleton-optimized"
      style={{
        ...flexMotionStyle,
        transform: 'translateZ(0)', // Hardware acceleration
        willChange: 'transform, opacity',
        // contain: 'layout style paint', // Performance optimization
      }} 
      variants={loadingSkeletonVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      // layout
    >
      <DynamicSkeletonLines 
        currentTheme={normalizedTheme}
        containerRef={popupRef}
        fontSizes={fontSizes}
      />
      
      {/* Enhanced loading indicator */}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '16px',
          gap: '8px',
          transform: 'translateZ(0)', // Hardware acceleration
        }}
        variants={pulseVariants}
        initial="initial"
        animate="animate"
      >
        
      </motion.div>
    </motion.div>
  );
};

LoadingSkeletonContainer.displayName = 'LoadingSkeletonContainer'; 
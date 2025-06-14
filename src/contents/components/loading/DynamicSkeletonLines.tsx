import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { FontSizes } from "../../styles"
import { 
  skeletonLineVariants
} from "~contents/variants"

interface DynamicSkeletonLinesProps {
  currentTheme: "light" | "dark";
  containerRef: React.RefObject<HTMLDivElement>;
  fontSizes: FontSizes;
}

export const DynamicSkeletonLines = React.memo(({ currentTheme, containerRef, fontSizes }: DynamicSkeletonLinesProps) => {
  const [lineCount, setLineCount] = useState(6); // Better default fallback
  
  useEffect(() => {
    const calculateLines = () => {
      if (!containerRef.current) return;
      
      // Get actual container dimensions
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;
      
      // Calculate header and UI element heights more accurately
      const headerElement = containerRef.current.querySelector('[data-header]') || 
                           containerRef.current.querySelector('.lu-header') ||
                           containerRef.current.firstElementChild;
      
      const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 60;
      
      // Account for different layout modes
      const isFloating = containerRect.width < 400;
      const isSidebar = containerRect.width > 600;
      
      // Dynamic spacing based on layout
      const lineHeight = 25;
      const lineSpacing = isFloating ? 6 : 8; // Tighter spacing for small layouts
      const topPadding = 20;
      const bottomPadding = isFloating ? 60 : 80; // Less bottom space for floating
      const loadingIndicatorSpace = 50;
      
      // More accurate available height calculation
      const usedSpace = headerHeight + topPadding + bottomPadding + loadingIndicatorSpace;
      const availableHeight = Math.max(100, containerHeight - usedSpace);
      
      // Calculate lines with better logic
      const totalLineSpace = lineHeight + lineSpacing;
      const maxPossibleLines = Math.floor(availableHeight / totalLineSpace);
      
      // Adaptive line count based on layout
      let optimalLines;
      if (isFloating) {
        optimalLines = Math.max(3, Math.min(maxPossibleLines, 8)); // 3-8 lines for floating
      } else if (isSidebar) {
        optimalLines = Math.max(6, Math.min(maxPossibleLines, 20)); // 6-20 lines for sidebar
      } else {
        optimalLines = Math.max(4, Math.min(maxPossibleLines, 15)); // 4-15 lines for centered
      }
      
      // Smooth transition - don't change too drastically
      const currentCount = lineCount;
      const difference = Math.abs(optimalLines - currentCount);
      
      if (difference > 2) {
        // Gradual adjustment for large changes
        const adjustment = difference > 5 ? 3 : 1;
        const newCount = optimalLines > currentCount 
          ? currentCount + adjustment 
          : currentCount - adjustment;
        setLineCount(Math.max(3, Math.min(newCount, 20)));
      } else if (difference > 0) {
        setLineCount(optimalLines);
      }
    };
    
    // Initial calculation with delay to ensure DOM is ready
    const timeoutId = setTimeout(calculateLines, 100);
    
    // Debounced resize observer for better performance
    let resizeTimeout: NodeJS.Timeout;
    const debouncedCalculate = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateLines, 150);
    };
    
    const resizeObserver = new ResizeObserver(debouncedCalculate);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [containerRef, lineCount]);
  
  // Better width distribution for more realistic content
  const getRandomWidth = (index: number) => {
    const patterns = [
      ['100%', '85%', '70%', '92%', '78%'], // Paragraph pattern
      ['95%', '88%', '82%', '90%', '75%'],  // Article pattern  
      ['100%', '93%', '87%', '96%', '73%'], // List pattern
    ];
    
    const patternIndex = Math.floor(index / 5) % patterns.length;
    const pattern = patterns[patternIndex];
    return pattern[index % pattern.length];
  };
  
  return (
    <>
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            height: '20px',
            background: currentTheme === "dark" 
              ? '#2a2a2a'
              : '#f0f0f0',
            borderRadius: '4px',
            width: getRandomWidth(i),
            overflow: 'hidden',
            position: 'relative',
            // marginBottom: '8px',
          }}
          variants={skeletonLineVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          custom={i}
        >
          {/* Simple single shimmer */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: currentTheme === "dark"
                ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.24) 50%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
            }}
            animate={{
              backgroundPosition: ['-100% 0%', '100% 0%']
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 0,
              delay:  0.3
            }}
          />
        </motion.div>
      ))}
    </>
  );
});

DynamicSkeletonLines.displayName = 'DynamicSkeletonLines'; 
import type { Transition } from "framer-motion";

/**
 * Family Wallet Animation Configuration
 * 
 * Based on the Three Pillars: Simplicity, Fluidity, Delight
 * 
 * Core Principles:
 * - Keep animations under 300ms for responsiveness
 * - Use spring physics for natural movement
 * - Apply selective emphasis based on usage frequency
 */

// ============================================================================
// Spring Configurations (Family Wallet Tuned)
// ============================================================================

export const FAMILY_SPRINGS = {
  // Snappy, responsive for frequent interactions
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 17
  } as const,

  // Smooth, balanced for general use
  smooth: {
    type: "spring",
    stiffness: 300,
    damping: 25
  } as const,

  // Gentle, relaxed for rare interactions
  gentle: {
    type: "spring",
    stiffness: 200,
    damping: 30
  } as const,

  // Duration-based configs for simple transitions
  instant: { duration: 0.1 } as const,
  fast: { duration: 0.2 } as const,
  normal: { duration: 0.3 } as const,
  slow: { duration: 0.5 } as const
} satisfies Record<string, Transition>;

// ============================================================================
// Delight-Impact Curve
// ============================================================================

/**
 * Based on usage frequency, select appropriate animation intensity
 * - Frequent features: Subtle animations
 * - Occasional features: Moderate animations  
 * - Rare features: High-impact animations
 */
export const getAnimationByFrequency = (
  frequency: "frequent" | "occasional" | "rare"
): Transition => {
  switch (frequency) {
    case "frequent":
      return FAMILY_SPRINGS.instant;
    case "occasional":
      return FAMILY_SPRINGS.smooth;
    case "rare":
      return FAMILY_SPRINGS.gentle;
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get transition with reduced motion check
 */
export const getSafeTransition = (
  transition: Transition
): Transition => {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return transition;
};

// ============================================================================
// Common Animation Variants
// ============================================================================

export const fadeSlideVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: FAMILY_SPRINGS.smooth
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: FAMILY_SPRINGS.instant
  }
};

export const scaleVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: FAMILY_SPRINGS.smooth
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: FAMILY_SPRINGS.smooth
  }
};

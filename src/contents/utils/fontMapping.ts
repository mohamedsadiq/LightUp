import type { FontSizes } from "../styles"

// Simplified font size mapping system - consistent for all sites
export const createFontSizeMapping = (baseFontSize: string): FontSizes => {
  // Convert the base font size to a number for calculations
  const parseSize = (size: string): number => {
    if (size === "x-small") return 13;        // 13px
    if (size === "small") return 14;          // 14px
    if (size === "medium") return 16;         // 16px
    if (size === "large") return 18;         // 18px
    if (size === "x-large") return 21;       // 21px
    if (size === "xx-large") return 23;     // 23px
    
    // Handle px values
    const match = size.match(/^([\d.]+)px$/);
    if (match) return parseFloat(match[1]);
    
    // Default to medium
    return 16;
  };

  const baseSize = parseSize(baseFontSize);
  
  // Standard px-based sizing for all sites
  return {
    // Base text size
    base: `${baseSize}px`,
    
    // Relative sizes based on base
    xs: `${Math.max(10, Math.round(baseSize * 0.75))}px`,      // 75% of base, minimum 10px
    sm: `${Math.max(11, Math.round(baseSize * 0.85))}px`,      // 85% of base, minimum 11px
    md: `${baseSize}px`,                             // Same as base
    lg: `${Math.round(baseSize * 1.15)}px`,                     // 115% of base
    xl: `${Math.round(baseSize * 1.3)}px`,                      // 130% of base
    xxl: `${Math.round(baseSize * 1.5)}px`,                     // 150% of base
    
    // Specific UI element sizes
    button: `${Math.max(13, Math.round(baseSize * 0.9))}px`,   // Slightly smaller for buttons
    input: `${Math.max(13, Math.round(baseSize * 0.9))}px`,    // Input field text
    loading: `${Math.max(12, Math.round(baseSize * 0.8))}px`, // Loading indicators
    model: `${Math.max(11, Math.round(baseSize * 0.75))}px`,   // Model display
    icon: `${Math.max(11, Math.round(baseSize * 0.7))}px`,     // Icon sizes
    
    // Welcome/guidance messages
    welcome: {
      emoji: `${Math.round(baseSize * 1.8)}px`,                 // Large emoji
      heading: `${Math.round(baseSize * 1.2)}px`,               // Heading text
      description: `${Math.max(13, Math.round(baseSize * 0.9))}px` // Description text
    },
    
    // Connection status
    connection: `${Math.max(11, Math.round(baseSize * 0.75))}px`,
    
    // Error messages
    error: `${Math.max(13, Math.round(baseSize * 0.85))}px`
  };
}; 
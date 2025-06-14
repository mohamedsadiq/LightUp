import type { FontSizes } from "../styles"

// Comprehensive font size mapping system with YouTube compensation
export const createFontSizeMapping = (baseFontSize: string): FontSizes => {
  // Detect if we're on YouTube
  const isYouTube = window.location.hostname.includes('youtube.com');
  
  // Convert the base font size to a number for calculations
  const parseSize = (size: string): number => {
    if (size === "x-small") return 0.8;        // Increased from 0.7
    if (size === "small") return 0.9;          // Increased from 0.75
    if (size === "medium") return 1.0;         // Increased from 0.875
    if (size === "large") return 1.15;        // Increased from 1
    if (size === "x-large") return 1.3;       // Increased from 1.125
    if (size === "xx-large") return 1.45;     // Increased from 1.25
    
    // Handle rem values
    const match = size.match(/^([\d.]+)rem$/);
    if (match) return parseFloat(match[1]);
    
    // Default to medium
    return 1.0;
  };

  const baseSize = parseSize(baseFontSize);
  
  if (isYouTube) {
    // Use pixel-based sizing for YouTube to avoid rem scaling issues
    const basePx = 24; // Standard base pixel size
    const multiplier = baseSize; // User's font size preference multiplier
    
    console.log('LightUp: YouTube font mapping', { 
      baseFontSize, 
      baseSize, 
      multiplier, 
      compensatedBase: Math.round(basePx * multiplier * 0.8) 
    });
    
    return {
      // Base text size - adjusted for YouTube
      base: `${Math.round(basePx * multiplier * 0.8)}px`, // Reduced compensation
      
      // Relative sizes based on base - all in pixels
      xs: `${Math.round(Math.max(12, basePx * multiplier * 0.75))}px`,
      sm: `${Math.round(Math.max(14, basePx * multiplier * 0.85))}px`, 
      md: `${Math.round(basePx * multiplier)}px`,
      lg: `${Math.round(basePx * multiplier * 1.15)}px`,
      xl: `${Math.round(basePx * multiplier * 1.3)}px`,
      xxl: `${Math.round(basePx * multiplier * 1.5)}px`,
      
      // Specific UI element sizes - compensated for YouTube
      button: `${Math.round(Math.max(14, basePx * multiplier * 0.9))}px`,
      input: `${Math.round(Math.max(16, basePx * multiplier))}px`,
      loading: `${Math.round(Math.max(13, basePx * multiplier * 0.8))}px`,
      model: `${Math.round(Math.max(13, basePx * multiplier * 0.75))}px`,
      icon: `${Math.round(Math.max(12, basePx * multiplier * 0.7))}px`,
      
      // Welcome/guidance messages - compensated
      welcome: {
        emoji: `${Math.round(basePx * multiplier * 2)}px`,
        heading: `${Math.round(basePx * multiplier * 1.4)}px`,
        description: `${Math.round(Math.max(16, basePx * multiplier))}px`
      },
      
      // Connection status - compensated
      connection: `${Math.round(Math.max(13, basePx * multiplier * 0.75))}px`,
      
      // Error messages - compensated
      error: `${Math.round(Math.max(14, basePx * multiplier * 0.85))}px`
    };
  }
  
  // Standard rem-based sizing for non-YouTube sites
  return {
    // Base text size
    base: `${baseSize}rem`,
    
    // Relative sizes based on base
    xs: `${Math.max(0.6, baseSize * 0.75)}rem`,      // 75% of base, minimum 0.6rem (increased from 0.5)
    sm: `${Math.max(0.7, baseSize * 0.85)}rem`,      // 85% of base, minimum 0.7rem (increased from 0.6)
    md: `${baseSize}rem`,                             // Same as base
    lg: `${baseSize * 1.15}rem`,                     // 115% of base
    xl: `${baseSize * 1.3}rem`,                      // 130% of base
    xxl: `${baseSize * 1.5}rem`,                     // 150% of base
    
    // Specific UI element sizes
    button: `${Math.max(0.8, baseSize * 0.9)}rem`,   // Slightly smaller for buttons (increased from 0.7)
    input: `${Math.max(0.8, baseSize * 0.9)}rem`,    // Input field text (increased from 0.7)
    loading: `${Math.max(0.75, baseSize * 0.8)}rem`, // Loading indicators (increased from 0.65)
    model: `${Math.max(0.7, baseSize * 0.75)}rem`,   // Model display (increased from 0.6)
    icon: `${Math.max(0.7, baseSize * 0.7)}rem`,     // Icon sizes (increased from 0.6)
    
    // Welcome/guidance messages
    welcome: {
      emoji: `${baseSize * 1.8}rem`,                 // Large emoji
      heading: `${baseSize * 1.2}rem`,               // Heading text
      description: `${Math.max(0.8, baseSize * 0.9)}rem` // Description text (increased from 0.7)
    },
    
    // Connection status
    connection: `${Math.max(0.7, baseSize * 0.75)}rem`, // Increased from 0.6
    
    // Error messages
    error: `${Math.max(0.8, baseSize * 0.85)}rem`   // Increased from 0.7
  };
}; 
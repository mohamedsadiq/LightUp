import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import type { PlasmoCSConfig } from "plasmo"
import { motion, AnimatePresence } from "framer-motion"
import type { MotionStyle } from "framer-motion"
import type { CSSProperties } from "react"
import MarkdownText from "../components/content/MarkdownText"
import { Logo, CloseIcon } from "../components/icons"
import GlobalActionButton from "../components/content/GlobalActionButton"
import TextSelectionButton from "../components/content/TextSelectionButton"
import WebsiteInfoComponent from "../components/content/WebsiteInfo"
import type { Settings, Mode } from "~types/settings"
import { useTextSelection } from "~hooks/useTextSelection"

// Import styles as text using Plasmo's data-text scheme
import cssText from "data-text:./styles.css"
import contentStyleCssText from "data-text:./content-style.css"
import tailwindCssText from "data-text:./tailwind-scoped.css"
import fontCssText from "data-text:./fonts.css" // Import font CSS

import { styles } from "./styles"
import { textVariants, iconButtonVariants } from "./variants"
import { useResizable } from '../hooks/useResizable'
import { PopupModeSelector } from "../components/content/PopupModeSelector"
import { v4 as uuidv4 } from 'uuid'
import { getStyles } from "./styles"
import type { FontSizes } from "./styles"
import { getTextDirection } from "~utils/rtl"
import { truncateText } from "~utils/textProcessing"
import { 
  flexMotionStyle, 
  scaleMotionVariants, 
  slideMotionVariants,
  fadeMotionVariants, 
  noMotionVariants, 
  toastMotionVariants,
  sidebarScaleMotionVariants,
  sidebarSlideMotionVariants
} from "~styles/motionStyles"
import type { Theme } from "~types/theme"
import { applyHighlightColor } from "~utils/highlight"
import { calculatePosition, needsRepositioning } from "~utils/position"
import { Storage } from "@plasmohq/storage"
import { Z_INDEX } from "~utils/constants"
import { THEME_COLORS } from "~utils/constants"
import { 
  loadingSkeletonVariants, 
  shimmerVariants, 
  loadingVariants, 
  skeletonLineVariants, 
  enhancedShimmerVariants, 
  loadingDotsVariants,
  pulseVariants 
} from "~contents/variants"
import { getHighlightColor } from "~utils/highlight"
import ErrorMessage from "~components/common/ErrorMessage"
import React from "react"

// Import our hooks
import { useSpeech } from "~hooks/useSpeech"
import { useToast } from "~hooks/useToast"
import { useEnabled } from "~hooks/useEnabled"
import { useFollowUp } from "~hooks/useFollowUp"
import { useSettings } from "~hooks/useSettings"
import { useKeyboardShortcuts } from "~hooks/useKeyboardShortcuts"
import { usePort } from "~hooks/usePort"
import { usePopup } from "~hooks/usePopup"
import { useCopy } from "~hooks/useCopy"
import { useLastResult } from "~hooks/useLastResult"
import { useCurrentModel } from "~hooks/useCurrentModel"
import { useConversation } from "~hooks/useConversation"
import { useMode } from "~hooks/useMode"
import { createRoot } from "react-dom/client";
// Add import for page content extraction utility
import getPageContent from "~utils/contentExtractor"

// Add optimized debounce utility
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

// Comprehensive font size mapping system with YouTube compensation
const createFontSizeMapping = (baseFontSize: string): FontSizes => {
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

// Add message listener for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTENSION_STATE_CHANGED") {
    console.log('Content script received EXTENSION_STATE_CHANGED message:', message.enabled);
    
    // Immediately dispatch event to update UI components
    window.dispatchEvent(
      new CustomEvent('isEnabledChanged', { 
        detail: { isEnabled: message.enabled } 
      })
    );
    
    // Also dispatch the extensionStateChanged event for consistency
    window.dispatchEvent(
      new CustomEvent('extensionStateChanged', { 
        detail: { enabled: message.enabled } 
      })
    );
    
    // Update storage asynchronously
    const storage = new Storage();
    storage.set("isEnabled", message.enabled.toString()).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Failed to update isEnabled in storage:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Indicate we'll respond asynchronously
  }
  
  if (message.type === "SETTINGS_UPDATED") {
    // Force a refresh of the settings in the content script
    const storage = new Storage();
    storage.set("settings", message.settings).then(() => {
      // Dispatch a custom event that our hooks can listen for
      const event = new CustomEvent('settingsUpdated', { 
        detail: { 
          key: message.key,
          value: message.value,
          settings: message.settings
        } 
      });
      window.dispatchEvent(event);
      
      // Send response to confirm receipt
      sendResponse({ success: true });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.type === "MODES_UPDATED") {
    // Force a refresh of the settings and preferred modes in the content script
    const storage = new Storage();
    
    // Update settings with new preferred modes
    storage.set("settings", message.settings).then(() => {
      // Also update the preferredModes in storage
      return storage.set("preferredModes", message.preferredModes);
    }).then(() => {
      // Dispatch a custom event that our hooks can listen for
      const event = new CustomEvent('modesUpdated', { 
        detail: { 
          preferredModes: message.preferredModes,
          settings: message.settings
        } 
      });
      window.dispatchEvent(event);
      
      // Send response to confirm receipt
      sendResponse({ success: true });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.type === "EXTENSION_STATE_CHANGED") {
    console.log("Extension state changed to:", message.enabled);
    // Update the isEnabled state in storage
    const storage = new Storage();
    storage.set("isEnabled", message.enabled.toString()).then(() => {
      // Dispatch a custom event that our hooks can listen for
      const event = new CustomEvent('extensionStateChanged', { 
        detail: { 
          enabled: message.enabled
        } 
      });
      window.dispatchEvent(event);
      
      // Also dispatch the isEnabledChanged event for consistency
      const enabledEvent = new CustomEvent('isEnabledChanged', { 
        detail: { 
          isEnabled: message.enabled
        } 
      });
      window.dispatchEvent(enabledEvent);
      
      // Handle UI visibility in real-time when extension is disabled
      if (!message.enabled) {
        // Force any active LightUp UIs to close immediately
        // This will immediately hide any visible UI elements
        document.dispatchEvent(new CustomEvent('lightup-force-hide'));
      }
      
      // Send response to confirm receipt
      sendResponse({ success: true });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.type === "MODE_CHANGED") {
    // Update the active mode in storage
    const storage = new Storage();
    
    // Update the mode
    storage.set("mode", message.mode).then(() => {
      // If it's translate mode, also update translation settings
      if (message.mode === "translate" && message.translationSettings) {
        return storage.set("translationSettings", message.translationSettings);
      }
      return Promise.resolve();
    }).then(() => {
      // Dispatch a custom event that our hooks can listen for
      const event = new CustomEvent('modeChanged', { 
        detail: { 
          mode: message.mode,
          translationSettings: message.translationSettings,
          reprocessExisting: message.reprocessExisting
        } 
      });
      window.dispatchEvent(event);
      
      // Send response to confirm receipt
      sendResponse({ success: true });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.type === "PROCESS_SELECTED_TEXT") {
    // This is triggered by the context menu
    // Create and dispatch a custom event for the context menu selection
    const event = new CustomEvent('contextMenuSelection', {
      detail: {
        text: message.selectionText,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        fromContextMenu: true // Add a flag to indicate this is from the context menu
      }
    });
    window.dispatchEvent(event);
    
    // Send response to confirm receipt
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === "OPEN_FREE_POPUP") {
    // Dispatch a custom event to open the popup in free mode
    const event = new CustomEvent('openFreePopup');
    window.dispatchEvent(event);
    
    // Send response to confirm receipt
    sendResponse({ success: true });
    return true;
  }
});

// Plasmo function to inject CSS into the Shadow DOM
export const getStyle = () => {
  const style = document.createElement("style")
  // Combine all CSS text imports
  style.textContent = cssText + contentStyleCssText + tailwindCssText + fontCssText
  return style
}

// Plasmo config
export const config: PlasmoCSConfig = {}

// Add a specific fix for Reddit's CSS that hides custom elements
const isReddit = window.location.hostname.includes('reddit.com');
if (isReddit) {
  // Create a style element to override Reddit's CSS
  const redditFixStyle = document.createElement('style');
  redditFixStyle.textContent = `
    /* Override Reddit's CSS that hides undefined custom elements */
    plasmo-csui, 
    [data-plasmo-popup],
    .grecaptcha-badge, 
    :not(:defined):not(faceplate-auto-height-animator,faceplate-dropdown-menu,faceplate-expandable-section-helper,faceplate-hovercard,faceplate-tracker) {
      visibility: visible !important;
    }
  `;
  document.head.appendChild(redditFixStyle);
  
  // Add a MutationObserver to ensure our elements remain visible
  // even if Reddit's DOM changes
  const observer = new MutationObserver((mutations) => {
    const plasmoElements = document.querySelectorAll('plasmo-csui, [data-plasmo-popup]');
    plasmoElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.visibility = 'visible';
      }
    });
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Add a specific fix for YouTube's CSS that affects font sizing in the extension
const isYouTube = window.location.hostname.includes('youtube.com');
if (isYouTube) {
  console.log('LightUp: YouTube detected, applying font compensation fixes');
  // Add a data attribute to the HTML tag for more specific CSS targeting
  document.documentElement.setAttribute('data-youtube-domain', 'true');
  
  // Create a style element to override YouTube's CSS
  const youtubeFixStyle = document.createElement('style');
  youtubeFixStyle.id = 'lightup-youtube-font-fix';
  youtubeFixStyle.textContent = `
         /* YouTube font size compensation - force absolute pixel values with max specificity */
     html[data-youtube-domain] [data-plasmo-popup],
     body [data-plasmo-popup] {
       font-size: 16px !important; /* Use absolute pixels instead of rem */
       font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
       line-height: 1.5 !important;
       /* Create a new font-size context to isolate from YouTube's CSS */
       zoom: 1 !important;
       transform: scale(1) !important;
       /* Set CSS custom properties for consistent sizing */
       --lightup-base-font: 16px;
       --lightup-large-font: 13px;
       --lightup-button-font: 11px;
     }
    
         /* Force all elements within the popup to use pixel-based sizing */
     html[data-youtube-domain] [data-plasmo-popup] *,
     body [data-plasmo-popup] * {
       font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
       line-height: 1.5 !important;
     }
     
     /* Specific font size fixes for different components with high specificity */
     html[data-youtube-domain] [data-plasmo-popup] button,
     body [data-plasmo-popup] button {
       font-size: var(--lightup-button-font, 14px) !important;
     }
     
     /* Mode selector buttons need larger font for YouTube */
     html[data-youtube-domain] [data-plasmo-popup] motion\\.button,
     html[data-youtube-domain] [data-plasmo-popup] [style*="fontSize"],
     body [data-plasmo-popup] motion\\.button {
       font-size: var(--lightup-button-font, 16px) !important;
     }
     
     /* Main content area compensation with high specificity */
     html[data-youtube-domain] [data-plasmo-popup] [data-markdown-container],
     html[data-youtube-domain] [data-plasmo-popup] .lu-explanation,
     html[data-youtube-domain] [data-plasmo-popup] .lu-text,
     html[data-youtube-domain] [data-plasmo-popup] [data-markdown-text],
     body [data-plasmo-popup] [data-markdown-container],
     body [data-plasmo-popup] .lu-explanation,
     body [data-plasmo-popup] .lu-text,
           body [data-plasmo-popup] [data-markdown-text],
      body [data-plasmo-popup] .markdown-content {
        font-size: var(--lightup-large-font, 13px) !important;
      }
    
         /* Input and textarea elements with high specificity */
     html[data-youtube-domain] [data-plasmo-popup] input,
     html[data-youtube-domain] [data-plasmo-popup] textarea,
     body [data-plasmo-popup] input,
     body [data-plasmo-popup] textarea {
       font-size: var(--lightup-base-font, 16px) !important;
     }
     
     /* Loading and small text elements with high specificity */
     html[data-youtube-domain] [data-plasmo-popup] .lu-loading,
     html[data-youtube-domain] [data-plasmo-popup] .lu-model-display,
     body [data-plasmo-popup] .lu-loading,
     body [data-plasmo-popup] .lu-model-display {
       font-size: 13px !important;
     }
    
         /* Code blocks with high specificity */
     html[data-youtube-domain] [data-plasmo-popup] code,
     html[data-youtube-domain] [data-plasmo-popup] pre,
     body [data-plasmo-popup] code,
     body [data-plasmo-popup] pre {
       font-size: 14px !important; /* Slightly smaller than base */
     }
     
     /* Headers and titles with high specificity */
     html[data-youtube-domain] [data-plasmo-popup] h1,
     body [data-plasmo-popup] h1 { font-size: 28px !important; }
     html[data-youtube-domain] [data-plasmo-popup] h2,
     body [data-plasmo-popup] h2 { font-size: 24px !important; }
     html[data-youtube-domain] [data-plasmo-popup] h3,
     body [data-plasmo-popup] h3 { font-size: 20px !important; }
     html[data-youtube-domain] [data-plasmo-popup] h4,
     body [data-plasmo-popup] h4 { font-size: 18px !important; }
     html[data-youtube-domain] [data-plasmo-popup] h5,
     body [data-plasmo-popup] h5 { font-size: 16px !important; }
     html[data-youtube-domain] [data-plasmo-popup] h6,
     body [data-plasmo-popup] h6 { font-size: 14px !important; }
    
         /* Override any inline styles that might interfere with high specificity */
     html[data-youtube-domain] [data-plasmo-popup] [style*="font-size"],
     body [data-plasmo-popup] [style*="font-size"] {
       font-size: inherit !important;
     }
     
     /* Mode selector specific compensation with high specificity */
     html[data-youtube-domain] [data-plasmo-popup] [style*="fontSize: \"0.7rem\""],
     html[data-youtube-domain] [data-plasmo-popup] [style*="fontSize: \"0.8rem\""],
     html[data-youtube-domain] [data-plasmo-popup] button[style*="fontSize"],
     body [data-plasmo-popup] [style*="fontSize: \"0.7rem\""],
     body [data-plasmo-popup] [style*="fontSize: \"0.8rem\""],
     body [data-plasmo-popup] button[style*="fontSize"] {
       font-size: var(--lightup-button-font, 16px) !important;
     }
     
     /* Welcome message compensation with high specificity */
     html[data-youtube-domain] [data-plasmo-popup] [style*="fontSize: \"1.8rem\""],
     body [data-plasmo-popup] [style*="fontSize: \"1.8rem\""] {
       font-size: 32px !important; /* Emoji size */
     }
     
     html[data-youtube-domain] [data-plasmo-popup] [style*="fontSize: \"1.2rem\""],
     body [data-plasmo-popup] [style*="fontSize: \"1.2rem\""] {
       font-size: 22px !important; /* Heading size */
     }
  `;
  document.head.appendChild(youtubeFixStyle);
  
  // Add a MutationObserver to ensure our font sizing remains correct
  // even if YouTube's DOM changes
  const observer = new MutationObserver(() => {
    const popupElement = document.querySelector('[data-plasmo-popup]');
    if (popupElement instanceof HTMLElement) {
      // Force re-apply YouTube font fixes if needed
      popupElement.style.fontSize = '16px';
      popupElement.style.fontFamily = "'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      
      // Ensure mode selector buttons have correct size
      const modeButtons = popupElement.querySelectorAll('button');
      modeButtons.forEach(button => {
        if (button instanceof HTMLElement) {
          // Check if this is a mode selector button based on content or context
          const isSmallButton = button.textContent && 
            ['summarize', 'analyze', 'explain', 'translate', 'free'].includes(button.textContent.toLowerCase());
          
          if (isSmallButton) {
            button.style.fontSize = '16px';
          } else {
            button.style.fontSize = '14px';
          }
        }
      });
      
             // Fix main content areas
       const contentAreas = popupElement.querySelectorAll(`
         [data-markdown-container], 
         .lu-explanation, 
         .lu-text,
         [data-markdown-text],
         .markdown-content,
         div[style*="textAlign"],
         p[style*="fontSize"]
       `);
       contentAreas.forEach(area => {
         if (area instanceof HTMLElement) {
           area.style.fontSize = '24px';
         }
       });
       
       // Fix input and textarea elements
       const inputElements = popupElement.querySelectorAll('input, textarea');
       inputElements.forEach(input => {
         if (input instanceof HTMLElement) {
           input.style.fontSize = '16px';
         }
       });
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
}

const loadingIndicatorContainerStyle: MotionStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: '8px',
  gap: '8px'
};

// Define a type for our flex container style
type FlexContainerStyle = {
  display: 'flex'
  flexDirection: 'row'
  justifyContent: 'flex-start' | 'flex-end'
  width: string
}

// Create properly typed style objects
const questionBubbleStyle: MotionStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'flex-end' as const,
  width: '100%'
};

const answerBubbleStyle: MotionStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'flex-start' as const,
  width: '100%',
  lineHeight: '13px'
};

// NEW – springy slide-in variants for the Q&A bubbles
const questionBubbleVariants = {
  initial: { x: 60, opacity: 0, scale: 0.95 },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 250, damping: 20 }
  },
  exit: { x: 60, opacity: 0, scale: 0.95 }
};

const answerBubbleVariants = {
  initial: { x: -60, opacity: 0, scale: 0.95 },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 250, damping: 22, delay: 0.15 }
  },
  exit: { x: -60, opacity: 0, scale: 0.95 }
};

// Add this near the top of the file, after imports
interface FollowUpInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement>;
  followUpQuestion: string;
  handleFollowUpQuestion: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleAskFollowUpWrapper: () => void;
  isAskingFollowUp: boolean;
  setIsInputFocused: (focused: boolean) => void;
  themedStyles: any; // Use the actual type if available
  currentTheme: "light" | "dark";
  fontSizes: FontSizes; // Now properly typed
}

const FollowUpInput = React.memo(({ 
  inputRef, 
  followUpQuestion, 
  handleFollowUpQuestion, 
  handleAskFollowUpWrapper, 
  isAskingFollowUp, 
  setIsInputFocused,
  themedStyles,
  currentTheme,
  fontSizes
}: FollowUpInputProps) => {
  // Optimized constants
  const INITIAL_HEIGHT = parseFloat(fontSizes.base) * 16 * 1.5; // Convert rem to px and add line height
  const MAX_HEIGHT = INITIAL_HEIGHT * 2;
  
  // Memoized styles to prevent recalculation
  const textareaStyle = useMemo(() => ({
    ...themedStyles.input,
    opacity: isAskingFollowUp ? 0.7 : 1,
    resize: 'none' as const,
    height: `21.2px`,
    lineHeight: "20px",
    padding: '1px 8px',
    display: 'block' as const,
    transition: 'opacity 0.2s ease, height 0.1s ease',
    fontSize: '1rem',
    textAlign: 'left' as const,
  }), [themedStyles.input, isAskingFollowUp, INITIAL_HEIGHT, fontSizes]);

  const containerStyle = useMemo(() => ({
    ...themedStyles.followUpInputContainer,
    marginTop: '8px',
    marginBottom: '16px',
    paddingTop: '8px',
  }), [themedStyles.followUpInputContainer]);

  // Optimized auto-resize with debouncing and minimal DOM manipulation
  const autoResizeTextarea = useCallback(
    debounce(() => {
      const textarea = inputRef.current;
      if (!textarea) return;
      
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        // Only manipulate DOM if content actually changed
        const currentHeight = parseInt(textarea.style.height) || INITIAL_HEIGHT;
        
        // Reset height to measure content
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.max(INITIAL_HEIGHT, Math.min(scrollHeight, MAX_HEIGHT));
        
        // Only update if height actually changed
        if (currentHeight !== newHeight) {
          textarea.style.height = `${newHeight}px`;
          
          // Update overflow only when necessary
          const shouldShowScroll = scrollHeight > MAX_HEIGHT;
          const currentOverflow = textarea.style.overflowY;
          const newOverflow = shouldShowScroll ? 'auto' : 'hidden';
          
          if (currentOverflow !== newOverflow) {
            textarea.style.overflowY = newOverflow;
          }
        } else {
          // Restore height if no change needed
          textarea.style.height = `${currentHeight}px`;
        }
      });
    }, 16), // ~60fps
    [INITIAL_HEIGHT, MAX_HEIGHT]
  );

  // Optimized change handler
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleFollowUpQuestion(e);
    autoResizeTextarea();
  }, [handleFollowUpQuestion, autoResizeTextarea]);

  // Optimized key handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey && !isAskingFollowUp) {
      e.preventDefault();
      if (followUpQuestion.trim()) {
        handleAskFollowUpWrapper();
      }
    }
  }, [followUpQuestion, handleAskFollowUpWrapper, isAskingFollowUp]);

  // Optimized focus handlers
  const handleFocus = useCallback(() => setIsInputFocused(true), [setIsInputFocused]);
  const handleBlur = useCallback(() => setIsInputFocused(false), [setIsInputFocused]);

  // Initial resize on mount and theme change only
  useEffect(() => {
    autoResizeTextarea();
  }, [currentTheme, autoResizeTextarea]);

  // Memoized button content
  const buttonContent = useMemo(() => {
    if (isAskingFollowUp) {
      return (
        <motion.svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      );
    }
    
    return (
      <motion.svg 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none"
        initial={{ scale: 1 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
      >
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </motion.svg>
    );
  }, [isAskingFollowUp]);

  return (
    <div style={containerStyle}>
      <div style={themedStyles.searchContainer} className="lu-search-container">
        <textarea
          ref={inputRef}
          value={followUpQuestion}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          style={textareaStyle}
          disabled={isAskingFollowUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={1}
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          inputMode="text"
          className="lu-optimized-textarea lu-centered-placeholder"
        />
        <motion.button
          onClick={handleAskFollowUpWrapper}
          disabled={!followUpQuestion.trim() || isAskingFollowUp}
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          animate={isAskingFollowUp ? { scale: 0.9, opacity: 0.7 } : { scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          style={themedStyles.searchSendButton}
          className="lu-search-send-button"
          title={!followUpQuestion.trim() ? "Type a question first" : isAskingFollowUp ? "Sending..." : "Send message"}
        >
          {buttonContent}
        </motion.button>
      </div>
    </div>
  );
}, (prevProps: FollowUpInputProps, nextProps: FollowUpInputProps) => {
  // Optimized comparison function
  return (
    prevProps.followUpQuestion === nextProps.followUpQuestion &&
    prevProps.isAskingFollowUp === nextProps.isAskingFollowUp &&
    prevProps.currentTheme === nextProps.currentTheme
  );
});

// Add display name for debugging
FollowUpInput.displayName = 'FollowUpInput';

// Define icons for Show/Hide Search
const ShowSearchIcon = ({ theme, size = "18" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={theme === "dark" ? "#fff" : "#000"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Magnifying glass */}  
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const HideSearchIcon = ({ theme, size = "18" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={theme === "dark" ? "#fff" : "#000"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Slashed Magnifying glass */}  
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
    <line x1="4" y1="4" x2="18" y2="18"></line> {/* Adjusted slash */}
  </svg>
);

function Content() {
  // Generate a stable connection ID
  const [connectionId] = useState(() => uuidv4());
  const [highlightedRanges, setHighlightedRanges] = useState<Range[]>([]);
  
  // Add ref for the input element
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // State for search visibility - default to visible
  const [isSearchVisible, setIsSearchVisible] = useState(true);

  // Use our custom hooks
  const { settings, setSettings, isConfigured, currentTheme, targetLanguage, fontSize } = useSettings();
  const { activeMode, preferredModes, translationSettings } = useMode();
  
  // Create font size mapping based on user setting
  const fontSizes = useMemo(() => createFontSizeMapping(fontSize), [fontSize]);
  
  // Text selection bubble state from our new hook
  const {
    selectedText: selectionBubbleText,
    position: selectionBubblePosition,
    isVisible: isSelectionBubbleVisible,
    setIsVisible: setIsSelectionBubbleVisible
  } = useTextSelection();

  // Initialize all our hooks
  const { width, height, handleResizeStart } = useResizable({
    initialWidth: 350,
    initialHeight: 460
  });

  const { toast, showToast } = useToast();
  const { isEnabled, handleEnabledChange } = useEnabled(showToast);
  const { voicesLoaded, speakingId, handleSpeak } = useSpeech();
  const { copiedId, imageCopiedId, handleCopy, handleCopyAsImage, isImageCopySupported } = useCopy();
  const { lastResult, updateLastResult } = useLastResult();
  const currentModel = useCurrentModel();
  
  // Add a ref for the popup element
  const popupRef = useRef<HTMLDivElement>(null);
  // Ref to capture main AI response content for image copying
  const responseContentRef = useRef<HTMLDivElement>(null);

  // Smooth scroll function
  const scrollToBottom = useCallback(() => {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      if (popupRef.current) {
        const scrollContainer = popupRef.current.querySelector('.lu-scroll-container') as HTMLElement;
        if (scrollContainer) {
          // Check if already at bottom to avoid unnecessary scrolling
          const isAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 10; // Increased threshold
          
          if (!isAtBottom) {
            // Use scrollTo with smooth behavior for a better user experience
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'smooth'
            });
          }
        }
      }
    });
  }, []);

  const {
    conversationContext,
    updateConversation,
    clearConversation
  } = useConversation();
  
  // Add effect to listen for force-hide events (for real-time extension disabling)
  useEffect(() => {
    const handleForceHide = () => {
      // Immediately hide all UI elements when extension is toggled off
      if (setIsVisible) setIsVisible(false);
      if (setIsInteractingWithPopup) setIsInteractingWithPopup(false);
      if (setIsInputFocused) setIsInputFocused(false);
      
      // Reset any other UI states as needed
      if (setIsLoading) setIsLoading(false);
      if (setError) setError(null);
      if (setStreamingText) setStreamingText('');
      if (setFollowUpQAs) setFollowUpQAs([]);
      
      console.log('LightUp UI forcibly hidden due to extension disable');
    };
    
    // Listen for the custom force-hide event
    document.addEventListener('lightup-force-hide', handleForceHide);
    
    return () => {
      document.removeEventListener('lightup-force-hide', handleForceHide);
    };
  }, []);

  const handleRegenerate = async () => {
    if (!selectedText || isLoading) return;
    
    setIsLoading(true);
    setStreamingText('');
    setError(null);

    try {
      let regenPayloadText = selectedText
      let regenTrimmedContext = ""
      if (settings?.customization?.contextAwareness) {
        const regenPageContent = getPageContent(mode)
        regenTrimmedContext = truncateText(regenPageContent, 5000)
        regenPayloadText = `${selectedText}\n\n----\nContext:\n${regenTrimmedContext}`
      }

      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: regenPayloadText,
          context: regenTrimmedContext,
          pageContext: regenTrimmedContext,
          mode: mode,
          settings: settings,
          isFollowUp: false,
          id: Date.now(),
          connectionId
        }
      });
    } catch (err) {
      setError("Failed to regenerate response. Please try again.");
      setIsLoading(false);
    }
  };
  

  // Handler for processing text selected via the selection bubble
  const handleSelectionBubbleProcess = async (text: string, selectedMode: string) => {
    // Import the cleaning function
    const { cleanTextForMode } = await import("~utils/textProcessing");
    
    // Apply text cleaning based on the selected mode
    const cleanedText = cleanTextForMode(text, selectedMode);
    if (!cleanedText) {
      setError?.('Selected text appears to contain only technical content and cannot be processed.');
      return;
    }
    
    // Clear previous results
    setStreamingText?.("");
    setFollowUpQAs?.([]);
    setError?.(null);
    
    // Set position for the floating popup based on the TextSelectionButton position
    // Use the selectionBubblePosition to position the popup near the button
    if (settings?.customization?.layoutMode === "floating") {
      // Use viewport-aware positioning with actual popup dimensions
      calculateViewportAwarePosition?.(
        selectionBubblePosition.x + 20, 
        selectionBubblePosition.y + 40,
        { width, height }
      );
    }
    
    // Hide the selection bubble
    setIsSelectionBubbleVisible(false);
    
    // Show the main popup
    setSelectedText(cleanedText);
    setIsVisible(true);
    setIsLoading(true);
    
    // Set the mode to the one selected in the bubble
    handleModeChange(selectedMode as Mode);
    
    // Process the text
    try {
      if (!port) {
        throw new Error('Connection not established');
      }

      let payloadText = cleanedText
      let trimmedContext = ""
      if (settings?.customization?.contextAwareness) {
        const pageContent = getPageContent(selectedMode)
        trimmedContext = truncateText(pageContent, 5000)
        payloadText = `${cleanedText}\n\n----\nContext:\n${trimmedContext}`
      }

      const storage = new Storage();
      const translationSettings = await storage.get("translationSettings");

      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: payloadText,
          context: trimmedContext,
          mode: selectedMode,
          settings: {
            ...settings,
            translationSettings
          },
          connectionId,
          id: Date.now()
        }
      });
    } catch (err) {
      setError?.('Failed to process text');
      setIsLoading?.(false);
    }
  };

  const handleRegenerateFollowUp = async (question: string, id: number) => {
    if (isAskingFollowUp) return;
    
    setIsAskingFollowUp(true);
    setActiveAnswerId(id);
    
    // Clear the previous answer
    setFollowUpQAs(prev => prev.map(qa =>
      qa.id === id ? { ...qa, answer: '', isComplete: false } : qa
    ));

    try {
      // Make sure we have the latest settings with custom prompts
      const storage = new Storage();
      const latestSettings = await storage.get("settings");
      
      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: question,
          context: selectedText,
          pageContext: "",
          mode: mode,
          settings: latestSettings || settings, // Use freshly loaded settings
          isFollowUp: true,
          id: id,
          connectionId
        }
      });
    } catch (err) {
      setFollowUpQAs(prev => prev.map(qa =>
        qa.id === id ? { ...qa, isComplete: true } : qa
      ));
      setActiveAnswerId(null);
      setIsAskingFollowUp(false);
      setError('Failed to regenerate follow-up response');
    }
  };

 
  // Remove context refresh effect and add simple mount effect
  useEffect(() => {
    
  }, [isEnabled]);

  // Initialize followUpQAs state first
  const {
    followUpQAs,
    followUpQuestion,
    isAskingFollowUp,
    activeAnswerId,
    handleFollowUpQuestion,
    setFollowUpQAs,
    setFollowUpQuestion,
    setActiveAnswerId,
    setIsAskingFollowUp
  } = useFollowUp();

  const {
    port,
    streamingText,
    isLoading,
    error,
    connectionStatus,
    setStreamingText,
    setIsLoading,
    setError,
    reconnect
  } = usePort(
    connectionId,
    (id, content) => {
      setFollowUpQAs(prev => prev.map(qa =>
        qa.id === id ? { ...qa, answer: qa.answer + content } : qa
      ));
    },
    (id) => {
      setFollowUpQAs(prev => prev.map(qa =>
        qa.id === id ? { ...qa, isComplete: true } : qa
      ));
      setActiveAnswerId(null);
      setIsAskingFollowUp(false);
      
      // The new intelligent scroll logic is now handled inside the FollowUpQAItem component
      // via a useEffect hook that triggers on `isComplete`.

      // Add auto-focus to the textarea field after response is complete
      setTimeout(() => {
        // Try to focus using the ref first
        if (inputRef.current) {
          inputRef.current.focus();
        } else {
          // Fallback to querySelector if ref is not available
          const textareaElement = document.querySelector('[data-plasmo-popup] textarea');
          if (textareaElement instanceof HTMLTextAreaElement) {
            textareaElement.focus();
          }
        }
      }, 100);
    }
  );

  // Track request id to reset progress animation
  const [requestId, setRequestId] = useState(0);

  // Increment when a new loading cycle starts
  useEffect(() => {
    if (isLoading && streamingText === "") {
      setRequestId((prev) => prev + 1);
    }
  }, [isLoading, streamingText]);

  // -------- Progress for AI streaming --------
   const currentWordCount = useMemo(() => {
     if (!streamingText) return 0;
     return streamingText.trim().split(/\s+/).filter(Boolean).length;
   }, [streamingText]);
 
  // ----- Time-based fallback progress so the bar moves right away -----
  const [fallbackProgress, setFallbackProgress] = useState(0);
  const [hasFallbackStarted, setHasFallbackStarted] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (isLoading) {
      // New request → reset to 0
      setFallbackProgress(0);
      setHasFallbackStarted(false);

      timer = setInterval(() => {
        setFallbackProgress(prev => {
          const next = Math.min(prev + 0.01, 0.85); // advance ~1 % every 120 ms
          if (!hasFallbackStarted) setHasFallbackStarted(true);
          if (next >= 0.85 && timer) clearInterval(timer); // stop at 85 %
          return next;
        });
      }, 120);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (!isLoading) {
        setHasFallbackStarted(false);
      }
    };
  }, [isLoading, requestId]);

  // Jump to 100 % as soon as any text has streamed or when loading finishes
  const progress = (!isLoading || streamingText !== "")
    ? 1
    : hasFallbackStarted
      ? fallbackProgress
      : 0;
 
  const {
    isVisible,
    position,
    selectedText,
    isBlurActive,
    isInteractingWithPopup,
    isInputFocused,
    mode,
    handleClose,
    handleModeChange,
    setIsVisible,
    setPosition,
    setIsInteractingWithPopup,
    setIsInputFocused,
    setSelectedText,
    calculateViewportAwarePosition
  } = usePopup(
    port, 
    connectionId, 
    settings?.customization?.radicallyFocus,
    isEnabled,
    settings,
    setIsLoading,
    setError,
    setStreamingText,
    setFollowUpQAs
  );

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    isEnabled,
    handleEnabledChange,
    handleModeChange,
    settings,
    setSettings,
    showToast
  });

  // Auto-adjust floating popup position when dimensions change
  useEffect(() => {
    if (isVisible && settings?.customization?.layoutMode === "floating") {
      // Delay the adjustment to ensure the popup has been rendered with new dimensions
      const adjustmentTimer = setTimeout(() => {
        // Check if the current popup rectangle still fits in the viewport. If it
        // does, skip repositioning to avoid jitter when focusing / clicking.
        const margin = settings?.customization?.popupMargin || 8;
        const requiresReposition = needsRepositioning(
          { left: position.x, top: position.y },
          { width, height },
          margin
        );

        if (!requiresReposition) return;

        // Convert absolute co-ordinates back to viewport-relative before calling
        // the viewport-aware helper (it expects clientX / clientY values).
        const clientX = position.x - window.scrollX;
        const clientY = position.y - window.scrollY;

        calculateViewportAwarePosition?.(clientX, clientY, { width, height });
      }, 50);
      
      return () => clearTimeout(adjustmentTimer);
    }
  }, [width, height, isVisible, settings?.customization?.layoutMode, position.x, position.y, calculateViewportAwarePosition]);

  // Optimized scroll effect with reduced frequency
  useEffect(() => {
    // This effect handles scrolling to the bottom when a new question is initiated.
    // The scroll-on-answer-complete is now handled in the FollowUpQAItem component.
    const debouncedScroll = debounce(scrollToBottom, 50);
    debouncedScroll();
  }, [followUpQAs.length]); // Only depend on length changes

  // Wrap handleAskFollowUp to include necessary context
  const handleAskFollowUpWrapper = () => {
    if (!followUpQuestion.trim() || isAskingFollowUp) return;

    setIsAskingFollowUp(true);
    const newId = Date.now();
    
    setActiveAnswerId(newId);
    
    setFollowUpQAs(prev => [
      ...prev,
      { 
        question: followUpQuestion, 
        answer: '', 
        id: newId,
        isComplete: false,
        historyUpdated: false
      }
    ]);

    // Update conversation context with the new question
    updateConversation(followUpQuestion);

    try {
      // Check if we need to reconnect
      if (!port || connectionStatus !== 'connected') {
        reconnect();
      }

      const message = {
        type: "PROCESS_TEXT",
        payload: {
          text: followUpQuestion,
          context: mode === "free" ? "" : selectedText,
          conversationContext, // Add conversation context
          mode: mode,
          settings: settings,
          isFollowUp: true,
          id: newId,
          connectionId
        }
      };

      // Use a small delay to ensure reconnection completes if needed
      setTimeout(() => {
        try {
          if (!port) {
            throw new Error("No connection available");
          }
          
          port.postMessage(message);
          
          setFollowUpQuestion("");
          
          // Keep focus on the input field after submitting
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
        } catch (postError) {
          console.error("Error posting message:", postError);
          
          // Try one more time with a fresh connection
          reconnect();
          
          setTimeout(() => {
            if (port) {
              try {
                port.postMessage(message);
                
                setFollowUpQuestion("");
                
                // Keep focus on the input field after submitting
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              } catch (retryError) {
                console.error("Failed after reconnection:", retryError);
                throw new Error("Failed to send message after reconnection");
              }
            } else {
              throw new Error("Failed to reconnect");
            }
          }, 500); // Wait a bit longer for reconnection
        }
      }, 100);
    } catch (error) {
      console.error("Follow-up error:", error);
      setFollowUpQAs(prev => prev.filter(qa => qa.id !== newId));
      setActiveAnswerId(null);
      setIsAskingFollowUp(false);
      setError('Failed to process question. Please try again.');
    }
  };

  // Get themed styles - memoized for better performance
  const textDirection = getTextDirection(targetLanguage);
  const normalizedTheme: "light" | "dark" = currentTheme === "system" ? "light" : currentTheme;
  const themedStyles = useMemo(() => 
    getStyles(normalizedTheme, textDirection, fontSizes),
    [normalizedTheme, textDirection, fontSizes]
  );

  // Update last result when streaming completes
  useMemo(() => {
    if (streamingText && !isLoading) {
      updateLastResult(selectedText, streamingText, true);
    }
  }, [streamingText, isLoading, selectedText]);

  // Update the highlight color effect
  useEffect(() => {
    // Apply highlight color when settings or enabled state changes
    const cleanup = applyHighlightColor(settings?.customization?.highlightColor, isEnabled);

    // Watch for settings changes
    const storage = new Storage();
    const handleSettingsChange = async () => {
      const newSettings = await storage.get("settings") as typeof settings;
      if (newSettings?.customization?.highlightColor !== settings?.customization?.highlightColor) {
        cleanup();
        applyHighlightColor(newSettings?.customization?.highlightColor, isEnabled);
      }
    };

    storage.watch({
      settings: handleSettingsChange
    });

    return () => {
      cleanup();
      storage.unwatch({
        settings: handleSettingsChange
      });
    };
  }, [isEnabled, settings?.customization?.highlightColor]);

  // Add this effect after the other useEffects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popup = document.querySelector('[data-plasmo-popup]');
      // Only close if clicking outside the popup
      if (popup && !popup.contains(event.target as Node)) {
        setIsVisible(false);
        setIsInteractingWithPopup(false);
        setIsInputFocused(false);
        setSelectedText("");
        setStreamingText?.("");
        setFollowUpQAs?.([]);
        setError?.(null);
        setIsLoading?.(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setIsVisible, setIsInteractingWithPopup, setIsInputFocused, setSelectedText, setStreamingText, setFollowUpQAs, setError, setIsLoading]);

  // Add function to apply highlight to a range
  const applyHighlightToRange = (range: Range, color: string) => {
    const span = document.createElement('span');
    span.className = 'lightup-highlight';
    span.style.backgroundColor = color;
    range.surroundContents(span);
    return span;
  };

  // Add function to remove highlights
  const removeHighlights = () => {
    const highlights = document.querySelectorAll('.lightup-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        parent.normalize();
      }
    });
    setHighlightedRanges([]);
  };

  // Modify handleSelection to be a no-op
  const handleSelection = async (event: MouseEvent) => {
    // This function is no longer used - we rely on the usePopup hook's implementation
    return;
  };

  // Add cleanup effect for highlights when settings change
  useEffect(() => {
    if (!settings?.customization?.persistHighlight) {
      removeHighlights();
    }
  }, [settings?.customization?.persistHighlight]);

  // Add cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      removeHighlights();
    };
  }, []);

  // Add event listener for highlight events from usePopup
  useEffect(() => {
    const handleHighlightEvent = (event: CustomEvent) => {
      if (!settings?.customization?.persistHighlight) return;
      
      try {
        const { selection, color } = event.detail;
        if (!selection) return;
        
        // Apply highlight to each range in the selection
        const ranges = [];
        for (let i = 0; i < selection.rangeCount; i++) {
          const range = selection.getRangeAt(i);
          const span = applyHighlightToRange(range, color);
          ranges.push({ range, span });
        }
        
        // Store the highlighted ranges
        setHighlightedRanges([...highlightedRanges, ...ranges]);
      } catch (e) {
        console.error("Failed to apply highlight:", e);
      }
    };
    
    window.addEventListener('applyHighlight', handleHighlightEvent as EventListener);
    return () => window.removeEventListener('applyHighlight', handleHighlightEvent as EventListener);
  }, [settings?.customization?.persistHighlight, highlightedRanges]);

  // Update conversation when receiving response
  useEffect(() => {
    if (streamingText && !isLoading) {
      updateConversation(selectedText, streamingText);
    }
  }, [streamingText, isLoading, selectedText, updateConversation]);

  // Add an effect to update conversation history from follow-ups
  useEffect(() => {
    followUpQAs.forEach((qa) => {
      if (qa.isComplete && !qa.historyUpdated) {
        // Find the user message that corresponds to this answer
        const historyContext = conversationContext.history.find(
          (h) => h.content === qa.question && h.role === 'user'
        );
        
        // Update conversation with the full Q&A
        if (historyContext) {
          updateConversation(qa.question, qa.answer);
        }

        // Mark as updated
        setFollowUpQAs(prev => prev.map(item => 
          item.id === qa.id ? { ...item, historyUpdated: true } : item
        ));
      }
    });
  }, [followUpQAs, updateConversation, conversationContext.history, setFollowUpQAs]);

  // Clear conversation when closing popup
  useEffect(() => {
    if (!isVisible) {
      clearConversation();
    }
  }, [isVisible, clearConversation]);

  // Add a function to handle reconnection
  const handleReconnect = () => {
    setError(null);
    reconnect();
    
    // If we were in the middle of processing text, retry
    if (selectedText && mode) {
      setIsLoading(true);
      setTimeout(async () => {
        try {
          if (port) {
            // Make sure we have the latest settings with custom prompts
            const storage = new Storage();
            const latestSettings = await storage.get("settings");
            
            port.postMessage({
              type: "PROCESS_TEXT",
              payload: {
                text: selectedText,
                context: "",
                pageContext: "",
                mode: mode,
                settings: latestSettings || settings, // Use freshly loaded settings
                isFollowUp: false,
                id: Date.now(),
                connectionId
              }
            });
          }
        } catch (err) {
          setError("Failed to reconnect. Please try again.");
          setIsLoading(false);
        }
      }, 500); // Small delay to ensure port is reconnected
    }
  };

  // Add a connection status indicator component
  const ConnectionStatus = () => {
    if (connectionStatus === 'connected') return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 50
        }}
      >
        <div style={{
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: fontSizes.connection,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: connectionStatus === 'connecting' 
            ? (currentTheme === 'dark' ? '#4A4A00' : '#FEF3C7')
            : (currentTheme === 'dark' ? '#4A0000' : '#FEE2E2'),
          color: connectionStatus === 'connecting' 
            ? (currentTheme === 'dark' ? '#FBBF24' : '#92400E')
            : (currentTheme === 'dark' ? '#F87171' : '#991B1B')
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: connectionStatus === 'connecting' 
              ? '#FBBF24' 
              : '#F87171',
            animation: connectionStatus === 'connecting' ? 'pulse 2s infinite' : 'none'
          }}></span>
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          {connectionStatus === 'disconnected' && (
            <button 
              onClick={handleReconnect}
              style={{
                marginLeft: '4px',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 'inherit'
              }}
            >
              Reconnect
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  // Function to process the entire page content
  const handleProcessEntirePage = async (pageContent: string) => {
    if (!isEnabled || !port) return;
    
    // Set loading state and reset previous results
    setIsLoading(true);
    setStreamingText("");
    setFollowUpQAs([]);
    setError(null);
    
    // Position the popup in a fixed position (center or side)
    const layoutMode = settings?.customization?.layoutMode || "popup";
    let popupPosition = { x: 0, y: 0 };
    
    if (layoutMode === "sidebar") {
      popupPosition = { x: window.innerWidth - 400, y: 0 };
    } else { // Center popup
      popupPosition = { 
        x: window.innerWidth / 2 - 300,  
        y: window.innerHeight / 4
      };
    }
    
    setSelectedText(pageContent);
    setPosition(popupPosition);
    setIsVisible(true);
    
    // Make sure we have the latest settings with custom prompts
    const storage = new Storage();
    const latestSettings = await storage.get("settings");
    
    // Process the content with the current mode
    try {
      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: pageContent,
          context: "",
          pageContext: "",
          mode: mode,
          settings: latestSettings || settings, // Use freshly loaded settings to ensure custom prompts are included
          isFollowUp: false,
          id: Date.now(),
          connectionId
        }
      });
    } catch (err) {
      setError("Failed to process page content. Please try again.");
      setIsLoading(false);
    }
  };

  // Render popup content
  const renderPopupContent = () => (
    <>
      <div style={{ position: 'relative' }}>
        <ConnectionStatus />
      </div>
      
      {/* Header */}
      <div style={themedStyles.buttonContainerParent} data-header>
        <motion.div style={{boxShadow: 'none !important' }} >
          {Logo(normalizedTheme)}
        </motion.div>
        <PopupModeSelector 
          activeMode={mode}
          onModeChange={handleModeChange}
          isLoading={isLoading}
          theme={normalizedTheme}
        />
        <div style={themedStyles.buttonContainer}>
          <motion.button 
            onClick={handleClose}
            style={{
              ...themedStyles.button,
              marginTop: '2px',
              marginRight: '10px'
            }}
            variants={iconButtonVariants}
            whileHover="hover"
            title="Close LightUp"
          >
            <CloseIcon theme={normalizedTheme} />
          </motion.button>
        </div>
      </div>

      {/* Website Info */}
      {settings?.customization?.showWebsiteInfo !== false && mode !== "free" && selectedText && (
        <WebsiteInfoComponent
          currentTheme={normalizedTheme}
          fontSizes={fontSizes}
          selectedText={streamingText || selectedText}
          loading={isLoading}
          progress={progress}
          requestId={requestId}
        />
      )}

      {/* Selected Text */}
      {settings?.customization?.showSelectedText !== false && mode !== "free" && (
        <p style={{...themedStyles.text, fontWeight: '500', fontStyle: 'italic', textDecoration: 'underline'}}>
          {truncateText(selectedText)}
        </p>
      )}

      {/* Welcome Message for Free Mode */}
      {mode === "free" && !streamingText && !error && followUpQAs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            ...themedStyles.explanation,
            textAlign: 'center',
            padding: '20px',
            marginBottom: '20px',
            background: currentTheme === "dark" ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: '12px',
            border: `1px solid ${currentTheme === "dark" ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <motion.div
            style={{
              fontSize: fontSizes.welcome.emoji,
              marginBottom: '10px',
              color: currentTheme === "dark" ? '#fff' : '#000'
            }}
          >
            👋
          </motion.div>
          <motion.h2
            style={{
              fontSize: fontSizes.welcome.heading,
              fontWeight: 600,
              marginBottom: '8px',
              color: currentTheme === "dark" ? '#fff' : '#000'
            }}
          >
            Welcome to LightUp
          </motion.h2>
          <motion.p
            style={{
              fontSize: fontSizes.welcome.description,
              color: currentTheme === "dark" ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              lineHeight: '1.5'
            }}
          >
            Ask me anything! I'm here to help with any questions you have.
          </motion.p>
        </motion.div>
      )}

      {/* Guidance Message for Other Modes */}
      {mode !== "free" && !selectedText && !streamingText && !error && followUpQAs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            ...themedStyles.explanation,
            textAlign: 'center',
            padding: '20px',
            marginBottom: '20px',
            background: currentTheme === "dark" ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: '12px',
            border: `1px solid ${currentTheme === "dark" ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <motion.div
            style={{
              fontSize: fontSizes.welcome.emoji,
              marginBottom: '10px',
              color: currentTheme === "dark" ? '#fff' : '#000'
            }}
          >
            {mode === "explain" ? "📝" : mode === "summarize" ? "📋" : mode === "analyze" ? "🔍" : "🌐"}
          </motion.div>
          <motion.h2
            style={{
              fontSize: fontSizes.welcome.heading,
              fontWeight: 600,
              marginBottom: '8px',
              color: currentTheme === "dark" ? '#fff' : '#000'
            }}
          >
            Select Text to {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </motion.h2>
          <motion.p
            style={{
              fontSize: fontSizes.welcome.description,
              color: currentTheme === "dark" ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              lineHeight: '1.5'
            }}
          >
            {mode === "explain" && "Select any text you'd like me to explain in detail."}
            {mode === "summarize" && "Select any text you'd like me to summarize for you."}
            {mode === "analyze" && "Select any text you'd like me to analyze in depth."}
            {mode === "translate" && "Select any text you'd like me to translate."}
          </motion.p>
        </motion.div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {isLoading && !streamingText ? (
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
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <motion.div
            variants={textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Explanation */}
            {(streamingText || mode !== "free") && (
              <motion.div
                style={{
                  ...themedStyles.explanation,
                  textAlign: textDirection === "rtl" ? "right" : "left",
                  paddingBottom:"12px"
                }}
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                data-main-response-content
              >
                <div style={{ marginBottom: '8px' }}>
                  {streamingText && (
                    <div style={{
                      ...themedStyles.explanation,
                      textAlign: themedStyles.explanation.textAlign as "left" | "right"
                    }} className="">
                      <motion.div 
                        initial={{ filter: "blur(8px)" }} 
                        animate={{ filter: "blur(0px)" }} 
                        transition={{ duration: 0.1, delay: 0.1 }}
                        data-lightup-response-content
                        ref={responseContentRef}
                      >
                        <MarkdownText 
                          text={streamingText} 
                          useReferences={(settings as any).enableReferences || false} 
                          theme={currentTheme === "system" ? "light" : currentTheme}
                          fontSize={settings?.customization?.fontSize}
                          fontSizes={fontSizes}
                        />
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {!isLoading && streamingText && (
                  <motion.div style={{ display: 'flex', gap: '8px', alignItems: 'center' } as const}>
                    {/* Copy text button */}
                    <motion.button
                      onClick={() => handleCopy(streamingText, 'initial')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        color: '#666'
                      }}
                      whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      title={copiedId === 'initial' ? "Copied!" : "Copy text to clipboard"}
                    >
                      {copiedId === 'initial' ? (
                        <svg width="13" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="13" height="15" viewBox="0 0 62 61" fill="none">
                          <path d="M12.6107 48.8146V57.9328C12.6107 59.8202 14.1912 60.9722 15.6501 60.9722H58.2018C59.6546 60.9722 61.2412 59.8202 61.2412 57.9328V15.3811C61.2412 13.9283 60.0893 12.3417 58.2018 12.3417H49.0836V3.22349C49.0836 1.77065 47.9317 0.184082 46.0442 0.184082H3.49253C1.6081 0.184082 0.453125 1.76153 0.453125 3.22349V45.7752C0.453125 47.6626 2.03362 48.8146 3.49253 48.8146H12.6107ZM44.5245 12.3417H15.6501C13.7657 12.3417 12.6107 13.9192 12.6107 15.3811V44.2554H5.01223V4.74319H44.5245V12.3417Z" fill="currentColor"/>
                        </svg>
                      )}
                    </motion.button>

                    {/* Copy as image button */}
                    {isImageCopySupported && (
                      <motion.button
                        onClick={() => {
                          if (responseContentRef.current) {
                            handleCopyAsImage(responseContentRef.current, 'initial-image');
                          } else {
                            handleCopyAsImage('[data-lightup-response-content]', 'initial-image');
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          color: '#666'
                        }}
                        whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        title={imageCopiedId === 'initial-image' ? "Copied as image!" : "Copy as image"}
                      >
                        {imageCopiedId === 'initial-image' ? (
                          <svg width="13" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                          </svg>
                        )}
                      </motion.button>
                    )}

                    {/* Speak button */}
                    <motion.button
                      onClick={() => handleSpeak(streamingText, 'main')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        color: speakingId === 'main' ? '#14742F' : '#666'
                      }}
                      whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}

                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      title={speakingId === 'main' ? "Stop speaking" : "Read text aloud"}
                    >
                      {speakingId === 'main' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                        </svg>
                      )}
                    </motion.button>

                    {/* Regenerate button */}
                    <motion.button
                      onClick={handleRegenerate}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        color: isLoading ? '#14742F' : '#666'
                      }}
                      whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}

                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      title={isLoading ? "Regenerating..." : "Regenerate response"}
                      disabled={isLoading}
                    >
                      <svg width="14" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                      </svg>
                    </motion.button>

                    {/* Model display */}
                    <motion.div
                      style={{
                        fontSize: "0.8rem",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        
                        minWidth: '80px',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ 
                        textTransform: 'capitalize',
                        fontWeight: 500,
                        color: currentTheme === 'dark' ? 'rgb(132, 132, 132)' : 'rgb(102, 102, 102)',
                        userSelect: 'none',
                        backgroundColor: currentTheme === 'dark' ? '#494949' : '#f0f0f0',
                        padding: '2px 10px',
                        borderRadius: '11px',
                      }}
                      title={currentModel ? `AI Model: ${currentModel}` : 'Loading AI model...'}
                      >
                        {currentModel || 'Loading...'}
                      </span>
                    </motion.div>
                    
                    {/* Search Toggle Button - Far Right */}
                    <motion.button 
                      onClick={() => {
                        // Toggle search visibility
                        setIsSearchVisible(!isSearchVisible);
                        
                        // If showing the search input, focus and scroll
                        if (!isSearchVisible) {
                          // First scroll to make sure the input is visible
                          setTimeout(() => {
                            if (popupRef.current) {
                              popupRef.current.scrollTo({
                                top: popupRef.current.scrollHeight,
                                behavior: 'smooth'
                              });
                            }
                            
                            // Then focus the input with slight delay to ensure it's rendered
                            setTimeout(() => {
                              if (inputRef.current) {
                                inputRef.current.focus();
                              }
                            }, 150);
                          }, 100);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        color: currentTheme === "dark" ? "#fff" : "#000", // Theme-dependent color
                        marginLeft: 'auto' // Push to far right
                      }}
                      whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      title={isSearchVisible ? "Hide Search Input" : "Show Search Input"}
                    >
                      {isSearchVisible ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          <line x1="4" y1="4" x2="18" y2="18"></line>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Follow-up QAs */}
            {followUpQAs.map((qa) => (
              <FollowUpQAItem
                key={qa.id}
                qa={qa}
                themedStyles={themedStyles}
                textDirection={textDirection}
                currentTheme={normalizedTheme}
                targetLanguage={targetLanguage}
                settings={settings}
                fontSizes={fontSizes}
                handleCopy={handleCopy}
                copiedId={copiedId}
                handleCopyAsImage={handleCopyAsImage}
                imageCopiedId={imageCopiedId}
                isImageCopySupported={isImageCopySupported}
                handleSpeak={handleSpeak}
                speakingId={speakingId}
                handleRegenerateFollowUp={handleRegenerateFollowUp}
                activeAnswerId={activeAnswerId}
                isAskingFollowUp={isAskingFollowUp}
                popupRef={popupRef}
                currentModel={currentModel}
              />
            ))}

            {/* Spacer to push the search input to the bottom */}
            <div style={{ flexGrow: 1 }}></div>

            {/* Input section - now at the bottom */}
            <AnimatePresence>
              {isSearchVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <FollowUpInput
                    inputRef={inputRef}
                    followUpQuestion={followUpQuestion}
                    handleFollowUpQuestion={handleFollowUpQuestion}
                    handleAskFollowUpWrapper={handleAskFollowUpWrapper}
                    isAskingFollowUp={isAskingFollowUp}
                    setIsInputFocused={setIsInputFocused}
                    themedStyles={themedStyles}
                    currentTheme={normalizedTheme}
                    fontSizes={fontSizes}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <>
      {/* Toast notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            variants={toastMotionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              backgroundColor: currentTheme === "dark" ? '#2C2C2C' : 'white',
              color: currentTheme === "dark" ? 'white' : 'black',
              padding: '8px 16px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: Z_INDEX.TOAST,
              fontSize: fontSizes.base,
              fontFamily: "'K2D', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isEnabled ? '#10B981' : '#EF4444',
                marginRight: '4px'
              }}
            />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main popup */}
      <AnimatePresence mode="sync">
        {isVisible && isEnabled && isConfigured && (
          settings?.customization?.layoutMode === "floating" ? (
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
          ) : settings?.customization?.layoutMode === "sidebar" ? (
            // Sidebar Mode - Optimized
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
                flexDirection: 'column'
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
          ) : (
            // Centered Mode - Optimized
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
                      : settings?.customization?.popupAnimation === "slide"
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
          )
        )}
      </AnimatePresence>

      {/* Blur overlay */}
      {isBlurActive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: currentTheme === 'dark' 
              ? 'rgba(0, 0, 0, 0.7)' 
              : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: Z_INDEX.BLUR_OVERLAY,
            transition: 'all 0.3s ease'
          }}
        />
      )}

      {/* Add GlobalActionButton if enabled */}
      {isEnabled && settings?.customization?.showGlobalActionButton !== false && (
        <GlobalActionButton 
          onProcess={handleProcessEntirePage}
          mode={mode}
          isPopupVisible={isVisible}
          currentTheme={currentTheme === "system" ? "dark" : currentTheme}
        />
      )}
      
      {/* Add the macOS Notes-style text selection button */}
      <AnimatePresence>
        {isSelectionBubbleVisible && settings?.customization?.showTextSelectionButton !== false && (
          <TextSelectionButton
            onProcess={handleSelectionBubbleProcess}
            position={selectionBubblePosition}
            selectedText={selectionBubbleText}
            currentTheme={currentTheme === "system" ? "dark" : currentTheme}
            isVisible={isSelectionBubbleVisible}
            setIsVisible={setIsSelectionBubbleVisible}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default Content;

// Dynamic Skeleton Lines Component
interface DynamicSkeletonLinesProps {
  currentTheme: "light" | "dark";
  containerRef: React.RefObject<HTMLDivElement>;
  fontSizes: FontSizes;
}

const DynamicSkeletonLines = React.memo(({ currentTheme, containerRef, fontSizes }: DynamicSkeletonLinesProps) => {
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

// Loading Thinking Text Component with alternating words
interface LoadingThinkingTextProps {
  currentTheme: 'light' | 'dark' | 'system';
  fontSizes: FontSizes;
  onCycleComplete?: () => void;
}

const LoadingThinkingText = React.memo(({ currentTheme, fontSizes, onCycleComplete }: LoadingThinkingTextProps) => {
  const [currentWord, setCurrentWord] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const words = ['Thinking', 'Generating'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord(prev => {
        const nextWord = (prev + 1) % words.length;
        
        // If we're going back to the first word, increment cycle count
        if (nextWord === 0) {
          setCycleCount(prevCount => {
            const newCount = prevCount + 1;
            // Complete cycle after first full rotation (Thinking -> Generating -> Thinking)
            if (newCount === 1 && onCycleComplete) {
              setTimeout(() => onCycleComplete(), 100); // Small delay to ensure smooth transition
            }
            return newCount;
          });
        }
        
        return nextWord;
      });
    }, 1500); // Switch every 1.5 seconds
    
    return () => clearInterval(interval);
  }, [onCycleComplete]);
  
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(4px)', y: 5 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      exit={{ 
        opacity: 0, 
        filter: 'blur(8px)',
        y: -5,
        transition: { 
          duration: 0.4, 
          ease: 'easeInOut',
          filter: { duration: 0.3 }
        }
      }}
      transition={{ 
        duration: 0.4, 
        ease: 'easeInOut',
        filter: { duration: 0.3 }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '8px 0',
        minHeight: '24px', // Match the content container height
        position: 'relative'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={words[currentWord]}
          initial={{ 
            opacity: 0, 
            filter: 'blur(6px)',
            y: 8,
            scale: 0.95
          }}
          animate={{ 
            opacity: 1, 
            filter: 'blur(0px)',
            y: 0,
            scale: 1
          }}
          exit={{ 
            opacity: 0, 
            filter: 'blur(6px)',
            y: -8,
            scale: 0.95
          }}
          transition={{
            duration: 0.35,
            ease: 'easeInOut',
            filter: { duration: 0.25 },
            scale: { duration: 0.3 }
          }}
          style={{ 
            fontWeight: 500,
            fontSize: fontSizes.base,
            backgroundImage: currentTheme === "dark" 
              ? 'linear-gradient(90deg, #fff 0%, #505050 50%, #fff 100%)'
              : 'linear-gradient(90deg, #c0c0c0 0%, #161616 50%, #c0c0c0 100%)',
            backgroundSize: '200% auto',
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            position: 'relative',
            display: 'inline-block'
          }}
        >
          <motion.span
            animate={{
              backgroundPosition: ['0% center', '200% center']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              background: 'inherit',
              WebkitBackgroundClip: 'inherit',
              backgroundClip: 'inherit',
              backgroundSize: 'inherit'
            }}
          >
            {words[currentWord]}
          </motion.span>
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
});

LoadingThinkingText.displayName = 'LoadingThinkingText';

// Define a new component for the Q&A item
interface FollowUpQAItemProps {
  qa: {
    question: string;
    answer: string;
    id: number;
    isComplete: boolean;
  };
  themedStyles: any;
  textDirection: 'ltr' | 'rtl';
  currentTheme: 'light' | 'dark' | 'system';
  targetLanguage: string;
  settings: any;
  fontSizes: FontSizes;
  handleCopy: (text: string, id: string) => void;
  copiedId: string | null;
  handleCopyAsImage: (elementSelector: string, id: string) => Promise<void>;
  imageCopiedId: string | null;
  isImageCopySupported: boolean;
  handleSpeak: (text: string, id: string) => void;
  speakingId: string | null;
  handleRegenerateFollowUp: (question: string, id: number) => void;
  activeAnswerId: number | null;
  isAskingFollowUp: boolean;
  popupRef: React.RefObject<HTMLDivElement>;
  currentModel: string | null;
}

const FollowUpQAItem = React.memo(({ qa, themedStyles, textDirection, currentTheme, targetLanguage, settings, fontSizes, handleCopy, copiedId, handleCopyAsImage, imageCopiedId, isImageCopySupported, handleSpeak, speakingId, handleRegenerateFollowUp, activeAnswerId, isAskingFollowUp, popupRef, currentModel }: FollowUpQAItemProps) => {
  const { question, answer, id, isComplete } = qa;
  const answerRef = useRef<HTMLDivElement>(null);
  const [animationCycleComplete, setAnimationCycleComplete] = useState(false);
  
  // Reset animation cycle when this item becomes active
  useEffect(() => {
    if (activeAnswerId === id && !isComplete && answer === '') {
      setAnimationCycleComplete(false);
    }
  }, [activeAnswerId, id, isComplete, answer]);

  // --------------------------------------------------
  // Unified scroll effect – triggers once answer is complete
  // --------------------------------------------------
  useEffect(() => {
    if (!isComplete || !answerRef.current || !popupRef.current) return;

    const scrollContainer = popupRef.current.querySelector('.lu-scroll-container') as HTMLElement | null;
    if (!scrollContainer) return;

    const topPadding = 16; // px to leave above the answer

    const scrollIfNeeded = () => {
      if (!answerRef.current) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const answerRect   = answerRef.current.getBoundingClientRect();

      // If the answer's top is above visible area OR below 40 % of viewport -> scroll
      const upperComfort = containerRect.top + containerRect.height * 0.4;
      const needsScroll  = answerRect.top < containerRect.top + topPadding || answerRect.top > upperComfort;

      if (needsScroll) {
        const offsetWithinContainer = answerRect.top - containerRect.top; // px between top edges
        const targetScrollTop      = scrollContainer.scrollTop + offsetWithinContainer - topPadding;

        scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    };

    // Initial attempt after paint
    requestAnimationFrame(scrollIfNeeded);

    // Watch for further growth for ~3 s
    const ro = new ResizeObserver(scrollIfNeeded);
    ro.observe(answerRef.current);

    const timeout = setTimeout(() => ro.disconnect(), 3000);

    return () => {
      ro.disconnect();
      clearTimeout(timeout);
    };
  }, [isComplete]);

  return (
    <motion.div
      key={id}
      layout="position"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 15
        }
      }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      style={themedStyles.followUpQA}
    >
      {/* Question bubble */}
      <motion.div
        variants={questionBubbleVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={questionBubbleStyle}
      >
        <div style={{
          ...themedStyles.followUpQuestion,
          textAlign: textDirection === "rtl" ? "right" : "left"
        }}>
          {question}
        </div>
      </motion.div>

      {/* Answer bubble */}
      <motion.div
        ref={answerRef}
        id={`qa-answer-${id}`}
        variants={answerBubbleVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={answerBubbleStyle}
      >
        <div style={{
          ...themedStyles.followUpAnswer,
          textAlign: textDirection === "rtl" ? "right" : "left"
        }}>
          <AnimatePresence mode="wait">
            {activeAnswerId === id && !isComplete && (answer === '' || !animationCycleComplete) ? (
              <LoadingThinkingText 
                key="loading"
                currentTheme={currentTheme}
                fontSizes={fontSizes}
                onCycleComplete={() => setAnimationCycleComplete(true)}
              />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, filter: 'blur(4px)', y: 5, scale: 0.98 }}
                animate={{ 
                  opacity: 1, 
                  filter: 'blur(0px)', 
                  y: 0, 
                  scale: 1,
                  transition: {
                    delay: 0.1, // Small delay to ensure loading exits first
                    duration: 0.5,
                    ease: 'easeInOut',
                    filter: { duration: 0.3, delay: 0.15 },
                    scale: { duration: 0.4, delay: 0.1 }
                  }
                }}
                exit={{ opacity: 0, filter: 'blur(4px)', y: -5, scale: 0.98 }}
                transition={{ 
                  duration: 0.4, 
                  ease: 'easeInOut',
                  filter: { duration: 0.3 }
                }}
                style={{
                  minHeight: '24px' // Prevent layout shift
                }}
              >
                <MarkdownText
                  text={answer}
                  isStreaming={activeAnswerId === id && !isComplete}
                  language={targetLanguage}
                  theme={currentTheme === "system" ? "light" : currentTheme}
                  fontSize={settings?.customization?.fontSize}
                  fontSizes={fontSizes}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {isComplete && (
            <motion.div 
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  delay: 0.3,
                  duration: 0.2
                }
              }}
            >
              {/* Copy text button */}
              <motion.button
                onClick={() => handleCopy(answer, `followup-${id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: copiedId === `followup-${id}` ? '#666' : '#666'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title={copiedId === `followup-${id}` ? "Copied!" : "Copy text to clipboard"}
              >
                {copiedId === `followup-${id}` ? (
                  <motion.svg 
                    width="13" 
                    height="15" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                  </motion.svg>
                ) : (
                  <motion.svg 
                    width="13" 
                    height="15" 
                    viewBox="0 0 62 61" 
                    fill="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <path d="M12.6107 48.8146V57.9328C12.6107 59.8202 14.1912 60.9722 15.6501 60.9722H58.2018C59.6546 60.9722 61.2412 59.8202 61.2412 57.9328V15.3811C61.2412 13.9283 60.0893 12.3417 58.2018 12.3417H49.0836V3.22349C49.0836 1.77065 47.9317 0.184082 46.0442 0.184082H3.49253C1.6081 0.184082 0.453125 1.76153 0.453125 3.22349V45.7752C0.453125 47.6626 2.03362 48.8146 3.49253 48.8146H12.6107ZM44.5245 12.3417H15.6501C13.7657 12.3417 12.6107 13.9192 12.6107 15.3811V44.2554H5.01223V4.74319H44.5245V12.3417Z" fill="currentColor"/>
                  </motion.svg>
                )}
              </motion.button>

              {/* Copy as image button */}
              {isImageCopySupported && (
                <motion.button
                  onClick={() => {
                    if (answerRef.current) {
                      handleCopyAsImage(answerRef.current as any, `followup-image-${id}`);
                    } else {
                      handleCopyAsImage(`#qa-answer-${id}`, `followup-image-${id}`);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    color: '#666'
                  }}
                  whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  title={imageCopiedId === `followup-image-${id}` ? "Copied as image!" : "Copy as image"}
                >
                  {imageCopiedId === `followup-image-${id}` ? (
                    <motion.svg 
                      width="13" 
                      height="15" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                    </motion.svg>
                  ) : (
                    <motion.svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </motion.svg>
                  )}
                </motion.button>
              )}

              {/* Speak button */}
              <motion.button
                onClick={() => handleSpeak(answer, `followup-${id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: speakingId === `followup-${id}` ? '#14742F' : '#666'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title={speakingId === `followup-${id}` ? "Stop speaking" : "Read text aloud"}
              >
                {speakingId === `followup-${id}` ? (
                  <motion.svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor"/>
                  </motion.svg>
                ) : (
                  <motion.svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                  </motion.svg>
                )}
              </motion.button>

              {/* Add regenerate button for follow-up */}
              <motion.button
                onClick={() => handleRegenerateFollowUp(question, id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: (activeAnswerId === id && !isComplete) ? '#14742F' : '#666'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title={(activeAnswerId === id && !isComplete) ? "Regenerating..." : "Regenerate response"}
                disabled={activeAnswerId === id && !isComplete}
              >
                <motion.svg 
                  width="14" 
                  height="15" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                </motion.svg>
              </motion.button>

              {/* Add model display */}
              <motion.div
                style={{
                  fontSize: fontSizes.model,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '4px',
                  minWidth: '80px',
                  justifyContent: 'center'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span style={{ 
                  textTransform: 'capitalize',
                  fontWeight: 500,
                  color: currentTheme === 'dark' ? 'rgb(132, 132, 132)' : 'rgb(102, 102, 102)',
                  userSelect: 'none',
                  backgroundColor: currentTheme === 'dark' ? '#494949' : '#f0f0f0',
                  padding: '2px 10px',
                  borderRadius: '11px',
                }}
                title={currentModel ? `AI Model: ${currentModel}` : 'Loading AI model...'}
                >
                  {currentModel || 'Loading...'}
                </span>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
});

export const mountLightUp = () => {
  // Prevent multiple mounts
  if (document.querySelector('[data-plasmo-popup]')) {
    return
  }

  // Host element that will live in the page DOM
  const host = document.createElement('div')
  host.setAttribute('data-plasmo-popup', 'true')
  host.style.all = 'unset'

  // Attach Shadow DOM for style isolation
  const shadowRoot = host.attachShadow({ mode: 'open' })
  // Inject extension styles inside the shadowRoot
  try {
    shadowRoot.appendChild(getStyle())
  } catch (err) {
    console.warn('LightUp: failed to inject styles', err)
  }

  // Container for React root
  const container = document.createElement('div')
  shadowRoot.appendChild(container)

  // Make it visible in the actual document
  document.body.appendChild(host)

  // Mount React application
  createRoot(container).render(<Content />)
}

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import type { PlasmoCSConfig } from "plasmo"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
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
  sidebarSlideMotionVariants,
  sidebarReducedMotionVariants
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
import { unifiedAIService } from "~services/llm/UnifiedAIService";
// Add import for page content extraction utility
import getPageContent from "~utils/contentExtractor"

// Import utilities
import { debounce } from "./utils/debounce"
import { createFontSizeMapping } from "./utils/fontMapping"
import { ShowSearchIcon, HideSearchIcon } from "./components/icons/SearchIcons"
import { DynamicSkeletonLines } from "./components/loading/DynamicSkeletonLines"
import { LoadingThinkingText } from "./components/loading/LoadingThinkingText"
import { LoadingSkeletonContainer } from "./components/loading/LoadingSkeletonContainer"
import { FollowUpQAItem } from "./components/followup/FollowUpQAItem"
import { FollowUpInput } from "./components/followup/FollowUpInput"
import { ConnectionStatus } from "./components/status/ConnectionStatus"
import { PopupLayoutContainer } from "./components/layout/PopupLayoutContainer"
import { FollowUpSection } from "./components/followup/FollowUpSection"
import { SharingMenu } from "./components/common/SharingMenu"
import PageContextWelcome from "./components/common/PageContextWelcome"

// Import debounced storage utility for performance
import { debouncedSet } from "~utils/debouncedStorage"

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

  if (message.type === "OPEN_FREE_POPUP_WITH_CONTEXT") {
    // Dispatch a custom event to open the popup in free mode with page context
    // and include any current text selection so that the free-mode input can be pre-populated.
    const currentSelection = window.getSelection()?.toString()?.trim() || "";
    const event = new CustomEvent('openFreePopupWithContext', {
      detail: {
        ...message.context,
        selectedText: currentSelection
      }
    });
    window.dispatchEvent(event);

    // Send response to confirm receipt
    sendResponse({ success: true });
    return true;
  }
});

// Plasmo function to inject CSS into the Shadow DOM
// Performance optimized: only load essential font weights initially, defer the rest
export const getStyle = () => {
  const style = document.createElement("style")

  // Essential font weights loaded immediately (400, 500, 600, 700)
  // These cover 95%+ of use cases in the UI
  const essentialFontCss = `
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-Regular.ttf")}') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-Medium.ttf")}') format('truetype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-SemiBold.ttf")}') format('truetype');
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-Bold.ttf")}') format('truetype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
  `;

  // Combine essential fonts with styles
  style.textContent = essentialFontCss + cssText + contentStyleCssText + tailwindCssText + fontCssText
  return style
}

// Deferred font loading - load additional weights when browser is idle
// This prevents blocking the main thread during initial render
const loadDeferredFonts = () => {
  const deferredFontCss = `
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-Thin.ttf")}') format('truetype');
      font-weight: 100;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-ExtraLight.ttf")}') format('truetype');
      font-weight: 200;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-Light.ttf")}') format('truetype');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-ExtraBold.ttf")}') format('truetype');
      font-weight: 800;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-Italic.ttf")}') format('truetype');
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: 'LightUpK2D';
      src: url('${chrome.runtime.getURL("fonts/K2D/K2D-BoldItalic.ttf")}') format('truetype');
      font-weight: 700;
      font-style: italic;
      font-display: swap;
    }
  `;
  
  const deferredStyle = document.createElement('style');
  deferredStyle.id = 'lightup-deferred-fonts';
  deferredStyle.textContent = deferredFontCss;
  document.head.appendChild(deferredStyle);
};

// Schedule deferred font loading when browser is idle
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => loadDeferredFonts(), { timeout: 3000 });
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(loadDeferredFonts, 1000);
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
  // Optimized: throttle callbacks and auto-disconnect after successful fix
  let redditObserverFixCount = 0;
  const maxRedditFixes = 3; // Disconnect after 3 successful fixes
  let redditObserverPending = false;
  
  const observer = new MutationObserver(() => {
    // Throttle: skip if a check is already scheduled
    if (redditObserverPending) return;
    redditObserverPending = true;
    
    requestAnimationFrame(() => {
      redditObserverPending = false;
      const plasmoElements = document.querySelectorAll('plasmo-csui, [data-plasmo-popup]');
      let foundElements = false;
      
      plasmoElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.visibility = 'visible';
          foundElements = true;
        }
      });
      
      // Auto-disconnect after enough successful fixes
      if (foundElements) {
        redditObserverFixCount++;
        if (redditObserverFixCount >= maxRedditFixes) {
          observer.disconnect();
        }
      }
    });
  });

  // Start observing with minimal scope
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
       font-family: 'LightUpK2D', 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
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
       font-family: 'LightUpK2D', 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
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
  // Optimized: throttle with rAF, only observe our popup element, and auto-disconnect
  let ytObserverPending = false;
  let ytObserverFixCount = 0;
  const maxYtFixes = 5; // Disconnect after 5 successful fixes
  
  const applyYouTubeFontFixes = (popupElement: HTMLElement) => {
    // Force re-apply YouTube font fixes if needed
    popupElement.style.fontSize = '16px';
    popupElement.style.fontFamily = "'LightUpK2D', 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // Ensure mode selector buttons have correct size
    const modeButtons = popupElement.querySelectorAll('button');
    modeButtons.forEach(button => {
      if (button instanceof HTMLElement) {
        const isSmallButton = button.textContent &&
          ['summarize', 'analyze', 'explain', 'translate', 'free'].includes(button.textContent.toLowerCase());
        button.style.fontSize = isSmallButton ? '16px' : '14px';
      }
    });

    // Fix main content areas
    const contentAreas = popupElement.querySelectorAll(
      '[data-markdown-container], .lu-explanation, .lu-text, [data-markdown-text], .markdown-content'
    );
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
  };
  
  const ytObserver = new MutationObserver(() => {
    // Throttle: skip if a check is already scheduled
    if (ytObserverPending) return;
    ytObserverPending = true;
    
    requestAnimationFrame(() => {
      ytObserverPending = false;
      const popupElement = document.querySelector('[data-plasmo-popup]');
      if (popupElement instanceof HTMLElement) {
        applyYouTubeFontFixes(popupElement);
        ytObserverFixCount++;
        
        // Auto-disconnect after enough fixes
        if (ytObserverFixCount >= maxYtFixes) {
          ytObserver.disconnect();
        }
      }
    });
  });

  // Start observing with reduced scope - only childList changes, no attribute monitoring
  ytObserver.observe(document.body, {
    childList: true,
    subtree: true
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

  // Calculate layout mode from settings
  const layoutMode = settings?.customization?.layoutMode || "floating";

  // Pin state for sidebar mode
  const [isPinned, setIsPinned] = useState(settings?.customization?.sidebarPinned || false);

  // Sync pin state with settings changes
  useEffect(() => {
    setIsPinned(settings?.customization?.sidebarPinned || false);
  }, [settings?.customization?.sidebarPinned]);

  // AI response language state - defaults to extension UI language if not set
  const [aiResponseLanguage, setAiResponseLanguage] = useState<string>("en");

  // Sync language state with settings changes and extension locale
  useEffect(() => {
    const initializeLanguage = async () => {
      if (settings?.aiResponseLanguage) {
        // User has explicitly set AI response language
        setAiResponseLanguage(settings.aiResponseLanguage);
      } else {
        // No explicit setting - use extension UI language as default
        const { getSelectedLocale } = await import("~utils/i18n");
        const extensionLocale = await getSelectedLocale();
        setAiResponseLanguage(extensionLocale);
      }
    };

    initializeLanguage();
  }, [settings?.aiResponseLanguage]);

  const { toast, showToast } = useToast();
  const { isEnabled, handleEnabledChange } = useEnabled(showToast);

  // Text selection bubble state from our new hook
  const {
    selectedText: selectionBubbleText,
    position: selectionBubblePosition,
    isVisible: isSelectionBubbleVisible,
    setIsVisible: setIsSelectionBubbleVisible
  } = useTextSelection(3, { enabled: isEnabled });

  // Initialize all our hooks
  const { width, height, handleResizeStart } = useResizable({
    initialWidth: 350,
    initialHeight: 460
  });
  const { voicesLoaded, speakingId, handleSpeak } = useSpeech();
  const { copiedId, handleCopy } = useCopy();

  // Animation variants for smooth transitions
  const contentVariants = {
    enter: {
      opacity: 0,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    center: {
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.15, ease: "easeIn" }
    }
  };

  // Export states
  const [exportingDocId, setExportingDocId] = useState<string | null>(null);
  const [exportingMdId, setExportingMdId] = useState<string | null>(null);

  // Rich copy state
  const [richCopiedId, setRichCopiedId] = useState<string | null>(null);

  // Prompt editor state
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>("");
  const [customUserPrompt, setCustomUserPrompt] = useState<string>("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  // Load custom prompts on mount
  useEffect(() => {
    const loadCustomPrompts = async () => {
      // Read from settings.customPrompts instead of separate storage keys
      const savedSystemPrompt = settings?.customPrompts?.systemPrompts?.[activeMode as keyof typeof settings.customPrompts.systemPrompts];
      const savedUserPrompt = settings?.customPrompts?.userPrompts?.[activeMode as keyof typeof settings.customPrompts.userPrompts];
      if (savedSystemPrompt) setCustomSystemPrompt(savedSystemPrompt);
      if (savedUserPrompt) setCustomUserPrompt(savedUserPrompt);
    };
    loadCustomPrompts();
  }, [activeMode, settings?.customPrompts]);

  // Auto-save custom prompts with debounce (performance optimized)
  const saveCustomPrompts = useCallback(async (systemPrompt: string, userPrompt: string) => {
    setIsSavingPrompt(true);

    // Save to settings.customPrompts instead of separate storage keys
    if (settings) {
      const storage = new Storage();
      const updatedSettings = {
        ...settings,
        customPrompts: {
          ...settings.customPrompts,
          systemPrompts: {
            ...settings.customPrompts?.systemPrompts,
            [activeMode]: systemPrompt || undefined
          },
          userPrompts: {
            ...settings.customPrompts?.userPrompts,
            [activeMode]: userPrompt || undefined
          }
        }
      };

      await storage.set("settings", updatedSettings);
      setSettings(updatedSettings);
    }

    setTimeout(() => setIsSavingPrompt(false), 500);
  }, [activeMode, settings, setSettings]);

  // Export functions
  const handleExportAsDoc = useCallback(async (text: string, id: string, filename: string = 'lightup-export.txt') => {
    try {
      setExportingDocId(id);

      // Format text with rich formatting (similar to print function)
      const formatTextForDocument = async (text: string) => {
        // Convert HTML to clean plain text first if needed
        const { stripHtml } = await import("~utils/textProcessing");
        let cleanText = text.includes('<') ? stripHtml(text) : text;

        return cleanText
          // Enhanced bold formatting - keep asterisks for emphasis
          .replace(/\*\*(.*?)\*\*/g, '**$1**')
          // Enhanced italic formatting
          .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '*$1*')
          // Convert bullet points to enhanced bullets with indentation
          .replace(/^\s*[\*\-\+]\s+(.+)$/gm, '  • $1')
          // Add proper spacing for headings (if any)
          .replace(/^#{1,6}\s+(.+)$/gm, '\n$1\n' + '─'.repeat(20))
          // Preserve paragraph breaks with better spacing
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          // Clean up multiple spaces but preserve intentional formatting
          .replace(/[ \t]+/g, ' ')
          // Enhance list formatting with better spacing
          .replace(/(  •.*\n)(  •)/g, '$1\n$2')
          // Add spacing around formatted sections
          .replace(/(\*\*.*?\*\*)/g, '\n$1\n')
          .replace(/\n\n\n+/g, '\n\n')
          .trim();
      };

      const formattedText = await formatTextForDocument(text);

      // Create a professional document with header
      const documentHeader = `
╔════════════════════════════════════════╗
║             LIGHTUP RESPONSE           ║
╚════════════════════════════════════════╝

Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

${'-'.repeat(50)}

`;

      const documentFooter = `

${'-'.repeat(50)}

Generated by LightUp - AI-Powered Web Enhancement
Website: boimaginations.com/lightup

${'-'.repeat(50)}`;

      const finalContent = documentHeader + formattedText + documentFooter;

      const blob = new Blob([finalContent], {
        type: 'text/plain;charset=utf-8'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Use .txt extension for universal compatibility
      const baseFilename = filename.replace(/\.(docx?|html?|rtf|txt)$/i, '');
      link.download = `${baseFilename}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTimeout(() => setExportingDocId(null), 2000);
    } catch (err) {
      console.error('Failed to export as TXT:', err);
      setExportingDocId(null);
    }
  }, []);

  const handleExportAsMd = useCallback(async (text: string, id: string, filename: string = 'lightup-export.md') => {
    try {
      setExportingMdId(id);

      // Format text for markdown with enhanced formatting
      const formatTextForMarkdown = async (text: string) => {
        // If text contains HTML, we need to clean it for markdown
        const { stripHtml } = await import("~utils/textProcessing");
        let cleanText = text.includes('<') ? stripHtml(text) : text;

        return cleanText
          // Preserve and enhance bold formatting
          .replace(/\*\*(.*?)\*\*/g, '**$1**')
          // Preserve and enhance italic formatting
          .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '*$1*')
          // Convert bullet points to markdown bullets
          .replace(/^\s*[\*\-\+]\s+(.+)$/gm, '- $1')
          // Add proper spacing for better readability
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          // Clean up multiple spaces
          .replace(/[ \t]+/g, ' ')
          // Enhance list formatting with proper spacing
          .replace(/(^- .*\n)(^- )/gm, '$1\n$2')
          .trim();
      };

      const formattedContent = await formatTextForMarkdown(text);

      // Create a professional markdown document with header
      const markdownHeader = `# LightUp AI Response

**Generated on:** ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

---

`;

      const markdownFooter = `

---

*Generated by **LightUp** - AI-Powered Web Enhancement*  
*Website: [boimaginations.com/lightup](https://boimaginations.com/lightup)*`;

      const finalMarkdown = markdownHeader + formattedContent + markdownFooter;

      const blob = new Blob([finalMarkdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith('.md') ? filename : `${filename}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTimeout(() => setExportingMdId(null), 2000);
    } catch (err) {
      console.error('Failed to export as MD:', err);
      setExportingMdId(null);
    }
  }, []);

  // Rich copy function with feedback
  const handleRichCopy = useCallback(async (text: string, id: string) => {
    try {
      // Copy with basic formatting preserved
      const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold asterisks
        .replace(/^\s*\*\s+/gm, '• '); // Convert to bullet points

      await navigator.clipboard.writeText(formattedText);
      setRichCopiedId(id);
      setTimeout(() => setRichCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy rich text:', err);
    }
  }, []);

  // Pin toggle function
  const handleTogglePin = useCallback(async () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);

    // Update settings storage
    if (settings) {
      const storage = new Storage();
      const updatedSettings = {
        ...settings,
        customization: {
          ...settings.customization,
          sidebarPinned: newPinnedState
        }
      };

      await storage.set("settings", updatedSettings);
      setSettings(updatedSettings);

      // Notify other components of the change
      window.dispatchEvent(
        new CustomEvent('settingsUpdated', {
          detail: {
            settings: updatedSettings,
            key: 'sidebarPinned',
            value: newPinnedState
          }
        })
      );
    }
  }, [isPinned, settings, setSettings]);

  // AI response language change function (does NOT affect extension UI language)
  const handleLanguageChange = useCallback(async (language: string) => {
    setAiResponseLanguage(language);

    // Update settings storage - this only affects AI response language, not extension UI
    if (settings) {
      const storage = new Storage();
      const updatedSettings = {
        ...settings,
        aiResponseLanguage: language
      };

      await storage.set("settings", updatedSettings);
      setSettings(updatedSettings);

      // Notify other components of the change
      window.dispatchEvent(
        new CustomEvent('settingsUpdated', {
          detail: {
            settings: updatedSettings,
            key: 'aiResponseLanguage',
            value: language
          }
        })
      );
    }
  }, [settings, setSettings]);

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
      // Clear memory when extension is disabled
      unifiedAIService.clearContext();
      
      // Immediately hide all UI elements when extension is toggled off
      if (setIsVisible) setIsVisible(false);
      if (setIsInteractingWithPopup) setIsInteractingWithPopup(false);
      if (setIsInputFocused) setIsInputFocused(false);

      // Reset any other UI states as needed
      if (setIsLoading) setIsLoading(false);
      if (setError) setError(null);
      if (setStreamingText) setStreamingText('');
      if (setFollowUpQAs) setFollowUpQAs?.([]);

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

      // Use settings.customPrompts directly
      const settingsWithCustomPrompts = {
        ...settings,
        aiResponseLanguage: aiResponseLanguage
      };

      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: regenPayloadText,
          context: regenTrimmedContext,
          pageContext: regenTrimmedContext,
          mode: mode,
          settings: settingsWithCustomPrompts,
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

      // Use settings.customPrompts directly
      const settingsWithCustomPrompts = {
        ...settings,
        translationSettings,
        aiResponseLanguage
      };

      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: payloadText,
          context: trimmedContext,
          mode: selectedMode,
          settings: settingsWithCustomPrompts,
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
      // Make sure we have the latest settings
      const storage = new Storage();
      const latestSettings = await storage.get("settings");

      // Use settings.customPrompts directly
      const settingsWithCustomPrompts = Object.assign({}, latestSettings || settings, {
        aiResponseLanguage: aiResponseLanguage,
        customPrompts: settings.customPrompts
      });

      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: question,
          context: selectedText,
          pageContext: "",
          mode: mode,
          settings: settingsWithCustomPrompts,
          isFollowUp: true,
          id: id,
          connectionId
        }
      });
    } catch (err) {
      console.error("Failed to regenerate follow-up:", err);
      setIsAskingFollowUp(false);
      setActiveAnswerId(null);
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

  // Buffer follow-up streaming to reduce render churn
  const followUpBufferRef = useRef<Record<number, string>>({});
  const followUpFlushTimerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const flushBufferedFollowUp = useCallback((id: number) => {
    const buffered = followUpBufferRef.current[id];
    if (!buffered) return;
    delete followUpBufferRef.current[id];

    // Clear pending timer if exists
    const timer = followUpFlushTimerRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete followUpFlushTimerRef.current[id];
    }

    setFollowUpQAs(prev => {
      const index = prev.findIndex(qa => qa.id === id);
      if (index === -1) return prev;
      const next = [...prev];
      const target = next[index];
      next[index] = { ...target, answer: `${target.answer}${buffered}` };
      return next;
    });
  }, [setFollowUpQAs]);

  const handleFollowUpStream = useCallback((id: number, content: string) => {
    followUpBufferRef.current[id] = (followUpBufferRef.current[id] || "") + content;

    if (followUpFlushTimerRef.current[id]) return;

    followUpFlushTimerRef.current[id] = setTimeout(() => {
      flushBufferedFollowUp(id);
    }, 80);
  }, [flushBufferedFollowUp]);

  // Cleanup any pending buffers on unmount
  useEffect(() => {
    return () => {
      Object.values(followUpFlushTimerRef.current).forEach(timer => clearTimeout(timer));
      followUpBufferRef.current = {};
      followUpFlushTimerRef.current = {};
    };
  }, []);

  // Pre-populate the input field in free mode with any highlighted text that was
  // included in the openFreePopupWithContext event.
  useEffect(() => {
    const handlePrefillQuestion = (event: CustomEvent) => {
      if (event.detail?.selectedText) {
        const sel = String(event.detail.selectedText).trim();
        if (sel.length) {
          // Wrap the text in quotes to mimic ChatGPT's style shown in the mock-up
          setFollowUpQuestion(`"${sel}"`);
          // Focus the textarea after a small delay to ensure it is mounted
          setTimeout(() => {
            try {
              const textarea = document.querySelector('[data-plasmo-popup] textarea') as HTMLTextAreaElement | null;
              textarea?.focus();
            } catch {
              /* no-op */
            }
          }, 50);
        }
      }
    };

    window.addEventListener('openFreePopupWithContext', handlePrefillQuestion as EventListener);
    return () => {
      window.removeEventListener('openFreePopupWithContext', handlePrefillQuestion as EventListener);
    };
  }, [setFollowUpQuestion]);

  const {
    port,
    streamingText,
    isLoading,
    error,
    connectionStatus,
    setStreamingText,
    setIsLoading,
    setError,
    reconnect,
    sendMessage
  } = usePort(
    connectionId,
    handleFollowUpStream,
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
    const trimmed = streamingText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(word => word.length > 0).length;
  }, [streamingText]);

  // ----- Time-based fallback progress so the bar moves right away -----
  const [fallbackProgress, setFallbackProgress] = useState(0);
  const [hasFallbackStarted, setHasFallbackStarted] = useState(false);
  const lastToastMessageRef = useRef<string | null>(null);
  const friendlyError = useMemo(() => {
    if (!error) return null;

    const lower = error.toLowerCase();
    const isBasic = (settings?.modelType || "basic") === "basic";
    const hasGeminiKey = Boolean(settings?.geminiApiKey);

    if (isBasic && (lower.includes("quota") || lower.includes("rate limit") || lower.includes("429") || lower.includes("limit exceeded"))) {
      return "Basic (free) quota is exhausted. Add your own Gemini/OpenAI key in Settings or wait a bit, then retry.";
    }

    if ((lower.includes("authentication failed") || lower.includes("invalid configuration") || lower.includes("api key")) && !hasGeminiKey) {
      return "Gemini is selected but no API key is set. Add your Gemini API key in Settings and try again.";
    }

    return error;
  }, [error, settings?.geminiApiKey, settings?.modelType]);

  useEffect(() => {
    if (!friendlyError || friendlyError === lastToastMessageRef.current) return;
    lastToastMessageRef.current = friendlyError;
    showToast(friendlyError);
  }, [friendlyError, showToast]);

  useEffect(() => {
    let rafId: number | undefined;
    let startTime: number | undefined;

    if (isLoading) {
      // New request → reset to 0
      setFallbackProgress(0);
      setHasFallbackStarted(false);

      // Use requestAnimationFrame for smoother, more efficient progress
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        // Progress ~1% every 120ms, cap at 85%
        const progress = Math.min((elapsed / 120) * 0.01, 0.85);
        setFallbackProgress(progress);
        
        if (!hasFallbackStarted) setHasFallbackStarted(true);
        
        // Continue animation until we reach 85%
        if (progress < 0.85) {
          rafId = requestAnimationFrame(animate);
        }
      };
      
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
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

  // Drag controls for floating mode
  const dragControls = useDragControls();

  const handleDragEnd = (_: any, info: any) => {
    if (layoutMode === "floating") {
      // Calculate the new position from the drag offset
      let newX = position.x + info.offset.x;
      let newY = position.y + info.offset.y;

      // Clamp to viewport bounds with a margin to keep popup fully visible
      const margin = 20;
      const minX = margin;
      const minY = margin;
      const maxX = window.innerWidth - width - margin;
      const maxY = window.innerHeight - height - margin;

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    }
  };


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
  const handleAskFollowUpWrapper = (questionText?: string) => {
    const questionSource = questionText ?? followUpQuestion;
    const trimmedQuestion = questionSource.trim();
    if (!trimmedQuestion || isAskingFollowUp) return;

    // Ensure state stays in sync – update immediately
    setFollowUpQuestion(trimmedQuestion);

    setIsAskingFollowUp(true);
    const newId = Date.now();

    setActiveAnswerId(newId);

    setFollowUpQAs(prev => [
      ...prev,
      {
        question: trimmedQuestion,
        answer: '',
        id: newId,
        isComplete: false,
        historyUpdated: false
      }
    ]);

    // Update conversation context with the new question
    updateConversation(trimmedQuestion);

    try {
      if (!port || connectionStatus !== 'connected') {
        reconnect();
      }

      const message = {
        type: "PROCESS_TEXT",
        payload: {
          text: trimmedQuestion,
          context: mode === "free" ? "" : selectedText,
          conversationContext,
          mode: mode,
          settings: {
            ...settings,
            aiResponseLanguage: aiResponseLanguage
          },
          isFollowUp: true,
          id: newId,
          connectionId
        }
      };

      const didSend = sendMessage(message);
      if (!didSend) {
        throw new Error("Failed to send follow-up message");
      }

      setFollowUpQuestion("");

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
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

  // Handle question clicks from PageContextWelcome suggestions
  const handleContextQuestionClick = async (question: string) => {
    // Set the question as selected text and process it
    setSelectedText(question);

    // Get page content for context
    const pageContent = getPageContent(mode);

    // Create contextual prompt that includes both the page content and the user's question
    const contextualPrompt = `Page content:
${pageContent}

User's question: ${question}

Please provide a helpful and relevant answer based on the page content above.`;

    // Process the question with page context
    await handleSelectionBubbleProcess(contextualPrompt, mode);
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
        // Clear memory before closing
        unifiedAIService.clearContext();
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
      // Clear session memory when component unmounts (page navigation)
      unifiedAIService.clearContext();
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
                settings: Object.assign({}, latestSettings || settings, {
                  aiResponseLanguage: aiResponseLanguage
                }),
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



  // Function to process the entire page content
  const handleProcessEntirePage = async (pageContent: string) => {
    if (!isEnabled || !port) return;

    // Set loading state and reset previous results
    setIsLoading(true);
    setStreamingText("");
    setFollowUpQAs([]);
    setError(null);

    // Position the popup in a fixed position (center or side)
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
          settings: Object.assign({}, latestSettings || settings, {
            aiResponseLanguage: aiResponseLanguage
          }),
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
        <ConnectionStatus
          connectionStatus={connectionStatus}
          currentTheme={normalizedTheme}
          fontSizes={fontSizes}
          handleReconnect={handleReconnect}
        />
      </div>

      {/* Header */}
      <div
        style={{
          ...themedStyles.buttonContainerParent,
          cursor: layoutMode === "floating" ? 'grab' : 'default',
          touchAction: 'none'
        }}
        data-header
        onPointerDown={(e) => {
          if (layoutMode === "floating") {
            dragControls.start(e);
          }
        }}
      >
        <motion.div style={{ boxShadow: 'none !important' }} >
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
            onClick={() => {
              if (isPinned) {
                // If the sidebar is pinned, unpin it first so the popup can be fully closed
                handleTogglePin();
              }
              handleClose();
            }}
            style={{
              ...themedStyles.button,
              marginTop: '2px',
              marginRight: '10px'
            }}
            variants={settings?.customization?.popupAnimation === "none" ? undefined : iconButtonVariants}
            whileHover={settings?.customization?.popupAnimation === "none" ? undefined : "hover"}
            title="Close LightUp"
          >
            <CloseIcon theme={normalizedTheme} />
          </motion.button>
        </div>
      </div>

      {/* Dynamic Content Container */}
      <AnimatePresence mode="wait">
        {!showPromptEditor ? (
          <motion.div
            key="content"
            initial="enter"
            animate="center"
            exit="exit"
            variants={contentVariants}
            style={{
              width: '100%'
            }}
          >
            {/* Website Info */}
            {settings?.customization?.showWebsiteInfo !== false && mode !== "free" && selectedText && (
              <WebsiteInfoComponent
                currentTheme={normalizedTheme}
                fontSizes={fontSizes}
                selectedText={streamingText || selectedText}
                loading={isLoading}
                progress={progress}
                requestId={requestId}
                layoutMode={layoutMode}
                isPinned={isPinned}
                onTogglePin={handleTogglePin}
                themedStyles={themedStyles}
                currentLanguage={aiResponseLanguage}
                onLanguageChange={handleLanguageChange}
              />
            )}

            {/* Selected Text */}
            {settings?.customization?.showSelectedText !== false && mode !== "free" && (
              <p style={{ ...themedStyles.text, fontWeight: '500', fontStyle: 'italic', textDecoration: 'underline' }}>
                {truncateText(selectedText)}
              </p>
            )}

            {/* Enhanced Welcome Message for Free Mode with Page Context */}
            <PageContextWelcome
              currentTheme={normalizedTheme}
              fontSizes={fontSizes}
              themedStyles={themedStyles}
              onQuestionClick={handleContextQuestionClick}
              isVisible={mode === "free" && !streamingText && !error && followUpQAs.length === 0}
            />

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
                  // background: currentTheme === "dark" ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
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
            {isLoading && !streamingText ? (
              <LoadingSkeletonContainer
                normalizedTheme={normalizedTheme}
                popupRef={popupRef}
                fontSizes={fontSizes}
                flexMotionStyle={flexMotionStyle}
                loadingSkeletonVariants={loadingSkeletonVariants}
                pulseVariants={pulseVariants}
              />
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
                  paddingBottom: "0"
                  
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
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.05 }}
                        data-lightup-response-content
                        ref={responseContentRef}
                      >
                        <MarkdownText
                          text={streamingText}
                          isStreaming={isLoading}
                          useReferences={(settings as any).enableReferences || false}
                          theme={currentTheme === "system" ? "light" : currentTheme}
                          fontSize={settings?.customization?.fontSize}
                          fontSizes={fontSizes}
                          enableWordByWord={settings?.customization?.enableWordByWordStreaming !== false}
                          wordsPerSecond={
                            settings?.customization?.streamingSpeed === "slow" ? 4 :
                              settings?.customization?.streamingSpeed === "medium" ? 8 :
                                settings?.customization?.streamingSpeed === "fast" ? 12 :
                                  settings?.customization?.streamingSpeed === "custom" ?
                                    (settings?.customization?.customWordsPerSecond || 8) : 8
                          }
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
                        color: copiedId === 'initial' ? '#14742F' : '#666'
                      }}
                      whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      title={copiedId === 'initial' ? "Copied!" : "Copy text"}
                    >
                      {copiedId === 'initial' ? (
                        <motion.svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        // initial={{ scale: 0 }}
                        // animate={{ scale: 1 }}
                        // transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
                        </motion.svg>
                      ) : (
                        <motion.svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"

                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </motion.svg>
                      )}
                    </motion.button>


                    {/* Sharing menu for exports */}
                    <SharingMenu
                      onExportTxt={() => handleExportAsDoc(streamingText, 'initial-doc')}
                      onExportMd={() => handleExportAsMd(streamingText, 'initial-md')}
                      onCopyFormatted={() => handleRichCopy(streamingText, 'initial-rich-copy')}
                      onPrint={() => {
                        // Create printable version with proper formatting
                        const formatTextForPrint = (text: string) => {
                          return text
                            // Convert markdown bold to HTML bold
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            // Convert markdown italic to HTML italic
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            // Convert bullet points to HTML list items
                            .replace(/^\s*[\*\-\+]\s+(.+)$/gm, '<li>$1</li>')
                            // Wrap consecutive list items in ul tags
                            .replace(/(<li>.*<\/li>)/gs, (match) => {
                              const items = match.match(/<li>.*?<\/li>/g);
                              return items ? `<ul>${items.join('')}</ul>` : match;
                            })
                            // Convert line breaks to paragraphs
                            .split('\n\n')
                            .map(paragraph => paragraph.trim())
                            .filter(paragraph => paragraph.length > 0)
                            .map(paragraph => {
                              // Don't wrap if it's already a list
                              if (paragraph.includes('<ul>') || paragraph.includes('<li>')) {
                                return paragraph;
                              }
                              return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
                            })
                            .join('');
                        };

                        const formattedContent = formatTextForPrint(streamingText);

                        const printWindow = window.open('', '_blank');
                        printWindow?.document.write(`
                          <html>
                            <head>
                              <title>LightUp Response</title>
                              <style>
                                body { 
                                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                                  line-height: 1.6; 
                                  margin: 40px; 
                                  color: #333;
                                  max-width: 800px;
                                }
                                h1, h2, h3 { color: #2c3345; margin-top: 24px; margin-bottom: 16px; }
                                p { margin-bottom: 16px; }
                                ul { padding-left: 24px; margin-bottom: 16px; }
                                li { margin-bottom: 8px; }
                                strong { font-weight: 600; }
                                .header { 
                                  border-bottom: 2px solid #e5e7eb; 
                                  padding-bottom: 16px; 
                                  margin-bottom: 32px; 
                                }
                                .footer { 
                                  margin-top: 40px; 
                                  padding-top: 20px; 
                                  border-top: 1px solid #ccc; 
                                  font-size: 12px; 
                                  color: #666; 
                                  text-align: center;
                                }
                                @media print {
                                  body { margin: 20px; }
                                  .header { page-break-after: avoid; }
                                }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h1>LightUp AI Response</h1>
                                <p style="color: #666; font-size: 14px; margin: 0;">${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                              </div>
                              <div class="content">
                                ${formattedContent}
                              </div>
                              <div class="footer">Generated by LightUp • boimaginations.com/lightup</div>
                            </body>
                          </html>
                        `);
                        printWindow?.document.close();
                        printWindow?.print();
                      }}
                      currentTheme={currentTheme}
                      exportingDocId={exportingDocId}
                      exportingMdId={exportingMdId}
                      richCopiedId={richCopiedId}
                      txtExportId="initial-doc"
                      mdExportId="initial-md"
                      richCopyId="initial-rich-copy"
                    />

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
                          <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor" />
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
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                      </svg>
                    </motion.button>

                    {/* Model display with edit button */}
                    <motion.div
                      style={{
                        fontSize: "0.75rem",
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
                      <motion.button
                        onClick={() => {
                          setShowPromptEditor(!showPromptEditor);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          color: currentTheme === 'dark' ? '#999' : '#666',
                          padding: '2px'
                        }}
                        whileHover={{ scale: 0.9, backgroundColor: currentTheme === 'dark' ? '#FFFFFF10' : '#2c2c2c10' }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        title="Edit prompt template"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </motion.button>
                    </motion.div>

                    {/* Search Toggle Button - Far Right - HIDDEN */}
                    {/* <motion.button
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
                    </motion.button> */}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Follow-up QAs */}
            <FollowUpSection
              followUpQAs={followUpQAs}
              isSearchVisible={isSearchVisible}
              inputRef={inputRef}
              followUpQuestion={followUpQuestion}
              themedStyles={themedStyles}
              textDirection={textDirection}
              normalizedTheme={normalizedTheme}
              targetLanguage={targetLanguage}
              settings={settings}
              fontSizes={fontSizes}
              handleCopy={handleCopy}
              copiedId={copiedId}
              handleSpeak={handleSpeak}
              speakingId={speakingId}
              handleRegenerateFollowUp={handleRegenerateFollowUp}
              activeAnswerId={activeAnswerId}
              isAskingFollowUp={isAskingFollowUp}
              popupRef={popupRef}
              currentModel={currentModel}
              handleFollowUpQuestion={handleFollowUpQuestion}
              handleAskFollowUpWrapper={handleAskFollowUpWrapper}
              setIsInputFocused={setIsInputFocused}
              handleExportAsDoc={handleExportAsDoc}
              handleExportAsMd={handleExportAsMd}
              handleRichCopy={handleRichCopy}
              exportingDocId={exportingDocId}
              exportingMdId={exportingMdId}
              richCopiedId={richCopiedId}
            />

            </motion.div>
          )}
          </motion.div>
        ) : (
          <motion.div
            key="promptEditor"
            initial="enter"
            animate="center"
            exit="exit"
            variants={contentVariants}
            style={{
              width: '100%'
            }}
          >
            {/* Prompt Editor */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                paddingBottom: '16px',
                marginBottom: '16px',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                padding: '0 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 4px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <motion.button
                      onClick={() => setShowPromptEditor(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                      whileHover={{ 
                        scale: 1.05, 
                        backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' 
                      }}
                      whileTap={{ scale: 0.95 }}
                      title="Back to AI result"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                  </div>
                  {isSavingPrompt && (
                    <span style={{
                      fontSize: fontSizes.sm || '14px',
                      color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                      fontFamily: "K2D, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Saving...
                    </span>
                  )}
                </div>
                <div style={{
                  paddingLeft: '3px'
                }}>
                  <span style={{
                    fontSize: fontSizes.md || '16px',
                    fontWeight: 600,
                    color: currentTheme === 'dark' ? '#fff' : '#000',
                    fontFamily: "K2D, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                    letterSpacing: '0.1px'
                  }}>
                    Edit Prompt Template
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{
                    backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.28)',
                    borderRadius: '16px',
                    border: `1px solid ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                    padding: '16px',
                    transition: 'all 0.2s ease'
                  }}>
                    <label style={{
                      fontSize: fontSizes.sm || '14px',
                      fontWeight: 600,
                      color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                      fontFamily: "K2D, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                      letterSpacing: '0.1px',
                      display: 'block',
                      marginBottom: '12px'
                    }}>
                      System Prompt
                    </label>
                    <textarea
                      value={customSystemPrompt}
                      onChange={(e) => {
                        setCustomSystemPrompt(e.target.value);
                        saveCustomPrompts(e.target.value, customUserPrompt);
                      }}
                      placeholder="Enter custom system prompt..."
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '0 0',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        fontSize: fontSizes.sm || '14px',
                        fontFamily: "K2D, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        maxWidth: '100%',
                        lineHeight: '1.6',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.color = currentTheme === 'dark' ? '#fff' : '#000';
                      }}
                      onBlur={(e) => {
                        e.target.style.color = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
                      }}
                    />
                  </div>

                  <div style={{
                    backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.28)',
                    borderRadius: '16px',
                    border: `1px solid ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                    padding: '16px',
                    transition: 'all 0.2s ease'
                  }}>
                    <label style={{
                      fontSize: fontSizes.sm || '14px',
                      fontWeight: 600,
                      color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                      fontFamily: "K2D, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                      letterSpacing: '0.1px',
                      display: 'block',
                      marginBottom: '12px'
                    }}>
                      User Prompt Template
                    </label>
                    <textarea
                      value={customUserPrompt}
                      onChange={(e) => {
                        setCustomUserPrompt(e.target.value);
                        saveCustomPrompts(customSystemPrompt, e.target.value);
                      }}
                      placeholder="Enter custom user prompt template... Use {text} as placeholder for selected text"
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px 0',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        fontSize: fontSizes.sm || '14px',
                        fontFamily: "K2D, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        maxWidth: '100%',
                        lineHeight: '1.6',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.color = currentTheme === 'dark' ? '#fff' : '#000';
                      }}
                      onBlur={(e) => {
                        e.target.style.color = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '8px'
                  }}>
                    <button
                      onClick={async () => {
                        const storage = new Storage();
                        await storage.remove(`customSystemPrompt_${activeMode}`);
                        await storage.remove(`customUserPrompt_${activeMode}`);
                        setCustomSystemPrompt("");
                        setCustomUserPrompt("");
                      }}
                      style={{
                        padding: '8px 20px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                        borderRadius: '20px',
                        color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        fontSize: fontSizes.sm || '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: "K2D, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
                        e.currentTarget.style.borderColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      Reset to Default
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
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
      <PopupLayoutContainer
        isVisible={isVisible}
        isEnabled={isEnabled}
        isConfigured={isConfigured}
        layoutMode={layoutMode}
        position={position}
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
        dragControls={dragControls}
        onDragEnd={handleDragEnd}
        sidebarScaleMotionVariants={sidebarScaleMotionVariants}
        sidebarSlideMotionVariants={sidebarSlideMotionVariants}
        sidebarReducedMotionVariants={sidebarReducedMotionVariants}
        isPinned={isPinned}
      />

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

      {/* Add the macOS Notes-style text selection button - hide when main popup is visible */}
      <AnimatePresence>
        {isSelectionBubbleVisible && !isVisible && settings?.customization?.showTextSelectionButton !== false && (
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

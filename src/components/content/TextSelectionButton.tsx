import React, { useState, useMemo, useEffect, useRef } from "react";
import { Z_INDEX } from "~utils/constants";
import type { Settings } from "~types/settings";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "../icons";
import { useContentI18n } from "../../utils/contentScriptI18n";

// Menu item interface
interface MenuItem {
  label: string;
  mode: string;
  icon: React.ReactNode;
}

// Define the props interface for our component
interface TextSelectionButtonProps {
  onProcess: (text: string, mode: string) => void;
  position: { x: number; y: number };
  selectedText: string;
  currentTheme: "light" | "dark";
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

/**
 * TextSelectionButton - Enhanced version with theme-aware styling
 * and smooth Framer Motion animations with hover-to-show menu
 */
const TextSelectionButton: React.FC<TextSelectionButtonProps> = ({
  onProcess,
  position,
  selectedText,
  currentTheme,
  isVisible,
  setIsVisible
}) => {
  // State for menu visibility
  const [menuVisible, setMenuVisible] = useState(false);
  
  // State to track if we're in the process of exiting
  const [isExiting, setIsExiting] = useState(false);
  
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<NodeJS.Timeout>();
  const hideTimerRef = useRef<NodeJS.Timeout>();
  
  // Use our custom i18n hook for content scripts
  const { getMessage } = useContentI18n();
  
  // Handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle visibility changes from parent component
  useEffect(() => {
    if (!isVisible && !isExiting) {
      setIsExiting(true);
      // Small delay to allow exit animation to play
      setTimeout(() => {
        setMenuVisible(false);
        setIsExiting(false);
      }, 200);
    }
  }, [isVisible, isExiting]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);
  
  // Theme-aware SVG icon color
  const iconColor = useMemo(() => {
    return currentTheme === 'dark' ? 'white' : '#333333';
  }, [currentTheme]);

  const buttonText = useMemo(() => {
    return getMessage("clickToProcess", "Click to process");
  }, [getMessage]);

  // Menu items with our original functions but with theme-aware SVG icons
  const menuItems: MenuItem[] = useMemo(() => [
    { 
      label: getMessage("actionSummarize", "Summarize"), 
      mode: "summarize", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4h16v16H4V4z" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 8h16M8 4v16" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    },
    { 
      label: getMessage("actionExplain", "Explain"), 
      mode: "explain", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 89 99" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.55007 23.009C0.994225 23.8875 0.0273438 25.5563 0.0273438 27.3624V71.2893C0.0273438 73.1053 0.994225 74.7642 2.55007 75.6427C10.3882 80.0649 34.2363 93.503 41.8389 97.7877C42.5849 98.2049 43.4045 98.416 44.2291 98.416C45.034 98.416 45.8389 98.2147 46.5702 97.8123C54.1727 93.6159 77.9325 80.5213 85.805 76.1777C87.3903 75.309 88.3719 73.6304 88.3719 71.8046V27.3624C88.3719 25.5563 87.405 23.8875 85.8443 23.009C78.0159 18.5967 54.2169 5.18303 46.5849 0.883599C45.8438 0.466416 45.0193 0.255371 44.1996 0.255371C43.3751 0.255371 42.5554 0.466416 41.8143 0.883599C34.1823 5.18303 10.3784 18.5967 2.55007 23.009ZM81.0098 33.3895V70.3224L47.8806 88.5901V51.397L81.0098 33.3895ZM11.0017 26.7931L44.1996 8.07877L77.5791 26.8962L44.1996 45.1344L11.0017 26.7931Z" fill={iconColor}/>
        </svg>
      ) 
    },
    { 
      label: getMessage("actionTranslate", "Translate"), 
      mode: "translate", 
      icon: (
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke={iconColor}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
        </svg>
      ) 
    },
    { 
      label: getMessage("actionAnalyze", "Analyze"), 
      mode: "analyze", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M35.9064 0.109375C16.194 0.109375 0.136719 16.1667 0.136719 35.8791C0.136719 55.5914 16.194 71.6487 35.9064 71.6487C44.44 71.6487 52.2816 68.6328 58.4391 63.6205L83.5695 95.1014C83.5695 95.1014 89.0738 95.9195 92.4913 92.358C95.9325 88.7694 95.1254 83.5488 95.1254 83.5488L63.6478 58.4117C68.6602 52.2543 71.6761 44.4127 71.6761 35.8791C71.6761 16.1667 55.6188 0.109375 35.9064 0.109375ZM35.9064 7.26397C51.7528 7.26397 64.5215 20.0327 64.5215 35.8791C64.5215 51.7254 51.7528 64.4941 35.9064 64.4941C20.06 64.4941 7.29132 51.7254 7.29132 35.8791C7.29132 20.0327 20.06 7.26397 35.9064 7.26397Z" fill={iconColor}/>
        </svg>
      ) 
    },
    { 
      label: getMessage("actionChat", "Chat about"), 
      mode: "free", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12h8M12 8v8M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    }
  ], [iconColor, getMessage]);
  
  // Handle button hover - show menu with delay
  const handleButtonHover = () => {
    // Clear any existing hide timer
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    
    // Set show timer with slight delay for better UX
    if (!menuVisible && !showTimerRef.current) {
      showTimerRef.current = setTimeout(() => {
        setMenuVisible(true);
        showTimerRef.current = null;
      }, 200); // 200ms delay before showing
    }
  };
  
  // Handle button/menu leave - hide menu with delay
  const handleLeave = () => {
    // Clear any existing show timer
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    
    // Set hide timer with slight delay to allow moving to menu
    if (menuVisible && !hideTimerRef.current) {
      hideTimerRef.current = setTimeout(() => {
        setMenuVisible(false);
        hideTimerRef.current = null;
      }, 150); // 150ms delay before hiding
    }
  };
  
  // Handle menu hover - keep menu open
  const handleMenuHover = () => {
    // Clear any existing hide timer when hovering over menu
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  
  // Handle button click - still works for accessibility/mobile
  const handleButtonClick = (e?: React.MouseEvent | React.KeyboardEvent) => {
    // Block all event propagation and default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      // Stop immediate propagation as well
      if (typeof e.nativeEvent?.stopImmediatePropagation === 'function') {
        e.nativeEvent.stopImmediatePropagation();
      }
    }
    
    // Clear any timers
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    
    // Toggle menu visibility immediately on click
    setMenuVisible(!menuVisible);
  };
  
  // Process menu item selection
  const handleMenuItemClick = (e: React.MouseEvent | React.KeyboardEvent | null, mode: string) => {
    // Block all possible event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.nativeEvent?.stopImmediatePropagation === 'function') {
        e.nativeEvent.stopImmediatePropagation();
      }
    }
    
    // First, close the menu - prevent any position shifting
    setMenuVisible(false);
    
    // Then process the selected text with the chosen mode
    // Use setTimeout to ensure UI updates first
    setTimeout(() => {
      onProcess(selectedText, mode);
    }, 0);
  };
  
  // Base container style (position set directly, only opacity/scale animated)
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: Z_INDEX.SELECTION_BUTTON,
    pointerEvents: 'auto',
    transform: 'translate(-50%, -100%)', // Center horizontally, position above the selection
  };
  
  // Theme-aware button styles with GlobalActionButton inspiration
  const buttonStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: currentTheme === 'dark' ? '#383838' : '#f5f5f5',
    boxShadow: currentTheme === 'dark' 
      ? '0 3px 8px rgba(0, 0, 0, 0.4)' 
      : '0 3px 8px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: currentTheme === 'dark' ? '#FFFFFF' : '#000000',
    fontSize: '14px',
    fontWeight: 'bold',
    pointerEvents: 'auto',
    position: 'relative',
    // outline: `2px solid ${currentTheme === 'dark' ? '#878787' : '#fff'}`,
    outlineOffset: '1px',
  };
  
  // Theme-aware menu styles - memoized to prevent recalculations
  const themeStyles = useMemo(() => {
    if (currentTheme === "dark") {
      return {
        backgroundColor: '#2a2a2a',
        color: '#FFFFFF',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1)',
        hoverBg: '#3a3a3a'
      };
    } else {
      return {
        backgroundColor: '#ffffff',
        color: '#333333',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        hoverBg: '#f5f5f5'
      };
    }
  }, [currentTheme]);
  
  // Menu container styles - theme aware
  const menuContainerStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: '40px',
    left: '-75px',
    backgroundColor: themeStyles.backgroundColor,
    borderRadius: '12px',
    boxShadow: themeStyles.boxShadow,
    width: '172px',
    zIndex: Z_INDEX.SELECTION_BUTTON,
    overflow: 'hidden',
    padding: '10px',
  }), [themeStyles.backgroundColor, themeStyles.boxShadow]);
  
  // Menu item styles - theme aware
  const menuItemStyle = useMemo(() => ({
    padding: '11px 13px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: themeStyles.color,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'background-color 0.2s',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left' as const,
    width: '100%',
    position: 'relative' as const,
    borderRadius: '8px',
  }), [themeStyles.color]);
  
  // Animation variants for the main container - only handle opacity/scale, not position
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 400 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      transition: { 
        duration: 0.2 
      }
    }
  };

  // Animation variants for the menu
  const menuVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { 
      opacity: 1, 
      y: 0, 
      height: 'auto',
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 400,
        staggerChildren: 0.05 
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      height: 0,
      transition: { 
        duration: 0.2,
        ease: "easeInOut",
        staggerChildren: 0.03,
        staggerDirection: -1
      } 
    }
  };

  // Animation variants for menu items
  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 400 
      }
    },
    exit: {
      opacity: 0,
      x: -10,
      transition: {
        duration: 0.15,
        ease: "easeInOut"
      }
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      {(isVisible || isExiting) && (
        <motion.div 
          id="lightup-selection-btn" 
          style={{
            ...containerStyle,
            left: position.x,
            top: position.y
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="lightup-selection-container"
          key="selection-button"
        >
          {/* Animated button with extensive event handling */}
          <motion.button 
            style={buttonStyle}
            onClick={handleButtonClick}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleLeave}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
            }}
            aria-label={getMessage("selectionOptions", "Selection Options")}
            aria-expanded={menuVisible}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleButtonClick(e);
              }
            }}
          >
            {/* Logo component using the same icon as GlobalActionButton */}
            {Logo(currentTheme)}
          </motion.button>

          {/* Animated menu with AnimatePresence for smooth enter/exit */}
          <AnimatePresence mode="wait">
            {menuVisible && (
              <motion.div 
                style={menuContainerStyle}
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                key="menu-container"
                onMouseEnter={handleMenuHover}
                onMouseLeave={handleLeave}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setMenuVisible(false);
                    e.stopPropagation();
                  }
                }}
              >
                {menuItems.map((item, index) => (
                  <motion.button
                    key={index}
                    style={menuItemStyle}
                    variants={menuItemVariants}
                    whileHover={{ 
                      backgroundColor: themeStyles.hoverBg,
                      scale: 0.9
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    onClick={(e) => {
                      handleMenuItemClick(e, item.mode);
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleMenuItemClick(e, item.mode);
                      }
                    }}
                    aria-label={item.label}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px', width: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{item.icon}</span>
                        {item.label}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TextSelectionButton;

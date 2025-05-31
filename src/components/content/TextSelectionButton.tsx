import React, { useState, useMemo } from "react";
import { Z_INDEX } from "~utils/constants";
import type { Settings } from "~types/settings";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "../icons";

// Define the props interface for our component
interface TextSelectionButtonProps {
  onProcess: (text: string, mode: string) => void;
  position: { x: number; y: number };
  selectedText: string;
  currentTheme: "light" | "dark";
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

// Menu item interface
interface MenuItem {
  label: string;
  mode: string;
  icon: React.ReactNode;
}

/**
 * TextSelectionButton - Enhanced version with theme-aware styling
 * and smooth Framer Motion animations
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
  
  // Theme-aware SVG icon color
  const iconColor = useMemo(() => {
    return currentTheme === 'dark' ? 'white' : '#333333';
  }, [currentTheme]);

  // Menu items with our original functions but with theme-aware SVG icons
  const menuItems: MenuItem[] = useMemo(() => [
    { 
      label: "Summarize", 
      mode: "summarize", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6h16M4 10h16M4 14h10M4 18h10" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    },
    { 
      label: "Explain", 
      mode: "explain", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    },
    { 
      label: "Translate", 
      mode: "translate", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    },
    { 
      label: "Analyze", 
      mode: "analyze", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    },
    { 
      label: "Chat about", 
      mode: "free", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    }
  ], [iconColor]);
  
  // Handle button click - prevents event propagation
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
    
    // Toggle menu visibility
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
    zIndex: Z_INDEX.POPUP,
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
    left: '-105px',
    backgroundColor: themeStyles.backgroundColor,
    borderRadius: '12px',
    boxShadow: themeStyles.boxShadow,
    width: '172px',
    zIndex: Z_INDEX.POPUP,
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
        duration: 0.2 
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
    }
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
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
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
            }}
            aria-label="Selection Options"
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
          <AnimatePresence>
            {menuVisible && (
              <motion.div 
                style={menuContainerStyle}
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
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
                      backgroundColor: themeStyles.hoverBg
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

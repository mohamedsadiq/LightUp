import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Theme } from "~types/theme"
import { SUPPORTED_LANGUAGES } from "~utils/i18n"

interface LanguageSelectorOverlayProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  theme: Theme;
  themedStyles: any;
}

// Popup theme colors - exactly matching the popup component
const popupTheme = {
  dark: {
    background: "#2A2A2A",       // Main popup background
    foreground: "#FFFFFF",       // Text color
    sidebar: "#2A2A2A",         // Sidebar background
    sidebarActive: "#ffffff0d",  // Active sidebar item
    content: "#2A2A2A",         // Content area background
    // border: "#3A3A3A",          // Border color
    primary: "#0078D4",         // Primary button color
    destructive: "#E74C3C",     // Destructive button color
    divider: "#9d9d9d",         // Divider line color
    button: {
      default: "#444444",       // Default button background
      text: "#FFFFFF"           // Button text color
    },
    toggle: {
      active: "#2DCA6E",        // Active toggle switch
      inactive: "#6B6B6B",      // Inactive toggle
      track: "#333333"          // Toggle track
    },
    card: "#333333"            // Card background color
  },
  light: {
    background: "#E9E9E9",
    foreground: "#000000",
    sidebar: "#F5F5F5",
    sidebarActive: "#E0E0E0",
    content: "#FFFFFF",
    // border: "#D4D4D4",
    primary: "#0078D4",
    destructive: "#E74C3C",
    divider: "#CCCCCC",
    button: {
      default: "#FFFFFF",
      text: "#000000"
    },
    toggle: {
      active: "#2DCA6E",
      inactive: "#CCCCCC",
      track: "#E0E0E0"
    },
    card: "#FFFFFF"
  }
}

// Language code to flag emoji mapping
const getFlagEmoji = (langCode: string): string => {
  const mapping: Record<string, string> = {
    // Major Languages
    'en': '🇬🇧',     // English -> United Kingdom
    'es': '🇪🇸',     // Spanish -> Spain
    'es-MX': '🇲🇽',  // Spanish (Mexico) -> Mexico
    'zh-CN': '🇨🇳',  // Chinese (Simplified) -> China
    'zh-TW': '🇹🇼',  // Chinese (Traditional) -> Taiwan
    'hi': '🇮🇳',     // Hindi -> India
    'ar': '🇸🇦',     // Arabic -> Saudi Arabia
    'pt': '🇵🇹',     // Portuguese -> Portugal
    'pt-BR': '🇧🇷',  // Portuguese (Brazil) -> Brazil
    'ru': '🇷🇺',     // Russian -> Russia
    'ja': '🇯🇵',     // Japanese -> Japan
    
    // European Languages
    'fr': '🇫🇷',     // French -> France
    'de': '🇩🇪',     // German -> Germany
    'it': '🇮🇹',     // Italian -> Italy
    'pl': '🇵🇱',     // Polish -> Poland
    'uk': '🇺🇦',     // Ukrainian -> Ukraine
    'nl': '🇳🇱',     // Dutch -> Netherlands
    'sv': '🇸🇪',     // Swedish -> Sweden
    'da': '🇩🇰',     // Danish -> Denmark
    'no': '🇳🇴',     // Norwegian -> Norway
    'fi': '🇫🇮',     // Finnish -> Finland
    'cs': '🇨🇿',     // Czech -> Czech Republic
    'sk': '🇸🇰',     // Slovak -> Slovakia
    'hu': '🇭🇺',     // Hungarian -> Hungary
    'ro': '🇷🇴',     // Romanian -> Romania
    'bg': '🇧🇬',     // Bulgarian -> Bulgaria
    'hr': '🇭🇷',     // Croatian -> Croatia
    'sl': '🇸🇮',     // Slovenian -> Slovenia
    'et': '🇪🇪',     // Estonian -> Estonia
    'lv': '🇱🇻',     // Latvian -> Latvia
    'lt': '🇱🇹',     // Lithuanian -> Lithuania
    'el': '🇬🇷',     // Greek -> Greece
    'tr': '🇹🇷',     // Turkish -> Turkey
    
    // Asian Languages
    'ko': '🇰🇷',     // Korean -> South Korea
    'th': '🇹🇭',     // Thai -> Thailand
    'vi': '🇻🇳',     // Vietnamese -> Vietnam
    'id': '🇮🇩',     // Indonesian -> Indonesia
    'ms': '🇲🇾',     // Malay -> Malaysia
    'tl': '🇵🇭',     // Filipino -> Philippines
    'ta': '🇮🇳',     // Tamil -> India (using India flag)
    'ur': '🇵🇰',     // Urdu -> Pakistan
    'fa': '🇮🇷',     // Persian -> Iran
    'he': '🇮🇱',     // Hebrew -> Israel
    
    // African Languages
    'sw': '🇰🇪',     // Swahili -> Kenya
    'ig': '🇳🇬',     // Igbo -> Nigeria
    'ha': '🇳🇬',     // Hausa -> Nigeria
  };
  
  return mapping[langCode] || '🇬🇧'; // Default to GB if not found
};

// Simple and reliable flag component using Unicode emojis
const LanguageFlag: React.FC<{ code: string; size?: 'S' | 'M' | 'L' }> = ({ code, size = 'M' }) => {
  const flagEmoji = getFlagEmoji(code);
  
  // Size mappings
  const sizeMap = {
    'S': { fontSize: '12px', width: '16px', height: '12px' },
    'M': { fontSize: '16px', width: '20px', height: '15px' },
    'L': { fontSize: '20px', width: '24px', height: '18px' }
  };
  
  const { fontSize, width, height } = sizeMap[size];
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: width,
      height: height,
      flexShrink: 0,
      fontSize: fontSize,
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, system-ui',
      lineHeight: 1,
      borderRadius: '2px',
      overflow: 'hidden'
    }}>
      {flagEmoji}
    </div>
  );
};

const iconButtonVariants = {
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
}

const overlayVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -4 }
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 }
}

export const LanguageSelectorOverlay: React.FC<LanguageSelectorOverlayProps> = ({
  currentLanguage,
  onLanguageChange,
  theme,
  themedStyles
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const themeColors = theme === "dark" ? popupTheme.dark : popupTheme.light;
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  // Close overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...themedStyles.button,
          marginTop: '2px',
          marginRight: '8px',
          color: themeColors.foreground,
          opacity: 0.9,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: 500,
          padding: '6px 10px',
          minWidth: '70px',
          borderRadius: '4px',
          border: `1px solid ${themeColors.border}`,
          // backgroundColor: themeColors.button.default,
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        variants={iconButtonVariants}
        whileHover="hover"
        whileTap="tap"
        title="Select AI response language (does not change extension interface)"
      >
        <LanguageFlag code={currentLang.code} size="S" />
        <span style={{ 
          fontWeight: 500,
          fontSize: '12px',
          letterSpacing: '0.3px',
          color: themeColors.button.text
        }}>
          {currentLang.code.toUpperCase()}
        </span>
        <svg 
          width="10" 
          height="10" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            opacity: 0.7
          }}
        >
          <path 
            d="M6 9L12 15L18 9" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              zIndex: 10000,
              backgroundColor: themeColors.background,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '10px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)', // Matching popup shadow exactly
              minWidth: '320px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '0'
            }}
          >
            {/* Header - exactly matching popup section headers */}
            <div style={{
              padding: '14px 20px 10px',
              borderBottom: `1px solid ${themeColors.border}`,
              backgroundColor: theme === 'dark' ? '#232323' : '#F8F9FA' // Matching popup header background
            }}>
              <div style={{
                fontSize: '17px',
                fontWeight: 500,
                color: themeColors.foreground,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" opacity="0.8"/>
                </svg>
                AI Response Language
              </div>
              <div style={{
                fontSize: '14px',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                marginTop: '4px',
                lineHeight: 1.4
              }}>
                Choose the language for AI responses
              </div>
            </div>

            {/* Language List - using popup's exact styling patterns */}
            <div style={{ padding: '8px 0' }}>
              {SUPPORTED_LANGUAGES.map((language, index) => (
                <motion.button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.015 }}
                  whileHover={{ 
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                  }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    border: 'none',
                    background: language.code === currentLanguage 
                      ? (theme === 'dark' ? themeColors.sidebarActive : 'rgba(0, 120, 212, 0.1)')
                      : 'none',
                    color: language.code === currentLanguage 
                      ? themeColors.foreground 
                      : (theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
                    fontSize: '15px', // Matching popup text size
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    fontWeight: language.code === currentLanguage ? 500 : 400,
                    position: 'relative'
                  }}
                >
                  <LanguageFlag code={language.code} size="M" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                    <span style={{ 
                      fontSize: '15px',
                      lineHeight: '1.2',
                      fontWeight: language.code === currentLanguage ? 500 : 400
                    }}>
                      {language.name}
                    </span>
                    <span style={{ 
                      fontSize: '13px', 
                      opacity: 0.6,
                      fontWeight: 400,
                      color: 'inherit'
                    }}>
                      {language.nativeName}
                    </span>
                  </div>
                  {language.code === currentLanguage && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: themeColors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WebsiteInfo } from "~utils/websiteInfo";
import { getWebsiteInfo, isValidFavicon } from "~utils/websiteInfo";
import { PinButton } from "./PinButton";
import { LanguageSelectorOverlay } from "./LanguageSelectorOverlay";

interface WebsiteInfoProps {
  currentTheme: "light" | "dark";
  fontSizes: {
    xs: string;
    sm: string;
    md: string;
    [key: string]: any;
  };
  selectedText?: string;
  loading?: boolean;
  progress?: number;
  requestId?: number;
  // Pin button props
  layoutMode?: string;
  isPinned?: boolean;
  onTogglePin?: () => void;
  themedStyles?: any;
  // Language selector props
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

const WebsiteInfoComponent: React.FC<WebsiteInfoProps> = ({
  currentTheme,
  fontSizes,
  selectedText = "",
  loading = false,
  progress,
  requestId = 0,
  layoutMode,
  isPinned,
  onTogglePin,
  themedStyles,
  currentLanguage = "en",
  onLanguageChange
}) => {
  const [websiteInfo, setWebsiteInfo] = useState<WebsiteInfo | null>(null);
  const [faviconValid, setFaviconValid] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { wordCount, readTimeLabel } = React.useMemo(() => {
    if (!selectedText) return { wordCount: 0, readTimeLabel: '<1 min' };

    // Strip markdown and code fences to avoid counting symbols
    let clean = selectedText
      .replace(/```[\s\S]*?```/g, ' ')       // remove triple-backtick blocks
      .replace(/`[^`]*`/g, ' ')               // inline code
      .replace(/[#>*_\-]+/g, ' ')            // markdown bullets, headings, emphasis
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1'); // markdown links keep label

    // Handle contractions BEFORE removing symbols to prevent word splitting
    clean = clean
      .replace(/\b(\w+)['\u2019](\w+)\b/g, '$1$2')  // Convert contractions: "I'm" -> "Im", "don't" -> "dont"
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')            // drop symbols (unicode letters/numbers)
      .replace(/\s+/g, ' ')                          // collapse spaces
      .trim();

    // Proper empty string handling after cleaning
    if (!clean) return { wordCount: 0, readTimeLabel: '<1 min' };

    const words = clean.split(' ').filter(word => word.length > 0).length;
    const minutes = words / 200; // avg reading speed
    const label = minutes < 0.5 ? 'Less than 1 min' : `${Math.round(minutes)} min`;

    return { wordCount: words, readTimeLabel: `${label} read` };
  }, [selectedText]);


  useEffect(() => {
    const info = getWebsiteInfo();
    setWebsiteInfo(info);

    // Check if favicon is valid
    isValidFavicon(info.favicon).then(setFaviconValid);

    // Simulate minimal delay for graceful entrance (spatial continuity)
    const timer = setTimeout(() => setIsLoaded(true), 280); // ~0.28s feels instant yet allows anim
    return () => clearTimeout(timer);
  }, []);

  if (!websiteInfo) return null;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0px 16px',
    minHeight: '56px',
    backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgb(255 255 255 / 28%)',
    borderRadius: '20px',
    border: `1px solid ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '0000000f'}`,
    marginBottom: '13px',
    fontSize: fontSizes.sm,
    color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    position: 'relative',
    // height: '43px',
  };

  const faviconStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    borderRadius: '2px',
    flexShrink: 0,
  };

  const textStyle: React.CSSProperties = {
    fontSize: fontSizes.sm,
    fontWeight: 500,
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
    maxWidth: '100%',
  };

  const hostnameStyle: React.CSSProperties = {
    fontSize: fontSizes.xs,
    opacity: 0.6,
    marginLeft: '4px',
  };

  const textContainerStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    lineHeight: '18px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
    padding:12
  };

  // Skeleton placeholder styles
  const skeletonStyle: React.CSSProperties = {
    height: '22px',
    flex: 1,
    borderRadius: '4px',
    background: currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };

  return (
    <motion.div
      ref={containerRef}
      style={containerStyle}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      role="group"
      aria-label="Current page information"
    >
      {/* Loading progress overlay */}
      {loading && typeof progress === 'number' ? (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: '100%',
            borderRadius: containerStyle.borderRadius,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}
        >
          <motion.div
            key={requestId}
            animate={{ x: `${(1 - (progress ?? 0)) * 100}%` }}
            transition={{ ease: 'linear', duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '100%',
            
              background: currentTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
          />
        </motion.div>
      ) : loading && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: '100%',
            borderRadius: containerStyle.borderRadius,
            overflow: 'hidden',
            
            pointerEvents: 'none'
          }}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '100%',
              background: currentTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
          />
        </motion.div>
      )}

      {/* Favicon */}
      {faviconValid ? (
        <img
          src={websiteInfo.favicon}
          alt="Website favicon"
          style={faviconStyle}
          onError={() => setFaviconValid(false)}
        />
      ) : (
        <div
          style={{
            ...faviconStyle,
            backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
          }}
        >
          🌐
        </div>
      )}

      {/* Website title and hostname */}
      <div
        style={textContainerStyle}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onFocus={() => setIsHover(true)}
        onBlur={() => setIsHover(false)}
        tabIndex={0}
        aria-label="Page title and reading statistics"
      >
        {/* Loading placeholder */}
        {!isLoaded ? (
          <motion.div
            style={skeletonStyle}
            initial={{ opacity: 0.4, filter: 'blur(6px)' }}
            animate={{ opacity: 0.6, filter: 'blur(6px)' }}
            transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
          />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {isHover && wordCount > 0 ? (
              <motion.div
                key="stats"
                initial={{ opacity: 0, filter: 'blur(6px)', y: 10, x: 0,  }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0, x: 0,  }}
                exit={{ opacity: 0, filter: 'blur(6px)', y: 10, x: 0,  }}
                transition={{ duration: 0.2, ease: 'easeInOut', filter: {duration:0.1} }}
                style={{
                  fontSize: fontSizes.sm,
                  fontWeight: 500,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                {wordCount} words
                <span style={{ fontSize: fontSizes.xs, opacity: 0.7 }}>{readTimeLabel}</span>
              </motion.div>
            ) : (
              <motion.div
                key="info"
                initial={{ opacity: 0, filter: 'blur(6px)', y: 10, x: 0, }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0, x: 0,  }}
                exit={{ opacity: 0, filter: 'blur(6px)', y: 10, x: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut', filter: {duration:0.1} }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <span style={textStyle} title={websiteInfo.title}>{websiteInfo.title}</span>
                <span style={hostnameStyle}>{websiteInfo.hostname}</span>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      
      {/* Action buttons - Language selector and Pin button */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Language Selector */}
        {onLanguageChange && (
          <LanguageSelectorOverlay
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
            theme={currentTheme}
            themedStyles={themedStyles}
          />
        )}
        
        {/* Pin Button - only show in sidebar mode */}
        {layoutMode === "sidebar" && onTogglePin && (
          <PinButton
            isPinned={isPinned || false}
            onTogglePin={onTogglePin}
            layoutMode={layoutMode}
            theme={currentTheme}
            themedStyles={themedStyles}
          />
        )}
      </div>
    </motion.div>
  );
};

export default WebsiteInfoComponent; 
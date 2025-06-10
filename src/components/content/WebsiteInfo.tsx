import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { WebsiteInfo } from "~utils/websiteInfo";
import { getWebsiteInfo, isValidFavicon } from "~utils/websiteInfo";

interface WebsiteInfoProps {
  currentTheme: "light" | "dark";
  fontSizes: {
    xs: string;
    sm: string;
    md: string;
    [key: string]: any;
  };
}

const WebsiteInfoComponent: React.FC<WebsiteInfoProps> = ({
  currentTheme,
  fontSizes
}) => {
  const [websiteInfo, setWebsiteInfo] = useState<WebsiteInfo | null>(null);
  const [faviconValid, setFaviconValid] = useState<boolean>(true);

  useEffect(() => {
    const info = getWebsiteInfo();
    setWebsiteInfo(info);

    // Check if favicon is valid
    isValidFavicon(info.favicon).then(setFaviconValid);
  }, []);

  if (!websiteInfo) return null;

  // Truncate title if too long
  const truncatedTitle = websiteInfo.title.length > 45 
    ? `${websiteInfo.title.substring(0, 42)}...` 
    : websiteInfo.title;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: '8px',
    border: `1px solid ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}`,
    marginBottom: '13px',
    fontSize: fontSizes.sm,
    color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const hostnameStyle: React.CSSProperties = {
    fontSize: fontSizes.xs,
    opacity: 0.6,
    marginLeft: '4px',
  };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
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
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={textStyle} title={websiteInfo.title}>
          {truncatedTitle}
        </div>
        <div style={hostnameStyle}>
          {websiteInfo.hostname}
        </div>
      </div>
    </motion.div>
  );
};

export default WebsiteInfoComponent; 
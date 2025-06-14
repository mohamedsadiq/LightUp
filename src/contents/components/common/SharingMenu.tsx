import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SharingMenuProps {
  onExportTxt: () => void;
  onExportMd: () => void;
  onCopyFormatted: () => void;
  onPrint: () => void;
  currentTheme: 'light' | 'dark' | 'system';
  exportingDocId: string | null;
  exportingMdId: string | null;
  richCopiedId: string | null;
  txtExportId: string;
  mdExportId: string;
  richCopyId: string;
}

export const SharingMenu: React.FC<SharingMenuProps> = ({
  onExportTxt,
  onExportMd,
  onCopyFormatted,
  onPrint,
  currentTheme,
  exportingDocId,
  exportingMdId,
  richCopiedId,
  txtExportId,
  mdExportId,
  richCopyId
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuVariants = {
    closed: {
      opacity: 0,
      scale: 0.8,
      y: -10,
      transition: {
        duration: 0.15,
        ease: "easeInOut"
      }
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Main sharing icon */}
      <motion.button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
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
          color: '#666',
          position: 'relative'
        }}
        whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        title="Export options"
      >
        {/* Sharing/Export icon */}
        <motion.svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16,6 12,2 8,6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </motion.svg>
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
                         style={{
               position: 'absolute',
               bottom: '100%',
               right: '-150px',
               marginBottom: '4px',
               backgroundColor: currentTheme === 'dark' ? '#2c2c2c' : 'white',
               border: `1px solid ${currentTheme === 'dark' ? '#444' : '#e0e0e0'}`,
               borderRadius: '12px',
               boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
               padding: '8px',
               minWidth: '180px',
               zIndex: 1000
             }}
          >
            {/* Export as TXT option */}
            <motion.button
              onClick={onExportTxt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: exportingDocId === txtExportId ? '#14742F' : (currentTheme === 'dark' ? '#fff' : '#333'),
                textAlign: 'left'
              }}
              whileHover={{ backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#f8f9fa", scale: 0.9 }}
              whileTap={{ scale: 0.8 }}
              transition={{ duration: 0.1 }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: exportingDocId === txtExportId ? '#14742F' : '#6366f1',
                borderRadius: '4px'
              }}>
                {exportingDocId === txtExportId ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="12" y1="9" x2="8" y2="9"/>
                    <circle cx="8" cy="15" r="0.5"/>
                    <circle cx="8" cy="11" r="0.5"/>
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {exportingDocId === txtExportId ? 'Exported!' : 'Text Document'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  Export as .txt file
                </div>
              </div>
            </motion.button>

            {/* Export as MD option */}
            <motion.button
              onClick={onExportMd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: exportingMdId === mdExportId ? '#14742F' : (currentTheme === 'dark' ? '#fff' : '#333'),
                textAlign: 'left'
              }}
              whileHover={{ backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#f8f9fa", scale: 0.9 }}
              whileTap={{ scale: 0.8 }}
              transition={{ duration: 0.1 }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: exportingMdId === mdExportId ? '#14742F' : '#10b981',
                borderRadius: '4px'
              }}>
                {exportingMdId === mdExportId ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
                    <path d="M7 7h10M7 12h8M7 17h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="19" cy="5" r="2" fill="white"/>
                    <path d="M18 4l1 1" stroke="green" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {exportingMdId === mdExportId ? 'Exported!' : 'Markdown'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  Export as .md file
                </div>
              </div>
            </motion.button>

            {/* Divider */}
            

            {/* Copy Formatted option */}
            <motion.button
              onClick={onCopyFormatted}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: richCopiedId === richCopyId ? '#14742F' : (currentTheme === 'dark' ? '#fff' : '#333'),
                textAlign: 'left'
              }}
              whileHover={{ backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#f8f9fa", scale: 0.9 }}
              whileTap={{ scale: 0.8 }}
              transition={{ duration: 0.1 }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: richCopiedId === richCopyId ? '#14742F' : '#f59e0b',
                borderRadius: '4px'
              }}>
                {richCopiedId === richCopyId ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <rect x="8" y="8" width="13" height="13" rx="2" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
                    <path d="m3 13-2-2V4a2 2 0 0 1 2-2h9l2 2" fill="none" stroke="white" strokeWidth="1.5"/>
                    <path d="M12 12h6M12 16h4" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                    <path d="M5 8h4M5 12h2" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                    <circle cx="18" cy="10" r="1.5" fill="white"/>
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {richCopiedId === richCopyId ? 'Copied!' : 'Copy Rich Text'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  Copy with formatting
                </div>
              </div>
            </motion.button>

            {/* Print option */}
            <motion.button
              onClick={onPrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: currentTheme === 'dark' ? '#fff' : '#333',
                textAlign: 'left'
              }}
              whileHover={{ backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#f8f9fa", scale: 0.9 }}
              whileTap={{ scale: 0.8 }}
              transition={{ duration: 0.1 }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#8b5cf6',
                borderRadius: '4px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <polyline points="6,9 6,2 18,2 18,9" fill="none" stroke="white" strokeWidth="1.5"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" fill="none" stroke="white" strokeWidth="1.5"/>
                  <rect x="6" y="14" width="12" height="8" fill="none" stroke="white" strokeWidth="1.5" rx="1"/>
                  <circle cx="6" cy="11" r="1" fill="white"/>
                  <circle cx="18" cy="11" r="1" fill="white"/>
                  <path d="M9 17h6M9 19h4" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M9 5h6" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  Print
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  Print this response
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 
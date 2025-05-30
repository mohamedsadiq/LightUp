import React from 'react';
import { THEME_COLORS } from "~utils/constants";
import type { Theme } from "~types/theme";

interface CitationReferenceProps {
  number: number;
  theme?: Theme;
  className?: string;
  onClick?: () => void;
}

const CitationReference: React.FC<CitationReferenceProps> = ({ 
  number, 
  theme = "light",
  className = "",
  onClick
}) => {
  // Normalize the theme
  const normalizedTheme: "light" | "dark" = theme === "system" ? "light" : theme;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center text-xs rounded-full ${className}`}
      style={{
        width: '16px',
        height: '16px',
        backgroundColor: THEME_COLORS[normalizedTheme].popupBackground,
        color: THEME_COLORS[normalizedTheme].text,
        border: `1px solid ${THEME_COLORS[normalizedTheme].border}`,
        fontSize: '10px',
        fontWeight: 'bold',
        position: 'relative',
        top: '-0.5em',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : -1}
      aria-label={`Citation reference ${number}`}
      role={onClick ? "button" : undefined}
    >
      {number}
    </span>
  );
};

export default React.memo(CitationReference); 
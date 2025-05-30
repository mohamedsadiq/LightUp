import React, { useEffect, useState } from 'react';
import { THEME_COLORS } from "~utils/constants";
import type { Theme } from "~types/theme";
import type { Settings } from "~types/settings";
import { Storage } from "@plasmohq/storage";

export interface ReferenceItem {
  id: number;
  content: string;
}

interface ReferencesContainerProps {
  references: ReferenceItem[];
  theme?: Theme;
  className?: string;
  fontSize?: string;
}

const ReferencesContainer: React.FC<ReferencesContainerProps> = ({
  references,
  theme = "light",
  className = "",
  fontSize
}) => {
  // Get font size from settings if not provided via props
  const [fontSizeSetting, setFontSizeSetting] = useState(fontSize || "medium");
  
  useEffect(() => {
    if (!fontSize) {
      const storage = new Storage();
      storage.get<Settings>("settings").then((settings) => {
        if (settings?.customization?.fontSize) {
          setFontSizeSetting(settings.customization.fontSize);
        }
      });
    }
  }, [fontSize]);
  
  // Convert font size setting to actual CSS values
  const getFontSize = (baseSize: string, setting: string) => {
    const sizeMap = {
      "small": {
        base: "0.75rem",   // 12px
        heading: "0.875rem", // 14px
        number: "9px"
      },
      "medium": {
        base: "0.875rem",   // 14px
        heading: "1rem",     // 16px
        number: "10px"
      },
      "large": {
        base: "1rem",       // 16px
        heading: "1.125rem", // 18px
        number: "11px"
      },
      "x-large": {
        base: "1.125rem",   // 18px
        heading: "1.25rem",  // 20px
        number: "12px"
      }
    };
    
    return sizeMap[setting as keyof typeof sizeMap]?.[baseSize as keyof (typeof sizeMap)["medium"]] || sizeMap["medium"][baseSize as keyof (typeof sizeMap)["medium"]];
  };
  // Normalize the theme
  const normalizedTheme: "light" | "dark" = theme === "system" ? "light" : theme;
  
  if (!references || references.length === 0) {
    return null;
  }

  return (
    <div 
      className={`mt-4 pt-4 ${className}`}
      style={{
        borderTop: `1px solid ${THEME_COLORS[normalizedTheme].border}`,
      }}
    >
      <h4 
        className="font-semibold mb-2"
        style={{
          color: THEME_COLORS[normalizedTheme].text,
          fontSize: getFontSize("heading", fontSizeSetting)
        }}
      >
        References
      </h4>
      <ol className="list-none p-0 m-0 space-y-2">
        {references.map((ref) => (
          <li 
            key={ref.id} 
            className="flex items-start"
            style={{
              color: THEME_COLORS[normalizedTheme].secondaryText,
              fontSize: getFontSize("base", fontSizeSetting)
            }}
          >
            <span 
              className="inline-flex items-center justify-center text-xs rounded-full mr-2 flex-shrink-0"
              style={{
                width: '18px',
                height: '18px',
                backgroundColor: THEME_COLORS[normalizedTheme].popupBackground,
                color: THEME_COLORS[normalizedTheme].text,
                border: `1px solid ${THEME_COLORS[normalizedTheme].border}`,
                fontSize: getFontSize("number", fontSizeSetting),
                fontWeight: 'bold',
                marginTop: '2px',
              }}
            >
              {ref.id}
            </span>
            <span>{ref.content}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default React.memo(ReferencesContainer); 
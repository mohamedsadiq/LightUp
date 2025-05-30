import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from "dompurify";
import { getTextDirection } from "~utils/rtl";
import EnhancedMarkdownText from './EnhancedMarkdownText';
import type { Theme } from "~types/theme";

interface MarkdownTextProps {
  text: string;
  isStreaming?: boolean;
  language?: string;
  useReferences?: boolean;
  theme?: Theme;
  fontSize?: "0.8rem" | "0.9rem" | "1rem" | "1.1rem" | "1.2rem" | "1.3rem" | "small" | "medium" | "large" | "x-large";
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  text, 
  isStreaming = false,
  language = 'en',
  useReferences = false,
  theme = 'light',
  fontSize = 'medium'
}) => {
  // Convert system theme to either light or dark
  const normalizedTheme: "light" | "dark" = theme === "system" ? "light" : theme;

  // If references are enabled, use the enhanced component
  if (useReferences) {
    return (
      <EnhancedMarkdownText
        text={text}
        isStreaming={isStreaming}
        language={language}
        theme={normalizedTheme}
        fontSize={fontSize}
      />
    );
  }

  // Original implementation for backward compatibility
  const [formattedText, setFormattedText] = useState('');
  const textDirection = getTextDirection(language);

  useEffect(() => {
    const cleanedText = text
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/>\s+</g, '><')
      .trim();
    
    const markedOptions = {
      breaks: true,
      gfm: true,
      pedantic: false,
      smartypants: true,
      highlight: function(code: string, lang: string) {
        return code;
      }
    };
    let parsed = marked.parse(cleanedText, markedOptions) as string;
    parsed = DOMPurify.sanitize(parsed);
    
    parsed = parsed
      .replace(/<p>/g, '<p class=" lu-leading-relaxed lu-mb-4">')
      .replace(/<h1>/g, '<h1 class="lu-text-3xl lu-font-bold lu-mb-6 lu-mt-8">')
      .replace(/<h2>/g, '<h2 class="lu-text-2xl lu-font-semibold lu-mb-4 lu-mt-6">')
      .replace(/<h3>/g, '<h3 class="lu-text-xl lu-font-medium lu-mb-3 lu-mt-5">')
      .replace(/<ul>/g, '<ul class="lu-list-disc lu-pl-6 lu-mb-4 lu-space-y-2">')
      .replace(/<ol>/g, '<ol class="lu-list-decimal lu-pl-6 lu-mb-4 lu-space-y-2">')
      .replace(/<li>/g, '<li class="lu-leading-relaxed">')
      .replace(/<code>/g, '<code class="lu-bg-gray-100 dark:lu-bg-gray-800 lu-px-1.5 lu-py-0.5 lu-rounded lu-text-sm lu-font-mono">')
      .replace(/<pre>/g, '<pre class="lu-bg-gray-100 dark:lu-bg-gray-800 lu-p-4 lu-rounded-lg lu-mb-4 lu-overflow-x-auto">')
      .replace(/<blockquote>/g, '<blockquote class="lu-border-l-4 lu-border-gray-300 dark:lu-border-gray-600 lu-pl-4 lu-italic lu-my-4">');
    
    setFormattedText(parsed);
  }, [text]);

  // Convert fontSize prop to CSS value
  const fontSizeMap = {
    // Enum style values
    small: "0.75rem",
    medium: "0.875rem",
    large: "1rem",
    "x-large": "1.125rem",
    // Direct CSS values (from settings)
    "0.8rem": "0.8rem",
    "0.9rem": "0.9rem",
    "1rem": "1rem",
    "1.1rem": "1.1rem",
    "1.2rem": "1.2rem",
    "1.3rem": "1.3rem"
  };

  return (
    <div 
      className="lu-prose dark:lu-prose-invert lu-max-w-none"
      style={{ 
        direction: textDirection,
        textAlign: textDirection === 'rtl' ? 'right' : 'left',
        fontSize: fontSizeMap[fontSize] || fontSizeMap.medium
      }}
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
};

export default React.memo(MarkdownText);
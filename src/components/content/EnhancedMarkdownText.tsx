import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from "dompurify";
import { getTextDirection } from "~utils/rtl";
import CitationReference from './CitationReference';
import ReferencesContainer from './ReferencesContainer';
import type { ReferenceItem } from './ReferencesContainer';
import useReferences from '~/hooks/useReferences';
import type { Theme } from "~types/theme";

interface EnhancedMarkdownTextProps {
  text: string;
  isStreaming?: boolean;
  language?: string;
  theme?: Theme;
  fontSize?: "0.8rem" | "0.9rem" | "1rem" | "1.1rem" | "1.2rem" | "1.3rem" | "small" | "medium" | "large" | "x-large";
}

const EnhancedMarkdownText: React.FC<EnhancedMarkdownTextProps> = ({ 
  text, 
  isStreaming = false,
  language = 'en',
  theme = 'light',
  fontSize
}) => {
  // Normalize theme for internal use
  const normalizedTheme: "light" | "dark" = theme === "system" ? "light" : theme;
  const [formattedText, setFormattedText] = useState('');
  const [selectedReferenceId, setSelectedReferenceId] = useState<number | null>(null);
  const textDirection = getTextDirection(language);
  const { references, addReference, clearReferences } = useReferences();

  // Process text for references and format it
  useEffect(() => {
    // Clear references when text changes
    clearReferences();

    // Clean the text
    let cleanedText = text
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/>\s+</g, '><')
      .trim();
    
    // Process references in text (format: [ref:Some reference content])
    cleanedText = cleanedText.replace(/\[ref:(.*?)\]/g, (match, content) => {
      const refId = addReference(content.trim());
      return `<span data-reference-id="${refId}" class="reference-marker"></span>`;
    });
    
    // Process markdown
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
    
    // Add styling classes
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
  }, [text, addReference, clearReferences]);

  // When the DOM is updated, replace reference markers with actual components
  useEffect(() => {
    if (!formattedText) return;

    // Find all reference markers in the content and replace them with actual CitationReference components
    const container = document.querySelector('[data-markdown-container]');
    if (!container) return;

    const refMarkers = container.querySelectorAll('.reference-marker');
    refMarkers.forEach((marker) => {
      const refId = parseInt(marker.getAttribute('data-reference-id') || '0', 10);
      if (refId <= 0) return;

      // Create reference element
      const refSpan = document.createElement('span');
      refSpan.className = 'citation-reference-wrapper';
      refSpan.setAttribute('data-reference-id', refId.toString());
      refSpan.textContent = refId.toString();
      
      // Style the reference
      refSpan.style.display = 'inline-flex';
      refSpan.style.alignItems = 'center';
      refSpan.style.justifyContent = 'center';
      refSpan.style.width = '16px';
      refSpan.style.height = '16px';
      refSpan.style.backgroundColor = theme === 'light' ? '#f7f7f7' : '#333';
      refSpan.style.color = theme === 'light' ? '#333' : '#f7f7f7';
      refSpan.style.border = `1px solid ${theme === 'light' ? '#ddd' : '#555'}`;
      refSpan.style.borderRadius = '50%';
      refSpan.style.fontSize = '10px';
      refSpan.style.fontWeight = 'bold';
      refSpan.style.position = 'relative';
      refSpan.style.top = '-0.5em';
      refSpan.style.cursor = 'pointer';
      refSpan.style.userSelect = 'none';
      
      // Add click handler
      refSpan.onclick = () => {
        setSelectedReferenceId(selectedReferenceId === refId ? null : refId);
      };
      
      // Replace the placeholder
      marker.parentNode?.replaceChild(refSpan, marker);
    });
  }, [formattedText, theme, selectedReferenceId]);

  const handleReferenceClick = (refId: number) => {
    setSelectedReferenceId(selectedReferenceId === refId ? null : refId);
  };

  // Filter references to show the selected one or all if none selected
  const visibleReferences = selectedReferenceId 
    ? references.filter(ref => ref.id === selectedReferenceId)
    : references;

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
    <div>
      <div 
        data-markdown-container
        className="lu-prose dark:lu-prose-invert lu-max-w-none"
        style={{ 
          direction: textDirection,
          textAlign: textDirection === 'rtl' ? 'right' : 'left',
          fontSize: fontSizeMap[fontSize || "medium"]
        }}
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
      
      {visibleReferences.length > 0 && (
        <ReferencesContainer 
          references={visibleReferences} 
          theme={theme}
          className="lu-mt-4"
        />
      )}
    </div>
  );
};

export default React.memo(EnhancedMarkdownText); 
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import DOMPurify from "dompurify";
import { getTextDirection } from "~utils/rtl";
import type { Theme } from "~types/theme";
import type { FontSizes } from "~contents/styles";
import ReferencesContainer from './ReferencesContainer';
import { useReferences as useReferencesHook } from '~/hooks/useReferences';

interface MarkdownTextProps {
  text: string;
  isStreaming?: boolean;
  language?: string;
  useReferences?: boolean;
  theme?: Theme;
  fontSize?: "0.8rem" | "0.9rem" | "1rem" | "1.1rem" | "1.2rem" | "1.3rem" | "0.875rem" | "1.125rem" | "small" | "medium" | "large" | "x-large" | "xx-small" | "x-small" | "xx-large";
  fontSizes?: FontSizes;
}

// Micromark configuration options
const micromarkOptions = {
  extensions: [gfm()],
  htmlExtensions: [gfmHtml()],
  allowDangerousHtml: false
};

// Create font sizes from user setting - this should match the existing system
const createFontSizesFromSetting = (fontSize: string): FontSizes => {
  const parseSize = (size: string): number => {
    if (size === "x-small") return 0.8;
    if (size === "small") return 0.9;
    if (size === "medium") return 1.0;
    if (size === "large") return 1.15;
    if (size === "x-large") return 1.3;
    if (size === "xx-large") return 1.45;
    
    // Handle rem values
    const match = size.match(/^([\d.]+)rem$/);
    if (match) return parseFloat(match[1]);
    
    return 1.0;
  };

  const baseSize = parseSize(fontSize);
  
  return {
    base: `${baseSize}rem`,
    xs: `${Math.max(0.6, baseSize * 0.75)}rem`,
    sm: `${Math.max(0.7, baseSize * 0.85)}rem`,
    md: `${baseSize}rem`,
    lg: `${baseSize * 1.15}rem`,
    xl: `${baseSize * 1.3}rem`,
    xxl: `${baseSize * 1.5}rem`,
    button: `${Math.max(0.8, baseSize * 0.9)}rem`,
    input: `${Math.max(0.8, baseSize * 0.9)}rem`,
    loading: `${Math.max(0.75, baseSize * 0.8)}rem`,
    model: `${Math.max(0.7, baseSize * 0.75)}rem`,
    icon: `${Math.max(0.7, baseSize * 0.7)}rem`,
    welcome: {
      emoji: `${baseSize * 1.8}rem`,
      heading: `${baseSize * 1.2}rem`,
      description: `${Math.max(0.8, baseSize * 0.9)}rem`
    },
    connection: `${Math.max(0.7, baseSize * 0.75)}rem`,
    error: `${Math.max(0.8, baseSize * 0.85)}rem`
  };
};

// CSS styles using the proper size system
const getStyles = (theme: "light" | "dark", fontSizes: FontSizes) => ({
  paragraph: {
    lineHeight: '1.625',
    marginBottom: '1rem',
    margin: '0 0 1rem 0'
  },
  h1: {
    fontSize: fontSizes.xxl, // Use xxl for h1 (1.5x base)
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    marginTop: '2rem',
    lineHeight: '1.2'
  },
  h2: {
    fontSize: fontSizes.xl, // Use xl for h2 (1.3x base)
    fontWeight: '600',
    marginBottom: '1rem',
    marginTop: '1.5rem',
    lineHeight: '1.3'
  },
  h3: {
    fontSize: fontSizes.lg, // Use lg for h3 (1.15x base)
    fontWeight: '500',
    marginBottom: '0.75rem',
    marginTop: '1.25rem',
    lineHeight: '1.4'
  },
  ul: {
    listStyleType: 'disc',
    paddingLeft: '1.5rem',
    marginBottom: '1rem',
    lineHeight: '1.625'
  },
  ol: {
    listStyleType: 'decimal',
    paddingLeft: '1.5rem',
    marginBottom: '1rem',
    lineHeight: '1.625'
  },
  li: {
    lineHeight: '1.625',
    marginBottom: '0.5rem'
  },
  code: {
    backgroundColor: theme === 'light' ? '#f5f5f5' : '#2d2d2d',
    color: theme === 'light' ? '#333' : '#f5f5f5',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontSize: fontSizes.sm, // Use sm for inline code
    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  },
  pre: {
    backgroundColor: theme === 'light' ? '#f5f5f5' : '#2d2d2d',
    color: theme === 'light' ? '#333' : '#f5f5f5',
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    overflowX: 'auto' as const,
    fontSize: fontSizes.sm, // Use sm for code blocks
    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  },
  blockquote: {
    borderLeft: `4px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
    paddingLeft: '1rem',
    fontStyle: 'italic',
    margin: '1rem 0',
    color: theme === 'light' ? '#6b7280' : '#9ca3af'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    margin: '1rem 0',
    border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
    borderRadius: '0.375rem',
    overflow: 'hidden'
  },
  thead: {
    backgroundColor: theme === 'light' ? '#f9fafb' : '#374151'
  },
  tbody: {
    backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937'
  },
  tr: {
    borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left' as const,
    fontWeight: '600',
    fontSize: fontSizes.sm,
    color: theme === 'light' ? '#374151' : '#f3f4f6',
    borderRight: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`
  },
  td: {
    padding: '0.75rem 1rem',
    fontSize: fontSizes.sm,
    color: theme === 'light' ? '#6b7280' : '#d1d5db',
    borderRight: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`
  }
});

const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  text, 
  isStreaming = false,
  language = 'en',
  useReferences = false,
  theme = 'light',
  fontSize = 'medium',
  fontSizes: propFontSizes
}) => {
  // Convert system theme to either light or dark
  const normalizedTheme: "light" | "dark" = theme === "system" ? "light" : theme;

  // Create font sizes from the fontSize prop if fontSizes not provided
  const fontSizes = useMemo(() => 
    propFontSizes || createFontSizesFromSetting(fontSize), 
    [propFontSizes, fontSize]
  );

  // References state - only used when useReferences is true
  const [selectedReferenceId, setSelectedReferenceId] = useState<number | null>(null);
  const { references, addReference, clearReferences } = useReferencesHook();

  // Memoize text direction calculation
  const textDirection = useMemo(() => getTextDirection(language), [language]);

  // Memoize styles based on theme and font sizes
  const styles = useMemo(() => getStyles(normalizedTheme, fontSizes), [normalizedTheme, fontSizes]);

  // Memoize text processing to avoid expensive operations on every render
  const formattedText = useMemo(() => {
    if (!text) return '';
    
    let cleanedText = text
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/>\s+</g, '><')
      .trim();
    
    // Process references in text if enabled (format: [ref:Some reference content])
    if (useReferences) {
      cleanedText = cleanedText.replace(/\[ref:(.*?)\]/g, (match, content) => {
        const refId = addReference(content.trim());
        return `<span data-reference-id="${refId}" class="reference-marker"></span>`;
      });
    }
    
    let parsed = micromark(cleanedText, micromarkOptions) as string;
    parsed = DOMPurify.sanitize(parsed);
    
    // Apply inline styles using the proper size system
    return parsed
      .replace(/<p>/g, `<p style="line-height: ${styles.paragraph.lineHeight}; margin-bottom: ${styles.paragraph.marginBottom}; margin: ${styles.paragraph.margin};">`)
      .replace(/<h1>/g, `<h1 style="font-size: ${styles.h1.fontSize}; font-weight: ${styles.h1.fontWeight}; margin-bottom: ${styles.h1.marginBottom}; margin-top: ${styles.h1.marginTop}; line-height: ${styles.h1.lineHeight};">`)
      .replace(/<h2>/g, `<h2 style="font-size: ${styles.h2.fontSize}; font-weight: ${styles.h2.fontWeight}; margin-bottom: ${styles.h2.marginBottom}; margin-top: ${styles.h2.marginTop}; line-height: ${styles.h2.lineHeight};">`)
      .replace(/<h3>/g, `<h3 style="font-size: ${styles.h3.fontSize}; font-weight: ${styles.h3.fontWeight}; margin-bottom: ${styles.h3.marginBottom}; margin-top: ${styles.h3.marginTop}; line-height: ${styles.h3.lineHeight};">`)
      .replace(/<ul>/g, `<ul style="list-style-type: ${styles.ul.listStyleType}; padding-left: ${styles.ul.paddingLeft}; margin-bottom: ${styles.ul.marginBottom}; line-height: ${styles.ul.lineHeight};">`)
      .replace(/<ol>/g, `<ol style="list-style-type: ${styles.ol.listStyleType}; padding-left: ${styles.ol.paddingLeft}; margin-bottom: ${styles.ol.marginBottom}; line-height: ${styles.ol.lineHeight};">`)
      .replace(/<li>/g, `<li style="line-height: ${styles.li.lineHeight}; margin-bottom: ${styles.li.marginBottom};">`)
      .replace(/<code>/g, `<code style="background-color: ${styles.code.backgroundColor}; color: ${styles.code.color}; padding: ${styles.code.padding}; border-radius: ${styles.code.borderRadius}; font-size: ${styles.code.fontSize}; font-family: ${styles.code.fontFamily};">`)
      .replace(/<pre>/g, `<pre style="background-color: ${styles.pre.backgroundColor}; color: ${styles.pre.color}; padding: ${styles.pre.padding}; border-radius: ${styles.pre.borderRadius}; margin-bottom: ${styles.pre.marginBottom}; overflow-x: ${styles.pre.overflowX}; font-size: ${styles.pre.fontSize}; font-family: ${styles.pre.fontFamily};">`)
      .replace(/<blockquote>/g, `<blockquote style="border-left: ${styles.blockquote.borderLeft}; padding-left: ${styles.blockquote.paddingLeft}; font-style: ${styles.blockquote.fontStyle}; margin: ${styles.blockquote.margin}; color: ${styles.blockquote.color};">`)
      .replace(/<table>/g, `<table style="width: ${styles.table.width}; border-collapse: ${styles.table.borderCollapse}; margin: ${styles.table.margin}; border: ${styles.table.border}; border-radius: ${styles.table.borderRadius}; overflow: ${styles.table.overflow};">`)
      .replace(/<thead>/g, `<thead style="background-color: ${styles.thead.backgroundColor};">`)
      .replace(/<tbody>/g, `<tbody style="background-color: ${styles.tbody.backgroundColor};">`)
      .replace(/<tr>/g, `<tr style="border-bottom: ${styles.tr.borderBottom};">`)
      .replace(/<th>/g, `<th style="padding: ${styles.th.padding}; text-align: ${styles.th.textAlign}; font-weight: ${styles.th.fontWeight}; font-size: ${styles.th.fontSize}; color: ${styles.th.color}; border-right: ${styles.th.borderRight};">`)
      .replace(/<td>/g, `<td style="padding: ${styles.td.padding}; font-size: ${styles.td.fontSize}; color: ${styles.td.color}; border-right: ${styles.td.borderRight};">`);
  }, [text, styles, useReferences, addReference]);

  // Clear references when text changes (only if using references)
  useEffect(() => {
    if (useReferences) {
      clearReferences();
    }
  }, [text, useReferences, clearReferences]);

  // Handle reference markers replacement (only when using references)
  useEffect(() => {
    if (!useReferences || !formattedText) return;

    // Find all reference markers in the content and replace them with actual components
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
      refSpan.style.backgroundColor = normalizedTheme === 'light' ? '#f7f7f7' : '#333';
      refSpan.style.color = normalizedTheme === 'light' ? '#333' : '#f7f7f7';
      refSpan.style.border = `1px solid ${normalizedTheme === 'light' ? '#ddd' : '#555'}`;
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
  }, [formattedText, normalizedTheme, selectedReferenceId, useReferences]);

  // Filter references to show the selected one or all if none selected
  const visibleReferences = selectedReferenceId 
    ? references.filter(ref => ref.id === selectedReferenceId)
    : references;

  // Memoize the container style object
  const containerStyle = useMemo(() => ({
    direction: textDirection as 'rtl' | 'ltr',
    textAlign: (textDirection === 'rtl' ? 'right' : 'left') as 'right' | 'left',
    fontSize: fontSizes.base, // Use the base font size from the size system
    maxWidth: 'none',
    color: normalizedTheme === 'light' ? '#333' : '#f5f5f5',
    lineHeight: '1.625'
  }), [textDirection, fontSizes.base, normalizedTheme]);

  const referencesContainerStyle = {
    marginTop: '1rem'
  };

  return (
    <div>
      <div 
        data-markdown-container
        style={containerStyle}
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
      
      {/* Only show references if useReferences is enabled and there are visible references */}
      {useReferences && visibleReferences.length > 0 && (
        <div style={referencesContainerStyle}>
          <ReferencesContainer 
            references={visibleReferences} 
            theme={theme}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(MarkdownText);
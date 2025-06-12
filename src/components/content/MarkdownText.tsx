import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
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

// Create font sizes from user setting
const createFontSizesFromSetting = (fontSize: string): FontSizes => {
  const parseSize = (size: string): number => {
    if (size === "x-small") return 0.8;
    if (size === "small") return 0.9;
    if (size === "medium") return 1.0;
    if (size === "large") return 1.15;
    if (size === "x-large") return 1.3;
    if (size === "xx-large") return 1.45;
    
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

const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  text, 
  isStreaming = false,
  language = 'en',
  useReferences = false,
  theme = 'light',
  fontSize = 'medium',
  fontSizes: propFontSizes
}) => {
  const normalizedTheme: "light" | "dark" = theme === "system" ? "light" : theme;
  const fontSizes = useMemo(() => 
    propFontSizes || createFontSizesFromSetting(fontSize), 
    [propFontSizes, fontSize]
  );

  const { references, addReference, clearReferences } = useReferencesHook();
  const textDirection = useMemo(() => getTextDirection(language), [language]);

  const processedText = useMemo(() => {
    if (!text) return '';
    
    let cleanedText = text
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/>\s+</g, '><')
      .trim();
    
    if (useReferences) {
      cleanedText = cleanedText.replace(/\[ref:(.*?)\]/g, (match, content) => {
        const refId = addReference(content.trim());
        return `<sup data-reference-id="${refId}">${refId}</sup>`;
      });
    }
    
    return cleanedText;
  }, [text, useReferences, addReference]);

  const components = useMemo(() => ({
    p: ({ children, ...props }: any) => (
      <p
        style={{
          lineHeight: '1.625',
          marginBottom: '1rem',
          margin: '0 0 1rem 0',
          fontSize: fontSizes.base,
          color: normalizedTheme === 'light' ? '#333' : '#f5f5f5'
        }}
        {...props}
      >
        {children}
      </p>
    ),
    h1: ({ children, ...props }: any) => (
      <h1
        style={{
          fontSize: fontSizes.xxl,
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          marginTop: '2rem',
          lineHeight: '1.2',
          color: normalizedTheme === 'light' ? '#1a1a1a' : '#ffffff',
          borderBottom: `2px solid ${normalizedTheme === 'light' ? '#e5e7eb' : '#374151'}`,
          paddingBottom: '0.5rem'
        }}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2
        style={{
          fontSize: fontSizes.xl,
          fontWeight: '600',
          marginBottom: '1rem',
          marginTop: '1.5rem',
          lineHeight: '1.3',
          color: normalizedTheme === 'light' ? '#1a1a1a' : '#ffffff'
        }}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3
        style={{
          fontSize: fontSizes.lg,
          fontWeight: '500',
          marginBottom: '0.75rem',
          marginTop: '1.25rem',
          lineHeight: '1.4',
          color: normalizedTheme === 'light' ? '#1a1a1a' : '#ffffff'
        }}
        {...props}
      >
        {children}
      </h3>
    ),
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        style={{
          color: normalizedTheme === 'light' ? '#2563eb' : '#60a5fa',
          textDecoration: 'none',
          fontWeight: '500',
          borderBottom: `1px solid ${normalizedTheme === 'light' ? '#93c5fd' : '#3b82f6'}`,
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget as HTMLAnchorElement;
          target.style.backgroundColor = normalizedTheme === 'light' ? '#eff6ff' : '#1e3a8a';
          target.style.borderBottomColor = normalizedTheme === 'light' ? '#2563eb' : '#60a5fa';
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget as HTMLAnchorElement;
          target.style.backgroundColor = 'transparent';
          target.style.borderBottomColor = normalizedTheme === 'light' ? '#93c5fd' : '#3b82f6';
        }}
        {...props}
      >
        {children}
      </a>
    ),
    code: ({ inline, children, className, ...props }: any) => {
      if (inline) {
        return (
          <code
            style={{
              backgroundColor: normalizedTheme === 'light' ? '#f1f5f9' : '#334155',
              color: normalizedTheme === 'light' ? '#e11d48' : '#fbbf24',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              fontSize: fontSizes.sm,
              fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              border: `1px solid ${normalizedTheme === 'light' ? '#e2e8f0' : '#475569'}`
            }}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          style={{
            fontSize: fontSizes.sm,
            fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            color: normalizedTheme === 'light' ? '#334155' : '#e2e8f0'
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: any) => (
      <pre
        style={{
          backgroundColor: normalizedTheme === 'light' ? '#f8fafc' : '#1e293b',
          color: normalizedTheme === 'light' ? '#334155' : '#e2e8f0',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          overflowX: 'auto',
          border: `1px solid ${normalizedTheme === 'light' ? '#e2e8f0' : '#475569'}`,
          fontSize: fontSizes.sm,
          fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }}
        {...props}
      >
        {children}
      </pre>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote
        style={{
          borderLeft: `4px solid ${normalizedTheme === 'light' ? '#3b82f6' : '#60a5fa'}`,
          paddingLeft: '1rem',
          fontStyle: 'italic',
          margin: '1rem 0',
          color: normalizedTheme === 'light' ? '#6b7280' : '#9ca3af',
          backgroundColor: normalizedTheme === 'light' ? '#f8fafc' : '#1f2937',
          padding: '1rem',
          borderRadius: '0 0.5rem 0.5rem 0'
        }}
        {...props}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }: any) => (
      <ul
        style={{
          listStyleType: 'disc',
          paddingLeft: '1.5rem',
          marginBottom: '1rem',
          lineHeight: '1.625'
        }}
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol
        style={{
          listStyleType: 'decimal',
          paddingLeft: '1.5rem',
          marginBottom: '1rem',
          lineHeight: '1.625'
        }}
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li
        style={{
          lineHeight: '1.625',
          marginBottom: '0.5rem'
        }}
        {...props}
      >
        {children}
      </li>
    )
  }), [normalizedTheme, fontSizes]);

  const containerStyle = useMemo(() => ({
    direction: textDirection as 'rtl' | 'ltr',
    textAlign: (textDirection === 'rtl' ? 'right' : 'left') as 'right' | 'left',
    fontSize: fontSizes.base,
    maxWidth: 'none',
    color: normalizedTheme === 'light' ? '#333' : '#f5f5f5',
    lineHeight: '1.625'
  }), [textDirection, fontSizes.base, normalizedTheme]);

  React.useEffect(() => {
    if (useReferences) {
      clearReferences();
    }
  }, [text, useReferences, clearReferences]);

  const visibleReferences = references;

  return (
    <div>
      <div 
        data-markdown-container
        style={containerStyle}
      >
        <ReactMarkdown
          components={components}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
        >
          {processedText}
        </ReactMarkdown>
      </div>
      
      {useReferences && visibleReferences.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
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
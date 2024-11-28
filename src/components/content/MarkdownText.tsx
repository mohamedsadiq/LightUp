import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import { motion } from 'framer-motion';

interface MarkdownTextProps {
  text: string;
  isStreaming?: boolean;
}

const styles = {
  container: {
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
    lineHeight: 1.7,
    color: '#1a1a1a',
  },
  paragraph: {
    fontSize: '13px',
    margin: '1rem 0',
    lineHeight: 1.7,
  },
  heading1: {
    fontSize: '1.875rem',
    fontWeight: 600,
    color: '#111111',
    margin: '1.5rem 0 1rem',
  },
  heading2: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#111111',
    margin: '1.5rem 0 1rem',
  },
  heading3: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111111',
    margin: '1.5rem 0 1rem',
  },
  heading4: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#111111',
    margin: '1.5rem 0 1rem',
  },
  code: {
    backgroundColor: '#f3f4f6',
    padding: '0.2em 0.4em',
    borderRadius: '0.25rem',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '0.875em',
    color: '#ef4444',
  },
  pre: {
    backgroundColor: '#f8fafc',
    padding: '1rem',
    borderRadius: '0.5rem',
    overflow: 'auto' as const,
    border: '1px solid #e2e8f0',
  },
  preCode: {
    backgroundColor: 'transparent',
    padding: 0,
    color: '#334155',
  },
  blockquote: {
    borderLeft: '4px solid #e2e8f0',
    paddingLeft: '1rem',
    color: '#4b5563',
    fontStyle: 'italic' as const,
    margin: '1rem 0',
  },
  list: {
    paddingLeft: '1.5rem',
    margin: '1rem 0',
    listStylePosition: 'outside' as const,
  },
  unorderedList: {
    listStyle: 'disc outside' as const,
  },
  orderedList: {
    listStyle: 'decimal outside' as const,
  },
  listItem: {
    margin: '0.25rem 0',
    paddingLeft: '0.5rem',
    lineHeight: 1.7,
  },
  nestedList: {
    marginTop: '0.5rem',
    marginLeft: '1.5rem',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  linkHover: {
    textDecoration: 'underline',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '1.5rem 0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    margin: '1rem 0',
  },
  tableCell: {
    border: '1px solid #e2e8f0',
    padding: '0.5rem',
    textAlign: 'left' as const,
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 600,
  },
};

const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  text, 

  isStreaming = false 
}) => {
  const [formattedText, setFormattedText] = useState('');

  useEffect(() => {
    marked.setOptions({
      breaks: false,
      gfm: true,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: true,
      highlight: function(code, lang) {
        return code;
      }
    });

    const cleanedText = text
      .replace(/\n\s*\n/g, '\n')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/>\s+</g, '><')
      .trim();
    
    let parsed = marked.parse(cleanedText) as string;
    parsed = parsed
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/>\s+</g, '><')
      .replace(/<p>/g, `<p style="margin: 1rem 0; line-height: 1.7;">`)
      .replace(/<h1>/g, `<h1 style="font-size: 1.875rem; font-weight: 600; color: #111111; margin: 1.5rem 0 1rem;">`)
      .replace(/<h2>/g, `<h2 style="font-size: 1.5rem; font-weight: 600; color: #111111; margin: 1.5rem 0 1rem;">`)
      .replace(/<h3>/g, `<h3 style="font-size: 1.25rem; font-weight: 600; color: #111111; margin: 1.5rem 0 1rem;">`)
      .replace(/<ul>/g, `<ul style="list-style: disc outside; padding-left: 1.5rem; margin: 1rem 0;">`)
      .replace(/<ol>/g, `<ol style="list-style: decimal outside; padding-left: 1.5rem; margin: 1rem 0;">`)
      .replace(/<li>/g, `<li style="margin: 0.25rem 0; padding-left: 0.5rem; line-height: 1.7;">`)
      .replace(/<strong>/g, `<strong style="margin: 0 0.2rem;">`);

    setFormattedText(parsed);
  }, [text]);


    const parsed = marked.parse(text.trim());
    
    // Apply styles to HTML elements
  //   const styledHtml = parsed
  //     .replace(/<p>/g, `<p style="margin: 1rem 0; line-height: 1.7;">`)
  //     .replace(/<h1>/g, `<h1 style="font-size: 1.875rem; font-weight: 600; color: #111111; margin: 1.5rem 0 1rem;">`)
  //     .replace(/<h2>/g, `<h2 style="font-size: 1.5rem; font-weight: 600; color: #111111; margin: 1.5rem 0 1rem;">`)
  //     .replace(/<h3>/g, `<h3 style="font-size: 1.25rem; font-weight: 600; color: #111111; margin: 1.5rem 0 1rem;">`)
  //     .replace(/<ul>/g, `<ul style="list-style: disc outside; padding-left: 1.5rem; margin: 1rem 0;">`)
  //     .replace(/<ol>/g, `<ol style="list-style: decimal outside; padding-left: 1.5rem; margin: 1rem 0;">`)
  //     .replace(/<li>/g, `<li style="margin: 0.25rem 0; padding-left: 0.5rem; line-height: 1.7;">`);
    
  //   setFormattedText(styledHtml);
  // }, [text]);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      style={styles.container}
      className={isStreaming ? 'streaming-text' : ''}
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
};

export default React.memo(MarkdownText);
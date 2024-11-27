import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import { motion } from 'framer-motion';
import { markdownStyles } from '../../styles/MarkdownText';

interface MarkdownTextProps {
  text: string;
  style?: React.CSSProperties;
  isStreaming?: boolean;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  text, 
  style,
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
      .replace(/>\s+</g, '><');

    setFormattedText(parsed);
  }, [text]);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      style={{
        ...markdownStyles,
      
      }}
      className={isStreaming ? 'streaming-text' : ''}
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
};

export default React.memo(MarkdownText);
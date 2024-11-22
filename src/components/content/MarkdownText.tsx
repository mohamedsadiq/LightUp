import React from 'react';
import { marked } from 'marked';

marked.setOptions({ async: false });

interface MarkdownTextProps {
  text: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ text }) => {
  const formattedText = marked.parse(text) as string;

  return (
    <div
      dangerouslySetInnerHTML={{ __html: formattedText }}
      style={{ lineHeight: '1.7em', whiteSpace: 'normal' }}
    />
  );
};

export default MarkdownText;
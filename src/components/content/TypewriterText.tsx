import React, { useState, useEffect } from 'react';
import { marked } from 'marked';

marked.setOptions({ async: false });

interface TypewriterTextProps {
  text: string;
  speed?: number;
  stopAnimation?: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 20,
  stopAnimation = false
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [previousText, setPreviousText] = useState(text);

  useEffect(() => {
    // If text hasn't changed, don't reset
    if (text === previousText && isAnimationComplete) return;
    
    setPreviousText(text);
    setDisplayedText('');
    setIsAnimationComplete(false);
    
    if (stopAnimation) {
      const formattedText = (marked.parse(text) as string);
      setDisplayedText(formattedText);
      setIsAnimationComplete(true);
      return;
    }

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        const formattedText = (marked.parse(text.substring(0, currentIndex + 1)) as string);
        setDisplayedText(formattedText);
        currentIndex++;
      } else {
        clearInterval(intervalId);
        setIsAnimationComplete(true);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, stopAnimation]);

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: displayedText }} 
      style={{ 
        lineHeight: '1.7em',
        whiteSpace: 'normal'
      }} 
    />
  );
};

export default TypewriterText;
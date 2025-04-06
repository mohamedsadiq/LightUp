import { motion } from "framer-motion";
import DOMPurify from "dompurify";

interface AnimatedTextProps {
  text: string;
  className?: string;
  speed?: number; // Speed multiplier: 1 is normal, 2 is twice as fast, 0.5 is half speed
}

export const AnimatedText = ({ 
  text, 
  className = "",
  speed = 120 // default speed increased from 60 to 120 for faster display
}: AnimatedTextProps) => {
  // Calculate base timing values adjusted by speed
  const baseDuration = 3.5 / speed; // Reduced from 6.75 to 3.5
  const baseDelay = 0.05 / speed; // Reduced from 0.1 to 0.05

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = DOMPurify.sanitize(text);
  
  const textNodes = Array.from(tempDiv.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6'))
    .map(node => ({
      text: node.textContent || "",
      tag: node.tagName.toLowerCase(),
      className: node.getAttribute('style') || ""
    }));

  let totalWordsBefore = 0;
  
  return (
    <div className={className}>
      {textNodes.map((node, nodeIndex) => {
        const words = node.text.split(" ");
        const Element = node.tag as keyof JSX.IntrinsicElements;
        const currentNodeDelay = totalWordsBefore * baseDelay;
        
        const result = (
          <Element key={nodeIndex} style={{ margin: '1rem 0', lineHeight: 1.7 }}>
            {words.map((word, index) => (
              <motion.span
                key={`${nodeIndex}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ 
                  duration: baseDuration, 
                  delay: currentNodeDelay + (index * baseDelay) 
                }}
                className="inline-block"
              >
                {word}
                {index < words.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </Element>
        );
        
        totalWordsBefore += words.length;
        return result;
      })}
    </div>
  );
}; 
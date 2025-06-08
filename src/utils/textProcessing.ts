export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  
  const halfLength = Math.floor(maxLength / 2);
  const start = text.slice(0, halfLength);
  const end = text.slice(-halfLength);
  
  return `${start}...${end}`;
};

export const stripHtml = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

/**
 * Advanced text cleaning for translation mode
 * Removes script content, metadata, and other unwanted elements that can interfere with translation
 */
export const cleanTextForTranslation = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // Remove Next.js and React-specific content
  cleaned = cleaned
    // Remove Next.js props and config objects
    .replace(/\{"props":\{[^}]*\}[^}]*\}/g, '')
    .replace(/window\.__NEXT_DATA__\s*=\s*\{[^}]*\}/g, '')
    .replace(/\{"page":"[^"]*","query":\{[^}]*\}[^}]*\}/g, '')
    
    // Remove analytics and tracking scripts
    .replace(/window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\]\s*;?/g, '')
    .replace(/function\s+gtag\(\)\s*\{[^}]*\}/g, '')
    .replace(/gtag\([^)]*\)\s*;?/g, '')
    .replace(/ga\([^)]*\)\s*;?/g, '')
    .replace(/fbq\([^)]*\)\s*;?/g, '')
    
    // Remove Google Analytics and other tracking IDs
    .replace(/['"]G-[A-Z0-9]{10}['"]/g, '')
    .replace(/['"]UA-[0-9]{4,9}-[0-9]{1,4}['"]/g, '')
    .replace(/['"]GTM-[A-Z0-9]{7}['"]/g, '')
    
    // Remove JavaScript function definitions and calls
    .replace(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g, '')
    .replace(/\w+\(\s*\);\s*/g, '')
    .replace(/console\.[a-z]+\([^)]*\)\s*;?/g, '')
    
    // Remove JSON-like structures that aren't content
    .replace(/\{[^{}]*"[^"]*":[^{}]*\}/g, '')
    .replace(/\[[^\[\]]*"[^"]*"[^\[\]]*\]/g, '')
    
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    
    // Remove style tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    
    // Remove data attributes content
    .replace(/data-[a-z-]+=["'][^"']*["']/gi, '')
    
    // Remove build IDs and technical strings
    .replace(/buildId:\s*["'][^"']*["']/g, '')
    .replace(/nextExport:\s*(?:true|false)/g, '')
    .replace(/autoExport:\s*(?:true|false)/g, '')
    .replace(/isFallback:\s*(?:true|false)/g, '')
    
    // Remove localization objects
    .replace(/locale:\s*["'][^"']*["']/g, '')
    .replace(/locales:\s*\[[^\]]*\]/g, '')
    .replace(/defaultLocale:\s*["'][^"']*["']/g, '')
    
    // Remove script loader references
    .replace(/scriptLoader:\s*\{[^}]*\}/g, '')
    
    // Remove common UI text that shouldn't be translated
    .replace(/\b(?:Skip to content|Menu|Search|Login|Sign in|Sign up|Home|About|Contact|Privacy Policy|Terms of Service)\b/gi, '')
    
    // Remove social media and sharing text
    .replace(/\b(?:Share on|Tweet|Like|Follow|Subscribe|Comment|Reply)\b/gi, '')
    
    // Remove common navigation and UI elements
    .replace(/\b(?:Previous|Next|Back|Forward|Close|Open|Show|Hide|More|Less|Load more|Read more)\b/gi, '')
    
    // Remove cookie and privacy notices
    .replace(/\b(?:This website uses cookies|Accept all cookies|Cookie policy|Privacy policy|GDPR|Accept|Decline)\b/gi, '')
    
    // Remove timestamps and technical IDs
    .replace(/\b\d{10,13}\b/g, '') // Unix timestamps
    .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, '') // UUIDs
    .replace(/\b[A-Z0-9]{20,}\b/g, '') // Long technical IDs
    
    // Clean up whitespace and formatting
    .replace(/\s*\n\s*\n\s*/g, '\n\n') // Normalize paragraph breaks
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .replace(/^\s+|\s+$/gm, '') // Trim lines
    .trim();

  // Final check: if the text looks like pure technical content, return empty string
  const technicalIndicators = [
    'props', 'pageProps', 'buildId', 'nextExport', 'window.dataLayer', 'gtag',
    'function()', 'console.log', '__NEXT_DATA__'
  ];
  
  const lowerCleaned = cleaned.toLowerCase();
  const technicalCount = technicalIndicators.filter(indicator => 
    lowerCleaned.includes(indicator.toLowerCase())
  ).length;
  
  // If more than 2 technical indicators are present and text is short, likely not user content
  if (technicalCount >= 2 && cleaned.length < 200) {
    return '';
  }

  return cleaned;
};

/**
 * General text cleaning for all modes
 * Less aggressive than translation cleaning but still removes obvious non-content
 */
export const cleanTextGeneral = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  return text
    // Remove script and style content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    
    // Remove obvious analytics
    .replace(/gtag\([^)]*\)\s*;?/g, '')
    .replace(/ga\([^)]*\)\s*;?/g, '')
    
    // Clean up whitespace
    .replace(/\s*\n\s*\n\s*/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
};

/**
 * Clean text based on the processing mode
 */
export const cleanTextForMode = (text: string, mode?: string): string => {
  if (!text) return '';
  
  switch (mode) {
    case 'translate':
      return cleanTextForTranslation(text);
    default:
      return cleanTextGeneral(text);
  }
}; 
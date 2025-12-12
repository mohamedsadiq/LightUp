import { Readability } from '@mozilla/readability';
import type { ProcessingMode } from './contentProcessor';
import { processContent } from './contentProcessor';

/**
 * Content extractor using Mozilla Readability for high-quality page content extraction.
 * This implementation filters out navigation bars, UI chrome elements, and other non-content areas
 * to provide a cleaner reading experience with mode-aware optimization.
 */

/**
 * Detect if an element is likely to be UI chrome rather than main content
 * @param element - DOM element to check
 * @returns boolean indicating if element is likely UI chrome
 */
export const isUIElement = (element: Element): boolean => {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const className = (element.className || '').toLowerCase();
  const id = (element.id || '').toLowerCase();
  
  // Check for common UI element tags
  const uiTags = ['nav', 'header', 'footer', 'aside', 'menu'];
  if (uiTags.includes(tagName)) return true;
  
  // Check for common class/id patterns for UI elements
  const uiPatterns = [
    'nav', 'navigation', 'menu', 'header', 'footer', 'sidebar', 
    'toolbar', 'tab', 'banner', 'cookie', 'popup', 'modal', 
    'drawer', 'notification'
  ];
  
  // Check if any pattern is in the class or id
  return uiPatterns.some(pattern => 
    className.includes(pattern) || id.includes(pattern)
  );
};

/**
 * Get mode-specific extraction configuration
 * @param mode - The processing mode (explain, summarize, analyze, translate, free)
 * @returns Configuration object for enhanced extraction
 */
const getModeExtractionConfig = (mode?: string) => {
  const configs = {
    summarize: {
      includeHeadings: true,
      includeMetadata: true,
      preserveStructure: true,
      includeTitle: true,
      removeDataAttributes: true,
      removeEmptyNodes: true,
      additionalSelectors: [
        '.summary', '.abstract', '.highlight', '.key-points',
        '.tldr', '.executive-summary', '.conclusion'
      ]
    },
    analyze: {
      includeHeadings: true,
      includeMetadata: true,
      preserveStructure: true,
      includeTitle: true,
      removeDataAttributes: true,
      removeEmptyNodes: true,
      additionalSelectors: [
        '.data', '.statistics', '.chart', '.graph', '.table',
        '.analysis', '.findings', '.results', '.insights'
      ]
    },
    explain: {
      includeHeadings: true,
      includeMetadata: true,
      preserveStructure: true,
      includeTitle: true,
      removeDataAttributes: true,
      removeEmptyNodes: true,
      additionalSelectors: [
        '.definition', '.explanation', '.example', '.tutorial',
        '.steps', '.how-to', '.guide', '.instruction'
      ]
    },
    translate: {
      includeHeadings: false, // Less structural noise for translation
      includeMetadata: false,
      preserveStructure: false, // Focus on pure text content
      includeTitle: true,
      removeDataAttributes: true,
      removeEmptyNodes: true,
      additionalSelectors: [
        '.content', '.text', '.article-body', '.post-content'
      ]
    },
    free: {
      includeHeadings: true,
      includeMetadata: true,
      preserveStructure: true,
      includeTitle: true,
      removeDataAttributes: true,
      removeEmptyNodes: true,
      additionalSelectors: []
    }
  };

  return configs[mode as keyof typeof configs] || configs.free;
};

/**
 * Extract content from a document using Mozilla Readability with mode-aware optimization
 * @param doc - Document to extract content from
 * @param mode - The processing mode for optimization
 * @returns Extracted text content optimized for the specific mode
 */
export const extractWithReadability = (doc: Document, mode?: string): string => {
  try {
    const config = getModeExtractionConfig(mode);
    
    // Create a clean document clone for Readability processing
    const docClone = doc.cloneNode(true) as Document;
    
    // Pre-process document to enhance Readability's effectiveness
    // Remove obvious UI elements before Readability processing
    const elementsToRemove = [
      // Navigation and header elements
      'nav', 'header', 'footer', 'aside', 
      // Common UI class names
      '.navigation', '.menu', '.sidebar', '.ads', '.comments', '.related', '.social',
      '.navbar', '.topbar', '.footer', '.header', '.cookie-banner', '.popup',
      // Common UI IDs
      '#navigation', '#menu', '#header', '#footer', '#sidebar', '#nav', 
      '#comments', '#related', '#social-links', '#cookie-notice',
      // Mode-specific filtering
      ...(mode === 'translate' ? ['.share', '.like', '.vote', '.rating'] : [])
    ];
    
    // Remove UI elements
    elementsToRemove.forEach(selector => {
      try {
        const elements = docClone.querySelectorAll(selector);
        elements.forEach(el => el.parentNode?.removeChild(el));
      } catch (e) {
        // Ignore errors from invalid selectors
      }
    });

    // Enhance content for specific modes by preserving important elements
    if (config.additionalSelectors.length > 0) {
      // Mark important content elements to ensure they're preserved
      config.additionalSelectors.forEach(selector => {
        try {
          const elements = docClone.querySelectorAll(selector);
          elements.forEach(el => {
            el.setAttribute('data-lightup-important', 'true');
          });
        } catch (e) {
          // Ignore errors from invalid selectors
        }
      });
    }
    
    // Remove elements with common roles that are typically UI elements
    const uiRoles = ['navigation', 'banner', 'contentinfo', 'complementary'];
    uiRoles.forEach(role => {
      try {
        const elements = docClone.querySelectorAll(`[role="${role}"]`);
        elements.forEach(el => el.parentNode?.removeChild(el));
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Use Mozilla Readability to extract the main content
    const reader = new Readability(docClone, {
      // Configure Readability based on mode requirements
      debug: false, // Set to true for debugging
      maxElemsToParse: config.preserveStructure ? 5000 : 3000,
      nbTopCandidates: 10,
      charThreshold: mode === 'translate' ? 100 : 500,
      classesToPreserve: ['data-lightup-important'],
      keepClasses: config.preserveStructure,
      serializer: (el: Element) => el.innerHTML
    });
    
    const article = reader.parse();
    
    // Store debug info in window object for comparing results
    (window as any).__lightupExtraction = {
      usingReadability: true,
      readabilityResult: article,
      mode: mode,
      config: config
    };
    
    // Extract content from Readability result
    let extractedContent = '';
    
    if (article) {
      // Use textContent for clean text extraction
      extractedContent = article.textContent || '';
      
      // Add title if available and configured
      if (article.title && config.includeTitle) {
        extractedContent = `${article.title}\n\n${extractedContent}`;
      }
      
      // Add excerpt if available and no main content
      if (!extractedContent.trim() && article.excerpt) {
        extractedContent = article.excerpt;
      }
    }
    
    // Post-process based on mode
    if (extractedContent && extractedContent.trim().length > 0) {
      extractedContent = postProcessContent(extractedContent, mode);
      
      // Log success with mode info
      console.log(`🔍 Readability successfully extracted content for ${mode || 'default'} mode`);
      return extractedContent;
    }
    
    // Fallback to our own extraction if Readability returned nothing useful
    console.log(`⚠️ Readability failed to extract content for ${mode || 'default'} mode, using fallback extraction`);
    return fallbackExtraction(docClone, mode);
  } catch (error) {
    console.error("Error using Readability:", error);
    return fallbackExtraction(doc, mode);
  }
};

/**
 * Post-process extracted content based on mode
 * @param content - Raw extracted content
 * @param mode - Processing mode
 * @returns Optimized content for the specific mode
 */
const postProcessContent = (content: string, mode?: string): string => {
  // Clean up common extraction artifacts
  let processed = content
    .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
    .replace(/\s{3,}/g, ' ')    // Reduce excessive spaces
    .trim();

  switch (mode) {
    case 'translate':
      // For translation, ensure we have clean, flowing text
      processed = processed
        .replace(/\[.*?\]/g, '') // Remove link references
        .replace(/\n{2,}/g, '\n\n') // Normalize paragraph breaks
        .replace(/^\s*[\-\*\+]\s*/gm, '') // Remove bullet points that might confuse translation
        // Remove script and analytics content that might have been captured
        .replace(/window\.dataLayer[\s\S]*?;/g, '')
        .replace(/gtag\([^)]*\)\s*;?/g, '')
        .replace(/function\s+gtag\(\)[\s\S]*?\}/g, '')
        .replace(/\{"props":\{[^}]*\}[^}]*\}/g, '')
        .replace(/buildId:\s*["'][^"']*["']/g, '')
        .replace(/nextExport:\s*(?:true|false)/g, '')
        .trim();
      break;
      
    case 'analyze':
      // For analysis, preserve structure and data points
      // Keep the content as-is since structure is important for analysis
      break;
      
    case 'explain':
      // For explanation, preserve clear structure but clean up formatting
      processed = processed
        .replace(/\[.*?\]/g, '') // Remove link references that might be confusing
        .trim();
      break;
      
    case 'summarize':
      // For summarization, preserve all structure and content
      // This is already well-handled by the existing implementation
      break;
      
    default:
      // For free mode or unknown modes, keep content as-is
      break;
  }

  return processed;
};

/**
 * Fallback content extraction when Readability fails
 * @param doc - Document to extract content from
 * @param mode - Processing mode for optimization
 * @returns Extracted text content
 */
const fallbackExtraction = (doc: Document, mode?: string): string => {
  try {
    // Create a document clone to work with
    const docClone = doc.cloneNode(true) as Document;
    
    // Remove known UI elements
    Array.from(docClone.querySelectorAll('nav, header, footer, aside'))
      .forEach(el => el.parentNode?.removeChild(el));
    
    // Try to find main content containers
    const mainContent = docClone.querySelector('main, article, [role="main"]');
    const content = mainContent ? mainContent.textContent || docClone.body.innerText : docClone.body.innerText;
    
    return postProcessContent(content, mode);
  } catch (error) {
    console.error("Error in fallback extraction:", error);
    // Absolute fallback - just get the original document text
    return doc.body.innerText;
  }
};

/**
 * Main function to extract page content with mode-aware optimization
 * @param mode - Processing mode for extraction optimization
 * @returns Extracted text from the current page optimized for the specific mode
 */
// Basic sanitization to strip problematic characters before sending to LLM
const sanitizeForLLM = (content: string): string => {
  if (!content) return "";
  
  // Build result character by character to properly handle surrogates
  const result: string[] = [];
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    
    // Skip surrogates (0xD800-0xDFFF) - lone surrogates cause xAI JSON parse errors
    if (code >= 0xD800 && code <= 0xDFFF) {
      continue;
    }
    
    // Skip backslashes - they can produce \x escape issues
    if (code === 92) {
      continue;
    }
    
    // Skip control characters except newline/tab
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      continue;
    }
    
    // Skip DEL character
    if (code === 127) {
      continue;
    }
    
    result.push(content[i]);
  }
  
  return result.join('')
    .replace(/[ \t\r\n]{2,}/g, " ")
    .trim();
};

const getPageContent = (mode?: string): string => {
  // Get the page title for context
  const pageTitle = document.title;
  
  // Extract the main content using Readability with mode-aware optimization
  let mainContent = extractWithReadability(document, mode);
  
  // Apply advanced content processing if mode is specified
  if (mode && ['explain', 'summarize', 'analyze', 'translate', 'free'].includes(mode)) {
    const { content: enhancedContent, metadata } = processContent(mainContent, mode as ProcessingMode);
    
    // Log processing information for debugging
    console.log(`🔧 Content processed for ${mode} mode:`, {
      originalLength: metadata.originalLength,
      processedLength: metadata.processedLength,
      contentType: metadata.contentType,
      hasStructure: metadata.hasStructure
    });
    
    mainContent = enhancedContent;
  }
  
  // Include the page title and URL for context based on mode
  const config = getModeExtractionConfig(mode);
  
  if (config.includeTitle && pageTitle && pageTitle.trim()) {
    // For translation mode, minimize metadata to focus on content
    if (mode === 'translate') {
      return mainContent;
    }
    
    return sanitizeForLLM(`Page: ${pageTitle}\nURL: ${window.location.href}\n\n${mainContent}`);
  }
  
  return sanitizeForLLM(mainContent);
};

export { getPageContent };
export default getPageContent;

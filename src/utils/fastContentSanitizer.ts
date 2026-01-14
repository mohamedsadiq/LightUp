/**
 * Fast Content Sanitizer
 * 
 * Sanitizes web content to ensure JSON-safe output.
 * Applied at extraction time to prevent escape sequence issues.
 * 
 * PERFORMANCE: Single-pass character filtering, no regex, O(N) complexity.
 * 
 * @author LightUp Team
 * @since 2026-01
 */

/**
 * Sanitize web content to be JSON-safe
 * 
 * Filters out:
 * - Control characters (except \t, \n, \r)
 * - Lone surrogates (0xD800-0xDFFF)
 * - Backslash (to prevent escape sequences)
 * 
 * Allows:
 * - Printable ASCII (32-126, except backslash)
 * - Common Unicode ranges (Cyrillic, Arabic, CJK, etc.)
 * 
 * @param rawContent - Raw content from webpage
 * @returns Sanitized content safe for JSON serialization
 */
export const sanitizeWebContentFast = (rawContent: string): string => {
  if (!rawContent) return "";
  
  const result: string[] = [];
  const length = rawContent.length;
  
  for (let i = 0; i < length; i++) {
    const code = rawContent.charCodeAt(i);
    
    // Fast path: Most common characters (printable ASCII except backslash)
    if (code >= 32 && code <= 126 && code !== 92) {
      result.push(rawContent[i]);
      continue;
    }
    
    // Skip problematic ranges entirely
    // Control chars (0-31) except tab (9), newline (10), carriage return (13)
    if (code < 32 || (code >= 14 && code <= 31)) {
      continue;
    }
    
    // Skip backslash (92) - prevents all escape sequence issues
    if (code === 92) {
      continue;
    }
    
    // Skip lone surrogates (0xD800-0xDFFF) - these cause JSON parse errors
    if (code >= 0xD800 && code <= 0xDFFF) {
      continue;
    }
    
    // Allow common Unicode ranges (simple checks for performance)
    if ((code >= 0x0400 && code <= 0x04FF) || // Cyrillic
        (code >= 0x0600 && code <= 0x06FF) || // Arabic  
        (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
        (code >= 0x3040 && code <= 0x30FF) || // Japanese Hiragana/Katakana
        (code >= 0xAC00 && code <= 0xD7AF) || // Korean Hangul
        (code >= 0x0080 && code < 0xD800) ||  // Other BMP characters (before surrogate range)
        (code > 0xDFFF && code <= 0xFFFF)) {  // BMP characters after surrogate range
      result.push(rawContent[i]);
    }
  }
  
  return result.join('').trim();
};

/**
 * Check if content is already sanitized
 * Useful for caching and avoiding redundant sanitization
 */
export const isContentSanitized = (content: string): boolean => {
  if (!content) return true;
  
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    
    // Check for control chars (except tab, newline, carriage return)
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) ||
        // Check for backslash
        code === 92 ||
        // Check for lone surrogates
        (code >= 0xD800 && code <= 0xDFFF)) {
      return false;
    }
  }
  
  return true;
};

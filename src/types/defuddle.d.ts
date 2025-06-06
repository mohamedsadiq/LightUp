declare module 'defuddle' {
  export interface ParseResult {
    title?: string;
    excerpt?: string;
    content?: string;
    contentLength?: number;
    markdown?: string;
    text?: string;
    textLength?: number;
    metadata?: Record<string, any>;
    language?: string;
  }

  export interface ParseOptions {
    /**
     * Return content as markdown instead of plain text
     */
    markdown?: boolean;
    
    /**
     * Include the document title in the result
     */
    includeTitle?: boolean;
    
    /**
     * Include headings in the result
     */
    includeHeadings?: boolean;
    
    /**
     * Maximum length of content to extract
     */
    maxContentLength?: number;
    
    /**
     * Remove data attributes from elements
     */
    removeDataAttributes?: boolean;
    
    /**
     * Remove empty nodes
     */
    removeEmptyNodes?: boolean;
    
    /**
     * Remove nodes matching these selectors
     */
    removeNodesBySelector?: string[];
    
    /**
     * Additional metadata to extract (key-value pairs)
     */
    metadata?: Record<string, string>;
  }

  /**
   * Parse HTML content using Defuddle
   * @param document - HTML document or string to parse
   * @param options - Parsing options
   * @returns ParseResult object with extracted content
   */
  export function parse(
    document: Document | string,
    options?: ParseOptions
  ): ParseResult;
}

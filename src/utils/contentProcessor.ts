/**
 * Content processor utility for mode-specific optimization and quality enhancement
 * This module provides specialized processing for different action modes to improve AI output quality
 */

export type ProcessingMode = 'explain' | 'summarize' | 'analyze' | 'challenge' | 'translate' | 'free';

export interface ContentMetadata {
  mode: ProcessingMode;
  originalLength: number;
  processedLength: number;
  hasStructure: boolean;
  hasCodeBlocks: boolean;
  hasLists: boolean;
  hasTables: boolean;
  language?: string;
  contentType?: string;
}

/**
 * Enhanced content processor that optimizes content based on the intended processing mode
 */
export class ContentProcessor {
  private mode: ProcessingMode;
  private content: string;
  private metadata: ContentMetadata;

  constructor(content: string, mode: ProcessingMode) {
    this.content = content;
    this.mode = mode;
    this.metadata = this.analyzeContent(content, mode);
  }

  /**
   * Analyze content to determine its characteristics
   */
  private analyzeContent(content: string, mode: ProcessingMode): ContentMetadata {
    const hasCodeBlocks = /```[\s\S]*?```|`[^`]+`/.test(content);
    const hasLists = /^\s*[-*+•]\s|^\s*\d+\.\s/m.test(content);
    const hasTables = /\|.*\|.*\|/.test(content);
    const hasStructure = /^#{1,6}\s/.test(content) || hasLists || hasTables;

    return {
      mode,
      originalLength: content.length,
      processedLength: 0, // Will be updated after processing
      hasStructure,
      hasCodeBlocks,
      hasLists,
      hasTables,
      contentType: this.detectContentType(content)
    };
  }

  /**
   * Detect the type of content being processed
   */
  private detectContentType(content: string): string {
    const indicators = {
      technical: /\b(API|SDK|function|class|method|algorithm|database|server|client|framework)\b/gi,
      academic: /\b(research|study|analysis|methodology|hypothesis|conclusion|abstract|introduction)\b/gi,
      news: /\b(breaking|reported|according to|statement|official|spokesperson|press release)\b/gi,
      tutorial: /\b(step|tutorial|guide|how to|instructions|process|procedure)\b/gi,
      legal: /\b(hereby|whereas|pursuant|agreement|contract|terms|conditions|liability)\b/gi
    };

    let maxScore = 0;
    let detectedType = 'general';

    for (const [type, regex] of Object.entries(indicators)) {
      const matches = content.match(regex);
      const score = matches ? matches.length : 0;
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }

    return detectedType;
  }

  /**
   * Process content with mode-specific optimizations
   */
  public process(): { content: string; metadata: ContentMetadata } {
    let processedContent = this.content;

    switch (this.mode) {
      case 'explain':
        processedContent = this.processForExplanation(processedContent);
        break;
      case 'analyze':
        processedContent = this.processForAnalysis(processedContent);
        break;
      case 'challenge':
        processedContent = this.processForAnalysis(processedContent);
        break;
      case 'translate':
        processedContent = this.processForTranslation(processedContent);
        break;
      case 'summarize':
        processedContent = this.processForSummarization(processedContent);
        break;
      case 'free':
        processedContent = this.processForFreeMode(processedContent);
        break;
    }

    this.metadata.processedLength = processedContent.length;
    return { content: processedContent, metadata: this.metadata };
  }

  /**
   * Optimize content for explanation mode
   */
  private processForExplanation(content: string): string {
    // Preserve structure and context that helps with explanation
    let processed = content;

    // Ensure definitions and examples are preserved
    processed = this.preserveKeyElements(processed, [
      /\b(definition|example|instance|illustration|demonstration):\s*/gi,
      /\b(such as|for example|e\.g\.|i\.e\.|namely)\b/gi,
      /\b(this means|in other words|simply put|essentially)\b/gi
    ]);

    // Add context markers for complex terms
    processed = this.highlightComplexTerms(processed);

    return processed;
  }

  /**
   * Optimize content for analysis mode
   */
  private processForAnalysis(content: string): string {
    let processed = content;

    // Preserve argumentative structure
    processed = this.preserveKeyElements(processed, [
      /\b(however|therefore|consequently|furthermore|moreover|nevertheless|although|despite)\b/gi,
      /\b(first|second|third|finally|in conclusion|to summarize)\b/gi,
      /\b(according to|research shows|studies indicate|data suggests)\b/gi,
      /\b(on the other hand|in contrast|conversely|alternatively)\b/gi
    ]);

    // Preserve numerical data and statistics
    processed = this.preserveDataElements(processed);

    return processed;
  }

  /**
   * Optimize content for translation mode
   */
  private processForTranslation(content: string): string {
    let processed = content;

    // Remove elements that might confuse translation
    processed = processed
      .replace(/\[Edit\]/gi, '') // Remove edit markers
      .replace(/\[Citation needed\]/gi, '') // Remove citation markers
      .replace(/\[Source:.*?\]/gi, '') // Remove source references
      .replace(/Click here/gi, '') // Remove navigation text
      .replace(/Read more/gi, '') // Remove UI text
      .replace(/\b(Tweet|Share|Like|Follow)\b/gi, '') // Remove social media actions
      
      // Remove Next.js and React-specific content
      .replace(/\{"props":\{[^}]*\}[^}]*\}/g, '')
      .replace(/window\.__NEXT_DATA__\s*=\s*\{[^}]*\}/g, '')
      .replace(/\{"page":"[^"]*","query":\{[^}]*\}[^}]*\}/g, '')
      
      // Remove analytics and tracking scripts
      .replace(/window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\]\s*;?/g, '')
      .replace(/function\s+gtag\(\)\s*\{[^}]*\}/g, '')
      .replace(/gtag\([^)]*\)\s*;?/g, '')
      .replace(/ga\([^)]*\)\s*;?/g, '')
      
      // Remove build IDs and technical strings
      .replace(/buildId:\s*["'][^"']*["']/g, '')
      .replace(/nextExport:\s*(?:true|false)/g, '')
      .replace(/autoExport:\s*(?:true|false)/g, '')
      .replace(/isFallback:\s*(?:true|false)/g, '')
      
      // Remove localization objects
      .replace(/locale:\s*["'][^"']*["']/g, '')
      .replace(/locales:\s*\[[^\]]*\]/g, '')
      .replace(/defaultLocale:\s*["'][^"']*["']/g, '');

    // Preserve cultural context markers
    processed = this.preserveKeyElements(processed, [
      /\b(cultural|traditional|historical|regional)\b/gi
    ]);

    // Ensure paragraph structure for better translation flow
    processed = this.normalizeWhitespace(processed);

    return processed;
  }

  /**
   * Optimize content for summarization mode
   */
  private processForSummarization(content: string): string {
    let processed = content;

    // Preserve hierarchical structure
    processed = this.preserveKeyElements(processed, [
      /^#{1,6}\s.*/gm, // Headers
      /\b(key points|main ideas|summary|conclusion|abstract)\b/gi,
      /\b(important|significant|crucial|essential|critical)\b/gi
    ]);

    // Preserve list structures that indicate key points
    if (this.metadata.hasLists) {
      processed = this.enhanceListStructure(processed);
    }

    return processed;
  }

  /**
   * Optimize content for free mode
   */
  private processForFreeMode(content: string): string {
    // Minimal processing for free mode - preserve all content characteristics
    return this.normalizeWhitespace(content);
  }

  /**
   * Preserve key elements in content
   */
  private preserveKeyElements(content: string, patterns: RegExp[]): string {
    let processed = content;
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        // Add emphasis markers around key elements for AI processing
        processed = processed.replace(pattern, (match) => `⚡${match}⚡`);
      }
    });

    return processed;
  }

  /**
   * Highlight complex terms for better explanation
   */
  private highlightComplexTerms(content: string): string {
    // Mark technical terms, acronyms, and complex concepts
    const complexTermPattern = /\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b|(?:[A-Z][a-z]+){3,}/g;
    return content.replace(complexTermPattern, (match) => `📚${match}📚`);
  }

  /**
   * Preserve data elements for analysis
   */
  private preserveDataElements(content: string): string {
    // Preserve percentages, numbers, dates, and statistics
    const dataPatterns = [
      /\b\d+(?:\.\d+)?%\b/g, // Percentages
      /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g, // Numbers with commas
      /\b(?:19|20)\d{2}\b/g, // Years
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi // Dates
    ];

    let processed = content;
    dataPatterns.forEach(pattern => {
      processed = processed.replace(pattern, (match) => `📊${match}📊`);
    });

    return processed;
  }

  /**
   * Enhance list structure for better processing
   */
  private enhanceListStructure(content: string): string {
    // Add clear markers for list items
    return content.replace(/^\s*[-*+•]\s/gm, '📋 ');
  }

  /**
   * Normalize whitespace while preserving structure
   */
  private normalizeWhitespace(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, '    ') // Convert tabs to spaces
      .replace(/[ ]{2,}/g, ' ') // Collapse multiple spaces
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
      .trim();
  }

  /**
   * Get processing recommendations based on content analysis
   */
  public getProcessingRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metadata.hasCodeBlocks) {
      recommendations.push('Content contains code blocks - preserve formatting for clarity');
    }

    if (this.metadata.hasStructure) {
      recommendations.push('Content has clear structure - maintain hierarchy for better understanding');
    }

    if (this.metadata.contentType === 'technical') {
      recommendations.push('Technical content detected - focus on accuracy and clarity of technical terms');
    }

    if (this.metadata.contentType === 'academic') {
      recommendations.push('Academic content detected - preserve research methodology and citations');
    }

    if (this.metadata.originalLength > 5000) {
      recommendations.push('Long content detected - prioritize key information and main arguments');
    }

    return recommendations;
  }
}

/**
 * Convenience function to process content with mode-specific optimization
 */
export const processContent = (content: string, mode: ProcessingMode): { content: string; metadata: ContentMetadata } => {
  const processor = new ContentProcessor(content, mode);
  return processor.process();
};

/**
 * Get processing recommendations for content
 */
export const getContentRecommendations = (content: string, mode: ProcessingMode): string[] => {
  const processor = new ContentProcessor(content, mode);
  return processor.getProcessingRecommendations();
}; 
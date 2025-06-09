/**
 * Enhancement demonstration utility
 * Shows the quality improvements for different actions
 */

interface QualityImprovement {
  feature: string;
  before: string;
  after: string;
  mode: string;
  impact: 'high' | 'medium' | 'low';
}

export const qualityImprovements: QualityImprovement[] = [
  // Summarize enhancements (now using Readability)
  {
    feature: "Content Extraction",
    mode: "summarize",
    impact: "high",
    before: "Uses basic text extraction, includes navigation elements, ads, and UI components",
    after: "Uses enhanced Mozilla Readability extraction with mode-specific filtering to remove UI elements and focus on main content"
  },
  
  // Analyze enhancements (NEW)
  {
    feature: "Content Extraction",
    mode: "analyze",
    impact: "high",
    before: "Basic text extraction without context awareness",
    after: "Mode-aware Readability extraction that preserves data elements, statistics, and argumentative structure essential for analysis"
  },
  {
    feature: "System Prompt",
    mode: "analyze",
    impact: "high",
    before: "Basic prompt: 'You are an insightful analyst who values directness. Share observations clearly and concisely while maintaining engagement.'",
    after: "Enhanced prompt: 'You are a skilled analytical expert who examines content with depth and precision. Your analysis goes beyond surface-level observations to uncover patterns, relationships, implications, and underlying themes. Evaluate the content's structure, arguments, evidence quality, logical flow, and potential biases...'"
  },
  {
    feature: "User Prompt",
    mode: "analyze",
    impact: "high",
    before: "Simple: 'Analyze this: {text}'",
    after: "Detailed: 'Conduct a thorough analysis of the following content. Examine the main arguments, evidence presented, logical structure, and underlying assumptions. Identify key themes, patterns, strengths, and potential weaknesses...'"
  },
  {
    feature: "Content Processing",
    mode: "analyze",
    impact: "medium",
    before: "No mode-specific processing",
    after: "Preserves argumentative structure, highlights statistical data, and maintains evidence chains for better analysis"
  },
  
  // Explain enhancements (NEW)
  {
    feature: "Content Extraction",
    mode: "explain",
    impact: "high",
    before: "Basic text extraction",
    after: "Mode-aware extraction that preserves definitions, examples, and instructional content while removing distracting elements"
  },
  {
    feature: "System Prompt",
    mode: "explain",
    impact: "high",
    before: "Basic prompt: 'You are a friendly expert who gets straight to the point. Give clear, direct explanations while maintaining a conversational tone.'",
    after: "Enhanced prompt: 'You are an expert educator and communication specialist who excels at making complex concepts accessible. Your explanations are clear, well-structured, and tailored to help readers truly understand the subject matter...'"
  },
  {
    feature: "User Prompt",
    mode: "explain",
    impact: "high",
    before: "Simple: 'What does this mean: {text}'",
    after: "Comprehensive: 'Please provide a clear, comprehensive explanation of the following content. Break down complex concepts, provide necessary context, and help me understand the key ideas, processes, or principles being discussed...'"
  },
  {
    feature: "Content Processing",
    mode: "explain",
    impact: "medium",
    before: "No mode-specific processing",
    after: "Highlights complex terms and preserves examples and definitions for better explanatory context"
  },
  
  // Translate enhancements (NEW)
  {
    feature: "Content Extraction",
    mode: "translate",
    impact: "high",
    before: "Includes metadata, titles, and structural elements that can confuse translation",
    after: "Focuses on pure text content, removes UI elements, social media buttons, and navigation that don't need translation"
  },
  {
    feature: "System Prompt",
    mode: "translate",
    impact: "high",
    before: "Basic prompt: 'You are a skilled translator focused on accuracy and natural flow. Translate text directly while preserving tone and context.'",
    after: "Enhanced prompt: 'You are a professional translator with expertise in maintaining linguistic accuracy while preserving cultural context and tone. Focus on producing natural, fluent translations that read as if originally written in the target language...'"
  },
  {
    feature: "User Prompt",
    mode: "translate",
    impact: "medium",
    before: "Simple: 'Translate from {fromLang} to {toLang}: {text}'",
    after: "Detailed: 'Translate the following text from {fromLang} to {toLang}. Maintain the original tone, style, and meaning while ensuring the translation reads naturally in the target language. Preserve formatting and structure...'"
  },
  {
    feature: "Content Processing",
    mode: "translate",
    impact: "medium",
    before: "No special text processing",
    after: "Removes link references, bullet points, and formatting that might confuse translation while preserving cultural context markers"
  }
];

/**
 * Get improvements for a specific mode
 */
export const getImprovementsForMode = (mode: string): QualityImprovement[] => {
  return qualityImprovements.filter(improvement => improvement.mode === mode);
};

/**
 * Get summary of all improvements
 */
export const getImprovementSummary = () => {
  const modeStats = {
    summarize: qualityImprovements.filter(i => i.mode === 'summarize').length,
    analyze: qualityImprovements.filter(i => i.mode === 'analyze').length,
    explain: qualityImprovements.filter(i => i.mode === 'explain').length,
    translate: qualityImprovements.filter(i => i.mode === 'translate').length
  };
  
  const impactStats = {
    high: qualityImprovements.filter(i => i.impact === 'high').length,
    medium: qualityImprovements.filter(i => i.impact === 'medium').length,
    low: qualityImprovements.filter(i => i.impact === 'low').length
  };
  
  return {
    totalImprovements: qualityImprovements.length,
    modeStats,
    impactStats,
    newlyEnhanced: ['analyze', 'explain', 'translate']
  };
};

/**
 * Display improvements in console for debugging
 */
export const displayImprovements = (mode?: string) => {
  const improvements = mode ? getImprovementsForMode(mode) : qualityImprovements;
  
  console.group(`🚀 LightUp Quality Improvements${mode ? ` - ${mode.toUpperCase()} Mode` : ''}`);
  
  improvements.forEach(improvement => {
    console.group(`🔧 ${improvement.feature} (${improvement.mode})`);
    console.log(`📊 Impact: ${improvement.impact.toUpperCase()}`);
    console.log(`❌ Before: ${improvement.before}`);
    console.log(`✅ After: ${improvement.after}`);
    console.groupEnd();
  });
  
  if (!mode) {
    const summary = getImprovementSummary();
    console.group('📈 Summary');
    console.log(`Total improvements: ${summary.totalImprovements}`);
    console.log(`Newly enhanced modes: ${summary.newlyEnhanced.join(', ')}`);
    console.log(`High impact improvements: ${summary.impactStats.high}`);
    console.groupEnd();
  }
  
  console.groupEnd();
}; 
/**
 * Run prompt evals - CommonJS version
 * Usage: node src/evals/run-evals.cjs
 */

// Import constants directly (inline for simplicity)
const SYSTEM_PROMPTS = {
  explain: "You are an expert educator who makes complex concepts accessible. Deliver explanations that are clear, structured, and concise. Use clear, natural paragraphs, and only use bullet points when presenting a list of items. Focus on the 'why' and 'how', and avoid unnecessary jargon.",

  summarize: "You are a professional content summarizer. Produce a concise summary using clear, flowing paragraphs that prioritize the most important concepts, key facts, and conclusions. You may use bullet points only for a list of items or key features. Exclude already-filtered UI elements. Maintain the original tone.",

  analyze: "You are an analytical expert. Provide a focused analysis highlighting patterns, implications, strengths, weaknesses, and notable insights. Use natural, concise paragraphs, citing brief examples where necessary. Avoid restating obvious points.",

  challenge: "You are a critical thinking assistant. Your job is to challenge the point of view of the content fairly. Steelman the author's position first, then identify assumptions, missing context, and strong counterarguments. Be respectful, precise, and avoid straw-manning. Use clear sections and concise, natural paragraphs.",

  translate: "You are a professional translator. Produce concise, natural translations that read fluently in the target language. Preserve the author's voice, style, and intent while adapting cultural references appropriately. When encountering ambiguous phrases, choose the interpretation that best serves the overall meaning. Maintain the original structure and formatting.",

  free: "You are a helpful assistant who can answer any question. Provide clear, accurate, and concise responses while being conversational. Focus on directly addressing the user's query with relevant information."
};

const USER_PROMPTS = {
  explain: (text) => `Explain the following content clearly and concisely using natural paragraphs. Break down complex ideas and provide essential context:\n\n${text}`,

  summarize: (text) => `Summarize the following content in concise, natural paragraphs, capturing main ideas and conclusions:\n\n${text}`,

  analyze: (text) => `Provide a concise analysis of the following content using natural paragraphs, highlighting patterns, strengths, weaknesses, and key insights:\n\n${text}`,

  challenge: (text) => `Challenge the point of view in the following content using natural paragraphs. Provide the strongest counterarguments, missing perspectives, and questions that would test the claims:\n\n${text}`,

  translate: (text) => `Translate the following text. Maintain the original tone, style, and meaning while ensuring the translation reads naturally in the target language:\n\n${text}`,

  free: (text) => `Based on the following content, provide a clear and concise response using natural paragraphs:\n\n${text}`
};

const FOLLOW_UP_SYSTEM_PROMPTS = {
  explain: "You are an expert educator maintaining your explanatory expertise from the previous interaction. Continue to provide clear explanations using concise, natural paragraphs while building on the established context. Address follow-up questions with the same depth, avoiding repetition of already-covered basics. Provide fresh insights.",

  summarize: "You are maintaining your role as a professional content summarizer. For follow-up questions, provide additional insights or deeper analysis of the previous content using concise, natural paragraphs. Focus on new aspects not covered initially, avoiding repetition of previous points.",

  analyze: "You are continuing your analytical examination of the content. Maintain your critical, in-depth analytical perspective. For follow-up questions about 'strange', 'unusual', or 'problematic' aspects, dig deeper into genuinely noteworthy issues using concise, flowing paragraphs: technical contradictions, market positioning oddities, design choices that conflict with stated goals, claims that seem exaggerated or inconsistent with industry norms, or strategic decisions that appear counterintuitive. Avoid retreading the same obvious points - provide fresh, insightful observations.",

  challenge: "You are continuing as a critical thinking assistant. Maintain a fair and rigorous approach: steelman the author's position, then challenge it by surfacing assumptions, missing context, and strong counterarguments using natural paragraphs. Avoid repeating previous points - provide fresh perspectives and a balanced conclusion.",

  translate: "You are maintaining your role as a professional translator. For follow-up questions, provide concise, natural paragraphs with additional context about translation choices, cultural nuances, or alternative interpretations. Avoid repeating previous explanations - focus on new insights.",

  free: "You are continuing as a helpful assistant. Build on the previous conversation context while addressing the new question directly using clear, concise paragraphs. Provide fresh, thoughtful responses."
};

// ============================================================================
// Eval Functions
// ============================================================================

function evalHasFormatGuidance(prompt) {
  const formatKeywords = [
    'paragraph', 'bullet', 'list', 'structure', 'format',
    'concise', 'brief', 'natural', 'flowing'
  ];
  
  const hasGuidance = formatKeywords.some(kw => 
    prompt.toLowerCase().includes(kw)
  );
  
  return {
    name: 'Has format guidance',
    passed: hasGuidance,
    message: hasGuidance 
      ? 'Prompt includes format guidance' 
      : 'Missing format guidance - AI may produce inconsistent output styles'
  };
}

function evalHasLengthGuidance(prompt) {
  const lengthKeywords = [
    'concise', 'brief', 'short', 'words', 'sentences',
    'focused', 'avoid unnecessary'
  ];
  
  const hasGuidance = lengthKeywords.some(kw => 
    prompt.toLowerCase().includes(kw)
  );
  
  return {
    name: 'Has length/brevity guidance',
    passed: hasGuidance,
    message: hasGuidance 
      ? 'Prompt includes length guidance' 
      : 'Missing length guidance - responses may be too verbose'
  };
}

function evalHasRoleDefinition(prompt) {
  const roleIndicators = [
    'you are', 'your role', 'your job', 'act as', 'as a',
    'expert', 'professional', 'assistant'
  ];
  
  const hasRole = roleIndicators.some(kw => 
    prompt.toLowerCase().includes(kw)
  );
  
  return {
    name: 'Has clear role definition',
    passed: hasRole,
    message: hasRole 
      ? 'Prompt defines AI role clearly' 
      : 'Missing role definition - AI may not adopt appropriate persona'
  };
}

function evalHasAntiHallucination(prompt) {
  const antiHallucinationKeywords = [
    'based on', 'from the content', 'in the text', 'provided',
    'following', 'given', 'the content'
  ];
  
  const hasGuidance = antiHallucinationKeywords.some(kw => 
    prompt.toLowerCase().includes(kw)
  );
  
  return {
    name: 'Has anti-hallucination guidance',
    passed: hasGuidance,
    message: hasGuidance 
      ? 'Prompt grounds AI in provided content' 
      : 'Missing anti-hallucination guidance - AI may invent facts'
  };
}

function evalNoConflictingInstructions(prompt) {
  const lower = prompt.toLowerCase();
  const conflicts = [];
  
  if (lower.includes('brief') && lower.includes('comprehensive') && !lower.includes('yet')) {
    conflicts.push('brief vs comprehensive');
  }
  
  return {
    name: 'No conflicting instructions',
    passed: conflicts.length === 0,
    message: conflicts.length === 0 
      ? 'No conflicting instructions found' 
      : `Conflicting instructions: ${conflicts.join(', ')}`
  };
}

function evalAppropriateLength(prompt) {
  const wordCount = prompt.split(/\s+/).length;
  const isAppropriate = wordCount >= 15 && wordCount <= 200;
  
  return {
    name: 'Appropriate prompt length',
    passed: isAppropriate,
    message: `Prompt has ${wordCount} words ${isAppropriate ? '(good)' : '(may need adjustment)'}`
  };
}

// Mode-specific evals
function evalExplainQuality(prompt) {
  const keywords = ['clear', 'accessible', 'understand', 'why', 'how', 'break down', 'explain', 'context', 'jargon'];
  const score = keywords.filter(kw => prompt.toLowerCase().includes(kw)).length;
  return {
    name: 'Explain mode quality',
    passed: score >= 3,
    message: `Has ${score}/9 quality indicators for explain mode`
  };
}

function evalSummarizeQuality(prompt) {
  const keywords = ['key', 'main', 'important', 'essential', 'core', 'conclusion', 'summary', 'prioritize'];
  const score = keywords.filter(kw => prompt.toLowerCase().includes(kw)).length;
  return {
    name: 'Summarize mode quality',
    passed: score >= 2,
    message: `Has ${score}/8 quality indicators for summarize mode`
  };
}

function evalAnalyzeQuality(prompt) {
  const keywords = ['pattern', 'insight', 'strength', 'weakness', 'implication', 'analysis', 'critical'];
  const score = keywords.filter(kw => prompt.toLowerCase().includes(kw)).length;
  return {
    name: 'Analyze mode quality',
    passed: score >= 3,
    message: `Has ${score}/7 quality indicators for analyze mode`
  };
}

function evalChallengeQuality(prompt) {
  const keywords = ['steelman', 'counterargument', 'assumption', 'fair', 'balanced', 'perspective', 'missing', 'challenge'];
  const score = keywords.filter(kw => prompt.toLowerCase().includes(kw)).length;
  return {
    name: 'Challenge mode quality',
    passed: score >= 3,
    message: `Has ${score}/8 quality indicators for challenge mode`
  };
}

// ============================================================================
// Run Evals
// ============================================================================

function runSystemPromptEvals(mode) {
  const prompt = SYSTEM_PROMPTS[mode];
  const results = [];
  
  results.push(evalHasRoleDefinition(prompt));
  results.push(evalHasFormatGuidance(prompt));
  results.push(evalHasLengthGuidance(prompt));
  results.push(evalNoConflictingInstructions(prompt));
  results.push(evalAppropriateLength(prompt));
  
  if (mode === 'explain') results.push(evalExplainQuality(prompt));
  if (mode === 'summarize') results.push(evalSummarizeQuality(prompt));
  if (mode === 'analyze') results.push(evalAnalyzeQuality(prompt));
  if (mode === 'challenge') results.push(evalChallengeQuality(prompt));
  
  const passed = results.filter(r => r.passed).length;
  
  return {
    name: `${mode.toUpperCase()} System Prompt`,
    results,
    passRate: passed / results.length
  };
}

function runUserPromptEvals(mode) {
  const promptFn = USER_PROMPTS[mode];
  const testText = "Sample test content for evaluation purposes.";
  const prompt = typeof promptFn === 'function' ? promptFn(testText) : promptFn;
    
  const results = [];
  
  results.push(evalHasFormatGuidance(prompt));
  results.push(evalHasAntiHallucination(prompt));
  results.push(evalNoConflictingInstructions(prompt));
  
  const passed = results.filter(r => r.passed).length;
  
  return {
    name: `${mode.toUpperCase()} User Prompt`,
    results,
    passRate: passed / results.length
  };
}

function runFollowUpPromptEvals(mode) {
  const prompt = FOLLOW_UP_SYSTEM_PROMPTS[mode];
  if (!prompt) return null;
  
  const results = [];
  
  results.push(evalHasRoleDefinition(prompt));
  results.push(evalHasFormatGuidance(prompt));
  results.push(evalNoConflictingInstructions(prompt));
  
  // Context continuity
  const hasContext = prompt.toLowerCase().includes('previous') || 
    prompt.toLowerCase().includes('context') ||
    prompt.toLowerCase().includes('continuing');
  results.push({
    name: 'Has context continuity',
    passed: hasContext,
    message: hasContext ? 'Handles conversation context' : 'Missing context handling'
  });
  
  // Anti-repetition
  const hasAntiRepetition = prompt.toLowerCase().includes('avoid') ||
    prompt.toLowerCase().includes('repetition') ||
    prompt.toLowerCase().includes('fresh') ||
    prompt.toLowerCase().includes('new');
  results.push({
    name: 'Has anti-repetition guidance',
    passed: hasAntiRepetition,
    message: hasAntiRepetition ? 'Avoids repetition' : 'May repeat content'
  });
  
  const passed = results.filter(r => r.passed).length;
  
  return {
    name: `${mode.toUpperCase()} Follow-up Prompt`,
    results,
    passRate: passed / results.length
  };
}

// ============================================================================
// Main
// ============================================================================

const modes = ['explain', 'summarize', 'analyze', 'challenge', 'translate', 'free'];
const suites = [];
const failedTests = [];

for (const mode of modes) {
  suites.push(runSystemPromptEvals(mode));
  suites.push(runUserPromptEvals(mode));
  const followUp = runFollowUpPromptEvals(mode);
  if (followUp) suites.push(followUp);
}

console.log('\n' + '='.repeat(60));
console.log('PROMPT EVALS REPORT');
console.log('='.repeat(60) + '\n');

for (const suite of suites) {
  const status = suite.passRate === 1 ? '✅' : suite.passRate >= 0.7 ? '⚠️' : '❌';
  console.log(`${status} ${suite.name} (${Math.round(suite.passRate * 100)}% pass rate)`);
  
  for (const result of suite.results) {
    const icon = result.passed ? '  ✓' : '  ✗';
    console.log(`${icon} ${result.name}: ${result.message}`);
    
    if (!result.passed) {
      failedTests.push(`${suite.name} > ${result.name}`);
    }
  }
  console.log('');
}

const totalPassed = suites.reduce((acc, s) => acc + s.results.filter(r => r.passed).length, 0);
const totalTests = suites.reduce((acc, s) => acc + s.results.length, 0);
const totalPassRate = totalPassed / totalTests;

console.log('='.repeat(60));
console.log(`TOTAL: ${totalPassed}/${totalTests} tests passed (${Math.round(totalPassRate * 100)}%)`);
console.log('='.repeat(60));

if (failedTests.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  failedTests.forEach(t => console.log(`  - ${t}`));
  console.log('\n');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
}

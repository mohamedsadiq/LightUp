/**
 * Prompt Evals for LightUp Extension
 * 
 * Tests prompt quality across different modes to ensure:
 * 1. Consistent output format (paragraphs vs bullets)
 * 2. Appropriate length/brevity
 * 3. No hallucination indicators
 * 4. Proper context handling
 * 5. Mode-specific quality criteria
 */

import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS } from '../utils/constants';

// ============================================================================
// Types
// ============================================================================

interface EvalResult {
  name: string;
  passed: boolean;
  message: string;
  score?: number;
}

interface EvalSuite {
  name: string;
  results: EvalResult[];
  passRate: number;
}

type Mode = 'explain' | 'summarize' | 'analyze' | 'challenge' | 'translate' | 'free';

// ============================================================================
// Test Inputs
// ============================================================================

const TEST_INPUTS = {
  technical: `
    React 18 introduces concurrent rendering, which allows React to prepare multiple versions 
    of the UI at the same time. This enables features like Suspense for data fetching, 
    automatic batching of state updates, and transitions for smoother UX during heavy updates.
    The new createRoot API replaces ReactDOM.render and is required for concurrent features.
  `,
  
  article: `
    A new study published in Nature suggests that global temperatures could rise by 2.5°C 
    by 2050 if current emission trends continue. The researchers analyzed data from 150 
    climate models and found that extreme weather events will become 40% more frequent.
    Critics argue the models don't account for potential technological breakthroughs.
  `,
  
  marketing: `
    Introducing CloudSync Pro - the revolutionary cloud storage solution that's 10x faster 
    than competitors! Our AI-powered sync technology ensures your files are always available, 
    anywhere. Join 50 million satisfied users today. Limited time offer: Get 1TB free!
  `,
  
  short: `The quick brown fox jumps over the lazy dog.`,
  
  complex: `
    Quantum computing leverages quantum mechanical phenomena like superposition and entanglement 
    to perform computations. Unlike classical bits that are either 0 or 1, qubits can exist in 
    multiple states simultaneously. This enables quantum computers to solve certain problems 
    exponentially faster than classical computers. However, quantum decoherence and error 
    correction remain significant challenges. Companies like IBM, Google, and startups like 
    IonQ are racing to achieve quantum advantage - the point where quantum computers outperform 
    classical ones on practical problems.
  `
};

// ============================================================================
// Eval Criteria Functions
// ============================================================================

/**
 * Check if prompt includes output format guidance
 */
function evalHasFormatGuidance(prompt: string): EvalResult {
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

/**
 * Check if prompt includes length/brevity guidance
 */
function evalHasLengthGuidance(prompt: string): EvalResult {
  const lengthKeywords = [
    'concise', 'brief', 'short', 'words', 'sentences',
    'paragraph', 'avoid', 'unnecessary', 'focused'
  ];
  
  const hasGuidance = lengthKeywords.some(kw => 
    prompt.toLowerCase().includes(kw)
  );
  
  return {
    name: 'Has length/brevity guidance',
    passed: hasGuidance,
    message: hasGuidance 
      ? 'Prompt includes length guidance' 
      : 'Missing length guidance - responses may be too verbose or too short'
  };
}

/**
 * Check if prompt has clear role definition
 */
function evalHasRoleDefinition(prompt: string): EvalResult {
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

/**
 * Check if prompt includes anti-hallucination guidance
 */
function evalHasAntiHallucination(prompt: string): EvalResult {
  const antiHallucinationKeywords = [
    'based on', 'from the content', 'in the text', 'provided',
    'don\'t make up', 'only from', 'stick to', 'given'
  ];
  
  const hasGuidance = antiHallucinationKeywords.some(kw => 
    prompt.toLowerCase().includes(kw)
  );
  
  return {
    name: 'Has anti-hallucination guidance',
    passed: hasGuidance,
    message: hasGuidance 
      ? 'Prompt includes anti-hallucination guidance' 
      : 'Missing anti-hallucination guidance - AI may invent facts'
  };
}

/**
 * Check if prompt avoids conflicting instructions
 */
function evalNoConflictingInstructions(prompt: string): EvalResult {
  const lower = prompt.toLowerCase();
  
  // Check for potential conflicts
  const conflicts = [];
  
  if (lower.includes('brief') && lower.includes('comprehensive')) {
    conflicts.push('brief vs comprehensive');
  }
  if (lower.includes('concise') && lower.includes('detailed')) {
    conflicts.push('concise vs detailed');
  }
  if (lower.includes('avoid bullet') && lower.includes('use bullet')) {
    conflicts.push('avoid bullets vs use bullets');
  }
  
  return {
    name: 'No conflicting instructions',
    passed: conflicts.length === 0,
    message: conflicts.length === 0 
      ? 'No conflicting instructions found' 
      : `Conflicting instructions: ${conflicts.join(', ')}`
  };
}

/**
 * Check prompt length is appropriate (not too short, not too long)
 */
function evalAppropriateLength(prompt: string): EvalResult {
  const wordCount = prompt.split(/\s+/).length;
  const isAppropriate = wordCount >= 15 && wordCount <= 200;
  
  return {
    name: 'Appropriate prompt length',
    passed: isAppropriate,
    message: isAppropriate 
      ? `Prompt length is appropriate (${wordCount} words)` 
      : `Prompt length may be ${wordCount < 15 ? 'too short' : 'too long'} (${wordCount} words)`
  };
}

/**
 * Mode-specific eval: Explain mode should focus on clarity
 */
function evalExplainModeQuality(prompt: string): EvalResult {
  const qualityKeywords = [
    'clear', 'accessible', 'understand', 'why', 'how',
    'break down', 'explain', 'context', 'jargon'
  ];
  
  const score = qualityKeywords.filter(kw => 
    prompt.toLowerCase().includes(kw)
  ).length;
  
  return {
    name: 'Explain mode quality',
    passed: score >= 3,
    score,
    message: `Explain mode has ${score}/9 quality indicators`
  };
}

/**
 * Mode-specific eval: Summarize mode should focus on key points
 */
function evalSummarizeModeQuality(prompt: string): EvalResult {
  const qualityKeywords = [
    'key', 'main', 'important', 'essential', 'core',
    'conclusion', 'summary', 'highlight', 'prioritize'
  ];
  
  const score = qualityKeywords.filter(kw => 
    prompt.toLowerCase().includes(kw)
  ).length;
  
  return {
    name: 'Summarize mode quality',
    passed: score >= 3,
    score,
    message: `Summarize mode has ${score}/9 quality indicators`
  };
}

/**
 * Mode-specific eval: Analyze mode should focus on critical thinking
 */
function evalAnalyzeModeQuality(prompt: string): EvalResult {
  const qualityKeywords = [
    'pattern', 'insight', 'strength', 'weakness', 'implication',
    'analysis', 'critical', 'evaluate', 'examine'
  ];
  
  const score = qualityKeywords.filter(kw => 
    prompt.toLowerCase().includes(kw)
  ).length;
  
  return {
    name: 'Analyze mode quality',
    passed: score >= 3,
    score,
    message: `Analyze mode has ${score}/9 quality indicators`
  };
}

/**
 * Mode-specific eval: Challenge mode should be balanced
 */
function evalChallengeModeQuality(prompt: string): EvalResult {
  const qualityKeywords = [
    'steelman', 'counterargument', 'assumption', 'bias',
    'fair', 'balanced', 'perspective', 'missing', 'challenge'
  ];
  
  const score = qualityKeywords.filter(kw => 
    prompt.toLowerCase().includes(kw)
  ).length;
  
  return {
    name: 'Challenge mode quality',
    passed: score >= 3,
    score,
    message: `Challenge mode has ${score}/9 quality indicators`
  };
}

// ============================================================================
// Run Evals
// ============================================================================

function runSystemPromptEvals(mode: Mode): EvalSuite {
  const prompt = SYSTEM_PROMPTS[mode];
  const results: EvalResult[] = [];
  
  // Common evals for all modes
  results.push(evalHasRoleDefinition(prompt));
  results.push(evalHasFormatGuidance(prompt));
  results.push(evalHasLengthGuidance(prompt));
  results.push(evalNoConflictingInstructions(prompt));
  results.push(evalAppropriateLength(prompt));
  
  // Mode-specific evals
  if (mode === 'explain') {
    results.push(evalExplainModeQuality(prompt));
  } else if (mode === 'summarize') {
    results.push(evalSummarizeModeQuality(prompt));
  } else if (mode === 'analyze') {
    results.push(evalAnalyzeModeQuality(prompt));
  } else if (mode === 'challenge') {
    results.push(evalChallengeModeQuality(prompt));
  }
  
  const passed = results.filter(r => r.passed).length;
  
  return {
    name: `${mode.toUpperCase()} System Prompt`,
    results,
    passRate: passed / results.length
  };
}

function runUserPromptEvals(mode: Mode): EvalSuite {
  const promptFn = USER_PROMPTS[mode];
  const prompt = typeof promptFn === 'function' 
    ? promptFn(TEST_INPUTS.technical) 
    : promptFn;
    
  const results: EvalResult[] = [];
  
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

function runFollowUpPromptEvals(mode: Mode): EvalSuite {
  const prompt = FOLLOW_UP_SYSTEM_PROMPTS[mode];
  const results: EvalResult[] = [];
  
  results.push(evalHasRoleDefinition(prompt));
  results.push(evalHasFormatGuidance(prompt));
  results.push(evalNoConflictingInstructions(prompt));
  
  // Check for context continuity guidance
  const hasContextGuidance = prompt.toLowerCase().includes('previous') || 
    prompt.toLowerCase().includes('context') ||
    prompt.toLowerCase().includes('continuing');
  
  results.push({
    name: 'Has context continuity guidance',
    passed: hasContextGuidance,
    message: hasContextGuidance 
      ? 'Prompt handles conversation context' 
      : 'Missing context continuity guidance'
  });
  
  // Check for anti-repetition guidance
  const hasAntiRepetition = prompt.toLowerCase().includes('avoid') ||
    prompt.toLowerCase().includes('repetition') ||
    prompt.toLowerCase().includes('fresh') ||
    prompt.toLowerCase().includes('new');
  
  results.push({
    name: 'Has anti-repetition guidance',
    passed: hasAntiRepetition,
    message: hasAntiRepetition 
      ? 'Prompt avoids repetition' 
      : 'Missing anti-repetition guidance'
  });
  
  const passed = results.filter(r => r.passed).length;
  
  return {
    name: `${mode.toUpperCase()} Follow-up Prompt`,
    results,
    passRate: passed / results.length
  };
}

// ============================================================================
// Main Export
// ============================================================================

export function runAllEvals(): { suites: EvalSuite[]; totalPassRate: number } {
  const modes: Mode[] = ['explain', 'summarize', 'analyze', 'challenge', 'translate', 'free'];
  const suites: EvalSuite[] = [];
  
  for (const mode of modes) {
    suites.push(runSystemPromptEvals(mode));
    suites.push(runUserPromptEvals(mode));
    if (FOLLOW_UP_SYSTEM_PROMPTS[mode]) {
      suites.push(runFollowUpPromptEvals(mode));
    }
  }
  
  const totalPassed = suites.reduce((acc, s) => acc + s.results.filter(r => r.passed).length, 0);
  const totalTests = suites.reduce((acc, s) => acc + s.results.length, 0);
  
  return {
    suites,
    totalPassRate: totalPassed / totalTests
  };
}

export function printEvalReport(): void {
  const { suites, totalPassRate } = runAllEvals();
  
  console.log('\n' + '='.repeat(60));
  console.log('PROMPT EVALS REPORT');
  console.log('='.repeat(60) + '\n');
  
  for (const suite of suites) {
    const status = suite.passRate === 1 ? '✅' : suite.passRate >= 0.7 ? '⚠️' : '❌';
    console.log(`${status} ${suite.name} (${Math.round(suite.passRate * 100)}% pass rate)`);
    
    for (const result of suite.results) {
      const icon = result.passed ? '  ✓' : '  ✗';
      console.log(`${icon} ${result.name}: ${result.message}`);
    }
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log(`TOTAL PASS RATE: ${Math.round(totalPassRate * 100)}%`);
  console.log('='.repeat(60) + '\n');
}

// Export test inputs for external use
export { TEST_INPUTS };

// Export individual eval functions for targeted testing
export {
  evalHasFormatGuidance,
  evalHasLengthGuidance,
  evalHasRoleDefinition,
  evalHasAntiHallucination,
  evalNoConflictingInstructions,
  evalAppropriateLength
};

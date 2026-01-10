#!/usr/bin/env npx ts-node
/**
 * Run prompt evals from command line
 * Usage: npx ts-node src/evals/run-evals.ts
 */

import { runAllEvals } from './prompt-evals';

const { suites, totalPassRate } = runAllEvals();

console.log('\n' + '='.repeat(60));
console.log('PROMPT EVALS REPORT');
console.log('='.repeat(60) + '\n');

let failedTests: string[] = [];

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

console.log('='.repeat(60));
console.log(`TOTAL PASS RATE: ${Math.round(totalPassRate * 100)}%`);
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

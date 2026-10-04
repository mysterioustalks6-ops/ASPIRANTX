import { runContrastAudit } from '../src/design-system/tokens.ts';

const results = runContrastAudit();
console.log(`Total pairs audited: ${results.length}`);
const passes = results.filter(r => r.passesAA);
const failures = results.filter(r => !r.passesAA);
console.log(`Passes: ${passes.length} / ${results.length}`);
console.log(`Failures: ${failures.length}`);

console.log('\n--- Real Rendered Pairs & Token Pairs Contrast Audit (WCAG AA) ---');
results.forEach(r => {
  const status = r.passesAA ? 'PASS' : 'FAIL';
  const grade = r.passesAAA ? 'AAA' : 'AA';
  console.log(`[${status} - ${grade}] ${r.name.padEnd(52)} Ratio: ${r.ratio.toFixed(2)}:1 (Min: ${r.minRequired}:1) | ${r.foregroundHex} on ${r.backgroundHex}`);
});

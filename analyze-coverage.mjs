import { readFileSync, statSync } from 'fs';

const raw = readFileSync('./coverage/coverage-final.json', 'utf-8');
const cov = JSON.parse(raw);
const keys = Object.keys(cov);

const results = keys.map(k => {
  const entry = cov[k];
  const path = entry.path || k;
  if (!path.startsWith('/Users/') && !path.startsWith('src/')) return null;

  const totalS = entry.s ? Object.keys(entry.s).length : 0;
  const covS = entry.s ? Object.values(entry.s).filter(v => v > 0).length : 0;
  const totalF = entry.f ? Object.keys(entry.f).length : 0;
  const covF = entry.f ? Object.values(entry.f).filter(v => v > 0).length : 0;
  const totalB = entry.b ? Object.values(entry.b).reduce((sum, arr) => sum + arr.length, 0) : 0;
  const covB = entry.b ? Object.values(entry.b).reduce((sum, arr) => sum + arr.filter(v => v > 0).length, 0) : 0;

  const sPct = totalS === 0 ? 100 : (covS / totalS) * 100;
  const totalStmts = totalS;
  const uncoveredStmts = totalS - covS;

  // Get file size
  let fileSize = 0;
  try {
    fileSize = statSync(path).size;
  } catch { /* ignore */ }

  return {
    name: path.replace('/Users/yanyu/YanYuCloud/YYC3-AI-PAI/', ''),
    s: sPct,
    totalStmts,
    uncoveredStmts,
    fileSize,
    hasTest: false
  };
}).filter(Boolean);

// Check which files have tests
results.forEach(r => {
  const baseName = r.name.replace(/\.(ts|tsx)$/, '');
  try {
    const testFile = statSync(baseName + '.test.ts');
    r.hasTest = true;
  } catch {
    try {
      const testFile = statSync(baseName + '.test.tsx');
      r.hasTest = true;
    } catch {
      // no test file
    }
  }
});

// Sort by uncovered statements descending (biggest impact first)
const zeroCoverage = results.filter(r => r.s < 10).sort((a, b) => b.totalStmts - a.totalStmts);
const lowCoverage = results.filter(r => r.s >= 10 && r.s < 60).sort((a, b) => b.totalStmts - a.totalStmts);

console.log('=== Zero/Near-Zero Coverage Files by Impact (largest first) ===');
console.log('File | Stmts% | TotalStmts | HasTest | FileSize');
zeroCoverage.forEach(r => console.log(r.name + ' | ' + r.s.toFixed(1) + '% | ' + r.totalStmts + ' | ' + r.hasTest + ' | ' + (r.fileSize / 1024).toFixed(1) + 'KB'));

console.log('\n=== Low Coverage Files (10-60%) by Impact ===');
lowCoverage.forEach(r => console.log(r.name + ' | ' + r.s.toFixed(1) + '% | ' + r.totalStmts + ' | ' + r.hasTest));

console.log('\n=== Summary ===');
console.log('Zero/near-zero coverage files: ' + zeroCoverage.length);
console.log('Low coverage files (10-60%): ' + lowCoverage.length);
console.log('Total uncovered statements in zero-coverage files: ' + zeroCoverage.reduce((s, r) => s + r.uncoveredStmts, 0));

// Calculate what would happen if we covered 80% of zero-coverage files
const totalStmtsAll = results.reduce((s, r) => s + r.totalStmts, 0);
const covStmtsAll = results.reduce((s, r) => s + (r.totalStmts - r.uncoveredStmts), 0);
console.log('\nCurrent: ' + (covStmtsAll / totalStmtsAll * 100).toFixed(2) + '% covered (' + covStmtsAll + '/' + totalStmtsAll + ' stmts)');

// If we add tests for top 5 largest zero-coverage files that have no tests, covering them to 80%
const top5 = zeroCoverage.filter(r => !r.hasTest).slice(0, 5);
const additionalCov = top5.reduce((s, r) => s + Math.round(r.totalStmts * 0.8), 0);
const newTotal = covStmtsAll + additionalCov;
console.log('If top 5 untested zero-coverage files are tested to 80%: ' + (newTotal / totalStmtsAll * 100).toFixed(2) + '%');
top5.forEach(r => console.log('  - ' + r.name + ' (' + r.totalStmts + ' stmts, +' + Math.round(r.totalStmts * 0.8) + ' covered)'));

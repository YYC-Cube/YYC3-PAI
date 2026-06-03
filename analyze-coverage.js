const cov = require('./coverage/coverage-final.json');
const files = Object.entries(cov).map(([k, v]) => {
  const name = k.replace('/Users/yanyu/YanYuCloud/YYC3-AI-PAI/', '');
  const {branches, functions, lines, statements} = v;
  const b = branches?.pct ?? 0;
  const f = functions?.pct ?? 0;
  const l = lines?.pct ?? 0;
  const s = statements?.pct ?? 0;
  return { name, b, f, l, s, avg: (b+f+l+s)/4 };
});

const srcFiles = files.filter(f => f.name.startsWith('src/'));
srcFiles.sort((a, b) => a.l - b.l);

console.log('== Top 30 lowest line coverage source files ==');
console.log('File | Lines% | Functions% | Branches%');
console.log('----------------------------------------');
srcFiles.slice(0, 30).forEach(f => {
  console.log(f.name + ' | ' + f.l.toFixed(1) + '% | ' + f.f.toFixed(1) + '% | ' + f.b.toFixed(1) + '%');
});

console.log('\n== Summary by directory (2-level) ==');
const dirs = {};
srcFiles.forEach(f => {
  const parts = f.name.split('/');
  const dir = parts.slice(0, 4).join('/');
  if (!dirs[dir]) dirs[dir] = { files: 0, lines: 0, funcs: 0, branches: 0 };
  dirs[dir].files++;
  dirs[dir].lines += f.l;
  dirs[dir].funcs += f.f;
  dirs[dir].branches += f.b;
});

const sortedDirs = Object.entries(dirs).sort((a, b) => (a[1].lines/a[1].files) - (b[1].lines/b[1].files));
sortedDirs.forEach(([d, v]) => {
  console.log(d + ' (' + v.files + ' files) | Lines: ' + (v.lines/v.files).toFixed(1) + '% | Funcs: ' + (v.funcs/v.files).toFixed(1) + '%');
});
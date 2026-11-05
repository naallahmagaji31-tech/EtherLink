/**
 * scripts/validate.js
 * Cross-platform validator for HTML, JS, and CSS asset references.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
let errors = 0;

console.log('==> Validating HTML well-formedness...');
const htmlFiles = [path.join(ROOT_DIR, 'index.html'), path.join(ROOT_DIR, 'dashboard.html')].filter(fs.existsSync);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/<!DOCTYPE\s+html>/i.test(html)) {
    console.error(`  ${file}: missing <!DOCTYPE html>`);
    errors++;
    continue;
  }

  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);
  const stack = [];
  let i = 0;
  let wellFormed = true;

  while (i < html.length) {
    if (html[i] !== '<') { i++; continue; }
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    let j = i + 1;
    let inQuote = false;
    let quoteChar = '';
    while (j < html.length) {
      const ch = html[j];
      if (inQuote) {
        if (ch === quoteChar) inQuote = false;
      } else if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === '>') {
        break;
      }
      j++;
    }
    if (j >= html.length) break;
    const raw = html.slice(i, j + 1);
    i = j + 1;

    const tagMatch = raw.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
    if (!tagMatch) continue;
    const tag = tagMatch[1].toLowerCase();
    const isClosing = raw[1] === '/';
    const isSelfClosing = raw.endsWith('/>');

    if (voidElements.has(tag)) continue;

    if (isClosing) {
      if (stack.length === 0 || stack[stack.length - 1] !== tag) {
        console.error(`  ${file}: unexpected </${tag}> (expected </${stack[stack.length - 1] || '?'}>)`);
        wellFormed = false;
        errors++;
        break;
      }
      stack.pop();
    } else if (!isSelfClosing) {
      stack.push(tag);
    }
  }

  if (stack.length > 0) {
    console.error(`  ${file}: unclosed tags: ${JSON.stringify(stack.slice(0, 10))}`);
    wellFormed = false;
    errors++;
  } else if (wellFormed) {
    console.log(`  ${path.basename(file)}: OK`);
  }
}

console.log('\n==> Validating JavaScript syntax...');
const jsFiles = [
  path.join(ROOT_DIR, 'assets', 'dashboard.js'),
  path.join(ROOT_DIR, 'scripts', 'build.js'),
  path.join(ROOT_DIR, 'scripts', 'serve.js')
].filter(fs.existsSync);

for (const file of jsFiles) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    new vm.Script(code, { filename: file });
    console.log(`  ${path.basename(file)}: OK`);
  } catch (err) {
    console.error(`  ${file}: SYNTAX ERROR - ${err.message}`);
    errors++;
  }
}

console.log('\n==> Validating internal links and assets...');
for (const file of htmlFiles) {
  const dir = path.dirname(file);
  const html = fs.readFileSync(file, 'utf8');
  let ok = true;
  const attrRe = /(?:href|src)\s*=\s*["']([^"'#]+)["']/g;
  let m;
  while ((m = attrRe.exec(html)) !== null) {
    const ref = m[1];
    if (/^https?:\/\//.test(ref) || /^mailto:/.test(ref)) continue;
    const target = path.resolve(dir, ref);
    if (!fs.existsSync(target)) {
      console.error(`  ${path.basename(file)}: missing reference '${ref}'`);
      ok = false;
      errors++;
    }
  }
  if (ok) console.log(`  ${path.basename(file)}: OK`);
}

const cssFiles = [
  path.join(ROOT_DIR, 'styles.css'),
  path.join(ROOT_DIR, 'assets', 'dashboard.css')
].filter(fs.existsSync);

for (const file of cssFiles) {
  const dir = path.dirname(file);
  const css = fs.readFileSync(file, 'utf8');
  let ok = true;
  const urlRe = /url\((?:['"]?)([^'"\\)]+)(?:['"]?)\)/g;
  let m;
  while ((m = urlRe.exec(css)) !== null) {
    const ref = m[1];
    if (/^https?:\/\//.test(ref) || /^data:/.test(ref)) continue;
    const target = path.resolve(dir, ref);
    if (!fs.existsSync(target)) {
      console.error(`  ${path.basename(file)}: missing url() '${ref}'`);
      ok = false;
      errors++;
    }
  }
  if (ok) console.log(`  ${path.basename(file)}: OK`);
}

console.log('');
if (errors > 0) {
  console.error(`❌ Validation failed (${errors} check(s) failed)`);
  process.exit(1);
} else {
  console.log('✅ All frontend validation checks passed');
}

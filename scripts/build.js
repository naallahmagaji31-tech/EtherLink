/**
 * scripts/build.js
 * Builds production static distribution to dist/ directory.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('==> Starting Frontend Build...');

// 1. Run validation
console.log('==> Step 1: Running validation checks...');
try {
  execSync(`node "${path.join(__dirname, 'validate.js')}"`, { stdio: 'inherit', cwd: ROOT_DIR });
} catch (err) {
  console.error('Build aborted: validation failed.');
  process.exit(1);
}

// 2. Prepare dist directory
console.log('\n==> Step 2: Preparing dist directory...');
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// 3. Copy files to dist
console.log('==> Step 3: Copying assets to dist/...');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const itemsToCopy = ['index.html', 'dashboard.html', 'styles.css', 'assets'];

for (const item of itemsToCopy) {
  const srcPath = path.join(ROOT_DIR, item);
  const destPath = path.join(DIST_DIR, item);
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
    console.log(`  Copied ${item} -> dist/${item}`);
  }
}

// 4. Verify dist contents
console.log('\n==> Step 4: Verifying build outputs...');
const requiredOutputs = [
  path.join(DIST_DIR, 'index.html'),
  path.join(DIST_DIR, 'dashboard.html'),
  path.join(DIST_DIR, 'styles.css'),
  path.join(DIST_DIR, 'assets', 'dashboard.js'),
  path.join(DIST_DIR, 'assets', 'dashboard.css')
];

let allFound = true;
for (const out of requiredOutputs) {
  if (!fs.existsSync(out)) {
    console.error(`  Missing build artifact: ${out}`);
    allFound = false;
  }
}

if (!allFound) {
  console.error('❌ Build failed: output verification incomplete.');
  process.exit(1);
}

console.log('\n✅ Build completed successfully! Production bundle ready in dist/');

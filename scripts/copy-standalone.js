const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(root, '.next', 'standalone', '.next', 'static');
const publicSrc = path.join(root, 'public');
const publicDest = path.join(root, '.next', 'standalone', 'public');

try {
  if (fs.existsSync(staticSrc)) {
    fs.mkdirSync(path.dirname(staticDest), { recursive: true });
    fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
    console.log('✅ Copied .next/static to .next/standalone/.next/static');
  } else {
    console.warn('⚠️ static folder not found at', staticSrc);
  }

  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
    console.log('✅ Copied public to .next/standalone/public');
  }
} catch (err) {
  console.error('Error copying standalone static files:', err);
}

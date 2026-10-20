const fs = require('fs');
const path = require('path');
const sharp = (() => {
  try { return require('sharp'); } catch (e) { return null; }
})();

const PUBLIC_IMAGES = path.join(__dirname, '..', 'public', 'images');
const BACKUP_DIR = path.join(PUBLIC_IMAGES, 'backup');

function usage() {
  console.log('Usage: node tools/replace-images.cjs <folder-with-images>');
  console.log('Copies images from the provided folder into public/images, backing up originals.');
}

const srcDir = process.argv[2] || path.join(__dirname, 'new-images');
if (!fs.existsSync(srcDir)) {
  console.error('Source folder does not exist:', srcDir);
  usage();
  process.exit(1);
}

if (!fs.existsSync(PUBLIC_IMAGES)) {
  console.error('public/images folder missing:', PUBLIC_IMAGES);
  process.exit(2);
}

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const entries = fs.readdirSync(srcDir).filter(f => !f.startsWith('.'));
if (!entries.length) {
  console.log('No files found in', srcDir);
  process.exit(0);
}

const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
let replaced = 0;

for (const file of entries) {
  const full = path.join(srcDir, file);
  const stat = fs.statSync(full);
  if (!stat.isFile()) continue;
  const ext = path.extname(file).toLowerCase();
  if (!allowedExt.includes(ext)) {
    console.log('Skipping (unsupported ext):', file);
    continue;
  }
  const dest = path.join(PUBLIC_IMAGES, file);
  if (fs.existsSync(dest)) {
    const bakName = file + '.' + Date.now() + '.bak';
    fs.copyFileSync(dest, path.join(BACKUP_DIR, bakName));
    console.log('Backed up', file, '->', path.join('public/images/backup', bakName));
  }
  fs.copyFileSync(full, dest);
  console.log('Copied', file, '-> public/images/');
  replaced++;
  if (sharp) {
    try {
      const meta = sharp(dest).metadata().then(m => console.log('  metadata:', m.format, m.width + 'x' + m.height)).catch(()=>{});
    } catch (e) {}
  }
}

console.log('Done. Replaced', replaced, 'files.');
process.exit(0);

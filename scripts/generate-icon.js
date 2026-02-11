const sharp = require('sharp');
const path = require('path');

const SIZE = 128;

// Create SVG with PrmKit logo: "P>" terminal-style icon
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <!-- Rounded background -->
  <rect width="${SIZE}" height="${SIZE}" rx="24" fill="url(#bg)"/>
  <!-- Terminal prompt symbol > -->
  <polyline points="30,42 56,64 30,86" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <!-- Cursor/text lines -->
  <line x1="64" y1="64" x2="100" y2="64" stroke="white" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
  <line x1="64" y1="84" x2="88" y2="84" stroke="white" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
</svg>`;

async function generate() {
  const outPath = path.join(__dirname, '..', 'resources', 'icon.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Icon generated: ${outPath} (${SIZE}x${SIZE})`);
}

generate().catch(console.error);

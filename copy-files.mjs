/**
 * Copy plugin files to build directory
 * Does NOT delete build/ - preserves tikzjax.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, 'build');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

console.log('\n📄 Copying plugin files...');

const files = [
    { src: 'manifest.json', required: true },
    { src: 'main.js', required: true },
    { src: 'styles.css', required: false },
];

for (const file of files) {
    const src = path.join(__dirname, file.src);
    const dest = path.join(buildDir, file.src);

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        const size = (fs.statSync(src).size / 1024 / 1024).toFixed(2);
        console.log(`✅ ${file.src} (${size} MB)`);
    } else if (file.required) {
        console.error(`❌ Missing: ${file.src}`);
        process.exit(1);
    }
}

// Check tikzjax.js (downloaded by update-tikzjax.mjs)
const tikzFile = path.join(buildDir, 'tikzjax.js');
if (fs.existsSync(tikzFile)) {
    const size = (fs.statSync(tikzFile).size / 1024 / 1024).toFixed(2);
    console.log(`✅ tikzjax.js (${size} MB)`);
} else {
    console.error('❌ tikzjax.js missing!');
    console.log('   Run: npm run update-tikzjax');
    process.exit(1);
}

console.log('\n✅ Build complete! Files are in build/');

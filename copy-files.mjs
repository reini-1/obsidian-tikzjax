/**
 * Copy static files to build directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, 'build');

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

console.log('\n📄 Copying static files...');

const files = ['manifest.json', 'styles.css'];

for (const file of files) {
    const src = path.join(__dirname, file);
    const dest = path.join(buildDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ ${file}`);
    }
}

console.log('\n✅ Build complete!');

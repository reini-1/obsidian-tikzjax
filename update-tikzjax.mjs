/**
 * Download TikZJax from flksgrd (with fallbacks)
 * Uses native Node.js https - no external dependencies
 * Run: npm run update-tikzjax
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, 'build');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// Sources in priority order
const SOURCES = [
    {
        name: 'flksgrd',
        url: 'https://raw.githubusercontent.com/flksgrd/obsidian-tikzjax/main/tikzjax.js',
    },
    {
        name: 'drgrice1',
        url: 'https://raw.githubusercontent.com/drgrice1/tikzjax/main/dist/tikzjax.js',
    },
    {
        name: 'artisticat',
        url: 'https://raw.githubusercontent.com/artisticat1/obsidian-tikzjax/master/tikzjax.js',
    },
];

/**
 * Download a file with native Node.js https
 */
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        let downloaded = 0;
        let total = 0;

        const request = https.get(url, (response) => {
            // Follow redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirect = response.headers.location;
                if (redirect) {
                    downloadFile(redirect, destPath).then(resolve).catch(reject);
                    return;
                }
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            total = parseInt(response.headers['content-length'] || '0', 10);

            response.pipe(file);

            response.on('data', (chunk) => {
                downloaded += chunk.length;
                if (total > 0) {
                    const pct = ((downloaded / total) * 100).toFixed(1);
                    process.stdout.write(`\r  ${pct}% (${(downloaded / 1024 / 1024).toFixed(2)} MB)`);
                }
            });

            file.on('finish', () => {
                file.close();
                const size = (fs.statSync(destPath).size / 1024 / 1024).toFixed(2);
                console.log(`\r✅ ${path.basename(destPath)} (${size} MB)  `);
                resolve();
            });

            file.on('error', (err) => {
                fs.unlink(destPath, () => { });
                reject(err);
            });

            response.on('error', reject);
        });

        request.on('error', reject);
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Timeout'));
        });
    });
}

/**
 * Copy from NPM package (fallback if download fails)
 */
function copyFromNpm() {
    console.log('\n📦 Trying NPM fallback...');

    const npmPaths = [
        path.join(__dirname, 'node_modules', '@drgrice1', 'tikzjax', 'dist', 'tikzjax.js'),
        path.join(__dirname, 'node_modules', 'tikzjax', 'dist', 'tikzjax.js'),
    ];

    for (const src of npmPaths) {
        if (fs.existsSync(src)) {
            const dest = path.join(buildDir, 'tikzjax.js');
            fs.copyFileSync(src, dest);
            const size = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
            console.log(`✅ Copied from NPM (${size} MB)`);
            return true;
        }
    }

    console.log('⚠️  NPM package not found');
    return false;
}

/**
 * Copy from root (final fallback)
 */
function copyFromRoot() {
    const src = path.join(__dirname, 'tikzjax.js');
    if (fs.existsSync(src)) {
        const dest = path.join(buildDir, 'tikzjax.js');
        fs.copyFileSync(src, dest);
        const size = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
        console.log(`✅ Copied from root (${size} MB)`);
        return true;
    }
    return false;
}

/**
 * Verify tikzjax.js exists in build/
 */
function verify() {
    const file = path.join(buildDir, 'tikzjax.js');
    if (fs.existsSync(file)) {
        const size = (fs.statSync(file).size / 1024 / 1024).toFixed(2);
        console.log(`\n✅ tikzjax.js present (${size} MB)`);
        return true;
    }
    console.log('\n❌ tikzjax.js MISSING in build/');
    return false;
}

// ==================== MAIN ====================

console.log('🔄 Updating TikZJax...\n');

let success = false;

// Try download sources in priority order
for (const source of SOURCES) {
    console.log(`📥 Trying: ${source.name}`);
    try {
        await downloadFile(source.url, path.join(buildDir, 'tikzjax.js'));
        success = true;
        break;
    } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
    }
}

// Fallbacks if all downloads failed
if (!success) {
    console.log('\n⚠️  All downloads failed, trying fallbacks...');
    success = copyFromNpm() || copyFromRoot();
}

// Final check
if (verify()) {
    console.log('\n✅ TikZJax update complete!');
} else {
    console.error('\n❌ Could not obtain tikzjax.js');
    process.exit(1);
}

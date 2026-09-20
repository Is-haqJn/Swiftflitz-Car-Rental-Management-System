/**
 * ssg.mjs - lightweight static site generation for SEO.
 *
 * Runs after `vite build`. Routes and their metadata are sourced
 * automatically from src/website/constants/routeMeta.mjs - the same
 * file the React routes use - so there is a single source of truth.
 *
 * Env vars (read from .env / environment):
 *   VITE_SITE_URL   - canonical base URL  (default: https://www.swiftflitz.com)
 *   VITE_OG_IMAGE   - default OG image path (default: /og-image.png)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/* Env loading */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const envFile = path.join(__dirname, '.env');
    if (!fs.existsSync(envFile)) return;
    for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed
            .slice(eq + 1)
            .trim()
            .replace(/^["']|["']$/g, '');
        if (!(key in process.env)) process.env[key] = val;
    }
}

loadEnv();

const SITE_URL = (
    process.env.VITE_SITE_URL || 'https://www.swiftflitz.com'
).replace(/\/$/, '');
const DEFAULT_IMAGE = process.env.VITE_OG_IMAGE || '/og-image.png';

/* Route metadata (auto-imported - single source of truth) */
const routeMeta = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, 'src/website/constants/routeMeta.json'),
        'utf-8'
    )
);

/* HTML template */
const distDir = path.join(__dirname, 'dist');
const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

/* Meta injection */
function injectMeta(html, { path: routePath, title, description, keywords }) {
    const ogUrl = `${SITE_URL}${routePath === '/' ? '' : routePath}`;
    const ogImage = `${SITE_URL}${DEFAULT_IMAGE}`;

    let out = html
        .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
        .replace(
            /(<meta\s+name="description"\s+content=")[^"]*(")/i,
            `$1${description}$2`
        )
        .replace(
            /(<meta\s+property="og:title"\s+content=")[^"]*(")/i,
            `$1${title}$2`
        )
        .replace(
            /(<meta\s+property="og:description"\s+content=")[^"]*(")/i,
            `$1${description}$2`
        )
        .replace(
            /(<meta\s+property="og:url"\s+content=")[^"]*(")/i,
            `$1${ogUrl}$2`
        )
        .replace(
            /(<meta\s+property="og:image"\s+content=")[^"]*(")/i,
            `$1${ogImage}$2`
        );

    // Inject / update keywords meta if the route defines them
    if (keywords) {
        if (/<meta\s+name="keywords"/i.test(out)) {
            out = out.replace(
                /(<meta\s+name="keywords"\s+content=")[^"]*(")/i,
                `$1${keywords}$2`
            );
        } else {
            out = out.replace(
                '</head>',
                `    <meta name="keywords" content="${keywords}" />\n    </head>`
            );
        }
    }

    // Add canonical link
    out = out.replace(
        '</head>',
        `    <link rel="canonical" href="${ogUrl}" />\n    </head>`
    );

    return out;
}

/* Write output files */
let generated = 0;

for (const meta of routeMeta) {
    const html = injectMeta(template, meta);
    const isRoot = meta.path === '/';
    const dir = path.join(distDir, isRoot ? '' : meta.path);
    const file = isRoot
        ? path.join(distDir, 'index.html')
        : path.join(dir, 'index.html');

    if (!isRoot) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, html, 'utf-8');

    console.log(`  ✓ ${meta.path.padEnd(20)} ${meta.title}`);
    generated++;
}

console.log(`\nSSG complete - ${generated} routes written to dist/\n`);

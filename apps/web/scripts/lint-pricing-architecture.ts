/**
 * Phase 00: CI Anti-Duplication Lint
 * 
 * Enforces architecture rule: all pricing math in engine.ts/service.ts only.
 * 
 * Rules:
 * 1. API routes must NOT import from engine.ts (must use service.ts)
 * 2. "use client" files must NOT import from lib/pricing/* (except types.ts)
 * 3. Routes/components must NOT contain inline pricing math patterns
 * 
 * Run: npx tsx scripts/lint-pricing-architecture.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const WEB_ROOT = join(__dirname, '..');
const PRICING_LIB = 'lib/pricing';
let violations = 0;

function walkDir(dir: string): string[] {
    const results: string[] = [];
    try {
        for (const entry of readdirSync(dir)) {
            const fullPath = join(dir, entry);
            if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                results.push(...walkDir(fullPath));
            } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
                results.push(fullPath);
            }
        }
    } catch {
        // Skip inaccessible dirs
    }
    return results;
}

function fail(file: string, line: number, rule: string, detail: string) {
    const rel = relative(WEB_ROOT, file).split(sep).join('/');
    console.log(`❌ ${rel}:${line} [${rule}] ${detail}`);
    violations++;
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 Phase 00: Anti-Duplication Lint');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Collect files
const routeFiles = walkDir(join(WEB_ROOT, 'app', 'api')).filter(f => f.endsWith('route.ts'));
const allFiles = walkDir(WEB_ROOT);
const componentFiles = allFiles.filter(f => f.endsWith('.tsx'));
const pricingEngineFile = join(WEB_ROOT, PRICING_LIB, 'engine.ts').split(sep).join('/');
const pricingServiceFile = join(WEB_ROOT, PRICING_LIB, 'service.ts').split(sep).join('/');

// Pricing math regex patterns (simplified but effective)
const MATH_PATTERNS = [
    { regex: /\*\s*\(\s*1\s*-.*(?:percent|discount|commission)/, desc: 'inline discount multiplication' },
    { regex: /\/\s*\(\s*1\s*-.*(?:percent|discount)/, desc: 'inline discount division' },
    { regex: /totalDiscount\s*=.*reduce/, desc: 'totalDiscount computed inline' },
    { regex: /multiplier\s*\*=\s*\(\s*1\s*-/, desc: 'progressive discount inline calc' },
];

// ── Rule 1: Route files must NOT import engine directly ──────────

console.log('Rule 1: API routes must NOT import engine.ts directly\n');

for (const file of routeFiles) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check for direct engine import, but allow service import
        if (
            (line.includes("from '@/lib/pricing/engine'") ||
                line.includes('from "@/lib/pricing/engine"') ||
                line.includes("from '../lib/pricing/engine'") ||
                line.includes("from '../../lib/pricing/engine'"))
        ) {
            fail(file, i + 1, 'ROUTE_IMPORTS_ENGINE',
                'Route should import from service.ts, not engine.ts');
        }
    }
}

// ── Rule 2: "use client" files must NOT import pricing (except types) ──

console.log('\nRule 2: Client files must NOT import lib/pricing/* (except types)\n');

for (const file of componentFiles) {
    const content = readFileSync(file, 'utf8');
    if (!content.includes("'use client'") && !content.includes('"use client"')) continue;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
            line.includes('lib/pricing/') &&
            !line.includes('lib/pricing/types') &&
            !line.includes('lib/pricing/catalog') &&  // catalog.ts = static data, not pricing math
            (line.includes('import ') || line.includes('require('))
        ) {
            fail(file, i + 1, 'CLIENT_IMPORTS_PRICING',
                '"use client" file imports pricing logic (only types.ts allowed)');
        }
    }
}

// ── Rule 3: Routes/components must NOT contain pricing math ──────

console.log('\nRule 3: Routes/components must NOT contain inline pricing math\n');

const filesToCheck = [...routeFiles, ...componentFiles];
// Exclude pricing library files themselves
const pricingDir = join(WEB_ROOT, PRICING_LIB).split(sep).join('/');

for (const file of filesToCheck) {
    const normalized = file.split(sep).join('/');
    if (normalized.startsWith(pricingDir)) continue; // Skip pricing lib files

    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    // Support @pricing-lint-suppress for tech-debt-tracked sections
    const hasSuppression = content.includes('@pricing-lint-suppress');
    let inSuppressedBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('@pricing-lint-suppress')) {
            inSuppressedBlock = !inSuppressedBlock;
            continue;
        }
        if (inSuppressedBlock) continue;
        if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
        for (const pattern of MATH_PATTERNS) {
            if (pattern.regex.test(line)) {
                fail(file, i + 1, 'INLINE_PRICING_MATH', pattern.desc);
            }
        }
    }
}

// ── Summary ──────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (violations === 0) {
    console.log('✅ All architecture rules pass! (0 violations)');
} else {
    console.log(`❌ ${violations} violation(s) found!`);
    process.exitCode = 1;
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

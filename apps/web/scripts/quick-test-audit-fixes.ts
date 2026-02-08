/**
 * Quick Test Script — Verify Audit Fixes (2026-02-08)
 * 
 * Tests:
 * 1. C1: /api/debug-fix-user route deleted
 * 2. W1: /api/fix-users route deleted
 * 3. W2: Rate Shopper write routes have auth + role checks
 * 4. Middleware: no debug-fix-user whitelist
 * 
 * Usage: npx ts-node --skip-project scripts/quick-test-audit-fixes.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_DIR = path.resolve(__dirname, '../app');
const MIDDLEWARE_PATH = path.resolve(__dirname, '../middleware.ts');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
    try {
        const result = fn();
        if (result) {
            console.log(`  ✅ ${name}`);
            passed++;
        } else {
            console.log(`  ❌ ${name}`);
            failed++;
        }
    } catch (e: any) {
        console.log(`  ❌ ${name} — ${e.message}`);
        failed++;
    }
}

console.log('\n🧪 Audit Fix Verification Tests\n');

// ─── C1: debug-fix-user route deleted ───
console.log('── C1: /api/debug-fix-user deleted ──');

test('Route folder does NOT exist', () => {
    return !fs.existsSync(path.join(APP_DIR, 'api/debug-fix-user'));
});

test('Route file does NOT exist', () => {
    return !fs.existsSync(path.join(APP_DIR, 'api/debug-fix-user/route.ts'));
});

// ─── W1: fix-users route deleted ───
console.log('\n── W1: /api/fix-users deleted ──');

test('Route folder does NOT exist', () => {
    return !fs.existsSync(path.join(APP_DIR, 'api/fix-users'));
});

test('Route file does NOT exist', () => {
    return !fs.existsSync(path.join(APP_DIR, 'api/fix-users/route.ts'));
});

// ─── Middleware: no debug whitelist ───
console.log('\n── Middleware: debug whitelist removed ──');

test('Middleware does NOT contain debug-fix-user bypass', () => {
    const content = fs.readFileSync(MIDDLEWARE_PATH, 'utf-8');
    return !content.includes('debug-fix-user');
});

// ─── W2: Rate Shopper auth checks ───
console.log('\n── W2: Rate Shopper write routes have auth ──');

const rateshopperRoutes = [
    { file: 'api/rate-shopper/scan/route.ts', desc: 'Scan POST' },
    { file: 'api/rate-shopper/competitors/route.ts', desc: 'Competitors POST' },
    { file: 'api/rate-shopper/competitors/[id]/route.ts', desc: 'Competitors DELETE' },
    { file: 'api/rate-shopper/recommendations/route.ts', desc: 'Recommendations POST' },
];

for (const route of rateshopperRoutes) {
    const filePath = path.join(APP_DIR, route.file);

    test(`${route.desc}: imports auth`, () => {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes("import { auth }") || content.includes("from '@/lib/auth'");
    });

    test(`${route.desc}: has role check`, () => {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes("Manager role required") || content.includes("status: 403");
    });
}

// ─── Summary ───
console.log('\n' + '═'.repeat(40));
console.log(`\n🧪 Results: ${passed + failed} tests total`);
console.log(`   ✅ ${passed} passed`);
if (failed > 0) {
    console.log(`   ❌ ${failed} FAILED`);
}
console.log('');
process.exit(failed > 0 ? 1 : 0);

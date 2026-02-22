/**
 * i18n Key Parity Audit
 * Compares all locale files against en.json to find missing/extra keys.
 */
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');
const BASE_LOCALE = 'en';
const LOCALES = ['vi', 'id', 'ms', 'th'];

function flattenKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            keys.push(...flattenKeys(value, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

// Load base locale
const baseData = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`), 'utf8'));
const baseKeys = new Set(flattenKeys(baseData));

console.log(`\n📊 i18n KEY PARITY AUDIT`);
console.log(`${'═'.repeat(60)}`);
console.log(`Base: ${BASE_LOCALE}.json → ${baseKeys.size} keys\n`);

let totalMissing = 0;
let totalExtra = 0;

for (const locale of LOCALES) {
    const localeData = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8'));
    const localeKeys = new Set(flattenKeys(localeData));

    const missing = [...baseKeys].filter(k => !localeKeys.has(k));
    const extra = [...localeKeys].filter(k => !baseKeys.has(k));

    const status = missing.length === 0 ? '✅' : '⚠️';
    console.log(`${status} ${locale}.json: ${localeKeys.size} keys | Missing: ${missing.length} | Extra: ${extra.length}`);

    if (missing.length > 0) {
        missing.forEach(k => console.log(`   ❌ MISSING: ${k}`));
        totalMissing += missing.length;
    }
    if (extra.length > 0) {
        extra.forEach(k => console.log(`   ➕ EXTRA:   ${k}`));
        totalExtra += extra.length;
    }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`📋 SUMMARY: ${totalMissing} missing keys, ${totalExtra} extra keys across ${LOCALES.length} locales`);
if (totalMissing === 0) {
    console.log(`✅ ALL LOCALES HAVE FULL KEY PARITY!`);
} else {
    console.log(`⚠️  ${totalMissing} keys need to be added`);
}
console.log('');

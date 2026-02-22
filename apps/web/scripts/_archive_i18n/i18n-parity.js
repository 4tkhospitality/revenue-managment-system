#!/usr/bin/env node

/**
 * CI Gate: i18n Message Key Parity Check
 *
 * Ensures all message files have identical key structures.
 * Run: node scripts/i18n-parity.js
 * Exit code 1 if any keys are missing.
 *
 * @see BRIEF-i18n.md §6.3
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

// Recursively extract all keys from a nested object
function extractKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            keys.push(...extractKeys(value, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys.sort();
}

function main() {
    // Find all .json files in messages/
    const files = fs.readdirSync(MESSAGES_DIR)
        .filter(f => f.endsWith('.json'))
        .sort();

    if (files.length < 2) {
        console.log('⚠️  Only 1 message file found. Parity check skipped.');
        process.exit(0);
    }

    console.log(`\n🔍 i18n Parity Check — ${files.length} locales: ${files.map(f => f.replace('.json', '')).join(', ')}\n`);

    // Load all files and extract keys
    const localeKeys = {};
    for (const file of files) {
        const locale = file.replace('.json', '');
        const content = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), 'utf-8'));
        localeKeys[locale] = new Set(extractKeys(content));
    }

    // Find the union of all keys
    const allKeys = new Set();
    for (const keys of Object.values(localeKeys)) {
        for (const key of keys) {
            allKeys.add(key);
        }
    }

    // Check each locale for missing keys
    let hasErrors = false;
    const missingReport = {};

    for (const [locale, keys] of Object.entries(localeKeys)) {
        const missing = [...allKeys].filter(k => !keys.has(k));
        if (missing.length > 0) {
            hasErrors = true;
            missingReport[locale] = missing;
        }
    }

    // Report
    if (hasErrors) {
        console.log('❌ PARITY FAILED — Missing keys found:\n');
        for (const [locale, missing] of Object.entries(missingReport)) {
            console.log(`  📁 ${locale}.json is missing ${missing.length} key(s):`);
            for (const key of missing) {
                console.log(`    - ${key}`);
            }
            console.log('');
        }
        process.exit(1);
    } else {
        console.log(`✅ PARITY OK — All ${allKeys.size} keys present in all ${files.length} locales.\n`);
        process.exit(0);
    }
}

main();

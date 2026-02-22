/**
 * Fix i18n dot-notation keys in message files.
 * next-intl requires nested objects, not flat "a.b.c" keys.
 * Converts: { "band.r30": "≤ 30 rooms" }
 * To:       { "band": { "r30": "≤ 30 rooms" } }
 */
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');
const FILES = ['en.json', 'vi.json', 'th.json', 'ms.json', 'id.json'];

function nestDotKeys(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Recurse into nested namespaces
            result[key] = nestDotKeys(value);
        } else if (key.includes('.')) {
            // Convert "a.b.c" to nested { a: { b: { c: value } } }
            const parts = key.split('.');
            let current = result;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
        } else {
            result[key] = value;
        }
    }
    return result;
}

let totalFixed = 0;

for (const file of FILES) {
    const filePath = path.join(MESSAGES_DIR, file);
    if (!fs.existsSync(filePath)) {
        console.log(`⏭ ${file} not found, skipping`);
        continue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const messages = JSON.parse(raw);

    // Count dot-keys before
    let dotKeyCount = 0;
    function countDotKeys(obj) {
        for (const [key, value] of Object.entries(obj)) {
            if (key.includes('.')) dotKeyCount++;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                countDotKeys(value);
            }
        }
    }
    countDotKeys(messages);

    if (dotKeyCount === 0) {
        console.log(`✓ ${file} — no dot-keys found`);
        continue;
    }

    const nested = nestDotKeys(messages);
    fs.writeFileSync(filePath, JSON.stringify(nested, null, 2) + '\n', 'utf8');
    console.log(`✅ ${file} — converted ${dotKeyCount} dot-keys to nested`);
    totalFixed += dotKeyCount;
}

console.log(`\nDone! Total: ${totalFixed} dot-keys converted across ${FILES.length} files.`);

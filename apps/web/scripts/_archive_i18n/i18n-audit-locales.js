// Audit: compare namespaces across locales to find id/ms/th missing translations
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');
const locales = ['en', 'vi', 'id', 'ms', 'th'];
const data = {};

for (const l of locales) {
    data[l] = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, l + '.json'), 'utf8'));
}

// 1. List all namespaces per locale
console.log('=== NAMESPACES PER LOCALE ===');
for (const l of locales) {
    console.log(l + ': ' + Object.keys(data[l]).join(', '));
}

// 2. Find namespaces in en that are missing or have fewer keys in id/ms/th
console.log('\n=== MISSING OR INCOMPLETE NAMESPACES IN id/ms/th ===');
const enNamespaces = Object.keys(data.en);
for (const ns of enNamespaces) {
    const enKeys = Object.keys(data.en[ns] || {});
    for (const l of ['id', 'ms', 'th']) {
        const localeKeys = Object.keys(data[l][ns] || {});
        if (localeKeys.length === 0) {
            console.log('[MISSING] ' + l + '.' + ns + ' — 0/' + enKeys.length + ' keys');
        } else if (localeKeys.length < enKeys.length) {
            const missing = enKeys.filter(k => !data[l][ns][k]);
            console.log('[INCOMPLETE] ' + l + '.' + ns + ' — ' + localeKeys.length + '/' + enKeys.length + ' keys. Missing: ' + missing.join(', '));
        }
    }
}

// 3. Check if id/ms/th values are same as en (likely untranslated)
console.log('\n=== UNTRANSLATED (same as EN) in id/ms/th ===');
for (const ns of enNamespaces) {
    const enKeys = Object.keys(data.en[ns] || {});
    for (const l of ['id', 'ms', 'th']) {
        const sameAsEn = [];
        for (const k of enKeys) {
            if (data[l][ns] && data[l][ns][k] === data.en[ns][k] && data.vi[ns] && data.vi[ns][k] !== data.en[ns][k]) {
                // Key exists in locale, same as English, but vi is different (meaning it was translated for vi but not for this locale)
                sameAsEn.push(k);
            }
        }
        if (sameAsEn.length > 0) {
            console.log('[UNTRANSLATED] ' + l + '.' + ns + ' — ' + sameAsEn.length + ' keys same as EN: ' + sameAsEn.join(', '));
        }
    }
}

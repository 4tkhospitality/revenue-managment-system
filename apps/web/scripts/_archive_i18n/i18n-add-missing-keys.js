#!/usr/bin/env node
/** Add missing keys: tier names + feature keys used in pricing-plans */
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.resolve(__dirname, '..', 'messages');
const LOCALES = ['en', 'vi', 'th', 'id', 'ms'];

const KEYS = {
    pricingPlans: {
        en: { 'tier.superior.name': 'Superior', 'tier.deluxe.name': 'Deluxe', 'tier.suite.name': 'Suite', 'feat.otbAnalytics': 'OTB Analytics', 'feat.dailyActions': 'Daily Actions' },
        vi: { 'tier.superior.name': 'Superior', 'tier.deluxe.name': 'Deluxe', 'tier.suite.name': 'Suite', 'feat.otbAnalytics': 'OTB Analytics', 'feat.dailyActions': 'Daily Actions' },
        th: { 'tier.superior.name': 'Superior', 'tier.deluxe.name': 'Deluxe', 'tier.suite.name': 'Suite', 'feat.otbAnalytics': 'OTB Analytics', 'feat.dailyActions': 'Daily Actions' },
        id: { 'tier.superior.name': 'Superior', 'tier.deluxe.name': 'Deluxe', 'tier.suite.name': 'Suite', 'feat.otbAnalytics': 'OTB Analytics', 'feat.dailyActions': 'Daily Actions' },
        ms: { 'tier.superior.name': 'Superior', 'tier.deluxe.name': 'Deluxe', 'tier.suite.name': 'Suite', 'feat.otbAnalytics': 'OTB Analytics', 'feat.dailyActions': 'Daily Actions' },
    },
};

let total = 0;
for (const locale of LOCALES) {
    const fp = path.join(MESSAGES_DIR, `${locale}.json`);
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    let added = 0;
    for (const [ns, translations] of Object.entries(KEYS)) {
        if (!data[ns]) data[ns] = {};
        for (const [k, v] of Object.entries(translations[locale])) {
            if (!(k in data[ns])) { data[ns][k] = v; added++; }
        }
    }
    fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ ${locale}.json — ${added} new keys`);
    total += added;
}
console.log(`\n🎉 Total: ${total} new keys`);

const fs = require('fs');
const en = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
const id = JSON.parse(fs.readFileSync('./messages/id.json', 'utf8'));
const ms = JSON.parse(fs.readFileSync('./messages/ms.json', 'utf8'));
const th = JSON.parse(fs.readFileSync('./messages/th.json', 'utf8'));

const enKeys = Object.keys(en.guidePage);
const idKeys = Object.keys(id.guidePage);
const msKeys = Object.keys(ms.guidePage);
const thKeys = Object.keys(th.guidePage);

console.log(`EN: ${enKeys.length} keys`);
console.log(`ID: ${idKeys.length} keys`);
console.log(`MS: ${msKeys.length} keys`);
console.log(`TH: ${thKeys.length} keys`);

const idMissing = enKeys.filter(k => !idKeys.includes(k));
const msMissing = enKeys.filter(k => !msKeys.includes(k));
const thMissing = enKeys.filter(k => !thKeys.includes(k));

console.log(`\nID missing ${idMissing.length}: ${idMissing.join(', ')}`);
console.log(`MS missing ${msMissing.length}: ${msMissing.join(', ')}`);
console.log(`TH missing ${thMissing.length}: ${thMissing.join(', ')}`);

// Check for keys still in English (same as en)
let idEng = 0, msEng = 0, thEng = 0;
for (const k of enKeys) {
    if (id.guidePage[k] === en.guidePage[k]) idEng++;
    if (ms.guidePage[k] === en.guidePage[k]) msEng++;
    if (th.guidePage[k] === en.guidePage[k]) thEng++;
}
console.log(`\nKeys same as EN (possibly untranslated):`);
console.log(`ID: ${idEng}, MS: ${msEng}, TH: ${thEng}`);

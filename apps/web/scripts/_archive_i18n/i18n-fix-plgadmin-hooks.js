#!/usr/bin/env node
/**
 * Fix PLGAdminDashboard.tsx: Add useTranslations hooks (CRLF-aware)
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'components', 'admin', 'PLGAdminDashboard.tsx');
let src = fs.readFileSync(FILE, 'utf8');
let count = 0;

function rep(find, replace) {
    if (src.includes(find)) {
        src = src.split(find).join(replace);
        count++;
    } else {
        console.warn(`  ⚠️ NOT FOUND: ${find.substring(0, 80).replace(/\r/g, '\\r').replace(/\n/g, '\\n')}...`);
    }
}

// Detect line ending style
const eol = src.includes('\r\n') ? '\r\n' : '\n';
console.log(`Line endings: ${eol === '\r\n' ? 'CRLF' : 'LF'}`);

// 1. ConfirmDialog - add useTranslations
rep(
    `function ConfirmDialog({ message, onConfirm, onCancel }: {${eol}    message: string; onConfirm: () => void; onCancel: () => void;${eol}}) {${eol}    return (`,
    `function ConfirmDialog({ message, onConfirm, onCancel }: {${eol}    message: string; onConfirm: () => void; onCancel: () => void;${eol}}) {${eol}    const t = useTranslations('plgAdmin');${eol}    return (`
);

// 2. ResellersTab - add useTranslations
rep(
    `function ResellersTab() {${eol}    const [resellers`,
    `function ResellersTab() {${eol}    const t = useTranslations('plgAdmin');${eol}    const [resellers`
);

// 3. PromosTab - add useTranslations
rep(
    `function PromosTab() {${eol}    const [promos`,
    `function PromosTab() {${eol}    const t = useTranslations('plgAdmin');${eol}    const [promos`
);

// 4. CommissionsTab - add useTranslations
rep(
    `function CommissionsTab() {${eol}    const [commissions`,
    `function CommissionsTab() {${eol}    const t = useTranslations('plgAdmin');${eol}    const [commissions`
);

// 5. GuideTab - add useTranslations
rep(
    `function GuideTab() {${eol}    return (`,
    `function GuideTab() {${eol}    const t = useTranslations('plgAdmin');${eol}    return (`
);

// 6. PLGAdminDashboard main - add useTranslations
rep(
    `export default function PLGAdminDashboard() {${eol}    const [activeTab, setActiveTab]`,
    `export default function PLGAdminDashboard() {${eol}    const t = useTranslations('plgAdmin');${eol}    const [activeTab, setActiveTab]`
);

// 7. Fix > Lưu (Save button text that may still be Vietnamese)
rep(`> Lưu${eol}`, `> {t('save')}${eol}`);

fs.writeFileSync(FILE, src, 'utf8');
console.log(`\n✅ PLGAdminDashboard.tsx — ${count} hook insertions applied`);

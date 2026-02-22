/**
 * Fix script: Add useTranslations hooks and re-apply i18n replacements
 * to files that were restored from git or need hook additions.
 */
const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..');
let totalChanges = 0;

function fixFile(relPath, fixFn) {
    const filePath = path.join(webDir, relPath);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ SKIP: ${relPath}`);
        return;
    }
    const original = fs.readFileSync(filePath, 'utf8');
    const content = fixFn(original);
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        const changes = content.split('\n').length - original.split('\n').length;
        console.log(`✅ ${relPath} — fixed (${changes >= 0 ? '+' : ''}${changes} lines)`);
        totalChanges++;
    } else {
        console.log(`⏭️ ${relPath} — already fixed`);
    }
}

// ── BillingCard.tsx ────────────────────────────────────────────
fixFile('components/billing/BillingCard.tsx', (content) => {
    // Add import
    if (!content.includes("useTranslations")) {
        content = content.replace(
            "import { UsageMeter } from './UsageMeter';",
            "import { UsageMeter } from './UsageMeter';\nimport { useTranslations } from 'next-intl';"
        );
    }
    // Add hook
    if (!content.includes("const t = useTranslations")) {
        content = content.replace(
            "const { data, loading } = useEntitlements(hotelId);",
            "const t = useTranslations('billing');\n    const { data, loading } = useEntitlements(hotelId);"
        );
    }
    // Replacements
    const replacements = [
        [">Gói & Thanh toán</h3>", ">{t('billingTitle')}</h3>"],
        [">Quản lý subscription</p>", ">{t('billingSubtitle')}</p>"],
        ["Trial: còn {data.trialDaysRemaining} ngày", "{t('trialDaysLeft', { n: data.trialDaysRemaining })}"],
        ['label="Import / tháng"', "label={t('importPerMonth')}"],
        ['label="Export / ngày"', "label={t('exportPerDay')}"],
        ['label="Người dùng"', "label={t('usersLabel')}"],
        ["Nâng cấp gói", "{t('upgradePlan')}"],
    ];
    for (const [target, replacement] of replacements) {
        if (content.includes(target)) {
            content = content.replace(target, replacement);
        }
    }
    return content;
});

// ── TrialBanner.tsx ───────────────────────────────────────────
fixFile('components/billing/TrialBanner.tsx', (content) => {
    // Add import
    if (!content.includes("useTranslations")) {
        content = content.replace(
            "import type { TrialProgress } from '@/lib/plg/trial';",
            "import type { TrialProgress } from '@/lib/plg/trial';\nimport { useTranslations } from 'next-intl';"
        );
    }
    // Add hook
    if (!content.includes("const t = useTranslations")) {
        content = content.replace(
            "const conditionsMet = trialProgress?.conditionsMet ?? 0;",
            "const t = useTranslations('billing');\n    const conditionsMet = trialProgress?.conditionsMet ?? 0;"
        );
    }
    // Replacements
    const replacements = [
        ["Trial: còn {daysRemaining} ngày", "{t('trialRemaining', { n: daysRemaining })}"],
        [">Bonus +7 ngày:</span>", ">{t('bonusDays')}</span>"],
        ["({conditionsMet}/3 điều kiện)", "{t('conditionsMet', { n: conditionsMet })}"],
        [">Bonus +7 ngày đã được cộng!</span>", ">{t('bonusApplied')}</span>"],
    ];
    for (const [target, replacement] of replacements) {
        if (content.includes(target)) {
            content = content.replace(target, replacement);
        }
    }
    return content;
});

// ── UsageMeter.tsx — add import (hook already added) ──────────
fixFile('components/billing/UsageMeter.tsx', (content) => {
    if (!content.includes("import { useTranslations }")) {
        content = content.replace(
            "'use client';",
            "'use client';\n\nimport { useTranslations } from 'next-intl';"
        );
    }
    // Replacements (already applied, just in case)
    const replacements = [
        ["Nâng cấp để mở giới hạn →", "{t('upgradeToUnlock')}"],
    ];
    for (const [target, replacement] of replacements) {
        if (content.includes(target)) {
            content = content.replace(target, replacement);
        }
    }
    return content;
});

// ── LeadTimeBuckets.tsx ───────────────────────────────────────
fixFile('components/dashboard/LeadTimeBuckets.tsx', (content) => {
    // Add import
    if (!content.includes("useTranslations")) {
        content = content.replace(
            "import { DataStatusBadge } from '@/components/shared/DataStatusBadge';",
            "import { DataStatusBadge } from '@/components/shared/DataStatusBadge';\nimport { useTranslations } from 'next-intl';"
        );
    }
    // Add hook
    if (!content.includes("const t = useTranslations")) {
        content = content.replace(
            "const [data, setData] = useState<LeadTimeData | null>(null);",
            "const t = useTranslations('analytics');\n    const [data, setData] = useState<LeadTimeData | null>(null);"
        );
    }
    // Replacements
    const replacements = [
        ["setError('Không tải được dữ liệu');", "setError(t('errorLoadingData'));"],
        ["{error || 'Không có dữ liệu'}", "{error || t('noData')}"],
        [">Thiếu dữ liệu book_time để phân tích lead-time.</p>",
            ">{t('missingBookTime')}</p>"],
        ["{data.avgLeadTime} ngày", "{data.avgLeadTime} days"],
    ];
    for (const [target, replacement] of replacements) {
        if (content.includes(target)) {
            content = content.replace(target, replacement);
        }
    }
    return content;
});

// ── RecommendationTable.tsx ──────────────────────────────────
fixFile('components/dashboard/RecommendationTable.tsx', (content) => {
    // Import already added by batch 1, check
    if (!content.includes("useTranslations")) {
        content = content.replace(
            "import { Check, X, Calendar, ArrowUp, ArrowDown, Minus, Ban, Info, AlertTriangle } from 'lucide-react';",
            "import { Check, X, Calendar, ArrowUp, ArrowDown, Minus, Ban, Info, AlertTriangle } from 'lucide-react';\nimport { useTranslations } from 'next-intl';"
        );
    }
    // getActionBadge uses t() but it's a standalone function, not a component.
    // We need to make it accept t as a parameter or move it inside the component.
    // Let's wrap it: change getActionBadge to accept t as a parameter.

    // First, check if getActionBadge already receives t
    if (content.includes('function getActionBadge(action:') && !content.includes('getActionBadge(action: string | null, t:')) {
        content = content.replace(
            'function getActionBadge(action: string | null)',
            'function getActionBadge(action: string | null, t: (key: string) => string)'
        );
    }

    // Update all calls to getActionBadge to pass t
    // Common pattern: getActionBadge(rec.action) or getActionBadge(r.action)
    content = content.replace(/getActionBadge\(([^,)]+)\)/g, (match, arg) => {
        if (arg.includes(', t')) return match; // already has t
        return `getActionBadge(${arg}, t)`;
    });

    // Now add t hook to the main component
    // Find the component function (RecommendationTable or DailyRecommendations)
    if (!content.includes("const t = useTranslations('dashboard')")) {
        // Find the main export function 
        const funcMatch = content.match(/export (?:default )?function (\w+)\([^)]*\)\s*\{/);
        if (funcMatch) {
            const funcDecl = funcMatch[0];
            content = content.replace(funcDecl, funcDecl + "\n    const t = useTranslations('dashboard');");
        }
    }

    return content;
});

console.log(`\n${'═'.repeat(50)}`);
console.log(`🎉 Fix script complete! ${totalChanges} files fixed.`);
console.log('═'.repeat(50));

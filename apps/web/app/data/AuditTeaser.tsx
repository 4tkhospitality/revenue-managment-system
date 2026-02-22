'use client'

import { useTranslations } from 'next-intl';

interface AuditTeaserProps {
    issueCount: number
    onUpgrade: () => void
}

export default function AuditTeaser({ issueCount, onUpgrade }: AuditTeaserProps) {
    const t = useTranslations('dataPage');
    return (
        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
            <div className="flex items-start gap-4">
                <div className="text-4xl">🔍</div>
                <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                        {t('issuesFound', { n: issueCount })}
                    </h3>
                    <p className="text-sm text-white/60 mb-4">
                        {t('auditDesc')}
                    </p>
                    <button
                        onClick={onUpgrade}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition"
                    >
                        {t('viewFullReport')}
                    </button>
                </div>
            </div>
        </div>
    )
}

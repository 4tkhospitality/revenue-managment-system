'use client';

import { useState, useEffect } from 'react';
import { validateOTBData, type ValidationResult, type ValidationIssue } from '../actions/validateOTBData';

export function DataValidationBadge() {
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        runValidation();
    }, []);

    async function runValidation() {
        setLoading(true);
        try {
            const res = await validateOTBData();
            setResult(res);
        } catch {
            setResult(null);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang kiểm tra chất lượng dữ liệu...
            </div>
        );
    }

    if (!result) return null;

    const { stats, issues } = result;

    // Badge styling based on status
    const badgeStyles = stats.failCount > 0
        ? {
            container: 'bg-red-50 border-red-200',
            icon: 'bg-red-100 text-red-600',
            title: 'text-red-800',
            subtitle: 'text-red-600',
        }
        : stats.warningCount > 0
            ? {
                container: 'bg-amber-50 border-amber-200',
                icon: 'bg-amber-100 text-amber-600',
                title: 'text-amber-800',
                subtitle: 'text-amber-600',
            }
            : {
                container: 'bg-emerald-50 border-emerald-200',
                icon: 'bg-emerald-100 text-emerald-600',
                title: 'text-emerald-800',
                subtitle: 'text-emerald-600',
            };

    const badgeIcon = stats.failCount > 0 ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ) : stats.warningCount > 0 ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    const badgeLabel = stats.failCount > 0
        ? `${stats.failCount} lỗi nghiêm trọng`
        : stats.warningCount > 0
            ? `${stats.warningCount} cảnh báo`
            : 'Dữ liệu tốt';

    return (
        <div className={`rounded-xl border ${badgeStyles.container} overflow-hidden`}>
            {/* Badge summary */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${badgeStyles.icon}`}>
                        {badgeIcon}
                    </div>
                    <div className="text-left">
                        <div className={`font-semibold ${badgeStyles.title}`}>
                            Data Quality: {badgeLabel}
                        </div>
                        <div className={`text-xs ${badgeStyles.subtitle}`}>
                            {stats.totalRows.toLocaleString()} rows • {stats.completeness}% complete
                            {stats.dateRange && ` • ${stats.dateRange.from} → ${stats.dateRange.to}`}
                        </div>
                    </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expanded issues list */}
            {expanded && issues.length > 0 && (
                <div className="border-t border-current/10 px-4 py-3 space-y-2 max-h-[300px] overflow-y-auto bg-white/50">
                    {issues.slice(0, 50).map((issue, i) => (
                        <IssueRow key={i} issue={issue} />
                    ))}
                    {issues.length > 50 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                            ... và {issues.length - 50} vấn đề khác
                        </div>
                    )}
                </div>
            )}

            {expanded && issues.length === 0 && (
                <div className="border-t border-current/10 px-4 py-3 text-sm text-gray-600 bg-white/50">
                    Không phát hiện vấn đề. Dữ liệu sạch!
                </div>
            )}
        </div>
    );
}

function IssueRow({ issue }: { issue: ValidationIssue }) {
    const colorClass = issue.severity === 'FAIL'
        ? 'text-red-600'
        : issue.severity === 'WARNING'
            ? 'text-amber-600'
            : 'text-blue-600';

    const bgClass = issue.severity === 'FAIL'
        ? 'bg-red-50'
        : issue.severity === 'WARNING'
            ? 'bg-amber-50'
            : 'bg-blue-50';

    return (
        <div className={`flex items-start gap-2 text-xs p-2 rounded-lg ${bgClass}`}>
            <span className={`font-mono font-medium ${colorClass}`}>{issue.code}</span>
            <span className="text-gray-700">{issue.message}</span>
            {issue.stay_date && (
                <span className="text-gray-400 ml-auto">({issue.stay_date})</span>
            )}
        </div>
    );
}

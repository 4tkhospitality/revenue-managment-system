'use client'

import { useState } from 'react'
import { BasicValidationResult } from '@/app/actions/validateOTBData'
import { Lock } from 'lucide-react'

interface AuditTeaserProps {
    basicResult: BasicValidationResult
    isPro: boolean
    onUpgrade?: () => void
}

/**
 * AuditTeaser - Shows basic validation with teaser for full audit
 * Free users see limited info + CTA to upgrade
 * Pro users see full audit link
 */
export function AuditTeaser({ basicResult, isPro, onUpgrade }: AuditTeaserProps) {
    const [showDetails, setShowDetails] = useState(false)

    const statusColor = basicResult.valid
        ? 'bg-green-500/20 border-green-500/30 text-green-400'
        : 'bg-red-500/20 border-red-500/30 text-red-400'

    const statusIcon = basicResult.valid ? '✓' : '✕'
    const statusText = basicResult.valid ? 'Data Valid' : 'Errors Need Fixing'

    return (
        <div className="rounded-2xl border bg-white/5 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className={`px-4 py-3 border-b ${statusColor} border-current/30`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{statusIcon}</span>
                        <span className="font-medium">{statusText}</span>
                    </div>
                    <div className="text-sm opacity-80">
                        {basicResult.totalRows.toLocaleString()} data rows
                    </div>
                </div>
            </div>

            {/* Basic Info */}
            <div className="p-4">
                {basicResult.errorCount > 0 ? (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-400">
                            Found {basicResult.errorCount} critical errors:
                        </p>
                        <ul className="space-y-1">
                            {basicResult.issues.map((issue, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2 text-red-300">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>{issue.message}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-sm text-green-300">
                        No critical errors found in data.
                    </p>
                )}
            </div>

            {/* Pro Teaser */}
            {!isPro && (
                <div className="border-t border-white/10 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-white mb-1">
                                <Lock className="w-4 h-4 inline mr-1" /> Full Audit Report
                            </h4>
                            <ul className="text-sm text-gray-400 space-y-1 mb-3">
                                <li>• Data completeness analysis</li>
                                <li>• Found anomalies & unusual pickup patterns</li>
                                <li>• Data quality improvement recommendations</li>
                                <li>• Export PDF report</li>
                            </ul>
                            <button
                                onClick={onUpgrade}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
                            >
                                Upgrade to Pro to unlock →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pro Link */}
            {isPro && (
                <div className="border-t border-white/10 p-4">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-between text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <span>View Full Audit Report</span>
                        <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    )
}

/**
 * AuditSummary - Full audit stats for Pro users
 */
interface AuditSummaryProps {
    stats: {
        totalRows: number
        failCount: number
        warningCount: number
        completeness: number
        anomalyCount: number
        pickupPatterns: number
    }
    recommendations: string[]
}

export function AuditSummary({ stats, recommendations }: AuditSummaryProps) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.completeness}%</div>
                    <div className="text-xs text-gray-400">Completeness</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.warningCount}</div>
                    <div className="text-xs text-gray-400">Warnings</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{stats.failCount}</div>
                    <div className="text-xs text-gray-400">Errors</div>
                </div>
            </div>

            {/* Anomaly Info */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                <div className="text-center flex-1">
                    <div className="text-lg font-semibold text-orange-400">{stats.anomalyCount}</div>
                    <div className="text-xs text-gray-400">Anomaly</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center flex-1">
                    <div className="text-lg font-semibold text-purple-400">{stats.pickupPatterns}</div>
                    <div className="text-xs text-gray-400">Unusual Pickup</div>
                </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-white mb-2">Suggestions:</h4>
                    <ul className="space-y-1">
                        {recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">→</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

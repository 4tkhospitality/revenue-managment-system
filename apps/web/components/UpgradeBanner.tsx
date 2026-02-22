'use client';

/**
 * UpgradeBanner - Shown when a feature is gated
 * SMB-friendly messaging: "Daily recommendations + Excel export"
 */

import { FeatureKey, getUpgradeTierName, TIER_CONFIGS } from '@/lib/tier/tierConfig';
import { PlanTier } from '@prisma/client';
import { Lock } from 'lucide-react';

interface UpgradeBannerProps {
    feature: FeatureKey;
    currentTier?: PlanTier;
    className?: string;
}

const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
    pricing_calc: 'NET → BAR price calculation',
    promo_stacking: 'Stack multiple promotions',
    daily_actions: 'Daily price suggestions + 1-click Accept',
    rate_calendar: '30-day rate calendar',
    export_excel: 'Excel export for OTA upload',
    pickup_pace_simple: 'View booking pace',
    guardrails: 'High/low price alerts',
    decision_log: 'Price decision history',
    basic_analytics: 'Basic revenue reports',
    advanced_analytics: 'Advanced analytics',
    multi_property: 'Multi-property management',
    api_import: 'Automated API data import',
    rate_shopper_addon: 'Competitor rate tracking',
};

export function UpgradeBanner({ feature, currentTier = 'STANDARD', className = '' }: UpgradeBannerProps) {
    const requiredTier = getUpgradeTierName(feature);
    const featureDesc = FEATURE_DESCRIPTIONS[feature] || feature;

    return (
        <div
            className={`
        bg-gradient-to-r from-amber-50 to-orange-50 
        border border-amber-200 rounded-xl p-6 
        shadow-sm ${className}
      `}
        >
            <div className="flex items-start gap-4">
                {/* Lock Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg
                        className="w-6 h-6 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        <Lock className="w-4 h-4 inline mr-1" /> Feature available on {requiredTier}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        <strong>{featureDesc}</strong> — Upgrade to unlock this feature and save time every day.
                    </p>

                    {/* Benefits */}
                    <div className="bg-white/60 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700 font-medium mb-2">
                            With {requiredTier} plan, you get:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {requiredTier === 'Assistant' && (
                                <>
                                    <li>✓ Daily price suggestions (Daily Actions)</li>
                                    <li>✓ Excel export for OTA upload</li>
                                    <li>✓ 30-day rate calendar</li>
                                </>
                            )}
                            {requiredTier === 'RMS Lite' && (
                                <>
                                    <li>✓ All Assistant features</li>
                                    <li>✓ Price alerts (Guardrails)</li>
                                    <li>✓ Analytics reports</li>
                                </>
                            )}
                            {requiredTier === 'Professional' && (
                                <>
                                    <li>✓ All RMS Lite features</li>
                                    <li>✓ Multi-property management</li>
                                    <li>✓ Competitor rate tracking</li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* CTA */}
                    <div className="flex gap-3">
                        <a
                            href="/pricing-plans"
                            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
                        >
                            View pricing
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                        <a
                            href="https://zalo.me/your-zalo-id"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Contact via Zalo
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Compact version for inline use (e.g., disabled buttons)
 */
export function UpgradeTooltip({ feature }: { feature: FeatureKey }) {
    const requiredTier = getUpgradeTierName(feature);
    return (
        <span className="text-xs text-amber-600 font-medium">
            <Lock className="w-3 h-3 inline mr-0.5" /> Requires {requiredTier} plan
        </span>
    );
}

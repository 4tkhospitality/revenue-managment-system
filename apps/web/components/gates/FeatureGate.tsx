'use client';

import { ReactNode, useState } from 'react';
import { Lock, Eye } from 'lucide-react';
import { UpgradeModal } from '../billing/UpgradeModal';
import type { PlanTier } from '@prisma/client';
import type { GateType, FeatureKey } from '@/lib/plg/types';

interface FeatureGateProps {
    allowed: boolean;
    gateType: GateType;
    currentPlan: PlanTier;
    requiredPlan: PlanTier;
    featureKey: FeatureKey;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Wraps content and shows paywall if feature is gated.
 * - 'free' → show children
 * - 'soft' → show children + disabled overlay + upgrade CTA
 * - 'hard' → show lock icon + upgrade CTA
 * - 'preview' → show children (blurred) + overlay
 */
export function FeatureGate({
    allowed,
    gateType,
    currentPlan,
    requiredPlan,
    featureKey,
    children,
    fallback,
}: FeatureGateProps) {
    const [showModal, setShowModal] = useState(false);

    if (allowed || gateType === 'free') {
        return <>{children}</>;
    }

    if (gateType === 'preview') {
        return (
            <>
                <div className="relative">
                    <div className="blur-sm pointer-events-none select-none">{children}</div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg">
                        <Eye size={24} className="text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600 font-medium">Preview</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                            Upgrade to unlock
                        </button>
                    </div>
                </div>
                <UpgradeModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    variant="FEATURE_PAYWALL"
                    currentPlan={currentPlan}
                    recommendedPlan={requiredPlan}
                    reasonCodes={['feature_preview']}
                />
            </>
        );
    }

    // hard or soft gate
    return (
        <>
            {fallback || (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <Lock size={24} className="text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 font-medium">Feature locked</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                        Upgrade to use
                    </button>
                </div>
            )}
            <UpgradeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                variant="FEATURE_PAYWALL"
                currentPlan={currentPlan}
                recommendedPlan={requiredPlan}
                reasonCodes={[`feature_${gateType}`]}
            />
        </>
    );
}

'use client';

import { useState, useMemo } from 'react';
import { Calculator, Target, ArrowRight, TrendingUp, AlertTriangle, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Mode = 'simulator' | 'target';

export function ReviewCalculator() {
    const t = useTranslations('reviewCalc');
    const [mode, setMode] = useState<Mode>('simulator');

    // Shared inputs
    const [currentScore, setCurrentScore] = useState(8.5);
    const [currentCount, setCurrentCount] = useState(150);

    // Simulator inputs
    const [newReviewCount, setNewReviewCount] = useState(5);
    const [newReviewScore, setNewReviewScore] = useState(10);

    // Target inputs
    const [targetScore, setTargetScore] = useState(9.0);
    const [futureReviewScore, setFutureReviewScore] = useState(10);

    // Simulator calculation
    const simulatedScore = useMemo(() => {
        const totalScore = currentScore * currentCount + newReviewScore * newReviewCount;
        const totalCount = currentCount + newReviewCount;
        return totalCount > 0 ? totalScore / totalCount : 0;
    }, [currentScore, currentCount, newReviewScore, newReviewCount]);

    const scoreDiff = simulatedScore - currentScore;

    // Target calculation: X = OldCount * (TargetScore - OldScore) / (FutureScore - TargetScore)
    const requiredReviews = useMemo(() => {
        const denominator = futureReviewScore - targetScore;
        if (denominator <= 0) return Infinity; // Impossible if future score <= target
        const x = currentCount * (targetScore - currentScore) / denominator;
        return Math.ceil(Math.max(0, x));
    }, [currentScore, currentCount, targetScore, futureReviewScore]);

    const feasibility = useMemo(() => {
        if (requiredReviews === Infinity) return { labelKey: 'feasImpossible' as const, color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
        if (requiredReviews <= 10) return { labelKey: 'feasEasy' as const, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
        if (requiredReviews <= 50) return { labelKey: 'feasPossible' as const, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
        if (requiredReviews <= 200) return { labelKey: 'feasHard' as const, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
        return { labelKey: 'feasVeryHard' as const, color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    }, [requiredReviews]);

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-blue-600" />
                        {t('title')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {t.rich('simDesc', { strong: (c) => <strong>{c}</strong> })}
                        <br />
                        {t.rich('targetDesc', { strong: (c) => <strong>{c}</strong> })}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6">
                    <button
                        onClick={() => setMode('simulator')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${mode === 'simulator' ? 'bg-white shadow text-yellow-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Calculator className="w-4 h-4" />
                        {t('simulator')}
                    </button>
                    <button
                        onClick={() => setMode('target')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${mode === 'target' ? 'bg-white shadow text-yellow-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Target className="w-4 h-4" />
                        {t('targetMode')}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Inputs */}
                    <div className="space-y-5">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{t('currentData')}</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <NumberInput label={t('currentScoreLabel')} value={currentScore} onChange={setCurrentScore} step={0.1} max={10} />
                            <NumberInput label={t('reviewCount')} value={currentCount} onChange={setCurrentCount} step={1} />
                        </div>

                        {mode === 'simulator' && (
                            <>
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider pt-2">{t('simNewReviews')}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <NumberInput label={t('newReviewCount')} value={newReviewCount} onChange={setNewReviewCount} step={1} min={1} />
                                    <NumberInput label={t('newReviewScore')} value={newReviewScore} onChange={setNewReviewScore} step={0.5} max={10} />
                                </div>
                            </>
                        )}

                        {mode === 'target' && (
                            <>
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider pt-2">{t('targetSection')}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <NumberInput label={t('targetScoreLabel')} value={targetScore} onChange={setTargetScore} step={0.1} max={10} />
                                    <NumberInput label={t('expectedPerReview')} value={futureReviewScore} onChange={setFutureReviewScore} step={0.5} max={10} />
                                </div>
                            </>
                        )}

                        {/* Disclaimer */}
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                                {t.rich('disclaimer', { strong: (c) => <strong>{c}</strong> })}
                            </span>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-5">
                        {mode === 'simulator' && (
                            <>
                                {/* Score Visualization */}
                                <div className="flex items-center justify-center gap-6 py-6">
                                    <ScoreCircle label={t('current')} score={currentScore} color="text-gray-600" />
                                    <ArrowRight className="w-6 h-6 text-gray-400" />
                                    <ScoreCircle label={t('projected')} score={simulatedScore} color={scoreDiff > 0 ? 'text-emerald-600' : scoreDiff < 0 ? 'text-red-600' : 'text-gray-600'} />
                                </div>

                                {/* Delta */}
                                <div className={`text-center p-4 rounded-xl border ${scoreDiff > 0 ? 'bg-emerald-50 border-emerald-200' : scoreDiff < 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <span className={`text-3xl font-bold ${scoreDiff > 0 ? 'text-emerald-600' : scoreDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                        {scoreDiff > 0 ? '+' : ''}{scoreDiff.toFixed(2)}
                                    </span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {t('changeAfter', { count: newReviewCount, score: newReviewScore })}
                                    </p>
                                </div>

                                {/* Breakdown */}
                                <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t('oldTotalScore')}</span>
                                        <span className="font-medium">{currentScore} × {currentCount} = {(currentScore * currentCount).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t('newlyAdded')}</span>
                                        <span className="font-medium">{newReviewScore} × {newReviewCount} = {(newReviewScore * newReviewCount).toFixed(0)}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between font-semibold">
                                        <span className="text-gray-700">{t('newScoreLabel')}</span>
                                        <span>{(currentScore * currentCount + newReviewScore * newReviewCount).toFixed(0)} / {currentCount + newReviewCount} = <strong>{simulatedScore.toFixed(2)}</strong></span>
                                    </div>
                                </div>
                            </>
                        )}

                        {mode === 'target' && (
                            <>
                                {/* Result */}
                                <div className={`text-center p-6 rounded-xl border ${feasibility.bg}`}>
                                    {requiredReviews === Infinity ? (
                                        <p className="text-red-600 font-bold text-lg">{t('infeasible')}</p>
                                    ) : (
                                        <>
                                            <span className="text-5xl font-bold text-gray-900">{requiredReviews}</span>
                                            <p className="text-sm text-gray-600 mt-2">
                                                {t('reviewsNeeded', { score: futureReviewScore })}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Feasibility */}
                                <div className={`p-4 rounded-lg border ${feasibility.bg}`}>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className={`w-5 h-5 ${feasibility.color}`} />
                                        <span className={`font-bold ${feasibility.color}`}>{t('feasibility', { label: t(feasibility.labelKey) })}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {t('targetExplanation', { target: targetScore, current: currentScore, count: currentCount, needed: requiredReviews === Infinity ? '∞' : requiredReviews, score: futureReviewScore })}
                                    </p>
                                </div>

                                {/* Formula */}
                                <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-500 font-mono">
                                    X = {currentCount} × ({targetScore} - {currentScore}) / ({futureReviewScore} - {targetScore})
                                    <br />
                                    X = {currentCount} × {(targetScore - currentScore).toFixed(1)} / {(futureReviewScore - targetScore).toFixed(1)}
                                    <br />
                                    X = {requiredReviews === Infinity ? '∞' : requiredReviews}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function NumberInput({ label, value, onChange, step = 1, min = 0, max }: {
    label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) onChange(v);
                }}
                step={step}
                min={min}
                max={max}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm font-medium"
            />
        </div>
    );
}

function ScoreCircle({ label, score, color }: { label: string; score: number; color: string }) {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 10) * circumference;

    return (
        <div className="text-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="transform -rotate-90 w-20 h-20">
                    <circle className="text-gray-100" strokeWidth="6" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
                    <circle className={`${color} transition-all duration-700`} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
                </svg>
                <span className={`absolute text-lg font-bold ${color}`}>{score.toFixed(1)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
    );
}

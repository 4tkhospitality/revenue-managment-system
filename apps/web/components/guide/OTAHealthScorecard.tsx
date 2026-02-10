'use client';

import { useState, useEffect } from 'react';
import { Edit2, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { calculateBookingScore, calculateAgodaScore, type OTAMetrics, type Scoreresult } from '@/lib/ota-score-calculator';
import { ScorecardInputModal } from './ScorecardInputModal';

const STORAGE_KEY = 'rms_ota_health_metrics';

const DEFAULT_METRICS: OTAMetrics = {
    booking: {
        ctr: 1.5,
        conversion: 2.0,
        priceQuality: 7.0,
        cancellationRate: 25.0,
        netBookingGrowth: 5.0,
        paceVsStly: 0.0,
        contentScore: 80,
        checklistCompletion: 0, // Will be updated from checklist storage
    },
    agoda: {
        contentScore: 75,
        ctr: 2.0,
        conversion: 2.5,
        priceCompetitiveness: 8.0,
        reviewScore: 8.5,
        cancellationRate: 20.0,
        checklistCompletion: 0, // Will be updated from checklist storage
        programParticipation: false,
    },
};

export function OTAHealthScorecard() {
    const [metrics, setMetrics] = useState<OTAMetrics>(DEFAULT_METRICS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingScore, setBookingScore] = useState<Scoreresult | null>(null);
    const [agodaScore, setAgodaScore] = useState<Scoreresult | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setMetrics(prev => ({ ...prev, ...JSON.parse(saved) }));
            }

            // Sync checklist completion from other keys
            // Booking checklist
            const bookingChecklist = localStorage.getItem('rms_booking_checklist');
            if (bookingChecklist) {
                const parsed = JSON.parse(bookingChecklist);
                const total = Object.keys(parsed).length; // Wait, total items is not stored. We need a way to get total count.
                // For simplicity/robustness, let's assume if we have some checked items, we can roughly estimate or just pass the counts if we refactor.
                // Actually, let's just count true values and divide by a known constant (14 for Booking, 10 for Agoda).
                // Ideally this should be dynamic, but for Phase 2 MVP hardcoding the denominator is acceptable if consistent.
                const checkedCount = Object.values(parsed).filter(Boolean).length;
                const completion = Math.min(100, Math.round((checkedCount / 14) * 100)); // 14 items in BookingChecklist

                setMetrics(prev => ({
                    ...prev,
                    booking: { ...prev.booking, checklistCompletion: completion }
                }));
            }

            // Agoda checklist
            const agodaChecklist = localStorage.getItem('rms_agoda_checklist');
            if (agodaChecklist) {
                const parsed = JSON.parse(agodaChecklist);
                const checkedCount = Object.values(parsed).filter(Boolean).length;
                const completion = Math.min(100, Math.round((checkedCount / 10) * 100)); // 10 items in AgodaChecklist

                setMetrics(prev => ({
                    ...prev,
                    agoda: { ...prev.agoda, checklistCompletion: completion }
                }));
            }

        } catch { /* ignore */ }
    }, []);

    // Recalculate scores when metrics change
    useEffect(() => {
        setBookingScore(calculateBookingScore(metrics.booking));
        setAgodaScore(calculateAgodaScore(metrics.agoda));

        // Save to localStorage (except checklistCompletion which is derived)
        const toSave = { ...metrics };
        // We persist everything for simplicity
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }, [metrics]);

    if (!bookingScore || !agodaScore) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">OTA Health Scorecard</h3>
                    <p className="text-sm text-gray-500">Đánh giá sức khỏe kênh bán dựa trên trọng số & KPIs.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Edit2 className="w-4 h-4" />
                    Cập nhật chỉ số
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Booking.com Card */}
                <ScoreCard
                    title="Booking.com"
                    score={bookingScore}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-100"
                    metrics={[
                        { label: 'CTR', value: `${metrics.booking.ctr}%` },
                        { label: 'Conversion', value: `${metrics.booking.conversion}%` },
                        { label: 'Price Quality', value: `${metrics.booking.priceQuality}/10` },
                        { label: 'Content', value: `${metrics.booking.contentScore}%` },
                    ]}
                />

                {/* Agoda Card */}
                <ScoreCard
                    title="Agoda"
                    score={agodaScore}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                    borderColor="border-orange-100"
                    metrics={[
                        { label: 'Content Score', value: `${metrics.agoda.contentScore}%` },
                        { label: 'Review Score', value: `${metrics.agoda.reviewScore}` },
                        { label: 'Price Comp.', value: `${metrics.agoda.priceCompetitiveness}/10` },
                        { label: 'Program', value: metrics.agoda.programParticipation ? 'Yes' : 'No' },
                    ]}
                />
            </div>

            {/* Gap Analysis / Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gap/Trend placeholders - in future iterations connect to history */}
            </div>

            <ScorecardInputModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentMetrics={metrics}
                onSave={setMetrics}
            />
        </div>
    );
}

function ScoreCard({ title, score, color, bgColor, borderColor, metrics }: {
    title: string,
    score: Scoreresult,
    color: string,
    bgColor: string,
    borderColor: string,
    metrics: { label: string, value: string }[]
}) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score.totalBoxScore / 100) * circumference;

    return (
        <div className={`rounded-xl border ${borderColor} bg-white overflow-hidden shadow-sm`}>
            <div className={`px-4 py-3 border-b ${borderColor} ${bgColor} flex justify-between items-center`}>
                <span className={`font-semibold ${color}`}>{title}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${color}`}>
                    {score.grade}
                </span>
            </div>

            <div className="p-5 flex items-center gap-6">
                {/* Score Circle */}
                <div className="relative flex items-center justify-center shrink-0">
                    <svg className="transform -rotate-90 w-24 h-24">
                        <circle
                            className="text-gray-100"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="48"
                            cy="48"
                        />
                        <circle
                            className={`${color} transition-all duration-1000 ease-out`}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="48"
                            cy="48"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-2xl font-bold ${color}`}>{score.totalBoxScore}</span>
                        <span className="text-[10px] text-gray-400 font-medium">/100</span>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-2">
                    {metrics.map((m, i) => (
                        <div key={i}>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{m.label}</p>
                            <p className="text-sm font-semibold text-gray-700">{m.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Activity, Play, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

// ─── Pipeline Steps ─────────────────────────────────────────

const PIPELINE_STEPS = [
    { key: 'otbYesterday', label: 'OTB (hôm qua)', action: 'buildOTB', dateOffset: -1 },
    { key: 'otbToday', label: 'OTB (hôm nay)', action: 'buildOTB', dateOffset: 0 },
    { key: 'cancelStats', label: 'Tính Cancel Stats', action: 'buildCancelStats' },
    { key: 'features', label: 'Build Features', action: 'buildFeatures' },
    { key: 'forecast', label: 'Run Forecast', action: 'runForecast' },
    { key: 'pricing', label: 'Tối ưu giá', action: 'runPricing' },
] as const;

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface PipelineButtonProps {
    hotelId: string;
    asOfDate?: string;
    onComplete?: () => void;
}

export function FullPipelineButton({ hotelId, asOfDate, onComplete }: PipelineButtonProps) {
    const [running, setRunning] = useState(false);
    const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<string | null>(null);

    const runPipeline = async () => {
        setRunning(true);
        setError(null);
        setStepStatuses({});

        try {
            for (const step of PIPELINE_STEPS) {
                setCurrentStep(step.key);
                setStepStatuses(prev => ({ ...prev, [step.key]: 'running' }));

                // Compute step-specific asOfDate (for OTB yesterday/today)
                const stepDate = new Date(asOfDate || new Date().toISOString().split('T')[0]);
                if ('dateOffset' in step && step.dateOffset) {
                    stepDate.setDate(stepDate.getDate() + step.dateOffset);
                }
                const stepAsOf = stepDate.toISOString().split('T')[0];

                const res = await fetch('/api/analytics/pipeline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hotelId, asOfDate: stepAsOf, action: step.action }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || `Step "${step.label}" failed`);
                }

                setStepStatuses(prev => ({ ...prev, [step.key]: 'done' }));
            }

            setCurrentStep(null);
            onComplete?.();
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            if (currentStep) {
                setStepStatuses(prev => ({ ...prev, [currentStep]: 'error' }));
            }
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-slate-700">
                        Analytics Pipeline
                    </h3>
                </div>
                <button
                    onClick={runPipeline}
                    disabled={running}
                    className={`
                        inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${running
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm hover:shadow'
                        }
                    `}
                >
                    {running ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Đang chạy...
                        </>
                    ) : (
                        <>
                            <Play className="w-3.5 h-3.5" />
                            Chạy Full Pipeline
                        </>
                    )}
                </button>
            </div>

            {/* Pipeline steps */}
            {(running || Object.keys(stepStatuses).length > 0) && (
                <div className="flex items-center gap-1 mt-2">
                    {PIPELINE_STEPS.map((step, i) => {
                        const status = stepStatuses[step.key] || 'pending';
                        return (
                            <div key={step.key} className="flex items-center gap-1">
                                {i > 0 && (
                                    <div className={`w-4 h-0.5 rounded ${status === 'done' ? 'bg-emerald-400' :
                                        status === 'running' ? 'bg-indigo-400' :
                                            'bg-slate-200'
                                        }`} />
                                )}
                                <div className={`
                                    flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                                    ${status === 'done' ? 'bg-emerald-50 text-emerald-700' :
                                        status === 'running' ? 'bg-indigo-50 text-indigo-700' :
                                            status === 'error' ? 'bg-red-50 text-red-700' :
                                                'bg-slate-50 text-slate-400'
                                    }
                                `}>
                                    {status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                                    {status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
                                    {status === 'error' && <AlertCircle className="w-3 h-3" />}
                                    {step.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {error && (
                <p className="mt-2 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}

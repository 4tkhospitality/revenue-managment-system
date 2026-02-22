'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { type OTAMetrics } from '@/lib/ota-score-calculator';

interface ScorecardInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMetrics: OTAMetrics;
    onSave: (metrics: OTAMetrics) => void;
}

export function ScorecardInputModal({ isOpen, onClose, currentMetrics, onSave }: ScorecardInputModalProps) {
    const [metrics, setMetrics] = useState<OTAMetrics>(currentMetrics);
    const [activeTab, setActiveTab] = useState<'booking' | 'agoda'>('booking');

    useEffect(() => {
        setMetrics(currentMetrics);
    }, [currentMetrics, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(metrics);
        onClose();
    };

    const handleBookingChange = (field: keyof OTAMetrics['booking'], value: number) => {
        setMetrics(prev => ({
            ...prev,
            booking: { ...prev.booking, [field]: value }
        }));
    };

    const handleAgodaChange = (field: keyof OTAMetrics['agoda'], value: number | boolean) => {
        setMetrics(prev => ({
            ...prev,
            agoda: { ...prev.agoda, [field]: value }
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-semibold text-gray-900">Update OTA Health Metrics</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('booking')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'booking' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Booking.com
                        </button>
                        <button
                            onClick={() => setActiveTab('agoda')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'agoda' ? 'bg-white shadow text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Agoda
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <div className="bg-blue-50/50 p-3 rounded-lg flex items-start gap-2 text-sm text-blue-700">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>
                                Enter data from last month's Extranet/YCS report.
                                <br />
                                <span className="text-xs opacity-80">
                                    Tip: Booking.com Analytics Dashboard & Agoda Production Report.
                                </span>
                            </p>
                        </div>

                        {activeTab === 'booking' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                <InputGroup label="CTR (Click-Through Rate)" unit="%" value={metrics.booking.ctr} onChange={(v) => handleBookingChange('ctr', v)} />
                                <InputGroup label="Conversion Rate" unit="%" value={metrics.booking.conversion} onChange={(v) => handleBookingChange('conversion', v)} />
                                <InputGroup label="Price Quality Score" unit="/10" max={10} value={metrics.booking.priceQuality} onChange={(v) => handleBookingChange('priceQuality', v)} />
                                <InputGroup label="Cancellation Rate" unit="%" value={metrics.booking.cancellationRate} onChange={(v) => handleBookingChange('cancellationRate', v)} />
                                <InputGroup label="Net Booking Growth" unit="%" value={metrics.booking.netBookingGrowth} onChange={(v) => handleBookingChange('netBookingGrowth', v)} />
                                <InputGroup label="Pace vs STLY" unit="%" value={metrics.booking.paceVsStly} onChange={(v) => handleBookingChange('paceVsStly', v)} />
                                <InputGroup label="Content Score" unit="%" max={100} value={metrics.booking.contentScore} onChange={(v) => handleBookingChange('contentScore', v)} />
                            </div>
                        )}

                        {activeTab === 'agoda' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                <InputGroup label="Content Score" unit="%" max={100} value={metrics.agoda.contentScore} onChange={(v) => handleAgodaChange('contentScore', v)} />
                                <InputGroup label="CTR (Funnel View)" unit="%" value={metrics.agoda.ctr} onChange={(v) => handleAgodaChange('ctr', v)} />
                                <InputGroup label="Conversion Rate" unit="%" value={metrics.agoda.conversion} onChange={(v) => handleAgodaChange('conversion', v)} />
                                <InputGroup label="Price Competitiveness" unit="/10" max={10} value={metrics.agoda.priceCompetitiveness} onChange={(v) => handleAgodaChange('priceCompetitiveness', v)} />
                                <InputGroup label="Review Score" unit="/10" max={10} value={metrics.agoda.reviewScore} onChange={(v) => handleAgodaChange('reviewScore', v)} />
                                <InputGroup label="Cancellation Rate" unit="%" value={metrics.agoda.cancellationRate} onChange={(v) => handleAgodaChange('cancellationRate', v)} />
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">Program Participation</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAgodaChange('programParticipation', true)}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${metrics.agoda.programParticipation ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            YES
                                        </button>
                                        <button
                                            onClick={() => handleAgodaChange('programParticipation', false)}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${!metrics.agoda.programParticipation ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            NO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                        <Save className="w-4 h-4" />
                        Save Metrics
                    </button>
                </div>
            </div>
        </div>
    );
}

function InputGroup({ label, unit, value, onChange, max }: { label: string, unit: string, value: number, onChange: (v: number) => void, max?: number }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) onChange(val);
                    }}
                    max={max}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                />
                <span className="absolute right-3 top-2 text-sm text-gray-400 font-medium select-none">{unit}</span>
            </div>
        </div>
    );
}

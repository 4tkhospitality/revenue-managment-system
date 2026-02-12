'use client';

import { useState, useMemo } from 'react';
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface OtbDataPoint {
    date: string;
    otbCurrent: number;
    otbLastYear: number | null; // null when STLY data not available
}

interface OtbChartProps {
    data: OtbDataPoint[];
}

type DayFilter = 14 | 30 | 60 | 90;

// Surface styling - consistent with KpiCards
const surface = "rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200";

export function OtbChart({ data }: OtbChartProps) {
    const [dayFilter, setDayFilter] = useState<DayFilter>(14);

    // Filter data based on selected range
    const filteredData = useMemo(() => {
        return data.slice(0, dayFilter);
    }, [data, dayFilter]);

    // Check if any STLY data is available
    const hasStlyData = filteredData.some(d => d.otbLastYear !== null);

    const filterButtons: { value: DayFilter; label: string }[] = [
        { value: 14, label: '14 ngày' },
        { value: 30, label: '30 ngày' },
        { value: 60, label: '60 ngày' },
        { value: 90, label: '90 ngày' },
    ];

    return (
        <div className={`${surface} overflow-hidden`}>
            {/* Header with Filter Tabs */}
            <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        OTB so với năm trước
                    </h2>

                    <div className="flex items-center gap-4">
                        {/* Filter Tabs */}
                        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                            {filterButtons.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setDayFilter(value)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-all ${dayFilter === value
                                        ? 'text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
                                        }`}
                                    style={{
                                        backgroundColor: dayFilter === value ? '#2D4A8C' : undefined
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#2D4A8C' }} />
                                <span className="text-gray-600">Năm nay</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-gray-400 rounded" style={{ borderTop: '2px dashed' }} />
                                <span className={`${hasStlyData ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Năm trước {!hasStlyData && '(chưa có)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="p-6">
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="otbCurrentFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2D4A8C" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#2D4A8C" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="otbStlyFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.08} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                            interval={dayFilter <= 30 ? 0 : dayFilter <= 60 ? 2 : 4}
                            angle={dayFilter > 30 ? -45 : 0}
                            textAnchor={dayFilter > 30 ? "end" : "middle"}
                            height={dayFilter > 30 ? 60 : 30}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                color: '#1e293b',
                                boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12)',
                                padding: '10px 14px',
                            }}
                            labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: 4 }}
                            itemStyle={{ fontSize: 13 }}
                        />
                        {/* Area fills — rendered behind lines */}
                        <Area
                            type="monotone"
                            dataKey="otbCurrent"
                            fill="url(#otbCurrentFill)"
                            stroke="none"
                            name="OTB Fill"
                            legendType="none"
                            tooltipType="none"
                        />
                        {hasStlyData && (
                            <Area
                                type="monotone"
                                dataKey="otbLastYear"
                                fill="url(#otbStlyFill)"
                                stroke="none"
                                name="STLY Fill"
                                legendType="none"
                                tooltipType="none"
                            />
                        )}
                        {/* Lines — on top */}
                        <Line
                            type="monotone"
                            dataKey="otbCurrent"
                            name="OTB Năm nay"
                            stroke="#2D4A8C"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, fill: '#2D4A8C', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="otbLastYear"
                            name="Năm trước"
                            stroke="#94a3b8"
                            strokeWidth={1.5}
                            strokeDasharray="6 4"
                            dot={false}
                            activeDot={{ r: 4, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}


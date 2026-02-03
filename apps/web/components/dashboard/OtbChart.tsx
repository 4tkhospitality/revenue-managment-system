'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface OtbDataPoint {
    date: string;
    otbCurrent: number;
    otbLastYear: number;
}

interface OtbChartProps {
    data: OtbDataPoint[];
}

// Surface styling - consistent with KpiCards
const surface = "rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.06)]";

export function OtbChart({ data }: OtbChartProps) {
    return (
        <div className={`${surface} p-6`}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    OTB so với năm trước
                </h2>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#2D4A8C' }} />
                        <span className="text-gray-600">Năm nay</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-gray-400 rounded" style={{ borderTop: '2px dashed' }} />
                        <span className="text-gray-600">Năm trước</span>
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
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
                            borderRadius: '8px',
                            color: '#1e293b',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        labelStyle={{ color: '#64748b' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="otbCurrent"
                        name="OTB Năm nay"
                        stroke="#2D4A8C"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#2D4A8C' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="otbLastYear"
                        name="Năm trước"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4, fill: '#94a3b8' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}


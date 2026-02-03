'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
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

export function OtbChart({ data }: OtbChartProps) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-50">
                    OTB vs Last Year
                </h2>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500 rounded" />
                        <span className="text-slate-400">OTB (This Year)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-slate-500 rounded border-dashed" style={{ borderTop: '2px dashed' }} />
                        <span className="text-slate-400">Last Year</span>
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#1e293b' }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#1e293b' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '8px',
                            color: '#f8fafc',
                        }}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="otbCurrent"
                        name="OTB This Year"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#3b82f6' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="otbLastYear"
                        name="Last Year"
                        stroke="#64748b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4, fill: '#64748b' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

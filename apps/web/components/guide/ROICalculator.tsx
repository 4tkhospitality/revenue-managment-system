'use client';

import { useState, useMemo } from 'react';
import { BadgePercent, DollarSign, TrendingUp, AlertTriangle, ArrowRight, Lightbulb } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

export function ROICalculator() {
    // Inputs
    const [monthlyRevenue, setMonthlyRevenue] = useState(100000); // 100k USD or VND? Let's assume generic currency or local. 
    // actually localized VND is huge numbers. Let's use 100M VND default.
    // user input is raw number.
    const [baseCommission, setBaseCommission] = useState(15);
    const [programCost, setProgramCost] = useState(10); // e.g., Genius discount
    const [uplift, setUplift] = useState(20); // Expected revenue increase %

    // Calculations
    const currentNetRevenue = useMemo(() => {
        const commCost = monthlyRevenue * (baseCommission / 100);
        return monthlyRevenue - commCost;
    }, [monthlyRevenue, baseCommission]);

    const projectedRevenue = useMemo(() => {
        return monthlyRevenue * (1 + uplift / 100);
    }, [monthlyRevenue, uplift]);

    const projectedNetRevenue = useMemo(() => {
        // Cost = (Base Comm % * Proj Rev) + (Program Cost % * Proj Rev)
        // Note: Booking Genius is a discount, so it reduces ADR, effectively changing revenue basis or treated as cost?
        // Usually Genius is a discount off the rate, so the recorded revenue is lower, but commission is on final amount.
        // However, here we treat "Program Cost" as generic (Preferred is comm add-on, Genius is discount).
        // Let's assume "Program Cost" reduces the Net Revenue directly, whether via comm or discount.
        // Formula: Net = Revenue * (1 - BaseComm% - ProgramCost%)
        // Wait, if Genius is 10% discount, the Revenue decreases by 10%, AND comm is paid on that lower amount.
        // But for "Program Cost Calculator" usually hotels think "I lose 10%".
        // Let's stick to the simple model: "Program Cost" is a % of the *Projected Revenue* that is lost/paid.
        const totalCostPct = baseCommission + programCost;
        const totalCost = projectedRevenue * (totalCostPct / 100);
        return projectedRevenue - totalCost;
    }, [projectedRevenue, baseCommission, programCost]);

    const netGain = projectedNetRevenue - currentNetRevenue;
    const roi = useMemo(() => {
        // ROI = Net Gain / Incremental Cost?
        // Incremental Cost = (ProjectedRev * ProgramCost%) + (ProjectedRev * BaseComm% - CurrentRev * BaseComm%)
        // This is complex.
        // Simple ROI for programs: (Net Revenue With Program - Net Revenue Without) / Cost of Program?
        // Let's use the Net Gain directly as the main metric. "Profit Impact".
        return netGain;
    }, [netGain]);

    const breakevenUplift = useMemo(() => {
        // Breakeven when Net Revenue With = Net Revenue Without
        // Rev * (1 - Base) = Rev * (1 + x) * (1 - Base - Prog)
        // (1 - Base) = (1 + x) * (1 - Base - Prog)
        // 1 + x = (1 - Base) / (1 - Base - Prog)
        // x = [(1 - Base) / (1 - Base - Prog)] - 1
        const num = 1 - baseCommission / 100;
        const den = 1 - (baseCommission + programCost) / 100;
        if (den <= 0) return 999; // Impossible
        const x = (num / den) - 1;
        return x * 100;
    }, [baseCommission, programCost]);

    const chartData = [
        {
            name: 'Hiện tại',
            Revenue: monthlyRevenue,
            Net: currentNetRevenue,
            Cost: monthlyRevenue - currentNetRevenue,
        },
        {
            name: 'Dự kiến',
            Revenue: Math.round(projectedRevenue),
            Net: Math.round(projectedNetRevenue),
            Cost: Math.round(projectedRevenue - projectedNetRevenue),
        },
    ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        Hiệu quả Khuyến mãi
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Nhập chi phí chương trình (Genius, Preferred, AGP...) để xem khách sạn lời hay lỗ</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Inputs */}
                    <div className="space-y-6 lg:col-span-1 border-r border-gray-100 pr-0 lg:pr-6">
                        <div className="space-y-4">
                            <InputGroup
                                label="Doanh thu hàng tháng (VND)"
                                value={monthlyRevenue}
                                onChange={setMonthlyRevenue}
                                type="currency"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup
                                    label="Base Commission"
                                    value={baseCommission}
                                    onChange={setBaseCommission}
                                    unit="%"
                                />
                                <InputGroup
                                    label="Program Cost/Discount"
                                    value={programCost}
                                    onChange={setProgramCost}
                                    unit="%"
                                    tooltip="Ví dụ: Genius (10%), Preferred (15% + 3% = 18% -> nhập 3% add-on hoặc tổng? Hãy nhập phần tăng thêm/discount)"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700">Dự kiến tăng trưởng (Uplift)</label>
                                <span className="text-indigo-600 font-bold">{uplift}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={uplift}
                                onChange={(e) => setUplift(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>0%</span>
                                <span>+50%</span>
                                <span>+100%</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Điểm hòa vốn (Breakeven):</span>
                                <span className="font-bold text-orange-600">+{breakevenUplift.toFixed(1)}% revenue</span>
                            </div>
                            <div className="text-xs text-gray-500">
                                Bạn cần tăng doanh thu ít nhất <strong>{breakevenUplift.toFixed(1)}%</strong> để bù đắp chi phí chương trình.
                            </div>
                        </div>
                    </div>

                    {/* Results & Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <KPIBox
                                label="Net Revenue (Hiện tại)"
                                value={formatCurrency(currentNetRevenue)}
                                subtext="Sau commission base"
                            />
                            <KPIBox
                                label="Net Revenue (Dự kiến)"
                                value={formatCurrency(projectedNetRevenue)}
                                subtext={`Với uplift +${uplift}%`}
                                highlight
                            />
                            <KPIBox
                                label="Lợi nhuận ròng (Net Gain)"
                                value={formatCurrency(netGain)}
                                subtext={netGain > 0 ? "Tăng thêm" : "Giảm đi"}
                                color={netGain > 0 ? "text-emerald-600" : "text-red-600"}
                            />
                        </div>

                        {/* Chart */}
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Revenue" fill="#E5E7EB" name="Tổng doanh thu" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Net" fill="#4F46E5" name="Net Revenue" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Recommendation */}
                        <div className={`p-4 rounded-lg flex items-start gap-3 border ${netGain > 0 ? (netGain / currentNetRevenue > 0.1 ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100') : 'bg-red-50 border-red-100'}`}>
                            <Lightbulb className={`w-5 h-5 shrink-0 ${netGain > 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                            <div>
                                <h4 className={`text-sm font-bold ${netGain > 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                                    {netGain > 0
                                        ? (netGain / currentNetRevenue > 0.1 ? "Khuyến nghị mạnh: NÊN THAM GIA" : "Khuyến nghị: Cân nhắc")
                                        : "Không khuyến nghị: LỖ"}
                                </h4>
                                <p className={`text-sm mt-1 ${netGain > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {netGain > 0
                                        ? `Chương trình mang lại thêm ${formatCurrency(netGain)} lợi nhuận ròng. Mức tăng trưởng ${uplift}% vượt qua điểm hòa vốn ${breakevenUplift.toFixed(1)}%.`
                                        : `Mức tăng trưởng ${uplift}% chưa đủ bù đắp chi phí chương trình. Cần đạt tối thiểu ${breakevenUplift.toFixed(1)}% để hòa vốn.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputGroup({ label, value, onChange, unit, type = 'number', tooltip }: any) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</label>
                {tooltip && (
                    <div className="group relative">
                        <AlertTriangle className="w-3 h-3 text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded z-50">
                            {tooltip}
                        </div>
                    </div>
                )}
            </div>
            <div className="relative">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                />
                {unit && <span className="absolute right-3 top-2 text-sm text-gray-400 font-medium select-none">{unit}</span>}
            </div>
        </div>
    );
}

function KPIBox({ label, value, subtext, highlight, color }: any) {
    return (
        <div className={`p-3 rounded-lg border ${highlight ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-gray-100'}`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color || (highlight ? 'text-indigo-700' : 'text-gray-900')}`}>{value}</p>
            <p className="text-[10px] text-gray-400">{subtext}</p>
        </div>
    );
}

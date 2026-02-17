'use client';

import { ReactNode, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuickModePanel, type QuickModeRecommendation } from './QuickModePanel';
import { Zap, Table2, ChevronDown, ChevronUp } from 'lucide-react';

// ─── UUPM Surface ───────────────────────────────────────────────
const surface = "rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)]";

interface QuickModePricingWrapperProps {
    isQuickMode: boolean;
    quickModeData: QuickModeRecommendation[];
    onAcceptAll: () => Promise<void>;
    onAcceptOne: (stayDate: string) => Promise<void>;
    detailedContent: ReactNode;
}

export function QuickModePricingWrapper({
    isQuickMode,
    quickModeData,
    onAcceptAll,
    onAcceptOne,
    detailedContent,
}: QuickModePricingWrapperProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showGuide, setShowGuide] = useState(false);

    const toggleMode = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', 'pricing');
        if (isQuickMode) {
            params.delete('mode');
        } else {
            params.set('mode', 'quick');
        }
        router.push(`/dashboard?${params.toString()}`);
    }, [isQuickMode, router, searchParams]);

    return (
        <div className="space-y-4">
            {/* ── Mode Selector + Explainer ─────────────────────── */}
            <div className={`${surface} overflow-hidden`}>
                {/* Toggle Bar */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        {/* Mode Toggle — tab-style */}
                        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                            <button
                                onClick={isQuickMode ? undefined : toggleMode}
                                className={`px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${isQuickMode
                                        ? 'text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                style={{ backgroundColor: isQuickMode ? '#1E3A8A' : '#f8fafc' }}
                            >
                                <Zap className="w-3.5 h-3.5" /> Duyệt nhanh
                            </button>
                            <button
                                onClick={!isQuickMode ? undefined : toggleMode}
                                className={`px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${!isQuickMode
                                        ? 'text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                style={{ backgroundColor: !isQuickMode ? '#1E3A8A' : '#f8fafc' }}
                            >
                                <Table2 className="w-3.5 h-3.5" /> Phân tích chi tiết
                            </button>
                        </div>

                        {/* Current mode label */}
                        <span className="text-xs text-slate-400 hidden sm:inline">
                            {isQuickMode
                                ? 'Duyệt giá hàng ngày — quyết định nhanh'
                                : 'Xem dữ liệu OTB + dự báo để hiểu TẠI SAO'
                            }
                        </span>
                    </div>

                    {/* Help toggle */}
                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                        Hướng dẫn {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>

                {/* ── Expandable Guide ────────────────────────────── */}
                {showGuide && (
                    <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Quick Mode */}
                            <div className={`${isQuickMode ? 'ring-2 ring-blue-200' : ''} bg-white rounded-xl p-4 border border-slate-200`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-sm font-semibold text-slate-900">Duyệt nhanh</h4>
                                    {isQuickMode && (
                                        <span className="text-[10px] px-2 py-0.5 rounded text-white font-medium" style={{ backgroundColor: '#1E3A8A' }}>
                                            Đang dùng
                                        </span>
                                    )}
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 mt-0.5">●</span>
                                        <span><b>Dùng khi nào?</b> Mỗi sáng, mở Dashboard → tab Giá đề xuất → bấm Duyệt</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 mt-0.5">●</span>
                                        <span><b>Hiển thị gì?</b> Hành động (Tăng/Giữ/Giảm) + % thay đổi + lý do tiếng Việt</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 mt-0.5">●</span>
                                        <span><b>Quyết định:</b> Duyệt từng ngày hoặc "Duyệt tất cả" (Ngừng bán không duyệt được)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">●</span>
                                        <span><b>Source:</b> bảng <code className="text-[10px] bg-slate-100 px-1 rounded">price_recommendations</code> — Pricing Engine tính tự động</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Detailed Mode */}
                            <div className={`${!isQuickMode ? 'ring-2 ring-blue-200' : ''} bg-white rounded-xl p-4 border border-slate-200`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Table2 className="w-4 h-4 text-blue-500" />
                                    <h4 className="text-sm font-semibold text-slate-900">Phân tích chi tiết</h4>
                                    {!isQuickMode && (
                                        <span className="text-[10px] px-2 py-0.5 rounded text-white font-medium" style={{ backgroundColor: '#1E3A8A' }}>
                                            Đang dùng
                                        </span>
                                    )}
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">●</span>
                                        <span><b>Dùng khi nào?</b> Muốn hiểu TẠI SAO hệ thống đề xuất mức giá này</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">●</span>
                                        <span><b>Hiển thị gì?</b> OTB, phòng còn, dự báo, giá hiện tại vs đề xuất, % thay đổi</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">●</span>
                                        <span><b>Quyết định:</b> Chấp nhận hoặc từ chối đề xuất cho từng ngày</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">●</span>
                                        <span><b>Source:</b> tính từ OTB + Forecast + Pricing Engine — dữ liệu tổng hợp</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Source of Truth */}
                        <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                            <b className="text-slate-700">Source of Truth:</b> Cả hai chế độ cùng đọc từ <b>Pricing Engine</b> (chạy Pipeline).
                            "Duyệt nhanh" hiện kết quả đã xử lý, "Chi tiết" hiện dữ liệu thô.
                            Khi duyệt giá ở chế độ nào cũng lưu vào cùng bảng <code className="bg-slate-100 px-1 rounded">pricing_decisions</code>.
                        </div>
                    </div>
                )}
            </div>

            {/* ── Content ────────────────────────────────────────── */}
            {isQuickMode ? (
                <QuickModePanel
                    data={quickModeData}
                    onAcceptAll={onAcceptAll}
                    onAcceptOne={onAcceptOne}
                />
            ) : (
                detailedContent
            )}
        </div>
    );
}

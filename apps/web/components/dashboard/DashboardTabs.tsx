'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useCallback, useMemo } from 'react';
import { DatePickerSnapshot } from '@/components/DatePickerSnapshot';

// ── Types ──────────────────────────────────────────────────────────
type TabId = 'overview' | 'analytics' | 'pricing';

interface TabDef {
    id: TabId;
    label: string;
    icon: typeof LayoutDashboard;
}

interface StatusPill {
    label: string;
    date: string | null;
    href: string;
}

interface DashboardTabsProps {
    overviewContent: ReactNode;
    analyticsContent: ReactNode;
    pricingContent: ReactNode;
    pricingActionCount?: number;
    hasDataWarning?: boolean;
    /** Inline status pills (replaces old contextBar card) */
    dataStatus?: StatusPill[];
    /** OTB time-travel: current as_of_date in YYYY-MM-DD */
    currentAsOfDate?: string;
}

// ── Tab definitions ────────────────────────────────────────────────
const TABS: TabDef[] = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'analytics', label: 'Phân tích', icon: BarChart3 },
    { id: 'pricing', label: 'Giá đề xuất', icon: DollarSign },
];

// ── Freshness logic ────────────────────────────────────────────────
function getFreshness(dateStr: string | null): 'fresh' | 'stale' | 'missing' {
    if (!dateStr) return 'missing';
    const parts = dateStr.split('/');
    const d = parts.length === 3
        ? new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        : new Date(dateStr);
    if (isNaN(d.getTime())) return 'missing';
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) return 'fresh';
    if (diff <= 7) return 'stale';
    return 'missing';
}

const pillStyles = {
    fresh: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stale: 'bg-amber-50 text-amber-700 border-amber-200',
    missing: 'bg-red-50 text-red-600 border-red-200',
};
const dotStyles = {
    fresh: 'bg-emerald-500',
    stale: 'bg-amber-500',
    missing: 'bg-red-500',
};

// ── Component ──────────────────────────────────────────────────────
export function DashboardTabs({
    overviewContent,
    analyticsContent,
    pricingContent,
    pricingActionCount = 0,
    hasDataWarning = false,
    dataStatus = [],
    currentAsOfDate,
}: DashboardTabsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const activeTab = useMemo<TabId>(() => {
        const tab = searchParams.get('tab');
        if (tab === 'analytics' || tab === 'pricing') return tab;
        return 'overview';
    }, [searchParams]);

    const handleTabChange = useCallback((tabId: TabId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tabId === 'overview') {
            params.delete('tab');
        } else {
            params.set('tab', tabId);
        }
        const qs = params.toString();
        router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    }, [router, pathname, searchParams]);

    const handleDateChange = useCallback((date: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set('as_of_date', date);
        window.location.href = `/dashboard?${params.toString()}`;
    }, []);

    const tabContent: Record<TabId, ReactNode> = {
        overview: overviewContent,
        analytics: analyticsContent,
        pricing: pricingContent,
    };

    return (
        <>
            {/* ── Sticky Tab Bar with Inline Pills ── */}
            <div className="sticky top-0 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-slate-200 pdf-hide">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
                        {/* Tab buttons */}
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                        transition-all duration-200 whitespace-nowrap cursor-pointer
                                        ${isActive
                                            ? 'bg-blue-800 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" aria-hidden="true" />
                                    {tab.label}

                                    {tab.id === 'pricing' && pricingActionCount > 0 && (
                                        <span className={`
                                            ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                                            ${isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-amber-100 text-amber-700'
                                            }
                                        `}>
                                            {pricingActionCount}
                                        </span>
                                    )}

                                    {tab.id === 'analytics' && hasDataWarning && (
                                        <span className="relative flex h-2 w-2 ml-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {/* ── Separator ── */}
                        {dataStatus.length > 0 && (
                            <div className="w-px h-6 bg-slate-200 mx-2 shrink-0" />
                        )}

                        {/* ── Inline Status Pills ── */}
                        {dataStatus.map((item) => {
                            const freshness = getFreshness(item.date);
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    title={`${item.label}: ${item.date || 'Chưa có'} → Xem chi tiết`}
                                    className={`
                                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
                                        border transition-all duration-150 hover:shadow-sm whitespace-nowrap
                                        ${pillStyles[freshness]}
                                    `}
                                >
                                    <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${dotStyles[freshness]}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        {/* ── Time-travel Picker (right-aligned) ── */}
                        <div className="ml-auto shrink-0 pl-3">
                            <DatePickerSnapshot
                                onDateChange={handleDateChange}
                                defaultDate={currentAsOfDate}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tab Content ── */}
            <div className="mt-4 space-y-4 sm:space-y-6">
                {tabContent[activeTab]}
            </div>

            {/* ── PDF: render ALL tabs (hidden in browser, visible in PDF) ── */}
            <div className="hidden pdf-show space-y-6">
                <div key="pdf-overview">
                    <div className="pdf-section-header text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                        Tổng quan
                    </div>
                    {overviewContent}
                </div>
                <div key="pdf-analytics">
                    <div className="pdf-section-header text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">
                        Chi tiết
                    </div>
                    {analyticsContent}
                </div>
                <div key="pdf-pricing">
                    <div className="pdf-section-header text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">
                        Giá đề xuất
                    </div>
                    {pricingContent}
                </div>
            </div>
        </>
    );
}

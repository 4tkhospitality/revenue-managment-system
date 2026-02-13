'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, DollarSign, AlertCircle } from 'lucide-react';
import { ReactNode, useCallback, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────────
type TabId = 'overview' | 'analytics' | 'pricing';

interface TabDef {
    id: TabId;
    label: string;
    icon: typeof LayoutDashboard;
}

interface DashboardTabsProps {
    /** Content for each tab */
    overviewContent: ReactNode;
    analyticsContent: ReactNode;
    pricingContent: ReactNode;
    /** Badge: count of days needing pricing action */
    pricingActionCount?: number;
    /** Badge: warning dot if data fields missing in analytics */
    hasDataWarning?: boolean;
    /** Context bar: data status items */
    contextBar?: ReactNode;
}

// ── Tab definitions ────────────────────────────────────────────────
const TABS: TabDef[] = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'analytics', label: 'Phân tích', icon: BarChart3 },
    { id: 'pricing', label: 'Giá đề xuất', icon: DollarSign },
];

// ── Surface styling ────────────────────────────────────────────────
const surface = "rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)]";

// ── Component ──────────────────────────────────────────────────────
export function DashboardTabs({
    overviewContent,
    analyticsContent,
    pricingContent,
    pricingActionCount = 0,
    hasDataWarning = false,
    contextBar,
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

    const tabContent: Record<TabId, ReactNode> = {
        overview: overviewContent,
        analytics: analyticsContent,
        pricing: pricingContent,
    };

    return (
        <>
            {/* ── Sticky Tab Bar + Context ── */}
            <div className="sticky top-0 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-slate-200 pdf-hide">
                <div className="max-w-[1400px] mx-auto">
                    {/* Tab buttons */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
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

                                    {/* Badge: pricing action count */}
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

                                    {/* Badge: warning dot on analytics */}
                                    {tab.id === 'analytics' && hasDataWarning && (
                                        <span className="relative flex h-2 w-2 ml-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Context bar: data status + time-travel */}
                    {contextBar && (
                        <div className="pb-2 -mt-1">
                            {contextBar}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tab Content ── */}
            <div className="mt-4 space-y-4 sm:space-y-6">
                {tabContent[activeTab]}
            </div>

            {/* ── PDF: render ALL tabs (hidden in browser, visible in PDF) ── */}
            <div className="hidden pdf-show space-y-6">
                <div className="pdf-section-header text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                    Tổng quan
                </div>
                {overviewContent}
                <div className="pdf-section-header text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">
                    Chi tiết
                </div>
                {analyticsContent}
                <div className="pdf-section-header text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">
                    Giá đề xuất
                </div>
                {pricingContent}
            </div>
        </>
    );
}

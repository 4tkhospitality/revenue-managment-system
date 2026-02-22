'use client';

import { ShieldCheck, ShieldAlert, ShieldX, BarChart3, TrendingUp } from 'lucide-react';
import type { AnalyticsQuality } from './types';
import { useTranslations } from 'next-intl';

export function DataQualityBadge({ quality }: { quality: AnalyticsQuality }) {
    const t = useTranslations('analyticsTab');
    const level = quality.completeness >= 80 ? 'high' :
        quality.completeness >= 50 ? 'medium' : 'low';

    const config = {
        high: {
            style: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            icon: ShieldCheck,
            label: t('qualityComplete', { pct: quality.completeness }),
        },
        medium: {
            style: 'text-amber-600 bg-amber-50 border-amber-200',
            icon: ShieldAlert,
            label: t('qualityPartial', { pct: quality.completeness }),
        },
        low: {
            style: 'text-rose-600 bg-rose-50 border-rose-200',
            icon: ShieldX,
            label: t('qualityLow', { pct: quality.completeness }),
        },
    };

    const { style, icon: Icon, label } = config[level];

    return (
        <div className="relative group">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-help transition-colors ${style}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                <span className="text-slate-400">|</span>
                <span>{t('rows', { count: quality.totalRows })}</span>
                {quality.approxSTLY > 0 && (
                    <>
                        <span className="text-slate-400">|</span>
                        <span>{t('approx', { count: quality.approxSTLY })}</span>
                    </>
                )}
            </div>

            {/* Tooltip on hover */}
            <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-slate-800 text-white text-xs rounded-lg px-3 py-2.5 shadow-xl hidden group-hover:block">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <BarChart3 className="w-3 h-3 text-blue-300" />
                        {t('pickupDataT7', { with: quality.withT7, total: quality.totalRows })}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-blue-300" />
                        {t('stlyCoverage', { pct: quality.stlyCoverage })}
                    </div>
                    {quality.approxSTLY > 0 && (
                        <div className="text-slate-300">{t('stlyNearestDow', { count: quality.approxSTLY })}</div>
                    )}
                    {level === 'low' && (
                        <div className="text-amber-300 mt-1 pt-1 border-t border-slate-600">
                            {t('missingSnapshots')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

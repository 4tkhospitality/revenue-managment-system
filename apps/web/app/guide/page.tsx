'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    BookOpen, BarChart3, TrendingUp, DollarSign, CalendarDays, Upload, Database,
    HelpCircle, Calculator, Percent, Tag, ArrowRightLeft, Lock, ChevronRight,
    Layers, Settings, Download, Search, ExternalLink, ChevronDown, AlertTriangle,
    Clock, Zap, ArrowRight, CheckCircle2, XCircle, Info,
} from 'lucide-react';
import { validateOTBData, type ValidationResult } from '../actions/validateOTBData';
import Link from 'next/link';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TierPaywall } from '@/components/paywall/TierPaywall';
import { useTranslations } from 'next-intl';

/* ═══════════════════════ TYPES & DATA ═══════════════════════ */

type SectionId = 'quickstart' | 'analytics' | 'pricing' | 'data';

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

export default function GuidePage() {
    const t = useTranslations('guidePage');

    const SECTIONS = useMemo(() => [
        {
            id: 'quickstart' as SectionId, label: t('navQuickStart'), icon: <Zap className="w-4 h-4" />,
            sub: [
                { id: 'morning-routine', label: t('subMorning') },
                { id: 'steps', label: t('sub5Steps') },
                { id: 'glossary-full', label: t('subGlossary') },
                { id: 'faq', label: t('subFaq') },
            ],
        },
        {
            id: 'analytics' as SectionId, label: t('navRevenueMgmt'), icon: <BarChart3 className="w-4 h-4" />,
            sub: [
                { id: 'rm-intro', label: t('subRmIntro') },
                { id: 'kpi', label: t('subKpi') },
                { id: 'charts', label: t('subCharts') },
                { id: 'rec-table', label: t('subRecTable') },
                { id: 'dp-overview', label: t('subDynPricing') },
                { id: 'dp-seasons', label: t('subSeasons') },
                { id: 'dp-occ-tiers', label: t('subOccTiers') },
                { id: 'terms', label: t('subTerms') },
            ],
        },
        {
            id: 'pricing' as SectionId, label: t('navOtaPricing'), icon: <Calculator className="w-4 h-4" />,
            sub: [
                { id: 'pricing-intro', label: t('subPricingIntro') },
                { id: 'formula', label: t('subFormula') },
                { id: 'channels', label: t('subChannels') },
                { id: 'promos', label: t('subPromos') },
                { id: 'compare', label: t('subCompare') },
                { id: 'price-matrix', label: t('subPriceMatrix') },
                { id: 'reverse', label: t('subReverse') },
                { id: 'dp-export', label: t('subExport') },
            ],
        },
        {
            id: 'data' as SectionId, label: t('navDataMgmt'), icon: <Database className="w-4 h-4" />,
            sub: [
                { id: 'upload', label: t('subImport') },
                { id: 'build-otb', label: t('subBuildOtb') },
                { id: 'build-features', label: t('subBuildFeatures') },
                { id: 'run-forecast', label: t('subRunForecast') },
            ],
        },
    ], [t]);
    const TROUBLESHOOTING = useMemo(() => [
        { symptom: t('tsBlankPage'), cause: t('tsBlankCause'), fix: t('tsBlankFix'), link: '/upload' },
        { symptom: t('tsUploadFail'), cause: t('tsUploadCause'), fix: t('tsUploadFix'), link: '/upload' },
        { symptom: t('tsPickupNa'), cause: t('tsPickupCause'), fix: t('tsPickupFix'), link: null },
        { symptom: t('tsForecastEst'), cause: t('tsForecastCause'), fix: t('tsForecastFix'), link: null },
        { symptom: t('tsPriceBad'), cause: t('tsPriceCause'), fix: t('tsPriceFix'), link: '/pricing' },
        { symptom: t('tsSeasonWrong'), cause: t('tsSeasonCause'), fix: t('tsSeasonFix'), link: '/pricing' },
    ], [t]);

    const [activeSection, setActiveSection] = useState<SectionId>('quickstart');
    const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['quickstart']));
    const [searchQuery, setSearchQuery] = useState('');

    const [showTroubleshooting, setShowTroubleshooting] = useState(false);
    const { hasAccess: hasRevenueAccess, loading: tierLoading } = useTierAccess('SUPERIOR');

    useEffect(() => {
        if (!tierLoading && hasRevenueAccess) {
            setActiveSection('analytics');
            setExpandedSections(new Set(['analytics']));
        }
    }, [tierLoading, hasRevenueAccess]);

    // Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('guide-search')?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleNav = (sectionId: SectionId, subId?: string) => {
        if (activeSection === sectionId && !subId) {
            // Re-clicking the active section → toggle expand/collapse
            setExpandedSections(prev => {
                const next = new Set(prev);
                if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
                return next;
            });
        } else {
            // Switching to a different section → set active + expand
            setActiveSection(sectionId);
            setExpandedSections(prev => new Set(prev).add(sectionId));
        }
        if (subId) {
            setTimeout(() => document.getElementById(subId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    };

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4">
            {/* ── Hero ── */}
            <header
                className="rounded-2xl px-6 py-5 text-white shadow-sm relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #102A4C 100%)' }}
            >
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            <h1 className="text-lg font-semibold">{t('title')}</h1>
                        </div>
                        <p className="text-white/70 text-sm mt-1">{t('subtitle')}</p>
                    </div>
                    <button
                        onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
                    >
                        <AlertTriangle className="w-4 h-4" /> {t('troubleshooting')}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mt-4 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        id="guide-search"
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
                    />
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {t('stat5min')}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {t('stat30terms')}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {t('stat4modules')}</span>
                </div>
            </header>

            {/* ── Troubleshooting Panel (global) ── */}
            {showTroubleshooting && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> {t('troubleshooting')}
                        </h3>
                        <button onClick={() => setShowTroubleshooting(false)} className="text-amber-400 hover:text-amber-600">
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="grid gap-2">
                        {TROUBLESHOOTING.filter(ts =>
                            !searchQuery || ts.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ts.fix.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((ts, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-amber-100 flex items-start gap-3">
                                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-800 text-sm">{ts.symptom}</div>
                                    <p className="text-xs text-gray-500 mt-0.5">{t('tsCauseLabel')}: {ts.cause}</p>
                                    <p className="text-xs text-emerald-700 mt-1">{t('tsFixLabel')}: {ts.fix}</p>
                                </div>
                                {ts.link && (
                                    <Link href={ts.link} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0">
                                        {t('tsOpenLabel')} <ExternalLink className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* ── Body: Sidebar + Content ── */}
            <div className="flex gap-6">
                {/* Left Sidebar Nav */}
                <nav className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {SECTIONS.map(sec => (
                            <div key={sec.id}>
                                <button
                                    onClick={() => handleNav(sec.id)}
                                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm font-medium transition-colors ${activeSection === sec.id
                                        ? 'bg-blue-50 text-blue-700 border-l-[3px] border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-50 border-l-[3px] border-transparent'
                                        }`}
                                >
                                    {sec.icon}
                                    <span className="flex-1">{sec.label}</span>
                                    {sec.id === 'analytics' && !tierLoading && !hasRevenueAccess && <Lock className="w-3 h-3 text-amber-500" />}
                                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedSections.has(sec.id) ? 'rotate-90' : ''}`} />
                                </button>
                                {expandedSections.has(sec.id) && sec.sub && (
                                    <div className="bg-gray-50 border-t border-gray-100">
                                        {sec.sub.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => handleNav(sec.id, sub.id)}
                                                className="w-full text-left pl-11 pr-4 py-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>

                {/* Mobile Nav */}
                <div className="lg:hidden w-full">
                    <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1 overflow-x-auto mb-4">
                        {SECTIONS.map(sec => (
                            <button
                                key={sec.id}
                                onClick={() => handleNav(sec.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeSection === sec.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {sec.icon} {sec.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-6">
                    {activeSection === 'quickstart' && <QuickStartSection t={t} />}
                    {activeSection === 'analytics' && (
                        !tierLoading && !hasRevenueAccess ? (
                            <TierPaywall
                                title={t('paywallTitle')}
                                subtitle={t('paywallSubtitle')}
                                tierDisplayName="Superior"
                                colorScheme="blue"
                                features={[
                                    { icon: <BarChart3 className="w-4 h-4" />, label: t('paywallF1') },
                                    { icon: <TrendingUp className="w-4 h-4" />, label: t('paywallF2') },
                                    { icon: <DollarSign className="w-4 h-4" />, label: t('paywallF3') },
                                    { icon: <CalendarDays className="w-4 h-4" />, label: t('paywallF4') },
                                ]}
                            />
                        ) : <AnalyticsSection t={t} />
                    )}
                    {activeSection === 'pricing' && <PricingSection t={t} />}
                    {activeSection === 'data' && <DataSection t={t} />}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════ SHARED COMPONENTS ═══════════════════════ */

function Card({ id, title, icon, children, gradient }: { id?: string; title: string; icon?: React.ReactNode; children: React.ReactNode; gradient?: string }) {
    const gradientClass = gradient ? `bg-gradient-to-r from-${gradient}-50 to-white` : 'bg-white';
    return (
        <section id={id} className={`${gradientClass} border border-gray-200 rounded-xl p-6 space-y-3 shadow-sm scroll-mt-4`}>
            {icon || title ? (
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {icon} {title}
                </h2>
            ) : null}
            {children}
        </section>
    );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-blue-600">{n}</span>
            </div>
            <div className="space-y-2">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                {children}
            </div>
        </div>
    );
}

function Pipeline({ steps }: { steps: string[] }) {
    return (
        <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
            {steps.map((s, i) => (
                <span key={s}>
                    <span className="bg-white px-3 py-1 rounded-lg border border-gray-200">{s}</span>
                    {i < steps.length - 1 && <span className="text-gray-400 ml-2">&rarr;</span>}
                </span>
            ))}
        </div>
    );
}

function Tip({ children }: { children: React.ReactNode }) {
    return <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm mt-2 flex items-start gap-2"><Info className="w-4 h-4 shrink-0 mt-0.5" /> <span>{children}</span></div>;
}

function Warn({ children }: { children: React.ReactNode }) {
    return <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-gray-700 mt-2">{children}</div>;
}

function KPIExplain({ color, name, desc }: { color: string; name: string; desc: string }) {
    return (
        <div className={`bg-${color}-50 p-4 rounded-xl border border-${color}-100`}>
            <div className={`text-${color}-700 font-medium mb-2`}>{name}</div>
            <p className="text-sm text-gray-700"><strong>Meaning:</strong> {desc}</p>
        </div>
    );
}

function DeepLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors border border-blue-200">
            {children} <ExternalLink className="w-3 h-3" />
        </Link>
    );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <span className="text-sm font-medium text-gray-800">{title}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="px-4 py-3 text-sm text-gray-700 space-y-2">{children}</div>}
        </div>
    );
}

/* ═══════════════════════ SECTION 1: BAT DAU NHANH ═══════════════════════ */
function QuickStartSection({ t }: { t: ReturnType<typeof useTranslations> }) {
    const [dqStats, setDqStats] = useState<ValidationResult | null>(null);
    useEffect(() => { validateOTBData().then(setDqStats).catch(() => { }); }, []);
    const warningCount = dqStats?.stats.warningCount ?? 0;
    const totalRows = dqStats?.stats.totalRows ?? 0;
    const completeness = dqStats?.stats.completeness ?? 0;
    const pastCount = dqStats?.issues.filter(i => i.code === 'PAST_STAY_DATE').length ?? 0;
    const pastPct = totalRows > 0 ? Math.round((pastCount / totalRows) * 100) : 0;

    return (
        <>
            {/* Layer 1: Morning Routine */}
            <Card id="morning-routine" title={t('morningTitle')} icon={<Clock className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600">{t('morningDesc')}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {[
                        { label: t('morningExportPms'), icon: <Download className="w-3.5 h-3.5" />, link: null },
                        { label: t('morningUpload'), icon: <Upload className="w-3.5 h-3.5" />, link: '/upload' },
                        { label: t('morningBuildData'), icon: <Database className="w-3.5 h-3.5" />, link: '/data' },
                        { label: t('morningViewDash'), icon: <BarChart3 className="w-3.5 h-3.5" />, link: '/dashboard' },
                        { label: t('morningAcceptPrice'), icon: <CheckCircle2 className="w-3.5 h-3.5" />, link: '/dashboard' },
                        { label: t('morningUpdateOta'), icon: <ExternalLink className="w-3.5 h-3.5" />, link: null },
                    ].map((step, i) => (
                        <span key={i} className="flex items-center gap-1">
                            {step.link ? (
                                <Link href={step.link} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg border border-blue-200 transition-colors cursor-pointer">
                                    {step.icon} {step.label}
                                </Link>
                            ) : (
                                <span className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">
                                    {step.icon} {step.label}
                                </span>
                            )}
                            {i < 5 && <ArrowRight className="w-3.5 h-3.5 text-gray-300" />}
                        </span>
                    ))}
                </div>
                <Tip>{t('morningTip')}</Tip>
            </Card>

            {/* Layer 2: 5 Steps */}
            <Card id="steps" title={t('stepsTitle')}>
                <div className="space-y-5">
                    <Step n={1} title={t('step1Title')}>
                        <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: t.raw('step1Desc') }} />
                        <Tip>{t('step1Tip')}</Tip>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={2} title={t('step2Title')}>
                        <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: t.raw('step2Desc') }} />
                        <DeepLink href="/upload">{t('step2Link')}</DeepLink>
                        <Warn>{t('step2Warn')}</Warn>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={3} title={t('step3Title')}>
                        <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: t.raw('step3Desc') }} />
                        <Pipeline steps={[t('subBuildOtb'), t('subBuildFeatures'), t('subRunForecast')]} />
                        <DeepLink href="/data">{t('step3Link')}</DeepLink>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={4} title={t('step4Title')}>
                        <ul className="space-y-1 text-gray-600 text-sm list-disc list-inside ml-2">
                            <li dangerouslySetInnerHTML={{ __html: t.raw('step4Kpi') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('step4Charts') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('step4Price') }} />
                        </ul>
                        <DeepLink href="/dashboard">{t('step4Link')}</DeepLink>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={5} title={t('step5Title')}>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                                <div className="font-medium text-emerald-700">{t('step5Accept')}</div>
                                <p className="text-xs text-gray-500 mt-1">{t('step5AcceptDesc')}</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                                <div className="font-medium text-amber-700">{t('step5Override')}</div>
                                <p className="text-xs text-gray-500 mt-1">{t('step5OverrideDesc')}</p>
                            </div>
                        </div>
                    </Step>
                </div>
            </Card>

            {/* Layer 3a: Full Glossary */}
            <Card id="glossary-full" title={t('glossaryTitle')} icon={<BookOpen className="w-5 h-5 text-blue-600" />}>
                <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left text-gray-600">{t('glossaryTerm')}</th><th className="px-3 py-2 text-left text-gray-600">{t('glossaryDef')}</th></tr></thead>
                    <tbody className="text-gray-700">
                        {[
                            ['OTB', t('glossOtb')],
                            ['ADR', t('glossAdr')],
                            ['RevPAR', t('glossRevpar')],
                            ['Occupancy (OCC)', t('glossOcc')],
                            ['Pickup', t('glossPickup')],
                            ['BAR', t('glossBar')],
                            ['NET', t('glossNet')],
                            ['Display Price', t('glossDisplay')],
                            ['STLY', t('glossStly')],
                            ['Pace', t('glossPace')],
                            ['Remaining Supply', t('glossRemaining')],
                            ['Commission', t('glossCommission')],
                            ['Stacking', t('glossStacking')],
                        ].map(([term, desc]) => (
                            <tr key={term} className="border-t border-gray-100"><td className="px-3 py-3 font-mono text-blue-600">{term}</td><td className="px-3 py-3">{desc}</td></tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Layer 3b: FAQ / Common Issues */}
            <Card id="faq" title={t('faqTitle')} icon={<HelpCircle className="w-5 h-5 text-blue-600" />}>
                <div className="space-y-3">
                    <Accordion title={t('faqDqTitle')} defaultOpen={warningCount > 0}>
                        <p className="text-gray-600">{warningCount > 0 ? <span dangerouslySetInnerHTML={{ __html: t.raw('faqDqWarnings') }} /> : t('faqDqClean')}</p>
                        {totalRows > 0 && <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mt-2"><strong>{t('faqDqStatsLabel')}:</strong> {totalRows.toLocaleString()} OTB rows{pastCount > 0 && <>, {t('faqDqPastOf')} {pastCount.toLocaleString()} ({pastPct}%)</>}. {t('faqDqCompletenessLabel')}: <strong>{completeness}%</strong>.</div>}
                    </Accordion>
                    <Accordion title={t('faqPickupTitle')}>
                        <p dangerouslySetInnerHTML={{ __html: t.raw('faqPickupDesc') }} />
                    </Accordion>
                    <Accordion title={t('faqForecastTitle')}>
                        <p dangerouslySetInnerHTML={{ __html: t.raw('faqForecastDesc') }} />
                    </Accordion>
                    <Accordion title={t('faqUploadTitle')}>
                        <p>{t('faqUploadDesc')}</p>
                        <DeepLink href="/data">{t('buildOtbLink')}</DeepLink>
                    </Accordion>
                </div>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">{t('ctaReady')}</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><Upload className="w-4 h-4" /> {t('ctaUpload')}</Link>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"><BarChart3 className="w-4 h-4" /> {t('ctaViewDash')}</Link>
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════ PLACEHOLDER SECTIONS (to be filled) ═══════════════════════ */
function AnalyticsSection({ t }: { t: ReturnType<typeof useTranslations> }) {
    return (
        <>
            <Card id="rm-intro" title={t('rmTitle')} icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700">{t.raw('rmDesc')}</p>
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                        <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-800 text-sm">{t('rmMonitor')}</div>
                        <p className="text-xs text-gray-500 mt-1">{t('rmMonitorDesc')}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                        <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-800 text-sm">{t('rmForecast')}</div>
                        <p className="text-xs text-gray-500 mt-1">{t('rmForecastDesc')}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                        <DollarSign className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-800 text-sm">{t('rmPrice')}</div>
                        <p className="text-xs text-gray-500 mt-1">{t('rmPriceDesc')}</p>
                    </div>
                </div>
            </Card>

            <Card id="kpi" title={t('kpiTitle')} icon={<BarChart3 className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600 mb-3">{t('kpiDesc')}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <KPIExplain color="blue" name="Rooms OTB" desc={t('kpiOtbDesc')} />
                    <KPIExplain color="amber" name="Remaining Supply" desc={t('kpiRemDesc')} />
                    <KPIExplain color="emerald" name="Pickup (7d)" desc={t('kpiPickupDesc')} />
                    <KPIExplain color="purple" name="ADR" desc={t('kpiAdrDesc')} />
                </div>
                <DeepLink href="/dashboard">{t('kpiOpenDash')}</DeepLink>
            </Card>

            <Card id="charts" title={t('chartsTitle')} icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('chartsDesc') }} />
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('chartsCurrent') }} />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        <span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('chartsStly') }} />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('chartsPace') }} />
                    </div>
                </div>
                <Tip>{t('chartsTip')}</Tip>
            </Card>

            <Card id="rec-table" title={t('recTitle')} icon={<DollarSign className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: t.raw('recDesc') }} />

                {/* Quick vs Detail */}
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="font-medium text-blue-800 mb-2">{t('recQuickTitle')}</div>
                        <p className="text-xs text-gray-600">{t('recQuickDesc')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('recQuickFor')}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="font-medium text-purple-800 mb-2">{t('recDetailTitle')}</div>
                        <p className="text-xs text-gray-600">{t('recDetailDesc')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('recDetailFor')}</p>
                    </div>
                </div>

                {/* Column explanation */}
                <h3 className="text-sm font-semibold text-gray-800 mb-2">{t('recColTitle')}</h3>
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600">{t('recColH1')}</th>
                            <th className="px-3 py-2 text-left text-gray-600">{t('recColH2')}</th>
                            <th className="px-3 py-2 text-left text-gray-600">{t('recColH3')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Date</td><td className="px-3 py-2">{t('recDate')}</td><td className="px-3 py-2 text-xs text-gray-400">-</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">OTB</td><td className="px-3 py-2">{t('recOtb')}</td><td className="px-3 py-2 text-xs text-gray-400">daily_otb</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Remaining</td><td className="px-3 py-2">{t('recRemaining')}</td><td className="px-3 py-2 text-xs text-gray-400">calculated</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Forecast</td><td className="px-3 py-2">{t('recForecast')}</td><td className="px-3 py-2 text-xs text-gray-400">demand_forecast</td></tr>
                        <tr className="border-t bg-blue-50"><td className="px-3 py-2 font-medium">Anchor</td><td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: t.raw('recAnchor') }} /><td className="px-3 py-2 text-xs text-gray-400">{t('recAnchorSrc')}</td></tr>
                        <tr className="border-t bg-blue-50"><td className="px-3 py-2 font-medium text-gray-400 text-xs pl-6">ADR (small)</td><td className="px-3 py-2 text-xs text-gray-500">{t('recAdrSmall')}</td><td className="px-3 py-2 text-xs text-gray-400">revenue / rooms</td></tr>
                        <tr className="border-t bg-emerald-50"><td className="px-3 py-2 font-medium">Suggested</td><td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: t.raw('recSuggested') }} /><td className="px-3 py-2 text-xs text-gray-400">pricing engine</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Action</td><td className="px-3 py-2">{t('recAction')}</td><td className="px-3 py-2 text-xs text-gray-400">compare suggested vs anchor</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Reason</td><td className="px-3 py-2">{t('recReason')}</td><td className="px-3 py-2 text-xs text-gray-400">pricing engine</td></tr>
                    </tbody>
                </table>

                {/* OTB% vs Projected OCC */}
                <Accordion title={t('accOtbTitle')} defaultOpen>
                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium shrink-0 mt-0.5">OTB%</span>
                            <span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accOtbDesc') }} />
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium shrink-0 mt-0.5">Projected%</span>
                            <span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accProjDesc') }} />
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <p className="font-mono" dangerouslySetInnerHTML={{ __html: t.raw('accOtbExample') }} />
                            <p className="text-gray-500 mt-1">{t('accOtbMeaning')}</p>
                        </div>
                    </div>
                </Accordion>

                {/* Anchor explanation */}
                <Accordion title={t('accAnchorTitle')}>
                    <div className="space-y-2">
                        <p dangerouslySetInnerHTML={{ __html: t.raw('accAnchorDesc') }} />
                        <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                            <p dangerouslySetInnerHTML={{ __html: t.raw('accAnchorP1') }} />
                            <p dangerouslySetInnerHTML={{ __html: t.raw('accAnchorP2') }} />
                        </div>
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accAdrExplain') }} />
                        <Tip>{t('accAdrTip')}</Tip>
                    </div>
                </Accordion>

                {/* How engine decides */}
                <Accordion title={t('accEngineTitle')}>
                    <div className="space-y-3">
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accEngineDesc') }} />
                        <Pipeline steps={['Select Anchor', 'Calculate Projected OCC', 'Determine Zone', 'Apply Multiplier', 'Guardrails']} />
                        <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono space-y-1">
                            <p>finalOcc = (OTB − expectedCxl + expectedNew) / capacity</p>
                            <p>pressure = finalOcc / 0.40 (breakpoint)</p>
                            <p>recommended = anchor × multiplier(pressure)</p>
                            <p>recommended = clamp(recommended, min_rate, max_rate)</p>
                        </div>

                        <h4 className="font-medium text-gray-800 text-sm mt-2">{t('accEngineZone')}</h4>
                        <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-2 py-1.5 text-left">{t('accEngineZoneH1')}</th>
                                    <th className="px-2 py-1.5 text-center">Zone</th>
                                    <th className="px-2 py-1.5 text-center">Multiplier</th>
                                    <th className="px-2 py-1.5 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                <tr className="border-t bg-red-50"><td className="px-2 py-1.5">{'<'} 10%</td><td className="px-2 py-1.5 text-center text-red-600 font-medium">DISTRESS</td><td className="px-2 py-1.5 text-center font-mono">×0.85</td><td className="px-2 py-1.5">{t('zoneDistress')}</td></tr>
                                <tr className="border-t bg-amber-50"><td className="px-2 py-1.5">10–24%</td><td className="px-2 py-1.5 text-center text-amber-600 font-medium">SOFT</td><td className="px-2 py-1.5 text-center font-mono">×0.90–0.95</td><td className="px-2 py-1.5">{t('zoneSoft')}</td></tr>
                                <tr className="border-t"><td className="px-2 py-1.5">24–48%</td><td className="px-2 py-1.5 text-center text-gray-600 font-medium">NORMAL</td><td className="px-2 py-1.5 text-center font-mono">×0.95–1.00</td><td className="px-2 py-1.5">{t('zoneNormal')}</td></tr>
                                <tr className="border-t bg-blue-50"><td className="px-2 py-1.5">48–80%</td><td className="px-2 py-1.5 text-center text-blue-600 font-medium">STRONG</td><td className="px-2 py-1.5 text-center font-mono">×1.00–1.15</td><td className="px-2 py-1.5">{t('zoneStrong')}</td></tr>
                                <tr className="border-t bg-purple-50"><td className="px-2 py-1.5">{'>'} 80%</td><td className="px-2 py-1.5 text-center text-purple-600 font-medium">SURGE</td><td className="px-2 py-1.5 text-center font-mono">×1.15–1.25</td><td className="px-2 py-1.5">{t('zoneSurge')}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </Accordion>

                {/* ADR sanity banner */}
                <Accordion title={t('accAdrBannerTitle')}>
                    <p className="text-sm">{t('accAdrBannerDesc')}</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 text-xs text-amber-800">
                        ⚠️ Large ADR Deviation: X days have ADR deviating {'>'} 30% from anchor price. Check approved prices or update Base Rate in Settings.
                    </div>
                    <p className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: t.raw('accAdrBannerCause') }} />
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accAdrBannerAction') }} />
                </Accordion>

                {/* When to override */}
                <Accordion title={t('accOverrideTitle')}>
                    <div className="space-y-2 text-sm">
                        <p>{t('accOverrideDesc')}</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                            <li dangerouslySetInnerHTML={{ __html: t.raw('accOverride1') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('accOverride2') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('accOverride3') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('accOverride4') }} />
                        </ul>
                        <Tip>{t('accOverrideTip')}</Tip>
                    </div>
                </Accordion>

                <DeepLink href="/dashboard">{t('forecastLink')}</DeepLink>
            </Card>

            {/* Dynamic Pricing subsection */}
            <Card id="dp-overview" title={t('dpTitle')} icon={<Layers className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: t.raw('dpDesc') }} />
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-200">{t('dpSeason')}</span>
                    <span className="text-gray-400">&times;</span>
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">{t('dpOccTier')}</span>
                    <span className="text-gray-400">=</span>
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-200 font-medium">{t('dpNetPrice')}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm mt-3">
                    <p className="font-mono text-center text-lg">{t('dpFormula')}</p>
                    <p className="text-gray-600 mt-2 text-center" dangerouslySetInnerHTML={{ __html: t.raw('dpExample') }} />
                </div>
                <DeepLink href="/pricing">{t('dpOpenLink')}</DeepLink>
            </Card>

            <Card id="dp-seasons" title={t('seasonsTitle')} icon={<CalendarDays className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('seasonsDesc') }} />
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600">{t('seasonH1')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">{t('seasonH2')}</th>
                            <th className="px-3 py-2 text-left text-gray-600">{t('seasonH3')}</th>
                            <th className="px-3 py-2 text-right text-gray-600">Base NET</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-3"><span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs mr-1">P1</span> {t('seasonNormal')}</td><td className="px-3 py-3 text-center">{t('seasonNormalLvl')}</td><td className="px-3 py-3">{t('seasonNormalEx')}</td><td className="px-3 py-3 text-right font-mono">1.200.000đ</td></tr>
                        <tr className="border-t bg-amber-50"><td className="px-3 py-3"><span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs mr-1">P2</span> {t('seasonHigh')}</td><td className="px-3 py-3 text-center">{t('seasonHighLvl')}</td><td className="px-3 py-3">{t('seasonHighEx')}</td><td className="px-3 py-3 text-right font-mono">1.500.000đ</td></tr>
                        <tr className="border-t bg-red-50"><td className="px-3 py-3"><span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs mr-1">P3</span> {t('seasonHoliday')}</td><td className="px-3 py-3 text-center">{t('seasonHolidayLvl')}</td><td className="px-3 py-3">{t('seasonHolidayEx')}</td><td className="px-3 py-3 text-right font-mono">2.000.000đ</td></tr>
                    </tbody>
                </table>
                <div className="space-y-2">
                    <Step n={1} title={t('seasonStep1')}><p className="text-sm text-gray-600">{t('seasonStep1Desc')}</p></Step>
                    <Step n={2} title={t('seasonStep2')}><p className="text-sm text-gray-600">{t.raw('seasonStep2Desc')}</p></Step>
                    <Step n={3} title={t('seasonStep3')}><p className="text-sm text-gray-600">{t.raw('seasonStep3Desc')}</p></Step>
                    <Step n={4} title={t('seasonStep4')}><p className="text-sm text-gray-600">{t('seasonStep4Desc')}</p></Step>
                    <Step n={5} title={t('seasonStep5')}><p className="text-sm text-gray-600">{t.raw('seasonStep5Desc')}</p></Step>
                </div>
                <Warn><span dangerouslySetInnerHTML={{ __html: t.raw('seasonPriority') }} /></Warn>
            </Card>

            <Card id="dp-occ-tiers" title={t('occTitle')} icon={<Percent className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('occDesc') }} />
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600">{t('occH1')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">OCC%</th>
                            <th className="px-3 py-2 text-center text-gray-600">Multiplier</th>
                            <th className="px-3 py-2 text-left text-gray-600">{t('occH4')}</th>
                            <th className="px-3 py-2 text-right text-gray-600">NET (VD)</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-3">#0</td><td className="px-3 py-3 text-center">0–35%</td><td className="px-3 py-3 text-center font-mono">&times;1.00</td><td className="px-3 py-3 text-gray-500">{t('occT0')}</td><td className="px-3 py-3 text-right font-mono">1.200.000đ</td></tr>
                        <tr className="border-t bg-blue-50"><td className="px-3 py-3">#1</td><td className="px-3 py-3 text-center">35–65%</td><td className="px-3 py-3 text-center font-mono">&times;1.10</td><td className="px-3 py-3 text-gray-500">{t('occT1')}</td><td className="px-3 py-3 text-right font-mono">1.320.000đ</td></tr>
                        <tr className="border-t bg-amber-50"><td className="px-3 py-3">#2</td><td className="px-3 py-3 text-center">65–85%</td><td className="px-3 py-3 text-center font-mono">&times;1.20</td><td className="px-3 py-3 text-gray-500">{t('occT2')}</td><td className="px-3 py-3 text-right font-mono">1.440.000đ</td></tr>
                        <tr className="border-t bg-red-50"><td className="px-3 py-3">#3</td><td className="px-3 py-3 text-center">{'>'} 85%</td><td className="px-3 py-3 text-center font-mono">&times;1.30</td><td className="px-3 py-3 text-gray-500">{t('occT3')}</td><td className="px-3 py-3 text-right font-mono">1.560.000đ</td></tr>
                    </tbody>
                </table>
                <Tip><span dangerouslySetInnerHTML={{ __html: t.raw('occTip') }} /></Tip>
            </Card>

            <Card id="terms" title={t('termsTitle')} icon={<BookOpen className="w-5 h-5 text-blue-600" />}>
                <div className="grid sm:grid-cols-2 gap-3">
                    {[
                        { term: 'OTB', desc: t('termsOtb') },
                        { term: 'ADR', desc: t('termsAdr') },
                        { term: 'RevPAR', desc: t('termsRevpar') },
                        { term: 'OCC%', desc: t('termsOcc') },
                        { term: 'Pickup', desc: t('termsPickup') },
                        { term: 'STLY', desc: t('termsStly') },
                        { term: 'Pace', desc: t('termsPace') },
                        { term: 'Lead Time', desc: t('termsLeadTime') },
                    ].map(({ term, desc }) => (
                        <div key={term} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <span className="font-mono text-blue-600 font-medium text-sm">{term}</span>
                            <p className="text-xs text-gray-600 mt-1">{desc}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">{t('analCta')}</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><BarChart3 className="w-4 h-4" /> {t('analDashLink')}</Link>
                    <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"><Layers className="w-4 h-4" /> {t('analPricingLink')}</Link>
                </div>
            </div>
        </>
    );
}
function PricingSection({ t }: { t: ReturnType<typeof useTranslations> }) {
    return (
        <>
            {/* Intro with 1 example */}
            <Card id="pricing-intro" title={t('pricingIntroTitle')} icon={<Calculator className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: t.raw('pricingIntroDesc') }} />
                <div className="bg-gray-50 rounded-xl p-4 mt-3">
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                        <div className="bg-emerald-100 border border-emerald-300 rounded-lg px-4 py-3 text-center">
                            <div className="font-medium text-emerald-800">NET</div>
                            <div className="text-lg font-mono font-bold text-emerald-700">1,000,000₫</div>
                            <div className="text-xs text-emerald-600">{t('pricingNetLabel')}</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div className="bg-blue-100 border border-blue-300 rounded-lg px-4 py-3 text-center">
                            <div className="font-medium text-blue-800">BAR</div>
                            <div className="text-lg font-mono font-bold text-blue-700">1,250,000₫</div>
                            <div className="text-xs text-blue-600">{t('pricingBarLabel')}</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div className="bg-purple-100 border border-purple-300 rounded-lg px-4 py-3 text-center">
                            <div className="font-medium text-purple-800">Display</div>
                            <div className="text-lg font-mono font-bold text-purple-700">1,062,500₫</div>
                            <div className="text-xs text-purple-600">{t('pricingDisplayLabel')}</div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card id="formula" title={t('formulaTitle')} icon={<Calculator className="w-5 h-5 text-blue-600" />}>
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-medium text-blue-800 mb-2">{t('formula1Title')}</h4>
                        <p className="font-mono text-center text-lg">BAR = NET &divide; (1 - commission%)</p>
                        <p className="text-sm text-gray-600 mt-2 text-center">VD: 1.000.000 &divide; (1 - 0.20) = <strong>1,250,000₫</strong></p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <h4 className="font-medium text-purple-800 mb-2">{t('formula2Title')}</h4>
                        <p className="font-mono text-center text-lg">Display = BAR &times; (1 - total_discount%)</p>
                        <p className="text-sm text-gray-600 mt-2 text-center">VD: 1,250,000 &times; (1 - 0.15) = <strong>1,062,500₫</strong></p>
                    </div>
                </div>
                <Tip>{t('formulaTip')}</Tip>
            </Card>

            <Card id="channels" title={t('channelsTitle')} icon={<Percent className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600 mb-3">{t('channelsDesc')}</p>
                <div className="space-y-3">
                    <Accordion title="Agoda — Commission 15-22% | ADDITIVE stacking" defaultOpen>
                        <p dangerouslySetInnerHTML={{ __html: t.raw('chAgodaDesc') }} />
                        <p className="mt-2">VD: Mobile 5% + Member Deal 10% + Early Bird 15% = <strong>30% tong discount</strong></p>
                        <div className="bg-gray-50 rounded-lg p-3 mt-2 text-xs space-y-1">
                            <p>BAR = 1,250,000₫</p>
                            <p>Total discount = 30%</p>
                            <p>Display = 1,250,000 &times; 0.70 = <strong>875,000₫</strong></p>
                            <p className="text-emerald-600">NET = 875.000 &times; (1 - 0.20) = <strong>700,000₫</strong></p>
                        </div>
                        <Warn><span dangerouslySetInnerHTML={{ __html: t.raw('chAgodaWarn') }} /></Warn>
                    </Accordion>

                    <Accordion title="Booking.com — Commission 15-18% | PROGRESSIVE stacking">
                        <p dangerouslySetInnerHTML={{ __html: t.raw('chBookingDesc') }} />
                        <p className="mt-2">VD: Genius 20% &rarr; Mobile 10%</p>
                        <div className="bg-gray-50 rounded-lg p-3 mt-2 text-xs space-y-1">
                            <p>BAR = 1,250,000₫</p>
                            <p>After Genius 20% = 1,000,000₫</p>
                            <p>After Mobile 10% = <strong>900,000₫</strong> (Display)</p>
                            <p>Total actual discount: 28% (not 30%)</p>
                        </div>
                    </Accordion>

                    <Accordion title="Expedia — Commission 18-25% | HIGHEST_WINS stacking">
                        <p dangerouslySetInnerHTML={{ __html: t.raw('chExpediaDesc') }} />
                        <p className="mt-2">E.g.: 3 promotions: Package 20%, Member 15%, Flash 25% → only <strong>Flash 25%</strong> applies.</p>
                    </Accordion>

                    <Accordion title="Traveloka — Commission 18-22% | SINGLE stacking">
                        <p dangerouslySetInnerHTML={{ __html: t.raw('chTravelokaDesc') }} />
                        <p className="mt-2">{t('chTravelokaPriority')}</p>
                    </Accordion>

                    <Accordion title="CTRIP/Trip.com — Commission 20-25% | ONLY_WITH_GENIUS stacking">
                        <p dangerouslySetInnerHTML={{ __html: t.raw('chCtripDesc') }} />
                        <p className="mt-2">E.g.: CTrip VIP 15% (main) + Extra 5% (only with VIP) = 20%.</p>
                    </Accordion>
                </div>
            </Card>

            <Card id="promos" title={t('promosTitle')} icon={<Tag className="w-5 h-5 text-blue-600" />}>
                <div className="grid sm:grid-cols-2 gap-3">
                    <div className="border border-blue-200 rounded-xl p-4">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">ADDITIVE</span>
                        <p className="text-sm text-gray-700 mt-2" dangerouslySetInnerHTML={{ __html: t.raw('promoAdditive') }} />
                        <p className="text-xs text-gray-500 mt-1">Agoda</p>
                    </div>
                    <div className="border border-purple-200 rounded-xl p-4">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">PROGRESSIVE</span>
                        <p className="text-sm text-gray-700 mt-2">{t('promoProgressive')}</p>
                        <p className="text-xs text-gray-500 mt-1">Booking.com</p>
                    </div>
                    <div className="border border-amber-200 rounded-xl p-4">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">HIGHEST_WINS</span>
                        <p className="text-sm text-gray-700 mt-2">{t('promoHighest')}</p>
                        <p className="text-xs text-gray-500 mt-1">Expedia</p>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-4">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">SINGLE / ONLY_WITH</span>
                        <p className="text-sm text-gray-700 mt-2">{t('promoSingle')}</p>
                        <p className="text-xs text-gray-500 mt-1">Traveloka, CTRIP</p>
                    </div>
                </div>
            </Card>

            <Card id="compare" title={t('compareTitle')} icon={<ArrowRightLeft className="w-5 h-5 text-blue-600" />}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left text-gray-600">{t('compareH1')}</th>
                                <th className="px-3 py-2 text-center text-gray-600">{t('compareH2')}</th>
                                <th className="px-3 py-2 text-center text-gray-600">Stacking</th>
                                <th className="px-3 py-2 text-right text-gray-600">NET (VD)</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            <tr className="border-t"><td className="px-3 py-2">Agoda</td><td className="px-3 py-2 text-center">15-22%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">ADDITIVE</span></td><td className="px-3 py-2 text-right font-mono">700,000₫</td></tr>
                            <tr className="border-t"><td className="px-3 py-2">Booking</td><td className="px-3 py-2 text-center">15-18%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">PROGRESSIVE</span></td><td className="px-3 py-2 text-right font-mono">738.000đ</td></tr>
                            <tr className="border-t"><td className="px-3 py-2">Expedia</td><td className="px-3 py-2 text-center">18-25%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">HIGHEST_WINS</span></td><td className="px-3 py-2 text-right font-mono">750.000đ</td></tr>
                            <tr className="border-t"><td className="px-3 py-2">Traveloka</td><td className="px-3 py-2 text-center">18-22%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">SINGLE</span></td><td className="px-3 py-2 text-right font-mono">780.000đ</td></tr>
                            <tr className="border-t"><td className="px-3 py-2">CTRIP</td><td className="px-3 py-2 text-center">20-25%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">ONLY_WITH</span></td><td className="px-3 py-2 text-right font-mono">720.000đ</td></tr>
                        </tbody>
                    </table>
                </div>
                <Tip>{t('compareTip')}</Tip>
            </Card>

            <Card id="price-matrix" title={t('matrixTitle')} icon={<Layers className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('matrixDesc') }} />
                <table className="w-full text-sm mb-3">
                    <thead className="bg-gray-100">
                        <tr><th className="px-3 py-2 text-left text-gray-600">{t('matrixElement')}</th><th className="px-3 py-2 text-left text-gray-600">{t('matrixMeaning')}</th></tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Column &quot;Room Type&quot;</td><td className="px-3 py-2">{t('matrixRoomType')}</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Column &quot;Base NET&quot;</td><td className="px-3 py-2">{t('matrixBaseNet')}</td></tr>
                        <tr className="border-t bg-blue-50"><td className="px-3 py-2 font-medium">OCC tier columns</td><td className="px-3 py-2">{t('matrixOccCols')}</td></tr>
                        <tr className="border-t bg-blue-100"><td className="px-3 py-2 font-medium">Highlighted column (dark blue)</td><td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: t.raw('matrixHighlight') }} /></tr>
                        <tr className="border-t bg-red-50"><td className="px-3 py-2 font-medium">Red cell</td><td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: t.raw('matrixGuardrail') }} /></tr>
                    </tbody>
                </table>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="font-medium text-blue-700 mb-2">{t('matrixModes')}</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="font-medium text-emerald-700 text-sm">Revenue (NET)</div>
                            <p className="text-xs text-gray-600 mt-1">{t('matrixNetDesc')}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="font-medium text-blue-700 text-sm">BAR</div>
                            <p className="text-xs text-gray-600 mt-1">{t('matrixBarDesc')}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="font-medium text-purple-700 text-sm">Display Price</div>
                            <p className="text-xs text-gray-600 mt-1">{t('matrixDisplayDesc')}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Card id="reverse" title={t('reverseTitle')} icon={<ArrowRightLeft className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">{t('reverseDesc')}</p>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="font-mono text-lg">NET = BAR &times; (1 - commission%)</p>
                    <p className="text-sm text-gray-600 mt-2">VD: BAR = 1.250.000, Commission Agoda = 20%</p>
                    <p className="text-sm text-gray-600">NET = 1,250,000 &times; 0.80 = <strong>1,000,000₫</strong></p>
                </div>
                <Tip>{t('reverseTip')}</Tip>
            </Card>

            <Card id="dp-export" title={t('exportTitle')} icon={<Download className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('exportDesc') }} />
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    <li>{t('exportItem1')}</li>
                    <li>{t('exportItem2')}</li>
                    <li>{t('exportItem3')}</li>
                </ul>
                <Tip>{t('exportTip')}</Tip>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">{t('pricingCta')}</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><Calculator className="w-4 h-4" /> {t('pricingCtaLink')}</Link>
                </div>
            </div>
        </>
    );
}
function DataSection({ t }: { t: ReturnType<typeof useTranslations> }) {
    return (
        <>
            <Card id="upload" title={t('importTitle')} icon={<Upload className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">{t('importDesc')}</p>
                <div className="space-y-3">
                    <Step n={1} title={t('importStep1')}>
                        <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: t.raw('importS1Desc') }} />
                        <Tip>{t('importS1Tip')}</Tip>
                    </Step>
                    <Step n={2} title={t('importStep2')}>
                        <p className="text-sm text-gray-600">{t('importS2Desc')}</p>
                        <DeepLink href="/upload">{t('importStep2Link')}</DeepLink>
                    </Step>
                    <Step n={3} title={t('importStep3')}>
                        <p className="text-sm text-gray-600">{t('importS3Desc')}</p>
                    </Step>
                </div>
                <Warn><span dangerouslySetInnerHTML={{ __html: t.raw('importWarn') }} /></Warn>
            </Card>

            <Card id="build-otb" title={t('buildOtbTitle')} icon={<Database className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('buildOtbDesc') }} />
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                    <p dangerouslySetInnerHTML={{ __html: t.raw('buildOtbInput') }} />
                    <p dangerouslySetInnerHTML={{ __html: t.raw('buildOtbOutput') }} />
                    <p dangerouslySetInnerHTML={{ __html: t.raw('buildOtbDuration') }} />
                </div>
                <DeepLink href="/data">{t('buildOtbLink')}</DeepLink>
            </Card>

            <Card id="build-features" title={t('buildFeatTitle')} icon={<Settings className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">{t('buildFeatDesc')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    <li dangerouslySetInnerHTML={{ __html: t.raw('buildFeatPickup') }} />
                    <li dangerouslySetInnerHTML={{ __html: t.raw('buildFeatStly') }} />
                    <li dangerouslySetInnerHTML={{ __html: t.raw('buildFeatPace') }} />
                    <li dangerouslySetInnerHTML={{ __html: t.raw('buildFeatRemaining') }} />
                </ul>
                <Warn><span dangerouslySetInnerHTML={{ __html: t.raw('buildFeatWarn') }} /></Warn>
            </Card>

            <Card id="run-forecast" title={t('forecastTitle')} icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">{t('forecastDesc')}</p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                    <p dangerouslySetInnerHTML={{ __html: t.raw('forecastEnough') }} />
                    <p dangerouslySetInnerHTML={{ __html: t.raw('forecastNotEnough') }} />
                </div>
                <Pipeline steps={[t('morningUpload'), t('subBuildOtb'), t('subBuildFeatures'), t('subRunForecast')]} />
                <Tip>{t('forecastTip')}</Tip>
                <DeepLink href="/dashboard">{t('forecastDashLink')}</DeepLink>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">{t('dataCta')}</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><Upload className="w-4 h-4" /> {t('ctaUpload')}</Link>
                    <Link href="/data" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"><Database className="w-4 h-4" /> {t('dataCtaOpen')}</Link>
                </div>
            </div>
        </>
    );
}

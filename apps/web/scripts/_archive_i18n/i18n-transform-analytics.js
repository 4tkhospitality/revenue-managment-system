// Transform AnalyticsSection body text to use t() calls
const fs = require('fs');
const fp = require('path').join(__dirname, '..', 'app', 'guide', 'page.tsx');
let code = fs.readFileSync(fp, 'utf8');

const replacements = [
    // RM Intro (510)
    [`Revenue Management (RM) = <strong>selling the right room, at the right price, at the right time</strong> to maximize revenue. The system helps you:`, `{t.raw('rmDesc')}`],
    [`<div className="font-medium text-gray-800 text-sm">Monitor OTB</div>`, `<div className="font-medium text-gray-800 text-sm">{t('rmMonitor')}</div>`],
    [`How many rooms are booked, how many are available`, `{t('rmMonitorDesc')}`],
    [`<div className="font-medium text-gray-800 text-sm">Forecast Demand</div>`, `<div className="font-medium text-gray-800 text-sm">{t('rmForecast')}</div>`],
    [`Predict booking pace for the next 30–90 days`, `{t('rmForecastDesc')}`],
    [`<div className="font-medium text-gray-800 text-sm">Price Recommendation</div>`, `<div className="font-medium text-gray-800 text-sm">{t('rmPrice')}</div>`],
    [`Accept system price or Override with your own`, `{t('rmPriceDesc')}`],
    // KPI (531-538)
    [`Dashboard shows 4 main KPI cards. Read them by common GM questions:`, `{t('kpiDesc')}`],
    [`desc="Rooms already booked. E.g.: OTB = 45 means you've sold 45 rooms for that day."`, `desc={t('kpiOtbDesc')}`],
    [`desc="Rooms still available. E.g.: Remaining = 15 means 15 rooms left to sell."`, `desc={t('kpiRemDesc')}`],
    [`desc="New bookings in the last 7 days. Pickup = +8 is good (demand increasing)."`, `desc={t('kpiPickupDesc')}`],
    [`desc="Average room price. E.g.: ADR = 1.2M means averaging 1.2M per room per night."`, `desc={t('kpiAdrDesc')}`],
    [`<DeepLink href="/dashboard">Open Dashboard xem KPI</DeepLink>`, `<DeepLink href="/dashboard">{t('kpiOpenDash')}</DeepLink>`],
    // Charts (542-558) - use dangerouslySetInnerHTML for HTML content
    [`<p className="text-sm text-gray-600 mb-3">OTB chart helps you compare performance with <strong>Same Time Last Year (STLY)</strong>:</p>`, `<p className="text-sm text-gray-600 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('chartsDesc') }} />`],
    [`<span className="text-sm"><strong>Current Year OTB</strong> — Blue line: current bookings</span>`, `<span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('chartsCurrent') }} />`],
    [`<span className="text-sm"><strong>STLY</strong> — Gray line: bookings same time last year</span>`, `<span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('chartsStly') }} />`],
    [`<span className="text-sm"><strong>Pace</strong> — <span className="text-emerald-600">+5 OTB</span> = selling 5 rooms ahead of last year</span>`, `<span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('chartsPace') }} />`],
    [`<Tip>If Pace is negative (−), you're selling slower than last year → consider lowering prices or increasing promotions.</Tip>`, `<Tip>{t('chartsTip')}</Tip>`],
    // Rec Table (561-597)
    [`<p className="text-sm text-gray-600 mb-4">Dashboard has <strong>2 view modes</strong>: Quick Review and Detailed Analysis.</p>`, `<p className="text-sm text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: t.raw('recDesc') }} />`],
    [`<div className="font-medium text-blue-800 mb-2">⚡ Quick Review</div>`, `<div className="font-medium text-blue-800 mb-2">{t('recQuickTitle')}</div>`],
    [`Quick view of recommended prices, actions (Increase/Decrease/Keep), and approve.`, `{t('recQuickDesc')}`],
    [`For: GM daily price review (5 minutes)`, `{t('recQuickFor')}`],
    [`<div className="font-medium text-purple-800 mb-2">📊 Detailed Analysis</div>`, `<div className="font-medium text-purple-800 mb-2">{t('recDetailTitle')}</div>`],
    [`View OTB, Remaining, Forecast, Anchor, ADR — understand WHY the system recommends.`, `{t('recDetailDesc')}`],
    [`For: deep analysis, price override`, `{t('recDetailFor')}`],
    [`<h3 className="text-sm font-semibold text-gray-800 mb-2">Column Definitions (Detailed Analysis)</h3>`, `<h3 className="text-sm font-semibold text-gray-800 mb-2">{t('recColTitle')}</h3>`],
    [`<th className="px-3 py-2 text-left text-gray-600">Column</th>`, `<th className="px-3 py-2 text-left text-gray-600">{t('recColH1')}</th>`],
    [`<th className="px-3 py-2 text-left text-gray-600">Meaning</th>`, `<th className="px-3 py-2 text-left text-gray-600">{t('recColH2')}</th>`],
    [`<th className="px-3 py-2 text-left text-gray-600">Source</th>`, `<th className="px-3 py-2 text-left text-gray-600">{t('recColH3')}</th>`],
    [`<td className="px-3 py-2">Stay date</td>`, `<td className="px-3 py-2">{t('recDate')}</td>`],
    [`<td className="px-3 py-2">Rooms booked</td>`, `<td className="px-3 py-2">{t('recOtb')}</td>`],
    [`<td className="px-3 py-2">Rooms available (capacity – OTB)</td>`, `<td className="px-3 py-2">{t('recRemaining')}</td>`],
    [`<td className="px-3 py-2">Forecasted demand (remaining demand from ML)</td>`, `<td className="px-3 py-2">{t('recForecast')}</td>`],
    [`<td className="px-3 py-2"><strong>Anchor price</strong> — price GM is currently selling at</td>`, `<td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: t.raw('recAnchor') }} />`],
    [`<td className="px-3 py-2 text-xs text-gray-400">last accepted or rack</td>`, `<td className="px-3 py-2 text-xs text-gray-400">{t('recAnchorSrc')}</td>`],
    [`<td className="px-3 py-2 text-xs text-gray-500">Actual average selling price (reference)</td>`, `<td className="px-3 py-2 text-xs text-gray-500">{t('recAdrSmall')}</td>`],
    [`<td className="px-3 py-2"><strong>System recommended price</strong></td>`, `<td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: t.raw('recSuggested') }} />`],
    [`<td className="px-3 py-2">Increase / Decrease / Keep / Stop Selling</td>`, `<td className="px-3 py-2">{t('recAction')}</td>`],
    [`<td className="px-3 py-2">Definition: &quot;OTB X%, forecast Y%&quot;</td>`, `<td className="px-3 py-2">{t('recReason')}</td>`],
    // OTB vs Projected accordion (601-616)
    [`<Accordion title="OTB% vs Projected% — What's the difference?" defaultOpen>`, `<Accordion title={t('accOtbTitle')} defaultOpen>`],
    [`<span className="text-sm">Current rooms booked / total rooms. <strong>This is actual data</strong>, not a prediction.</span>`, `<span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accOtbDesc') }} />`],
    [`<span className="text-sm">Projected OCC = (OTB – expected cancellations + expected new bookings) / total rooms. <strong>This is a prediction</strong> (may be inaccurate).</span>`, `<span className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accProjDesc') }} />`],
    [`<p className="font-mono">E.g.: OTB = 162/270 = <strong>60%</strong>, projected = (162 − 49 + 0) / 270 = <strong>42%</strong></p>`, `<p className="font-mono" dangerouslySetInnerHTML={{ __html: t.raw('accOtbExample') }} />`],
    [`<p className="text-gray-500 mt-1">Meaning: currently 60% rooms are booked, but projected final is only 42% (due to cancellations).</p>`, `<p className="text-gray-500 mt-1">{t('accOtbMeaning')}</p>`],
    // Anchor accordion (619-629)
    [`<Accordion title="What is Anchor? Why not use ADR?">`, `<Accordion title={t('accAnchorTitle')}>`],
    [`<p><strong>Anchor</strong> = price GM is currently selling at (intention signal):</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('accAnchorDesc') }} />`],
    [`<p>1. <strong>Priority 1:</strong> Most recently approved/overridden price for that day (last accepted)</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('accAnchorP1') }} />`],
    [`<p>2. <strong>Priority 2:</strong> Rack rate = Base Rate × Season (if no decision made yet)</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('accAnchorP2') }} />`],
    [`<p className="text-sm"><strong>ADR</strong> (Average Daily Rate) = actual average selling price. This is an <em>outcome signal</em> — affected by room type mix, discounts, OTA channel. <strong>Don't use ADR as the pricing anchor</strong> as it creates a feedback loop (ADR high → raise price → ADR higher → spiral).</p>`, `<p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accAdrExplain') }} />`],
    [`<Tip>ADR is shown below Anchor in small text for reference. If ADR deviates from Anchor {'>'} 30%, a yellow warning banner will appear.</Tip>`, `<Tip>{t('accAdrTip')}</Tip>`],
    // Engine accordion (632-662)
    [`<Accordion title="How does the system decide to increase/decrease price?">`, `<Accordion title={t('accEngineTitle')}>`],
    [`<p className="text-sm">Pricing Engine uses <strong>Anchor + Projected OCC</strong> (not ADR):</p>`, `<p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accEngineDesc') }} />`],
    [`<h4 className="font-medium text-gray-800 text-sm mt-2">Zone Table</h4>`, `<h4 className="font-medium text-gray-800 text-sm mt-2">{t('accEngineZone')}</h4>`],
    [`<th className="px-2 py-1.5 text-left">Projected OCC</th>`, `<th className="px-2 py-1.5 text-left">{t('accEngineZoneH1')}</th>`],
    [`<td className="px-2 py-1.5">Sharp Decrease</td>`, `<td className="px-2 py-1.5">{t('zoneDistress')}</td>`],
    [`<td className="px-2 py-1.5">Slight Decrease</td>`, `<td className="px-2 py-1.5">{t('zoneSoft')}</td>`],
    [`<td className="px-2 py-1.5">Hold Price</td>`, `<td className="px-2 py-1.5">{t('zoneNormal')}</td>`],
    [`<td className="px-2 py-1.5">Increase</td></tr>`, `<td className="px-2 py-1.5">{t('zoneStrong')}</td></tr>`],
    [`<td className="px-2 py-1.5">Sharp Increase</td>`, `<td className="px-2 py-1.5">{t('zoneSurge')}</td>`],
    // ADR banner accordion (665-672)
    [`<Accordion title="What does the 'Large ADR Deviation' yellow banner mean?">`, `<Accordion title={t('accAdrBannerTitle')}>`],
    [`<p className="text-sm">When many days have ADR deviating {'>'} 30% from Anchor, the system warns:</p>`, `<p className="text-sm">{t('accAdrBannerDesc')}</p>`],
    [`<p className="text-sm mt-2"><strong>Cause:</strong> May be due to too many OTA promotions, room type mix, or outdated Base Rate in Settings.</p>`, `<p className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: t.raw('accAdrBannerCause') }} />`],
    [`<p className="text-sm"><strong>Action:</strong> Check Settings → Base Rate, or review approved pricing decisions.</p>`, `<p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('accAdrBannerAction') }} />`],
    // Override accordion (675-686)
    [`<Accordion title="When should GM Override the price?">`, `<Accordion title={t('accOverrideTitle')}>`],
    [`<p>The system auto-recommends prices, but GM can Override when:</p>`, `<p>{t('accOverrideDesc')}</p>`],
    [`<li><strong>Special events</strong> that the system doesn't know about (VIP group, event)</li>`, `<li dangerouslySetInnerHTML={{ __html: t.raw('accOverride1') }} />`],
    [`<li><strong>ADR {'>'} Anchor + 30%</strong> → market is paying higher, consider raising Anchor</li>`, `<li dangerouslySetInnerHTML={{ __html: t.raw('accOverride2') }} />`],
    [`<li><strong>ADR {'<'} Anchor − 30%</strong> → may be giving too many discounts</li>`, `<li dangerouslySetInnerHTML={{ __html: t.raw('accOverride3') }} />`],
    [`<li><strong>Competitor</strong> changed prices suddenly (no integrated rate shopper yet)</li>`, `<li dangerouslySetInnerHTML={{ __html: t.raw('accOverride4') }} />`],
    [`<Tip>Operational rule: GM reviews Anchor-based recommendation; ADR is only for confirming whether the market accepts that level (sanity check).</Tip>`, `<Tip>{t('accOverrideTip')}</Tip>`],
];

let count = 0;
for (const [from, to] of replacements) {
    if (code.includes(from)) {
        code = code.replace(from, to);
        count++;
    } else {
        console.log(`⚠️ NOT FOUND: ${from.substring(0, 60)}...`);
    }
}

fs.writeFileSync(fp, code, 'utf8');
console.log(`✅ AnalyticsSection: ${count}/${replacements.length} replacements done`);

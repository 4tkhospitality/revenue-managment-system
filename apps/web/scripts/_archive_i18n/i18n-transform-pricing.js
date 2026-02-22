// Transform PricingSection + DataSection
const fs = require('fs');
const fp = require('path').join(__dirname, '..', 'app', 'guide', 'page.tsx');
let code = fs.readFileSync(fp, 'utf8');

const replacements = [
    // Pricing Intro (792-814)
    [`<p className="text-gray-700">The system calculates 3 price types from <strong>1 single base price (NET)</strong>:</p>`, `<p className="text-gray-700" dangerouslySetInnerHTML={{ __html: t.raw('pricingIntroDesc') }} />`],
    [`<div className="text-xs text-emerald-600">You receive</div>`, `<div className="text-xs text-emerald-600">{t('pricingNetLabel')}</div>`],
    [`<div className="text-xs text-blue-600">Base price on OTA</div>`, `<div className="text-xs text-blue-600">{t('pricingBarLabel')}</div>`],
    [`<div className="text-xs text-purple-600">Guest sees (after 15% promo)</div>`, `<div className="text-xs text-purple-600">{t('pricingDisplayLabel')}</div>`],
    // Formula (816-830)
    [`<h4 className="font-medium text-blue-800 mb-2">Formula 1: NET → BAR (Forward)</h4>`, `<h4 className="font-medium text-blue-800 mb-2">{t('formula1Title')}</h4>`],
    [`<h4 className="font-medium text-purple-800 mb-2">Formula 2: BAR → Display (after Promos)</h4>`, `<h4 className="font-medium text-purple-800 mb-2">{t('formula2Title')}</h4>`],
    [`<Tip>System calculates automatically. You only need to enter NET — BAR and Display are calculated for you.</Tip>`, `<Tip>{t('formulaTip')}</Tip>`],
    // Channels (833-873)
    [`<p className="text-sm text-gray-600 mb-3">Each OTA calculates differently. Click each channel for details:</p>`, `<p className="text-sm text-gray-600 mb-3">{t('channelsDesc')}</p>`],
    [`<p>Agoda uses <strong>ADDITIVE</strong> stacking: promotions are added together.</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('chAgodaDesc') }} />`],
    [`<Warn><strong>Note:</strong> If stacking too many promotions, NET may drop below desired level!</Warn>`, `<Warn><span dangerouslySetInnerHTML={{ __html: t.raw('chAgodaWarn') }} /></Warn>`],
    [`<p>Booking uses <strong>PROGRESSIVE</strong> stacking: promotions are applied progressively (promo 2 applies on price after promo 1).</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('chBookingDesc') }} />`],
    [`<p>Expedia uses <strong>HIGHEST_WINS</strong>: only the highest % promotion applies.</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('chExpediaDesc') }} />`],
    [`<p>Traveloka uses <strong>SINGLE</strong> (similar to HIGHEST_WINS): only 1 promotion at a time.</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('chTravelokaDesc') }} />`],
    [`<p className="mt-2">Promotion priority order: Flash Sale → PayLater → Coupon.</p>`, `<p className="mt-2">{t('chTravelokaPriority')}</p>`],
    [`<p>CTRIP uses <strong>ONLY_WITH_GENIUS</strong>: add-on promos only apply when main promo is active.</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('chCtripDesc') }} />`],
    // Promos (876-896)
    [`<p className="text-sm text-gray-700 mt-2">Additive: 10% + 15% = <strong>25%</strong></p>`, `<p className="text-sm text-gray-700 mt-2" dangerouslySetInnerHTML={{ __html: t.raw('promoAdditive') }} />`],
    [`<p className="text-sm text-gray-700 mt-2">Progressive: promo 2 applies on price after promo 1</p>`, `<p className="text-sm text-gray-700 mt-2">{t('promoProgressive')}</p>`],
    [`<p className="text-sm text-gray-700 mt-2">Only the highest % promo applies</p>`, `<p className="text-sm text-gray-700 mt-2">{t('promoHighest')}</p>`],
    [`<p className="text-sm text-gray-700 mt-2">Only 1 promo / add-on depends on main promo</p>`, `<p className="text-sm text-gray-700 mt-2">{t('promoSingle')}</p>`],
    // Compare table headers (905-908)
    [`<th className="px-3 py-2 text-left text-gray-600">Channel</th>`, `<th className="px-3 py-2 text-left text-gray-600">{t('compareH1')}</th>`],
    [`<th className="px-3 py-2 text-center text-gray-600">Commission</th>`, `<th className="px-3 py-2 text-center text-gray-600">{t('compareH2')}</th>`],
    [`<Tip>Same NET price, each channel shows guests different prices due to different promo and commission calculations.</Tip>`, `<Tip>{t('compareTip')}</Tip>`],
    // Price Matrix (924-953)
    [`<p className="text-gray-700 mb-3">Price matrix shows prices for <strong>all room types × all OCC tiers</strong> at once.</p>`, `<p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('matrixDesc') }} />`],
    [`<th className="px-3 py-2 text-left text-gray-600">Element</th><th className="px-3 py-2 text-left text-gray-600">Meaning</th>`, `<th className="px-3 py-2 text-left text-gray-600">{t('matrixElement')}</th><th className="px-3 py-2 text-left text-gray-600">{t('matrixMeaning')}</th>`],
    [`<td className="px-3 py-2">Room type name (Deluxe, Superior, Suite...)</td>`, `<td className="px-3 py-2">{t('matrixRoomType')}</td>`],
    [`<td className="px-3 py-2">NET price by season (before OCC multiplier)</td>`, `<td className="px-3 py-2">{t('matrixBaseNet')}</td>`],
    [`<td className="px-3 py-2">Price after OCC multiplier (depends on mode: NET/BAR/Display)</td>`, `<td className="px-3 py-2">{t('matrixOccCols')}</td>`],
    [`<td className="px-3 py-2"><strong>Currently active tier</strong> based on actual OCC%</td>`, `<td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: t.raw('matrixHighlight') }} />`],
    [`<td className="px-3 py-2"><strong>Guardrail violation</strong> — price too high or too low</td>`, `<td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: t.raw('matrixGuardrail') }} />`],
    [`<p className="font-medium text-blue-700 mb-2">3 view modes:</p>`, `<p className="font-medium text-blue-700 mb-2">{t('matrixModes')}</p>`],
    [`<p className="text-xs text-gray-600 mt-1">Actual hotel revenue</p>`, `<p className="text-xs text-gray-600 mt-1">{t('matrixNetDesc')}</p>`],
    [`<p className="text-xs text-gray-600 mt-1">Base price before promos, after commission</p>`, `<p className="text-xs text-gray-600 mt-1">{t('matrixBarDesc')}</p>`],
    [`<p className="text-xs text-gray-600 mt-1">Price guests see on OTA</p>`, `<p className="text-xs text-gray-600 mt-1">{t('matrixDisplayDesc')}</p>`],
    // Reverse Calc (957-963)
    [`<p className="text-gray-700 mb-3">When you know the BAR price and want to know actual NET received:</p>`, `<p className="text-gray-700 mb-3">{t('reverseDesc')}</p>`],
    [`<Tip>The &quot;Reverse Calc&quot; tab on the Pricing page lets you enter BAR to calculate NET for each OTA channel.</Tip>`, `<Tip>{t('reverseTip')}</Tip>`],
    // Export (967-973)
    [`<p className="text-gray-700 mb-3">Click <strong>Export</strong> to download the price table as a CSV file.</p>`, `<p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('exportDesc') }} />`],
    [`<li>All room types</li>`, `<li>{t('exportItem1')}</li>`],
    [`<li>Base NET prices</li>`, `<li>{t('exportItem2')}</li>`],
    [`<li>NET, BAR, Display prices for each OCC tier</li>`, `<li>{t('exportItem3')}</li>`],
    [`<Tip>Open CSV file in Excel or Google Sheets &rarr; Print for Front Desk team or send to Sales Manager to update OTA prices.</Tip>`, `<Tip>{t('exportTip')}</Tip>`],
    // Data Section (989-1035)
    [`<p className="text-gray-700 mb-3">Upload data file from PMS (Property Management System) so the system has data to analyze.</p>`, `<p className="text-gray-700 mb-3">{t('importDesc')}</p>`],
    [`>Export booking data from PMS (Opera, RoomRaccoon, Cloudbeds...) in <strong>XML or CSV</strong> format.</p>`, ` dangerouslySetInnerHTML={{ __html: t.raw('importS1Desc') }} />`],
    [`<Tip>File must contain: guest name, booking date, stay date, room type, rate.</Tip>`, `<Tip>{t('importS1Tip')}</Tip>`],
    [`>Drag & drop file into upload area or click to select file.</p>`, `>{t('importS2Desc')}</p>`],
    [`>System shows number of data rows processed and warnings (if any).</p>`, `>{t('importS3Desc')}</p>`],
    [`<Warn><strong>Upload daily (morning)</strong> for the most accurate data. System auto-skips duplicate rows.</Warn>`, `<Warn><span dangerouslySetInnerHTML={{ __html: t.raw('importWarn') }} /></Warn>`],
    [`<p className="text-gray-700 mb-3">This step aggregates booking data into <strong>OTB (On The Books)</strong> — rooms booked per day.</p>`, `<p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('buildOtbDesc') }} />`],
    [`<p><strong>Input:</strong> Booking data (from Upload)</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('buildOtbInput') }} />`],
    [`<p><strong>Output:</strong> OTB table: rooms/revenue booked per stay_date</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('buildOtbOutput') }} />`],
    [`<p><strong>Duration:</strong> ~10–30 seconds</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('buildOtbDuration') }} />`],
    [`<DeepLink href="/data">Open Data page</DeepLink>`, `<DeepLink href="/data">{t('buildOtbLink')}</DeepLink>`],
    [`<p className="text-gray-700 mb-3">Calculate analytics metrics from OTB data:</p>`, `<p className="text-gray-700 mb-3">{t('buildFeatDesc')}</p>`],
    [`<li><strong>Pickup:</strong> New rooms booked (compared to 7 days ago)</li>`, `<li dangerouslySetInnerHTML={{ __html: t.raw('buildFeatPickup') }} />`],
    [`<li><strong>STLY:</strong> Rooms booked same time last year</li>`, `<li dangerouslySetInnerHTML={{ __html: t.raw('buildFeatStly') }} />`],
    [`<li><strong>Pace:</strong> Booking pace compared to last year</li>`, `<li dangerouslySetInnerHTML={{ __html: t.raw('buildFeatPace') }} />`],
    [`<li><strong>Remaining Supply:</strong> Rooms still available</li>`, `<li dangerouslySetInnerHTML={{ __html: t.raw('buildFeatRemaining') }} />`],
    [`<Warn>Need at least <strong>2 uploads 7 days apart</strong> for actual Pickup. Before that, the system will show &quot;N/A&quot;.</Warn>`, `<Warn><span dangerouslySetInnerHTML={{ __html: t.raw('buildFeatWarn') }} /></Warn>`],
    [`<p className="text-gray-700 mb-3">Forecast additional future bookings based on booking pace:</p>`, `<p className="text-gray-700 mb-3">{t('forecastDesc')}</p>`],
    [`<p><strong>With enough pickup data:</strong> Accurate forecast based on actual trends</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('forecastEnough') }} />`],
    [`<p><strong>Without enough pickup data:</strong> Shows &quot;Estimate&quot; using rough approximation (less accurate)</p>`, `<p dangerouslySetInnerHTML={{ __html: t.raw('forecastNotEnough') }} />`],
    [`<Tip>After completing all 4 steps, return to Dashboard to see latest KPIs and Price Recommendations.</Tip>`, `<Tip>{t('forecastTip')}</Tip>`],
    [`<DeepLink href="/dashboard">Open Dashboard</DeepLink>`, `<DeepLink href="/dashboard">{t('forecastDashLink')}</DeepLink>`],
];

let count = 0;
for (const [from, to] of replacements) {
    if (code.includes(from)) {
        code = code.replace(from, to);
        count++;
    } else {
        console.log(`⚠️ NOT FOUND: ${from.substring(0, 80)}...`);
    }
}
fs.writeFileSync(fp, code, 'utf8');
console.log(`✅ Pricing/Data: ${count}/${replacements.length} done`);

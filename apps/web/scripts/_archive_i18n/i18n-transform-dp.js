// Transform DP, Seasons, OCC, Terms sections
const fs = require('fs');
const fp = require('path').join(__dirname, '..', 'app', 'guide', 'page.tsx');
let code = fs.readFileSync(fp, 'utf8');

const replacements = [
    // DP (693-705)
    [`<p className="text-gray-700">Dynamic Pricing auto-adjusts prices based on <strong>3 factors</strong>:</p>`, `<p className="text-gray-700" dangerouslySetInnerHTML={{ __html: t.raw('dpDesc') }} />`],
    [`>Season</span>`, `>{t('dpSeason')}</span>`],
    [`>OCC% (Occupancy Tier)</span>`, `>{t('dpOccTier')}</span>`],
    [`>NET Price</span>`, `>{t('dpNetPrice')}</span>`],
    [`>Dynamic NET = Base NET (season) × Multiplier (OCC tier)</p>`, `>{t('dpFormula')}</p>`],
    [`>E.g.: Normal Season NET = 1,200,000 × 1.10 (OCC 50%) = <strong>1,320,000₫</strong></p>`, ` dangerouslySetInnerHTML={{ __html: t.raw('dpExample') }} />`],
    [`<DeepLink href="/pricing">Open Dynamic Pricing tab</DeepLink>`, `<DeepLink href="/pricing">{t('dpOpenLink')}</DeepLink>`],
    // Seasons (709-732)
    [`<p className="text-gray-700 mb-3">Season determines the <strong>base NET price</strong>. 3 season types:</p>`, `<p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('seasonsDesc') }} />`],
    [`<th className="px-3 py-2 text-left text-gray-600">Season</th>`, `<th className="px-3 py-2 text-left text-gray-600">{t('seasonH1')}</th>`],
    [`<th className="px-3 py-2 text-center text-gray-600">Price Level</th>`, `<th className="px-3 py-2 text-center text-gray-600">{t('seasonH2')}</th>`],
    [`<th className="px-3 py-2 text-left text-gray-600">Example</th>`, `<th className="px-3 py-2 text-left text-gray-600">{t('seasonH3')}</th>`],
    [`</span> Normal</td><td className="px-3 py-3 text-center">Base</td><td className="px-3 py-3">Regular days, low season</td>`, `</span> {t('seasonNormal')}</td><td className="px-3 py-3 text-center">{t('seasonNormalLvl')}</td><td className="px-3 py-3">{t('seasonNormalEx')}</td>`],
    [`</span> High</td><td className="px-3 py-3 text-center">High</td><td className="px-3 py-3">Weekends, summer, events</td>`, `</span> {t('seasonHigh')}</td><td className="px-3 py-3 text-center">{t('seasonHighLvl')}</td><td className="px-3 py-3">{t('seasonHighEx')}</td>`],
    [`</span> Holiday</td><td className="px-3 py-3 text-center">Highest</td><td className="px-3 py-3">Tet, Christmas, national holidays</td>`, `</span> {t('seasonHoliday')}</td><td className="px-3 py-3 text-center">{t('seasonHolidayLvl')}</td><td className="px-3 py-3">{t('seasonHolidayEx')}</td>`],
    [`<Step n={1} title="Click Config on the toolbar">`, `<Step n={1} title={t('seasonStep1')}>`],
    [`The &quot;Seasons&quot; panel will appear on the left.`, `{t('seasonStep1Desc')}`],
    [`<Step n={2} title="Create Season">`, `<Step n={2} title={t('seasonStep2')}>`],
    [`Click <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, or <strong>+ HOLIDAY</strong> to create a new season.`, `{t.raw('seasonStep2Desc')}`],
    [`<Step n={3} title="Add Date Range">`, `<Step n={3} title={t('seasonStep3')}>`],
    [`Open season &rarr; <strong>+ Add</strong> date range &rarr; select start and end dates.`, `{t.raw('seasonStep3Desc')}`],
    [`<Step n={4} title="Set NET Rates">`, `<Step n={4} title={t('seasonStep4')}>`],
    [`In each season, enter the desired NET price for each room type.`, `{t('seasonStep4Desc')}`],
    [`<Step n={5} title="Save">`, `<Step n={5} title={t('seasonStep5')}>`],
    [`Click <strong>Save</strong> to apply. The price table will update automatically.`, `{t.raw('seasonStep5Desc')}`],
    [`<Warn><strong>Priority rule (auto-detect):</strong> If a day belongs to multiple seasons, the system picks the <strong>highest priority</strong>: Holiday (P3) {'>'} High (P2) {'>'} Normal (P1).</Warn>`, `<Warn><span dangerouslySetInnerHTML={{ __html: t.raw('seasonPriority') }} /></Warn>`],
    // OCC Tiers (736-754)
    [`<p className="text-gray-700 mb-3"><strong>OCC Tier</strong> is a price tier based on occupancy. Each tier has a <strong>multiplier</strong>.</p>`, `<p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t.raw('occDesc') }} />`],
    [`<th className="px-3 py-2 text-left text-gray-600">Tier</th>`, `<th className="px-3 py-2 text-left text-gray-600">{t('occH1')}</th>`],
    [`<th className="px-3 py-2 text-left text-gray-600">Meaning</th>`, `<th className="px-3 py-2 text-left text-gray-600">{t('occH4')}</th>`],
    [`>Many rooms available → base price</td>`, `>{t('occT0')}</td>`],
    [`>Average → increase 10%</td>`, `>{t('occT1')}</td>`],
    [`>Nearly full → increase 20%</td>`, `>{t('occT2')}</td>`],
    [`>Almost sold out → increase 30%</td>`, `>{t('occT3')}</td>`],
    [`<Tip>OCC% is calculated automatically from OTB data: <strong>OCC = Rooms Booked / Total Hotel Rooms</strong>. If no data yet, you can enter manually.</Tip>`, `<Tip><span dangerouslySetInnerHTML={{ __html: t.raw('occTip') }} /></Tip>`],
    // Terms (759-767)
    [`{ term: 'OTB', desc: 'On The Books — Total rooms/revenue booked' }`, `{ term: 'OTB', desc: t('termsOtb') }`],
    [`{ term: 'ADR', desc: 'Average Daily Rate — Average room price per night' }`, `{ term: 'ADR', desc: t('termsAdr') }`],
    [`{ term: 'RevPAR', desc: 'Revenue Per Available Room' }`, `{ term: 'RevPAR', desc: t('termsRevpar') }`],
    [`{ term: 'OCC%', desc: 'Occupancy — Room fill rate (% rooms sold)' }`, `{ term: 'OCC%', desc: t('termsOcc') }`],
    [`{ term: 'Pickup', desc: 'New rooms booked since last capture' }`, `{ term: 'Pickup', desc: t('termsPickup') }`],
    [`{ term: 'STLY', desc: 'Same Time Last Year — Year-over-year comparison' }`, `{ term: 'STLY', desc: t('termsStly') }`],
    [`{ term: 'Pace', desc: 'Difference between current OTB vs STLY (ahead or behind)' }`, `{ term: 'Pace', desc: t('termsPace') }`],
    [`{ term: 'Lead Time', desc: 'Number of days between booking and stay date' }`, `{ term: 'Lead Time', desc: t('termsLeadTime') }`],
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
console.log(`✅ DP/Seasons/OCC/Terms: ${count}/${replacements.length} done`);

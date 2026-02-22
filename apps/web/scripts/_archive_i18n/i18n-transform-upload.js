// Transform upload/page.tsx to use t() calls from uploadPage namespace
const fs = require('fs');
const fp = require('path').join(__dirname, '..', 'app', 'upload', 'page.tsx');
let code = fs.readFileSync(fp, 'utf8');

// Add import
code = code.replace(
    "import { useTierAccess } from '@/hooks/useTierAccess';",
    "import { useTierAccess } from '@/hooks/useTierAccess';\nimport { useTranslations } from 'next-intl';"
);

// Add useTranslations hook (after useTierAccess line)
code = code.replace(
    "const { hasAccess, loading: tierLoading } = useTierAccess('DELUXE');",
    "const { hasAccess, loading: tierLoading } = useTierAccess('DELUXE');\n    const t = useTranslations('uploadPage');"
);

const replacements = [
    // Paywall (67-78)
    [`title="Upload Reservations"`, `title={t('title')}`],
    [`subtitle="Import room booking reports from PMS"`, `subtitle={t('paywallSubtitle')}`],
    [`label: 'Upload multiple CSV/XML files at once'`, `label: t('feat1')`],
    [`label: 'Import booking & cancellation reports'`, `label: t('feat2')`],
    [`label: 'Supported Crystal Reports XML'`, `label: t('feat3')`],
    [`label: 'Auto-process & validate data'`, `label: t('feat4')`],
    // Header (254-257)
    [`<h1 className="text-lg font-semibold">Upload Reservations</h1>`, `<h1 className="text-lg font-semibold">{t('title')}</h1>`],
    [`Import room booking reports from PMS — supports uploading <strong>multiple files at once</strong> (max 31 files)`, `<span dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />`],
    // Active Hotel Banner (266)
    [`Uploading data cho: <strong>{activeHotelName}</strong>`, `{t('uploadingFor')} <strong>{activeHotelName}</strong>`],
    // Demo Warning (276-279)
    [`<p className="text-amber-800 font-medium">Demo Hotel - View mode</p>`, `<p className="text-amber-800 font-medium">{t('demoTitle')}</p>`],
    [`You are using Demo Hotel. File upload is disabled.\n                                Please contact admin to be assigned a real hotel.`, `{t('demoDesc')}`],
    // Tabs (296, 307)
    [`Booking Reports`, `{t('tabBooked')}`],
    [`Cancellation Reports`, `{t('tabCancelled')}`],
    // Tab descriptions (319-320)
    [`? 'Upload "Reservation Booked On Date" reports from PMS. Select multiple files (Ctrl+Click or drag & drop).'`, `? t('tabBookedDesc')`],
    [`: 'Upload "Reservation Cancelled" reports from PMS. Select multiple files.'}`, `: t('tabCancelledDesc')}`],
    // Demo drag (353-354)
    [`<p className="text-gray-500 text-lg mb-2">Upload disabled for Demo Hotel</p>`, `<p className="text-gray-500 text-lg mb-2">{t('demoDragTitle')}</p>`],
    [`<p className="text-gray-400 text-sm">Contact admin to be assigned a hotel</p>`, `<p className="text-gray-400 text-sm">{t('demoDragSub')}</p>`],
    // Upload drag area (362-365)
    [`Drag & drop CSV, XML, or Excel files here`, `{t('dragTitle')}`],
    [`Supports selecting <strong>multiple files</strong> at once (max 31 files/batch)`, `<span dangerouslySetInnerHTML={{ __html: t.raw('dragSub') }} />`],
    // Select button (374)
    [`Select files (multi-select available)`, `{t('selectBtn')}`],
    // Download links (383-388)
    [`Download sample Excel file {activeTab === 'booked' ? '(Bookings)' : '(Cancellations)'}`, `{activeTab === 'booked' ? t('downloadBooking') : t('downloadCancel')}`],
    [`{activeTab === 'booked'\n                                        ? 'Sample has 7 columns: Code, Booking Date, Check-in, Check-out, Room, Revenue, Status'\n                                        : 'Sample has 8 columns: includes Cancel Date column (required)'}`, `{activeTab === 'booked' ? t('sampleBooked') : t('sampleCancel')}`],
    // Queue header (403-405)
    [`? \`Processing... (\${successCount + errorCount}/\${fileResults.length})\`\n                                        : \`Completed \${successCount}/\${fileResults.length} file\`}`, `? t('processing', { done: successCount + errorCount, total: fileResults.length })\n                                        : t('completed', { done: successCount, total: fileResults.length })}`],
    // Queue stats (411, 415, 419)
    [`✓ {successCount} successful`, `{t('successful', { n: successCount })}`],
    [`✗ {errorCount} errors`, `{t('errors', { n: errorCount })}`],
    [`Total: {totalRecords} records`, `{t('totalRecords', { n: totalRecords })}`],
    // Status labels (464, 467)
    [`<span className="text-gray-400">Wait...</span>`, `<span className="text-gray-400">{t('wait')}</span>`],
    [`<span className="text-blue-500">Processing...</span>`, `<span className="text-blue-500">{t('processingFile')}</span>`],
    // Done buttons (492, 498)
    [`Upload more files`, `{t('uploadMore')}`],
    [`View data →`, `{t('viewData')}`],
    // Format guide (512, 515, 529, 532)
    [`<h2 className="text-base font-semibold text-gray-900">XML Format (Crystal Reports)</h2>`, `<h2 className="text-base font-semibold text-gray-900">{t('xmlTitle')}</h2>`],
    [`Export from PMS in Crystal Reports XML format.`, `{t('xmlDesc')}`],
    [`<h2 className="text-base font-semibold text-gray-900">CSV Format</h2>`, `<h2 className="text-base font-semibold text-gray-900">{t('csvTitle')}</h2>`],
    [`CSV file with columns:`, `{t('csvDesc')}`],
    // Tip (546)
    [`<strong><Lightbulb className="w-4 h-4 inline mr-0.5" />Tip:</strong> Use Ctrl+A (select all) or Ctrl+Click to select multiple files at once.\n                                System will automatically import each file in order.`, `<span dangerouslySetInnerHTML={{ __html: t.raw('tip') }} />`],
    // Error messages (93, 114, 133, 136)
    [`return { success: false, message: 'Only CSV, XML, or Excel (.xlsx) files supported' };`, `return { success: false, message: t('unsupported') };`],
    [`return { success: false, message: result.error || 'Import failed' };`, `return { success: false, message: result.error || t('importFailed') };`],
    [`return { success: false, message: result.message || 'Import failed' };`, `return { success: false, message: result.message || t('importFailed') };`],
    [`setFileResults([{ fileName: 'ERROR', status: 'error', message: 'Hotel ID not found' }]);`, `setFileResults([{ fileName: 'ERROR', status: 'error', message: t('hotelNotFound') }]);`],
    // Reservation/cancellation count messages (112, 131)
    [`return { success: true, message: \`\${result.recordCount} cancellations\`, count: result.recordCount };`, `return { success: true, message: t('cancellations', { n: result.recordCount }), count: result.recordCount };`],
    [`return { success: true, message: \`\${result.count} reservations\`, count: result.count };`, `return { success: true, message: t('reservations', { n: result.count }), count: result.count };`],
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
console.log(`✅ Upload: ${count}/${replacements.length} done`);

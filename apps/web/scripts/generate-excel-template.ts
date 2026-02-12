/**
 * Script to generate sample Excel templates for reservation uploads.
 * Creates 2 separate files: booked + cancelled.
 * Run with: npx tsx scripts/generate-excel-template.ts
 * Uses ExcelJS (secure, MIT-licensed) instead of SheetJS/xlsx.
 */
import ExcelJS from 'exceljs';
import * as path from 'path';

const publicDir = path.join(__dirname, '..', 'public');

// Helper to add a data sheet with column widths
function addDataSheet(workbook: ExcelJS.Workbook, name: string, headers: string[], rows: (string | number)[][], widths: number[]) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(headers);
    for (const row of rows) {
        sheet.addRow(row);
    }
    widths.forEach((w, i) => {
        sheet.getColumn(i + 1).width = w;
    });

    // Bold header row
    const headerRowObj = sheet.getRow(1);
    headerRowObj.font = { bold: true };

    return sheet;
}

// ═══════════════════════════════════════════════════════════════
// Template 1: Đặt phòng (Booked)
// ═══════════════════════════════════════════════════════════════
async function generateBookedTemplate() {
    const workbook = new ExcelJS.Workbook();

    const headers = ['Mã đặt phòng', 'Ngày đặt', 'Ngày nhận phòng', 'Ngày trả phòng', 'Số phòng', 'Doanh thu', 'Trạng thái'];
    const rows = [
        ['RES-001', '2025-01-15', '2025-02-10', '2025-02-12', 1, 2000000, 'booked'],
        ['RES-002', '2025-01-16', '2025-02-10', '2025-02-11', 2, 1500000, 'booked'],
        ['RES-003', '2025-01-17', '2025-02-11', '2025-02-14', 1, 4500000, 'booked'],
        ['RES-004', '2025-01-18', '2025-02-12', '2025-02-15', 1, 3000000, 'booked'],
        ['RES-005', '2025-01-19', '2025-02-13', '2025-02-16', 2, 6000000, 'booked'],
    ];
    addDataSheet(workbook, 'Đặt phòng', headers, rows, [15, 12, 16, 16, 10, 12, 12]);

    const guideHeaders = ['Cột', 'Tiếng Anh', 'Bắt buộc', 'Mô tả', 'Ví dụ'];
    const guideRows = [
        ['Mã đặt phòng', 'reservation_id', 'Có', 'Mã đặt phòng duy nhất từ PMS', 'RES-001'],
        ['Ngày đặt', 'booking_date', 'Có', 'Ngày khách đặt phòng (YYYY-MM-DD)', '2025-01-15'],
        ['Ngày nhận phòng', 'arrival_date', 'Có', 'Ngày khách check-in (YYYY-MM-DD)', '2025-02-10'],
        ['Ngày trả phòng', 'departure_date', 'Có', 'Ngày khách check-out (YYYY-MM-DD)', '2025-02-12'],
        ['Số phòng', 'rooms', 'Có', 'Số lượng phòng đặt', '1'],
        ['Doanh thu', 'revenue', 'Có', 'Tổng doanh thu (VND, không dấu chấm)', '2000000'],
        ['Trạng thái', 'status', 'Có', 'Luôn điền "booked"', 'booked'],
    ];
    addDataSheet(workbook, 'Hướng dẫn', guideHeaders, guideRows, [18, 16, 10, 45, 15]);

    const outputPath = path.join(publicDir, 'template-booked.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log(`✅ Booked template: ${outputPath}`);
}

// ═══════════════════════════════════════════════════════════════
// Template 2: Huỷ phòng (Cancelled)
// ═══════════════════════════════════════════════════════════════
async function generateCancelledTemplate() {
    const workbook = new ExcelJS.Workbook();

    const headers = ['Mã đặt phòng', 'Ngày đặt', 'Ngày nhận phòng', 'Ngày trả phòng', 'Số phòng', 'Doanh thu', 'Trạng thái', 'Ngày huỷ'];
    const rows = [
        ['RES-011', '2025-01-25', '2025-02-19', '2025-02-22', 1, 2800000, 'cancelled', '2025-01-28'],
        ['RES-014', '2025-01-28', '2025-02-22', '2025-02-25', 1, 3800000, 'cancelled', '2025-02-01'],
        ['RES-023', '2025-02-05', '2025-03-01', '2025-03-04', 2, 5400000, 'cancelled', '2025-02-10'],
    ];
    addDataSheet(workbook, 'Huỷ phòng', headers, rows, [15, 12, 16, 16, 10, 12, 12, 12]);

    const guideHeaders = ['Cột', 'Tiếng Anh', 'Bắt buộc', 'Mô tả', 'Ví dụ'];
    const guideRows = [
        ['Mã đặt phòng', 'reservation_id', 'Có', 'Mã đặt phòng đã huỷ (phải khớp với mã đã đặt trước đó)', 'RES-011'],
        ['Ngày đặt', 'booking_date', 'Có', 'Ngày đặt phòng ban đầu (YYYY-MM-DD)', '2025-01-25'],
        ['Ngày nhận phòng', 'arrival_date', 'Có', 'Ngày check-in dự kiến (YYYY-MM-DD)', '2025-02-19'],
        ['Ngày trả phòng', 'departure_date', 'Có', 'Ngày check-out dự kiến (YYYY-MM-DD)', '2025-02-22'],
        ['Số phòng', 'rooms', 'Có', 'Số phòng đã huỷ', '1'],
        ['Doanh thu', 'revenue', 'Có', 'Doanh thu của booking đã huỷ (VND)', '2800000'],
        ['Trạng thái', 'status', 'Có', 'Luôn điền "cancelled"', 'cancelled'],
        ['Ngày huỷ', 'cancel_date', 'Có', 'Ngày khách huỷ phòng (BẮT BUỘC cho huỷ phòng)', '2025-01-28'],
    ];
    addDataSheet(workbook, 'Hướng dẫn', guideHeaders, guideRows, [18, 16, 10, 50, 15]);

    const outputPath = path.join(publicDir, 'template-cancelled.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log(`✅ Cancelled template: ${outputPath}`);
}

// Generate both templates
async function main() {
    await generateBookedTemplate();
    await generateCancelledTemplate();
    console.log('\n🎉 Done! 2 templates generated.');
}

main().catch(console.error);

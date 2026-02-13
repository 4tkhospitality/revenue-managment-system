/**
 * Script to generate sample Excel templates for reservation uploads.
 * Creates 2 separate files: booked + cancelled.
 * Run with: npx tsx scripts/generate-excel-template.ts
 * Uses ExcelJS (secure, MIT-licensed) instead of SheetJS/xlsx.
 *
 * V2 — Updated for GM Reporting dimensions (room_type, company_name, etc.)
 */
import ExcelJS from 'exceljs';
import * as path from 'path';

const publicDir = path.join(__dirname, '..', 'public');

// Helper to add a data sheet with column widths + styling
function addDataSheet(
    workbook: ExcelJS.Workbook,
    name: string,
    headers: string[],
    rows: (string | number | null)[][],
    widths: number[]
) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(headers);
    for (const row of rows) {
        sheet.addRow(row);
    }
    widths.forEach((w, i) => {
        sheet.getColumn(i + 1).width = w;
    });

    // Bold header row with light blue background
    const headerRowObj = sheet.getRow(1);
    headerRowObj.font = { bold: true };
    headerRowObj.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2EFFF' },
        };
        cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } },
        };
    });

    return sheet;
}

// ═══════════════════════════════════════════════════════════════
// Template 1: Đặt phòng (Booked)
// ═══════════════════════════════════════════════════════════════
async function generateBookedTemplate() {
    const workbook = new ExcelJS.Workbook();

    const headers = [
        'Mã đặt phòng',        // reservation_id
        'Ngày đặt',            // booking_date
        'Ngày nhận phòng',     // arrival_date
        'Ngày trả phòng',      // departure_date
        'Số phòng',            // rooms
        'Doanh thu',           // revenue
        'Trạng thái',          // status
        'Loại phòng',          // room_type (RoomTypeCode)
        'Nguồn đặt',          // company_name (ClientName — OTA/Agent)
        'Tên khách/Nhóm',     // guest_name (GroupName)
        'Nhân viên bán',       // salesperson (SlsName)
        'Giá net/đêm',        // rate_per_room_night (GNetRate)
        'Số khách',            // pax (NumPax)
        'Tổng đêm phòng',     // room_nights (Rnight = rooms × nights)
        'Số đêm',             // nights (@night)
        'Nhân viên tạo',       // create_clerk (createclerk)
    ];
    const rows: (string | number | null)[][] = [
        ['RES-001', '2025-01-15', '2025-02-10', '2025-02-12', 1, 2000000, 'booked', 'SBD', 'Booking.com', 'Nguyen Van A', 'Tran B', 1000000, 2, 2, 2, 'ADMIN'],
        ['RES-002', '2025-01-16', '2025-02-10', '2025-02-11', 2, 1500000, 'booked', 'STW', 'Agoda', 'Le Van C', null, 750000, 3, 2, 1, 'FD01'],
        ['RES-003', '2025-01-17', '2025-02-11', '2025-02-14', 1, 4500000, 'booked', 'SGD', null, 'Pham D Group', 'Hoang E', 1500000, 2, 3, 3, 'ADMIN'],
        ['RES-004', '2025-01-18', '2025-02-12', '2025-02-15', 1, 3000000, 'booked', 'STRP', 'Traveloka', 'Do Van F', null, 1000000, 2, 3, 3, 'FD02'],
        ['RES-005', '2025-01-19', '2025-02-13', '2025-02-16', 2, 6000000, 'booked', 'SBD', null, 'Walk-in Guest', null, 1000000, 4, 6, 3, 'FD01'],
    ];
    addDataSheet(workbook, 'Đặt phòng', headers, rows, [
        15, 12, 16, 16, 10, 14, 12, 12, 16, 18, 14, 14, 10, 14, 10, 14
    ]);

    const guideHeaders = ['Cột', 'Tiếng Anh (mapping)', 'Bắt buộc', 'Mô tả', 'Ví dụ'];
    const guideRows: (string | number)[][] = [
        ['Mã đặt phòng', 'reservation_id', 'Có', 'Mã đặt phòng duy nhất từ PMS (ConfirmNum)', 'RES-001'],
        ['Ngày đặt', 'booking_date', 'Có', 'Ngày khách đặt phòng (YYYY-MM-DD)', '2025-01-15'],
        ['Ngày nhận phòng', 'arrival_date', 'Có', 'Ngày khách check-in (YYYY-MM-DD)', '2025-02-10'],
        ['Ngày trả phòng', 'departure_date', 'Có', 'Ngày khách check-out (YYYY-MM-DD)', '2025-02-12'],
        ['Số phòng', 'rooms', 'Có', 'Số lượng phòng đặt (NumRoom)', '1'],
        ['Doanh thu', 'revenue', 'Có', 'Tổng doanh thu (VND, không dấu chấm)', '2000000'],
        ['Trạng thái', 'status', 'Có', 'Luôn điền "booked"', 'booked'],
        ['Loại phòng', 'room_type', 'Không', 'Mã loại phòng: SBD, STW, SGD, STRP... (RoomTypeCode)', 'SBD'],
        ['Nguồn đặt', 'company_name', 'Không', 'Tên OTA/Agent/Công ty (ClientName). VD: Booking.com, Agoda, Vietravel', 'Booking.com'],
        ['Tên khách/Nhóm', 'guest_name', 'Không', 'Tên khách hoặc tên nhóm (GroupName)', 'Nguyen Van A'],
        ['Nhân viên bán', 'salesperson', 'Không', 'Tên nhân viên bán hàng (SlsName từ XML Group Header)', 'Tran B'],
        ['Giá net/đêm', 'rate_per_room_night', 'Không', 'Giá net mỗi phòng mỗi đêm (GNetRate, VND)', '1000000'],
        ['Số khách', 'pax', 'Không', 'Số lượng khách (NumPax)', '2'],
        ['Tổng đêm phòng', 'room_nights', 'Không', 'Tổng đêm phòng = Số phòng × Số đêm (Rnight)', '2'],
        ['Số đêm', 'nights', 'Không', 'Số đêm lưu trú (@night hoặc departure - arrival)', '2'],
        ['Nhân viên tạo', 'create_clerk', 'Không', 'Tên nhân viên tạo booking (createclerk)', 'ADMIN'],
    ];
    addDataSheet(workbook, 'Hướng dẫn', guideHeaders, guideRows, [18, 22, 10, 55, 15]);

    // Add a "Lưu ý" sheet with important notes
    const noteSheet = workbook.addWorksheet('Lưu ý quan trọng');
    const notes = [
        ['📌 Lưu ý quan trọng khi Upload dữ liệu đặt phòng'],
        [''],
        ['1. Cột BẮT BUỘC: Mã đặt phòng, Ngày đặt, Ngày nhận phòng, Ngày trả phòng, Số phòng, Doanh thu, Trạng thái'],
        ['2. Cột TÙY CHỌN: Loại phòng, Nguồn đặt, Tên khách/Nhóm, Nhân viên bán, Giá net/đêm, Số khách, Tổng đêm phòng, Số đêm, Nhân viên tạo'],
        ['3. Các cột tùy chọn giúp hệ thống phân tích GM Reporting chi tiết hơn (source, room type, ADR, LOS...)'],
        [''],
        ['📊 Segment tự động:'],
        ['   - Hệ thống tự phân loại "Nguồn đặt" thành: OTA / AGENT / DIRECT / UNKNOWN'],
        ['   - VD: "Booking.com" → OTA, "Vietravel" → AGENT, để trống → DIRECT'],
        [''],
        ['🔑 Quy tắc quan trọng:'],
        ['   - Mỗi dòng = 1 loại phòng trong booking (nếu booking có 2 loại phòng → 2 dòng cùng Mã đặt phòng)'],
        ['   - Doanh thu là tổng doanh thu cho loại phòng đó trong booking (không phải giá/đêm)'],
        ['   - Ngày format: YYYY-MM-DD (VD: 2025-02-10)'],
        ['   - Doanh thu: số nguyên (VD: 2000000), không viết 2.000.000'],
    ];
    for (const row of notes) {
        noteSheet.addRow(row);
    }
    noteSheet.getColumn(1).width = 90;
    noteSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF1D4ED8' } };

    const outputPath = path.join(publicDir, 'template-booked.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log(`✅ Booked template: ${outputPath}`);
}

// ═══════════════════════════════════════════════════════════════
// Template 2: Huỷ phòng (Cancelled)
// ═══════════════════════════════════════════════════════════════
async function generateCancelledTemplate() {
    const workbook = new ExcelJS.Workbook();

    const headers = [
        'Mã đặt phòng',        // reservation_id
        'Ngày đặt',            // booking_date
        'Ngày nhận phòng',     // arrival_date
        'Ngày trả phòng',      // departure_date
        'Số phòng',            // rooms
        'Doanh thu',           // revenue
        'Trạng thái',          // status
        'Ngày huỷ',            // cancel_date
        'Loại phòng',          // room_type
        'Nguồn đặt',          // company_name
    ];
    const rows: (string | number | null)[][] = [
        ['RES-011', '2025-01-25', '2025-02-19', '2025-02-22', 1, 2800000, 'cancelled', '2025-01-28', 'SBD', 'Booking.com'],
        ['RES-014', '2025-01-28', '2025-02-22', '2025-02-25', 1, 3800000, 'cancelled', '2025-02-01', 'STW', 'Agoda'],
        ['RES-023', '2025-02-05', '2025-03-01', '2025-03-04', 2, 5400000, 'cancelled', '2025-02-10', 'SGD', null],
    ];
    addDataSheet(workbook, 'Huỷ phòng', headers, rows, [
        15, 12, 16, 16, 10, 14, 12, 12, 12, 16
    ]);

    const guideHeaders = ['Cột', 'Tiếng Anh (mapping)', 'Bắt buộc', 'Mô tả', 'Ví dụ'];
    const guideRows: (string | number)[][] = [
        ['Mã đặt phòng', 'reservation_id', 'Có', 'Mã đặt phòng đã huỷ (phải khớp với mã đã đặt trước đó)', 'RES-011'],
        ['Ngày đặt', 'booking_date', 'Có', 'Ngày đặt phòng ban đầu (YYYY-MM-DD)', '2025-01-25'],
        ['Ngày nhận phòng', 'arrival_date', 'Có', 'Ngày check-in dự kiến (YYYY-MM-DD)', '2025-02-19'],
        ['Ngày trả phòng', 'departure_date', 'Có', 'Ngày check-out dự kiến (YYYY-MM-DD)', '2025-02-22'],
        ['Số phòng', 'rooms', 'Có', 'Số phòng đã huỷ', '1'],
        ['Doanh thu', 'revenue', 'Có', 'Doanh thu của booking đã huỷ (VND)', '2800000'],
        ['Trạng thái', 'status', 'Có', 'Luôn điền "cancelled"', 'cancelled'],
        ['Ngày huỷ', 'cancel_date', 'Có', 'Ngày khách huỷ phòng (BẮT BUỘC cho huỷ phòng)', '2025-01-28'],
        ['Loại phòng', 'room_type', 'Không', 'Mã loại phòng (để match chính xác khi huỷ 1 phần booking)', 'SBD'],
        ['Nguồn đặt', 'company_name', 'Không', 'Tên OTA/Agent gốc', 'Booking.com'],
    ];
    addDataSheet(workbook, 'Hướng dẫn', guideHeaders, guideRows, [18, 22, 10, 55, 15]);

    // Add notes sheet
    const noteSheet = workbook.addWorksheet('Lưu ý quan trọng');
    const notes = [
        ['📌 Lưu ý quan trọng khi Upload dữ liệu huỷ phòng'],
        [''],
        ['1. Cột BẮT BUỘC: Mã đặt phòng, Ngày đặt, Ngày nhận phòng, Ngày trả phòng, Số phòng, Doanh thu, Trạng thái, Ngày huỷ'],
        ['2. Cột TÙY CHỌN: Loại phòng, Nguồn đặt'],
        [''],
        ['🔄 Cancellation Cascade:'],
        ['   - Nếu KHÔNG có "Loại phòng" → Hệ thống sẽ huỷ TẤT CẢ loại phòng trong booking đó (full cancel)'],
        ['   - Nếu CÓ "Loại phòng" → Chỉ huỷ loại phòng được chỉ định (partial cancel)'],
        [''],
        ['🔑 Quy tắc quan trọng:'],
        ['   - "Mã đặt phòng" phải KHỚP CHÍNH XÁC với booking đã upload trước đó'],
        ['   - "Trạng thái" luôn là "cancelled"'],
        ['   - "Ngày huỷ" là BẮT BUỘC — thiếu cột này sẽ không xử lý được'],
        ['   - Ngày format: YYYY-MM-DD'],
    ];
    for (const row of notes) {
        noteSheet.addRow(row);
    }
    noteSheet.getColumn(1).width = 90;
    noteSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFDC2626' } };

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

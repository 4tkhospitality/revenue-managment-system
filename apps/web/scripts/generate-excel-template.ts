/**
 * Script to generate sample Excel templates for reservation uploads.
 * Creates 2 separate files: booked + cancelled.
 * Run with: npx tsx scripts/generate-excel-template.ts
 */
import * as XLSX from 'xlsx';
import * as path from 'path';

const publicDir = path.join(__dirname, '..', 'public');

// ═══════════════════════════════════════════════════════════════
// Template 1: Đặt phòng (Booked)
// ═══════════════════════════════════════════════════════════════
function generateBookedTemplate() {
    const reservations = [
        { 'Mã đặt phòng': 'RES-001', 'Ngày đặt': '2025-01-15', 'Ngày nhận phòng': '2025-02-10', 'Ngày trả phòng': '2025-02-12', 'Số phòng': 1, 'Doanh thu': 2000000, 'Trạng thái': 'booked' },
        { 'Mã đặt phòng': 'RES-002', 'Ngày đặt': '2025-01-16', 'Ngày nhận phòng': '2025-02-10', 'Ngày trả phòng': '2025-02-11', 'Số phòng': 2, 'Doanh thu': 1500000, 'Trạng thái': 'booked' },
        { 'Mã đặt phòng': 'RES-003', 'Ngày đặt': '2025-01-17', 'Ngày nhận phòng': '2025-02-11', 'Ngày trả phòng': '2025-02-14', 'Số phòng': 1, 'Doanh thu': 4500000, 'Trạng thái': 'booked' },
        { 'Mã đặt phòng': 'RES-004', 'Ngày đặt': '2025-01-18', 'Ngày nhận phòng': '2025-02-12', 'Ngày trả phòng': '2025-02-15', 'Số phòng': 1, 'Doanh thu': 3000000, 'Trạng thái': 'booked' },
        { 'Mã đặt phòng': 'RES-005', 'Ngày đặt': '2025-01-19', 'Ngày nhận phòng': '2025-02-13', 'Ngày trả phòng': '2025-02-16', 'Số phòng': 2, 'Doanh thu': 6000000, 'Trạng thái': 'booked' },
    ];

    const guide = [
        { 'Cột': 'Mã đặt phòng', 'Tiếng Anh': 'reservation_id', 'Bắt buộc': 'Có', 'Mô tả': 'Mã đặt phòng duy nhất từ PMS', 'Ví dụ': 'RES-001' },
        { 'Cột': 'Ngày đặt', 'Tiếng Anh': 'booking_date', 'Bắt buộc': 'Có', 'Mô tả': 'Ngày khách đặt phòng (YYYY-MM-DD)', 'Ví dụ': '2025-01-15' },
        { 'Cột': 'Ngày nhận phòng', 'Tiếng Anh': 'arrival_date', 'Bắt buộc': 'Có', 'Mô tả': 'Ngày khách check-in (YYYY-MM-DD)', 'Ví dụ': '2025-02-10' },
        { 'Cột': 'Ngày trả phòng', 'Tiếng Anh': 'departure_date', 'Bắt buộc': 'Có', 'Mô tả': 'Ngày khách check-out (YYYY-MM-DD)', 'Ví dụ': '2025-02-12' },
        { 'Cột': 'Số phòng', 'Tiếng Anh': 'rooms', 'Bắt buộc': 'Có', 'Mô tả': 'Số lượng phòng đặt', 'Ví dụ': '1' },
        { 'Cột': 'Doanh thu', 'Tiếng Anh': 'revenue', 'Bắt buộc': 'Có', 'Mô tả': 'Tổng doanh thu (VND, không dấu chấm)', 'Ví dụ': '2000000' },
        { 'Cột': 'Trạng thái', 'Tiếng Anh': 'status', 'Bắt buộc': 'Có', 'Mô tả': 'Luôn điền "booked"', 'Ví dụ': 'booked' },
    ];

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(reservations);
    ws1['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
        { wch: 10 }, { wch: 12 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Đặt phòng');

    const ws2 = XLSX.utils.json_to_sheet(guide);
    ws2['!cols'] = [
        { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 45 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Hướng dẫn');

    const outputPath = path.join(publicDir, 'template-booked.xlsx');
    XLSX.writeFile(wb, outputPath);
    console.log(`✅ Booked template: ${outputPath}`);
}

// ═══════════════════════════════════════════════════════════════
// Template 2: Huỷ phòng (Cancelled)
// ═══════════════════════════════════════════════════════════════
function generateCancelledTemplate() {
    const cancellations = [
        { 'Mã đặt phòng': 'RES-011', 'Ngày đặt': '2025-01-25', 'Ngày nhận phòng': '2025-02-19', 'Ngày trả phòng': '2025-02-22', 'Số phòng': 1, 'Doanh thu': 2800000, 'Trạng thái': 'cancelled', 'Ngày huỷ': '2025-01-28' },
        { 'Mã đặt phòng': 'RES-014', 'Ngày đặt': '2025-01-28', 'Ngày nhận phòng': '2025-02-22', 'Ngày trả phòng': '2025-02-25', 'Số phòng': 1, 'Doanh thu': 3800000, 'Trạng thái': 'cancelled', 'Ngày huỷ': '2025-02-01' },
        { 'Mã đặt phòng': 'RES-023', 'Ngày đặt': '2025-02-05', 'Ngày nhận phòng': '2025-03-01', 'Ngày trả phòng': '2025-03-04', 'Số phòng': 2, 'Doanh thu': 5400000, 'Trạng thái': 'cancelled', 'Ngày huỷ': '2025-02-10' },
    ];

    const guide = [
        { 'Cột': 'Mã đặt phòng', 'Tiếng Anh': 'reservation_id', 'Bắt buộc': 'Có', 'Mô tả': 'Mã đặt phòng đã huỷ (phải khớp với mã đã đặt trước đó)', 'Ví dụ': 'RES-011' },
        { 'Cột': 'Ngày đặt', 'Tiếng Anh': 'booking_date', 'Bắt buộc': 'Có', 'Mô tả': 'Ngày đặt phòng ban đầu (YYYY-MM-DD)', 'Ví dụ': '2025-01-25' },
        { 'Cột': 'Ngày nhận phòng', 'Tiếng Anh': 'arrival_date', 'Bắt buộc': 'Có', 'Mô tả': 'Ngày check-in dự kiến (YYYY-MM-DD)', 'Ví dụ': '2025-02-19' },
        { 'Cột': 'Ngày trả phòng', 'Tiếng Anh': 'departure_date', 'Bắt buộc': 'Có', 'Mô tả': 'Ngày check-out dự kiến (YYYY-MM-DD)', 'Ví dụ': '2025-02-22' },
        { 'Cột': 'Số phòng', 'Tiếng Anh': 'rooms', 'Bắt buộc': 'Có', 'Mô tả': 'Số phòng đã huỷ', 'Ví dụ': '1' },
        { 'Cột': 'Doanh thu', 'Tiếng Anh': 'revenue', 'Bắt buộc': 'Có', 'Mô tả': 'Doanh thu của booking đã huỷ (VND)', 'Ví dụ': '2800000' },
        { 'Cột': 'Trạng thái', 'Tiếng Anh': 'status', 'Bắt buộc': 'Có', 'Mô tả': 'Luôn điền "cancelled"', 'Ví dụ': 'cancelled' },
        { 'Cột': 'Ngày huỷ', 'Tiếng Anh': 'cancel_date', 'Bắt buộc': 'Có', 'Mô tả': 'Ngày khách huỷ phòng (BẮT BUỘC cho huỷ phòng)', 'Ví dụ': '2025-01-28' },
    ];

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(cancellations);
    ws1['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
        { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Huỷ phòng');

    const ws2 = XLSX.utils.json_to_sheet(guide);
    ws2['!cols'] = [
        { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 50 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Hướng dẫn');

    const outputPath = path.join(publicDir, 'template-cancelled.xlsx');
    XLSX.writeFile(wb, outputPath);
    console.log(`✅ Cancelled template: ${outputPath}`);
}

// Generate both templates
generateBookedTemplate();
generateCancelledTemplate();
console.log('\n🎉 Done! 2 templates generated.');

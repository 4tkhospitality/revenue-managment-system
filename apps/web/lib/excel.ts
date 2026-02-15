/**
 * Excel (.xlsx) file parser for reservation uploads.
 * Converts Excel rows to the same format as CSV parser output.
 * Uses ExcelJS (secure, MIT-licensed) instead of SheetJS/xlsx.
 */
import ExcelJS from 'exceljs';

export interface ExcelRow {
    reservation_id: string;
    booking_date: string;
    arrival_date: string;
    departure_date: string;
    rooms: string;
    revenue: string;
    status: string;
    cancel_date?: string;
    // GM Reporting dimensions (optional)
    room_type?: string;
    company_name?: string;
    guest_name?: string;
    salesperson?: string;
    rate_per_room_night?: string;
    pax?: string;
    room_nights?: string;
    nights?: string;
    create_clerk?: string;
}

// Map Vietnamese headers → English field names
const HEADER_MAP: Record<string, string> = {
    // ─── Core fields (Vietnamese with/without diacritics) ─────
    'mã đặt phòng': 'reservation_id',
    'ma dat phong': 'reservation_id',
    'ngày đặt': 'booking_date',
    'ngay dat': 'booking_date',
    'ngày nhận phòng': 'arrival_date',
    'ngay nhan phong': 'arrival_date',
    'ngày trả phòng': 'departure_date',
    'ngay tra phong': 'departure_date',
    'số phòng': 'rooms',
    'so phong': 'rooms',
    'doanh thu': 'revenue',
    'trạng thái': 'status',
    'trang thai': 'status',
    'ngày huỷ': 'cancel_date',
    'ngay huy': 'cancel_date',
    'ngày hủy': 'cancel_date',
    'ngay hủy': 'cancel_date',
    // ─── GM Reporting dimensions (Vietnamese) ─────────────────
    'loại phòng': 'room_type',
    'loai phong': 'room_type',
    'nguồn đặt': 'company_name',
    'nguon dat': 'company_name',
    'tên khách/nhóm': 'guest_name',
    'ten khach/nhom': 'guest_name',
    'tên khách': 'guest_name',
    'ten khach': 'guest_name',
    'nhân viên bán': 'salesperson',
    'nhan vien ban': 'salesperson',
    'giá net/đêm': 'rate_per_room_night',
    'gia net/dem': 'rate_per_room_night',
    'số khách': 'pax',
    'so khach': 'pax',
    'tổng đêm phòng': 'room_nights',
    'tong dem phong': 'room_nights',
    'số đêm': 'nights',
    'so dem': 'nights',
    'nhân viên tạo': 'create_clerk',
    'nhan vien tao': 'create_clerk',
    // ─── English field names ──────────────────────────────────
    'reservation_id': 'reservation_id',
    'booking_date': 'booking_date',
    'arrival_date': 'arrival_date',
    'departure_date': 'departure_date',
    'rooms': 'rooms',
    'revenue': 'revenue',
    'status': 'status',
    'cancel_date': 'cancel_date',
    'room_type': 'room_type',
    'company_name': 'company_name',
    'guest_name': 'guest_name',
    'salesperson': 'salesperson',
    'rate_per_room_night': 'rate_per_room_night',
    'pax': 'pax',
    'room_nights': 'room_nights',
    'nights': 'nights',
    'create_clerk': 'create_clerk',
};

/**
 * Parse Excel file buffer to array of row objects.
 * Supports both Vietnamese and English headers.
 */
export async function parseExcelToRows(buffer: Buffer | ArrayBuffer): Promise<ExcelRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as ArrayBuffer);

    // Use first sheet (or sheet named "Reservations")
    let sheet = workbook.getWorksheet('Reservations');
    if (!sheet) {
        sheet = workbook.worksheets[0];
    }
    if (!sheet) throw new Error('Không tìm thấy sheet dữ liệu');

    // Get header row (first row)
    const headerRow = sheet.getRow(1);
    if (!headerRow || headerRow.cellCount === 0) {
        throw new Error('File Excel trống, không có dữ liệu');
    }

    // Build column index → field name mapping
    const colMapping: Record<number, string> = {};
    headerRow.eachCell((cell, colNumber) => {
        const rawHeader = String(cell.value ?? '').trim().toLowerCase();
        const mappedField = HEADER_MAP[rawHeader];
        if (mappedField) {
            colMapping[colNumber] = mappedField;
        }
    });

    // Validate required headers
    const mappedFields = new Set(Object.values(colMapping));
    const requiredFields = ['reservation_id', 'booking_date', 'arrival_date', 'departure_date', 'rooms', 'revenue', 'status'];
    const missingFields = requiredFields.filter(f => !mappedFields.has(f));

    if (missingFields.length > 0) {
        throw new Error(`Thiếu cột bắt buộc: ${missingFields.join(', ')}. Hãy tải file mẫu để xem định dạng đúng.`);
    }

    // Read data rows (skip header)
    const rows: ExcelRow[] = [];
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header

        const rowData: Record<string, string> = {};
        for (const [colStr, fieldName] of Object.entries(colMapping)) {
            const colNumber = Number(colStr);
            const cell = row.getCell(colNumber);
            rowData[fieldName] = formatCellValue(cell.value);
        }

        // Skip completely empty rows
        if (Object.values(rowData).every(v => v === '')) return;

        rows.push(rowData as unknown as ExcelRow);
    });

    if (rows.length === 0) throw new Error('File Excel trống, không có dữ liệu');

    return rows;
}

/**
 * Format cell value to string, handling dates and numbers.
 */
function formatCellValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) {
        // Format as YYYY-MM-DD
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    // ExcelJS can return rich text objects
    if (typeof val === 'object' && 'richText' in (val as object)) {
        return (val as { richText: { text: string }[] }).richText.map(r => r.text).join('');
    }
    return String(val).trim();
}

/**
 * Excel (.xlsx) file parser for reservation uploads.
 * Converts Excel rows to the same format as CSV parser output.
 */
import * as XLSX from 'xlsx';

export interface ExcelRow {
    reservation_id: string;
    booking_date: string;
    arrival_date: string;
    departure_date: string;
    rooms: string;
    revenue: string;
    status: string;
    cancel_date?: string;
}

// Map Vietnamese headers → English field names
const HEADER_MAP: Record<string, string> = {
    // Vietnamese
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
    // English (already correct)
    'reservation_id': 'reservation_id',
    'booking_date': 'booking_date',
    'arrival_date': 'arrival_date',
    'departure_date': 'departure_date',
    'rooms': 'rooms',
    'revenue': 'revenue',
    'status': 'status',
    'cancel_date': 'cancel_date',
};

/**
 * Parse Excel file buffer to array of row objects.
 * Supports both Vietnamese and English headers.
 */
export function parseExcelToRows(buffer: Buffer): ExcelRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    // Use first sheet (or sheet named "Reservations")
    const sheetName = workbook.SheetNames.includes('Reservations')
        ? 'Reservations'
        : workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error('Không tìm thấy sheet dữ liệu');

    // Convert to JSON with raw headers
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' });
    if (rawRows.length === 0) throw new Error('File Excel trống, không có dữ liệu');

    // Map headers
    const firstRow = rawRows[0];
    const headerMapping: Record<string, string> = {};

    for (const rawHeader of Object.keys(firstRow)) {
        const normalized = rawHeader.trim().toLowerCase();
        const mappedField = HEADER_MAP[normalized];
        if (mappedField) {
            headerMapping[rawHeader] = mappedField;
        }
    }

    // Validate required headers
    const mappedFields = new Set(Object.values(headerMapping));
    const requiredFields = ['reservation_id', 'booking_date', 'arrival_date', 'departure_date', 'rooms', 'revenue', 'status'];
    const missingFields = requiredFields.filter(f => !mappedFields.has(f));

    if (missingFields.length > 0) {
        throw new Error(`Thiếu cột bắt buộc: ${missingFields.join(', ')}. Hãy tải file mẫu để xem định dạng đúng.`);
    }

    // Convert rows
    return rawRows.map(raw => {
        const row: Record<string, string> = {};
        for (const [rawHeader, fieldName] of Object.entries(headerMapping)) {
            const val = raw[rawHeader];
            row[fieldName] = formatCellValue(val);
        }
        return row as unknown as ExcelRow;
    });
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
    return String(val).trim();
}

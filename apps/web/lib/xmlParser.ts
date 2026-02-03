/**
 * Crystal Reports XML Parser for PMS Reservation Reports
 * Uses fast-xml-parser for server-side parsing
 */

import { XMLParser } from 'fast-xml-parser';

export interface ParsedReservation {
    confirmNum: string;
    bookingDate: string;
    arrivalDate: string;
    departureDate: string;
    nights: number;
    rooms: number;
    revenue: number;
    status: 'booked' | 'cancelled';
    guestName: string;
    companyName: string;
    roomType: string;
    ratePerRoomNight: number;
}

export interface XMLParseResult {
    success: boolean;
    reservations: ParsedReservation[];
    reportDate: string;
    reportType: 'booked' | 'cancelled';
    error?: string;
}

/**
 * Extract value from an array of FormattedReportObject by FieldName pattern
 * Returns the <Value> element content
 */
function extractFieldValue(objects: any[], fieldPattern: string): any {
    if (!objects || !Array.isArray(objects)) return '';

    for (const obj of objects) {
        // FieldName is an attribute: @_FieldName
        const fieldName = String(obj['@_FieldName'] || '');
        const objectName = String(obj['ObjectName'] || '');

        if (fieldName.includes(fieldPattern) || objectName.includes(fieldPattern)) {
            // Return the Value element (not FormattedValue)
            return obj['Value'] ?? obj['FormattedValue'] ?? '';
        }
    }
    return '';
}

/**
 * Extract all FormattedReportObject from a section
 */
function getReportObjects(section: any): any[] {
    const reportObjects = section?.['FormattedReportObjects']?.['FormattedReportObject'];
    if (!reportObjects) return [];
    return Array.isArray(reportObjects) ? reportObjects : [reportObjects];
}

/**
 * Parse Crystal Reports XML for reservation data
 */
export function parseCrystalReportXML(xmlContent: string, reportType: 'booked' | 'cancelled'): XMLParseResult {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            removeNSPrefix: true // Remove namespace prefixes
        });

        const doc = parser.parse(xmlContent);

        // Navigate to FormattedReport
        const report = doc['FormattedReport'];
        if (!report) {
            return {
                success: false,
                reservations: [],
                reportDate: '',
                reportType,
                error: 'Invalid XML: FormattedReport not found'
            };
        }

        // =====================================================
        // STEP 1: Extract Report Date from Header
        // =====================================================
        let reportDate = '';

        // Get the first FormattedAreaPair (Level=0, Type=Report)
        const areaPairs = report['FormattedAreaPair'];
        const topLevelPairs = Array.isArray(areaPairs) ? areaPairs : [areaPairs];

        for (const pair of topLevelPairs) {
            if (pair['@_Level'] === '0' && pair['@_Type'] === 'Report') {
                // Get Header area
                const headerArea = pair['FormattedArea'];
                if (headerArea && headerArea['@_Type'] === 'Header') {
                    const sections = headerArea['FormattedSections']?.['FormattedSection'];
                    const sectionArray = Array.isArray(sections) ? sections : [sections];

                    for (const section of sectionArray) {
                        const objects = getReportObjects(section);

                        // Look for @BookedDate or @todate field
                        const bookedDate = extractFieldValue(objects, '@BookedDate');
                        const toDate = extractFieldValue(objects, '@todate');
                        const printDate = extractFieldValue(objects, 'PrintDate');

                        reportDate = bookedDate || toDate || printDate || '';
                        if (reportDate) break;
                    }
                }
                break;
            }
        }

        // Ensure reportDate is in YYYY-MM-DD format
        if (reportDate && reportDate.includes('T')) {
            reportDate = reportDate.split('T')[0];
        }

        // =====================================================
        // STEP 2: Find all Detail sections (reservation rows)
        // =====================================================
        const detailSections: any[][] = [];

        function findDetailSections(node: any): void {
            if (!node) return;

            // Check if this is a FormattedAreaPair with Type="Details"
            if (node['@_Type'] === 'Details') {
                const area = node['FormattedArea'];
                if (area && area['@_Type'] === 'Details') {
                    const sections = area['FormattedSections']?.['FormattedSection'];
                    if (sections) {
                        const sectionArray = Array.isArray(sections) ? sections : [sections];
                        for (const section of sectionArray) {
                            const objects = getReportObjects(section);
                            if (objects.length > 0) {
                                detailSections.push(objects);
                            }
                        }
                    }
                }
            }

            // Recursively search children
            if (Array.isArray(node)) {
                for (const item of node) {
                    findDetailSections(item);
                }
            } else if (typeof node === 'object') {
                for (const key of Object.keys(node)) {
                    if (key.startsWith('@_')) continue; // Skip attributes
                    findDetailSections(node[key]);
                }
            }
        }

        findDetailSections(report);

        // =====================================================
        // STEP 3: Aggregate by ConfirmNum
        // =====================================================
        const reservationMap = new Map<string, ParsedReservation>();

        for (const objects of detailSections) {
            // Extract fields from this row
            const confirmNumRaw = extractFieldValue(objects, 'ConfirmNum');
            const arrivalDateRaw = extractFieldValue(objects, 'FromDate');
            const departureDateRaw = extractFieldValue(objects, 'ToDate');
            const numRoomRaw = extractFieldValue(objects, 'NumRoom');
            const rateRaw = extractFieldValue(objects, 'GNetRate');
            const nightsRaw = extractFieldValue(objects, 'night');
            const guestName = extractFieldValue(objects, 'GroupName');
            const companyName = extractFieldValue(objects, 'ClientName');
            const roomType = extractFieldValue(objects, 'RoomTypeCode');

            // Skip if no confirm number
            if (!confirmNumRaw) continue;

            // Clean up values
            const confirmNum = String(confirmNumRaw).replace('.00', '').trim();
            const numRoom = parseInt(String(numRoomRaw)) || 1;
            const nights = parseInt(String(nightsRaw)) || 1;
            const rate = parseFloat(String(rateRaw)) || 0;
            const lineRevenue = rate * numRoom * nights;

            // Parse dates (format: 2026-02-14T00:00:00)
            const arrivalDate = String(arrivalDateRaw).split('T')[0] || '';
            const departureDate = String(departureDateRaw).split('T')[0] || '';

            if (reservationMap.has(confirmNum)) {
                // Aggregate: add rooms and revenue
                const existing = reservationMap.get(confirmNum)!;
                existing.rooms += numRoom;
                existing.revenue += lineRevenue;
                // Keep earliest arrival and latest departure
                if (arrivalDate && arrivalDate < existing.arrivalDate) {
                    existing.arrivalDate = arrivalDate;
                }
                if (departureDate && departureDate > existing.departureDate) {
                    existing.departureDate = departureDate;
                }
            } else {
                reservationMap.set(confirmNum, {
                    confirmNum,
                    bookingDate: reportDate,
                    arrivalDate,
                    departureDate,
                    nights,
                    rooms: numRoom,
                    revenue: lineRevenue,
                    status: reportType,
                    guestName: String(guestName || ''),
                    companyName: String(companyName || ''),
                    roomType: String(roomType || ''),
                    ratePerRoomNight: rate
                });
            }
        }

        return {
            success: true,
            reservations: Array.from(reservationMap.values()),
            reportDate,
            reportType
        };

    } catch (err: any) {
        return {
            success: false,
            reservations: [],
            reportDate: '',
            reportType,
            error: err.message || 'Failed to parse XML'
        };
    }
}

/**
 * Convert parsed reservations to CSV format
 */
export function convertToCSVFormat(reservations: ParsedReservation[], cancelDate?: string): string {
    const header = 'reservation_id,booking_date,arrival_date,departure_date,rooms,revenue,status,cancel_date';
    const rows = reservations.map(r => {
        const status = r.status === 'cancelled' ? 'cancelled' : 'booked';
        const cancel = status === 'cancelled' ? (cancelDate || r.bookingDate) : '';
        return `${r.confirmNum},${r.bookingDate},${r.arrivalDate},${r.departureDate},${r.rooms},${r.revenue},${status},${cancel}`;
    });

    return [header, ...rows].join('\n');
}

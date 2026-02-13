/**
 * Crystal Reports XML Parser for PMS Reservation Reports
 * Uses fast-xml-parser for server-side parsing
 *
 * v2 — GM Reporting Dimensions:
 *   - Stateful SlsName extraction (Group Header Level 1 → carried to detail rows)
 *   - Per-room-type row storage (ConfirmNum + RoomTypeCode = unique line)
 *   - New fields: pax, roomNights, salespersonName, createClerk
 *   - Always uses <Value>, not <FormattedValue>
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
    companyName: string;     // ClientName = Source/Account (OTA/Agent)
    roomType: string;        // RoomTypeCode
    ratePerRoomNight: number; // GNetRate (per room per night)
    pax: number;             // NumPax
    roomNights: number;      // Rnight (rooms × nights)
    salespersonName: string; // SlsName from Group Header
    createClerk: string;     // createclerk
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
 * Returns the <Value> element content (NOT FormattedValue to avoid formatting issues)
 */
function extractFieldValue(objects: any[], fieldPattern: string): any {
    if (!objects || !Array.isArray(objects)) return '';

    for (const obj of objects) {
        // FieldName is an attribute: @_FieldName
        const fieldName = String(obj['@_FieldName'] || '');
        const objectName = String(obj['ObjectName'] || '');

        if (fieldName.includes(fieldPattern) || objectName.includes(fieldPattern)) {
            // Always prefer Value over FormattedValue (avoids comma-formatted numbers)
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
 * Supports stateful parsing: SlsName from Group Header Level 1 is carried to detail rows
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
                // FormattedArea can be array (Header + Footer) or single object
                const areaRaw = pair['FormattedArea'];
                const areas = Array.isArray(areaRaw) ? areaRaw : [areaRaw];

                for (const headerArea of areas) {
                    if (headerArea && headerArea['@_Type'] === 'Header') {
                        const sections = headerArea['FormattedSections']?.['FormattedSection'];
                        const sectionArray = Array.isArray(sections) ? sections : [sections];

                        for (const section of sectionArray) {
                            const objects = getReportObjects(section);

                            // Look for @BookedDate or @todate field - these contain the booking date
                            const bookedDate = extractFieldValue(objects, '@BookedDate');
                            const toDate = extractFieldValue(objects, '@todate');

                            // Use @BookedDate or @todate (same report filter), NOT PrintDate
                            reportDate = bookedDate || toDate || '';
                            if (reportDate) break;
                        }
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
        // STEP 2: Walk the tree with stateful SlsName tracking
        //         Collect detail rows with their parent's SlsName
        // =====================================================
        interface DetailRow {
            objects: any[];
            salespersonName: string;
        }

        const detailRows: DetailRow[] = [];

        /**
         * Walk Level 0 Report → Level 1 Groups → Level 2 Details
         * When we encounter a Level 1 Group Header, extract SlsName
         * and carry it to all Level 2 Details within that group
         */
        function walkReportStructure(reportNode: any): void {
            const topPairs = reportNode['FormattedAreaPair'];
            const topArray = Array.isArray(topPairs) ? topPairs : [topPairs];

            for (const level0 of topArray) {
                if (level0['@_Level'] === '0' && level0['@_Type'] === 'Report') {
                    // Inside the Report, find Level 1 Groups
                    const nested = level0['FormattedAreaPair'];
                    const nestedArray = Array.isArray(nested) ? nested : (nested ? [nested] : []);

                    for (const level1 of nestedArray) {
                        if (level1['@_Level'] === '1' && level1['@_Type'] === 'Group') {
                            processGroupPair(level1);
                        }
                    }
                }
            }
        }

        function processGroupPair(groupPair: any): void {
            // Extract SlsName from Group Header
            let salesperson = '';
            const formattedAreas = groupPair['FormattedArea'];
            const areasArr = Array.isArray(formattedAreas) ? formattedAreas : (formattedAreas ? [formattedAreas] : []);

            for (const area of areasArr) {
                if (area['@_Type'] === 'Header') {
                    const sections = area['FormattedSections']?.['FormattedSection'];
                    const secArr = Array.isArray(sections) ? sections : (sections ? [sections] : []);
                    for (const sec of secArr) {
                        const objects = getReportObjects(sec);
                        const slsValue = extractFieldValue(objects, 'SlsName');
                        if (slsValue) {
                            salesperson = String(slsValue).trim();
                        }
                    }
                }
            }

            // Find all Level 2 Detail pairs within this group
            const innerPairs = groupPair['FormattedAreaPair'];
            const innerArr = Array.isArray(innerPairs) ? innerPairs : (innerPairs ? [innerPairs] : []);

            for (const level2 of innerArr) {
                if (level2['@_Level'] === '2' && level2['@_Type'] === 'Details') {
                    const area = level2['FormattedArea'];
                    if (area && area['@_Type'] === 'Details') {
                        const sections = area['FormattedSections']?.['FormattedSection'];
                        if (sections) {
                            const secArr = Array.isArray(sections) ? sections : [sections];
                            for (const section of secArr) {
                                const objects = getReportObjects(section);
                                if (objects.length > 0) {
                                    detailRows.push({
                                        objects,
                                        salespersonName: salesperson
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        walkReportStructure(report);

        // =====================================================
        // STEP 3: Parse each detail row into ParsedReservation
        //         Key = ConfirmNum + RoomTypeCode (per room-type line)
        // =====================================================
        const reservationMap = new Map<string, ParsedReservation>();

        for (const { objects, salespersonName } of detailRows) {
            // Extract fields from this row
            const confirmNumRaw = extractFieldValue(objects, 'ConfirmNum');
            const arrivalDateRaw = extractFieldValue(objects, 'FromDate');
            const departureDateRaw = extractFieldValue(objects, 'ToDate');
            const numRoomRaw = extractFieldValue(objects, 'NumRoom');
            const rateRaw = extractFieldValue(objects, 'GNetRate');
            const nightsRaw = extractFieldValue(objects, 'night');
            const roomNightsRaw = extractFieldValue(objects, 'Rnight');
            const numPaxRaw = extractFieldValue(objects, 'NumPax');
            const guestName = extractFieldValue(objects, 'GroupName');
            const companyName = extractFieldValue(objects, 'ClientName');
            const roomType = extractFieldValue(objects, 'RoomTypeCode');
            const bookStatus = extractFieldValue(objects, 'Bookstatus');
            const createClerk = extractFieldValue(objects, 'CreateClerk') ||
                extractFieldValue(objects, 'createclerk');

            // Skip if no confirm number
            if (!confirmNumRaw) continue;

            // Clean up ConfirmNum: float → string (1014190.00 → "1014190")
            const confirmNum = String(confirmNumRaw)
                .replace(/\.00$/, '')
                .replace(/\.0$/, '')
                .trim();

            const numRoom = parseInt(String(numRoomRaw)) || 1;
            const nights = parseInt(String(nightsRaw)) || 1;
            const rate = parseFloat(String(rateRaw)) || 0;
            const roomNights = parseInt(String(roomNightsRaw)) || (numRoom * nights);
            const pax = parseInt(String(numPaxRaw)) || 0;
            // Revenue for this line = rate × roomNights
            // (GNetRate is per room-night, Rnight is total room-nights for this line)
            const lineRevenue = rate * roomNights;

            // Parse dates (format: 2026-02-14T00:00:00)
            const arrivalDate = String(arrivalDateRaw).split('T')[0] || '';
            const departureDate = String(departureDateRaw).split('T')[0] || '';

            // Dedup key: ConfirmNum + RoomTypeCode (preserves per-room-type lines)
            const roomTypeStr = String(roomType || '').trim();
            const dedupKey = `${confirmNum}__${roomTypeStr}`;

            if (reservationMap.has(dedupKey)) {
                // Same confirmNum + same room type = aggregate (rooms, revenue, pax)
                const existing = reservationMap.get(dedupKey)!;
                existing.rooms += numRoom;
                existing.revenue += lineRevenue;
                existing.roomNights += roomNights;
                existing.pax += pax;
                // Recompute weighted avg rate after merge
                existing.ratePerRoomNight = existing.roomNights > 0
                    ? existing.revenue / existing.roomNights
                    : 0;
                // Keep earliest arrival and latest departure
                if (arrivalDate && arrivalDate < existing.arrivalDate) {
                    existing.arrivalDate = arrivalDate;
                }
                if (departureDate && departureDate > existing.departureDate) {
                    existing.departureDate = departureDate;
                }
            } else {
                reservationMap.set(dedupKey, {
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
                    roomType: roomTypeStr,
                    ratePerRoomNight: rate,
                    pax,
                    roomNights,
                    salespersonName,
                    createClerk: String(createClerk || '')
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
    const header = 'reservation_id,booking_date,arrival_date,departure_date,rooms,revenue,status,cancel_date,room_type,company_name,guest_name,salesperson,pax,room_nights,rate_per_night';
    const rows = reservations.map(r => {
        const status = r.status === 'cancelled' ? 'cancelled' : 'booked';
        const cancel = status === 'cancelled' ? (cancelDate || r.bookingDate) : '';
        return `${r.confirmNum},${r.bookingDate},${r.arrivalDate},${r.departureDate},${r.rooms},${r.revenue},${status},${cancel},${r.roomType},${r.companyName},${r.guestName},${r.salespersonName},${r.pax},${r.roomNights},${r.ratePerRoomNight}`;
    });

    return [header, ...rows].join('\n');
}

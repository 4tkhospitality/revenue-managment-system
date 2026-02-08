import { XMLParser } from "fast-xml-parser"

export interface CancellationRecord {
    folioNum: string
    arrivalDate: Date
    cancelTime: Date
    nights: number
    rateAmount: number
    totalRevenue: number
    channel: string | null
    saleGroup: string | null
    roomType: string | null
    roomCode: string | null
    guestName: string | null
}

export interface ParseCancellationResult {
    asOfDate: Date
    records: CancellationRecord[]
}

/**
 * Parse H65 Crystal Reports Cancellation XML
 * 
 * Uses fast-xml-parser first, falls back to regex for large files
 */
export function parseCancellationXml(xmlString: string): ParseCancellationResult {
    // For large files (>500KB), skip fast-xml-parser entirely to avoid nesting limit
    const fileSizeKB = xmlString.length / 1024;
    console.log(`[CANCEL] Parsing file, size: ${fileSizeKB.toFixed(1)} KB`);

    if (fileSizeKB > 500) {
        console.log('[CANCEL] Large file detected, using regex parser directly');
        return parseWithRegex(xmlString);
    }

    try {
        return parseWithFastXml(xmlString);
    } catch (error) {
        // If fast-xml-parser fails (e.g., nesting limit), use regex fallback
        console.log('[CANCEL] fast-xml-parser failed, using regex fallback:', error instanceof Error ? error.message : error);
        return parseWithRegex(xmlString);
    }
}

/**
 * Fast XML parser method (original)
 */
function parseWithFastXml(xmlString: string): ParseCancellationResult {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseTagValue: true,
        trimValues: true,
        processEntities: false,
    })

    const parsed = parser.parse(xmlString)

    // Try multiple possible root structures
    let root = parsed?.CrystalReport?.FormattedReport || parsed?.FormattedReport

    if (!root) {
        throw new Error("Invalid XML format: Cannot find FormattedReport")
    }

    // Extract all FormattedReportObjects from the entire structure
    const allFields = extractAllFieldsFromRoot(root)

    // Extract Report Date from header fields
    const { fromDate, toDate } = extractReportDatesFromFields(allFields)

    // V01 Rule: From must equal To
    if (fromDate !== toDate) {
        throw new Error(`Report date range not supported in V01. From: ${fromDate}, To: ${toDate}`)
    }

    const asOfDate = parseDate(fromDate)
    if (!asOfDate) {
        throw new Error(`Invalid report date: ${fromDate}`)
    }

    // Extract cancellation records
    const records = extractCancellationRecordsFromFields(allFields)

    return { asOfDate, records }
}

/**
 * Regex-based fallback for large XML files that exceed nesting limits
 */
function parseWithRegex(xmlString: string): ParseCancellationResult {
    console.log('[CANCEL] Using regex parser for large file');

    // Extract report dates - FieldName is an ATTRIBUTE, Value is child element
    // Example: <FormattedReportObject ... FieldName="{@fmFromDate}">...<Value>2025-11-25</Value>
    const fromDateMatch = xmlString.match(/FieldName="\{@fmFromDate\}"[^>]*>[\s\S]*?<Value>([^<]+)<\/Value>/);
    const toDateMatch = xmlString.match(/FieldName="\{@fmToDate\}"[^>]*>[\s\S]*?<Value>([^<]+)<\/Value>/);

    if (!fromDateMatch || !toDateMatch) {
        throw new Error("Cannot extract report dates from XML");
    }

    const fromDate = fromDateMatch[1].trim();
    const toDate = toDateMatch[1].trim();

    if (fromDate !== toDate) {
        throw new Error(`Report date range not supported in V01. From: ${fromDate}, To: ${toDate}`);
    }

    const asOfDate = parseDate(fromDate);
    if (!asOfDate) {
        throw new Error(`Invalid report date: ${fromDate}`);
    }

    // Extract all FormattedReportObject elements with their FieldName and Value
    // Pattern: FieldName="..." followed by <Value>...</Value>
    const fieldPattern = /FieldName="([^"]+)"[^>]*>[\s\S]*?<Value>([^<]*)<\/Value>/g;
    const fields: Array<{ fieldName: string, value: string }> = [];
    let match;

    while ((match = fieldPattern.exec(xmlString)) !== null) {
        fields.push({
            fieldName: match[1].trim(),
            value: match[2].trim()
        });
    }

    console.log(`[CANCEL] Regex extracted ${fields.length} fields`);

    // Extract cancellation records
    const records = extractCancellationRecordsFromFields(fields);

    return { asOfDate, records };
}

interface FieldData {
    fieldName: string
    value: string
    objectName?: string
}

function extractAllFieldsFromRoot(root: any): FieldData[] {
    const fields: FieldData[] = []

    function traverse(node: any) {
        if (!node || typeof node !== "object") return

        // Check for FormattedReportObject with xsi:type="CTFormattedField"
        if (node["@_xsi:type"] === "CTFormattedField" || node["@_Type"]) {
            const fieldName = node["@_FieldName"] || node.FieldName || ""
            const value = node.Value !== undefined ? String(node.Value) : ""
            const objectName = node.ObjectName || ""

            if (fieldName) {
                fields.push({ fieldName, value, objectName })
            }
        }

        // Also check for nested Value/FieldName structure
        if (node.FieldName && node.Value !== undefined) {
            fields.push({
                fieldName: node.FieldName,
                value: String(node.Value),
                objectName: node.ObjectName || ""
            })
        }
        if (node["@_FieldName"] && node.Value !== undefined) {
            fields.push({
                fieldName: node["@_FieldName"],
                value: String(node.Value),
                objectName: node.ObjectName || ""
            })
        }

        // Traverse arrays
        if (Array.isArray(node)) {
            node.forEach(traverse)
            return
        }

        // Traverse object properties
        for (const key of Object.keys(node)) {
            traverse(node[key])
        }
    }

    traverse(root)
    return fields
}

function extractReportDatesFromFields(fields: FieldData[]): { fromDate: string; toDate: string } {
    let fromDate = ""
    let toDate = ""

    for (const field of fields) {
        if (field.fieldName === "{@fmFromDate}" && field.value) {
            fromDate = field.value
        }
        if (field.fieldName === "{@fmToDate}" && field.value) {
            toDate = field.value
        }
    }

    if (!fromDate || !toDate) {
        throw new Error("Cannot extract report dates from XML")
    }

    return { fromDate, toDate }
}

function extractCancellationRecordsFromFields(fields: FieldData[]): CancellationRecord[] {
    const records: CancellationRecord[] = []

    // Group fields by record - each FolioNum marks a new record
    let currentRecord: Partial<CancellationRecord> = {}
    let currentSaleGroup = ""

    for (const field of fields) {
        const { fieldName, value } = field

        // Track sale group (GroupName)
        if (fieldName.includes("GroupName") && value) {
            currentSaleGroup = value
        }

        // Folio Number - but check if it's a new folio or same as current
        if (fieldName.includes("FolioNum")) {
            // If we have a different folio, save current and start new
            if (currentRecord.folioNum && currentRecord.folioNum !== value) {
                records.push(finalizeRecord(currentRecord, currentSaleGroup))
                currentRecord = {}
            }
            currentRecord.folioNum = value
        }

        // Only process if we have a current record
        if (!currentRecord.folioNum) continue

        // Other fields
        if (fieldName.includes("fmGuestName")) {
            currentRecord.guestName = value
        }
        if (fieldName.includes("sTA_Company")) {
            currentRecord.channel = value
        }
        if (fieldName.includes("Roomcode") && !fieldName.includes("RoomTypeCode")) {
            currentRecord.roomCode = value
        }
        if (fieldName.includes("RoomTypeCode")) {
            currentRecord.roomType = value
        }
        if (fieldName.includes("CancelTime")) {
            const parsed = parseDateTime(value)
            if (parsed) currentRecord.cancelTime = parsed
        }
        if (fieldName.includes("ArrivalTime")) {
            const parsed = parseDate(value)
            if (parsed) currentRecord.arrivalDate = parsed
        }
        if (fieldName.includes("nite")) {
            currentRecord.nights = parseInt(value) || 0
        }
        if (fieldName.includes("RateAmount")) {
            currentRecord.rateAmount = parseFloat(value) || 0
        }
        if (fieldName.includes("TotalREV")) {
            currentRecord.totalRevenue = parseFloat(value) || 0
        }
    }

    // Don't forget the last record
    if (currentRecord.folioNum) {
        records.push(finalizeRecord(currentRecord, currentSaleGroup))
    }

    // Deduplicate records by folioNum (keep last values for each folio)
    const uniqueRecords = new Map<string, CancellationRecord>()
    for (const record of records) {
        const existing = uniqueRecords.get(record.folioNum)
        if (existing) {
            // Merge: keep non-null values
            uniqueRecords.set(record.folioNum, {
                ...existing,
                arrivalDate: record.arrivalDate || existing.arrivalDate,
                cancelTime: record.cancelTime || existing.cancelTime,
                nights: record.nights || existing.nights,
                rateAmount: record.rateAmount || existing.rateAmount,
                totalRevenue: record.totalRevenue || existing.totalRevenue,
                channel: record.channel || existing.channel,
                saleGroup: record.saleGroup || existing.saleGroup,
                roomType: record.roomType || existing.roomType,
                roomCode: record.roomCode || existing.roomCode,
                guestName: record.guestName || existing.guestName,
            })
        } else {
            uniqueRecords.set(record.folioNum, record)
        }
    }

    return Array.from(uniqueRecords.values())
}

function finalizeRecord(partial: Partial<CancellationRecord>, saleGroup: string): CancellationRecord {
    return {
        folioNum: partial.folioNum || "",
        arrivalDate: partial.arrivalDate || new Date(),
        cancelTime: partial.cancelTime || new Date(),
        nights: partial.nights || 0,
        rateAmount: partial.rateAmount || 0,
        totalRevenue: partial.totalRevenue || 0,
        channel: partial.channel || null,
        saleGroup: saleGroup || null,
        roomType: partial.roomType || null,
        roomCode: partial.roomCode || null,
        guestName: partial.guestName || null,
    }
}

function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null

    // Handle ISO format: 2025-10-01 or 2025-10-01T00:00:00
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
        return date
    }

    // Handle dd/MM/yy format (10/01/25)
    const parts = dateStr.split("/")
    if (parts.length === 3) {
        const [day, month, year] = parts
        let fullYear = parseInt(year)
        if (fullYear < 100) {
            fullYear += fullYear < 50 ? 2000 : 1900
        }
        return new Date(fullYear, parseInt(month) - 1, parseInt(day))
    }

    return null
}

function parseDateTime(dateTimeStr: string): Date | null {
    if (!dateTimeStr) return null

    // Handle ISO format: 2025-10-01T15:45:40
    const date = new Date(dateTimeStr)
    if (!isNaN(date.getTime())) {
        return date
    }

    return null
}

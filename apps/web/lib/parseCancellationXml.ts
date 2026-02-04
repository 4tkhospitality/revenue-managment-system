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
 * Supports both FormattedReportObject and FormattedAreaPair structures
 */
export function parseCancellationXml(xmlString: string): ParseCancellationResult {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseTagValue: true,
        trimValues: true,
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

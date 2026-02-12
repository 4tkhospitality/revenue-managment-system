// Dynamic Pricing: Season NET Rates — CSV Import
// Fix C: key = room_type_id (stable across renames)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

interface CSVRow {
    room_type_id: string;
    room_type_name?: string; // for readability only
    season_code: string;
    net_rate: string;
}

function parseCSV(text: string): CSVRow[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headerLine = lines[0].replace(/\r$/, '');
    const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());

    // Validate required columns
    const requiredCols = ['room_type_id', 'season_code', 'net_rate'];
    for (const col of requiredCols) {
        if (!headers.includes(col)) {
            throw new Error(`Missing required column: ${col}`);
        }
    }

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].replace(/\r$/, '').trim();
        if (!line) continue;

        const values = line.split(',').map((v) => v.trim());
        const row: any = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });

        rows.push(row as CSVRow);
    }

    return rows;
}

// POST /api/pricing/season-rates/import — CSV upload
export async function POST(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        // Parse multipart form or raw text body
        const contentType = request.headers.get('content-type') || '';
        let csvText: string;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File;
            if (!file) {
                return NextResponse.json(
                    { error: 'No file uploaded' },
                    { status: 400 }
                );
            }
            csvText = await file.text();
        } else {
            csvText = await request.text();
        }

        // Parse CSV
        let rows: CSVRow[];
        try {
            rows = parseCSV(csvText);
        } catch (e: any) {
            return NextResponse.json(
                { error: `CSV parse error: ${e.message}` },
                { status: 400 }
            );
        }

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'CSV file is empty or has no data rows' },
                { status: 400 }
            );
        }

        // Fetch hotel's room types and seasons
        const [roomTypes, seasons] = await Promise.all([
            prisma.roomType.findMany({
                where: { hotel_id: hotelId },
                select: { id: true, name: true },
            }),
            prisma.seasonConfig.findMany({
                where: { hotel_id: hotelId },
                select: { id: true, code: true, name: true },
            }),
        ]);

        const roomTypeMap = new Map<string, { id: string; name: string }>(roomTypes.map((rt) => [rt.id, rt]));
        const seasonCodeMap = new Map<string, { id: string; code: string; name: string }>(seasons.map((s) => [s.code, s]));

        // Validate rows and build upsert data
        const errors: string[] = [];
        const upsertData: {
            room_type_id: string;
            season_id: string;
            net_rate: number;
        }[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const lineNum = i + 2; // +1 for header, +1 for 1-indexed

            // Validate room_type_id (key for matching — Fix C)
            if (!roomTypeMap.has(row.room_type_id)) {
                errors.push(`Line ${lineNum}: Unknown room_type_id "${row.room_type_id}"`);
                continue;
            }

            // Validate season_code
            const seasonCode = row.season_code.toUpperCase().trim();
            const season = seasonCodeMap.get(seasonCode);
            if (!season) {
                errors.push(`Line ${lineNum}: Unknown season_code "${row.season_code}"`);
                continue;
            }

            // Validate net_rate
            const netRate = parseFloat(row.net_rate);
            if (isNaN(netRate) || netRate < 0) {
                errors.push(`Line ${lineNum}: Invalid net_rate "${row.net_rate}"`);
                continue;
            }

            upsertData.push({
                room_type_id: row.room_type_id,
                season_id: season.id,
                net_rate: netRate,
            });
        }

        // If preview mode (query param), return validation results
        const { searchParams } = new URL(request.url);
        const isPreview = searchParams.get('preview') === 'true';

        if (isPreview) {
            return NextResponse.json({
                totalRows: rows.length,
                validRows: upsertData.length,
                errors,
                preview: upsertData.map((d) => ({
                    room_type_id: d.room_type_id,
                    room_type_name: roomTypeMap.get(d.room_type_id)?.name,
                    season_id: d.season_id,
                    net_rate: d.net_rate,
                })),
            });
        }

        // If there are errors, return them (don't partial-import)
        if (errors.length > 0) {
            return NextResponse.json(
                {
                    error: 'Validation errors in CSV',
                    errors,
                    validRows: upsertData.length,
                    totalRows: rows.length,
                },
                { status: 400 }
            );
        }

        // Execute bulk upsert in transaction
        const result = await prisma.$transaction(
            upsertData.map((d) =>
                prisma.seasonNetRate.upsert({
                    where: {
                        season_id_room_type_id: {
                            season_id: d.season_id,
                            room_type_id: d.room_type_id,
                        },
                    },
                    create: {
                        hotel_id: hotelId, // server-derived — BA Note #1
                        season_id: d.season_id,
                        room_type_id: d.room_type_id,
                        net_rate: d.net_rate,
                    },
                    update: {
                        net_rate: d.net_rate,
                    },
                })
            )
        );

        return NextResponse.json({
            imported: result.length,
            message: `Successfully imported ${result.length} rates`,
        });
    } catch (error) {
        console.error('Error importing season rates:', error);
        return NextResponse.json(
            { error: 'Failed to import season rates' },
            { status: 500 }
        );
    }
}

import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

export async function GET(request: NextRequest) {
    // Auth + tenant isolation via getActiveHotelId
    const hotelId = await getActiveHotelId();
    if (!hotelId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    try {
        const [jobs, total] = await Promise.all([
            prisma.importJob.findMany({
                where: { hotel_id: hotelId },
                orderBy: { created_at: 'desc' },
                skip,
                take: pageSize,
                select: {
                    job_id: true,
                    file_name: true,
                    status: true,
                    created_at: true,
                    finished_at: true,
                    error_summary: true,
                }
            }),
            prisma.importJob.count({
                where: { hotel_id: hotelId },
            })
        ]);

        return NextResponse.json({
            jobs,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        console.error('Error fetching import jobs:', error);
        return NextResponse.json({ error: 'Failed to fetch import jobs' }, { status: 500 });
    }
}

import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    try {
        const [jobs, total] = await Promise.all([
            prisma.importJob.findMany({
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
            prisma.importJob.count()
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

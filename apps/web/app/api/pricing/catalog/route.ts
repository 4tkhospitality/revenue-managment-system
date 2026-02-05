// V01.2: Promotion Catalog API - List available promotions
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pricing/catalog - List promotion catalog
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const vendor = searchParams.get('vendor') || 'agoda';

        const catalog = await prisma.promotionCatalog.findMany({
            where: { vendor },
            orderBy: [
                { group_type: 'asc' },
                { name: 'asc' },
            ],
        });

        return NextResponse.json(catalog);
    } catch (error) {
        console.error('Error fetching promotion catalog:', error);
        return NextResponse.json(
            { error: 'Failed to fetch promotion catalog' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

/**
 * DELETE /api/data/delete-by-month
 * Delete reservation data for a specific month (+ optionally OTB snapshots)
 * Only accessible by super_admin
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!session.user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const dataType = searchParams.get('type') || 'reservations';
        const includeOtb = searchParams.get('includeOtb') === 'true';

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
        }

        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'No active hotel' }, { status: 400 });
        }

        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

        let deletedReservations = 0;
        let deletedCancellations = 0;
        let deletedOtb = 0;
        let deletedFeatures = 0;

        // Delete reservations
        if (dataType === 'reservations' || dataType === 'all') {
            const result = await prisma.reservationsRaw.deleteMany({
                where: {
                    hotel_id: hotelId,
                    booking_date: { gte: startDate, lte: endDate },
                },
            });
            deletedReservations = result.count;
        }

        // Delete cancellations
        if (dataType === 'cancellations' || dataType === 'all') {
            const result = await prisma.cancellationRaw.deleteMany({
                where: {
                    hotel_id: hotelId,
                    cancel_time: { gte: startDate, lte: endDate },
                },
            });
            deletedCancellations = result.count;
        }

        // Delete OTB + Features (if requested)
        if (includeOtb) {
            const otbResult = await prisma.dailyOTB.deleteMany({
                where: {
                    hotel_id: hotelId,
                    as_of_date: { gte: startDate, lte: endDate },
                },
            });
            deletedOtb = otbResult.count;

            const featResult = await prisma.featuresDaily.deleteMany({
                where: {
                    hotel_id: hotelId,
                    as_of_date: { gte: startDate, lte: endDate },
                },
            });
            deletedFeatures = featResult.count;
        }

        const parts = [];
        if (deletedReservations) parts.push(`${deletedReservations} reservations`);
        if (deletedCancellations) parts.push(`${deletedCancellations} cancellations`);
        if (deletedOtb) parts.push(`${deletedOtb} OTB snapshots`);
        if (deletedFeatures) parts.push(`${deletedFeatures} features`);

        return NextResponse.json({
            success: true,
            month,
            deletedReservations,
            deletedCancellations,
            deletedOtb,
            deletedFeatures,
            message: `Deleted ${parts.join(', ')} for ${month}`,
        });
    } catch (error) {
        console.error('[DELETE /api/data/delete-by-month] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/data/delete-by-month
 * Preview: count records that would be deleted
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!session.user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
        }

        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'No active hotel' }, { status: 400 });
        }

        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

        const [reservationCount, cancellationCount, otbCount] = await Promise.all([
            prisma.reservationsRaw.count({
                where: {
                    hotel_id: hotelId,
                    booking_date: { gte: startDate, lte: endDate },
                },
            }),
            prisma.cancellationRaw.count({
                where: {
                    hotel_id: hotelId,
                    cancel_time: { gte: startDate, lte: endDate },
                },
            }),
            prisma.dailyOTB.count({
                where: {
                    hotel_id: hotelId,
                    as_of_date: { gte: startDate, lte: endDate },
                },
            }),
        ]);

        return NextResponse.json({
            month,
            reservationCount,
            cancellationCount,
            otbCount,
            totalCount: reservationCount + cancellationCount,
        });
    } catch (error) {
        console.error('[GET /api/data/delete-by-month] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

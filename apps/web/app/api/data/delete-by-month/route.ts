import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/data/delete-by-month
 * Delete reservation data for a specific month
 * Only accessible by super_admin
 */
export async function DELETE(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check super_admin role
        if (!session.user.isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Super admin access required' },
                { status: 403 }
            );
        }

        // Get month parameter (format: YYYY-MM)
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const dataType = searchParams.get('type') || 'reservations'; // reservations | cancellations | all

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json(
                { error: 'Invalid month format. Use YYYY-MM' },
                { status: 400 }
            );
        }

        // Parse month to date range
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999); // Last day of month

        let deletedReservations = 0;
        let deletedCancellations = 0;

        // Delete reservations
        if (dataType === 'reservations' || dataType === 'all') {
            const result = await prisma.reservationsRaw.deleteMany({
                where: {
                    booking_date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            deletedReservations = result.count;
        }

        // Delete cancellations
        if (dataType === 'cancellations' || dataType === 'all') {
            const result = await prisma.cancellationRaw.deleteMany({
                where: {
                    cancel_time: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            deletedCancellations = result.count;
        }

        return NextResponse.json({
            success: true,
            month,
            deletedReservations,
            deletedCancellations,
            message: `Deleted ${deletedReservations} reservations and ${deletedCancellations} cancellations for ${month}`
        });

    } catch (error) {
        console.error('[DELETE /api/data/delete-by-month] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/data/delete-by-month
 * Get count of records that would be deleted for preview
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check super_admin role
        if (!session.user.isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Super admin access required' },
                { status: 403 }
            );
        }

        // Get month parameter (format: YYYY-MM)
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json(
                { error: 'Invalid month format. Use YYYY-MM' },
                { status: 400 }
            );
        }

        // Parse month to date range
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

        // Count reservations
        const reservationCount = await prisma.reservationsRaw.count({
            where: {
                booking_date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // Count cancellations
        const cancellationCount = await prisma.cancellationRaw.count({
            where: {
                cancel_time: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        return NextResponse.json({
            month,
            reservationCount,
            cancellationCount,
            totalCount: reservationCount + cancellationCount
        });

    } catch (error) {
        console.error('[GET /api/data/delete-by-month] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/invite/redeem
 * Redeem invite code/token and join hotel
 * Uses transaction for atomicity, DB rate-limit
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { tryRateLimit } from '@/lib/utils/rateLimit'

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    try {
        // Rate limit: 5 attempts per minute
        const rateCheck = await tryRateLimit(userId, 'INVITE_ATTEMPT', undefined, 5, 60)
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: `Quá nhiều lần thử. Vui lòng đợi ${Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)}s` },
                { status: 429 }
            )
        }

        const body = await request.json()
        const { code, token } = body

        if (!code && !token) {
            return NextResponse.json(
                { error: 'Vui lòng nhập mã mời hoặc token' },
                { status: 400 }
            )
        }

        // Find invite by token hash or short_code
        let tokenHash: string | undefined
        let shortCode: string | undefined

        if (token) {
            // Full token provided - hash it
            tokenHash = crypto.createHash('sha256').update(token).digest('hex')
        } else if (code) {
            // Short code provided
            shortCode = code.trim().toUpperCase()
        }

        // Transaction: atomic update + create HotelUser
        const result = await prisma.$transaction(async (tx) => {
            // Find invite with conditions
            let invite
            if (tokenHash) {
                invite = await tx.hotelInvite.findUnique({
                    where: { token_hash: tokenHash },
                    include: { hotel: { select: { hotel_id: true, name: true } } },
                })
            } else if (shortCode) {
                // Short code - find any active invite with this code
                invite = await tx.hotelInvite.findFirst({
                    where: {
                        short_code: shortCode,
                        status: 'active',
                        expires_at: { gt: new Date() },
                    },
                    include: { hotel: { select: { hotel_id: true, name: true } } },
                })
            }

            if (!invite) {
                throw new Error('Mã mời không hợp lệ hoặc đã hết hạn')
            }

            // Check status and usage
            if (invite.status !== 'active') {
                throw new Error('Mã mời đã bị vô hiệu hóa')
            }
            if (invite.expires_at < new Date()) {
                throw new Error('Mã mời đã hết hạn')
            }
            if (invite.used_count >= invite.max_uses) {
                throw new Error('Mã mời đã được sử dụng hết')
            }

            // Check if user already member
            const existingMember = await tx.hotelUser.findUnique({
                where: {
                    user_id_hotel_id: {
                        user_id: userId,
                        hotel_id: invite.hotel_id,
                    },
                },
            })

            if (existingMember) {
                throw new Error('Bạn đã là thành viên của khách sạn này')
            }

            // Update used_count atomically
            await tx.hotelInvite.update({
                where: { invite_id: invite.invite_id },
                data: {
                    used_count: { increment: 1 },
                    used_by: userId,
                    used_at: new Date(),
                },
            })

            // Create HotelUser
            await tx.hotelUser.create({
                data: {
                    user_id: userId,
                    hotel_id: invite.hotel_id,
                    role: invite.role,
                    is_primary: false, // Invited users are not primary
                },
            })

            return {
                hotelId: invite.hotel_id,
                hotelName: invite.hotel.name,
                role: invite.role,
            }
        })

        // Log success event
        await prisma.productEvent.create({
            data: {
                user_id: userId,
                hotel_id: result.hotelId,
                event_type: 'INVITE_REDEEMED',
                event_data: { role: result.role },
            },
        })

        return NextResponse.json({
            success: true,
            hotelId: result.hotelId,
            hotelName: result.hotelName,
            role: result.role,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Có lỗi xảy ra'
        console.error('[API] Invite redeem error:', message)
        return NextResponse.json({ error: message }, { status: 400 })
    }
}

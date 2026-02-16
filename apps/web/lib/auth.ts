import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import prisma from "./prisma"
import { UserRole } from "@prisma/client"
import { serverLog } from "./logger"
import { notifyNewUser } from "./telegram"

// Admin email - super_admin access
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "phan.le@vleisure.com"

// Types for accessible hotels
interface AccessibleHotel {
    hotelId: string
    hotelName: string
    role: UserRole
    isPrimary: boolean
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // SAFE: allowDangerousEmailAccountLinking is acceptable here because
            // we only use Google as a single OAuth provider. This flag would be
            // risky if multiple providers (e.g. GitHub + Google) shared the same email.
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile, trigger }) {
            // On initial sign in or refresh
            if (account && profile?.email) {
                token.email = profile.email
                token.name = profile.name
                token.picture = profile.picture
            }

            // Fetch from DB on initial sign in OR when session is updated
            // trigger === 'update' is called after demo hotel assignment, invite redeem, etc.
            if ((account && token.email) || trigger === 'update') {
                try {

                    // Single query with include instead of 3 sequential queries
                    const user = await prisma.user.findUnique({
                        where: { email: token.email as string },
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            is_active: true,
                            hotel_users: {
                                select: {
                                    hotel_id: true,
                                    role: true,
                                    is_primary: true,
                                    hotel: {
                                        select: { hotel_id: true, name: true }
                                    }
                                }
                            }
                        }
                    })

                    if (user) {

                        token.userId = user.id
                        token.role = user.role
                        token.isActive = user.is_active
                        token.isAdmin = user.role === 'super_admin' || token.email === ADMIN_EMAIL

                        // SAFETY: Admin email can never be blocked
                        if (token.email === ADMIN_EMAIL) {
                            token.isActive = true
                            token.isAdmin = true
                        }

                        serverLog.info(`[AUTH] JWT Callback - Existing User: ${user.email}, Role: ${user.role}, IsActive: ${user.is_active}, IsAdmin: ${token.isAdmin}`)

                        // Map to accessibleHotels directly from included data
                        token.accessibleHotels = user.hotel_users.map(hu => ({
                            hotelId: hu.hotel_id,
                            hotelName: hu.hotel?.name || 'Unknown Hotel',
                            role: hu.role,
                            isPrimary: hu.is_primary,
                        }))

                        // Check if user paid but hasn't created their own hotel yet
                        // This handles: payment linked to Demo Hotel, or orphan (hotel_id=null)
                        const hasCompletedPayment = await prisma.paymentTransaction.findFirst({
                            where: {
                                user_id: user.id,
                                status: 'COMPLETED',
                            },
                            select: { id: true },
                        })
                        // User has a "real" hotel if they have any hotel that's NOT "Demo Hotel"
                        const hasRealHotel = user.hotel_users.some(
                            hu => hu.hotel?.name !== 'Demo Hotel'
                        )
                        token.hasPendingActivation = !!hasCompletedPayment && !hasRealHotel
                        if (token.hasPendingActivation) {
                            serverLog.info(`[AUTH] User ${user.email} has pending activation: paid=${!!hasCompletedPayment}, hasRealHotel=${hasRealHotel}`)
                        }


                    } else {
                        // NEW USER: Create user WITHOUT hotel assignment
                        // Middleware will redirect to /welcome for onboarding choice

                        // Create new user
                        const newUser = await prisma.user.create({
                            data: {
                                email: token.email as string,
                                name: token.name as string || 'New User',
                                role: 'viewer',
                                is_active: true,
                            }
                        })
                        serverLog.info(`[AUTH] Created New User: ${newUser.email}, ID: ${newUser.id} - No hotel assigned, will redirect to /welcome`)

                        // Set token values - NO hotels assigned
                        token.userId = newUser.id
                        token.role = 'viewer'
                        token.isActive = true
                        token.isAdmin = token.email === ADMIN_EMAIL
                        token.accessibleHotels = [] // Empty - triggers /welcome redirect
                    }
                } catch (error) {
                    serverLog.error('[AUTH] ERROR in JWT callback:', error)
                    // Fallback for DB errors
                    token.role = 'viewer'
                    token.isActive = true
                    token.isAdmin = token.email === ADMIN_EMAIL
                    token.accessibleHotels = []
                }
            }

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId as string
                session.user.email = token.email as string
                session.user.name = token.name as string
                session.user.image = token.picture as string
                session.user.role = token.role as UserRole
                session.user.isActive = token.isActive as boolean
                session.user.isAdmin = token.isAdmin as boolean
                session.user.accessibleHotels = token.accessibleHotels as AccessibleHotel[]
                session.user.hasPendingActivation = token.hasPendingActivation as boolean || false
            }
            return session
        },
        async signIn({ user, account, profile }) {
            // Auto-create user record if not exists
            if (!user.email) return false

            try {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email }
                })

                if (!existingUser) {
                    // Create new user with viewer role
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || null,
                            image: user.image || null,
                            role: user.email === ADMIN_EMAIL ? 'super_admin' : 'viewer',
                            is_active: true,
                        }
                    })
                    serverLog.info(`Created new user: ${user.email}`)
                    // Fire-and-forget Telegram notification
                    notifyNewUser(user.email, user.name || null);
                }
            } catch (error) {
                serverLog.error('Error in signIn callback:', error)
                // Allow sign-in even if DB write fails (handle in middleware)
            }

            return true
        },
    },
    pages: {
        signIn: "/auth/login",
    },
    session: {
        strategy: "jwt",
    },
})

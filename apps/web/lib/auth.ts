import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import prisma from "./prisma"
import { UserRole } from "@prisma/client"

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

            // Only fetch from DB on initial sign in (not every request)
            // This avoids edge runtime issues
            if (account && token.email) {
                try {


                    // Step 1: Find user
                    const user = await prisma.user.findUnique({
                        where: { email: token.email as string },
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            is_active: true,
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

                        // Step 2: Find hotel assignments separately
                        console.log(`[AUTH] JWT Callback - Existing User: ${user.email}, Role: ${user.role}, IsActive: ${user.is_active}, IsAdmin: ${token.isAdmin}`)

                        const hotelUsers = await prisma.hotelUser.findMany({
                            where: { user_id: user.id },
                            select: {
                                hotel_id: true,
                                role: true,
                                is_primary: true,
                            }
                        })



                        // Step 3: Get hotel names
                        const hotelIds = hotelUsers.map(hu => hu.hotel_id)
                        const hotels = await prisma.hotel.findMany({
                            where: { hotel_id: { in: hotelIds } },
                            select: { hotel_id: true, name: true }
                        })

                        const hotelMap = new Map(hotels.map(h => [h.hotel_id, h.name]))

                        // Map to accessibleHotels
                        token.accessibleHotels = hotelUsers.map(hu => ({
                            hotelId: hu.hotel_id,
                            hotelName: hotelMap.get(hu.hotel_id) || 'Unknown Hotel',
                            role: hu.role,
                            isPrimary: hu.is_primary,
                        }))

                        // NOTE: Removed AUTO-ASSIGN Demo Hotel logic
                        // Users with 0 hotels will now be redirected to /welcome by middleware


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
                        console.log(`[AUTH] Created New User: ${newUser.email}, ID: ${newUser.id} - No hotel assigned, will redirect to /welcome`)

                        // Set token values - NO hotels assigned
                        token.userId = newUser.id
                        token.role = 'viewer'
                        token.isActive = true
                        token.isAdmin = token.email === ADMIN_EMAIL
                        token.accessibleHotels = [] // Empty - triggers /welcome redirect
                    }
                } catch (error) {
                    console.error('[AUTH] ERROR in JWT callback:', error)
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
                    console.log(`Created new user: ${user.email}`)
                }
            } catch (error) {
                console.error('Error in signIn callback:', error)
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

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

            // Always fetch fresh user data from DB (for role changes)
            if (token.email) {
                try {
                    const user = await prisma.user.findUnique({
                        where: { email: token.email as string },
                        include: {
                            hotel_users: {
                                include: {
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
                        token.isAdmin = user.role === 'super_admin'

                        // Map HotelUser records to accessible hotels
                        token.accessibleHotels = user.hotel_users.map(hu => ({
                            hotelId: hu.hotel_id,
                            hotelName: hu.hotel.name,
                            role: hu.role,
                            isPrimary: hu.is_primary,
                        }))
                    } else {
                        // User exists in NextAuth but not in our DB yet
                        // This happens on first OAuth sign-in
                        token.role = 'viewer'
                        token.isActive = true
                        token.isAdmin = token.email === ADMIN_EMAIL
                        token.accessibleHotels = []
                    }
                } catch (error) {
                    console.error('Error fetching user data in JWT callback:', error)
                    // Fallback for edge runtime or DB errors
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

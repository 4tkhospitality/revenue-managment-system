import { UserRole } from "@prisma/client"

// Types for accessible hotels
export interface AccessibleHotel {
    hotelId: string
    hotelName: string
    role: UserRole
    isPrimary: boolean
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name?: string | null
            image?: string | null
            role: UserRole
            isActive: boolean
            isAdmin: boolean
            accessibleHotels: AccessibleHotel[]
        }
    }
    interface User {
        role?: UserRole
        isActive?: boolean
        isAdmin?: boolean
        accessibleHotels?: AccessibleHotel[]
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        userId?: string
        role?: UserRole
        isActive?: boolean
        isAdmin?: boolean
        accessibleHotels?: AccessibleHotel[]
    }
}

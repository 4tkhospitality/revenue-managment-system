// V01.2: Seed default OTA channels for a hotel
import prisma from '@/lib/prisma';

// CalcType as string literal (matches Prisma enum)
type CalcTypeValue = 'PROGRESSIVE' | 'ADDITIVE';

const DEFAULT_OTA_CHANNELS = [
    {
        name: 'Agoda',
        code: 'agoda',
        commission: 20,
        calc_type: 'ADDITIVE' as CalcTypeValue, // Cộng dồn
        is_active: true,
    },
    {
        name: 'Booking.com',
        code: 'booking',
        commission: 18,
        calc_type: 'PROGRESSIVE' as CalcTypeValue, // Lũy tiến
        is_active: true,
    },
    {
        name: 'Traveloka',
        code: 'traveloka',
        commission: 15,
        calc_type: 'ADDITIVE' as CalcTypeValue, // Cộng dồn (đã research: flat rate ~15%)
        is_active: true,
    },
    {
        name: 'Expedia',
        code: 'expedia',
        commission: 17,
        calc_type: 'PROGRESSIVE' as CalcTypeValue, // Lũy tiến
        is_active: true,
    },
    {
        name: 'CTRIP',
        code: 'ctrip',
        commission: 18,
        calc_type: 'ADDITIVE' as CalcTypeValue, // Cộng dồn (Trip.com)
        is_active: true,
    },
];


/**
 * Seed default OTA channels for a hotel
 * Only creates if not already exists (upsert by name)
 */
export async function seedDefaultOTAChannels(hotelId: string): Promise<number> {
    let created = 0;

    for (const channel of DEFAULT_OTA_CHANNELS) {
        // Check if already exists
        const existing = await prisma.oTAChannel.findFirst({
            where: {
                hotel_id: hotelId,
                name: channel.name,
            },
        });

        if (!existing) {
            await prisma.oTAChannel.create({
                data: {
                    hotel_id: hotelId,
                    name: channel.name,
                    code: channel.code,
                    commission: channel.commission,
                    calc_type: channel.calc_type,
                    is_active: channel.is_active,
                },
            });
            created++;
        }
    }

    return created;
}

/**
 * Check if hotel has any OTA channels
 */
export async function hasOTAChannels(hotelId: string): Promise<boolean> {
    const count = await prisma.oTAChannel.count({
        where: { hotel_id: hotelId },
    });
    return count > 0;
}

/**
 * Default Agoda campaigns to seed (common promotions)
 * Based on pricing-structure-system repository
 */
const DEFAULT_AGODA_CAMPAIGNS = [
    {
        promo_id: 'agoda-targeted-vip-silver',
        discount_pct: 5,
        is_active: true,
    },
    {
        promo_id: 'agoda-essential-early-bird',
        discount_pct: 10,
        is_active: true,
    },
    {
        promo_id: 'agoda-targeted-mobile',
        discount_pct: 8,
        is_active: true,
    },
];

/**
 * Seed default campaigns for Agoda OTA channel
 */
export async function seedDefaultAgodaCampaigns(hotelId: string, agodaChannelId: string): Promise<number> {
    let created = 0;

    for (const campaign of DEFAULT_AGODA_CAMPAIGNS) {
        // Check if promo exists in catalog
        const promoExists = await prisma.promotionCatalog.findUnique({
            where: { id: campaign.promo_id },
        });

        if (!promoExists) {
            console.log(`[Pricing] Promo ${campaign.promo_id} not found in catalog, skipping`);
            continue;
        }

        // Check if campaign already exists
        const existing = await prisma.campaignInstance.findFirst({
            where: {
                hotel_id: hotelId,
                ota_channel_id: agodaChannelId,
                promo_id: campaign.promo_id,
            },
        });

        if (!existing) {
            await prisma.campaignInstance.create({
                data: {
                    hotel_id: hotelId,
                    ota_channel_id: agodaChannelId,
                    promo_id: campaign.promo_id,
                    discount_pct: campaign.discount_pct,
                    is_active: campaign.is_active,
                },
            });
            created++;
        }
    }

    return created;
}

/**
 * Initialize pricing for hotel (call on first access)
 */
export async function initializePricingForHotel(hotelId: string): Promise<{
    otaChannelsCreated: number;
    agodaCampaignsCreated: number;
}> {
    const otaChannelsCreated = await seedDefaultOTAChannels(hotelId);

    // Find Agoda channel and seed default campaigns
    let agodaCampaignsCreated = 0;
    const agodaChannel = await prisma.oTAChannel.findFirst({
        where: {
            hotel_id: hotelId,
            code: 'agoda',
        },
    });

    if (agodaChannel) {
        agodaCampaignsCreated = await seedDefaultAgodaCampaigns(hotelId, agodaChannel.id);
    }

    return { otaChannelsCreated, agodaCampaignsCreated };
}

/**
 * Seed Demo Hotel (for new users without hotel assignment)
 * Returns the hotel_id of the demo hotel
 */
export async function seedDemoHotel(): Promise<string> {
    const DEMO_HOTEL_NAME = 'Demo Hotel';

    let demoHotel = await prisma.hotel.findFirst({
        where: { name: DEMO_HOTEL_NAME },
    });

    if (!demoHotel) {
        demoHotel = await prisma.hotel.create({
            data: {
                name: DEMO_HOTEL_NAME,
                timezone: 'Asia/Ho_Chi_Minh',
                capacity: 50,
                currency: 'VND',
            },
        });
        console.log('[Seed] Created Demo Hotel:', demoHotel.hotel_id);

        // Initialize OTA channels for demo hotel
        await initializePricingForHotel(demoHotel.hotel_id);
        console.log('[Seed] Initialized OTA channels for Demo Hotel');
    }

    return demoHotel.hotel_id;
}

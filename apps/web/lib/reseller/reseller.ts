// ════════════════════════════════════════════════════════════════════
// Reseller — CRUD + Ref Code Generation
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';

/**
 * Generate a unique 6-char ref code: RES + 3 random uppercase chars
 */
function generateRefCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'RES';
    for (let i = 0; i < 3; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export async function createReseller(data: {
    name: string;
    email: string;
    phone?: string;
}) {
    // Generate unique ref_code with retry
    let refCode = generateRefCode();
    let attempts = 0;
    while (attempts < 5) {
        const existing = await prisma.reseller.findUnique({ where: { ref_code: refCode } });
        if (!existing) break;
        refCode = generateRefCode();
        attempts++;
    }

    return prisma.reseller.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            ref_code: refCode,
        },
    });
}

export async function getReseller(id: string) {
    return prisma.reseller.findUnique({
        where: { id },
        include: {
            attributions: { include: { hotel: { select: { name: true } } } },
            contracts: { where: { is_active: true } },
            _count: { select: { promo_codes: true } },
        },
    });
}

export async function getResellerByRefCode(refCode: string) {
    return prisma.reseller.findUnique({
        where: { ref_code: refCode },
    });
}

export async function listResellers() {
    return prisma.reseller.findMany({
        include: {
            _count: { select: { attributions: true, promo_codes: true } },
        },
        orderBy: { created_at: 'desc' },
    });
}

export async function updateReseller(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    is_active?: boolean;
}) {
    return prisma.reseller.update({ where: { id }, data });
}

export async function deleteReseller(id: string) {
    // Soft-delete: deactivate instead of hard-delete to preserve referential integrity
    return prisma.reseller.update({
        where: { id },
        data: { is_active: false },
    });
}

/**
 * Payment Constants
 * Pricing configuration for subscription tiers × room bands
 * Supports VND (SePay) and USD (PayPal)
 */

import { PlanTier, RoomBand } from '@prisma/client';

// ── VND Pricing (SePay) ─────────────────────────────────────────────
// Re-export from plan-config.ts — single source of truth
export { BASE_PRICE, BAND_MULTIPLIER, getPrice } from '@/lib/plg/plan-config';

// ── USD Pricing (PayPal) ────────────────────────────────────────────
// Monthly USD prices per tier (base band R30)
export const BASE_PRICE_USD: Record<PlanTier, number> = {
    STANDARD: 0,
    SUPERIOR: 39,
    DELUXE: 79,
    SUITE: 139,
};

// Same band multipliers apply for USD
export function getPriceUSD(plan: PlanTier, band: RoomBand): number {
    const { BAND_MULTIPLIER } = require('@/lib/plg/plan-config');
    const raw = BASE_PRICE_USD[plan] * BAND_MULTIPLIER[band];
    return Math.round(raw * 100) / 100; // Round to 2 decimal places (cents)
}

// ── PayPal Plan IDs ─────────────────────────────────────────────────
// Map tier+band to PayPal plan IDs (set in dashboard / API)
// Format: { "SUPERIOR_R30": "P-XXXXXX", ... }
// Populated from env or hardcoded after PayPal plan creation
export const PAYPAL_PLAN_IDS: Record<string, string> = {};

export function getPayPalPlanId(plan: PlanTier, band: RoomBand): string | null {
    const key = `${plan}_${band}`;
    return process.env[`PAYPAL_PLAN_${key}`] || PAYPAL_PLAN_IDS[key] || null;
}

// ── Amount Comparison (GLC-06) ──────────────────────────────────────
/**
 * Compare payment amounts normalized to minor units (integer).
 * VND: integer compare (no decimals)
 * USD: compare in cents (×100, round)
 */
export function compareAmount(
    dbAmount: number,
    webhookAmount: number,
    currency: string
): boolean {
    if (currency === 'VND') {
        return Math.round(dbAmount) === Math.round(webhookAmount);
    }
    if (currency === 'USD') {
        const dbCents = Math.round(dbAmount * 100);
        const webhookCents = Math.round(webhookAmount * 100);
        return dbCents === webhookCents;
    }
    return false;
}

// ── Order ID Generator ──────────────────────────────────────────────
export function generateOrderId(hotelId: string): string {
    return `RMS-${hotelId.slice(0, 8)}-${Date.now()}`;
}

// ── PENDING Expiry Duration ─────────────────────────────────────────
export const PENDING_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

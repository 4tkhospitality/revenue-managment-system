export const LADDER_STEPS = [-0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20];

export const LadderUtils = {
    applyLadder: (basePrice: number): number[] => {
        // Return distinct, positive prices
        const prices = LADDER_STEPS.map(pct => basePrice * (1 + pct));
        return Array.from(new Set(prices.filter(p => p > 0).map(p => Math.ceil(p))));
        // V01: Math.ceil to avoid decimals for now, can refine Rounding later.
    },

    roundPrice: (price: number): number => {
        // V01 Rounding Rule: Integer 
        return Math.round(price);
    }
};

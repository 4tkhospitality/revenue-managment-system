import { LadderUtils } from './ladder';

export const PricingLogic = {
    optimize: (
        currentPrice: number,
        remainingDemand: number,
        remainingSupply: number
    ) => {
        // Guards
        const safeDemand = Math.max(0, remainingDemand);
        const safeSupply = Math.max(0, remainingSupply);

        if (safeSupply <= 0) {
            return {
                recommendedPrice: null,
                expectedRevenue: 0,
                explanation: JSON.stringify({ stop_sell: true, reason: 'No Supply' })
            };
        }

        const candidates = LadderUtils.applyLadder(currentPrice);
        let bestPrice = currentPrice;
        let maxRevenue = -1;

        candidates.forEach(price => {
            // For V01, we assume Demand is fixed regardless of price (Simplification? Or Elasticity?)
            // "expected_sales = min(remaining_demand, remaining_supply)" implied rigid demand.
            // If we want curve, we need elasticity.
            // Plan says: "expected_sales = min(remaining_demand, remaining_supply)"
            // This implies Revenue = Price * Constant Sales. -> Always Highest Price wins.
            // WAIT. This logic is flawed if Demand is constant.
            // However, "Remaining Demand" usually implies "Willingness to buy".
            // If we assume standard RMS logic, lower price captures MORE demand.
            // But for V01 Heuristic, Plan says: min(demand, supply).
            // If Demand is 5, Supply is 10. Sales = 5. Price = 100 -> Rev 500. Price = 120 -> Rev 600.
            // This will always recommend +20%.
            // UNLESS: Demand is price sensitive? 
            // "Requirement 1: Rule-based pricing engine"
            // Let's stick to the Plan's literal formula BUT acknowledge it biases high price.
            // Maybe "remaining_demand" is "Demand AT Current Price"?
            // Refinement: Ideally apply a small elasticity factor?
            // V01 Policy: Stick to plan. It acts as "Yield Management" - if we have demand, raise price.

            const expectedSales = Math.min(safeDemand, safeSupply);
            const revenue = price * expectedSales;

            if (revenue > maxRevenue) {
                maxRevenue = revenue;
                bestPrice = price;
            }
        });

        // Rounding
        bestPrice = LadderUtils.roundPrice(bestPrice);

        const upliftPct = currentPrice > 0 ? (bestPrice - currentPrice) / currentPrice : 0;

        return {
            recommendedPrice: bestPrice,
            expectedRevenue: maxRevenue,
            upliftPct,
            explanation: JSON.stringify({
                demand: safeDemand,
                supply: safeSupply,
                candidates_count: candidates.length,
                strategy: 'maximize_revenue_v01'
            })
        };
    }
};

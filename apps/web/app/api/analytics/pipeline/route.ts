import { NextRequest, NextResponse } from 'next/server';
import { buildCancelStats } from '../../../actions/buildCancelStats';
import { buildFeatures } from '../../../actions/buildFeatures';
import { buildDailyOTB } from '../../../actions/buildDailyOTB';
import { runForecast } from '../../../actions/runForecast';
import { runPricingEngine } from '../../../actions/runPricingEngine';

/**
 * POST /api/analytics/pipeline
 * Executes a single pipeline step. Called sequentially by FullPipelineButton.
 */
export async function POST(req: NextRequest) {
    try {
        const { hotelId, asOfDate, action } = await req.json();

        if (!hotelId || !action) {
            return NextResponse.json({ error: 'Missing hotelId or action' }, { status: 400 });
        }

        const asOf = asOfDate ? new Date(asOfDate) : new Date();
        let result: any;

        switch (action) {
            case 'buildOTB':
                result = await buildDailyOTB({ hotelId, asOfTs: asOf });
                break;
            case 'buildCancelStats':
                result = await buildCancelStats(hotelId);
                break;
            case 'buildFeatures':
                result = await buildFeatures(hotelId, asOf);
                break;
            case 'runForecast':
                result = await runForecast(hotelId, asOf);
                break;
            case 'runPricing':
                result = await runPricingEngine(hotelId, asOf);
                break;
            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, action, result });
    } catch (error: any) {
        console.error(`[pipeline/${(await req.clone().json()).action}]`, error?.message);
        return NextResponse.json({ error: error?.message || 'Pipeline step failed' }, { status: 500 });
    }
}

/**
 * /daily — DEPRECATED (Release 1)
 * Redirects to Dashboard Pricing Quick Mode.
 * Preserves ?date= param as &asOf= (L8).
 * Will be fully deleted in Release 2 after 0-traffic verified.
 */
import { redirect } from 'next/navigation';

export default async function DailyPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const params = await searchParams;
    const asOfParam = params.date ? `&asOf=${params.date}` : '';
    redirect(`/dashboard?tab=pricing&mode=quick${asOfParam}`);
}

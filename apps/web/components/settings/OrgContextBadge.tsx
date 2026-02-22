'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, Hotel, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface OrgData {
    org: { id: string; name: string; slug: string | null };
    hotels: { count: number; maxProperties: number };
    members: { count: number; maxUsers: number };
    subscription: { plan: string; roomBand: string; status: string };
}

export function OrgContextBadge({ hotelId }: { hotelId?: string }) {
    const [data, setData] = useState<OrgData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = hotelId ? `/api/organization?hotelId=${hotelId}` : '/api/organization';
        fetch(url)
            .then((r) => r.json())
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [hotelId]);

    if (loading) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-pulse flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                <span className="text-sm text-slate-400">Loading organization info...</span>
            </div>
        );
    }

    if (!data?.org) return null;

    const isSuite = data.subscription.plan === 'SUITE';
    const formatLimit = (n: number) => (n === 0 ? '∞' : n.toString());

    return (
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{data.org.name}</h3>
                    <p className="text-xs text-gray-500">Organization</p>
                </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                    <Hotel className="w-4 h-4" />
                    Hotels: {data.hotels.count}/{formatLimit(data.hotels.maxProperties)}
                </span>
                <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Members: {data.members.count}/{formatLimit(data.members.maxUsers)}
                </span>
            </div>
            {isSuite && (
                <Link
                    href="/settings/team"
                    className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Manage Organization →
                </Link>
            )}
        </div>
    );
}

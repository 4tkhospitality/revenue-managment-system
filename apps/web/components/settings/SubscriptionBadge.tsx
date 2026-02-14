'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CreditCard, ArrowUpRight, Loader2, Wrench } from 'lucide-react';
import Link from 'next/link';

interface SubData {
    plan: string;
    effectivePlan: string;
    roomBand: string;
    price: number;
    hotelCapacity: number;
    derivedBand: string;
    isTrialActive: boolean;
    trialDaysRemaining: number;
}

const PLAN_COLORS: Record<string, string> = {
    STANDARD: '#22c55e',
    SUPERIOR: '#3b82f6',
    DELUXE: '#a855f7',
    SUITE: '#eab308',
};

const PLAN_LABELS: Record<string, string> = {
    STANDARD: 'Starter',
    SUPERIOR: 'Superior',
    DELUXE: 'Deluxe',
    SUITE: 'Suite',
};

const BAND_LABELS: Record<string, string> = {
    R30: '≤ 30 phòng',
    R80: '31–80 phòng',
    R150: '81–150 phòng',
    R300P: '151–300+ phòng',
};

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export function SubscriptionBadge({ hotelId }: { hotelId?: string }) {
    const { data: session } = useSession();
    const [data, setData] = useState<SubData | null>(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = !!(session?.user as { isAdmin?: boolean })?.isAdmin;

    useEffect(() => {
        const url = hotelId ? `/api/subscription?hotelId=${hotelId}` : '/api/subscription';
        fetch(url)
            .then((r) => r.json())
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [hotelId]);

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-400">Đang tải gói dịch vụ...</span>
            </div>
        );
    }

    if (!data) return null;

    const color = PLAN_COLORS[data.plan] ?? '#6b7280';
    const label = PLAN_LABELS[data.plan] ?? data.plan;
    const bandLabel = BAND_LABELS[data.roomBand] ?? data.roomBand;
    const isCompliant = data.derivedBand === data.roomBand || !data.derivedBand;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Gói hiện tại</h3>
            </div>

            <div className="flex items-center gap-3 mb-2">
                <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                >
                    {label}
                </span>
                <span className="text-sm text-gray-600">
                    Band: {data.roomBand} ({bandLabel})
                </span>
            </div>

            {data.plan !== 'STANDARD' && (
                <p className="text-lg font-semibold text-gray-900 mb-1">
                    {formatVND(data.price)}₫<span className="text-sm font-normal text-gray-500">/tháng</span>
                </p>
            )}

            {data.isTrialActive && (
                <p className="text-sm text-amber-600 font-medium mb-2">
                    🎁 Trial: còn {data.trialDaysRemaining} ngày
                </p>
            )}

            {!isCompliant && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    {isAdmin
                        ? `ℹ️ Hotel ${data.hotelCapacity} phòng → nên dùng band ${data.derivedBand}. Chỉnh tại PLG Admin.`
                        : `⚠️ Capacity (${data.hotelCapacity} phòng) vượt band ${data.roomBand}. Liên hệ quản trị viên.`
                    }
                </div>
            )}

            {!isAdmin && (
                <Link
                    href="/pricing-plans"
                    className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Xem bảng giá <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
            )}
        </div>
    );
}

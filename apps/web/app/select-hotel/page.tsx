'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel';

export default function SelectHotelPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [selecting, setSelecting] = useState<string | null>(null);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const accessibleHotels = session?.user?.accessibleHotels || [];

    const handleSelectHotel = async (hotelId: string) => {
        setSelecting(hotelId);

        try {
            const res = await fetch('/api/user/switch-hotel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hotelId }),
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                alert('Không thể chọn khách sạn. Vui lòng thử lại.');
                setSelecting(null);
            }
        } catch (error) {
            console.error('Error selecting hotel:', error);
            setSelecting(null);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'hotel_admin':
                return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">Admin</span>;
            case 'manager':
                return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Manager</span>;
            case 'viewer':
                return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">Viewer</span>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-3">🏨</div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Chọn khách sạn
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Bạn có quyền truy cập {accessibleHotels.length} khách sạn.
                        Chọn một khách sạn để tiếp tục.
                    </p>
                </div>

                <div className="space-y-3">
                    {accessibleHotels.map((hotel) => (
                        <button
                            key={hotel.hotelId}
                            onClick={() => handleSelectHotel(hotel.hotelId)}
                            disabled={selecting !== null}
                            className={`w-full p-4 border rounded-lg text-left transition-all ${selecting === hotel.hotelId
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                } ${selecting !== null && selecting !== hotel.hotelId ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                                        {hotel.hotelName}
                                        {hotel.isPrimary && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1">
                                        {getRoleBadge(hotel.role)}
                                    </div>
                                </div>
                                {selecting === hotel.hotelId ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {accessibleHotels.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        Không tìm thấy khách sạn nào.
                    </div>
                )}
            </div>
        </div>
    );
}

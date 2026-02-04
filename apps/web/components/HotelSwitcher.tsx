'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel';

interface HotelOption {
    hotelId: string;
    hotelName: string;
    role: string;
    isPrimary: boolean;
}

export function HotelSwitcher() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
    const [switching, setSwitching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const accessibleHotels = session?.user?.accessibleHotels || [];

    useEffect(() => {
        // Get active hotel from cookie
        const fetchActiveHotel = async () => {
            try {
                const res = await fetch('/api/user/switch-hotel');
                const data = await res.json();
                setActiveHotelId(data.activeHotelId);
            } catch (error) {
                console.error('Error fetching active hotel:', error);
            }
        };
        fetchActiveHotel();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const switchHotel = async (hotelId: string) => {
        if (hotelId === activeHotelId) {
            setIsOpen(false);
            return;
        }

        setSwitching(true);
        try {
            const res = await fetch('/api/user/switch-hotel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hotelId }),
            });

            if (res.ok) {
                setActiveHotelId(hotelId);
                setIsOpen(false);
                router.refresh();
            }
        } catch (error) {
            console.error('Error switching hotel:', error);
        } finally {
            setSwitching(false);
        }
    };

    // Super admin or single hotel - don't show switcher
    if (session?.user?.isAdmin || accessibleHotels.length <= 1) {
        const hotelName = accessibleHotels[0]?.hotelName || 'All Hotels';
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                <span className="text-gray-500">🏨</span>
                <span className="font-medium text-gray-700">{hotelName}</span>
                {session?.user?.isAdmin && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs">Admin</span>
                )}
            </div>
        );
    }

    const activeHotel = accessibleHotels.find(h => h.hotelId === activeHotelId);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            >
                <span className="text-gray-500">🏨</span>
                <span className="font-medium text-gray-700">
                    {activeHotel?.hotelName || 'Chọn Hotel'}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                        Chọn khách sạn
                    </div>
                    {accessibleHotels.map((hotel) => (
                        <button
                            key={hotel.hotelId}
                            onClick={() => switchHotel(hotel.hotelId)}
                            disabled={switching}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${hotel.hotelId === activeHotelId ? 'bg-blue-50' : ''
                                }`}
                        >
                            <div>
                                <div className="font-medium text-gray-900 text-sm">{hotel.hotelName}</div>
                                <div className="text-xs text-gray-500">
                                    {hotel.role === 'hotel_admin' ? 'Admin' : hotel.role === 'manager' ? 'Manager' : 'Viewer'}
                                    {hotel.isPrimary && ' • Primary'}
                                </div>
                            </div>
                            {hotel.hotelId === activeHotelId && (
                                <span className="text-blue-600">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

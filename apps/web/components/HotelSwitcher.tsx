'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';

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
    const [allHotels, setAllHotels] = useState<{ id: string; name: string }[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAdmin = session?.user?.isAdmin === true;
    const accessibleHotels: HotelOption[] = session?.user?.accessibleHotels || [];

    // Get active hotel from cookie
    useEffect(() => {
        const fetchActiveHotel = async () => {
            try {
                const res = await fetch('/api/user/switch-hotel', { credentials: 'include' });
                const data = await res.json();
                setActiveHotelId(data.activeHotelId);
            } catch (error) {
                console.error('Error fetching active hotel:', error);
            }
        };
        fetchActiveHotel();
    }, []);

    // Super Admin: fetch all hotels
    useEffect(() => {
        if (!isAdmin) return;

        const fetchAllHotels = async () => {
            try {
                const res = await fetch('/api/admin/hotels', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setAllHotels(data.hotels || []);
                }
            } catch (error) {
                console.error('Error fetching all hotels:', error);
            }
        };
        fetchAllHotels();
    }, [isAdmin]);

    // Close on outside click
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
                credentials: 'include',
            });

            if (res.ok) {
                setActiveHotelId(hotelId);
                setIsOpen(false);
                // Force full page reload to ensure all client components get fresh data
                window.location.reload();
            }
        } catch (error) {
            console.error('Error switching hotel:', error);
        } finally {
            setSwitching(false);
        }
    };

    // Build hotel list depending on role
    const hotelList: { id: string; name: string; role?: string; isPrimary?: boolean }[] = isAdmin
        ? allHotels.map(h => ({ id: h.id, name: h.name }))
        : accessibleHotels.map(h => ({ id: h.hotelId, name: h.hotelName, role: h.role, isPrimary: h.isPrimary }));

    // Single hotel non-admin: show compact badge
    if (!isAdmin && hotelList.length <= 1) {
        const hotelName = accessibleHotels[0]?.hotelName || 'Dashboard';
        const userRole = accessibleHotels[0]?.role || 'viewer';
        const roleLabel = userRole === 'hotel_admin' ? 'Admin' : userRole === 'manager' ? 'Manager' : 'Viewer';
        return (
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white/10 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><Building2 className="w-4 h-4 text-blue-300" /></div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{hotelName}</div>
                    <div className="text-xs text-white/50">{roleLabel}</div>
                </div>
            </div>
        );
    }

    // Find active hotel name for display
    const activeHotel = hotelList.find(h => h.id === activeHotelId);
    const activeHotelName = activeHotel?.name || 'Chọn Hotel';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger button — dark sidebar style */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl transition-colors text-left"
            >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-blue-300" /></div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{activeHotelName}</div>
                    <div className="text-xs text-white/50 flex items-center gap-1">
                        {isAdmin ? (
                            <span className="text-rose-300">Super Admin</span>
                        ) : (
                            <span>{activeHotel?.role === 'hotel_admin' ? 'Admin' : activeHotel?.role === 'manager' ? 'Manager' : 'Viewer'}</span>
                        )}
                        <span>• {hotelList.length} KS</span>
                    </div>
                </div>
                <svg className={`w-4 h-4 text-white/40 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown — dark theme matching sidebar */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1d36] border border-white/10 rounded-xl shadow-2xl z-50 py-1 max-h-64 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-white/40 border-b border-white/5">
                        {isAdmin ? `Tất cả khách sạn (${hotelList.length})` : 'Khách sạn của bạn'}
                    </div>
                    {hotelList.map((hotel) => {
                        const isActive = hotel.id === activeHotelId;
                        return (
                            <button
                                key={hotel.id}
                                onClick={() => switchHotel(hotel.id)}
                                disabled={switching}
                                className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition-colors ${isActive
                                    ? 'bg-blue-500/20'
                                    : 'hover:bg-white/5'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-blue-400' : 'bg-white/20'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-white/80'}`}>
                                        {hotel.name}
                                    </div>
                                    {hotel.role && (
                                        <div className="text-xs text-white/40">
                                            {hotel.role === 'hotel_admin' ? 'Admin' : hotel.role === 'manager' ? 'Manager' : 'Viewer'}
                                            {hotel.isPrimary && ' • Primary'}
                                        </div>
                                    )}
                                </div>
                                {isActive && (
                                    <span className="text-blue-400 text-xs flex-shrink-0">✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

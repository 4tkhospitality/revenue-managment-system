'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Upload, Database, Settings, BookOpen, Shield, Menu, X, LogOut, DollarSign, BarChart3, TrendingUp, CalendarCheck, Crown, Lock } from 'lucide-react';
import { HotelSwitcher } from '@/components/HotelSwitcher';

// Role levels for permission checks
const ROLE_LEVELS: Record<string, number> = {
    viewer: 0,
    manager: 1,
    hotel_admin: 2,
    super_admin: 3,
};

// Tier hierarchy for comparison
const TIER_LEVELS: Record<string, number> = {
    STANDARD: 0,
    SUPERIOR: 1,
    DELUXE: 2,
    SUITE: 3,
};

const TIER_DISPLAY: Record<string, string> = {
    SUPERIOR: 'Superior',
    DELUXE: 'Deluxe',
    SUITE: 'Suite',
};

// Navigation groups with items
const navGroups = [
    {
        id: 'overview',
        label: 'Tổng quan - Phân tích',
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'viewer' },
            { href: '/analytics', label: 'Pace & Pickup', icon: TrendingUp, minRole: 'viewer', requiredTier: 'SUPERIOR' as const },
        ],
    },
    {
        id: 'pricing',
        label: 'Định giá',
        items: [
            { href: '/pricing', label: 'Tính giá OTA', icon: DollarSign, minRole: 'viewer' },
            { href: '/daily', label: 'Daily Actions', icon: CalendarCheck, minRole: 'viewer', requiredTier: 'SUPERIOR' as const },
            { href: '/rate-shopper', label: 'So sánh giá', icon: BarChart3, minRole: 'viewer', requiredTier: 'SUITE' as const },
        ],
    },
    {
        id: 'data',
        label: 'Quản lý dữ liệu',
        items: [
            { href: '/upload', label: 'Tải lên', icon: Upload, minRole: 'manager', requiredTier: 'SUPERIOR' as const },
            { href: '/data', label: 'Dữ liệu', icon: Database, minRole: 'manager', requiredTier: 'SUPERIOR' as const },
        ],
    },
    {
        id: 'system',
        label: 'Hệ thống',
        items: [
            { href: '/settings', label: 'Cài đặt', icon: Settings, minRole: 'hotel_admin', hideForDemo: true },
            { href: '/guide', label: 'Hướng dẫn', icon: BookOpen, minRole: 'viewer' },
            { href: '/pricing-plans', label: 'Nâng cấp', icon: Crown, minRole: 'viewer' },
        ],
    },
];

// Brand blue from logo - exact color match
const LOGO_BLUE = '#204184';

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<string>('STANDARD');

    // Get user's role level (hotelRole is dynamically added at runtime from hotel_access)
    const userRole = (session?.user as { hotelRole?: string })?.hotelRole || session?.user?.role || 'viewer';
    const userRoleLevel = ROLE_LEVELS[userRole] ?? 0;
    const isAdmin = session?.user?.isAdmin;

    // Check if user has permission for an item
    const hasPermission = (minRole: string) => {
        if (isAdmin) return true;
        const requiredLevel = ROLE_LEVELS[minRole] ?? 0;
        return userRoleLevel >= requiredLevel;
    };

    // Get role display name for tooltip
    const getRoleName = (role: string) => {
        switch (role) {
            case 'manager': return 'Manager';
            case 'hotel_admin': return 'Hotel Admin';
            case 'super_admin': return 'Super Admin';
            default: return role;
        }
    };

    // Check if Demo Hotel + fetch subscription plan
    useEffect(() => {
        const checkDemoHotel = async () => {
            try {
                const res = await fetch('/api/is-demo-hotel');
                const data = await res.json();
                setIsDemo(data.isDemo || false);
            } catch (error) {
                console.error('Error checking demo hotel:', error);
            }
        };
        const fetchPlan = async () => {
            try {
                const res = await fetch('/api/subscription');
                if (res.ok) {
                    const data = await res.json();
                    setCurrentPlan(data.plan || 'STANDARD');
                }
            } catch { /* keep default */ }
        };
        checkDemoHotel();
        fetchPlan();
    }, []);

    // Close sidebar when route changes (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Close sidebar on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <>
            {/* Mobile Header Bar */}
            <div
                className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/10"
                style={{ backgroundColor: LOGO_BLUE }}
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <Image
                    src="/logo.jpg"
                    alt="4TK Hospitality"
                    width={120}
                    height={40}
                    className="object-contain"
                    style={{ maxHeight: '40px' }}
                    unoptimized
                    priority
                />
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-white/10 z-50
                    transition-transform duration-300 ease-in-out
                    lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{ backgroundColor: LOGO_BLUE }}
            >
                {/* Logo Section - Hidden on mobile (shown in header instead) */}
                <div
                    className="hidden lg:flex items-center justify-center p-4"
                    style={{ minHeight: '120px' }}
                >
                    <Image
                        src="/logo.jpg"
                        alt="4TK Hospitality"
                        width={180}
                        height={180}
                        className="object-contain"
                        style={{ maxHeight: '100px' }}
                        unoptimized
                        priority
                    />
                </div>

                {/* Mobile: Close button and spacer */}
                <div className="lg:hidden flex items-center justify-between px-4 py-4">
                    <span className="text-white font-medium">Menu</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-white hover:bg-white/10 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Hotel Switcher */}
                <div className="px-4 pb-4">
                    <HotelSwitcher />
                </div>

                {/* Navigation with Groups */}
                <nav className="flex-1 py-2 overflow-y-auto">
                    {navGroups.map((group, groupIndex) => {
                        // Filter items based on Demo Hotel status
                        const visibleItems = group.items.filter(item => !isDemo || !('hideForDemo' in item && item.hideForDemo));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.id} className="mb-2">
                                {/* Group divider (except first group) */}
                                {groupIndex > 0 && (
                                    <div className="mx-4 my-3 border-t border-white/10" />
                                )}

                                {/* Group label */}
                                <div className="px-6 py-1 text-xs font-semibold text-white/50 uppercase tracking-wider">
                                    {group.label}
                                </div>

                                {/* Group items */}
                                {visibleItems.map((item) => {
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                    const Icon = item.icon;
                                    const canAccess = hasPermission(item.minRole);
                                    const needsTier = 'requiredTier' in item && item.requiredTier;
                                    const hasTier = !needsTier || (TIER_LEVELS[currentPlan] ?? 0) >= (TIER_LEVELS[needsTier as string] ?? 0);

                                    if (canAccess) {
                                        // Normal clickable item (still links to page; page handles paywall)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className="flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all duration-200 mx-2 rounded-lg"
                                                style={{
                                                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                                                    color: '#ffffff',
                                                }}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="flex-1">{item.label}</span>
                                                {needsTier && !hasTier && (
                                                    <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">
                                                        <Lock className="w-2.5 h-2.5" />
                                                        {TIER_DISPLAY[needsTier as string] || needsTier}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    } else {
                                        // Disabled item (no permission)
                                        return (
                                            <div
                                                key={item.href}
                                                className="flex items-center gap-3 px-6 py-2.5 text-sm font-medium mx-2 rounded-lg cursor-not-allowed group relative"
                                                style={{
                                                    color: 'rgba(255,255,255,0.35)',
                                                }}
                                                title={`Cần quyền ${getRoleName(item.minRole)}`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="flex-1">{item.label}</span>
                                                <Lock className="w-3.5 h-3.5 opacity-60" />

                                                {/* Tooltip on hover */}
                                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                                    Cần quyền {getRoleName(item.minRole)}
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        );
                    })}

                    {/* Admin Link - Only for super_admin */}
                    {isAdmin && (
                        <div className="mt-2">
                            <div className="mx-4 my-3 border-t border-white/10" />
                            <div className="px-6 py-1 text-xs font-semibold text-white/50 uppercase tracking-wider">
                                Quản trị
                            </div>
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all duration-200 mx-2 rounded-lg"
                                style={{
                                    backgroundColor: pathname.startsWith('/admin') ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    color: '#ffffff',
                                }}
                                onClick={() => setIsOpen(false)}
                            >
                                <Shield className="w-5 h-5" />
                                Admin Panel
                            </Link>
                        </div>
                    )}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-white/20">
                    {session?.user && (
                        <div className="mb-3">
                            <p className="text-xs text-white/90 truncate">
                                {session.user.name || session.user.email}
                            </p>
                            <p className="text-xs text-white/50 truncate">
                                {userRole !== 'viewer' && (
                                    <span className="inline-block bg-white/10 px-1.5 py-0.5 rounded text-[10px] mr-1">
                                        {getRoleName(userRole)}
                                    </span>
                                )}
                                {session.user.email}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={() => signOut({ callbackUrl: '/auth/login' })}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                    </button>
                    <p className="text-xs text-white/40 mt-3">
                        Phiên bản 1.0
                    </p>
                </div>
            </aside>
        </>
    );
}


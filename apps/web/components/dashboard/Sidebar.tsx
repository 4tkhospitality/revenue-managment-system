'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Upload, Database, Settings, BookOpen, Shield, Menu, X, LogOut, DollarSign, BarChart3, TrendingUp, CalendarCheck, Crown } from 'lucide-react';
import { HotelSwitcher } from '@/components/HotelSwitcher';

// Navigation items - Vietnamese
const navItems = [
    { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/upload', label: 'Tải lên', icon: Upload },
    { href: '/data', label: 'Dữ liệu', icon: Database },
    { href: '/pricing', label: 'Tính giá OTA', icon: DollarSign },
    { href: '/daily', label: 'Daily Actions', icon: CalendarCheck },
    { href: '/rate-shopper', label: 'So sánh giá', icon: BarChart3 },
    { href: '/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/pricing-plans', label: 'Nâng cấp', icon: Crown },
    { href: '/settings', label: 'Cài đặt', icon: Settings, hideForDemo: true },
    { href: '/guide', label: 'Hướng dẫn', icon: BookOpen },
];

// Brand blue from logo - exact color match
const LOGO_BLUE = '#204184';

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isDemo, setIsDemo] = useState(false);

    // Check if Demo Hotel
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
        checkDemoHotel();
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

    // Filter nav items based on Demo Hotel status
    const filteredNavItems = navItems.filter(item => !isDemo || !item.hideForDemo);

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

                {/* Navigation */}
                <nav className="flex-1 py-2 overflow-y-auto">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 mx-2 rounded-lg mb-1"
                                style={{
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    color: '#ffffff',
                                }}
                                onClick={() => setIsOpen(false)}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}

                    {/* Admin Link - Only for super_admin */}
                    {session?.user?.isAdmin && (

                        <Link
                            href="/admin/users"
                            className="flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 mx-2 rounded-lg mb-1 mt-4 border-t border-white/10 pt-4"
                            style={{
                                backgroundColor: pathname.startsWith('/admin') ? 'rgba(255,255,255,0.2)' : 'transparent',
                                color: '#ffffff',
                            }}
                            onClick={() => setIsOpen(false)}
                        >
                            <Shield className="w-5 h-5" />
                            Admin Panel
                        </Link>
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

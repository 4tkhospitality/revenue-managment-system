'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Upload, Database, Settings, BookOpen } from 'lucide-react';

// Navigation items - Vietnamese
const navItems = [
    { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/upload', label: 'Tải lên', icon: Upload },
    { href: '/data', label: 'Dữ liệu', icon: Database },
    { href: '/settings', label: 'Cài đặt', icon: Settings },
    { href: '/guide', label: 'Hướng dẫn', icon: BookOpen },
];

// Brand blue from logo - exact color match
const LOGO_BLUE = '#204184';
const LOGO_BLUE_DARK = '#1a3670';

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside
            className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-white/10"
            style={{ backgroundColor: LOGO_BLUE }}
        >
            {/* Logo Section - Same blue as sidebar */}
            <div
                className="flex items-center justify-center p-4"
                style={{ minHeight: '120px' }}
            >
                <Image
                    src="/logo.png"
                    alt="4TK Hospitality"
                    width={180}
                    height={180}
                    className="object-contain"
                    style={{ maxHeight: '100px' }}
                    priority
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-2">
                {navItems.map((item) => {
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
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/20">
                <p className="text-xs text-white/70">
                    4TK Revenue Management
                </p>
                <p className="text-xs mt-1 text-white/50">
                    Phiên bản 1.0
                </p>
            </div>
        </aside>
    );
}

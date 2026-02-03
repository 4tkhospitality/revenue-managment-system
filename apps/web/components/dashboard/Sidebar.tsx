'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Upload, Database } from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/data', label: 'Data Inspector', icon: Database },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <span className="text-xl font-bold text-blue-500">RMS</span>
                <span className="text-xl font-light text-slate-400 ml-1">Pro</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${isActive
                                ? 'bg-slate-800 text-blue-500 border-r-2 border-blue-500'
                                : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800/50'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <p className="text-xs text-slate-500">RMS V01 MVP</p>
            </div>
        </aside>
    );
}

import { Sidebar } from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex overflow-x-hidden">
            {/* Sidebar giữ xanh */}
            <Sidebar />

            {/* Main content nền SÁNG */}
            {/* lg:ml-64 = only add margin on desktop (>=1024px) */}
            {/* pt-14 lg:pt-0 = add top padding on mobile for fixed header */}
            <main
                className="lg:ml-64 flex-1 min-h-screen pt-14 lg:pt-0 overflow-x-hidden"
                style={{ backgroundColor: 'var(--background)' }}
            >
                {children}
            </main>
        </div>
    );
}

import { Sidebar } from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            {/* Sidebar giữ xanh */}
            <Sidebar />

            {/* Main content nền SÁNG */}
            <main
                className="ml-64 flex-1 min-h-screen"
                style={{ backgroundColor: '#F5F7FB' }}
            >
                {children}
            </main>
        </div>
    );
}


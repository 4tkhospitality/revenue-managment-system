import { Metadata } from 'next';
import { Sidebar } from '@/components/dashboard/Sidebar';

export const metadata: Metadata = {
    title: 'Daily Actions | RMS',
    description: 'Daily pricing recommendations',
};

export default function DailyLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <main
                className="lg:ml-64 flex-1 min-h-screen pt-14 lg:pt-0"
                style={{ backgroundColor: '#F5F7FB' }}
            >
                {children}
            </main>
        </div>
    );
}

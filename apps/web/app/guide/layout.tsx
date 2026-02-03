import { Sidebar } from '@/components/dashboard/Sidebar';

export default function GuideLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="ml-64">
                {children}
            </main>
        </div>
    );
}

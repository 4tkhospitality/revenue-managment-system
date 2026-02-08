'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DatePickerSnapshot } from '@/components/DatePickerSnapshot';

interface DashboardHeaderProps {
    currentAsOfDate?: string;
}

export function DashboardHeader({ currentAsOfDate }: DashboardHeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleDateChange = (date: string) => {
        // Update URL with new as_of_date
        const params = new URLSearchParams(searchParams.toString());
        params.set('as_of_date', date);
        router.push(`/dashboard?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                {currentAsOfDate && (
                    <p className="text-sm text-muted-foreground">
                        Dữ liệu OTB tính đến: {new Date(currentAsOfDate).toLocaleDateString('vi-VN')}
                    </p>
                )}
            </div>
            <DatePickerSnapshot
                onDateChange={handleDateChange}
                defaultDate={currentAsOfDate}
            />
        </div>
    );
}

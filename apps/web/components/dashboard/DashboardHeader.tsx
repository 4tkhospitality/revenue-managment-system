'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DatePickerSnapshot } from '@/components/DatePickerSnapshot';

interface DashboardHeaderProps {
    currentAsOfDate?: string;
}

/**
 * Time-travel date picker for Dashboard
 * Rendered inside PageHeader.rightContent for unified header
 */
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
        <DatePickerSnapshot
            onDateChange={handleDateChange}
            defaultDate={currentAsOfDate}
        />
    );
}

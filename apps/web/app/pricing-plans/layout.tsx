import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Upgrade | 4TK RMS',
    description: 'Choose a plan that fits your hotel',
};

export default function PricingPlansLayout({ children }: { children: React.ReactNode }) {
    return children;
}


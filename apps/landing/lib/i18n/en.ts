import { Translations } from './vi';

export const en: Translations = {
    nav: {
        howItWorks: 'How It Works',
        model: 'Model',
        technology: 'Technology',
        results: 'Results',
        faq: 'FAQ',
        cta: 'Book a Call',
    },
    hero: {
        badge: 'Revenue Growth Partner for Hotels & Resorts',
        headline1: 'No fixed salary.',
        headline2: 'We earn a % of the revenue we bring in.',
        description: '4TK covers all staff costs, tools, technology (RMS, tracking, reporting). Your hotel focuses on operations and coordination.',
        cta1: 'Try RMS Free',
        cta2: 'Book a 15-min Call',
        stat1: '50+',
        stat1Label: 'Hotels & Resorts',
        stat2: '2',
        stat2Label: 'Countries',
        stat3: '20+',
        stat3Label: 'Years Experience',
    },
    howItWorks: {
        title: 'How Does It Work?',
        subtitle: 'From trying RMS to full revenue growth',
        steps: [
            {
                number: '01',
                title: 'Sign up for free RMS',
                description: 'Upload CSV from your PMS — instantly see OTB, Pickup, Booking Pace and Daily Actions for your hotel.',
                tag: 'Self-service · 5 minutes',
            },
            {
                number: '02',
                title: '30-day Pilot',
                description: '4TK runs a trial Sales & Marketing strategy. See real results before any commitment.',
                tag: 'No commitment · No cost',
            },
            {
                number: '03',
                title: 'Done-for-you',
                description: 'Switch to revenue share model. 4TK deploys full-stack: Sales team, Marketing, technology, reporting.',
                tag: 'Revenue share · Full-stack',
            },
        ],
    },
    model: {
        title: 'Partnership Model',
        subtitle: 'Revenue Share — No fixed salary, shared risk',
        pillars: [
            {
                title: 'No fixed salary',
                description: 'Hotels don\'t carry S&M payroll. Fixed cost = zero.',
            },
            {
                title: '4TK earns % of revenue',
                description: '% calculated on room revenue from channels 4TK manages. Monthly reconciliation.',
            },
            {
                title: '4TK covers all costs',
                description: 'Staff, tools, RMS, tracking, reporting — all invested by 4TK.',
            },
            {
                title: 'Hotel focuses on operations',
                description: 'You only coordinate inventory, pricing policy, and receive leads.',
            },
        ],
        transparency: {
            title: 'Full Transparency',
            items: [
                { label: 'Revenue base', value: 'Room revenue from channels managed by 4TK' },
                { label: 'Reconciliation', value: 'Monthly · Data from PMS/OTA reports' },
                { label: 'Oversight', value: 'Real-time dashboard · Contractual terms' },
            ],
        },
        mediaCost: {
            title: 'Media & advertising costs',
            line1: '4TK covers: team + tools + tracking + RMS.',
            line2: 'Ad budget: hotel pays directly per pre-approved monthly budget, or 4TK advances within agreed limits.',
        },
    },
    comparison: {
        title: 'Compare: In-house vs 4TK',
        headers: ['', 'Hire In-house', '4TK Revenue Share'],
        rows: [
            { label: 'Cost', inhouse: 'Fixed salary + tools + training', fourTK: '% of revenue (variable)' },
            { label: 'Time to deploy', inhouse: '3–6 months', fourTK: '2–4 weeks' },
            { label: 'Risk', inhouse: 'Hotel bears all risk', fourTK: '4TK shares the risk' },
            { label: 'Tools', inhouse: 'Buy/build yourself', fourTK: 'RMS + CMS + CDP included' },
            { label: 'KPI tracking', inhouse: 'Hard to measure', fourTK: 'Real-time dashboard' },
            { label: 'Team', inhouse: '1–2 multi-taskers', fourTK: 'Specialized team' },
        ],
    },
    technology: {
        title: 'Technology Ecosystem',
        subtitle: 'Included free when partnering — no separate fees',
        items: [
            { name: 'RMS', fullName: 'Revenue Management System', description: 'Smart revenue management with real-time pricing. Upload CSV — make decisions in 5 minutes.', metric: 'Revenue +15–25%', highlight: true },
            { name: 'PMS', fullName: 'Property Management System', description: 'Automate 80% of hotel operations.', metric: '80% automated', highlight: false },
            { name: 'CMS', fullName: 'Channel Manager', description: 'Sync 10+ distribution channels in real-time.', metric: 'Up to 90% occupancy', highlight: false },
            { name: 'CDP', fullName: 'Customer Data Platform', description: 'Analyze guest behavior, personalize services.', metric: 'Return rate +25%', highlight: false },
        ],
    },
    results: {
        title: 'Proven Results',
        items: [
            { value: '40%', label: 'Reduction in S&M operation time' },
            { value: '15–25%', label: 'Room revenue increase' },
            { value: '85%', label: 'Customer satisfaction index' },
            { value: '90%+', label: 'Clients rate highly' },
        ],
    },
    caseStudies: {
        title: 'Case Studies',
        subtitle: 'Measurable results — not just promises',
        cases: [
            {
                name: 'Sunset Sanato Resort & Villas',
                location: 'Phú Quốc',
                timeline: '6 months',
                challenge: 'Low occupancy, difficulty attracting international guests',
                results: [
                    { metric: 'OCC', before: '15%', after: '75%' },
                    { metric: 'Intl guests', before: '—', after: '+80%' },
                    { metric: 'S&M costs', before: '—', after: '−30%' },
                ],
            },
            {
                name: 'Sea Lion Beach Resort',
                location: 'Mũi Né',
                timeline: '4 months',
                challenge: 'Unstable occupancy between peak and low seasons',
                results: [
                    { metric: 'OCC peak', before: '40%', after: '80%' },
                    { metric: 'OCC low', before: '10%', after: '45%' },
                    { metric: 'Intl guests', before: '—', after: '+80%' },
                ],
            },
            {
                name: 'Adora Bay Kê Gà Beach Resort',
                location: 'Bình Thuận',
                timeline: '3 months',
                challenge: 'Newly opened resort with no brand recognition',
                results: [
                    { metric: 'OCC', before: '0%', after: '65%' },
                    { metric: 'Brand', before: 'None', after: 'Built from scratch' },
                    { metric: 'Channels', before: '0', after: '30+' },
                ],
            },
        ],
    },
    clients: {
        title: 'Trusted By',
        testimonial: '"4TK Hospitality helped us reduce risk and achieve sustainable revenue growth. The revenue share model is a true win-win."',
        testimonialAuthor: 'Sunset Sanato Resort & Villas, Phú Quốc',
        regions: [
            { name: 'Phú Quốc', hotels: ['Ocean Bay', 'Sunset Sanato', 'The May', 'Sea Lion', 'Adora Bay', 'Elity'] },
            { name: 'Bình Thuận & Nha Trang', hotels: ['Santa Garden Resort', 'Namaste', 'Coastal Living', 'Ocean Waves'] },
            { name: 'Other Regions', hotels: ['Sapa Catchi Hotel', "D'Lecia Hạ Long", 'Temple Danang', 'Parze Ocean'] },
        ],
    },
    team: {
        title: 'Leadership Team',
        members: [
            { name: 'Phan Le', role: 'CEO', bio: 'Founded VLeisure — Vietnam\'s first B2B travel platform. Expert in hotel tech & OTA distribution.' },
            { name: 'An Vince', role: 'Director of Sales', bio: '10+ years Travel & Business Development. Partner at Vingroup, Railway Tourism.' },
            { name: 'Dat Nguyen', role: 'Marketing Lead', bio: '10+ years Marketing & Brand Growth in Travel & E-commerce (Vingroup, Tiki).' },
            { name: 'Duc Nguyen', role: 'Director of Sales', bio: 'Co-Founder Kitoek.vn (IDG Venture). Leading OTA optimization expert.' },
        ],
    },
    faq: {
        title: 'Frequently Asked Questions',
        items: [
            {
                q: 'How is the revenue % calculated?',
                a: '% is calculated on room revenue from channels directly managed by 4TK. The specific rate is agreed in the contract, based on each hotel\'s scale and characteristics.',
            },
            {
                q: 'Which revenue counts for 4TK?',
                a: 'Only room revenue from 4TK-managed channels. F&B, Spa, and other service revenue are not included in the % calculation.',
            },
            {
                q: 'What if our hotel already has a Sales & Marketing team?',
                a: '4TK works as an extension of your existing team. We handle OTA, B2B, and digital channels, while your internal team focuses on offline sales, MICE, and corporate.',
            },
            {
                q: 'Who pays for advertising (ads)?',
                a: '4TK covers team, tools, and tracking costs. Ad spend (Meta, Google, OTA Ads) is paid directly by the hotel per pre-approved monthly budget, or 4TK advances within agreed limits.',
            },
            {
                q: 'How long does deployment take?',
                a: 'Initial setup: 2–4 weeks. 30-day pilot to evaluate results. Total from contract to impact: approximately 2 months.',
            },
            {
                q: 'What is the minimum contract commitment?',
                a: 'Typically 6–12 months after the pilot period. The 30-day pilot has no commitment — stop anytime if unsatisfied.',
            },
            {
                q: 'Is hotel data secure?',
                a: 'Absolutely. Data is stored on high-security cloud infrastructure, NDA signed before partnership. The hotel always owns its data.',
            },
        ],
    },
    leadForm: {
        title: 'Book a 15-Minute Call',
        subtitle: 'Let us assess the growth potential for your hotel',
        fields: {
            name: 'Full name',
            email: 'Email',
            phone: 'Phone number',
            hotelName: 'Hotel / Resort name',
            rooms: 'Number of rooms',
            occAdr: 'Estimated OCC & ADR (last 30 days)',
            channels: 'Main sales channels',
            channelOptions: ['OTA (Booking, Agoda...)', 'Travel Agent', 'Corporate', 'MICE', 'Direct Booking', 'Other'],
            pms: 'Current PMS (optional)',
            needs: 'What interests you most?',
        },
        submit: 'Book a Call',
        success: 'Thank you! We\'ll be in touch within 24 hours.',
        error: 'Something went wrong. Please try again or call Zalo 0778 602 953.',
    },
    contact: {
        zalo: '0778 602 953',
        email: 'contact@pakhos.com',
        address: '75/11 Nguyen Van Cu, Ward 01, District 5, HCMC, Vietnam',
    },
    footer: {
        copyright: '© 2026 4TK Hospitality. All rights reserved.',
        tagline: 'Hotel & Resort Revenue Growth — Vietnam & Indonesia',
    },
};

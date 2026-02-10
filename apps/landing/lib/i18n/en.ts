import { Translations } from './vi';

export const en: Translations = {
    nav: {
        services: 'Services',
        technology: 'Technology',
        results: 'Results',
        team: 'Team',
        contact: 'Contact',
        cta: 'Free Consultation',
    },
    hero: {
        tagline: 'Revenue Growth Experts',
        taglineSub: 'for the Hospitality Industry',
        description: 'Outsourced Sales & Marketing combined with comprehensive technology solutions exclusively for hotels and resorts.',
        cta1: 'Get in Touch',
        cta2: 'Try RMS Free',
        stat1: '50+',
        stat1Label: 'Hotels & Resorts',
        stat2: '2',
        stat2Label: 'Countries',
        stat3: '20+',
        stat3Label: 'Years of Experience',
    },
    about: {
        title: 'About Us',
        description: 'We are not just a service provider — we are your trusted partner, walking alongside hotels and resorts on the path to new achievements.',
        mission: 'Helping hotels and resorts focus on core operations while achieving revenue growth targets and building strong brands.',
    },
    services: {
        title: 'Our Services',
        sales: {
            title: 'Sales Outsourcing',
            items: [
                { icon: '🌐', text: '30+ major distribution channels', sub: 'Booking.com, Agoda, Expedia, Vietravel, Fiditour...' },
                { icon: '🤝', text: '500,000+ B2B travel agents', sub: "Vietnam's largest B2B travel sales network" },
                { icon: '📈', text: 'Room rate optimization', sub: 'Target average price increase 10-15% per year' },
                { icon: '💹', text: 'Expert Revenue Management', sub: 'Optimize room revenue by 15-25% in peak season' },
                { icon: '📊', text: 'Real-time revenue reporting', sub: 'Daily updated dashboard, full transparency' },
            ],
        },
        marketing: {
            title: 'Marketing Outsourcing',
            items: [
                { icon: '🎯', text: 'Comprehensive marketing strategy', sub: 'Professional marketing plan development & execution' },
                { icon: '🏷️', text: 'Brand management', sub: 'Build a strong and recognizable brand identity' },
                { icon: '📱', text: 'Multi-channel digital marketing', sub: 'Social media, SEO, SEM, Email Marketing' },
                { icon: '🎨', text: 'Creative content & imagery', sub: 'Premium content for every platform' },
                { icon: '📣', text: 'Campaign optimization', sub: 'Manage and optimize advertising ROI' },
            ],
        },
    },
    whyOutsource: {
        title: 'Why Outsource?',
        items: [
            { icon: '💰', title: 'Cost Optimization', description: 'Convert fixed costs into variable costs. Pay only for what you actually need and use.' },
            { icon: '👥', title: 'Expert Team', description: 'Get immediate access to professionals with deep expertise and years of hands-on experience.' },
            { icon: '⚡', title: 'Faster Execution', description: 'Deploy Sales & Marketing strategies quickly and consistently. Make an immediate impact on revenue.' },
            { icon: '🎯', title: 'Focus on Core', description: 'Leadership and internal teams can fully focus on hotel operations, guest experience, and service quality.' },
        ],
    },
    technology: {
        title: 'Technology Solutions',
        subtitle: 'Comprehensive hotel software ecosystem',
        items: [
            { icon: '💹', name: 'RMS', fullName: 'Revenue Management System', description: 'Smart revenue management with real-time room pricing optimization.', metric: 'Revenue +15-25%', highlight: true },
            { icon: '🏨', name: 'PMS', fullName: 'Property Management System', description: 'Automate 80% of operations, reduce admin staff costs by 15%.', metric: '80% automated', highlight: false },
            { icon: '🔗', name: 'CMS', fullName: 'Channel Manager System', description: 'Sync 10+ distribution channels in real-time, optimize occupancy.', metric: 'Up to 90% occupancy', highlight: false },
            { icon: '📋', name: 'CDP', fullName: 'Customer Data Platform', description: 'Analyze 100% guest behavior, personalize services.', metric: 'Return rate +25%', highlight: false },
        ],
    },
    results: {
        title: 'Proven Results',
        items: [
            { value: '40%', label: 'Reduction in operation time' },
            { value: '12-15%', label: 'Annual revenue growth' },
            { value: '85%', label: 'Customer satisfaction index' },
            { value: '90%+', label: 'Clients rate highly' },
        ],
    },
    caseStudies: {
        title: 'Featured Case Studies',
        cases: [
            {
                name: 'Sunset Sanato Resort & Villas',
                location: 'Phú Quốc',
                challenge: 'Low occupancy rate, difficulty attracting international guests',
                results: ['Occupancy 15% → 75%', 'International guests +80%', 'S&M costs -30%'],
            },
            {
                name: 'Sea Lion Beach Resort',
                location: 'Mũi Né',
                challenge: 'Unstable occupancy during low season',
                results: ['Peak: 40% → 80%', 'Low: 10% → 45%', 'International guests +80%'],
            },
            {
                name: 'Adora Bay Kê Gà Beach Resort',
                location: 'Bình Thuận',
                challenge: 'Newly opened resort with no brand recognition',
                results: ['65% occupancy in 3 months', 'Brand built from scratch', 'Wide distribution network'],
            },
        ],
    },
    clients: {
        title: 'Trusted By',
        testimonial: '"The outsourcing service from 4TK Hospitality has helped us reduce risk and achieve sustainable revenue growth."',
        testimonialAuthor: 'CEO, Sunset Sanato Resort & Villas Phú Quốc',
        regions: [
            { name: 'Phú Quốc', hotels: ['Ocean Bay', 'Sunset Sanato', 'The May', 'Sea Lion', 'Adora Bay', 'Elity'] },
            { name: 'Bình Thuận & Nha Trang', hotels: ['Santa Garden Resort', 'Namaste', 'Coastal Living', 'Ocean Waves'] },
            { name: 'Other Regions', hotels: ['Sapa Catchi Hotel', "D'Lecia Hạ Long", 'Temple Danang', 'Parze Ocean'] },
        ],
    },
    team: {
        title: 'Our Team',
        members: [
            { name: 'Phan Le', role: 'CEO', subtitle: 'Business Strategy & Leadership', bio: 'Founder of VLeisure — Vietnam\'s first B2B travel platform and hotel management technology solution.' },
            { name: 'An Vince', role: 'Director of Sales', subtitle: '', bio: '10+ years in Travel & Development. Partner at major corporations including Vingroup.' },
            { name: 'Dat Nguyen', role: 'Marketing Lead', subtitle: 'Campaigns & Brand Growth', bio: '10+ years in Marketing & Brand Growth for Travel & E-commerce industry (Vingroup, Tiki).' },
            { name: 'Duc Nguyen', role: 'Director of Sales', subtitle: 'Marcom Manager', bio: 'Co-Founder of Kitoek.vn (IDG Venture Vietnam). Leading OTA optimization expert.' },
        ],
    },
    contact: {
        title: 'Get in Touch',
        subtitle: 'Let us help you achieve sustainable revenue growth',
        zalo: 'Chat on Zalo',
        email: 'Email',
        address: '75/11 Nguyen Van Cu, Ward 01, District 5, Ho Chi Minh City, Vietnam',
        addressLabel: 'Address',
    },
    footer: {
        copyright: '© 2026 4TK Hospitality. All rights reserved.',
        tagline: 'Hotel & Resort Management in Vietnam & Indonesia',
    },
};

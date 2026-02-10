import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const data = await req.json();

        // Validate required fields
        const required = ['name', 'email', 'phone', 'hotelName', 'rooms'];
        for (const field of required) {
            if (!data[field]) {
                return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
            }
        }

        // Format lead data for email/logging
        const leadSummary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏨 NEW LEAD — 4TK Hospitality
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name:      ${data.name}
📧 Email:     ${data.email}
📞 Phone:     ${data.phone}
🏨 Hotel:     ${data.hotelName}
🛏️ Rooms:     ${data.rooms}
📊 OCC/ADR:   ${data.occAdr || 'N/A'}
📡 Channels:  ${data.channels?.join(', ') || 'N/A'}
💻 PMS:       ${data.pms || 'N/A'}
📝 Needs:     ${data.needs || 'N/A'}
⏰ Time:      ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

        // Log to server console
        console.log(leadSummary);

        // TODO: Send email notification
        // Option 1: Use Resend (recommended for Vercel)
        // Option 2: Use Nodemailer with SMTP
        // Option 3: Use Vercel's serverless email service
        //
        // For now, we log the lead and store it.
        // To enable email: set RESEND_API_KEY env var and uncomment below:
        //
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({
        //   from: 'leads@pakhos.com',
        //   to: 'contact@pakhos.com',
        //   subject: `New Lead: ${data.hotelName} (${data.rooms} rooms)`,
        //   text: leadSummary,
        // });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Lead form error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

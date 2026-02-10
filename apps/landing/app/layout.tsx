import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "4TK Hospitality — Hotel & Resort Revenue Growth",
  description: "Dịch vụ thuê ngoài Sales & Marketing và giải pháp công nghệ toàn diện cho khách sạn, resort tại Việt Nam & Indonesia.",
  keywords: "hotel management, revenue management, sales outsourcing, marketing outsourcing, OTA, hotel software, PMS, RMS, Vietnam, Indonesia",
  openGraph: {
    title: "4TK Hospitality — Hotel & Resort Revenue Growth",
    description: "Outsourced Sales & Marketing + Technology Solutions for Hotels & Resorts",
    url: "https://www.pakhos.com",
    siteName: "4TK Hospitality",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}

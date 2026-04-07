import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✨ ตั้งค่าสีแถบสถานะบนมือถือ (Status Bar) ให้เป็นสีฟ้าแบรนด์เรา
export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "TC CENTER | The Convergence",
  description: "ยระดับการเรียนรู้ สอบติดคณะในฝัน กับทีมติวเตอร์มืออาชีพจากมหาวิทยาลัยชั้นนำ",
  manifest: "/manifest.json", // 🚀 เชื่อมต่อระบบ PWA App
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        {children}
      </body>
    </html>
  );
}
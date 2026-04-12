import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ✨ 1. Import Component น้อง Mascot เข้ามา
import FloatingAIMascot from "@/components/FloatingAIMascot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "TC CENTER | The Convergence",
  description: "ยกระดับการเรียนรู้ สอบติดคณะในฝัน กับทีมติวเตอร์มืออาชีพจากมหาวิทยาลัยชั้นนำ",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
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
        
        {/* เนื้อหาหลักของทุกๆ หน้า */}
        {children}

        {/* ✨ 2. ฝัง Mascot ไว้ตรงนี้ มันจะลอยอยู่ทุกหน้าของเว็บไซต์ */}
        
      </body>
    </html>
  );
}
import type { Metadata } from "next";
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

// ✨ แก้ไขข้อมูล Metadata ให้เป็นแบรนด์ TC CENTER
export const metadata: Metadata = {
  title: "TC CENTER | The Convergence of Academic Excellence",
  description: "ยกระดับการเรียนรู้ สอบติดคณะในฝัน กับทีมติวเตอร์มืออาชีพจากมหาวิทยาลัยชั้นนำ",
  icons: {
    icon: "/icon.png", // อย่าลืมเอารูปโลโก้ไปวางในโฟลเดอร์ public และเปลี่ยนชื่อเป็น favicon.ico นะครับ
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th"> {/* เปลี่ยนเป็นภาษาไทยเพื่อให้ Browser และ Google เข้าใจบริบทเว็บเราดีขึ้น */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
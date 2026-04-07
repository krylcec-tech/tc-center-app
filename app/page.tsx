'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  User, Sparkles, ChevronRight, GraduationCap, Users, Star, MessageCircle, ArrowRight, Menu, X
} from 'lucide-react';

export default function PremiumResponsiveLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 🌟 Navbar: ใหญ่ขึ้น ชัดเจนขึ้น พร้อมระบบมือถือ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm transition-all h-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full flex items-center justify-between">
          
          {/* ✨ Logo Section: กรอบหม่น & 3D Text */}
          <Link href="/" className="flex items-center gap-3 md:gap-4 group">
            {/* กรอบโลโก้แบบกระจกฝ้า โค้งมน */}
            <div className="p-2 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] group-hover:shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] transition-all">
              <img src="/images/logo.png.jpg" alt="TC Center" className="h-10 md:h-12 w-auto object-contain mix-blend-multiply" />
            </div>
            
            {/* ตัวหนังสือ 3D */}
            <div className="flex flex-col justify-center">
              <p className="text-lg md:text-xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)] leading-none uppercase">
                TC CENTER
              </p>
              <p className="text-[9px] md:text-[10px] font-bold tracking-[0.25em] text-blue-600 uppercase mt-1 drop-shadow-sm">
                The Convergence
              </p>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-10">
            {/* ✨ แก้ลิงก์ตรงนี้ให้ไปที่ /courses */}
            <Link href="/courses" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full">
              คอร์สเรียน
            </Link>
            <Link href="/tutors" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full">
              ทีมติวเตอร์
            </Link>
            <Link href="/reviews" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full">
              รีวิว
            </Link>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors px-2">
              <User size={18} strokeWidth={2.5} /> เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="px-8 py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95">
              สมัครเรียน
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* 📱 Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-24 left-0 w-full bg-white border-b border-slate-200 shadow-xl md:hidden flex flex-col px-6 py-6 gap-6 animate-in slide-in-from-top-2 duration-300 z-40">
            {/* ✨ แก้ลิงก์ตรงนี้ให้ไปที่ /courses */}
            <Link href="/courses" className="text-sm font-black uppercase tracking-widest text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>คอร์สเรียนทั้งหมด</Link>
            <Link href="/tutors" className="text-sm font-black uppercase tracking-widest text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>ทีมติวเตอร์ของเรา</Link>
            <Link href="/reviews" className="text-sm font-black uppercase tracking-widest text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>รีวิวความสำเร็จ</Link>
            <div className="w-full h-px bg-slate-100"></div>
            <Link href="/login" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
              <User size={18} /> เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="w-full text-center py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md" onClick={() => setIsMobileMenuOpen(false)}>
              สมัครเรียนออนไลน์
            </Link>
          </div>
        )}
      </nav>

      {/* 🌟 Hero Section: ปรับ Padding สำหรับมือถือให้พอดี */}
      <section className="relative pt-36 md:pt-44 pb-40 md:pb-56 px-6 text-center bg-slate-900 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto mt-8 md:mt-0">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 border border-white/20 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-200 mb-8 md:mb-10 backdrop-blur-sm">
            <Sparkles size={16} fill="currentColor" className="text-amber-400" /> Excellence in Education
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.2] mb-6 md:mb-8 tracking-tight text-white px-2">
            เก่งขึ้น <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">จนครูทัก</span> <br />
            สอบติดคณะในฝัน
          </h1>

          <p className="text-base md:text-xl text-slate-300 font-medium mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            ยกระดับการเรียนรู้ ด้วยระบบการวางแผนเรียน จองง่ายที่ออกแบบมาครบครัน
            พร้อมระบบจัดการเรียน เก็บชีตและระบบการเรียนที่เป็นส่วนตัว
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center px-4">
            {/* ✨ แก้ลิงก์ตรงนี้ให้ไปที่ /courses */}
            <Link href="/courses" className="w-full sm:w-auto px-8 md:px-10 py-4 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50 active:scale-95 text-xs md:text-sm uppercase tracking-widest">
              ดูคอร์สเรียนทั้งหมด <ChevronRight size={18} />
            </Link>
            <Link href="https://lin.ee/ZSDR4B3" target="_blank" className="w-full sm:w-auto px-8 md:px-10 py-4 bg-white/10 text-white font-bold rounded-full flex items-center justify-center gap-2 border border-white/20 hover:bg-white/20 transition-all active:scale-95 text-xs md:text-sm uppercase tracking-widest backdrop-blur-sm">
              <MessageCircle size={18} className="text-green-400" /> ปรึกษาแอดมินฟรี
            </Link>
          </div>
        </div>
      </section>

      {/* 🌟 Features Grid: รองรับการเรียงซ้อนในมือถือ */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 -mt-20 md:-mt-32 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {[
            // ✨ แก้ลิงก์ตรงนี้ให้ไปที่ /courses
            { icon: GraduationCap, title: 'คอร์สเรียนทั้งหมด', desc: 'เนื้อหาเข้มข้น ครอบคลุมทุกวิชาสำคัญ (Math · Science · English)', link: '/courses', colorClass: 'text-blue-600', bgClass: 'bg-blue-50' },
            { icon: Users, title: 'ทีมติวเตอร์ของเรา', desc: 'เรียนกับเหล่าครูพี่ๆ จากมหาวิทยาลัยชั้นนำระดับประเทศ', link: '/tutors', colorClass: 'text-amber-500', bgClass: 'bg-amber-50' },
            { icon: Star, title: 'รีวิวความสำเร็จ', desc: 'ร่วมภาคภูมิใจและรับแรงบันดาลใจจากรุ่นพี่สู่รุ่นน้อง TC Center', link: '/reviews', colorClass: 'text-purple-600', bgClass: 'bg-purple-50' }
          ].map((item, idx) => (
            <Link key={idx} href={item.link} className="group block bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 transition-all duration-300 shadow-xl shadow-slate-900/5 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-900/10">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 ${item.bgClass} ${item.colorClass} group-hover:scale-110 transition-transform duration-300`}>
                <item.icon size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4 text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-8 md:h-12">{item.desc}</p>
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                Explore <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}

        </div>
      </section>

      {/* 🌟 Footer */}
      <footer className="py-12 md:py-16 bg-white border-t border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <img src="/images/logo.png.jpg" alt="TC Center" className="h-8 md:h-10 mx-auto mb-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
          <p className="text-slate-900 text-[10px] md:text-xs font-black uppercase tracking-widest mb-2">
            TC CENTER LEARNING HUB
          </p>
          <p className="text-slate-500 text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase mb-8 md:mb-10">
            The Convergence of Academic Excellence
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest pt-8 border-t border-slate-100 max-w-md mx-auto">
              <Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
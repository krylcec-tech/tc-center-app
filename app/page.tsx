'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  User, Sparkles, ChevronRight, GraduationCap, Users, Star, MessageCircle, ArrowRight, Menu, X, LayoutDashboard
} from 'lucide-react';

export default function PremiumResponsiveLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✨ เช็กสถานะการล็อกอินทันทีที่เข้าหน้าแรก (ใช้ getSession เพื่อความเร็วสูงสุด)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();

    // ฟังเสียงเหตุการณ์ Auth (เช่น ถ้ามีการ Logout จาก Tab อื่น หน้าแรกจะอัปเดตเอง)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 🌟 Navbar: Fixed & Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm transition-all h-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 md:gap-4 group">
            <div className="p-2 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] group-hover:shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] transition-all">
              <img src="/icon.png" alt="TC Center" className="h-10 md:h-12 w-auto object-contain" />
            </div>
            
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
            <Link href="/student/courses" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full">
              คอร์สเรียน
            </Link>
            <Link href="#" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full">
              ทีมติวเตอร์
            </Link>
          </div>

          {/* ✨ Desktop Action Buttons: เปลี่ยนตามสถานะล็อกอิน */}
          <div className="hidden md:flex items-center gap-6">
            {!loading && (
              <>
                {user ? (
                  <Link href="/student" className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                    <LayoutDashboard size={18} /> เข้าสู่ห้องเรียน
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors px-2">
                      <User size={18} strokeWidth={2.5} /> เข้าสู่ระบบ
                    </Link>
                    <Link href="/register" className="px-8 py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                      สมัครเรียน
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* 📱 Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-24 left-0 w-full bg-white border-b border-slate-200 shadow-xl md:hidden flex flex-col px-6 py-6 gap-6 z-40 animate-in slide-in-from-top-5 duration-300">
            <Link href="/student/courses" className="text-sm font-black uppercase tracking-widest text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>คอร์สเรียนทั้งหมด</Link>
            <div className="w-full h-px bg-slate-100"></div>
            {user ? (
              <Link href="/student" className="w-full text-center py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md" onClick={() => setIsMobileMenuOpen(false)}>
                กลับเข้าสู่ห้องเรียน
              </Link>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={18} /> เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="w-full text-center py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md" onClick={() => setIsMobileMenuOpen(false)}>
                  สมัครเรียนออนไลน์
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
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

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center px-4 mt-12">
            <Link href={user ? "/student/courses" : "/login"} className="w-full sm:w-auto px-8 md:px-10 py-4 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg active:scale-95 text-xs md:text-sm uppercase tracking-widest">
              {user ? "เริ่มเรียนเลย" : "เข้าสู่ระบบเรียน"} <ChevronRight size={18} />
            </Link>
            <Link href="https://lin.ee/ZSDR4B3" target="_blank" className="w-full sm:w-auto px-8 md:px-10 py-4 bg-white/10 text-white font-bold rounded-full flex items-center justify-center gap-2 border border-white/20 hover:bg-white/20 transition-all active:scale-95 text-xs md:text-sm uppercase tracking-widest backdrop-blur-sm">
              <MessageCircle size={18} className="text-green-400" /> ปรึกษาแอดมินฟรี
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 -mt-20 md:-mt-32 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: GraduationCap, title: 'คอร์สเรียนทั้งหมด', desc: 'เนื้อหาเข้มข้น ครอบคลุมทุกวิชาสำคัญ', link: '/student/courses', colorClass: 'text-blue-600', bgClass: 'bg-blue-50' },
            { icon: Users, title: 'ทีมติวเตอร์ของเรา', desc: 'เรียนกับเหล่าครูพี่ๆ จากมหาวิทยาลัยชั้นนำ', link: '#', colorClass: 'text-amber-500', bgClass: 'bg-amber-50' },
            { icon: Star, title: 'รีวิวความสำเร็จ', desc: 'ร่วมภาคภูมิใจและรับแรงบันดาลใจจากรุ่นพี่', link: '#', colorClass: 'text-purple-600', bgClass: 'bg-purple-50' }
          ].map((item, idx) => (
            <Link key={idx} href={item.link} className="group block bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 transition-all shadow-xl hover:-translate-y-2 hover:shadow-2xl duration-300">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 ${item.bgClass} ${item.colorClass} group-hover:scale-110 transition-transform`}>
                <item.icon size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-3 text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
              <p className="text-slate-500 text-xs md:text-sm mb-8 leading-relaxed">{item.desc}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                Explore <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="py-12 bg-white border-t border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-slate-900 text-[10px] font-black uppercase tracking-widest mb-2">TC CENTER LEARNING HUB</p>
          <p className="text-slate-500 text-[9px] font-bold tracking-[0.2em] uppercase">The Convergence of Academic Excellence</p>
        </div>
      </footer>

    </div>
  );
}
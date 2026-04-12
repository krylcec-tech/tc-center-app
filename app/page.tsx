'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  User, Sparkles, ChevronRight, GraduationCap, Users, Star, MessageCircle, Menu, X, LayoutDashboard, Heart, Rocket
} from 'lucide-react';

// ✨ 1. Import Component น้อง Mascot เข้ามาเฉพาะหน้านี้
import FloatingAIMascot from '@/components/FloatingAIMascot';

export default function PremiumResponsiveLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 font-sans text-slate-800 selection:bg-orange-200 overflow-x-hidden relative">
      
      {/* 🪄 CSS ซ่อน Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* 🌟 Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all h-20 md:h-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 md:gap-4 group hover:scale-105 transition-transform duration-300">
            <div className="p-2 bg-white rounded-[1.25rem] shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
              <img src="/icon.png" alt="TC Center" className="h-10 md:h-12 w-auto object-contain" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xl md:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500 leading-none">
                TC CENTER
              </p>
              <p className="text-[10px] md:text-xs font-bold tracking-[0.1em] text-orange-400 mt-1">
                The Convergence
              </p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8 bg-orange-50/50 px-8 py-3 rounded-full border border-orange-100">
            <Link href="/student/courses" className="text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-500"/> คอร์สเรียน
            </Link>
            <Link href="#" className="text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-2">
              <Users size={18} className="text-pink-500"/> ทีมติวเตอร์
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <Link href="/student" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-sm rounded-full hover:bg-blue-700 shadow-[0_4px_15px_rgba(37,99,235,0.3)] hover:-translate-y-1 transition-all active:scale-95">
                    <LayoutDashboard size={18} /> ห้องเรียนของฉัน
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-blue-700 bg-blue-100 px-5 py-2.5 rounded-full hover:bg-blue-200 transition-all border border-blue-200">
                      <User size={18} /> เข้าสู่ระบบ
                    </Link>
                    <Link href="/register" className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-full shadow-[0_4px_15px_rgba(249,115,22,0.3)] hover:bg-orange-600 hover:-translate-y-1 transition-all active:scale-95">
                      <Rocket size={18}/> เริ่มเรียนฟรี!
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-slate-500 bg-white rounded-full shadow-sm border border-slate-100" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} className="text-orange-500" /> : <Menu size={24} className="text-blue-500" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-20 md:top-24 left-4 right-4 bg-white/95 backdrop-blur-xl border border-orange-100 shadow-2xl rounded-3xl p-6 flex flex-col gap-4 z-40 animate-in slide-in-from-top-5 duration-300">
            <Link href="/student/courses" className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl text-blue-600 font-bold border border-blue-100" onClick={() => setIsMobileMenuOpen(false)}>
              <GraduationCap size={20}/> คอร์สเรียนทั้งหมด
            </Link>
            <div className="w-full h-px bg-slate-100"></div>
            {user ? (
              <Link href="/student" className="w-full flex justify-center items-center gap-2 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700" onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard size={20}/> กลับเข้าสู่ห้องเรียน
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/login" className="flex justify-center items-center gap-2 w-full py-3 bg-blue-100 text-blue-700 font-bold rounded-2xl" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={18} /> เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="flex justify-center items-center gap-2 w-full py-3 bg-orange-500 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-600" onClick={() => setIsMobileMenuOpen(false)}>
                  <Rocket size={18}/> สมัครเรียนออนไลน์ ✨
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* 🎈 Hero Section */}
      <section className="relative pt-36 md:pt-48 pb-24 md:pb-32 px-6 text-center overflow-hidden">
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-blue-400/20 blur-[80px] rounded-full"></div>
        <div className="absolute top-40 right-[10%] w-72 h-72 bg-pink-400/20 blur-[80px] rounded-full"></div>
        <div className="absolute bottom-10 left-[40%] w-56 h-56 bg-orange-400/20 blur-[80px] rounded-full"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-50 border border-pink-200 rounded-full text-xs font-bold text-pink-600 mb-8 hover:scale-105 transition-transform cursor-default shadow-sm">
            <Heart size={16} className="text-pink-500 fill-pink-500 animate-bounce" /> เรียนสนุก เข้าใจง่าย สไตล์ TC Center
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.3] mb-6 md:mb-8 text-slate-800">
            เก่งขึ้น <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">จนครูทัก!</span> <br />
            สอบติดคณะในฝัน 🎯
          </h1>
          
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto mb-10 font-medium leading-relaxed bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white">
            แพลตฟอร์มเรียนออนไลน์ที่เข้าใจวัยรุ่นที่สุด จัดตารางเรียนเองได้ มีคอร์สตั้งแต่ประถมถึงมหาลัย พร้อมติวเตอร์ระดับท็อปคอยดูแล!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center px-4">
            <Link href={user ? "/student/courses" : "/register"} className="w-full sm:w-auto px-8 md:px-10 py-4 bg-blue-600 text-white font-bold rounded-[2rem] flex items-center justify-center gap-2 hover:bg-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:-translate-y-1 transition-all active:scale-95 text-sm md:text-base">
              {user ? "ลุยกันเลย!" : "ทดลองเรียนฟรี"} <Sparkles size={20} className="text-amber-300"/>
            </Link>
            <Link href="https://lin.ee/ZSDR4B3" target="_blank" className="w-full sm:w-auto px-8 md:px-10 py-4 bg-green-50 text-green-700 font-bold rounded-[2rem] flex items-center justify-center gap-2 border border-green-200 hover:bg-green-100 hover:shadow-md hover:-translate-y-1 transition-all active:scale-95 text-sm md:text-base">
              <MessageCircle size={20} className="text-[#00B900]" /> ปรึกษาพี่แอดมิน
            </Link>
          </div>
        </div>
      </section>

      {/* 🧩 Features Grid: แก้ไขให้ชิดซ้ายและรองรับจอครึ่ง */}
      <section className="relative z-20 max-w-7xl mx-auto pb-32">
        <div className="flex lg:grid lg:grid-cols-3 gap-4 lg:gap-8 overflow-x-auto snap-x snap-mandatory px-6 pb-8 lg:pb-0 hide-scrollbar scroll-pl-6">
          {[
            { icon: GraduationCap, title: 'คอร์สเรียนครบสูตร', desc: 'เนื้อหาแน่นแต่ย่อยง่าย พร้อมลุยทุกสนามสอบ', link: '/student/courses', colorClass: 'text-blue-600', iconBg: 'bg-blue-100', cardBg: 'bg-blue-50/50', borderClass: 'border-blue-100' },
            { icon: Users, title: 'ติวเตอร์สุดปัง', desc: 'เรียนกับพี่ๆ ใจดี จากมหาลัยดัง สอนสนุกไม่น่าเบื่อ', link: '#', colorClass: 'text-pink-600', iconBg: 'bg-pink-100', cardBg: 'bg-pink-50/50', borderClass: 'border-pink-100' },
            { icon: Star, title: 'รีวิวเพียบ!', desc: 'พิสูจน์แล้วจากน้องๆ ที่เกรดพุ่ง สอบติดคณะในฝันจริง', link: '#', colorClass: 'text-orange-600', iconBg: 'bg-orange-100', cardBg: 'bg-orange-50/50', borderClass: 'border-orange-100' }
          ].map((item, idx) => (
            <Link 
              key={idx} 
              href={item.link} 
              className={`group ${item.cardBg} p-8 md:p-10 rounded-[2.5rem] border ${item.borderClass} shadow-sm hover:shadow-lg transition-all hover:-translate-y-2 duration-300 flex flex-col items-center text-center bg-white min-w-[85vw] sm:min-w-[320px] lg:min-w-0 snap-start shrink-0`}
            >
              <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 ${item.iconBg} ${item.colorClass} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}>
                <item.icon size={36} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-3 text-slate-800">{item.title}</h3>
              <p className="text-slate-600 text-sm mb-8 leading-relaxed px-2 font-medium">{item.desc}</p>
              <div className={`mt-auto flex items-center gap-2 text-sm font-bold ${item.colorClass} ${item.iconBg} px-6 py-2.5 rounded-full group-hover:brightness-95 transition-all`}>
                ดูรายละเอียด <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white text-center border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 font-black text-slate-800 text-lg">
            TC CENTER <Heart size={16} className="text-pink-500 fill-pink-500" />
          </div>
          <p className="text-slate-400 text-xs font-medium">The Convergence of Academic Excellence</p>
          <div className="flex gap-4 mt-4">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span>
          </div>
        </div>
      </footer>

      {/* ✨ 2. วางน้อง Mascot ไว้ล่างสุดของหน้านี้ (จะโชว์เฉพาะหน้านี้เท่านั้น) */}
      <FloatingAIMascot />

    </div>
  );
}
'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  User, Sparkles, ChevronRight, GraduationCap, Users, Star, MessageCircle, Menu, X, LayoutDashboard, Heart, Rocket, Zap, Trophy, BookOpen
} from 'lucide-react';

import FloatingAIMascot from '@/components/FloatingAIMascot';

export default function PremiumResponsiveLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('STUDENT');
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) setUserRole((profile.role || 'STUDENT').toUpperCase());
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setUserRole('STUDENT');
    });

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardUrl = () => {
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'TUTOR') return '/tutor';
    return '/student';
  };

  const getDashboardText = () => {
    if (userRole === 'ADMIN') return 'ระบบหลังบ้าน (Admin)';
    if (userRole === 'TUTOR') return 'ระบบจัดการติวเตอร์';
    return 'ห้องเรียนของฉัน';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] font-sans text-slate-800 overflow-x-hidden relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800;900&family=Sarabun:wght@400;500;600&display=swap');

        * { font-family: 'Prompt', sans-serif; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .gradient-text {
          background: linear-gradient(135deg, #f97316, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gradient-text-blue {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mesh-bg {
          background-color: #F8F9FF;
          background-image:
            radial-gradient(ellipse 80% 60% at 20% -10%, rgba(37,99,235,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 10%, rgba(249,115,22,0.07) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 90%, rgba(236,72,153,0.06) 0%, transparent 50%);
        }

        .card-glass {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 8px 32px rgba(37,99,235,0.06), 0 2px 8px rgba(0,0,0,0.04);
        }

        .pill-nav {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .hero-blob-1 {
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%);
          top: -100px; left: -150px;
          border-radius: 50%;
          animation: floatBlob1 8s ease-in-out infinite;
        }
        .hero-blob-2 {
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%);
          top: 0px; right: -100px;
          border-radius: 50%;
          animation: floatBlob2 10s ease-in-out infinite;
        }
        .hero-blob-3 {
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%);
          bottom: -50px; left: 40%;
          border-radius: 50%;
          animation: floatBlob1 12s ease-in-out infinite reverse;
        }

        @keyframes floatBlob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes floatBlob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 20px) scale(1.04); }
        }

        .badge-pulse {
          animation: badgePulse 2s ease-in-out infinite;
        }
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(249,115,22,0); }
        }

        .cta-btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 8px 24px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .cta-btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 36px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .cta-btn-green {
          background: rgba(240,253,244,0.9);
          border: 1.5px solid rgba(34,197,94,0.3);
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .cta-btn-green:hover {
          transform: translateY(-3px) scale(1.02);
          background: rgba(220,252,231,0.95);
          box-shadow: 0 12px 28px rgba(34,197,94,0.15);
        }

        .feature-card {
          transition: all 0.4s cubic-bezier(0.34,1.4,0.64,1);
        }
        .feature-card:hover {
          transform: translateY(-10px);
        }

        .stat-item {
          animation: fadeInUp 0.6s ease both;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nav-link-pill {
          position: relative;
          transition: color 0.2s;
        }
        .nav-link-pill::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 50%; right: 50%;
          height: 2px;
          background: linear-gradient(90deg, #f97316, #ec4899);
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        .nav-link-pill:hover::after {
          left: 0; right: 0;
        }

        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .tag-chip {
          background: rgba(37,99,235,0.06);
          border: 1px solid rgba(37,99,235,0.12);
        }
      `}} />

      {/* ✨ Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'py-2 shadow-[0_4px_40px_rgba(37,99,235,0.08)]' 
          : 'py-3'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`flex items-center justify-between px-4 sm:px-6 transition-all duration-500 rounded-2xl ${
            scrolled 
              ? 'pill-nav h-16 shadow-sm border border-white/80' 
              : 'h-20 md:h-24 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/70'
          }`}>
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-orange-400 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <img src="/icon.png" alt="TC Center" className="h-9 md:h-11 w-auto object-contain" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-black tracking-widest gradient-text-blue leading-none">TC CENTER</span>
                <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.15em] text-orange-400 mt-0.5">The Convergence</span>
              </div>
            </Link>

            {/* Center Nav */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-50/80 px-3 py-2 rounded-2xl border border-slate-100">
              <Link href="/student/courses" className="nav-link-pill flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 rounded-xl hover:bg-white transition-all">
                <BookOpen size={16} className="text-blue-500"/> คอร์สเรียน
              </Link>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <Link href="#" className="nav-link-pill flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-pink-600 rounded-xl hover:bg-white transition-all">
                <Users size={16} className="text-pink-500"/> ทีมติวเตอร์
              </Link>
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              {!loading && (
                user ? (
                  <a href={getDashboardUrl()} className="cta-btn-primary flex items-center gap-2 px-6 py-2.5 text-white font-bold text-sm rounded-2xl active:scale-95">
                    <LayoutDashboard size={16} /> {getDashboardText()}
                  </a>
                ) : (
                  <>
                    <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-blue-600 px-5 py-2.5 rounded-2xl hover:bg-blue-50 transition-all border border-blue-100">
                      <User size={16} /> เข้าสู่ระบบ
                    </Link>
                    <Link href="/register" className="relative overflow-hidden flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-sm rounded-2xl shadow-[0_4px_16px_rgba(249,115,22,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(249,115,22,0.4)] transition-all active:scale-95">
                      <div className="absolute inset-0 shimmer"></div>
                      <Rocket size={16}/> <span className="relative">เริ่มเรียนฟรี!</span>
                    </Link>
                  </>
                )
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-500 hover:text-blue-500 transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={20} className="text-orange-500" /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mx-4 mt-2 bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-3xl p-5 flex flex-col gap-3 z-40 animate-in slide-in-from-top-5 duration-300">
            <Link href="/student/courses" className="flex items-center gap-3 p-3.5 bg-blue-50 rounded-2xl text-blue-600 font-semibold text-sm border border-blue-100/80" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center"><GraduationCap size={16}/></div>
              คอร์สเรียนทั้งหมด
            </Link>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
            {user ? (
              <a href={getDashboardUrl()} className="w-full flex justify-center items-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg" onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard size={18}/> {getDashboardText()}
              </a>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" className="flex justify-center items-center gap-2 w-full py-3 bg-slate-50 text-slate-700 font-semibold text-sm rounded-2xl border border-slate-100" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={16} /> เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="flex justify-center items-center gap-2 w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-sm rounded-2xl shadow-[0_4px_16px_rgba(249,115,22,0.3)]" onClick={() => setIsMobileMenuOpen(false)}>
                  <Rocket size={16}/> สมัครเรียนออนไลน์ ✨
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ✨ Hero Section */}
      <section className="relative pt-36 md:pt-52 pb-24 md:pb-36 px-6 mesh-bg overflow-hidden">
        <div className="hero-blob-1"></div>
        <div className="hero-blob-2"></div>
        <div className="hero-blob-3"></div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.015]" style={{backgroundImage: 'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/80 border border-orange-200/80 rounded-full text-xs font-semibold text-orange-600 mb-10 badge-pulse cursor-default shadow-sm backdrop-blur-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              <Heart size={13} className="text-pink-500 fill-pink-500" />
            </span>
            เรียนสนุก เข้าใจง่าย สไตล์ TC Center
            <ChevronRight size={13} className="text-orange-400"/>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-[4.5rem] font-black leading-[1.15] mb-6 text-slate-900 tracking-tight">
            เก่งขึ้น{' '}
            <span className="gradient-text">จนครูทัก!</span>
            <br />
            <span className="relative inline-block">
              สอบติดคณะในฝัน
              <span className="ml-3">🎯</span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto mb-12 font-medium leading-relaxed" style={{fontFamily: 'Sarabun, sans-serif'}}>
            แพลตฟอร์มเรียนออนไลน์ที่เข้าใจวัยรุ่นที่สุด จัดตารางเรียนเองได้ มีคอร์สตั้งแต่ประถมถึงมหาลัย พร้อมติวเตอร์ระดับท็อปคอยดูแล!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <a href={user ? getDashboardUrl() : "/register"} className="cta-btn-primary w-full sm:w-auto px-8 py-4 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 text-sm active:scale-95">
              {user ? "เข้าสู่ระบบหลังบ้าน" : "ทดลองเรียนฟรี"} <Sparkles size={18} className="text-amber-300"/>
            </a>
            <Link href="https://lin.ee/ZSDR4B3" target="_blank" className="cta-btn-green w-full sm:w-auto px-8 py-4 text-green-700 font-bold rounded-2xl flex items-center justify-center gap-2.5 text-sm active:scale-95">
              <MessageCircle size={18} className="text-[#00B900]" /> ปรึกษาพี่แอดมิน
            </Link>
          </div>

          {/* Stats Row */}
          <div className="mt-16 flex items-center justify-center gap-2 sm:gap-0 flex-wrap sm:flex-nowrap">
            {[
              { value: '5,000+', label: 'นักเรียน', icon: '🎓', color: 'blue' },
              { value: '98%', label: 'พึงพอใจ', icon: '⭐', color: 'orange' },
              { value: '200+', label: 'คอร์สเรียน', icon: '📚', color: 'pink' },
            ].map((stat, i) => (
              <React.Fragment key={i}>
                <div className="stat-item flex flex-col items-center px-6 py-4" style={{animationDelay: `${i * 0.15}s`}}>
                  <span className="text-xl mb-1">{stat.icon}</span>
                  <span className="text-2xl md:text-3xl font-black text-slate-800">{stat.value}</span>
                  <span className="text-xs font-semibold text-slate-400 mt-0.5">{stat.label}</span>
                </div>
                {i < 2 && <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ✨ Features Section */}
      <section className="relative z-20 max-w-7xl mx-auto pb-36 px-6">
        
        {/* Section Label */}
        <div className="text-center mb-12">
          <span className="tag-chip inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-600 mb-4">
            <Zap size={12} /> ทำไมต้อง TC Center
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">ครบ จบ ที่เดียว</h2>
        </div>

        <div className="flex lg:grid lg:grid-cols-3 gap-5 overflow-x-auto snap-x snap-mandatory pb-4 lg:pb-0 hide-scrollbar scroll-pl-6 -mx-6 px-6 lg:mx-0 lg:px-0">
          {[
            {
              icon: GraduationCap,
              emoji: '📖',
              title: 'คอร์สเรียนครบสูตร',
              desc: 'เนื้อหาแน่นแต่ย่อยง่าย พร้อมลุยทุกสนามสอบ ตั้งแต่ประถมจนถึงมหาลัย',
              link: '/student/courses',
              accent: '#2563eb',
              accentLight: 'rgba(37,99,235,0.08)',
              accentBorder: 'rgba(37,99,235,0.15)',
              tag: 'คอร์สใหม่ทุกสัปดาห์',
              iconBg: 'from-blue-500 to-blue-700',
            },
            {
              icon: Users,
              emoji: '👨‍🏫',
              title: 'ติวเตอร์สุดปัง',
              desc: 'เรียนกับพี่ๆ ใจดี จากมหาลัยดัง สอนสนุกไม่น่าเบื่อ เข้าถึงได้ตลอด',
              link: '#',
              accent: '#ec4899',
              accentLight: 'rgba(236,72,153,0.07)',
              accentBorder: 'rgba(236,72,153,0.15)',
              tag: '50+ ติวเตอร์',
              iconBg: 'from-pink-500 to-rose-600',
            },
            {
              icon: Trophy,
              emoji: '🏆',
              title: 'รีวิวเพียบ!',
              desc: 'พิสูจน์แล้วจากน้องๆ ที่เกรดพุ่ง สอบติดคณะในฝันจริง ไม่ใช่แค่โฆษณา',
              link: '#',
              accent: '#f97316',
              accentLight: 'rgba(249,115,22,0.07)',
              accentBorder: 'rgba(249,115,22,0.15)',
              tag: '5,000+ รีวิว',
              iconBg: 'from-orange-500 to-amber-600',
            }
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.link}
              className="feature-card group relative card-glass p-7 md:p-9 rounded-[2rem] flex flex-col min-w-[82vw] sm:min-w-[320px] lg:min-w-0 snap-start shrink-0 overflow-hidden"
              style={{background: `linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)`, borderColor: item.accentBorder}}
            >
              {/* Card Background Accent */}
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-60 transition-transform group-hover:scale-150 duration-700"
                style={{background: `radial-gradient(circle, ${item.accentLight} 0%, transparent 70%)`}}></div>

              {/* Icon */}
              <div className="relative mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                  <item.icon size={26} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="absolute -top-2 -right-2 text-xl">{item.emoji}</span>
              </div>

              {/* Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold mb-4 w-fit"
                style={{background: item.accentLight, color: item.accent, border: `1px solid ${item.accentBorder}`}}>
                <Star size={9} fill={item.accent} color={item.accent}/> {item.tag}
              </div>

              <h3 className="text-xl md:text-2xl font-black mb-3 text-slate-800 group-hover:text-slate-900 transition-colors">{item.title}</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium flex-1" style={{fontFamily: 'Sarabun, sans-serif'}}>{item.desc}</p>

              <div className="flex items-center gap-2 text-sm font-bold mt-auto" style={{color: item.accent}}>
                ดูรายละเอียด
                <div className="w-7 h-7 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform"
                  style={{background: item.accentLight}}>
                  <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ✨ Footer */}
      <footer className="py-14 border-t border-slate-100 bg-white/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-black text-slate-800 text-lg tracking-wide">TC CENTER</span>
            <Heart size={14} className="text-pink-500 fill-pink-500" />
          </div>
          <p className="text-slate-400 text-xs font-medium tracking-wider uppercase" style={{fontFamily: 'Sarabun, sans-serif'}}>The Convergence of Academic Excellence</p>
          <div className="flex gap-3 mt-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" style={{animationDelay: '0.3s'}}></div>
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" style={{animationDelay: '0.6s'}}></div>
          </div>
        </div>
      </footer>

      <FloatingAIMascot />
    </div>
  );
}

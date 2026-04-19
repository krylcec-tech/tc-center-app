'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, Wallet, Calendar, Clock, BookOpen, 
  History, Settings, Users, Gift, Share2, Copy, 
  Check, Loader2, ArrowRight, ShoppingCart,
  LayoutDashboard, Globe, MapPin, User, Home, Sparkles, Heart,
  Bot, ChevronRight, Zap, AlertCircle
} from 'lucide-react';

import FloatingAIMascot from '@/components/FloatingAIMascot';

export default function StudentDashboard() {
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false); // แก้ Hydration Error
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: walletData } = await supabase.from('student_wallets').select('*').eq('user_id', user.id).single();

      setStudentData(profile);
      setWallet(walletData);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = () => {
    if (studentData?.referral_code) {
      navigator.clipboard.writeText(studentData.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // ✨ ฟังก์ชันดักจับการคลิก ถ้ายังไม่ระบุระดับชั้น ให้เด้งไปหน้า Profile
  const checkProfileBeforeAction = (e: React.MouseEvent) => {
    if (!studentData?.grade_level) {
      e.preventDefault(); // เบรกไม่ให้เปลี่ยนหน้า
      alert('⚠️ กรุณาไปที่ "ตั้งค่าโปรไฟล์" เพื่อระบุ "ระดับชั้น" ของคุณให้เรียบร้อยก่อนใช้งานระบบจองเรียนครับ');
      router.push('/student/profile');
    }
  };

  if (!hasMounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FF]">
        <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800;900&display=swap'); *{font-family:'Prompt',sans-serif;}`}} />
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-2xl shadow-blue-200">
              <Loader2 className="animate-spin text-white" size={32} />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400 to-orange-400 blur-xl opacity-30 animate-pulse"></div>
          </div>
          <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-xs">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // ตัวแปรเช็คว่าต้องแจ้งเตือนให้อัปเดตโปรไฟล์ไหม
  const needsProfileUpdate = !studentData?.grade_level;

  return (
    <div className="min-h-screen flex bg-[#F8F9FF]" style={{fontFamily: "'Prompt', sans-serif"}}>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800;900&family=Sarabun:wght@400;500;600&display=swap');
        * { font-family: 'Prompt', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .s-blob-1 { position: fixed; width: 700px; height: 700px; background: radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 65%); top: -200px; left: -150px; border-radius: 50%; pointer-events: none; animation: sBlob1 14s ease-in-out infinite; z-index: 0; }
        .s-blob-2 { position: fixed; width: 550px; height: 550px; background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%); bottom: -150px; right: -100px; border-radius: 50%; pointer-events: none; animation: sBlob2 18s ease-in-out infinite; z-index: 0; }
        @keyframes sBlob1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,-25px) scale(1.04); } 66% { transform: translate(-20px,20px) scale(0.97); } }
        @keyframes sBlob2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,20px) scale(1.05); } }

        .dot-bg { background-image: radial-gradient(circle, rgba(37,99,235,0.10) 1px, transparent 1px); background-size: 30px 30px; }
        .sidebar-glass { background: rgba(255,255,255,0.88); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px); border-right: 1px solid rgba(255,255,255,0.9); box-shadow: 4px 0 40px rgba(37,99,235,0.05); }
        .logo-ring { background: conic-gradient(from 0deg, #2563eb, #f97316, #ec4899, #2563eb); animation: spinRing 6s linear infinite; border-radius: 1.2rem; padding: 2px; }
        @keyframes spinRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .card-glass { background: rgba(255,255,255,0.78); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 4px 24px rgba(37,99,235,0.06); }
        .tier-card { background: rgba(255,255,255,0.82); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.95); }
        .hero-wallet { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #7c3aed 100%); }
        .fade-up { animation: fadeUp 0.6s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .tier-blue  { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
        .tier-purple{ background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); }
        .tier-orange{ background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
        .shortcut-card { transition: all 0.3s cubic-bezier(0.34,1.4,0.64,1); }
        .shortcut-card:hover { transform: translateY(-6px) scale(1.02); }
        .ref-card { background: rgba(255,255,255,0.82); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.95); box-shadow: 0 4px 24px rgba(37,99,235,0.06); }
        .reward-banner { background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); transition: all 0.3s ease; }
        .reward-banner:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(249,115,22,0.35); }
        .mobile-nav-glass { background: rgba(255,255,255,0.92); backdrop-filter: blur(28px); border-top: 1px solid rgba(255,255,255,0.9); box-shadow: 0 -8px 32px rgba(37,99,235,0.07); }
        .greeting-text { background: linear-gradient(135deg, #2563eb, #7c3aed 50%, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .avatar-ring { box-shadow: 0 0 0 3px white, 0 0 0 5px rgba(37,99,235,0.2), 0 8px 24px rgba(37,99,235,0.15); }
      `}} />

      {/* Ambient */}
      <div className="s-blob-1"></div>
      <div className="s-blob-2"></div>
      <div className="fixed inset-0 dot-bg opacity-25 pointer-events-none"></div>

      {/* ===== SIDEBAR (Desktop) ===== */}
      <aside className="sidebar-glass w-72 hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 h-screen">
        
        {/* Logo */}
        <div className="p-7 pt-8 border-b border-slate-100/60">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative logo-ring">
              <div className="w-10 h-10 bg-white rounded-[1.1rem] flex items-center justify-center">
                <span className="text-sm font-black text-blue-600">TC</span>
              </div>
            </div>
            <div>
              <p className="font-black text-xl text-slate-900 leading-none">TC Center</p>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5 text-blue-600">Student Portal</p>
            </div>
          </div>

          {/* Profile chip */}
          <div className="flex items-center gap-3 bg-blue-50/70 px-3 py-3 rounded-2xl border border-blue-100/80">
            {studentData?.avatar_url ? (
              <img src={studentData.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0"/>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm shrink-0">
                {wallet?.student_name?.charAt(0) || 'TC'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">{wallet?.student_name || 'นักเรียน'}</p>
              <p className="text-[9px] text-blue-500 font-semibold truncate">{studentData?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto hide-scrollbar">
          
          <Link href="/student" className="nav-item flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-[1rem] font-bold text-sm shadow-lg shadow-blue-200">
            <LayoutDashboard size={17}/> แดชบอร์ด
          </Link>

          <p className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-5 mb-2">การเรียน</p>

          {/* ✨ ดักจับการคลิกจองเรียน */}
          <Link href="/student/booking-flow" onClick={checkProfileBeforeAction} className="nav-item flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-[1rem] font-bold text-sm transition-all">
            <Calendar size={17}/> จองคิวเรียน
          </Link>
          <Link href="/student/my-schedule" className="nav-item flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pink-50 hover:text-pink-600 rounded-[1rem] font-bold text-sm transition-all">
            <Clock size={17}/> ตารางเรียน/ยืนยันการเข้าเรียน
          </Link>
          <Link href="/student/my-books" className="nav-item flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-orange-50 hover:text-orange-600 rounded-[1rem] font-bold text-sm transition-all">
            <BookOpen size={17}/> คลังหนังสือและชีท
          </Link>
          <Link href="/student/tutors" className="nav-item flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-[1rem] font-bold text-sm transition-all">
            <Users size={17}/> ทำเนียบติวเตอร์
          </Link>

          <p className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-5 mb-2">ร้านค้า & บัญชี</p>

          {/* ✨ ดักจับการคลิกซื้อคอร์ส */}
          <Link href="/student/courses" onClick={checkProfileBeforeAction} className="nav-item flex items-center gap-3 px-4 py-3 bg-slate-900 text-white hover:bg-orange-500 rounded-[1rem] font-bold text-sm transition-all shadow-md">
            <ShoppingCart size={17} className="text-orange-400"/> ซื้อคอร์ส / เพิ่มชั่วโมง
          </Link>
          <Link href="/student/orders" className="nav-item flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-[1rem] font-bold text-sm transition-all">
            <History size={17}/> ประวัติการสั่งซื้อ
          </Link>
          <Link href="/student/profile" className="nav-item flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-[1rem] font-bold text-sm transition-all">
            <Settings size={17}/> ตั้งค่าโปรไฟล์
            {needsProfileUpdate && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto"></div>}
          </Link>
          <Link href="/student/affiliate/shop" className="nav-item flex items-center gap-3 px-4 py-3 text-pink-500 hover:bg-pink-50 rounded-[1rem] font-bold text-sm transition-all">
            <Gift size={17}/> ร้านค้าแลกของรางวัล
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100/80">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-black text-sm text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-red-100/80">
            <LogOut size={16}/> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="mobile-nav-glass lg:hidden fixed bottom-0 left-0 right-0 z-[100] rounded-t-[2rem] flex justify-between items-end px-2"
        style={{paddingBottom: 'max(env(safe-area-inset-bottom), 14px)', paddingTop: '10px'}}>

        <Link href="/student" className="flex flex-col items-center gap-1 text-blue-600 flex-1 pb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
            <LayoutDashboard size={17}/>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wide">หน้าหลัก</span>
        </Link>

        <Link href="/student/my-schedule" className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 flex-1 pb-1 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
            <Calendar size={17}/>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wide">ตาราง</span>
        </Link>

        {/* ✨ ดักจับการคลิกซื้อคอร์ส (มือถือ) */}
        <Link href="/student/courses" onClick={checkProfileBeforeAction} className="flex flex-col items-center flex-1 relative pb-1">
          <div className="absolute -top-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-[0_8px_24px_rgba(249,115,22,0.4)] border-4 border-white">
            <ShoppingCart size={20} className="text-white"/>
          </div>
          <span className="text-[9px] font-black uppercase text-slate-700 mt-6">ซื้อคอร์ส</span>
        </Link>

        <Link href="/student/my-books" className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-500 flex-1 pb-1 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
            <BookOpen size={17}/>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wide">ชีทเรียน</span>
        </Link>

        <Link href="/student/profile" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 flex-1 pb-1 transition-colors relative">
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center relative">
            <User size={17}/>
            {needsProfileUpdate && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></div>}
          </div>
          <span className="text-[9px] font-black uppercase tracking-wide">โปรไฟล์</span>
        </Link>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 lg:ml-72 overflow-y-auto hide-scrollbar min-h-screen relative z-10">
        <div className="p-5 sm:p-7 md:p-9 lg:p-10 pb-36 lg:pb-12 max-w-[1200px] mx-auto space-y-8">

          {/* ── HEADER ── */}
          <header className="fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-2">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-50 border border-pink-200/80 rounded-full text-[10px] font-bold text-pink-600 mb-3">
                <Heart size={11} className="text-pink-500 fill-pink-500 animate-pulse"/> ยินดีต้อนรับกลับมา
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                สวัสดี,{' '}
                <span className="text-blue-600">{wallet?.student_name || 'นักเรียน'}</span>{' '}👋
              </h1>
              <p className="text-slate-400 font-semibold text-sm mt-2" style={{fontFamily: 'Sarabun, sans-serif'}}>
                พร้อมจะเรียนรู้และสนุกไปด้วยกันหรือยัง?
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-all shadow-sm border border-white">
                <Home size={13}/> เว็บไซต์
              </Link>

              <button onClick={handleLogout} className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100">
                <LogOut size={13}/>
              </button>

              <Link href="/student/profile" className="relative">
                {studentData?.avatar_url ? (
                  <img src={studentData.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover avatar-ring"/>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-black text-xl avatar-ring">
                    {wallet?.student_name?.charAt(0) || 'TC'}
                  </div>
                )}
                {needsProfileUpdate && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse"></div>}
              </Link>
            </div>
          </header>

          {/* ✨ BANNER แจ้งเตือนให้ตั้งค่าโปรไฟล์ */}
          {needsProfileUpdate && (
            <div className="fade-up bg-orange-50 border border-orange-200 rounded-[1.5rem] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden shadow-sm">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-200/30 rounded-full blur-xl pointer-events-none"></div>
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600 shrink-0">
                 <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-orange-800">กรุณาตั้งค่าโปรไฟล์ก่อนเริ่มใช้งาน</h3>
                <p className="text-xs font-bold text-orange-600 mt-1" style={{fontFamily: 'Sarabun, sans-serif'}}>
                  ระบบจำเป็นต้องทราบ <strong>"ระดับชั้น"</strong> ของคุณ เพื่อให้ติวเตอร์จัดเตรียมเนื้อหาได้อย่างถูกต้องครับ
                </p>
              </div>
              <Link href="/student/profile" className="w-full sm:w-auto text-center bg-orange-500 text-white px-5 py-3 rounded-xl text-xs font-black hover:bg-orange-600 active:scale-95 transition-all whitespace-nowrap shadow-md">
                ไปตั้งค่าโปรไฟล์
              </Link>
            </div>
          )}

          {/* ── TIER HOURS SECTION ── */}
          <section className="fade-up">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <Wallet size={16} className="text-blue-600"/>
              </div>
              <h2 className="text-lg font-black text-slate-800">ชั่วโมงเรียนคงเหลือ</h2>
              <span className="text-[9px] font-black text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-widest">แยกตามคอร์ส</span>
            </div>

            <div className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 lg:pb-0 -mx-5 px-5 sm:-mx-7 sm:px-7 lg:mx-0 lg:px-0">
              {[
                {
                  label: 'ประถม - ม.ต้น', tier: 'tier1',
                  headerClass: 'tier-blue',
                  onlineBal: wallet?.tier1_online_balance || 0,
                  onsiteBal: wallet?.tier1_onsite_balance || 0,
                  accentColor: '#2563eb', accentLight: 'rgba(37,99,235,0.08)',
                  onlineBtnClass: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                },
                {
                  label: 'สอบเข้า ม.4', tier: 'tier2',
                  headerClass: 'tier-purple',
                  onlineBal: wallet?.tier2_online_balance || 0,
                  onsiteBal: wallet?.tier2_onsite_balance || 0,
                  accentColor: '#7c3aed', accentLight: 'rgba(124,58,237,0.08)',
                  onlineBtnClass: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
                },
                {
                  label: 'ม.ปลาย / มหาลัย', tier: 'tier3',
                  headerClass: 'tier-orange',
                  onlineBal: wallet?.tier3_online_balance || 0,
                  onsiteBal: wallet?.tier3_onsite_balance || 0,
                  accentColor: '#f97316', accentLight: 'rgba(249,115,22,0.08)',
                  onlineBtnClass: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
                },
              ].map((t, i) => (
                <div key={i} className="tier-card rounded-[2rem] flex flex-col min-w-[82vw] sm:min-w-[320px] lg:min-w-0 snap-start shrink-0">
                  {/* Header */}
                  <div className={`${t.headerClass} px-6 py-4 flex items-center justify-between`}>
                    <span className="text-white font-black text-base">{t.label}</span>
                    <Sparkles size={18} className="text-white/60"/>
                  </div>

                  {/* Balances */}
                  <div className="p-6 flex-1 flex flex-col gap-5">
                    <div className="flex items-center justify-around">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest mb-2" style={{color: t.accentColor}}>
                          <Globe size={11}/> Online
                        </div>
                        <p className="text-4xl font-black" style={{color: t.accentColor}}>{t.onlineBal}</p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">ชั่วโมง</p>
                      </div>
                      <div className="w-px h-12 bg-slate-100"></div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">
                          <MapPin size={11}/> Onsite
                        </div>
                        <p className="text-4xl font-black text-emerald-500">{t.onsiteBal}</p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">ชั่วโมง</p>
                      </div>
                    </div>

                    {/* ✨ ดักจับการคลิกจองเรียนรายคอร์ส */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Link href={`/student/booking-flow?tier=${t.tier}&type=Online`} onClick={checkProfileBeforeAction}
                        className={`${t.onlineBtnClass} py-3 rounded-xl font-black text-[11px] text-center transition-colors`}>
                        จอง Online
                      </Link>
                      <Link href={`/student/booking-flow?tier=${t.tier}&type=Onsite`} onClick={checkProfileBeforeAction}
                        className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 py-3 rounded-xl font-black text-[11px] text-center transition-colors">
                        จอง Onsite
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── SHORTCUTS BENTO ── */}
          <section className="fade-up">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                <Zap size={16} className="text-orange-500"/>
              </div>
              <h2 className="text-lg font-black text-slate-800">เมนูทางลัด</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">

              {/* ✨ ดักจับการซื้อคอร์ส */}
              <Link href="/student/courses" onClick={checkProfileBeforeAction}
                className="shortcut-card xl:col-span-2 bg-slate-900 text-white p-6 rounded-[2rem] flex flex-col justify-between h-40 relative overflow-hidden shadow-lg">
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-orange-500/20 blur-2xl"></div>
                <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-blue-500/20 blur-xl"></div>
                <ShoppingCart size={28} className="text-orange-400 relative z-10"/>
                <div className="relative z-10">
                  <h3 className="font-black text-base leading-tight">ซื้อคอร์ส<br/>/ ชั่วโมงเรียน</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Shop Courses</p>
                </div>
              </Link>

              {/* ✨ ดักจับการจองคิว */}
              <Link href="/student/booking-flow" onClick={checkProfileBeforeAction}
                className="shortcut-card card-glass rounded-[2rem] p-6 flex flex-col justify-between h-40 border-0 relative overflow-hidden">
                {needsProfileUpdate && <div className="absolute top-0 right-0 w-0 h-0 border-[20px] border-transparent border-t-red-500 border-r-red-500"></div>}
                <Calendar size={26} className="text-blue-500"/>
                <div>
                  <h3 className="font-black text-slate-800 text-sm leading-tight">จองคิวเรียน</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Book a Class</p>
                </div>
              </Link>

              {/* AI Tutor */}
              <Link href="/student/ai-tutor"
                className="shortcut-card p-6 rounded-[2rem] flex flex-col justify-between h-40 relative overflow-hidden shadow-lg"
                style={{background: 'linear-gradient(135deg, #7c3aed, #4f46e5)'}}>
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl"></div>
                <Bot size={26} className="text-purple-200 relative z-10"/>
                <div className="relative z-10">
                  <h3 className="font-black text-white text-sm leading-tight">พี่หมี AI<br/>ช่วยสอน</h3>
                  <p className="text-[9px] text-purple-300 font-bold uppercase tracking-widest mt-1">AI Tutor</p>
                </div>
              </Link>

              {/* Books */}
              <Link href="/student/my-books"
                className="shortcut-card p-6 rounded-[2rem] flex flex-col justify-between h-40 relative overflow-hidden shadow-lg"
                style={{background: 'linear-gradient(135deg, #f97316, #fb923c)'}}>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/15 blur-2xl"></div>
                <BookOpen size={26} className="text-white relative z-10"/>
                <div className="relative z-10">
                  <h3 className="font-black text-white text-sm leading-tight">คลังชีท<br/>/ ขายชีท</h3>
                  <p className="text-[9px] text-orange-100 font-bold uppercase tracking-widest mt-1">My Books</p>
                </div>
              </Link>

              {/* Orders */}
              <Link href="/student/orders"
                className="shortcut-card card-glass rounded-[2rem] p-6 flex flex-col justify-between h-40 border-0">
                <History size={26} className="text-slate-500"/>
                <div>
                  <h3 className="font-black text-slate-800 text-sm leading-tight">ประวัติ<br/>การซื้อ</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Orders</p>
                </div>
              </Link>

              {/* Tutors */}
              <Link href="/student/tutors"
                className="shortcut-card card-glass rounded-[2rem] p-6 flex flex-col justify-between h-40 border-0">
                <Users size={26} className="text-emerald-500"/>
                <div>
                  <h3 className="font-black text-slate-800 text-sm leading-tight">ทำเนียบ<br/>ติวเตอร์</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tutors</p>
                </div>
              </Link>

            </div>
          </section>

          {/* ── REFERRAL + REWARD (side by side on desktop) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 fade-up">

            {/* Referral — 3 cols */}
            <div className="ref-card lg:col-span-3 rounded-[2rem] p-7 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full pointer-events-none"
                style={{background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)'}}></div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                <Share2 size={24}/>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-800 text-base mb-1">ชวนเพื่อนเรียน รับแต้มฟรี! 🎁</h3>
                <p className="text-slate-400 text-xs mb-4" style={{fontFamily: 'Sarabun, sans-serif'}}>ให้เพื่อนกรอกรหัสของคุณตอนสมัคร เพื่อรับแต้มสะสม</p>

                <div className="flex items-center gap-2 bg-white/80 border border-blue-100 rounded-2xl px-5 py-3 shadow-sm">
                  <span className="font-black text-blue-600 tracking-[0.15em] text-lg flex-1">
                    {studentData?.referral_code || '...'}
                  </span>
                  <button onClick={handleCopyRef}
                    className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors active:scale-95 shadow-md">
                    {copied ? <Check size={16}/> : <Copy size={16}/>}
                  </button>
                </div>
              </div>
            </div>

            {/* Reward Banner — 2 cols */}
            <Link href="/student/affiliate/shop"
              className="reward-banner lg:col-span-2 rounded-[2rem] p-7 text-white flex flex-col justify-between min-h-[180px] shadow-[0_8px_32px_rgba(249,115,22,0.28)] group">
              <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)'}}></div>

              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                <Gift size={22}/>
              </div>

              <div>
                <h3 className="font-black text-xl leading-tight mb-1">ร้านค้าเด็กขยัน<br/>🏆 Reward Shop</h3>
                <p className="text-white/80 text-xs" style={{fontFamily: 'Sarabun, sans-serif'}}>ใช้แต้มสะสมแลกรับของรางวัลพิเศษ</p>
              </div>

              <div className="flex items-center gap-2 font-black text-sm mt-2">
                ไปแลกรางวัล <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </div>
            </Link>
          </div>

        </div>
      </main>

      <FloatingAIMascot />
    </div>
  );
}
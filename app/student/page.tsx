'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, Wallet, Calendar, Clock, BookOpen, 
  History, Settings, Users, Gift, Share2, Copy, 
  Check, Loader2, ArrowRight, ShoppingCart,
  LayoutDashboard, Globe, MapPin, User, Home, Sparkles, Heart
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: walletData } = await supabase
        .from('student_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-blue-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex font-sans text-slate-800 relative selection:bg-orange-200">
      
      {/* 🪄 CSS ซ่อน Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* --- Sidebar (Desktop Only) --- */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-orange-100/50 hidden lg:flex flex-col fixed inset-y-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-orange-50 flex items-center gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 blur-[40px] rounded-full"></div>
          
          {studentData?.avatar_url ? (
            <img src={studentData.avatar_url} alt="Profile" className="w-12 h-12 rounded-[1rem] object-cover shadow-sm border border-slate-100 relative z-10" />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[1rem] flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200 relative z-10">
              {wallet?.student_name?.charAt(0) || 'TC'}
            </div>
          )}
          <div className="relative z-10">
            <h2 className="font-black text-xl text-slate-800">TC Center</h2>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-0.5">Student Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto hide-scrollbar">
          <Link href="/student" className="flex items-center gap-3 px-5 py-3.5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-[0_4px_15px_rgba(37,99,235,0.25)]"><LayoutDashboard size={20}/> แดชบอร์ด</Link>
          
          <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-3">การเรียน</p>
          <Link href="/student/booking-flow" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-[1.5rem] font-bold transition-colors group"><Calendar size={20} className="group-hover:scale-110 transition-transform"/> จองคิวเรียน</Link>
          <Link href="/student/my-schedule" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-pink-50 hover:text-pink-600 rounded-[1.5rem] font-bold transition-colors group"><Clock size={20} className="group-hover:scale-110 transition-transform"/> ตารางเรียน</Link>
          <Link href="/student/my-books" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-orange-50 hover:text-orange-600 rounded-[1.5rem] font-bold transition-colors group"><BookOpen size={20} className="group-hover:scale-110 transition-transform"/> คลังหนังสือและชีท</Link>
          <Link href="/student/tutors" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-[1.5rem] font-bold transition-colors group"><Users size={20} className="group-hover:scale-110 transition-transform"/> ทำเนียบติวเตอร์</Link>
          
          <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-3">ร้านค้า & โปรไฟล์</p>
          <Link href="/student/courses" className="flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-orange-500 transition-all shadow-md group">
            <ShoppingCart size={20} className="text-orange-400 group-hover:text-white group-hover:scale-110 transition-transform"/> ซื้อคอร์ส / เพิ่มชั่วโมง
          </Link>
          <Link href="/student/orders" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-[1.5rem] font-bold transition-colors mt-1"><History size={20}/> ประวัติการสั่งซื้อ</Link>
          <Link href="/student/profile" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-[1.5rem] font-bold transition-colors"><Settings size={20}/> ตั้งค่าโปรไฟล์</Link>
          <Link href="/student/affiliate/shop" className="flex items-center justify-between px-5 py-3.5 text-pink-500 hover:bg-pink-50 rounded-[1.5rem] font-black transition-colors group"><div className="flex items-center gap-3"><Gift size={20} className="group-hover:scale-110 transition-transform"/> ร้านค้าแลกของรางวัล</div></Link>
        </nav>

        <div className="p-6 border-t border-orange-50 bg-white">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-500 rounded-[1.5rem] font-black hover:bg-red-500 hover:text-white transition-all active:scale-95"><LogOut size={20}/> ออกจากระบบ</button>
        </div>
      </aside>

      {/* --- Mobile Bottom Navigation --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-6 py-3 flex justify-between items-center z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        <Link href="/student" className="flex flex-col items-center gap-1 text-blue-600">
          <LayoutDashboard size={22} />
          <span className="text-[9px] font-black uppercase">Dashboard</span>
        </Link>
        <Link href="/student/booking-flow" className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
          <Calendar size={22} />
          <span className="text-[9px] font-black uppercase">จองเรียน</span>
        </Link>
        <Link href="/student/courses" className="flex flex-col items-center gap-1 group">
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-3.5 rounded-[1.2rem] -mt-10 shadow-[0_8px_20px_rgba(249,115,22,0.3)] border-4 border-white group-hover:-translate-y-1 transition-transform">
            <ShoppingCart size={22} />
          </div>
          <span className="text-[9px] font-black uppercase mt-1 text-slate-800">ซื้อคอร์ส</span>
        </Link>
        <Link href="/student/my-schedule" className="flex flex-col items-center gap-1 text-slate-400 hover:text-pink-600 transition-colors">
          <Clock size={22} />
          <span className="text-[9px] font-black uppercase">ตาราง</span>
        </Link>
        <Link href="/student/profile" className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
          <User size={22} />
          <span className="text-[9px] font-black uppercase">โปรไฟล์</span>
        </Link>
      </div>

      {/* --- Main Content --- */}
      <main className="flex-1 lg:ml-72 p-6 md:p-10 lg:p-14 pb-32 overflow-y-auto max-w-6xl hide-scrollbar relative z-10">
        
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-50 border border-pink-100 rounded-full text-[10px] font-bold text-pink-600 mb-3">
              <Heart size={12} className="text-pink-500 fill-pink-500 animate-pulse" /> ยินดีต้อนรับกลับมา
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 text-left text-slate-800">
              สวัสดี, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">{wallet?.student_name || 'นักเรียน'}</span> 👋
            </h1>
            <p className="text-slate-500 font-bold text-sm text-left">พร้อมจะเรียนรู้และสนุกไปด้วยกันหรือยัง?</p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <button onClick={handleLogout} className="lg:hidden p-3 bg-white text-red-500 rounded-2xl active:scale-95 transition-all shadow-sm border border-red-50">
                <LogOut size={20}/>
              </button>

              <Link href="/student/profile" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
                {studentData?.avatar_url ? (
                  <img src={studentData.avatar_url} alt="Profile" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-[0_4px_15px_rgba(0,0,0,0.1)] border-4 border-white" />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-black text-2xl shadow-[0_4px_15px_rgba(37,99,235,0.3)] border-4 border-white">
                    {wallet?.student_name?.charAt(0) || 'TC'}
                  </div>
                )}
              </Link>
            </div>
            
            <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-all shadow-sm border border-slate-100 active:scale-95">
              <Home size={14}/> หน้าหลักเว็บไซต์
            </Link>
          </div>
        </header>

        {/* 1. Tier Hours (✨ ปรับปรุงแบบรวบตึง ปัดซ้ายขวาบนมือถือ) */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6 justify-start">
            <Wallet className="text-blue-600" size={24}/>
            <h2 className="text-xl font-black text-slate-800">ชั่วโมงเรียนคงเหลือ (แยกตามคอร์ส)</h2>
          </div>
          
          {/* ✨ เปลี่ยนเป็น flex overflow-x-auto ในมือถือ และ Grid ในจอใหญ่ */}
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-6 md:pb-0 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
            
            {/* ประถม-ม.ต้น */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-blue-100 overflow-hidden flex flex-col h-full hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)] transition-all duration-300 hover:-translate-y-1 min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center shrink-0">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 md:p-5 text-center font-black text-base md:text-lg relative overflow-hidden">
                ประถม - ม.ต้น
                <Sparkles size={32} className="absolute -right-2 -bottom-2 opacity-20" />
              </div>
              <div className="p-5 md:p-6 flex-1 flex flex-col justify-between text-left bg-blue-50/30">
                <div className="flex justify-between items-center mb-5 md:mb-6 px-2 md:px-4">
                  <div className="text-center flex-1">
                    <p className="text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-1"><Globe size={12}/> Online</p>
                    <p className="text-3xl md:text-4xl font-black text-blue-600">{wallet?.tier1_online_balance || 0} <span className="text-xs md:text-sm text-blue-300 font-bold">ชม.</span></p>
                  </div>
                  <div className="w-px h-10 md:h-12 bg-blue-200/50 mx-2"></div>
                  <div className="text-center flex-1">
                    <p className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-1"><MapPin size={12}/> Onsite</p>
                    <p className="text-3xl md:text-4xl font-black text-emerald-500">{wallet?.tier1_onsite_balance || 0} <span className="text-xs md:text-sm text-emerald-300 font-bold">ชม.</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/student/booking-flow?tier=tier1&type=Online" className="flex-1 bg-blue-100 text-blue-700 py-2.5 md:py-3 rounded-[1rem] md:rounded-[1.2rem] font-black text-[10px] md:text-xs text-center hover:bg-blue-200 transition-colors">จอง ONLINE</Link>
                  <Link href="/student/booking-flow?tier=tier1&type=Onsite" className="flex-1 bg-emerald-100 text-emerald-700 py-2.5 md:py-3 rounded-[1rem] md:rounded-[1.2rem] font-black text-[10px] md:text-xs text-center hover:bg-emerald-200 transition-colors">จอง ONSITE</Link>
                </div>
              </div>
            </div>

            {/* สอบเข้า ม.4 */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-purple-100 overflow-hidden flex flex-col h-full hover:shadow-[0_8px_30px_rgba(147,51,234,0.12)] transition-all duration-300 hover:-translate-y-1 min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center shrink-0">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 md:p-5 text-center font-black text-base md:text-lg relative overflow-hidden">
                สอบเข้า ม.4
                <Sparkles size={32} className="absolute -right-2 -bottom-2 opacity-20" />
              </div>
              <div className="p-5 md:p-6 flex-1 flex flex-col justify-between text-left bg-purple-50/30">
                <div className="flex justify-between items-center mb-5 md:mb-6 px-2 md:px-4">
                  <div className="text-center flex-1">
                    <p className="text-[9px] md:text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-1"><Globe size={12}/> Online</p>
                    <p className="text-3xl md:text-4xl font-black text-purple-600">{wallet?.tier2_online_balance || 0} <span className="text-xs md:text-sm text-purple-300 font-bold">ชม.</span></p>
                  </div>
                  <div className="w-px h-10 md:h-12 bg-purple-200/50 mx-2"></div>
                  <div className="text-center flex-1">
                    <p className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-1"><MapPin size={12}/> Onsite</p>
                    <p className="text-3xl md:text-4xl font-black text-emerald-500">{wallet?.tier2_onsite_balance || 0} <span className="text-xs md:text-sm text-emerald-300 font-bold">ชม.</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/student/booking-flow?tier=tier2&type=Online" className="flex-1 bg-purple-100 text-purple-700 py-2.5 md:py-3 rounded-[1rem] md:rounded-[1.2rem] font-black text-[10px] md:text-xs text-center hover:bg-purple-200 transition-colors">จอง ONLINE</Link>
                  <Link href="/student/booking-flow?tier=tier2&type=Onsite" className="flex-1 bg-emerald-100 text-emerald-700 py-2.5 md:py-3 rounded-[1rem] md:rounded-[1.2rem] font-black text-[10px] md:text-xs text-center hover:bg-emerald-200 transition-colors">จอง ONSITE</Link>
                </div>
              </div>
            </div>

            {/* ม.ปลาย/มหาลัย */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-orange-100 overflow-hidden flex flex-col h-full hover:shadow-[0_8px_30px_rgba(249,115,22,0.12)] transition-all duration-300 hover:-translate-y-1 min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center shrink-0">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 md:p-5 text-center font-black text-base md:text-lg relative overflow-hidden">
                ม.ปลาย / มหาลัย
                <Sparkles size={32} className="absolute -right-2 -bottom-2 opacity-20" />
              </div>
              <div className="p-5 md:p-6 flex-1 flex flex-col justify-between text-left bg-orange-50/30">
                <div className="flex justify-between items-center mb-5 md:mb-6 px-2 md:px-4">
                  <div className="text-center flex-1">
                    <p className="text-[9px] md:text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-1"><Globe size={12}/> Online</p>
                    <p className="text-3xl md:text-4xl font-black text-orange-600">{wallet?.tier3_online_balance || 0} <span className="text-xs md:text-sm text-orange-300 font-bold">ชม.</span></p>
                  </div>
                  <div className="w-px h-10 md:h-12 bg-orange-200/50 mx-2"></div>
                  <div className="text-center flex-1">
                    <p className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-1"><MapPin size={12}/> Onsite</p>
                    <p className="text-3xl md:text-4xl font-black text-emerald-500">{wallet?.tier3_onsite_balance || 0} <span className="text-xs md:text-sm text-emerald-300 font-bold">ชม.</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/student/booking-flow?tier=tier3&type=Online" className="flex-1 bg-orange-100 text-orange-700 py-2.5 md:py-3 rounded-[1rem] md:rounded-[1.2rem] font-black text-[10px] md:text-xs text-center hover:bg-orange-200 transition-colors">จอง ONLINE</Link>
                  <Link href="/student/booking-flow?tier=tier3&type=Onsite" className="flex-1 bg-emerald-100 text-emerald-700 py-2.5 md:py-3 rounded-[1rem] md:rounded-[1.2rem] font-black text-[10px] md:text-xs text-center hover:bg-emerald-200 transition-colors">จอง ONSITE</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shortcuts (Colorful Cards) */}
        <section className="mb-12">
          <h2 className="text-xl font-black mb-6 text-left text-slate-800">เมนูทางลัดสุดว้าว ✨</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            
            <Link href="/student/courses" className="bg-slate-900 text-white p-5 md:p-6 rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-36 border border-slate-800 text-left relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-500/20 blur-xl rounded-full"></div>
              <ShoppingCart size={32} className="text-orange-400 group-hover:scale-110 transition-transform relative z-10"/>
              <div className="text-left relative z-10">
                <h3 className="font-black text-base md:text-lg leading-tight text-left">ซื้อคอร์ส / ชม.</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-left">Shop Courses</p>
              </div>
            </Link>
            
            <Link href="/student/booking-flow" className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-blue-100 hover:shadow-md hover:border-blue-300 transition-all group flex flex-col justify-between h-36 text-left">
              <Calendar size={32} className="text-blue-600 group-hover:scale-110 group-hover:rotate-6 transition-transform"/>
              <div className="text-left">
                <h3 className="font-black text-slate-800 text-base md:text-lg leading-tight text-left">จองคิวเรียน</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-left">Book a Class</p>
              </div>
            </Link>
            
            <Link href="/student/my-schedule" className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-pink-100 hover:shadow-md hover:border-pink-300 transition-all group flex flex-col justify-between h-36 text-left">
              <Clock size={32} className="text-pink-500 group-hover:scale-110 group-hover:-rotate-6 transition-transform"/>
              <div className="text-left">
                <h3 className="font-black text-slate-800 text-base md:text-lg leading-tight text-left">ตารางเรียน</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-left">My Schedule</p>
              </div>
            </Link>

            {/* คลังชีทนักเรียน ปรับให้เป็นสีส้มเด่น */}
            <Link href="/student/my-books" className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-5 md:p-6 rounded-[2rem] shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-1 transition-all group flex flex-col justify-between h-36 border border-orange-300 text-left relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 blur-2xl rounded-full"></div>
              <BookOpen size={32} className="text-white group-hover:scale-110 group-hover:-rotate-6 transition-transform relative z-10"/>
              <div className="text-left relative z-10">
                <h3 className="font-black text-base md:text-lg leading-tight text-left text-white drop-shadow-sm">คลังชีทนักเรียน /<br/>ระบบขายชีท</h3>
                <p className="text-[10px] text-orange-100 font-bold uppercase tracking-widest mt-1 text-left">My Books</p>
              </div>
            </Link>

            <Link href="/student/tutors" className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-emerald-100 hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col justify-between h-36 text-left">
              <Users size={32} className="text-emerald-500 group-hover:scale-110 group-hover:-rotate-6 transition-transform"/>
              <div className="text-left">
                <h3 className="font-black text-slate-800 text-base md:text-lg leading-tight text-left">ทำเนียบติวเตอร์</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-left">Tutors Catalog</p>
              </div>
            </Link>

          </div>
        </section>

        {/* Referral */}
        <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-8 border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mb-6 relative overflow-hidden group text-left">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-100/50 rounded-full blur-[40px] pointer-events-none"></div>
          <div className="flex items-center gap-6 relative z-10 text-left w-full md:w-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
              <Share2 size={28}/>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-slate-800 mb-1 text-left">ชวนเพื่อนเรียน รับแต้มฟรี! 🎁</h3>
              <p className="text-slate-500 font-bold text-sm text-left">ให้เพื่อนกรอกรหัสของคุณตอนสมัคร เพื่อรับแต้มสะสม</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 pl-6 rounded-[1.5rem] border border-blue-200 relative z-10 w-full md:w-auto text-left shadow-sm">
            <span className="font-black text-blue-600 tracking-[0.2em] text-lg flex-1 text-center md:text-left">{studentData?.referral_code || 'กำลังดึงรหัส...'}</span>
            <button onClick={handleCopyRef} className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-md">
              {copied ? <Check size={20}/> : <Copy size={20}/>}
            </button>
          </div>
        </div>

        <Link href="/student/affiliate/shop" className="block bg-gradient-to-r from-orange-500 to-pink-500 rounded-[3rem] p-8 md:p-10 text-white shadow-[0_8px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_12px_40px_rgba(236,72,153,0.4)] transition-all group relative overflow-hidden text-left hover:-translate-y-1">
          <div className="absolute right-0 bottom-0 opacity-20 group-hover:scale-125 transition-transform duration-700 text-left rotate-12"><Gift size={180} className="-mr-10 -mb-10"/></div>
          <div className="flex items-center justify-between relative z-10 text-left">
            <div className="flex items-center gap-6 text-left">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center shadow-inner shrink-0 text-left border border-white/30"><Gift size={32}/></div>
              <div className="text-left">
                <h3 className="text-2xl font-black mb-1 text-left">ร้านค้าเด็กขยัน (Reward Shop)</h3>
                <p className="text-white/90 font-bold text-sm text-left">ใช้แต้มสะสมแลกรับของรางวัลพิเศษมากมาย คุ้มสุดๆ!</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 font-black text-sm uppercase tracking-widest bg-white text-orange-600 px-6 py-3 rounded-[1.2rem] text-left shadow-md group-hover:scale-105 transition-transform">
              ไปแลกรางวัลกันเลย <ArrowRight size={18}/>
            </div>
          </div>
        </Link>

      </main>
    </div>
  );
}
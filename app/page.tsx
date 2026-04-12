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
  MessagesSquare, Bot // ✨ เพิ่มไอคอน AI
} from 'lucide-react';

// ✨ นำเข้าน้องหมี AI
import FloatingAIMascot from '@/components/FloatingAIMascot';

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

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto hide-scrollbar text-left">
          <Link href="/student" className="flex items-center gap-3 px-5 py-3.5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-[0_4px_15px_rgba(37,99,235,0.25)]"><LayoutDashboard size={20}/> แดชบอร์ด</Link>
          
          <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-3">การเรียน</p>
          <Link href="/student/booking-flow" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-[1.5rem] font-bold transition-colors group"><Calendar size={20} className="group-hover:scale-110 transition-transform"/> จองคิวเรียน</Link>
          <Link href="/student/my-schedule" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-pink-50 hover:text-pink-600 rounded-[1.5rem] font-bold transition-colors group"><Clock size={20} className="group-hover:scale-110 transition-transform"/> ตารางเรียน</Link>
          <Link href="/student/my-books" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-orange-50 hover:text-orange-600 rounded-[1.5rem] font-bold transition-colors group"><BookOpen size={20} className="group-hover:scale-110 transition-transform"/> คลังหนังสือและชีท</Link>
          
          {/* ✨ เมนู AI ใน Sidebar */}
          <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="w-full flex items-center gap-3 px-5 py-3.5 text-purple-600 hover:bg-purple-50 rounded-[1.5rem] font-black transition-colors group">
            <Bot size={20} className="group-hover:scale-110 transition-transform"/> พี่หมี AI ช่วยสอน
          </button>

          <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-3">ร้านค้า & โปรไฟล์</p>
          <Link href="/student/courses" className="flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-orange-500 transition-all shadow-md group">
            <ShoppingCart size={20} className="text-orange-400 group-hover:text-white group-hover:scale-110 transition-transform"/> ซื้อคอร์ส / เพิ่มชั่วโมง
          </Link>
          <Link href="/student/profile" className="flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-[1.5rem] font-bold transition-colors"><Settings size={20}/> ตั้งค่าโปรไฟล์</Link>
        </nav>

        <div className="p-6 border-t border-orange-50 bg-white">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-500 rounded-[1.5rem] font-black hover:bg-red-500 hover:text-white transition-all active:scale-95"><LogOut size={20}/> ออกจากระบบ</button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 lg:ml-72 overflow-y-auto hide-scrollbar relative z-10 w-full">
        <div className="w-full max-w-5xl mx-auto p-6 md:p-10 lg:p-14 pb-32">
          
          <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="text-left w-full sm:w-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-50 border border-pink-200 rounded-full text-[10px] font-bold text-pink-600 mb-3 shadow-sm">
                <Heart size={12} className="text-pink-500 fill-pink-500 animate-pulse" /> ยินดีต้อนรับกลับมา
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 text-left text-slate-800">
                สวัสดี, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">{wallet?.student_name || 'นักเรียน'}</span> 👋
              </h1>
              <p className="text-slate-500 font-bold text-sm text-left">พร้อมจะเรียนรู้และสนุกไปด้วยกันกับ <span className="text-blue-600">TC AI Tutor</span> หรือยัง?</p>
            </div>
            
            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <Link href="/student/profile" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
                {studentData?.avatar_url ? (
                  <img src={studentData.avatar_url} alt="Profile" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-[0_4px_15px_rgba(0,0,0,0.1)] border-4 border-white" />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-black text-2xl shadow-[0_4px_15px_rgba(37,99,235,0.3)] border-4 border-white">
                    {wallet?.student_name?.charAt(0) || 'TC'}
                  </div>
                )}
              </Link>
              <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-all shadow-sm border border-slate-100">
                <Home size={14}/> หน้าหลักเว็บไซต์
              </Link>
            </div>
          </header>

          {/* ชั่วโมงเรียนคงเหลือ */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6 justify-start">
              <Wallet className="text-blue-600" size={24}/>
              <h2 className="text-xl font-black text-slate-800">ชั่วโมงเรียนคงเหลือ</h2>
            </div>
            
            <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-6 md:pb-0 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
              {/* สรุป Tier ย่อๆ */}
              <div className="bg-white rounded-[2rem] shadow-sm border border-blue-100 p-6 min-w-[85vw] md:min-w-0 snap-center text-left">
                <p className="text-[10px] font-black text-blue-500 uppercase mb-2">ประถม-ม.ต้น</p>
                <p className="text-4xl font-black text-slate-800">{wallet?.tier1_online_balance || 0} <span className="text-sm text-slate-400">Online</span></p>
              </div>
              <div className="bg-white rounded-[2rem] shadow-sm border border-purple-100 p-6 min-w-[85vw] md:min-w-0 snap-center text-left">
                <p className="text-[10px] font-black text-purple-500 uppercase mb-2">สอบเข้า ม.4</p>
                <p className="text-4xl font-black text-slate-800">{wallet?.tier2_online_balance || 0} <span className="text-sm text-slate-400">Online</span></p>
              </div>
              <div className="bg-white rounded-[2rem] shadow-sm border border-orange-100 p-6 min-w-[85vw] md:min-w-0 snap-center text-left">
                <p className="text-[10px] font-black text-orange-500 uppercase mb-2">ม.ปลาย/มหาลัย</p>
                <p className="text-4xl font-black text-slate-800">{wallet?.tier3_online_balance || 0} <span className="text-sm text-slate-400">Online</span></p>
              </div>
            </div>
          </section>

          {/* Shortcuts */}
          <section className="mb-12">
            <h2 className="text-xl font-black mb-6 text-left text-slate-800">เมนูทางลัดสุดว้าว ✨</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              
              <Link href="/student/booking-flow" className="bg-white p-6 rounded-[2rem] shadow-sm border border-blue-100 hover:shadow-md transition-all group flex flex-col justify-between h-40 text-left">
                <Calendar size={32} className="text-blue-600 group-hover:scale-110 transition-transform"/>
                <h3 className="font-black text-slate-800 text-base leading-tight">จองคิวเรียน<br/><span className="text-[10px] text-slate-400 uppercase">Book Class</span></h3>
              </Link>
              
              {/* ✨ ปุ่มคุยกับ AI แบบจัดเต็ม (Highlight) */}
              <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-[2rem] shadow-lg shadow-purple-200 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-40 text-left relative overflow-hidden text-white"
              >
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 blur-xl rounded-full"></div>
                <MessagesSquare size={32} className="text-purple-100 group-hover:scale-110 transition-transform relative z-10"/>
                <div className="relative z-10">
                  <h3 className="font-black text-base leading-tight">ถามการบ้าน<br/>กับพี่หมี AI</h3>
                  <p className="text-[9px] text-purple-100 font-bold uppercase mt-1">Chat with AI Bear</p>
                </div>
              </button>

              <Link href="/student/my-books" className="bg-white p-6 rounded-[2rem] shadow-sm border border-orange-100 hover:shadow-md transition-all group flex flex-col justify-between h-40 text-left">
                <BookOpen size={32} className="text-orange-500 group-hover:scale-110 transition-transform"/>
                <h3 className="font-black text-slate-800 text-base leading-tight">คลังหนังสือ<br/><span className="text-[10px] text-slate-400 uppercase">My Books</span></h3>
              </Link>

              <Link href="/student/courses" className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl hover:shadow-orange-200 hover:-translate-y-1 transition-all group flex flex-col justify-between h-40 text-left">
                <ShoppingCart size={32} className="text-orange-400 group-hover:scale-110 transition-transform"/>
                <h3 className="font-black text-base leading-tight">ซื้อคอร์สเรียน<br/><span className="text-[10px] text-slate-400 uppercase">Shop</span></h3>
              </Link>

            </div>
          </section>

          {/* Referral & Reward */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-blue-100 shadow-sm text-left">
              <h3 className="font-black text-xl mb-4 flex items-center gap-2"><Share2 className="text-blue-500" size={20}/> ชวนเพื่อนรับแต้ม</h3>
              <div className="flex items-center gap-2 bg-blue-50 p-2 pl-6 rounded-2xl border border-blue-100">
                <span className="font-black text-blue-600 tracking-widest flex-1">{studentData?.referral_code || '---'}</span>
                <button onClick={handleCopyRef} className="bg-white text-blue-600 p-3 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all">
                  {copied ? <Check size={18}/> : <Copy size={18}/>}
                </button>
              </div>
            </div>

            <Link href="/student/affiliate/shop" className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-[2.5rem] p-8 text-white shadow-lg flex items-center justify-between group hover:-translate-y-1 transition-all">
              <div className="text-left">
                <h3 className="font-black text-xl mb-1 italic">Reward Shop</h3>
                <p className="text-xs text-white/80 font-bold">แลกของรางวัลสุดพิเศษ 🎁</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-orange-500 transition-all">
                <ArrowRight size={24}/>
              </div>
            </Link>
          </div>

        </div>
      </main>

      {/* ✨ 2. วางน้องพี่หมี AI ลอยอยู่ด้านบนสุดของหน้านี้ */}
      <FloatingAIMascot />

    </div>
  );
}
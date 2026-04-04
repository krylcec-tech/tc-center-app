'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, Wallet, Calendar, Clock, BookOpen, 
  History, Settings, Users, Gift, Share2, Copy, 
  Check, Loader2, ArrowRight, ShoppingCart,
  LayoutDashboard, Globe, MapPin, User 
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
      // 1. ตรวจสอบ User ที่ Login อยู่
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // 2. ดึงข้อมูลโปรไฟล์ (เพื่อเอา referral_code จริงจากเบส)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // 3. ดึงข้อมูลกระเป๋าเงินนักเรียน
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
    // ใช้ค่าจาก studentData.referral_code ที่ดึงมาจากเบสเท่านั้น
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-900">
      
      {/* --- Sidebar --- */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden lg:flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 border-b border-gray-50 flex items-center gap-3">
          {studentData?.avatar_url ? (
            <img src={studentData.avatar_url} alt="Profile" className="w-12 h-12 rounded-[1rem] object-cover shadow-md border border-gray-100" />
          ) : (
            <div className="w-12 h-12 bg-blue-600 text-white rounded-[1rem] flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">
              {wallet?.student_name?.charAt(0) || 'TC'}
            </div>
          )}
          <div>
            <h2 className="font-black text-xl">TC Center</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          <Link href="/student" className="flex items-center gap-3 px-5 py-3.5 bg-blue-50 text-blue-600 rounded-[1.5rem] font-black">
            <LayoutDashboard size={20}/> แดชบอร์ด
          </Link>
          
          <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 mb-3">การเรียน</p>
          <Link href="/student/booking-flow" className="flex items-center gap-3 px-5 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-[1.5rem] font-bold transition-colors">
            <Calendar size={20}/> จองคิวเรียน
          </Link>
          <Link href="/student/my-schedule" className="flex items-center gap-3 px-5 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-[1.5rem] font-bold transition-colors">
            <Clock size={20}/> ตารางเรียน
          </Link>
          <Link href="/student/tutors" className="flex items-center gap-3 px-5 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-[1.5rem] font-bold transition-colors">
            <Users size={20}/> ทำเนียบติวเตอร์
          </Link>
          
          <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 mb-3">ร้านค้า & โปรไฟล์</p>
          <Link href="/student/courses" className="flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white rounded-[1.5rem] font-black hover:bg-blue-600 transition-all shadow-md group">
            <ShoppingCart size={20} className="group-hover:scale-110 transition-transform"/> ซื้อคอร์ส / เพิ่มชั่วโมง
          </Link>
          <Link href="/student/orders" className="flex items-center gap-3 px-5 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-[1.5rem] font-bold transition-colors mt-1">
            <History size={20}/> ประวัติการสั่งซื้อ
          </Link>
          <Link href="/student/profile" className="flex items-center gap-3 px-5 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-[1.5rem] font-bold transition-colors">
            <Settings size={20}/> ตั้งค่าโปรไฟล์
          </Link>
          <Link href="/student/affiliate/shop" className="flex items-center justify-between px-5 py-3.5 text-orange-500 hover:bg-orange-50 rounded-[1.5rem] font-black transition-colors">
            <div className="flex items-center gap-3"><Gift size={20}/> ร้านค้าแลกของรางวัล</div>
          </Link>
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-500 rounded-[1.5rem] font-black hover:bg-red-500 hover:text-white transition-all active:scale-95">
            <LogOut size={20}/> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 lg:ml-72 p-6 md:p-10 lg:p-14 overflow-y-auto max-w-6xl no-scrollbar">
        
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">สวัสดี, <span className="text-blue-600">{wallet?.student_name || 'นักเรียน'}</span> 👋</h1>
            <p className="text-gray-500 font-bold text-sm">ยินดีต้อนรับกลับสู่ห้องเรียนของคุณ</p>
          </div>
          
          <Link href="/student/profile" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
            {studentData?.avatar_url ? (
              <img src={studentData.avatar_url} alt="Profile" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-lg border-4 border-white" />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-2xl shadow-lg border-4 border-white">
                {wallet?.student_name?.charAt(0) || 'TC'}
              </div>
            )}
          </Link>
        </header>

        {/* 1. ชั่วโมงคงเหลือ */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="text-blue-600" size={24}/>
            <h2 className="text-xl font-black">ชั่วโมงเรียนคงเหลือ (แยกตาม Tier)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 - 3 UI (โค้ดเดิมที่ถูกต้องแล้ว) */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="bg-blue-600 text-white p-5 text-center font-black text-lg">ประถม - ม.ต้น</div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6 px-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-1"><Globe size={12}/> Online</p>
                    <p className="text-4xl font-black text-blue-600">{wallet?.tier1_online_hours || 0} <span className="text-sm text-gray-300 font-bold">ชม.</span></p>
                  </div>
                  <div className="w-px h-12 bg-gray-100"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-1"><MapPin size={12}/> Onsite</p>
                    <p className="text-4xl font-black text-green-500">{wallet?.tier1_onsite_hours || 0} <span className="text-sm text-gray-300 font-bold">ชม.</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/student/booking-flow?tier=tier1&type=Online" className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-2xl font-black text-xs text-center hover:bg-blue-100 transition-colors">จอง ONLINE</Link>
                  <Link href="/student/booking-flow?tier=tier1&type=Onsite" className="flex-1 bg-green-50 text-green-600 py-3 rounded-2xl font-black text-xs text-center hover:bg-green-100 transition-colors">จอง ONSITE</Link>
                </div>
              </div>
            </div>
            {/* (ส่วนของ Tier 2 และ 3 ในไฟล์จริงจะอยู่ตรงนี้ ซึ่งเหมือนกับ Tier 1 ครับ) */}
          </div>
        </section>

        {/* 3. ชวนเพื่อนรับแต้ม (จุดที่แก้ไข!) */}
        <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mb-6 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Share2 size={200}/></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner shrink-0">
              <Share2 size={28}/>
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-1">ชวนเพื่อนเรียน รับแต้มฟรี! 🎁</h3>
              <p className="text-gray-500 font-bold text-sm">ให้เพื่อนกรอกรหัสของคุณตอนแจ้งโอน เพื่อรับแต้มสะสม</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 p-2 pl-6 rounded-3xl border border-gray-200 relative z-10 w-full md:w-auto">
            {/* แก้ไขบรรทัดล่างนี้: ลบ 1B8A18 ออก แล้วดึงจากฐานข้อมูลจริงๆ */}
            <span className="font-black text-blue-600 tracking-[0.2em] text-lg flex-1 text-center md:text-left">
               {studentData?.referral_code || 'ไม่มีรหัส'}
            </span>
            <button onClick={handleCopyRef} className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-md">
              {copied ? <Check size={20}/> : <Copy size={20}/>}
            </button>
          </div>
        </div>

        {/* ส่วนที่เหลือของโค้ด... */}
      </main>
    </div>
  );
}
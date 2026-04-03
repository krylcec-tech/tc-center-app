'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Calendar, 
  LogOut, 
  Loader2,
  UserCircle,
  ChevronRight,
  CalendarDays,
  History,
  CheckCircle2,
  Gift,
  Menu,
  X
} from 'lucide-react';

export default function TutorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tutorData, setTutorData] = useState({ name: '', avatar: '' });
  const [stats, setStats] = useState({ upcomingSlots: 0, completedHours: 0, todaySlots: 0 });
  
  // State สำหรับเปิด/ปิดเมนูในมือถือ
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchTutorData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/login');
        return;
      }

      // 1. ดึงข้อมูล Profile ติวเตอร์
      const { data: profile } = await supabase
        .from('tutors')
        .select('id, name, image_url, role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!profile) {
        router.replace('/login');
        return;
      }

      setTutorData({ 
        name: profile.name, 
        avatar: profile.image_url 
      });

      // 2. ดึงสถิติเฉพาะของติวเตอร์คนนี้
      const { count: upcomingCount } = await supabase
        .from('slots')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', profile.id)
        .gte('start_time', new Date().toISOString());

      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('slots')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', profile.id)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`);

      setStats({
        upcomingSlots: upcomingCount || 0,
        completedHours: 12, 
        todaySlots: todayCount || 0
      });

      setLoading(false);
    };

    fetchTutorData();
  }, [router]);

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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans">
      
      {/* --- Mobile Header (แสดงเฉพาะในมือถือ) --- */}
      <div className="lg:hidden bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            {tutorData.avatar ? (
              <img src={tutorData.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={40} className="text-gray-300" />
            )}
          </div>
          <span className="font-black text-gray-900">ครู{tutorData.name}</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* --- Overlay สีดำตอนเปิดเมนูมือถือ --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- Sidebar สำหรับ Tutor (รองรับทั้งคอมและมือถือ) --- */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* ปุ่มปิดเมนูมือถือ */}
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-xl"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center pt-12 lg:pt-8">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
            {tutorData.avatar ? (
              <img src={tutorData.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={80} className="text-gray-300" />
            )}
          </div>
          <h2 className="font-black text-gray-900 text-lg">{tutorData.name}</h2>
          <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1">Tutor Partner</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <Link href="/tutor" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold">
            <LayoutDashboard size={20} /> หน้าหลัก
          </Link>
          <Link href="/admin/calendar-slots" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-blue-600 rounded-2xl font-bold transition-all">
            <CalendarDays size={20} /> ตารางสอนของฉัน
          </Link>
          <Link href="/tutor/logs" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-blue-600 rounded-2xl font-bold transition-all">
            <History size={20} /> ประวัติการสอน
          </Link>
          
          {/* เมนู Affiliate ที่เพิ่มเข้ามาใหม่ */}
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">สร้างรายได้</p>
            <Link href="/tutor/affiliate" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-2xl font-black transition-all">
              <div className="flex items-center gap-3">
                <Gift size={20} /> ระบบของรางวัล
              </div>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            </Link>
          </div>
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all">
            <LogOut size={20} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto w-full">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900">
            สวัสดีครับ <span className="text-blue-600">ครู{tutorData.name}</span>
          </h1>
          <p className="text-gray-400 font-bold mt-2 text-sm md:text-base">วันนี้คุณมีสอนทั้งหมด {stats.todaySlots} คิว</p>
        </header>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <Calendar className="text-blue-600 mb-4" size={28} />
            <p className="text-gray-400 font-bold text-xs md:text-sm uppercase">คิวสอนที่กำลังมาถึง</p>
            <h3 className="text-3xl md:text-4xl font-black mt-2">{stats.upcomingSlots} <span className="text-lg text-gray-400">คิว</span></h3>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <CheckCircle2 className="text-green-500 mb-4" size={28} />
            <p className="text-gray-400 font-bold text-xs md:text-sm uppercase">สอนเสร็จแล้ว (เดือนนี้)</p>
            <h3 className="text-3xl md:text-4xl font-black mt-2">{stats.completedHours} <span className="text-lg text-gray-400">ชม.</span></h3>
          </div>
        </div>

        {/* --- Quick Actions --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          
          {/* การ์ดจัดการเวลาสอน */}
          <div className="bg-blue-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-blue-100 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-black mb-3">จัดการเวลาสอน</h2>
              <p className="text-blue-100 mb-8 font-medium text-sm md:text-base">เปิด-ปิดเวลาว่างของคุณ เพื่อให้นักเรียนสามารถกดจองคิวได้ทันที</p>
            </div>
            <Link href="/admin/calendar-slots" className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-6 md:px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all active:scale-95 w-max">
              เข้าสู่ปฏิทินสอน <ChevronRight size={20} />
            </Link>
          </div>

          <div className="flex flex-col gap-4 md:gap-8">
            {/* การ์ดระบบ Affiliate (เพิ่มใหม่) */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-purple-200 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2"><Gift size={24}/> ระบบนายหน้า</h2>
                <p className="text-purple-100 mb-6 text-sm">แชร์รหัสแนะนำของคุณ แลกเงินสดและของรางวัลฟรี!</p>
              </div>
              <Link href="/tutor/affiliate" className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white text-white hover:text-purple-600 backdrop-blur-md px-6 py-4 rounded-2xl font-black transition-all active:scale-95 w-max">
                ดูรหัสและแลกแต้ม <ChevronRight size={20} />
              </Link>
            </div>

            {/* การ์ดข้อมูลส่วนตัว */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between flex-1">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">ข้อมูลส่วนตัว</h2>
                <p className="text-gray-400 font-medium text-sm">จัดการรูปโปรไฟล์ และวิชาที่คุณถนัด</p>
              </div>
              <Link href="/tutor/profile" className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-2xl font-bold hover:bg-gray-100 transition-all text-gray-700">
                <span>ไปหน้าจัดการโปรไฟล์</span>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
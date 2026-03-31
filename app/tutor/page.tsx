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
  Clock,
  UserCircle,
  ChevronRight,
  CalendarDays,
  History,
  CheckCircle2
} from 'lucide-react';

export default function TutorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tutorData, setTutorData] = useState({ name: '', avatar: '' });
  const [stats, setStats] = useState({ upcomingSlots: 0, completedHours: 0, todaySlots: 0 });

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
      // คิวสอนทั้งหมดที่ยังไม่ผ่านไป (Upcoming)
      const { count: upcomingCount } = await supabase
        .from('slots')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', profile.id)
        .gte('start_time', new Date().toISOString());

      // คิวสอนของวันนี้
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('slots')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', profile.id)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`);

      setStats({
        upcomingSlots: upcomingCount || 0,
        completedHours: 12, // เดี๋ยวผูกกับระบบ Teaching Logs ในอนาคต
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* --- Sidebar สำหรับ Tutor --- */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col hidden lg:flex">
        <div className="p-8 text-center">
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

        <nav className="flex-1 px-4 space-y-1">
          <Link href="/tutor" className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold">
            <LayoutDashboard size={20} /> หน้าหลัก
          </Link>
          <Link href="/admin/calendar-slots" className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all">
            <CalendarDays size={20} /> ตารางสอนของฉัน
          </Link>
          <Link href="/tutor/logs" className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all">
            <History size={20} /> ประวัติการสอน
          </Link>
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all">
            <LogOut size={20} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-gray-900">
            สวัสดีครับ <span className="text-blue-600">ครู{tutorData.name}</span>
          </h1>
          <p className="text-gray-400 font-bold mt-2">วันนี้คุณมีสอนทั้งหมด {stats.todaySlots} คิว</p>
        </header>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <Calendar className="text-blue-600 mb-4" size={28} />
            <p className="text-gray-400 font-bold text-sm uppercase">คิวสอนที่กำลังมาถึง</p>
            <h3 className="text-4xl font-black mt-2">{stats.upcomingSlots} คิว</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <CheckCircle2 className="text-green-500 mb-4" size={28} />
            <p className="text-gray-400 font-bold text-sm uppercase">สอนเสร็จแล้ว (เดือนนี้)</p>
            <h3 className="text-4xl font-black mt-2">{stats.completedHours} ชม.</h3>
          </div>
        </div>

        {/* --- Quick Actions --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-xl shadow-blue-100">
            <h2 className="text-3xl font-black mb-4">จัดการเวลาสอน</h2>
            <p className="text-blue-100 mb-8 font-medium">เปิด-ปิดเวลาว่างของคุณ เพื่อให้นักเรียนสามารถกดจองคิวได้ทันที</p>
            <Link href="/admin/calendar-slots" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all">
              เข้าสู่ปฏิทินสอน <ChevronRight size={20} />
            </Link>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">ข้อมูลส่วนตัว</h2>
              <p className="text-gray-400 font-medium">จัดการรูปโปรไฟล์ และข้อมูลวิชาที่คุณถนัด</p>
            </div>
            <Link href="/tutor/profile" className="mt-8 flex items-center justify-between p-4 bg-gray-50 rounded-2xl font-bold hover:bg-gray-100 transition-all">
              <span>ไปหน้าจัดการโปรไฟล์</span>
              <ChevronRight />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
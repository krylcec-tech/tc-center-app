'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  LogOut, 
  ShieldCheck,
  Loader2,
  BookOpen,
  Clock,
  UserCheck,
  ChevronRight,
  CalendarDays 
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState({ name: '', email: '' });
  const [stats, setStats] = useState({ tutors: 0, hours: 0, students: 0 });

  useEffect(() => {
    const fetchAdminAndStats = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('tutors')
        .select('name, role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // 🛡️ เช็คสิทธิ์ Admin: ยึดจาก role ในฐานข้อมูลเป็นหลักเท่านั้น (ปลอดภัยกว่า)
      if (profile?.role?.toLowerCase() !== 'admin') {
        router.replace('/admin/calendar-slots'); // หรือเปลี่ยนเป็น '/tutor' ถ้ามี Dashboard แยก
        return;
      }

      setAdminData({ 
        name: profile?.name || 'แอดมิน', 
        email: session.user.email || '' 
      });

      // ดึงจำนวนติวเตอร์
      const { count: tutorCount } = await supabase.from('tutors').select('*', { count: 'exact', head: true });
      
      // ดึงจำนวนนักเรียน (สมมติว่าคุณมีตารางชื่อ 'students')
      const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });

      setStats({
        tutors: tutorCount || 0,
        hours: 24.5, // ส่วนนี้เดี๋ยวค่อยมาแก้ตอนทำระบบ Teaching Logs
        students: studentCount || 0
      });

      setLoading(false);
    };

    fetchAdminAndStats();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-gray-500 font-bold">กำลังเข้าสู่ระบบแอดมิน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* --- Sidebar Menu --- */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col hidden lg:flex">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">
              TC
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">TC Center</span>
          </div>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em]">The Convergence Portal</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">เมนูหลัก</p>
          
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold transition-all shadow-sm shadow-blue-50">
            <LayoutDashboard size={20} /> แผงควบคุม
          </Link>

          <Link href="/admin/manage-tutors" className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-2xl font-bold transition-all group">
            <Users size={20} className="group-hover:text-blue-500" /> จัดการติวเตอร์
          </Link>

          <Link href="/admin/calendar-slots" className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-2xl font-bold transition-all group">
            <CalendarDays size={20} className="group-hover:text-blue-500" /> ตารางสอน (ปฏิทิน)
          </Link>

          <Link href="/admin/manage-courses" className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-2xl font-bold transition-all group">
            <BookOpen size={20} className="group-hover:text-blue-500" /> จัดการคอร์สเรียน
          </Link>
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all border border-red-100">
            <LogOut size={20} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">Online</span>
                <span className="text-gray-400 text-xs">/ แผงควบคุมหลัก</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 leading-tight">
                ยินดีต้อนรับคุณ {adminData.name} <span className="text-blue-600">👋</span>
              </h1>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <UserCheck className="text-orange-500 mb-4" size={28} />
              <p className="text-gray-400 font-bold text-sm uppercase">ติวเตอร์</p>
              <h3 className="text-4xl font-black mt-2">{stats.tutors} คน</h3>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <Clock className="text-blue-600 mb-4" size={28} />
              <p className="text-gray-400 font-bold text-sm uppercase">ชั่วโมงสอน</p>
              <h3 className="text-4xl font-black mt-2 text-blue-600">{stats.hours} ชม.</h3>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <Users className="text-purple-600 mb-4" size={28} />
              <p className="text-gray-400 font-bold text-sm uppercase">นักเรียน</p>
              <h3 className="text-4xl font-black mt-2">{stats.students} คน</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-3xl font-black mb-4">ระบบจัดการเวลาสอน</h2>
                  <p className="text-blue-100 font-medium mb-8 leading-relaxed max-w-xs">
                    เปิด Slot เวลาในรูปแบบปฏิทิน และตรวจสอบคิวสอนของ Shiriu ได้ทันที
                  </p>
                  <Link href="/admin/calendar-slots" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all group">
                    ไปหน้าปฏิทิน <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
               </div>
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500 rounded-full opacity-50"></div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <Link href="/admin/manage-tutors" className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between hover:border-blue-400 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600">
                      <Users size={24} />
                    </div>
                    <h4 className="font-black text-gray-900 text-lg">จัดการติวเตอร์</h4>
                  </div>
                  <ChevronRight />
               </Link>

               <Link href="/admin/manage-slots" className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between hover:border-blue-400 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600">
                      <Calendar size={24} />
                    </div>
                    <h4 className="font-black text-gray-900 text-lg">ดูตารางสอน (แบบตาราง)</h4>
                  </div>
                  <ChevronRight />
               </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
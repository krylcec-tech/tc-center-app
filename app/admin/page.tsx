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
  Loader2,
  BookOpen,
  Clock,
  UserCheck,
  ChevronRight,
  CalendarDays,
  Store,
  Menu,
  X,
  Receipt,
  Wallet,
  Gift, 
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState({ name: '', email: '' });
  const [stats, setStats] = useState({ tutors: 0, hours: 0, students: 0, pendingRedeems: 0 });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      if (profile?.role?.toLowerCase() !== 'admin') {
        router.replace('/tutor'); 
        return;
      }

      setAdminData({ 
        name: profile?.name || 'แอดมิน', 
        email: session.user.email || '' 
      });

      const { count: tutorCount } = await supabase.from('tutors').select('*', { count: 'exact', head: true });
      const { count: studentCount } = await supabase.from('student_wallets').select('*', { count: 'exact', head: true });
      
      const { count: redeemCount } = await supabase
        .from('affiliate_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'REDEEM')
        .eq('status', 'PENDING');

      setStats({
        tutors: tutorCount || 0,
        hours: 0, 
        students: studentCount || 0,
        pendingRedeems: redeemCount || 0
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Admin Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-gray-900">
      
      {/* --- Mobile Header --- */}
      <div className="lg:hidden bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">TC</div>
          <span className="font-black">Admin Panel</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-50 text-gray-600 rounded-xl"><Menu size={24} /></button>
      </div>

      {/* --- Mobile Overlay --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* --- Sidebar Menu --- */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-4 right-4 p-2 text-gray-400"><X size={20} /></button>

        <div className="p-8 pt-12 lg:pt-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">TC</div>
            <span className="text-xl font-black tracking-tight">TC Center</span>
          </div>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em]">Management System</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 mt-2">Core Menu</p>
          
          <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold transition-all"><LayoutDashboard size={20} /> แผงควบคุม</Link>
          
          {/* ✨ เมนูใหม่: จัดการผู้ใช้งาน */}
          <Link href="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl font-bold transition-all">
            <UserCheck size={20} /> จัดการผู้ใช้งานทั้งหมด
          </Link>

          <Link href="/admin/wallets" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-2xl font-bold transition-all"><Wallet size={20} /> จัดการกระเป๋าเงิน (6-Tier)</Link>
          
          <Link href="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-2xl font-bold transition-all"><Receipt size={20} /> ตรวจสอบการแจ้งโอน</Link>

          <Link href="/admin/redeems" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-orange-50 hover:text-orange-600 rounded-2xl font-bold transition-all relative">
            <Gift size={20} /> จัดการการแลกรางวัล
            {stats.pendingRedeems > 0 && (
              <span className="absolute right-4 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">NEW</span>
            )}
          </Link>

          <Link href="/admin/manage-tutors" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><Users size={20} /> จัดการติวเตอร์</Link>
          <Link href="/admin/calendar-slots" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><CalendarDays size={20} /> ตารางสอน</Link>
          <Link href="/admin/manage-courses" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><BookOpen size={20} /> จัดการคอร์สเรียน</Link>
          <Link href="/admin/shop" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-2xl font-black border border-purple-100 transition-all"><Store size={20} /> จัดการร้านค้ารางวัล</Link>
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 border border-red-100 transition-all active:scale-95"><LogOut size={20} /> Logout</button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto w-full no-scrollbar">
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
          <header className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-black leading-tight text-gray-900">
              สวัสดีครับ <span className="text-blue-600">แอดมิน{adminData.name}</span>
            </h1>
            <p className="text-gray-500 font-bold mt-2 text-sm uppercase tracking-widest">TC Center Control Center</p>
          </header>

          {/* สถิติหลัก */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <UserCheck className="text-blue-500 mb-4" size={32} />
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">ติวเตอร์ในระบบ</p>
              <h3 className="text-4xl font-black mt-2 text-gray-900">{stats.tutors} <span className="text-sm font-bold text-gray-300">ท่าน</span></h3>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-2 h-full bg-green-400"></div>
              <Receipt className="text-green-500 mb-4" size={32} />
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">รายการสั่งซื้อ</p>
              <Link href="/admin/orders" className="text-xl font-black mt-3 text-green-600 flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                ตรวจสอบแจ้งโอน <ArrowRight size={20} />
              </Link>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <Users className="text-purple-600 mb-4" size={32} />
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">นักเรียนทั้งหมด</p>
              <h3 className="text-4xl font-black mt-2 text-gray-900">{stats.students} <span className="text-sm font-bold text-gray-300">คน</span></h3>
            </div>
          </div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            
            {/* กล่องใหญ่: จัดการกระเป๋าเงิน */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-8 md:p-10 text-white shadow-xl shadow-blue-200 relative overflow-hidden flex flex-col justify-between group h-[340px]">
               <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">จัดการกระเป๋าเงิน<br/>6 Tier</h2>
                  <p className="text-blue-500 bg-white/90 px-3 py-1 rounded-lg text-[10px] font-black inline-block mb-6 uppercase tracking-widest">Master Hour Control</p>
                  <p className="text-blue-100 font-medium mb-8 leading-relaxed max-w-xs text-sm">
                    แก้ไขชั่วโมงเรียนรายบุคคล ครบทุกรูปแบบทั้ง Online และ Onsite
                  </p>
               </div>
               <Link href="/admin/wallets" className="relative z-10 inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all w-max shadow-lg active:scale-95">
                  ไปที่หน้าจัดการ Wallet <ChevronRight size={20} />
               </Link>
               <Wallet className="absolute -bottom-10 -right-10 text-white/10 group-hover:scale-110 transition-transform duration-700 pointer-events-none" size={260} />
            </div>

            {/* กลุ่มรายการทางลัดขวา */}
            <div className="grid grid-cols-1 gap-4">
                
                {/* ✨ เมนูใหม่: จัดการผู้ใช้งาน (Super Admin) */}
                <Link href="/admin/users" className="bg-white p-7 rounded-[2rem] border-2 border-indigo-50 flex items-center justify-between hover:bg-indigo-50 hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-inner">
                      <UserCheck size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-xl leading-tight">จัดการผู้ใช้งานทั้งหมด</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">
                        อนุมัติติวเตอร์ • ปรับสิทธิ์ • ลบข้อมูล
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-indigo-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </Link>

                {/* จัดการแลกรางวัล */}
                <Link href="/admin/redeems" className="bg-white p-7 rounded-[2rem] border-2 border-orange-100 flex items-center justify-between hover:bg-orange-50 hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shadow-inner">
                      <Gift size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-xl leading-tight">จัดการการแลกรางวัล</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">
                        อนุมัติการแลกแต้ม Affiliate {stats.pendingRedeems > 0 && `(${stats.pendingRedeems} รายการใหม่)`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-orange-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </Link>

                {/* ทางลัดจัดการคอร์ส */}
                <Link href="/admin/manage-courses" className="bg-white p-7 rounded-[2rem] border border-gray-100 flex items-center justify-between hover:border-blue-400 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <BookOpen size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-xl leading-tight">ตั้งค่าคอร์ส & Tier</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">กำหนดราคาสินค้าและกระเป๋าเงิน</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </Link>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
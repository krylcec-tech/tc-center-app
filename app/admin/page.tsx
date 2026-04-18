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
  ArrowRight,
  Book,
  Landmark,
  ShieldCheck,
  MoreHorizontal
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState({ name: '', email: '' });
  const [stats, setStats] = useState({ tutors: 0, hours: 0, students: 0, pendingRedeems: 0, pendingWithdraws: 0 }); 
  
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
        .from('redeem_requests') 
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      const { count: withdrawCount } = await supabase
        .from('withdraw_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      setStats({
        tutors: tutorCount || 0,
        hours: 0, 
        students: studentCount || 0,
        pendingRedeems: redeemCount || 0,
        pendingWithdraws: withdrawCount || 0 
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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800">
      
      {/* --- Mobile Header --- */}
      <div className="lg:hidden bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1rem] flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">TC</div>
          <span className="font-black text-lg">Admin Panel</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"><Menu size={24} /></button>
      </div>

      {/* --- Mobile Overlay --- */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* --- Sidebar Menu --- */}
      <aside className={`
        fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 h-screen shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 pt-12 lg:pt-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1rem] flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">TC</div>
              <span className="text-2xl font-black tracking-tight">TC Center</span>
            </div>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] ml-1">Management System</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2">Core Menu</p>
          
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3.5 bg-blue-600 text-white rounded-[1.2rem] font-bold shadow-md shadow-blue-200"><LayoutDashboard size={20} /> แผงควบคุม</Link>
          
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-[1.2rem] font-bold transition-all"><UserCheck size={20} /> จัดการผู้ใช้งาน</Link>
          <Link href="/admin/my-books" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-[1.2rem] font-bold transition-all"><Book size={20} /> คลังหนังสือรายคน</Link>
          <Link href="/admin/wallets" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-[1.2rem] font-bold transition-all"><Wallet size={20} /> จัดการกระเป๋าเงิน (6-Tier)</Link>
          
          <div className="h-px bg-slate-100 mx-4 my-4"></div>
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Finance & Shop</p>

          <Link href="/admin/withdrawals" className="flex items-center justify-between px-4 py-3.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-[1.2rem] font-bold transition-all relative">
            <div className="flex items-center gap-3"><Landmark size={20} /> ตรวจสอบถอนเงิน</div>
            {stats.pendingWithdraws > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">{stats.pendingWithdraws}</span>}
          </Link>

          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-green-50 hover:text-green-600 rounded-[1.2rem] font-bold transition-all"><Receipt size={20} /> ตรวจสอบแจ้งโอน</Link>
          
          <Link href="/admin/shop" className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-orange-50 hover:text-orange-600 rounded-[1.2rem] font-bold transition-all"><Store size={20} /> ระบบจัดการร้านค้า</Link>

          <Link href="/admin/redeems" className="flex items-center justify-between px-4 py-3.5 text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-[1.2rem] font-bold transition-all relative">
            <div className="flex items-center gap-3"><Gift size={20} /> จัดการแลกรางวัล</div>
            {stats.pendingRedeems > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">{stats.pendingRedeems}</span>}
          </Link>

          <div className="h-px bg-slate-100 mx-4 my-4"></div>
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">System</p>

          <Link href="/admin/manage-tutors" className="flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold rounded-[1.2rem] transition-all"><Users size={20} /> จัดการติวเตอร์</Link>
          <Link href="/admin/manage-courses" className="flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold rounded-[1.2rem] transition-all"><BookOpen size={20} /> จัดการคอร์สเรียน</Link>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-3.5 bg-red-50 text-red-600 rounded-[1.2rem] font-black hover:bg-red-500 hover:text-white transition-all active:scale-95"><LogOut size={18} /> ออกจากระบบ</button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">
                สวัสดีครับ, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">แอดมิน{adminData.name}</span> 👋
              </h1>
              <p className="text-slate-500 font-bold mt-2 text-sm uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-500"/> TC Center Control Center
              </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-600 inline-flex items-center gap-2 w-max">
              <Calendar size={16} className="text-slate-400"/> {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}
            </div>
          </header>

          {/* ✨ 4 Stats Cards (ปรับให้โชว์ครบ 4 ค่าสำคัญ) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-[1rem]"><Users size={24} /></div>
                <MoreHorizontal size={20} className="text-slate-300"/>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-800">{stats.students}</h3>
                <p className="text-slate-500 font-bold text-xs mt-1">นักเรียนทั้งหมด</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-[1rem]"><UserCheck size={24} /></div>
                <MoreHorizontal size={20} className="text-slate-300"/>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-800">{stats.tutors}</h3>
                <p className="text-slate-500 font-bold text-xs mt-1">ติวเตอร์ในระบบ</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-[1rem]"><Landmark size={24} /></div>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-black text-slate-800">{stats.pendingWithdraws}</h3>
                <p className="text-emerald-600 font-bold text-xs mt-1">รออนุมัติถอนเงิน</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-[1rem]"><Gift size={24} /></div>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-black text-slate-800">{stats.pendingRedeems}</h3>
                <p className="text-orange-600 font-bold text-xs mt-1">รออนุมัติแลกรางวัล</p>
              </div>
            </div>
          </div>

          {/* ✨ Bento Grid Menu (การจัดวางเมนูแบบใหม่ สวยและประหยัดพื้นที่) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            
            {/* กล่อง 1: จัดการกระเป๋าเงิน (ใหญ่สุด) */}
            <Link href="/admin/wallets" className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group flex flex-col justify-between min-h-[280px] hover:-translate-y-1 transition-transform">
               <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
                 <Wallet size={240}/>
               </div>
               <div className="relative z-10">
                  <div className="bg-white/20 w-12 h-12 rounded-[1rem] flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20 shadow-inner"><Wallet size={24}/></div>
                  <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight text-white drop-shadow-sm">จัดการกระเป๋าเงิน<br/>นักเรียน (6-Tier)</h2>
                  <p className="text-blue-100 font-medium max-w-sm text-sm">แก้ไขชั่วโมงเรียนรายบุคคล ครบทุกระดับชั้นทั้งรูปแบบ Online และ Onsite</p>
               </div>
               <div className="relative z-10 mt-8 flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-[1.2rem] font-black text-sm w-max shadow-md group-hover:bg-blue-50 transition-colors">
                 จัดการ Wallet ทันที <ArrowRight size={16} />
               </div>
            </Link>

            {/* กล่อง 2: ตรวจสอบถอนเงิน */}
            <Link href="/admin/withdrawals" className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50 transition-all group flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-[1rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Landmark size={24}/></div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">ตรวจสอบ<br/>การถอนเงิน</h3>
                <p className="text-slate-500 text-xs font-bold">อนุมัติยอดขายและรายได้ของติวเตอร์/นายหน้า</p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="text-emerald-600 font-black text-sm">ดูรายการ</span>
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors"><ChevronRight size={20}/></div>
              </div>
            </Link>

            {/* กล่อง 3: ระบบจัดการร้านค้า */}
            <Link href="/admin/shop" className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50 transition-all group flex flex-col justify-between min-h-[240px]">
              <div>
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-[1rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Store size={24}/></div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">ระบบจัดการ<br/>ร้านค้า (Shop)</h3>
                <p className="text-slate-500 text-xs font-bold">เพิ่มสต็อกของรางวัล ตั้งราคาแต้มแลกของ</p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="text-orange-600 font-black text-sm">จัดการสต็อก</span>
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors"><ChevronRight size={20}/></div>
              </div>
            </Link>

            {/* กล่อง 4: จัดการแลกรางวัล */}
            <Link href="/admin/redeems" className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50 transition-all group flex flex-col justify-between min-h-[240px]">
              <div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-[1rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Gift size={24}/></div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">ตรวจสอบ<br/>การแลกรางวัล</h3>
                <p className="text-slate-500 text-xs font-bold">อนุมัติคำขอแลกของรางวัลจากผู้ใช้งาน</p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="text-purple-600 font-black text-sm">ดูคำร้องขอ</span>
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors"><ChevronRight size={20}/></div>
              </div>
            </Link>

            {/* กล่อง 5: คลังหนังสือ */}
            <Link href="/admin/my-books" className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all group flex flex-col justify-between min-h-[240px]">
              <div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[1rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Book size={24}/></div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">คลังหนังสือ<br/>รายบุคคล</h3>
                <p className="text-slate-500 text-xs font-bold">เพิ่ม/ลด เอกสารการเรียนให้นักเรียนแต่ละคน</p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="text-blue-600 font-black text-sm">จัดการเอกสาร</span>
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><ChevronRight size={20}/></div>
              </div>
            </Link>

            {/* กล่อง 6: ตรวจสอบแจ้งโอน (แนวยาว) */}
            <Link href="/admin/orders" className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 border-2 border-slate-100 hover:border-green-400 hover:shadow-xl hover:shadow-green-100/50 transition-all group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-[1.2rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner"><Receipt size={32}/></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1">ตรวจสอบการแจ้งโอนคอร์สเรียน</h3>
                  <p className="text-slate-500 text-sm font-bold">อนุมัติหลักฐานการชำระเงินและเพิ่มชั่วโมงเรียนอัตโนมัติ</p>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-[1.2rem] font-black text-sm w-full sm:w-auto justify-center group-hover:bg-green-600 transition-colors shadow-md">
                ดูรายการโอนเงิน <ArrowRight size={16}/>
              </div>
            </Link>

          </div>

        </div>
      </main>
    </div>
  );
}
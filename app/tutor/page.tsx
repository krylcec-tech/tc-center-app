'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Calendar, LogOut, Loader2, UserCircle, 
  ChevronRight, CalendarDays, History, CheckCircle2, Gift, 
  Menu, X, Clock, MapPin, Settings, AlertCircle, Home, 
  BookOpen, FolderOpen, Share2, Sparkles, Store, DollarSign
} from 'lucide-react';

export default function TutorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tutorData, setTutorData] = useState({ id: '', name: '', avatar: '' });
  const [stats, setStats] = useState({ upcomingSlots: 0, completedHours: 0, todaySlots: 0 });
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchTutorData();
  }, []);

  const isLessonCompleted = (item: any) => {
    const status = String(item.status || '').trim().toUpperCase();
    const hasLog = item.slots?.teaching_logs && item.slots.teaching_logs.length > 0;
    return hasLog || status === 'VERIFIED' || item.is_completed === true;
  };

  const fetchTutorData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      const { data: profile, error: profileError } = await supabase
        .from('tutors')
        .select('id, name, image_url, role') 
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profileError || !profile) { 
        router.replace('/login'); 
        return; 
      }

      const dbRole = (profile.role || '').replace(/'/g, "").trim().toUpperCase();
      if (dbRole !== 'TUTOR') {
        router.replace('/student');
        return;
      }

      setTutorData({ id: profile.id, name: profile.name, avatar: profile.image_url });

      const { data: allBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id, status, is_completed, student_id,
          slots!inner ( id, start_time, location_type, teaching_logs ( id, created_at ) )
        `)
        .eq('tutor_id', profile.id);

      if (bookingsError) throw new Error(bookingsError.message);

      const { data: studentsData } = await supabase.from('student_wallets').select('user_id, student_name');
      const studentMap = new Map(studentsData?.map(s => [s.user_id, s.student_name]) || []);

      const now = new Date();
      const bkkDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
      const currentMonth = bkkDate.getMonth();
      const currentYear = bkkDate.getFullYear();
      const todayStr = [
        bkkDate.getFullYear(),
        String(bkkDate.getMonth() + 1).padStart(2, '0'),
        String(bkkDate.getDate()).padStart(2, '0')
      ].join('-');

      let pendingCount = 0;
      let completedMonthCount = 0;
      let todayList: any[] = [];

      (allBookings || []).forEach((b: any) => {
        const slotDate = new Date(b.slots.start_time);
        const slotBkkDate = new Date(slotDate.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
        
        const isCompleted = isLessonCompleted(b); 
        
        if (!isCompleted) pendingCount++;

        if (isCompleted && slotBkkDate.getMonth() === currentMonth && slotBkkDate.getFullYear() === currentYear) {
          completedMonthCount++; 
        }

        const slotDateStr = [
          slotBkkDate.getFullYear(),
          String(slotBkkDate.getMonth() + 1).padStart(2, '0'),
          String(slotBkkDate.getDate()).padStart(2, '0')
        ].join('-');
        
        if (slotDateStr === todayStr) {
           todayList.push({
             ...b,
             student_name: studentMap.get(b.student_id) || 'ไม่ระบุชื่อ',
             isFinished: isCompleted
           });
        }
      });

      todayList.sort((a, b) => new Date(a.slots.start_time).getTime() - new Date(b.slots.start_time).getTime());

      setStats({
        upcomingSlots: pendingCount,
        completedHours: completedMonthCount,
        todaySlots: todayList.length
      });
      setTodayBookings(todayList);

    } catch (err: any) {
      console.error('Fetch error:', err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/50">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-orange-50/50 flex flex-col items-center justify-center p-6">
        <div className="bg-white border-2 border-red-100 p-10 rounded-[2.5rem] shadow-2xl max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={56} />
          <h2 className="text-2xl font-black text-slate-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed">{errorMsg}</p>
          <button onClick={fetchTutorData} className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-orange-500 hover:shadow-lg hover:-translate-y-1 transition-all">โหลดใหม่อีกครั้ง</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col lg:flex-row font-sans text-slate-800 selection:bg-orange-200">
      
      {/* --- Mobile Header --- */}
      <div className="lg:hidden bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-orange-100 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-100 to-blue-50 rounded-[1.2rem] overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
            {tutorData.avatar ? <img src={tutorData.avatar} alt="P" className="w-full h-full object-cover" /> : <UserCircle size={28} className="text-blue-400" />}
          </div>
          <div>
            <span className="font-black text-sm text-slate-800 leading-tight block">ครู{tutorData.name}</span>
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Tutor</span>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white text-slate-600 rounded-xl border border-slate-100 shadow-sm"><Menu size={20} /></button>
      </div>

      {/* --- Sidebar --- */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-orange-100/50 flex flex-col transition-transform duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 text-center pt-12 lg:pt-10 relative border-b border-slate-100/50">
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
          
          <div className="relative w-28 h-28 mx-auto mb-5 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-orange-400 rounded-[2rem] rotate-6 group-hover:rotate-12 transition-transform duration-500 opacity-20"></div>
            <div className="relative w-full h-full bg-white rounded-[2rem] overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
              {tutorData.avatar ? <img src={tutorData.avatar} alt="P" className="w-full h-full object-cover" /> : <UserCircle size={80} className="text-slate-200" />}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-lg">
              <div className="bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
          </div>
          
          <h2 className="font-black text-2xl text-slate-800">ครู{tutorData.name}</h2>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1 bg-blue-50 px-3 py-1 rounded-full inline-block">Premium Partner</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar text-left">
          <Link href="/tutor" className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-[1.5rem] font-black shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 transition-all">
            <LayoutDashboard size={20} /> แดชบอร์ดหลัก
          </Link>
          
          <div className="h-4"></div>
          <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">จัดการเรียนการสอน</p>
          
          <Link href="/admin/calendar-slots" className="flex items-center gap-3 px-5 py-3.5 text-slate-600 hover:bg-white hover:shadow-sm hover:border-slate-100 border border-transparent rounded-[1.2rem] font-bold transition-all group">
            <Calendar size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> จัดการเวลาว่าง
          </Link>

          <Link href="/tutor/my-schedule" className="flex items-center gap-3 px-5 py-3.5 text-slate-600 hover:bg-white hover:shadow-sm hover:border-slate-100 border border-transparent rounded-[1.2rem] font-bold transition-all group">
            <CalendarDays size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> ตารางสอนทั้งหมด
          </Link>

          <Link href="/tutor/my-sheets" className="flex items-center gap-3 px-5 py-3.5 text-orange-600 bg-orange-50/80 hover:bg-orange-100 border border-orange-100/50 rounded-[1.2rem] font-black transition-all group">
            <FolderOpen size={20} className="text-orange-500" /> คลังชีท (Playlist)
          </Link>

          <Link href="/tutor/logs" className="flex items-center gap-3 px-5 py-3.5 text-slate-600 hover:bg-white hover:shadow-sm hover:border-slate-100 border border-transparent rounded-[1.2rem] font-bold transition-all group">
            <History size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> ประวัติการสอน
          </Link>

          <div className="h-6"></div>
          <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">รายได้และธุรกิจ</p>
          
          {/* ✨ เมนูใหม่: ไป Seller Hub สำหรับขายชีท */}
          <Link href="/tutor/seller-hub" className="flex items-center justify-between px-5 py-3.5 text-purple-600 bg-purple-50 border border-purple-100/50 rounded-[1.2rem] font-black hover:bg-purple-100 transition-all group">
            <div className="flex items-center gap-3"><Store size={20} className="group-hover:scale-110 transition-transform" /> ฝากขายชีททำเงิน</div>
            <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
          </Link>

          <Link href="/tutor/affiliate" className="flex items-center justify-between px-5 py-3.5 text-pink-600 hover:bg-pink-50 hover:border-pink-100 border border-transparent rounded-[1.2rem] font-bold transition-all group mt-1">
            <div className="flex items-center gap-3"><Gift size={20} className="text-pink-400 group-hover:text-pink-600" /> ระบบนายหน้า</div>
            <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
          </Link>

          <Link href="/tutor/profile" className="flex items-center gap-3 px-5 py-3.5 text-slate-600 hover:bg-white hover:shadow-sm hover:border-slate-100 border border-transparent rounded-[1.2rem] font-bold transition-all mt-1 group">
            <Settings size={20} className="text-slate-400 group-hover:text-slate-600" /> ตั้งค่าโปรไฟล์
          </Link>
        </nav>

        <div className="p-6 border-t border-slate-100/50 bg-white/50 backdrop-blur-sm">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-red-100 text-red-500 rounded-[1.2rem] font-black hover:bg-red-500 hover:text-white transition-all hover:shadow-lg hover:shadow-red-200 active:scale-95 group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto w-full max-w-7xl mx-auto custom-scrollbar relative">
        
        {/* Background Blur Elements */}
        <div className="absolute top-0 left-[10%] w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-10 right-[10%] w-72 h-72 bg-orange-400/10 blur-[80px] rounded-full pointer-events-none"></div>

        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 text-left relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black text-blue-600 mb-4 tracking-widest uppercase shadow-sm">
              <Sparkles size={12} className="text-blue-500"/> Welcome Back
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-800">
              สวัสดีครับ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">ครู{tutorData.name}</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2">วันนี้คุณมีภารกิจสอนทั้งหมด <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">{stats.todaySlots} คิว</span></p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <Link 
              href="/tutor/seller-hub" 
              className="flex items-center gap-2 px-6 py-3 bg-white border border-purple-100 text-purple-600 rounded-full text-[11px] font-black hover:bg-purple-50 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Store size={16}/> ไปหน้าขายชีท
            </Link>
             <Link 
              href="/" 
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-[11px] font-black hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-200/50 hover:-translate-y-0.5 transition-all"
            >
              <Home size={16}/> กลับหน้าหลัก
            </Link>
          </div>
        </header>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-12 text-left relative z-10">
          
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300">
            <div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">คิวสอนที่รออยู่</p>
              <h3 className="text-4xl font-black text-slate-800">{stats.upcomingSlots} <span className="text-sm font-bold text-slate-300">คิว</span></h3>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-blue-50"><Calendar size={28} strokeWidth={2.5}/></div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl hover:shadow-green-100/50 hover:-translate-y-1 transition-all duration-300">
            <div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">สอนเสร็จ (เดือนนี้)</p>
              <h3 className="text-4xl font-black text-slate-800">{stats.completedHours} <span className="text-sm font-bold text-slate-300">ชม.</span></h3>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 text-green-500 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-green-50"><CheckCircle2 size={28} strokeWidth={2.5}/></div>
          </div>

          {/* ✨ สถิติใหม่: ทางลัดไป Seller Hub */}
          <Link href="/tutor/seller-hub" className="bg-gradient-to-br from-purple-500 to-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-purple-200/50 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden sm:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
            <div className="relative z-10 text-white">
              <p className="text-purple-100 font-black text-[10px] uppercase tracking-widest mb-1">ฝากขายเอกสาร</p>
              <h3 className="text-2xl font-black leading-tight mt-1">Seller Hub<br/>Dashboard</h3>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-[1.2rem] flex items-center justify-center group-hover:scale-110 transition-transform relative z-10"><DollarSign size={24} strokeWidth={3}/></div>
          </Link>

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 text-left relative z-10">
          
          {/* ซ้าย: ภารกิจวันนี้ */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Clock size={24}/></div> 
                  ภารกิจวันนี้
                </h2>
                <Link href="/tutor/my-schedule" className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">ดูตารางทั้งหมด</Link>
              </div>

              <div className="space-y-4">
                {todayBookings.length === 0 ? (
                  <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white shadow-sm rounded-[1.5rem] flex items-center justify-center text-slate-200 mb-4 rotate-3"><CalendarDays size={40}/></div>
                    <p className="text-slate-600 font-black text-lg">วันนี้ว่าง! ไม่มีคิวสอนครับ</p>
                    <p className="text-slate-400 text-sm font-medium mt-1">เตรียมทำสื่อการสอน หรือพักผ่อนได้เลย ☕</p>
                  </div>
                ) : (
                  todayBookings.map((item) => (
                    <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border rounded-[2rem] hover:shadow-lg transition-all group gap-5 ${item.isFinished ? 'bg-green-50/50 border-green-100/50' : 'bg-white border-slate-100'}`}>
                      <div className="flex items-start md:items-center gap-5">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-lg shadow-sm border ${item.isFinished ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {new Date(item.slots.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-xl leading-none mb-2">น้อง{item.student_name}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-slate-600"><MapPin size={12}/> {item.slots.location_type}</span>
                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-slate-600"><BookOpen size={12}/> เตรียมสอน</span>
                          </div>
                        </div>
                      </div>
                      
                      {item.isFinished ? (
                        <div className="w-full sm:w-auto text-center px-6 py-3.5 bg-green-500 text-white shadow-md shadow-green-200 rounded-[1.2rem] font-black text-xs flex items-center justify-center gap-2 cursor-default">
                          <CheckCircle2 size={16}/> ส่งรายงานแล้ว
                        </div>
                      ) : (
                        <Link href="/tutor/logs" className="w-full sm:w-auto text-center px-8 py-3.5 bg-slate-900 text-white rounded-[1.2rem] font-black text-xs hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2 active:scale-95 group-hover:-translate-y-1">
                          เข้าสอน / ส่งงาน <ChevronRight size={14}/>
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ขวา: Quick Actions (ปรับสไตล์ใหม่) */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            
            {/* 📂 คลัง Playlist */}
            <Link href="/tutor/my-sheets" className="bg-gradient-to-br from-orange-400 to-red-500 rounded-[3rem] p-8 md:p-10 text-white shadow-xl shadow-orange-200/50 relative overflow-hidden group flex-1 flex flex-col justify-between hover:-translate-y-1 transition-transform min-h-[280px]">
               <div className="absolute -right-10 -bottom-10 opacity-20 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700"><FolderOpen size={180}/></div>
               <div className="relative z-10">
                 <div className="bg-white/20 w-12 h-12 rounded-[1.2rem] flex items-center justify-center mb-6 backdrop-blur-md border border-white/20 shadow-inner"><BookOpen size={24}/></div>
                 <h3 className="text-3xl font-black mb-2 leading-tight">My Playlist</h3>
                 <p className="text-orange-100 text-sm font-medium mb-6 leading-relaxed opacity-90">คลังชีทส่วนตัว เก็บเอกสารและส่งแชร์ให้นักเรียนได้ทันที</p>
               </div>
               <div className="mt-auto relative z-10 flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-2xl font-black text-xs w-max group-hover:bg-white group-hover:text-orange-600 transition-colors">
                 เปิดคลังชีท <Share2 size={16} className="ml-1"/>
               </div>
            </Link>

            {/* 💸 Affiliate (ย่อส่วนลงมาให้เข้ากับ 1 Column) */}
            <Link href="/tutor/affiliate" className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-pink-100/50 hover:border-pink-100 transition-all group flex items-center justify-between gap-4">
               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 bg-pink-50 text-pink-500 rounded-xl"><Gift size={18}/></div>
                   <h3 className="text-xl font-black text-slate-800">ระบบนายหน้า</h3>
                 </div>
                 <p className="text-slate-500 text-xs font-bold pl-1">แชร์โค้ดรับรายได้เสริม</p>
               </div>
               <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-colors shrink-0">
                 <ChevronRight size={20}/>
               </div>
            </Link>

          </div>

        </div>
      </main>
    </div>
  );
}
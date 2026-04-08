'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Calendar, LogOut, Loader2, UserCircle, 
  ChevronRight, CalendarDays, History, CheckCircle2, Gift, 
  Menu, X, Clock, MapPin, Settings, AlertCircle, Home, 
  BookOpen, FolderOpen, Share2, Sparkles // ✨ เพิ่มไอคอนใหม่
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

      const { data: studentsData } = await supabase
        .from('student_wallets')
        .select('user_id, student_name');
        
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
        
        if (!isCompleted) {
          pendingCount++;
        }

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="bg-red-50 border-2 border-red-200 p-8 rounded-3xl max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-black text-red-700 mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
          <p className="text-sm font-bold text-red-500 mb-6">{errorMsg}</p>
          <button onClick={fetchTutorData} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black hover:bg-red-700 transition-all">โหลดใหม่อีกครั้ง</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans text-gray-900">
      
      {/* --- Mobile Header --- */}
      <div className="lg:hidden bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            {tutorData.avatar ? <img src={tutorData.avatar} alt="P" className="w-full h-full object-cover" /> : <UserCircle size={40} className="text-gray-300" />}
          </div>
          <span className="font-black text-sm">ครู{tutorData.name}</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-50 text-gray-600 rounded-xl"><Menu size={24} /></button>
      </div>

      {/* --- Sidebar --- */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 text-center pt-12 lg:pt-8 relative border-b border-gray-50">
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 bg-gray-50 rounded-xl"><X size={20} /></button>
          <div className="w-24 h-24 bg-gray-100 rounded-[2rem] mx-auto mb-4 overflow-hidden border-4 border-white shadow-xl">
            {tutorData.avatar ? <img src={tutorData.avatar} alt="P" className="w-full h-full object-cover" /> : <UserCircle size={96} className="text-gray-300" />}
          </div>
          <h2 className="font-black text-xl text-gray-900">ครู{tutorData.name}</h2>
          <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Tutor Partner</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto text-left">
          <Link href="/tutor" className="flex items-center gap-3 px-5 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-blue-200/50">
            <LayoutDashboard size={20} /> แดชบอร์ดหลัก
          </Link>
          
          <div className="h-4"></div>

          <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">จัดการเรียนการสอน</p>
          
          <Link href="/admin/calendar-slots" className="flex items-center gap-3 px-5 py-3.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-[1.2rem] font-bold transition-all group">
            <Calendar size={20} className="text-gray-400 group-hover:text-blue-600" /> จัดการเวลาว่าง
          </Link>

          <Link href="/tutor/my-schedule" className="flex items-center gap-3 px-5 py-3.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-[1.2rem] font-bold transition-all group">
            <CalendarDays size={20} className="text-gray-400 group-hover:text-blue-600" /> ตารางสอนทั้งหมด
          </Link>

          {/* ✨ เพิ่มเมนู Playlist ใน Sidebar */}
          <Link href="/tutor/my-sheets" className="flex items-center gap-3 px-5 py-3.5 text-orange-600 bg-orange-50/50 hover:bg-orange-50 rounded-[1.2rem] font-black transition-all group border border-orange-100/50">
            <FolderOpen size={20} className="text-orange-500" /> คลัง Playlist ของฉัน
          </Link>

          <Link href="/tutor/logs" className="flex items-center gap-3 px-5 py-3.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-[1.2rem] font-bold transition-all group">
            <History size={20} className="text-gray-400 group-hover:text-blue-600" /> ประวัติการสอน
          </Link>

          <div className="h-6"></div>

          <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">รายได้และบัญชี</p>
          
          <Link href="/tutor/affiliate" className="flex items-center justify-between px-5 py-3.5 text-purple-600 bg-purple-50 rounded-[1.2rem] font-black hover:bg-purple-100 transition-all">
            <div className="flex items-center gap-3"><Gift size={20} /> ระบบนายหน้า</div>
            <ChevronRight size={14} />
          </Link>

          <Link href="/tutor/profile" className="flex items-center gap-3 px-5 py-3.5 text-gray-600 hover:bg-gray-100 rounded-[1.2rem] font-bold transition-all mt-1">
            <Settings size={20} className="text-gray-400" /> ตั้งค่าโปรไฟล์
          </Link>
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-[1.2rem] font-black hover:bg-red-500 hover:text-white transition-all"><LogOut size={20} /> ออกจากระบบ</button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-6 md:p-10 lg:p-14 overflow-y-auto w-full max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-gray-900">ยินดีต้อนรับครับ!</h1>
            <p className="text-gray-500 font-bold mt-3">วันนี้คุณมีภารกิจสอนทั้งหมด <span className="text-blue-600">{stats.todaySlots} คิว</span></p>
          </div>

          <div className="flex items-center gap-2">
             {/* ✨ ปุ่มทางลัดไปคลังชีท */}
             <Link 
              href="/tutor/my-sheets" 
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md shadow-orange-100 active:scale-95"
            >
              <FolderOpen size={14}/> My Playlist
            </Link>
             <Link 
              href="/" 
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-100 active:scale-95"
            >
              <Home size={14}/> หน้าหลักเว็บไซต์
            </Link>
          </div>
        </header>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10 text-left">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform"><Calendar size={32}/></div>
            <div>
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">คิวสอนที่รออยู่</p>
              <h3 className="text-3xl font-black text-gray-900">{stats.upcomingSlots} <span className="text-sm text-gray-400">คิว</span></h3>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle2 size={32}/></div>
            <div>
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">สอนแล้ว (เดือนนี้)</p>
              <h3 className="text-3xl font-black text-gray-900">{stats.completedHours} <span className="text-sm text-gray-400">ชม.</span></h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 text-left">
          
          <div className="xl:col-span-2">
            <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-sm h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center gap-3"><Clock className="text-blue-600" size={28}/> ภารกิจวันนี้</h2>
                <Link href="/tutor/my-schedule" className="text-xs font-black text-blue-600 hover:underline">ดูทั้งหมด</Link>
              </div>

              <div className="space-y-4">
                {todayBookings.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50">
                    <CalendarDays size={48} className="text-gray-200 mx-auto mb-4"/>
                    <p className="text-gray-500 font-black text-lg">วันนี้ไม่มีคิวสอนครับ</p>
                  </div>
                ) : (
                  todayBookings.map((item) => (
                    <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 border rounded-[2rem] hover:shadow-lg transition-all group gap-4 ${item.isFinished ? 'bg-green-50/30 border-green-50' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-lg shadow-inner ${item.isFinished ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                          {new Date(item.slots.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-xl leading-none mb-1.5">น้อง{item.student_name}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                            <span className="flex items-center gap-1 text-blue-600"><MapPin size={12}/> {item.slots.location_type}</span>
                          </div>
                        </div>
                      </div>
                      
                      {item.isFinished ? (
                        <div className="w-full sm:w-auto text-center px-6 py-3 bg-green-50 text-green-600 border border-green-100 rounded-xl font-black text-xs flex items-center justify-center gap-2">
                          <CheckCircle2 size={16}/> ส่งรายงานแล้ว
                        </div>
                      ) : (
                        <Link href="/tutor/logs" className="w-full sm:w-auto text-center px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                          เข้าสอน / ส่งงาน
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ✨ ฝั่งขวา: เน้น Book/Playlist ของติวเตอร์ */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* 📂 การ์ดคลังเอกสาร (ใหม่ - เด่นมาก) */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[3rem] p-10 text-white shadow-xl shadow-orange-200 relative overflow-hidden group">
               <div className="absolute -right-6 -bottom-6 opacity-20 group-hover:scale-125 transition-all duration-500 rotate-12"><BookOpen size={160}/></div>
               <div className="relative z-10">
                 <div className="bg-white/20 w-max p-2 rounded-xl mb-4 backdrop-blur-md"><Sparkles size={20}/></div>
                 <h3 className="text-3xl font-black mb-3 leading-tight">My Playlist<br/>& Sharing</h3>
                 <p className="text-orange-100 text-xs font-medium mb-8 leading-relaxed">จัดการชีทเรียนส่วนตัว และส่งให้<br/>นักเรียนเข้าคลัง My Books ทันที</p>
                 <Link href="/tutor/my-sheets" className="flex items-center justify-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-xs hover:bg-orange-50 transition-all active:scale-95 shadow-lg">
                    เปิดคลังชีท <Share2 size={16} className="ml-1"/>
                 </Link>
               </div>
            </div>

            <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
               <h3 className="text-2xl font-black mb-3">จัดการเวลาว่าง</h3>
               <p className="text-blue-100 text-xs font-medium mb-8 leading-relaxed">ให้นักเรียนเห็นคิวและกดจองได้ทันที ผ่านระบบอัตโนมัติ</p>
               <Link href="/admin/calendar-slots" className="flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs hover:bg-blue-50 transition-all active:scale-95 shadow-lg">
                 เปิดตารางสอน <ChevronRight size={16}/>
               </Link>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[3rem] p-10 text-white shadow-xl shadow-purple-200 relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-all duration-500"><Gift size={120}/></div>
               <h3 className="text-2xl font-black mb-3 leading-tight">ระบบนายหน้า<br/>Affiliate</h3>
               <p className="text-purple-100 text-xs font-medium mb-8 leading-relaxed">สร้างรายได้เพิ่มง่ายๆ เพียงแชร์รหัสแนะนำนักเรียน</p>
               <Link href="/tutor/affiliate" className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white text-white hover:text-purple-600 backdrop-blur-md border border-white/20 px-8 py-4 rounded-2xl font-black text-xs transition-all active:scale-95">
                 ดูรหัสและแต้ม <ChevronRight size={16}/>
               </Link>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
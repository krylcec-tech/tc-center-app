'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Calendar, LogOut, Loader2, UserCircle, 
  ChevronRight, CalendarDays, History, CheckCircle2, Gift, 
  Menu, X, Clock, MapPin, Settings, Bookmark
} from 'lucide-react';

export default function TutorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tutorData, setTutorData] = useState({ id: '', name: '', avatar: '' });
  const [stats, setStats] = useState({ upcomingSlots: 0, completedHours: 0, todaySlots: 0 });
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchTutorData();
  }, []);

  const fetchTutorData = async () => {
    setLoading(true);
    try {
      // 1. ดึง Session ปัจจุบัน
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      // 2. ดึงข้อมูลติวเตอร์ทั้งหมดม้วนเดียวจบ จากตาราง "tutors" โดยใช้ user_id
      const { data: profile, error: profileError } = await supabase
        .from('tutors')
        .select('id, name, image_url, role') // ดึง role มาเช็คด้วย
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profileError || !profile) { 
        // ถ้าไม่มีข้อมูลในตาราง tutors ให้กลับไป login เพื่อป้องกัน error
        router.replace('/login'); 
        return; 
      }

      // 3. เช็ค Role ว่าเป็นติวเตอร์จริงๆ ใช่ไหม
      const dbRole = (profile.role || '').replace(/'/g, "").trim().toUpperCase();
      if (dbRole !== 'TUTOR') {
        router.replace('/student'); // ถ้าไม่ใช่ เตะไปหน้านักเรียน
        return;
      }

      // เซ็ตข้อมูลติวเตอร์เพื่อนำไปแสดงผลใน UI
      setTutorData({ id: profile.id, name: profile.name, avatar: profile.image_url });

      // 4. ดึงสถิติและคิวสอน
      const { count: upcomingCount } = await supabase
        .from('slots')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', profile.id)
        .gte('start_time', new Date().toISOString());

      const todayStr = new Date().toISOString().split('T')[0];

      // ดึง Bookings ของวันนี้
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id, subject, student_id,
          slots!inner ( id, start_time, location_type )
        `)
        .eq('tutor_id', profile.id)
        .gte('slots.start_time', `${todayStr}T00:00:00`)
        .lte('slots.start_time', `${todayStr}T23:59:59`)
        .order('slots(start_time)', { ascending: true });

      let formattedBookings = [];
      if (bookingsData && bookingsData.length > 0) {
        // ดึงชื่อนักเรียนจาก student_wallets มาแสดง
        const { data: studentsData } = await supabase
          .from('student_wallets')
          .select('user_id, student_name');
          
        const studentMap = new Map(studentsData?.map(s => [s.user_id, s.student_name]) || []);
        
        formattedBookings = bookingsData.map((item: any) => ({
          ...item,
          student_name: studentMap.get(item.student_id) || 'ไม่ระบุชื่อ'
        }));
      }

      setTodayBookings(formattedBookings);
      setStats({
        upcomingSlots: upcomingCount || 0,
        completedHours: 0, // ส่วนนี้สามารถเชื่อมกับตารางสรุปยอดในอนาคตได้
        todaySlots: formattedBookings.length
      });

    } catch (err) {
      console.error('Fetch error:', err);
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

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-gray-900">ยินดีต้อนรับครับ!</h1>
          <p className="text-gray-500 font-bold mt-3">วันนี้คุณมีภารกิจสอนทั้งหมด <span className="text-blue-600">{stats.todaySlots} คิว</span></p>
        </header>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10">
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
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
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-lg transition-all group gap-4">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center font-black text-lg shadow-inner">
                          {new Date(item.slots.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-xl leading-none mb-1.5">น้อง{item.student_name}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md">{item.subject}</span>
                            <span className="flex items-center gap-1 text-blue-600"><MapPin size={12}/> {item.slots.location_type}</span>
                          </div>
                        </div>
                      </div>
                      <Link href="/tutor/my-schedule" className="w-full sm:w-auto text-center px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs hover:bg-blue-600 transition-all">จัดการคลาส</Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-1 space-y-6">
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
'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, LogOut, Loader2, Globe, MapPin, 
  Search, CheckCircle2, Clock, Video, ArrowLeft, LayoutGrid, ChevronLeft, ChevronRight,
  User, Send, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TutorSchedulePage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tutorInfo, setTutorInfo] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState<'upcoming' | 'past'>('upcoming');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  useEffect(() => {
    loadTutorSchedule();
  }, []);

  const loadTutorSchedule = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: tutor } = await supabase.from('tutors').select('*').eq('user_id', user.id).maybeSingle();

      if (tutor) {
        setTutorInfo(tutor);
        
        const { data: bookingsData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            id, status, student_id, student_verified, tutor_finished_at,
            slots!inner ( id, start_time, location_type )
          `)
          .eq('tutor_id', tutor.id)
          .order('id', { ascending: false });

        if (bookingError) throw bookingError;

        const { data: profilesData } = await supabase.from('profiles').select('id, avatar_url');
        const { data: walletsData } = await supabase.from('student_wallets').select('user_id, student_name');

        const profileMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);
        const nameMap = new Map(walletsData?.map(w => [w.user_id, w.student_name]) || []);

        const formattedBookings = (bookingsData || []).map((item: any) => ({
          ...item,
          student_name: nameMap.get(item.student_id) || 'ไม่ระบุชื่อ',
          student_avatar: profileMap.get(item.student_id) || null
        }));

        setBookings(formattedBookings);
      }
    } catch (err: any) {
      console.error("Schedule Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✨ ฟังก์ชันกดจบการสอน
  const handleFinishLesson = async (bookingId: string) => {
    if (!confirm('ยืนยันว่าสอนเสร็จสิ้นแล้วใช่ไหม? ระบบจะส่งคิวไปให้นักเรียนตรวจสอบความถูกต้องภายใน 24 ชม.')) return;
    
    setProcessingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'COMPLETED',
          tutor_finished_at: new Date() 
        })
        .eq('id', bookingId);

      if (error) throw error;
      alert('บันทึกจบงานสำเร็จ! รอนักเรียนกดยืนยันครับ');
      loadTutorSchedule();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(item => {
      const startTime = new Date(item.slots.start_time);
      const isPast = startTime < new Date();
      const nameMatch = (item.student_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return activeStatusTab === 'upcoming' ? (!isPast && nameMatch) : (isPast && nameMatch);
    });
  }, [bookings, searchTerm, activeStatusTab]);

  const weekDays = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [currentWeekStart]);

  const handleWeekChange = (offset: number) => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + (offset * 7));
    setCurrentWeekStart(next);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Link href="/tutor" className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 hover:text-blue-600 w-max transition-all">
                <ArrowLeft size={14}/> Back to Dashboard
              </Link>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-gray-900">
                ตารางสอน <span className="text-blue-600 underline decoration-8 decoration-blue-50">ครู{tutorInfo?.name}</span>
              </h1>
            </div>

            <div className="flex gap-3">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="ค้นหาชื่อนักเรียน..." 
                   className="pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:border-blue-400 outline-none shadow-sm w-full md:w-64"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-red-50 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                  <LogOut size={20} />
               </button>
            </div>
          </div>
        </header>

        <div className="flex gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-[2rem] w-max border border-gray-100">
          <button onClick={() => setActiveStatusTab('upcoming')} className={`px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeStatusTab === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
            คลาสรอสอน ({bookings.filter(b => new Date(b.slots.start_time) >= new Date()).length})
          </button>
          <button onClick={() => setActiveStatusTab('past')} className={`px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeStatusTab === 'past' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>
            ประวัติการสอน ({bookings.filter(b => new Date(b.slots.start_time) < new Date()).length})
          </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {filteredBookings.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-[3rem] text-center border border-gray-50 shadow-sm">
               <p className="text-gray-400 font-black">ไม่พบข้อมูลคลาสสอน</p>
            </div>
          ) : (
            filteredBookings.map((item) => {
              const startTime = new Date(item.slots.start_time);
              const isPast = startTime < new Date();
              return (
                <div key={item.id} className={`p-6 rounded-[2.5rem] shadow-sm border transition-all duration-300 flex flex-col gap-4 ${isPast ? 'bg-white' : 'bg-white border-gray-100 hover:shadow-md'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {item.student_avatar ? (
                          <img src={item.student_avatar} className="w-14 h-14 rounded-[1.2rem] object-cover border-2 border-white shadow-md" alt="student" />
                        ) : (
                          <div className="w-14 h-14 rounded-[1.2rem] bg-blue-50 text-blue-400 flex items-center justify-center border-2 border-white shadow-sm"><User size={24}/></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-black leading-none mb-1 text-gray-900">น้อง{item.student_name}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                            <Clock size={12} className="text-blue-600"/>
                            {startTime.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} • {startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </div>
                      </div>
                    </div>
                    
                    {!isPast && (
                      <a href={tutorInfo?.meeting_url} target="_blank" className="bg-blue-600 text-white p-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 animate-pulse">
                         <Video size={18}/>
                      </a>
                    )}
                  </div>

                  {/* ✨ ส่วนจัดการสถานะหลังการสอน */}
                  {isPast && (
                    <div className="pt-4 border-t border-gray-50">
                      {item.status !== 'COMPLETED' && item.status !== 'VERIFIED' ? (
                        <button 
                          onClick={() => handleFinishLesson(item.id)}
                          disabled={processingId === item.id}
                          className="w-full bg-gray-900 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95"
                        >
                          {processingId === item.id ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                          บันทึกว่าสอนเสร็จแล้ว
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2">
                           {item.student_verified ? (
                             <div className="flex items-center justify-center gap-2 text-green-600 font-black text-[10px] bg-green-50 py-2.5 rounded-xl border border-green-100">
                               <CheckCircle2 size={16}/> นักเรียนยืนยันแล้ว (จบงาน)
                             </div>
                           ) : (
                             <div className="flex items-center justify-center gap-2 text-orange-500 font-black text-[10px] bg-orange-50 py-2.5 rounded-xl border border-orange-100">
                               <AlertCircle size={16} className="animate-pulse"/> รอนักเรียนยืนยัน (ภายใน 24 ชม.)
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* Weekly Overview Section */}
        <section className="bg-white rounded-[3.5rem] p-6 md:p-10 border border-gray-50 shadow-xl overflow-hidden text-gray-900">
          <div className="flex justify-between items-center mb-8 px-2">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><LayoutGrid size={20}/></div>
                <h2 className="text-xl font-black tracking-tight text-gray-900">Weekly Overview</h2>
             </div>
             <div className="flex gap-1">
                <button onClick={() => handleWeekChange(-1)} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400"><ChevronLeft size={20}/></button>
                <button onClick={() => handleWeekChange(1)} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400"><ChevronRight size={20}/></button>
             </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-4 border-t border-gray-50 pt-8">
            {weekDays.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const dayBookings = bookings.filter(b => new Date(b.slots.start_time).toDateString() === day.toDateString());
              return (
                <div key={idx} className="flex flex-col items-center">
                  <p className="text-[9px] font-black text-gray-300 uppercase mb-3 tracking-widest">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl mb-4 font-black text-[10px] md:text-xs transition-all ${isToday ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-gray-50 text-gray-400'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1 w-full min-h-[100px]">
                    {dayBookings.map((b) => (
                      <div key={b.id} className="group relative flex justify-center">
                        <div className={`w-full p-1.5 rounded-lg text-center border text-[7px] font-black uppercase transition-all ${b.student_verified ? 'bg-green-50 border-green-100 text-green-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                           {b.student_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
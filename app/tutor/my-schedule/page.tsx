'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, LogOut, Loader2, Globe, MapPin, 
  Search, CheckCircle2, Clock, Video, ArrowLeft, LayoutGrid, ChevronLeft, ChevronRight,
  User, Send, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TutorSchedulePage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tutorInfo, setTutorInfo] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // State สำหรับจัดการลิงก์ห้องเรียน
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [tempLink, setTempLink] = useState('');

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
        
        // ✨ ดึงข้อมูลที่จำเป็น รวมถึงลิงก์ห้องเรียนรายบุคคล และประวัติการสอน
        const { data: bookingsData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            id, status, student_id, student_verified, is_completed, meeting_url,
            slots!inner ( 
              id, start_time, location_type,
              teaching_logs ( id, created_at )
            )
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

  // ✨ ฟังก์ชันบันทึกการสอน (เพิ่ม teaching_logs ตามระบบ 2-Step)
  const handleFinishLesson = async (item: any) => {
    if (!confirm('ยืนยันว่าสอนเสร็จสิ้นแล้วใช่ไหม?\nระบบจะส่งคำขอยืนยันไปให้นักเรียน (นักเรียนต้องกดยืนยันถึงจะถือว่าจบงานสมบูรณ์)')) return;
    
    setProcessingId(item.id);
    try {
      // ติวเตอร์บันทึกเฉพาะลง teaching_logs
      const { error } = await supabase.from('teaching_logs').insert({
        tutor_id: tutorInfo.id, 
        slot_id: item.slots.id,
        student_name: item.student_name, 
        subject: 'วิชาสอน', 
        duration_hours: 1,
        teaching_date: new Date(item.slots.start_time).toISOString().split('T')[0],
        notes: "สอนเสร็จสมบูรณ์"
      });

      if (error) throw error;
      alert('✅ ส่งรายงานแล้ว! รอให้นักเรียนเข้ามากดยืนยันครับ');
      loadTutorSchedule();
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ✨ ฟังก์ชันสำหรับอัปเดตลิงก์ห้องเรียนรายบุคคล
  const saveMeetingLink = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ meeting_url: tempLink })
        .eq('id', bookingId);
        
      if (error) throw error;
      alert('✅ บันทึกลิงก์ห้องเรียนสำเร็จ นักเรียนจะเห็นลิงก์นี้ทันทีครับ');
      setEditingLinkId(null);
      loadTutorSchedule();
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการบันทึกลิงก์: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ✨ Logic ตรวจสอบสถานะว่า "จบหรือยัง"
  const isLessonCompleted = (item: any) => {
    const status = String(item.status || '').trim().toUpperCase();
    const hasLog = item.slots?.teaching_logs && item.slots.teaching_logs.length > 0;
    
    // คลาสจะย้ายไปแท็บประวัติการสอน ก็ต่อเมื่อ ครูส่งรายงานแล้ว(hasLog) หรือ เด็กยืนยันแล้ว(is_completed/VERIFIED)
    return hasLog || status === 'VERIFIED' || item.is_completed === true;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(item => {
      const isFinished = isLessonCompleted(item);
      const nameMatch = (item.student_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return activeStatusTab === 'upcoming' ? (!isFinished && nameMatch) : (isFinished && nameMatch);
    });
  }, [bookings, searchTerm, activeStatusTab]);

  const upcomingCount = useMemo(() => bookings.filter(b => !isLessonCompleted(b)).length, [bookings]);
  const pastCount = useMemo(() => bookings.filter(b => isLessonCompleted(b)).length, [bookings]);

  // ระบบจัดการสัปดาห์/เดือน/ปี ของปฏิทิน
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

  const handleMonthYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = new Date(e.target.value);
      setCurrentWeekStart(newDate);
    }
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
            คลาสรอสอน ({upcomingCount})
          </button>
          <button onClick={() => setActiveStatusTab('past')} className={`px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeStatusTab === 'past' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>
            ประวัติการสอน ({pastCount})
          </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {filteredBookings.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-[3rem] text-center border border-gray-50 shadow-sm">
               <p className="text-gray-400 font-black">ไม่พบข้อมูลคลาสสอนในหมวดหมู่นี้</p>
            </div>
          ) : (
            filteredBookings.map((item) => {
              const startTime = new Date(item.slots.start_time);
              const isPastTime = startTime < new Date();
              const hasLog = item.slots?.teaching_logs && item.slots.teaching_logs.length > 0;
              const isStudentVerified = item.status === 'VERIFIED' || item.is_completed === true;

              return (
                <div key={item.id} className={`p-6 rounded-[2.5rem] shadow-sm border transition-all duration-300 flex flex-col gap-4 ${hasLog ? 'bg-white' : 'bg-white border-gray-100 hover:shadow-md'}`}>
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
                  </div>

                  {/* ✨ ส่วนสำหรับจัดการลิงก์ห้องเรียนรายบุคคล */}
                  {!hasLog && item.slots.location_type === 'Online' && (
                    <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100">
                      {editingLinkId === item.id ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="วางลิงก์ Google Meet / Zoom ที่นี่..."
                            className="flex-1 text-xs p-2 rounded-xl border border-blue-200 outline-none focus:border-blue-500"
                            value={tempLink}
                            onChange={(e) => setTempLink(e.target.value)}
                          />
                          <button onClick={() => saveMeetingLink(item.id)} disabled={processingId === item.id} className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black">บันทึก</button>
                          <button onClick={() => setEditingLinkId(null)} className="text-gray-400 px-2 text-xs font-bold hover:text-gray-600">ยกเลิก</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 truncate pr-2">
                            <LinkIcon size={14}/> 
                            {item.meeting_url ? (
                              <a href={item.meeting_url} target="_blank" className="truncate hover:underline">{item.meeting_url}</a>
                            ) : (
                              <span className="text-gray-400 italic">ยังไม่ได้แปะลิงก์ห้องเรียน</span>
                            )}
                          </div>
                          <button onClick={() => {setEditingLinkId(item.id); setTempLink(item.meeting_url || '');}} className="text-[10px] font-black text-blue-600 bg-white px-3 py-1.5 rounded-xl border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors shrink-0">
                            {item.meeting_url ? 'แก้ไข' : 'เพิ่มลิงก์'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✨ ส่วนจัดการสถานะ (ปุ่มส่งงาน) */}
                  <div className="pt-2 border-t border-gray-50 mt-auto">
                    {!hasLog ? (
                      <button 
                        onClick={() => handleFinishLesson(item)}
                        disabled={processingId === item.id}
                        className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-md"
                      >
                        {processingId === item.id ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                        บันทึกว่าสอนเสร็จแล้ว (ส่งให้นักเรียนยืนยัน)
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                         {isStudentVerified ? (
                           <div className="flex items-center justify-center gap-2 text-green-600 font-black text-[10px] bg-green-50 py-3 rounded-xl border border-green-100">
                             <CheckCircle2 size={16}/> นักเรียนยืนยันแล้ว (สมบูรณ์)
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center gap-1 text-orange-500 font-black text-[10px] bg-orange-50 py-3 rounded-xl border border-orange-100">
                             <div className="flex items-center gap-2"><AlertCircle size={16} className="animate-pulse"/> ส่งรายงานแล้ว รอนักเรียนยืนยัน</div>
                             <span className="text-[8px] text-orange-400/80">(ถ้านักเรียนไม่ยืนยันใน 24ชม. ระบบจะอนุมัติให้อัตโนมัติ)</span>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* ✨ ปฏิทินรายสัปดาห์ (เพิ่มตัวเลือก เดือน/ปี) */}
        <section className="bg-white rounded-[3.5rem] p-6 md:p-10 border border-gray-50 shadow-xl overflow-hidden text-gray-900">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 px-2 gap-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><LayoutGrid size={20}/></div>
                <h2 className="text-xl font-black tracking-tight text-gray-900">ภาพรวมการสอน</h2>
             </div>
             
             <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 px-3 border-r border-gray-200">
                  <CalendarIcon size={14} className="text-gray-400"/>
                  <input 
                    type="month" 
                    className="bg-transparent text-xs font-black outline-none text-gray-600 cursor-pointer"
                    value={currentWeekStart.toISOString().slice(0, 7)}
                    onChange={handleMonthYearChange}
                  />
                </div>
                <div className="flex gap-1 pr-1">
                  <button onClick={() => handleWeekChange(-1)} className="p-2 bg-white shadow-sm hover:bg-gray-100 rounded-xl transition-all text-gray-600"><ChevronLeft size={16}/></button>
                  <button onClick={() => handleWeekChange(1)} className="p-2 bg-white shadow-sm hover:bg-gray-100 rounded-xl transition-all text-gray-600"><ChevronRight size={16}/></button>
                </div>
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
                        <div className={`w-full p-1.5 rounded-lg text-center border text-[7px] font-black uppercase transition-all ${isLessonCompleted(b) ? 'bg-green-50 border-green-100 text-green-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
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
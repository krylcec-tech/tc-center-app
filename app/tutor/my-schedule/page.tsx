'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, LogOut, Loader2, Globe, MapPin, 
  Search, CheckCircle2, Clock, Video, ArrowLeft, LayoutGrid, ChevronLeft, ChevronRight,
  User, Send, AlertCircle, Link as LinkIcon, MessageCircle, Mail, Filter, Save, X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TutorSchedulePage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tutorInfo, setTutorInfo] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [tempLink, setTempLink] = useState('');

  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null);
  const [tutorNotes, setTutorNotes] = useState<{ [key: string]: string }>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(''); 
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
            id, status, student_id, student_verified, is_completed, meeting_url, student_note, tutor_note,
            slots!inner ( 
              id, start_time, location_type,
              teaching_logs ( id, created_at )
            )
          `)
          .eq('tutor_id', tutor.id)
          .order('slots(start_time)', { ascending: false }); 

        if (bookingError) throw bookingError;

        // ✨ ดึงข้อมูลรูปภาพจาก profiles และ ดึงชื่อ+อีเมลจาก student_wallets
        const { data: profilesData } = await supabase.from('profiles').select('id, avatar_url');
        const { data: walletsData } = await supabase.from('student_wallets').select('user_id, student_name, email');

        const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const walletMap = new Map(walletsData?.map(w => [w.user_id, w]) || []);

        const initialTutorNotes: { [key: string]: string } = {};

        const formattedBookings = (bookingsData || []).map((item: any) => {
          const profInfo = profileMap.get(item.student_id);
          const walletInfo = walletMap.get(item.student_id);
          
          initialTutorNotes[item.id] = item.tutor_note || ''; 

          return {
            ...item,
            student_name: walletInfo?.student_name || 'ไม่ระบุชื่อ',
            student_email: walletInfo?.email || 'ไม่มีข้อมูลอีเมลติดต่อ', // ✨ ใช้อีเมลจาก wallet ถูกต้องแน่นอน
            student_avatar: profInfo?.avatar_url || null
          }
        });

        setTutorNotes(initialTutorNotes);
        setBookings(formattedBookings);
      }
    } catch (err: any) {
      console.error("Schedule Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishLesson = async (item: any) => {
    if (!confirm('ยืนยันว่าสอนเสร็จสิ้นแล้วใช่ไหม?\nระบบจะส่งคำขอยืนยันไปให้นักเรียน (นักเรียนต้องกดยืนยันถึงจะถือว่าจบงานสมบูรณ์)')) return;
    
    setProcessingId(item.id);
    try {
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

  const handleSaveTutorNote = async (bookingId: string) => {
    setUpdatingNoteId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ tutor_note: tutorNotes[bookingId] })
        .eq('id', bookingId);

      if (error) throw error;
      alert('💬 ส่งข้อความถึงนักเรียนเรียบร้อยแล้วครับ!');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการส่งข้อความ: ' + err.message);
    } finally {
      setUpdatingNoteId(null);
    }
  };

  const isLessonCompleted = (item: any) => {
    const status = String(item.status || '').trim().toUpperCase();
    const hasLog = item.slots?.teaching_logs && item.slots.teaching_logs.length > 0;
    return hasLog || status === 'VERIFIED' || item.is_completed === true;
  };

  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter(item => {
      const isFinished = isLessonCompleted(item);
      const nameMatch = (item.student_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let dateMatch = true;
      if (filterDate) {
        const itemDate = new Date(item.slots.start_time).toISOString().split('T')[0];
        dateMatch = itemDate === filterDate;
      }
      
      return activeStatusTab === 'upcoming' 
        ? (!isFinished && nameMatch && dateMatch) 
        : (isFinished && nameMatch && dateMatch);
    });

    if (activeStatusTab === 'upcoming') {
      filtered.sort((a, b) => new Date(a.slots.start_time).getTime() - new Date(b.slots.start_time).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.slots.start_time).getTime() - new Date(a.slots.start_time).getTime());
    }

    return filtered;

  }, [bookings, searchTerm, activeStatusTab, filterDate]);

  const upcomingCount = useMemo(() => bookings.filter(b => !isLessonCompleted(b)).length, [bookings]);
  const pastCount = useMemo(() => bookings.filter(b => isLessonCompleted(b)).length, [bookings]);

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
      <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10">
        
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Link href="/tutor" className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 hover:text-blue-600 w-max transition-all">
                <ArrowLeft size={14}/> Back to Dashboard
              </Link>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none text-gray-900">
                ตารางสอน <span className="text-blue-600 underline decoration-8 decoration-blue-50">ครู{tutorInfo?.name}</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-red-50 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                  <LogOut size={20} />
               </button>
            </div>
          </div>
        </header>

        {/* ✨ แถบกรองข้อมูลและการค้นหา */}
        <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex w-full md:w-auto gap-2 bg-gray-100/50 p-1.5 rounded-[1.5rem] border border-gray-100 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveStatusTab('upcoming')} className={`whitespace-nowrap px-6 py-2.5 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeStatusTab === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
              คลาสรอสอน ({upcomingCount})
            </button>
            <button onClick={() => setActiveStatusTab('past')} className={`whitespace-nowrap px-6 py-2.5 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeStatusTab === 'past' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>
              ประวัติการสอน ({pastCount})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
             <div className="relative flex-1 sm:flex-none">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
               <input 
                 type="text" 
                 placeholder="ค้นหาชื่อนักเรียน..." 
                 className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:border-blue-400 outline-none w-full sm:w-48 transition-colors"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <div className="relative flex-1 sm:flex-none">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
               <input 
                 type="date" 
                 className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:border-blue-400 outline-none text-gray-600 w-full sm:w-40 transition-colors"
                 value={filterDate}
                 onChange={(e) => setFilterDate(e.target.value)}
               />
               {filterDate && (
                 <button onClick={() => setFilterDate('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                   <X size={14}/>
                 </button>
               )}
             </div>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-16">
          {filteredBookings.length === 0 ? (
            <div className="col-span-full bg-white py-16 px-6 rounded-[3rem] text-center border border-gray-50 shadow-sm flex flex-col items-center">
               <CalendarIcon size={48} className="text-gray-200 mb-4"/>
               <p className="text-gray-400 font-black text-lg">ไม่พบข้อมูลคลาสสอนในหมวดหมู่นี้</p>
               <p className="text-gray-400 font-bold text-xs mt-1">ลองเปลี่ยนเงื่อนไขการค้นหา หรือดูแท็บอื่น</p>
            </div>
          ) : (
            filteredBookings.map((item) => {
              const startTime = new Date(item.slots.start_time);
              const isPastTime = startTime < new Date();
              const hasLog = item.slots?.teaching_logs && item.slots.teaching_logs.length > 0;
              const isStudentVerified = item.status === 'VERIFIED' || item.is_completed === true;

              return (
                <div key={item.id} className={`p-5 md:p-6 rounded-[2.5rem] shadow-sm border transition-all duration-300 flex flex-col gap-5 ${hasLog ? 'bg-white border-gray-100' : 'bg-white border-blue-50 hover:border-blue-200 hover:shadow-md'}`}>
                  
                  {/* Header Card */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {item.student_avatar ? (
                          <img src={item.student_avatar} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover border-2 border-white shadow-sm" alt="student" />
                        ) : (
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 text-blue-400 flex items-center justify-center border-2 border-white shadow-sm"><User size={24}/></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-black leading-none mb-1 text-gray-900">น้อง{item.student_name}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                            <Clock size={12} className={hasLog ? "text-gray-400" : "text-blue-600"}/>
                            {startTime.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} • {startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </div>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${item.slots.location_type === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {item.slots.location_type}
                    </span>
                  </div>

                  {/* Info Box (✨ โชว์อีเมลแล้ว) */}
                  <div className="bg-gray-50/80 p-4 rounded-[1.5rem] border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      <Mail size={14} className="text-gray-400 shrink-0"/> 
                      <span className="truncate">{item.student_email}</span>
                    </div>
                    
                    {item.student_note && item.student_note.trim() !== '' && (
                      <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm flex items-start gap-2">
                        <MessageCircle size={16} className="text-blue-500 mt-0.5 shrink-0"/>
                        <div>
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">ความต้องการจากนักเรียน</p>
                          <p className="text-xs font-bold text-gray-700 leading-relaxed">"{item.student_note}"</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ส่งข้อความกลับให้นักเรียน (Tutor Note) */}
                  <div className="bg-purple-50/50 p-4 rounded-[1.5rem] border border-purple-100 flex flex-col gap-3">
                    <label className="text-[10px] font-black text-purple-600 flex items-center gap-1.5 uppercase tracking-widest">
                      <MessageCircle size={12} /> ฝากข้อความถึงนักเรียน
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        placeholder="เช่น เตรียมชีทบทที่ 1 มาด้วยนะครับ..."
                        className="flex-1 bg-white border border-purple-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-purple-400 transition-colors"
                        value={tutorNotes[item.id] || ''}
                        onChange={(e) => setTutorNotes({ ...tutorNotes, [item.id]: e.target.value })}
                      />
                      <button 
                        onClick={() => handleSaveTutorNote(item.id)}
                        disabled={updatingNoteId === item.id}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 disabled:bg-gray-400 w-full sm:w-auto"
                      >
                        {updatingNoteId === item.id ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                        บันทึกข้อความ
                      </button>
                    </div>
                  </div>

                  {/* ส่วนสำหรับจัดการลิงก์ห้องเรียนรายบุคคล */}
                  {!hasLog && item.slots.location_type === 'Online' && (
                    <div className="bg-blue-50/50 rounded-[1.5rem] p-4 border border-blue-100">
                      {editingLinkId === item.id ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder="วางลิงก์ Google Meet / Zoom..."
                            className="flex-1 text-xs p-3 rounded-xl border border-blue-200 outline-none focus:border-blue-500 bg-white"
                            value={tempLink}
                            onChange={(e) => setTempLink(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => saveMeetingLink(item.id)} disabled={processingId === item.id} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-xs font-black transition-colors">บันทึก</button>
                            <button onClick={() => setEditingLinkId(null)} className="flex-1 bg-white border border-gray-200 text-gray-500 px-4 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">ยกเลิก</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 truncate w-full sm:w-auto">
                            <LinkIcon size={14} className="shrink-0"/> 
                            {item.meeting_url ? (
                              <a href={item.meeting_url} target="_blank" className="truncate hover:underline">{item.meeting_url}</a>
                            ) : (
                              <span className="text-gray-400 italic">ยังไม่ได้แปะลิงก์ห้องเรียน</span>
                            )}
                          </div>
                          <button onClick={() => {setEditingLinkId(item.id); setTempLink(item.meeting_url || '');}} className="w-full sm:w-auto text-[10px] font-black text-blue-600 bg-white px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors shrink-0 shadow-sm">
                            {item.meeting_url ? 'แก้ไขลิงก์' : 'เพิ่มลิงก์'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ส่วนจัดการสถานะ (ปุ่มส่งงาน) */}
                  <div className="pt-2 mt-auto">
                    {!hasLog ? (
                      <button 
                        onClick={() => handleFinishLesson(item)}
                        disabled={processingId === item.id}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-md disabled:bg-gray-400"
                      >
                        {processingId === item.id ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                        บันทึกว่าสอนเสร็จแล้ว (ส่งให้นักเรียนยืนยัน)
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                         {isStudentVerified ? (
                           <div className="flex flex-col items-center justify-center gap-1 text-green-600">
                             <CheckCircle2 size={24} className="mb-1"/>
                             <span className="font-black text-xs">นักเรียนยืนยันแล้ว</span>
                             <span className="text-[9px] font-bold text-green-500/70">คลาสเสร็จสมบูรณ์</span>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center gap-1 text-orange-500">
                             <AlertCircle size={24} className="mb-1 animate-pulse"/>
                             <span className="font-black text-xs">ส่งรายงานแล้ว รอนักเรียนยืนยัน</span>
                             <span className="text-[9px] font-bold text-orange-400/80">(ถ้านักเรียนไม่ยืนยันใน 24ชม. ระบบจะอนุมัติให้อัตโนมัติ)</span>
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

        {/* --- 📅 ปฏิทินรายสัปดาห์ --- */}
        <section className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 border border-gray-100 shadow-sm overflow-hidden text-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-50 pb-6">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><LayoutGrid size={24}/></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">ปฏิทินการสอน</h2>
                  <p className="text-xs font-bold text-gray-400 mt-1">สรุปคิวสอนรายสัปดาห์</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full md:w-auto">
                <div className="flex items-center gap-2 px-4 border-r border-gray-200 flex-1 md:flex-none">
                  <CalendarIcon size={16} className="text-gray-400"/>
                  <input 
                    type="month" 
                    className="bg-transparent text-sm font-black outline-none text-gray-700 cursor-pointer w-full"
                    value={currentWeekStart.toISOString().slice(0, 7)}
                    onChange={handleMonthYearChange}
                  />
                </div>
                <div className="flex gap-1 pr-1 shrink-0">
                  <button onClick={() => handleWeekChange(-1)} className="p-2.5 bg-white shadow-sm hover:bg-gray-100 rounded-xl transition-all text-gray-600"><ChevronLeft size={18}/></button>
                  <button onClick={() => handleWeekChange(1)} className="p-2.5 bg-white shadow-sm hover:bg-gray-100 rounded-xl transition-all text-gray-600"><ChevronRight size={18}/></button>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {weekDays.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const dayBookings = bookings.filter(b => new Date(b.slots.start_time).toDateString() === day.toDateString());
              return (
                <div key={idx} className={`flex flex-col items-center p-2 rounded-[2rem] transition-colors ${isToday ? 'bg-blue-50/50 border border-blue-100' : ''}`}>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl mb-4 font-black text-xs md:text-sm transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-600'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-2 w-full min-h-[120px]">
                    {dayBookings.map((b) => (
                      <div key={b.id} className="group relative flex justify-center w-full">
                        <div className={`w-full p-2 rounded-xl text-center border text-[9px] md:text-[10px] font-black transition-all ${isLessonCompleted(b) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-100 border-blue-200 text-blue-700 shadow-sm'}`}>
                           <p className="truncate px-1">{b.student_name}</p>
                           <p className="text-[8px] font-bold opacity-70 mt-0.5">{new Date(b.slots.start_time).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}น.</p>
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
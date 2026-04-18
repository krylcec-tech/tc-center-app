'use client'
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Calendar, Clock, XCircle, MessageCircle, 
  Loader2, CalendarCheck, Video, CheckCircle2, ChevronLeft, ChevronRight, 
  LayoutGrid, Search, AlertCircle, Save, Mail, Filter, X,
  RefreshCw, ExternalLink // ✨ เพิ่ม Import เพื่อแก้บั๊กและใส่ปุ่มลิงก์
} from 'lucide-react';
import Link from 'next/link';

export default function MySchedulePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  
  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null);
  const [studentNotes, setStudentNotes] = useState<{ [key: string]: string }>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(''); 
  const [activeStatusTab, setActiveStatusTab] = useState<'upcoming' | 'past'>('upcoming');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, is_completed, meeting_url, student_note, tutor_note,
          slots!inner ( 
            id, start_time, location_type,
            teaching_logs ( id, created_at, notes ) 
          ),
          tutors!inner ( name, image_url, email ) 
        `)
        .eq('student_id', user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setBookings(data || []);

      const initialNotes: { [key: string]: string } = {};
      data?.forEach((b) => {
        initialNotes[b.id] = b.student_note || '';
      });
      setStudentNotes(initialNotes);

    } catch (err: any) {
      console.error("🚨 Fetch Error:", err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLesson = async (bookingId: string) => {
    if (!confirm('ยืนยันว่าคุณได้รับชมการสอนและเรียนจบชั่วโมงนี้แล้วใช่ไหม?\n(เมื่อยืนยันแล้ว คลาสจะย้ายไปที่ประวัติการเรียน)')) return;
    
    setVerifyingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'VERIFIED',
          is_completed: true 
        })
        .eq('id', bookingId);

      if (!error) {
        alert('ขอบคุณที่ยืนยันการเข้าเรียนครับ! ✨');
        fetchMyBookings();
      } else {
        throw error;
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการยืนยัน: " + err.message);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSaveNote = async (bookingId: string) => {
    setUpdatingNoteId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ student_note: studentNotes[bookingId] })
        .eq('id', bookingId);

      if (error) throw error;
      alert('ส่งข้อความถึงติวเตอร์เรียบร้อยแล้วครับ! 💬');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการส่งข้อความ: ' + err.message);
    } finally {
      setUpdatingNoteId(null);
    }
  };

  const isStudentVerified = (item: any) => {
    const status = String(item.status || '').trim().toUpperCase();
    return status === 'VERIFIED' || item.is_completed === true;
  };

  const isTutorFinished = (item: any) => {
    const hasLog = item.slots?.teaching_logs && item.slots.teaching_logs.length > 0;
    const classEndTime = new Date(item.slots.start_time).getTime() + (60 * 60 * 1000);
    const isTimePassed = new Date().getTime() > classEndTime;
    return hasLog || isTimePassed;
  };

  const filteredBookings = useMemo(() => {
    let list = bookings.filter(item => {
      if (!item.slots || !item.tutors) return false;

      const isFinished = isStudentVerified(item);
      const tutorName = String(item.tutors?.name || '').toLowerCase();
      const matchesSearch = tutorName.includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (filterDate) {
        const itemDate = new Date(item.slots.start_time).toISOString().split('T')[0];
        matchesDate = itemDate === filterDate;
      }
      
      if (activeStatusTab === 'upcoming') {
        return !isFinished && matchesSearch && matchesDate;
      } else {
        return isFinished && matchesSearch && matchesDate;
      }
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.slots.start_time).getTime();
      const timeB = new Date(b.slots.start_time).getTime();
      return activeStatusTab === 'past' ? timeB - timeA : timeA - timeB;
    });
  }, [bookings, searchTerm, activeStatusTab, filterDate]);

  const upcomingCount = useMemo(() => bookings.filter(b => !isStudentVerified(b)).length, [bookings]);
  const pastCount = useMemo(() => bookings.filter(b => isStudentVerified(b)).length, [bookings]);

  const weekDays = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [currentWeekStart]);

  const changeWeek = (offset: number) => {
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

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="bg-red-50 border-2 border-red-200 p-8 rounded-3xl max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-black text-red-700 mb-2">เกิดข้อผิดพลาดในการดึงข้อมูล</h2>
          <p className="text-sm font-bold text-red-500 mb-6">{errorMsg}</p>
          <button onClick={fetchMyBookings} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black hover:bg-red-700 transition-all">ลองใหม่อีกครั้ง</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-10">
        
        <header className="mb-8">
          <Link href="/student" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4 hover:text-blue-600 w-max transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3 md:gap-4">
              <CalendarCheck className="text-blue-600 shrink-0" size={36} /> ตารางเรียน
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อครู..." 
                  className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:border-blue-400 outline-none shadow-sm w-full transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="date" 
                  className="pl-10 pr-8 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:border-blue-400 outline-none shadow-sm text-gray-600 transition-colors"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                {filterDate && (
                  <button onClick={() => setFilterDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                    <X size={14}/>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ✨ ✨ ✨ แถบแจ้งเตือนติดต่อ LINE (โทนสีเขียว) ✨ ✨ ✨ */}
        <div className="mb-8 p-4 bg-[#06C755] rounded-3xl shadow-lg shadow-green-100 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0">
              <RefreshCw size={24} />
            </div>
            <div className="text-white">
              <h4 className="text-sm font-black leading-tight">ต้องการเลื่อนเวลาเรียน?</h4>
              <p className="text-[11px] font-bold opacity-90 mt-1">กรุณาแจ้งติดต่อทีมงานทาง LINE ได้เลยครับ</p>
            </div>
          </div>
          <a 
            href="https://lin.ee/nWGd4Bux" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-white text-[#06C755] px-6 py-2.5 rounded-2xl font-black text-xs shadow-md hover:bg-green-50 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <MessageCircle size={16} fill="currentColor" /> ติดต่อทาง LINE <ExternalLink size={14}/>
          </a>
        </div>

        <div className="flex gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-[2rem] w-max border border-gray-100">
          <button 
            onClick={() => setActiveStatusTab('upcoming')}
            className={`px-6 py-2.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeStatusTab === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            รอเรียน ({upcomingCount})
          </button>
          <button 
            onClick={() => setActiveStatusTab('past')}
            className={`px-6 py-2.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeStatusTab === 'past' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            เรียนจบแล้ว ({pastCount})
          </button>
        </div>

        <section className="space-y-4 mb-16">
          {filteredBookings.length === 0 ? (
            <div className="bg-white py-16 px-6 rounded-[2.5rem] text-center border border-gray-50 shadow-sm flex flex-col items-center">
               <Calendar size={48} className="text-gray-200 mb-4"/>
               <p className="text-gray-400 font-black text-lg">ไม่พบคลาสเรียนตามเงื่อนไขที่เลือก</p>
            </div>
          ) : (
            filteredBookings.map((item) => {
              const startTime = new Date(item.slots.start_time);
              const verified = isStudentVerified(item); 
              const tutorDone = isTutorFinished(item);  
              const canJoin = !verified; 
              
              const hasTeachingLog = item.slots.teaching_logs && item.slots.teaching_logs.length > 0;
              const tutorNoteLog = hasTeachingLog ? item.slots.teaching_logs[0].notes : null;

              return (
                <div key={item.id} className={`p-5 md:p-6 rounded-[2.5rem] shadow-sm border transition-all flex flex-col gap-5 ${verified ? 'bg-green-50/10 border-green-50' : 'bg-white border-gray-50 hover:border-blue-100'}`}>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <div className="flex items-center gap-4 w-full">
                      <img src={item.tutors?.image_url || '/placeholder-avatar.png'} className="w-14 h-14 object-cover rounded-2xl shadow-sm border-2 border-white shrink-0" alt="tutor" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-gray-900 leading-none truncate">ครู{item.tutors?.name}</h3>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0 ${item.slots.location_type === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.slots.location_type}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1 truncate"><Mail size={10} className="shrink-0 text-gray-400"/> {item.tutors?.email || 'ไม่มีข้อมูลอีเมล'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate">
                            {startTime.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} • {startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-2 min-w-[160px]">
                      {!verified && item.meeting_url && (
                        <a 
                          href={item.meeting_url} 
                          target="_blank" 
                          className={`w-full md:w-auto py-3 px-6 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${canJoin ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Video size={14}/> เข้าห้องเรียนออนไลน์
                        </a>
                      )}
                      {!verified && !item.meeting_url && (
                        <div className="text-[9px] font-bold text-gray-400 text-center flex items-center justify-center gap-1 bg-gray-50 py-2 rounded-xl">
                          <AlertCircle size={12}/> รอลิงก์จากครู
                        </div>
                      )}
                    </div>
                  </div>

                  {item.tutor_note && item.tutor_note.trim() !== '' && (
                    <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                      <div className="p-2 bg-white rounded-xl text-purple-600 shadow-sm shrink-0"><MessageCircle size={16}/></div>
                      <div>
                        <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">ข้อความจากคุณครู:</p>
                        <p className="text-xs font-bold text-gray-700 leading-relaxed">"{item.tutor_note}"</p>
                      </div>
                    </div>
                  )}

                  {!verified && !tutorDone && (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex flex-col gap-3">
                      <label className="text-[10px] font-black text-blue-500 flex items-center gap-1.5 ml-1">
                        <MessageCircle size={12} /> ฝากข้อความถึงครูผู้สอน (อยากให้เน้นเรื่องอะไรเป็นพิเศษ?)
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="text" 
                          placeholder="เช่น อยากให้ทบทวนเรื่องเซต หรือ สรุปสูตรเคมีให้หน่อยครับ..."
                          className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                          value={studentNotes[item.id] || ''}
                          onChange={(e) => setStudentNotes({ ...studentNotes, [item.id]: e.target.value })}
                        />
                        <button 
                          onClick={() => handleSaveNote(item.id)}
                          disabled={updatingNoteId === item.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 disabled:bg-gray-400 w-full sm:w-auto"
                        >
                          {updatingNoteId === item.id ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                          บันทึก
                        </button>
                      </div>
                    </div>
                  )}

                  {!verified && tutorDone && (
                    <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 text-orange-600">
                          <Clock size={16} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-wider">รอการยืนยันจากคุณ</span>
                        </div>
                      </div>
                      {hasTeachingLog && tutorNoteLog && (
                        <div className="mb-4 p-4 bg-white/60 rounded-[1.2rem] border border-orange-100/50">
                           <p className="text-[10px] font-black text-orange-600 mb-2">📝 สรุปการสอนจากติวเตอร์:</p>
                           <p className="text-xs text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">"{tutorNoteLog}"</p>
                        </div>
                      )}
                      <button 
                        onClick={() => handleVerifyLesson(item.id)}
                        disabled={verifyingId === item.id}
                        className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-black text-xs hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        {verifyingId === item.id ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                        ยืนยันว่าได้เข้าเรียนจริง (กดยืนยันเพื่อจบงาน)
                      </button>
                    </div>
                  )}

                  {verified && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-center gap-2 text-green-600 font-black text-[10px] bg-green-50 py-3 rounded-xl border border-green-100">
                        <CheckCircle2 size={14}/> ยืนยันการเข้าเรียนสมบูรณ์แล้ว
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        <section className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 border border-gray-100 shadow-sm overflow-hidden text-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 px-2 gap-4 border-b border-gray-50 pb-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><LayoutGrid size={20}/></div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-gray-900">ภาพรวมการเรียน</h2>
                  <p className="text-xs font-bold text-gray-400 mt-1">สรุปคิวเรียนรายสัปดาห์</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full md:w-auto">
                <div className="flex items-center gap-2 px-3 border-r border-gray-200 flex-1 md:flex-none">
                  <Calendar size={14} className="text-gray-400"/>
                  <input 
                    type="month" 
                    className="bg-transparent text-xs font-black outline-none text-gray-600 cursor-pointer w-full"
                    value={currentWeekStart.toISOString().slice(0, 7)}
                    onChange={handleMonthYearChange}
                  />
                </div>
                <div className="flex gap-1 pr-1 shrink-0">
                  <button onClick={() => changeWeek(-1)} className="p-2.5 bg-white shadow-sm hover:bg-gray-100 rounded-xl transition-all text-gray-600"><ChevronLeft size={16}/></button>
                  <button onClick={() => changeWeek(1)} className="p-2.5 bg-white shadow-sm hover:bg-gray-100 rounded-xl transition-all text-gray-600"><ChevronRight size={16}/></button>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-4 pt-4">
            {weekDays.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const dayBookings = bookings.filter(b => new Date(b.slots.start_time).toDateString() === day.toDateString());
              return (
                <div key={idx} className={`flex flex-col items-center p-2 rounded-[1.5rem] transition-colors ${isToday ? 'bg-blue-50/50 border border-blue-50' : ''}`}>
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-widest">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl mb-4 font-black text-[10px] md:text-xs transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-500'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1.5 w-full min-h-[120px]">
                    {dayBookings.map((b) => (
                      <div key={b.id} className="group relative flex justify-center w-full">
                        <div className={`w-full p-1.5 md:p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-0.5 ${isStudentVerified(b) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'}`}>
                           <span className="text-[9px] md:text-[10px] font-black uppercase truncate w-full px-1">ครู{b.tutors?.name}</span>
                           <span className="text-[8px] font-bold opacity-70 bg-white/50 px-1 rounded-sm">{new Date(b.slots.start_time).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}น.</span>
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
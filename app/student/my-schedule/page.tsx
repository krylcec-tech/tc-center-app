'use client'
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Calendar, Clock, XCircle, MessageCircle, 
  Loader2, CalendarCheck, Video, CheckCircle2, ChevronLeft, ChevronRight, LayoutGrid, Search, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function MySchedulePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState<'upcoming' | 'past'>('upcoming');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, student_verified, tutor_finished_at,
          slots!inner ( id, start_time, location_type ),
          tutors!inner ( name, image_url, meeting_url )
        `)
        .eq('student_id', user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err: any) {
      console.error("🚨 Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLesson = async (bookingId: string) => {
    if (!confirm('ยืนยันว่าคุณได้รับชมการสอนและเรียนจบชั่วโมงนี้แล้วใช่ไหม?\n(เพื่อเป็นหลักฐานความถูกต้องของระบบ)')) return;
    
    setVerifyingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          student_verified: true,
          status: 'VERIFIED' // เปลี่ยนสถานะเป็นตรวจสอบแล้ว
        })
        .eq('id', bookingId);

      if (!error) {
        alert('ขอบคุณที่ยืนยันการเข้าเรียนครับ! ✨');
        fetchMyBookings();
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการยืนยัน");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(item => {
      const startTime = new Date(item.slots.start_time);
      const isPast = startTime < new Date();
      const matchesSearch = item.tutors?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeStatusTab === 'upcoming') {
        return !isPast && matchesSearch;
      } else {
        return isPast && matchesSearch;
      }
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

  const changeWeek = (offset: number) => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + (offset * 7));
    setCurrentWeekStart(next);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        
        <header className="mb-8">
          <Link href="/student" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4 hover:text-blue-600 w-max transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
              <CalendarCheck className="text-blue-600" size={40} /> ตารางเรียน
            </h1>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อครู..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:border-blue-400 outline-none shadow-sm w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-[2rem] w-max">
          <button 
            onClick={() => setActiveStatusTab('upcoming')}
            className={`px-6 py-2.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeStatusTab === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            รอเรียน ({bookings.filter(b => new Date(b.slots.start_time) >= new Date()).length})
          </button>
          <button 
            onClick={() => setActiveStatusTab('past')}
            className={`px-6 py-2.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeStatusTab === 'past' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            เรียนจบแล้ว ({bookings.filter(b => new Date(b.slots.start_time) < new Date()).length})
          </button>
        </div>

        <section className="space-y-4 mb-16">
          {filteredBookings.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] text-center border border-gray-50 shadow-sm">
               <p className="text-gray-400 font-bold text-sm">ไม่พบรายการที่ค้นหา</p>
            </div>
          ) : (
            filteredBookings.map((item) => {
              const startTime = new Date(item.slots.start_time);
              const isPast = startTime < new Date();
              const canJoin = !isPast || (new Date().getTime() - startTime.getTime() < 3600000);

              return (
                <div key={item.id} className={`p-5 md:p-6 rounded-[2.2rem] shadow-sm border transition-all flex flex-col gap-4 ${isPast ? 'bg-green-50/20 border-green-50' : 'bg-white border-gray-50'}`}>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
                    <div className="flex items-center gap-4 w-full">
                      <img src={item.tutors?.image_url || '/placeholder-avatar.png'} className="w-14 h-14 object-cover rounded-2xl shadow-sm border-2 border-white" alt="tutor" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-gray-900 leading-none">ครู{item.tutors?.name}</h3>
                          <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">{item.slots.location_type}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {startTime.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} • {startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-2 min-w-[160px]">
                      {!isPast && item.tutors?.meeting_url && (
                        <a 
                          href={item.tutors.meeting_url} 
                          target="_blank" 
                          className={`flex-1 md:flex-none py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${canJoin ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Video size={14}/> เข้าห้องเรียนออนไลน์
                        </a>
                      )}
                      {!isPast && !item.tutors?.meeting_url && (
                        <div className="text-[9px] font-bold text-gray-400 text-center flex items-center justify-center gap-1 bg-gray-50 py-2 rounded-xl">
                          <AlertCircle size={12}/> รอลิงก์จากครู
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ✨ ระบบยืนยันการเรียน & Auto-Verify Notice */}
                  {item.status === 'COMPLETED' && !item.student_verified && (
                    <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 text-orange-600">
                          <Clock size={16} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-wider">รอการยืนยันเข้าเรียน</span>
                        </div>
                        <span className="text-[9px] bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">
                          ระบบจะยืนยันอัตโนมัติ 24 ชม. หลังครูสอนเสร็จ
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleVerifyLesson(item.id)}
                        disabled={verifyingId === item.id}
                        className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-black text-xs hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        {verifyingId === item.id ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                        ยืนยันว่าได้เข้าเรียนจริง (เสร็จสมบูรณ์)
                      </button>
                      
                      {item.tutor_finished_at && (
                        <p className="text-[8px] text-gray-400 text-center mt-3 font-medium uppercase tracking-tighter">
                          ติวเตอร์บันทึกจบงานเมื่อ: {new Date(item.tutor_finished_at).toLocaleString('th-TH')}
                        </p>
                      )}
                    </div>
                  )}

                  {item.student_verified && (
                    <div className="flex items-center justify-center gap-2 text-green-600 font-black text-[10px] bg-green-50 py-3 rounded-xl border border-green-100">
                      <CheckCircle2 size={14}/> ตรวจสอบความถูกต้องเรียบร้อยแล้ว
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* --- 📅 ตารางรายสัปดาห์ (คงเดิม) --- */}
        <section className="bg-white rounded-[3rem] p-6 md:p-10 border border-gray-50 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-3">
                <LayoutGrid className="text-blue-600" size={20}/>
                <h2 className="text-xl font-black tracking-tight">ภาพรวมรายสัปดาห์</h2>
             </div>
             <div className="flex gap-1">
                <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><ChevronLeft size={20}/></button>
                <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><ChevronRight size={20}/></button>
             </div>
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-4 border-t border-gray-50 pt-8">
            {weekDays.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const dayBookings = bookings.filter(b => new Date(b.slots.start_time).toDateString() === day.toDateString());
              return (
                <div key={idx} className="flex flex-col items-center">
                  <p className="text-[8px] font-black text-gray-300 uppercase mb-3">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl mb-4 font-black text-[10px] md:text-xs ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1 w-full min-h-[80px]">
                    {dayBookings.map((b) => (
                      <div key={b.id} className={`w-full p-1.5 rounded-lg text-center border text-[7px] font-black uppercase ${new Date(b.slots.start_time) < new Date() ? 'bg-green-50 border-green-100 text-green-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                         {b.tutors?.name}
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
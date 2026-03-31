'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Calendar as CalendarIcon, LogOut, Loader2, Globe, MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TutorSchedulePage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tutorInfo, setTutorInfo] = useState<any>(null);

  useEffect(() => {
    loadTutorSchedule();
  }, []);

  const loadTutorSchedule = async () => {
    setLoading(true);
    try {
      // 1. ดึงข้อมูล User จาก Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. ดึงข้อมูลติวเตอร์โดยใช้ user_id (แก้ไขจาก email เป็น user_id)
      const { data: tutor } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tutor) {
        setTutorInfo(tutor);
        
        // 3. ดึงคิว (slots) ที่ "ถูกจองแล้ว" และเป็นของติวเตอร์คนนี้
        // หมายเหตุ: ตาราง bookings ต้องมี tutor_id หรือ slot_id เชื่อมกัน
        const { data: mySlots, error } = await supabase
          .from('slots')
          .select(`
            id, 
            start_time, 
            location_type,
            is_booked,
            bookings (
              student_name,
              subject
            )
          `)
          .eq('tutor_id', tutor.id)
          .eq('is_booked', true);

        if (error) throw error;

        if (mySlots) {
          const calendarEvents = mySlots.map(slot => {
            // ดึงข้อมูลการจอง (ใช้ optional chaining กันพัง)
            const booking = Array.isArray(slot.bookings) ? slot.bookings[0] : slot.bookings; 
            
            return {
              id: slot.id,
              title: `${booking?.student_name || 'มีผู้จอง'} - ${booking?.subject || 'สอนพิเศษ'}`,
              start: slot.start_time,
              end: new Date(new Date(slot.start_time).getTime() + 60 * 60 * 1000).toISOString(),
              extendedProps: {
                student: booking?.student_name,
                subject: booking?.subject,
                location: slot.location_type
              },
              backgroundColor: slot.location_type === 'Online' ? '#DBEAFE' : '#F3E8FF',
              borderColor: slot.location_type === 'Online' ? '#3B82F6' : '#A855F7',
              textColor: '#1E40AF'
            };
          });
          setEvents(calendarEvents);
        }
      }
    } catch (err: any) {
      console.error("Schedule Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-tighter mb-2">
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div> Tutor Dashboard
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">
             ตารางสอน <span className="text-blue-600 underline decoration-8 decoration-blue-100">{tutorInfo?.name || '...'}</span>
          </h1>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/calendar-slots" className="bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl font-black text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm">
            <CalendarIcon size={20} /> จัดการเวลาว่าง
          </Link>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-red-50 text-red-600 p-4 rounded-2xl hover:bg-red-600 hover:text-white transition-all font-black shadow-sm">
            <LogOut size={22} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-600" size={64} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-200">
                <p className="font-black opacity-80 uppercase text-xs tracking-[0.2em] mb-3">คลาสที่จองแล้ว</p>
                <div className="text-7xl font-black mb-2">{events.length}</div>
                <p className="font-bold text-lg">รายการสอนทั้งหมด</p>
             </div>

             <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-400 text-xs uppercase mb-4 tracking-widest">สัญลักษณ์สี</h3>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-100 border border-blue-600 rounded-full"></div>
                      <p className="text-sm font-bold text-gray-600">Online Class</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-purple-100 border border-purple-600 rounded-full"></div>
                      <p className="text-sm font-bold text-gray-600">Onsite Class</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-3 bg-white p-8 rounded-[3.5rem] shadow-xl border border-gray-50">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'timeGridWeek,timeGridDay'
                }}
                events={events}
                locale="th"
                slotMinTime="08:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={false}
                height="auto"
                eventContent={(info) => (
                  <div className="p-2 overflow-hidden">
                    <div className="font-black text-xs text-blue-900 leading-tight">{info.event.title}</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-blue-700 mt-1">
                       {info.event.extendedProps.location === 'Online' ? <Globe size={10}/> : <MapPin size={10}/>}
                       {info.event.extendedProps.location}
                    </div>
                  </div>
                )}
              />
          </div>
        </div>
      )}

      <style jsx global>{`
        .fc { --fc-border-color: #F1F5F9; font-family: inherit; }
        .fc .fc-toolbar-title { font-weight: 900; font-size: 1.5rem; color: #1E293B; }
        .fc .fc-button-primary { background-color: #fff; border: 2px solid #F1F5F9; color: #64748B; font-weight: 800; border-radius: 12px; }
        .fc .fc-button-active { background-color: #3B82F6 !important; border-color: #3B82F6 !important; color: #fff !important; }
        .fc-v-event { border-radius: 16px !important; border: 2px solid rgba(255,255,255,0.5) !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
      `}</style>
    </div>
  );
}
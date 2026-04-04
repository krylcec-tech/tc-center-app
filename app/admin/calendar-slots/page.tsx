'use client'
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list'; // ✨ กลับมาใช้ List Plugin แล้ว!
import { 
  ArrowLeft, Calendar, User, Clock, LayoutList, Globe, Search, LogOut 
} from 'lucide-react'; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Tutor {
  id: string;
  name: string;
}

export default function CalendarManagePage() {
  const router = useRouter();
  const calendarRef = useRef<any>(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTutorId, setCurrentTutorId] = useState<string | null>(null);

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [viewTutor, setViewTutor] = useState<string>('all');

  const [selectedTutor, setSelectedTutor] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationType, setLocationType] = useState('Online');
  
  // State เช็คหน้าจอมือถือ
  const [isMobile, setIsMobile] = useState(false);

  const timeOptions = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    fetchInitialData();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (currentTutorId || isAdmin) fetchSlots();
  }, [viewTutor, currentTutorId, isAdmin]);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: currentUser } = await supabase.from('tutors').select('id, name, role').eq('user_id', user.id).maybeSingle();

    const rawRole = currentUser?.role || '';
    const dbRole = rawRole.replace(/'/g, "").trim().toLowerCase(); 
    const checkIsAdmin = dbRole === 'admin';
    
    setIsAdmin(checkIsAdmin);
    setCurrentTutorId(currentUser?.id || null);

    let tutorsQuery = supabase.from('tutors').select('id, name').order('name');
    if (!checkIsAdmin && currentUser) tutorsQuery = tutorsQuery.eq('id', currentUser.id);

    const { data: tutorsData } = await tutorsQuery;
    if (tutorsData && tutorsData.length > 0) {
      setTutors(tutorsData);
      const initialId = checkIsAdmin ? tutorsData[0].id : currentUser?.id;
      setSelectedTutor(initialId || '');
      setViewTutor(checkIsAdmin ? 'all' : (currentUser?.id || ''));
    }
  };

  const fetchSlots = async () => {
    try {
      let query = supabase.from('slots').select('*, tutors(name), teaching_logs(id)');
      
      if (!isAdmin && currentTutorId) query = query.eq('tutor_id', currentTutorId);
      else if (isAdmin && viewTutor !== 'all') query = query.eq('tutor_id', viewTutor);

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const calendarEvents = data.map((slot: any) => {
          const isCompleted = slot.teaching_logs && slot.teaching_logs.length > 0;
          let bgColor = '#dcfce7'; let borderColor = '#22c55e'; let textColor = '#166534';

          if (isCompleted) {
            bgColor = '#e2e8f0'; borderColor = '#94a3b8'; textColor = '#475569';
          } else if (slot.is_booked) {
            bgColor = '#fee2e2'; borderColor = '#ef4444'; textColor = '#991b1b';
          } else {
            if (slot.location_type === 'Onsite') {
              bgColor = '#f3e8ff'; borderColor = '#a855f7'; textColor = '#6b21a8';
            } else if (slot.location_type === 'นอกสถานที่') {
              bgColor = '#ffedd5'; borderColor = '#f97316'; textColor = '#9a3412';
            }
          }

          const startObj = new Date(slot.start_time);
          return {
            id: slot.id,
            title: `${slot.tutors?.name || 'Tutor'} [${slot.location_type || 'Online'}] ${isCompleted ? '✅' : ''}`,
            start: startObj.toISOString(),
            end: new Date(startObj.getTime() + 60 * 60 * 1000).toISOString(),
            backgroundColor: bgColor,
            borderColor: borderColor,
            textColor: textColor,
            extendedProps: { 
              isBooked: slot.is_booked, 
              isCompleted: isCompleted,
              tutorId: slot.tutor_id,
              tutorName: slot.tutors?.name 
            }
          };
        });
        setEvents(calendarEvents);
      }
    } catch (err: any) { console.error(err); }
  };

  const handleEventClick = async (info: any) => {
    const { isBooked, isCompleted, tutorId, tutorName } = info.event.extendedProps;
    const slotId = info.event.id;

    if (isCompleted) return alert("คิวนี้บันทึกการสอนไปแล้วครับ");
    if (!isBooked) return alert("คิวนี้ยังไม่มีการจองครับ");

    const studentName = window.prompt(`👤 บันทึกการสอนของ ${tutorName}\nกรุณาระบุชื่อนักเรียน:`, "นักเรียน");
    if (!studentName) return;

    const note = window.prompt("📝 บันทึกรายละเอียดการเรียนสอน:", "");
    if (note === null) return;

    if (window.confirm(`ยืนยันการบันทึกรายงานใช่ไหมครับ?`)) {
      const { error } = await supabase.from('teaching_logs').insert({
        tutor_id: tutorId, 
        slot_id: slotId,
        student_name: studentName, 
        subject: 'วิชาสอน', 
        duration_hours: 1,
        teaching_date: info.event.start.toISOString().split('T')[0],
        notes: note
      });

      if (!error) { alert("✅ บันทึกสำเร็จ!"); fetchSlots(); } 
      else { alert("❌ Error: " + error.message); }
    }
  };

  const addBulkSlots = async () => {
    if (!selectedTutor || !date || !startTime || !endTime) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    if (startHour >= endHour) return alert("เวลาเริ่มต้องน้อยกว่าเวลาเลิกเรียนครับ");

    const newSlots = [];
    for (let h = startHour; h < endHour; h++) {
      const startIso = new Date(`${date}T${h.toString().padStart(2, '0')}:00`).toISOString();
      newSlots.push({ tutor_id: selectedTutor, start_time: startIso, is_booked: false, location_type: locationType });
    }

    const { error } = await supabase.from('slots').insert(newSlots);
    if (!error) { alert(`✅ เพิ่มคิวสำเร็จ ${newSlots.length} ช่วงเวลา!`); fetchSlots(); } 
    else { alert("❌ เกิดข้อผิดพลาด: " + error.message); }
  };

  const handleLogout = async () => {
    if (confirm('ยืนยันออกจากระบบ?')) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-gray-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <Link href={isAdmin ? "/admin" : "/tutor"} className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-3 hover:text-blue-700 transition-all w-max">
            <ArrowLeft size={16} /> กลับหน้าหลัก {isAdmin ? 'Admin' : 'Tutor'}
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none">จัดการคิวสอน (ปฏิทิน)</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex-1 md:flex-none">
            <Link href="/admin/manage-slots" className="text-gray-400 px-4 md:px-6 py-2.5 rounded-xl hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-black text-xs w-full">
               <LayoutList size={16} /> ตาราง
            </Link>
            <button className="bg-blue-600 text-white px-4 md:px-6 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 shadow-md text-xs w-full">
               <Calendar size={16} /> ปฏิทิน
            </button>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-500 p-3.5 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-black shadow-sm shrink-0">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* --- ส่วนฟอร์มเพิ่มคิว --- */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
        <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Clock className="text-blue-600" size={20}/> เปิดเวลาสอน</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ติวเตอร์</label>
            <select disabled={!isAdmin} className={`border-2 p-3 rounded-2xl text-sm font-bold outline-none transition-all ${!isAdmin ? 'bg-gray-50 text-gray-400' : 'bg-white focus:border-blue-400'}`} onChange={(e) => setSelectedTutor(e.target.value)} value={selectedTutor}>
              {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">วันที่สอน</label>
            <input type="date" className="border-2 p-3 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-400 w-full" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">เริ่ม (น.)</label>
            <select className="border-2 p-3 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-400" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
              <option value="">เวลา</option>
              {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ถึง (น.)</label>
            <select className="border-2 p-3 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-400" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
              <option value="">เวลา</option>
              {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">รูปแบบ</label>
            <select className="border-2 p-3 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-400" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
              <option value="Online">Online</option>
              <option value="Onsite">Onsite</option>
              <option value="นอกสถานที่">นอกสถานที่</option>
            </select>
          </div>
          <button onClick={addBulkSlots} className="col-span-2 md:col-span-1 bg-gray-900 text-white p-3.5 rounded-2xl font-black hover:bg-blue-600 shadow-md uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all w-full h-max">
            {isAdmin ? 'เพิ่มคิว' : '+ เปิดเวลา'}
          </button>
        </div>
      </div>

      {/* --- Filter & Jump Date --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest border-r pr-3 mr-1 flex items-center gap-1"><Search size={14}/> {isAdmin ? 'กรอง:' : 'โปรไฟล์:'}</span>
          {isAdmin && (
            <button onClick={() => setViewTutor('all')} className={`px-5 py-2.5 rounded-[1rem] font-black text-xs whitespace-nowrap transition-all ${viewTutor === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}>ทั้งหมด</button>
          )}
          {tutors.map(t => (
            <button 
              key={t.id} 
              onClick={() => isAdmin && setViewTutor(t.id)} 
              className={`px-5 py-2.5 rounded-[1rem] font-black text-xs whitespace-nowrap transition-all flex items-center gap-2 ${viewTutor === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'} ${!isAdmin ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white p-2 px-4 rounded-2xl border border-gray-100 shadow-sm w-full md:w-auto justify-between md:justify-start">
          <label className="text-[10px] font-black text-blue-600 flex items-center gap-1 uppercase tracking-widest">
            <Calendar size={14} /> ไปที่วันที่:
          </label>
          <input type="date" className="outline-none text-sm font-bold bg-transparent cursor-pointer text-gray-700" onChange={(e) => { if (e.target.value && calendarRef.current) calendarRef.current.getApi().gotoDate(e.target.value); }} />
        </div>
      </div>

      {/* --- Legend (คำอธิบายสี) --- */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-[0.2em] mb-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div> Online</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></div> Onsite</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div> นอกสถานที่</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse"></div> จองแล้ว</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]"></div> สอนแล้ว</div>
      </div>

      {/* --- ปฏิทิน --- */}
      <div className="bg-white p-2 md:p-6 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden fc-premium-theme">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]} // ✨ รองรับ List View เรียบร้อย
          initialView={isMobile ? "listWeek" : "timeGridWeek"} // ✨ ถ้าจอมือถือให้เปิดโหมด List (อ่านง่ายมาก)
          headerToolbar={{
            left: isMobile ? 'prev,next' : 'prev,next today',
            center: 'title',
            right: isMobile ? 'listWeek,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          locale="th"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height={isMobile ? "auto" : "700px"}
          eventClick={handleEventClick} 
          dateClick={(info) => {
            setDate(info.dateStr.split('T')[0]);
            const time = info.dateStr.split('T')[1]?.substring(0, 5);
            if (time) setStartTime(time);
          }}
        />
      </div>

      {/* ✨ CSS ตกแต่งปฏิทินให้ดูพรีเมียมและเหมาะกับมือถือ */}
      <style jsx global>{`
        .fc-premium-theme .fc { 
          --fc-border-color: #f1f5f9; 
          --fc-button-text-color: #64748b;
          --fc-button-bg-color: #f8fafc;
          --fc-button-border-color: #e2e8f0;
          --fc-button-hover-bg-color: #e2e8f0;
          --fc-button-hover-border-color: #cbd5e1;
          --fc-button-active-bg-color: #2563eb;
          --fc-button-active-border-color: #2563eb;
          --fc-today-bg-color: #eff6ff;
          font-family: inherit; 
        }
        .fc-premium-theme .fc-toolbar-title { font-weight: 900; font-size: clamp(1.2rem, 3vw, 1.8rem); color: #0f172a; }
        .fc-premium-theme .fc-button { font-weight: 800; border-radius: 12px; text-transform: capitalize; font-size: 0.8rem; padding: 0.4rem 0.8rem; }
        .fc-premium-theme .fc-button-active { color: white !important; box-shadow: 0 4px 6px -1px rgb(37 99 235 / 0.3); }
        .fc-premium-theme .fc-v-event { border-radius: 8px !important; border: none !important; box-shadow: inset 2px 0 0 0 rgba(0,0,0,0.2); padding: 2px; }
        .fc-premium-theme .fc-event-title { font-weight: 800; font-size: 0.75rem; letter-spacing: -0.02em; }
        
        /* 🎨 สไตล์สำหรับ List View (มือถือ) ให้ดูสวยงาม */
        .fc-premium-theme .fc-list-event-title { font-weight: 800; color: #1e293b; padding: 12px 8px !important; }
        .fc-premium-theme .fc-list-event-time { font-weight: 900; color: #64748b; padding: 12px 8px !important; }
        .fc-premium-theme .fc-list-day-cushion { background-color: #f8fafc !important; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #3b82f6; padding: 10px 14px !important; }
        
        /* ซ่อนปุ่มที่ไม่จำเป็นในมือถือเพื่อประหยัดพื้นที่ */
        @media (max-width: 768px) {
          .fc-toolbar { flex-wrap: wrap; gap: 10px; justify-content: center !important; }
        }
      `}</style>

    </div>
  );
}
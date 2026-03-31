'use client'
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
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

  const timeOptions = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // ดึงข้อมูลใหม่ทุกครั้งที่เปลี่ยนการกรอง (viewTutor)
  useEffect(() => {
    if (currentTutorId || isAdmin) {
      fetchSlots();
    }
  }, [viewTutor, currentTutorId, isAdmin]);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    const { data: currentUser } = await supabase
      .from('tutors')
      .select('id, name, role')
      .eq('user_id', user.id)
      .maybeSingle();

    const rawRole = currentUser?.role || '';
    const dbRole = rawRole.replace(/'/g, "").trim().toLowerCase(); 
    const checkIsAdmin = dbRole === 'admin';
    
    setIsAdmin(checkIsAdmin);
    setCurrentTutorId(currentUser?.id || null);

    // ดึงรายชื่อติวเตอร์ทั้งหมด (ถ้าเป็นแอดมิน) หรือเฉพาะตัวเอง (ถ้าเป็นติวเตอร์)
    let tutorsQuery = supabase.from('tutors').select('id, name').order('name');
    if (!checkIsAdmin && currentUser) {
      tutorsQuery = tutorsQuery.eq('id', currentUser.id);
    }

    const { data: tutorsData } = await tutorsQuery;
    if (tutorsData && tutorsData.length > 0) {
      setTutors(tutorsData);
      
      // ตั้งค่าเริ่มต้นของ Dropdown และตัวกรอง
      const initialId = checkIsAdmin ? tutorsData[0].id : currentUser?.id;
      setSelectedTutor(initialId || '');
      setViewTutor(checkIsAdmin ? 'all' : (currentUser?.id || ''));
    }
  };

  const fetchSlots = async () => {
    try {
      let query = supabase.from('slots').select('*, tutors(name), teaching_logs(id)');
      
      // Logic การกรองข้อมูลบนปฏิทิน
      if (!isAdmin && currentTutorId) {
        query = query.eq('tutor_id', currentTutorId);
      } else if (isAdmin && viewTutor !== 'all') {
        query = query.eq('tutor_id', viewTutor);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const calendarEvents = data.map((slot: any) => {
          const isCompleted = slot.teaching_logs && slot.teaching_logs.length > 0;
          
          let bgColor = '#dcfce7'; // Online (Green)
          let borderColor = '#22c55e';
          let textColor = '#166534';

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
              tutorId: slot.tutor_id, // เก็บ ID ติวเตอร์เจ้าของคิวไว้ใช้ตอนบันทึก log
              tutorName: slot.tutors?.name 
            }
          };
        });
        setEvents(calendarEvents);
      }
    } catch (err: any) {
      console.error("Fetch slots error:", err.message);
    }
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
        tutor_id: tutorId, // ใช้ ID ติวเตอร์เจ้าของคิว (แอดมินบันทึกแทนได้)
        slot_id: slotId,
        student_name: studentName, 
        subject: 'วิชาสอน', 
        duration_hours: 1,
        teaching_date: info.event.start.toISOString().split('T')[0],
        notes: note
      });

      if (!error) {
        alert("✅ บันทึกสำเร็จ!");
        fetchSlots();
      } else {
        alert("❌ Error: " + error.message);
      }
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
      newSlots.push({ 
        tutor_id: selectedTutor, 
        start_time: startIso, 
        is_booked: false,
        location_type: locationType 
      });
    }

    const { error } = await supabase.from('slots').insert(newSlots);
    if (!error) { 
      alert(`✅ เพิ่มคิวสำเร็จ ${newSlots.length} ช่วงเวลา!`);
      fetchSlots(); 
    } else {
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleJumpToDate = (d: string) => {
    if (d && calendarRef.current) calendarRef.current.getApi().gotoDate(d);
  };

  const handleLogout = async () => {
    if (confirm('ยืนยันออกจากระบบ?')) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link href={isAdmin ? "/admin" : "/tutor"} className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-2 group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            กลับหน้าหลัก {isAdmin ? 'Admin' : 'Tutor'}
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">จัดการคิว (ปฏิทิน)</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            <Link href="/admin/manage-slots" className="text-gray-500 px-6 py-2.5 rounded-xl hover:text-blue-600 transition-all flex items-center gap-2 font-black text-sm">
               <LayoutList size={18} /> ตาราง
            </Link>
            <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-md text-sm">
               <Calendar size={18} /> ปฏิทิน
            </button>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 p-3 rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 font-black">
            <LogOut size={22} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Bulk Add Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-6 gap-5 items-end">
          <div className="flex flex-col gap-2 col-span-2 md:col-span-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">เลือกติวเตอร์</label>
            <select 
              disabled={!isAdmin} // 🛡️ ติวเตอร์ทั่วไปจะถูกล็อกห้ามเปลี่ยนชื่อ
              className={`border-2 p-3 rounded-2xl text-base font-bold outline-none transition-all ${!isAdmin ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 focus:border-blue-400'}`} 
              onChange={(e) => setSelectedTutor(e.target.value)} 
              value={selectedTutor}
            >
              {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">วันที่สอน</label>
            <input type="date" className="border-2 p-3 rounded-2xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">เริ่ม (น.)</label>
            <select className="border-2 p-3 rounded-2xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
              <option value="">เวลา</option>
              {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">ถึง (น.)</label>
            <select className="border-2 p-3 rounded-2xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
              <option value="">เวลา</option>
              {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">รูปแบบ</label>
            <select className="border-2 p-3 rounded-2xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
              <option value="Online">Online</option>
              <option value="Onsite">Onsite</option>
              <option value="นอกสถานที่">นอกสถานที่</option>
            </select>
          </div>
          <button onClick={addBulkSlots} className="bg-blue-600 text-white p-4 rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-100 uppercase text-xs tracking-widest active:scale-95 transition-all">
            {isAdmin ? 'เพิ่มคิวติวเตอร์' : 'เพิ่มคิวของฉัน'}
          </button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
          <span className="text-gray-400 font-black text-xs uppercase tracking-widest border-r pr-3 mr-1 flex items-center gap-1"><Search size={14}/> {isAdmin ? 'กรองปฏิทิน:' : 'โปรไฟล์:'}</span>
          {isAdmin && (
            <button onClick={() => setViewTutor('all')} className={`px-5 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-all ${viewTutor === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 border'}`}>ทั้งหมด</button>
          )}
          {tutors.map(t => (
            <button 
              key={t.id} 
              onClick={() => isAdmin && setViewTutor(t.id)} 
              className={`px-5 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-all flex items-center gap-2 ${viewTutor === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 border'} ${!isAdmin ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white p-2 px-4 rounded-2xl border-2 border-blue-100 shadow-sm">
          <label className="text-xs font-black text-blue-600 flex items-center gap-1 uppercase tracking-tighter">
            <Calendar size={14} /> ไปที่:
          </label>
          <input type="date" className="outline-none text-sm font-black bg-transparent cursor-pointer" onChange={(e) => handleJumpToDate(e.target.value)} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest mb-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#dcfce7] border border-[#22c55e]"></div> Online</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#f3e8ff] border border-[#a855f7]"></div> Onsite</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#ffedd5] border border-[#f97316]"></div> นอกสถานที่</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#fee2e2] border border-[#ef4444]"></div> จองแล้ว</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#e2e8f0] border border-[#94a3b8]"></div> สอนแล้ว</div>
      </div>

      <div className="bg-white p-6 rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          locale="th"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="650px"
          eventClick={handleEventClick} 
          dateClick={(info) => {
            setDate(info.dateStr.split('T')[0]);
            const time = info.dateStr.split('T')[1]?.substring(0, 5);
            if (time) setStartTime(time);
          }}
        />
      </div>
    </div>
  );
}
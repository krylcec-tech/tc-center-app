'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Calendar as CalendarIcon, LayoutList, Clock, 
  Globe, Loader2, Filter, Trash, MapPin, LogOut, AlertCircle, PlusCircle, CheckCircle2, X 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ManageSlotsTable() {
  const router = useRouter();
  const [slots, setSlots] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTutor, setFilterTutor] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTutorId, setCurrentTutorId] = useState<string | null>(null);

  // Add Slots States
  const [selectedTutor, setSelectedTutor] = useState('');
  const [dates, setDates] = useState<string[]>([]);
  const [tempDate, setTempDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationType, setLocationType] = useState('Online');

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const timeOptions = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    fetchInitialData();
  }, [filterTutor, filterStartDate, filterEndDate]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: currentUser } = await supabase.from('tutors').select('id, name, role').eq('user_id', user.id).maybeSingle();
      const rawRole = currentUser?.role || '';
      const checkIsAdmin = rawRole.replace(/'/g, "").trim().toLowerCase() === 'admin';
      
      setIsAdmin(checkIsAdmin);
      setCurrentTutorId(currentUser?.id || null);

      let tutorsQuery = supabase.from('tutors').select('id, name').order('name'); 
      if (!checkIsAdmin && currentUser) tutorsQuery = tutorsQuery.eq('id', currentUser.id);

      const { data: tutorsData } = await tutorsQuery;
      if (tutorsData && tutorsData.length > 0) {
        setTutors(tutorsData);
        const defaultTutorId = checkIsAdmin ? (filterTutor === 'all' ? tutorsData[0].id : filterTutor) : (currentUser?.id || tutorsData[0].id);
        setSelectedTutor(defaultTutorId || '');
        if (!checkIsAdmin) setFilterTutor(currentUser?.id || tutorsData[0].id);
      }

      // ✨ อัปเดต Query: ดึง teaching_logs และ bookings เข้ามาเช็คสถานะด้วย
      let query = supabase.from('slots').select('*, tutors(name), teaching_logs(id), bookings(status, student_verified, is_completed)').order('start_time', { ascending: false });
      
      if (!checkIsAdmin && currentUser) query = query.eq('tutor_id', currentUser.id);
      else if (checkIsAdmin && filterTutor !== 'all') query = query.eq('tutor_id', filterTutor);

      if (filterStartDate) query = query.gte('start_time', `${filterStartDate}T00:00:00`);
      if (filterEndDate) query = query.lte('start_time', `${filterEndDate}T23:59:59`);

      const { data: slotsData } = await query;
      setSlots(slotsData || []);
      
    } catch (error) {
      console.error(error);
    } finally {
      setSelectedIds([]); 
      setLoading(false);
    }
  };

  const handleAddDate = () => {
    if (!tempDate) return;
    if (!dates.includes(tempDate)) setDates([...dates, tempDate]);
    setTempDate('');
  };

  const removeDate = (d: string) => setDates(dates.filter(date => date !== d));

  const addBulkSlots = async () => {
    if (!selectedTutor || dates.length === 0 || !startTime || !endTime) return alert("กรอกข้อมูลให้ครบก่อนนะครับ");
    
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    if (startHour >= endHour) return alert("เวลาเริ่มต้องน้อยกว่าเวลาจบ");

    const newSlots: any[] = [];
    dates.forEach(dateStr => {
      for (let hour = startHour; hour < endHour; hour++) {
        const startDateTime = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00`).toISOString();
        newSlots.push({ tutor_id: selectedTutor, start_time: startDateTime, is_booked: false, location_type: locationType });
      }
    });

    const { error } = await supabase.from('slots').insert(newSlots);
    if (!error) { 
      fetchInitialData(); 
      setDates([]); 
      alert(`✅ เพิ่มคิวสำเร็จทั้งหมด ${newSlots.length} คิว!`); 
    } else {
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const toggleSelectAll = () => {
    const availableSlots = slots.filter(s => !s.is_booked); 
    if (selectedIds.length === availableSlots.length && availableSlots.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(availableSlots.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string, isBooked: boolean) => {
    if (isBooked) return alert("ไม่สามารถลบคิวที่มีนักเรียนจองแล้วได้ครับ");
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`⚠️ ยืนยันลบ ${selectedIds.length} รายการที่เลือก?\n(คิวที่ถูกลบจะไม่สามารถกู้คืนได้)`)) return;
    
    const { error } = await supabase.from('slots').delete().in('id', selectedIds);
    if (!error) { 
      fetchInitialData(); 
      alert("✅ ลบเรียบร้อยครับ!"); 
    } else {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-gray-900">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link href={isAdmin ? "/admin" : "/tutor"} className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-3 hover:text-blue-700 transition-all w-max">
            <ArrowLeft size={16} /> กลับหน้าหลัก {isAdmin ? 'Admin' : 'Tutor'}
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none">จัดการคิวสอน (ตาราง)</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex-1 md:flex-none">
            <button className="bg-blue-600 text-white px-4 md:px-6 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 shadow-md text-xs w-full">
               <LayoutList size={16} /> ตาราง
            </button>
            <Link href="/admin/calendar-slots" className="text-gray-400 px-4 md:px-6 py-2.5 rounded-xl hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-black text-xs w-full">
               <CalendarIcon size={16} /> ปฏิทิน
            </Link>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-red-50 text-red-500 p-3.5 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-black shadow-sm shrink-0">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
        <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Clock className="text-blue-600" size={20}/> เปิดเวลาสอนล่วงหน้า</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3 flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ติวเตอร์</label>
            <select disabled={!isAdmin} className={`border-2 p-3 rounded-2xl text-sm font-bold outline-none transition-all ${!isAdmin ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white focus:border-blue-400'}`} value={selectedTutor} onChange={(e) => setSelectedTutor(e.target.value)}>
              {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-3 flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">รูปแบบ</label>
            <select className="border-2 p-3 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-400" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
              <option value="Online">Online</option><option value="Onsite">Onsite</option><option value="นอกสถานที่">นอกสถานที่</option>
            </select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">เริ่ม (น.)</label>
            <select className="border-2 p-3 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-400" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
              <option value="">เวลา</option>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ถึง (น.)</label>
            <select className="border-2 p-3 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-400" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
              <option value="">เวลา</option>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="md:col-span-12 flex flex-col gap-2 mt-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">เลือกวันที่ต้องการสอน (เพิ่มได้หลายวัน)</label>
             <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-gray-50 rounded-2xl p-1 border-2 border-gray-100 focus-within:border-blue-400 transition-colors w-max">
                  <input type="date" className="p-2 bg-transparent text-sm font-bold outline-none" value={tempDate} onChange={(e) => setTempDate(e.target.value)} />
                  <button onClick={handleAddDate} className="bg-blue-600 text-white px-4 rounded-xl font-black text-xs hover:bg-blue-700 transition-colors shadow-sm"><PlusCircle size={16}/></button>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {dates.length === 0 && <span className="text-xs text-gray-400 font-bold italic py-2">ยังไม่ได้เลือกวันที่...</span>}
                  {dates.map(d => (
                    <div key={d} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm">
                      {new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      <button onClick={() => removeDate(d)} className="text-blue-400 hover:text-red-500 transition-colors"><X size={14}/></button>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="md:col-span-12 mt-4">
             <button onClick={addBulkSlots} className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black hover:bg-blue-600 shadow-xl active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em]">
              {isAdmin ? `บันทึกคิวติวเตอร์ (${dates.length} วัน)` : `เปิดรับคิวสอน (${dates.length} วัน)`}
             </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-2 no-scrollbar">
            <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest border-r pr-3 mr-1 flex items-center gap-1 shrink-0"><Filter size={14}/> {isAdmin ? 'ติวเตอร์:' : 'โปรไฟล์:'}</span>
            {isAdmin && (
              <button onClick={() => setFilterTutor('all')} className={`px-5 py-2.5 rounded-[1rem] font-black text-xs whitespace-nowrap transition-all ${filterTutor === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>ทั้งหมด</button>
            )}
            {tutors.map(t => (
              <button 
                key={t.id} 
                onClick={() => isAdmin && setFilterTutor(t.id)} 
                className={`px-5 py-2.5 rounded-[1rem] font-black text-xs whitespace-nowrap transition-all ${filterTutor === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'} ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {t.name}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
             <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full sm:w-auto">
               <span className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">ตั้งแต่:</span>
               <input type="date" className="bg-transparent text-sm font-bold p-2 outline-none" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)}/>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ถึง:</span>
               <input type="date" className="bg-transparent text-sm font-bold p-2 outline-none" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)}/>
               {(filterStartDate || filterEndDate) && (
                 <button onClick={() => {setFilterStartDate(''); setFilterEndDate('');}} className="p-2 text-gray-400 hover:text-red-500"><X size={16}/></button>
               )}
             </div>

            {selectedIds.length > 0 && (
              <button onClick={deleteSelected} className="bg-red-50 text-red-600 px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto hover:bg-red-600 hover:text-white transition-colors active:scale-95 shrink-0">
                <Trash size={18} /> ลบ {selectedIds.length} คิว
              </button>
            )}
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="p-6 w-16 text-center">
                  <input type="checkbox" className="w-5 h-5 rounded-md border-gray-300 text-blue-600 cursor-pointer accent-blue-600" checked={slots.length > 0 && selectedIds.length === slots.filter(s=>!s.is_booked).length && slots.filter(s=>!s.is_booked).length > 0} onChange={toggleSelectAll} />
                </th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ติวเตอร์</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">วัน / เวลาที่สอน</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">สถานะ / รูปแบบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" size={48} /></td></tr>
              ) : slots.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center font-black text-gray-300 text-xl">ไม่มีคิวว่างในช่วงนี้</td></tr>
              ) : slots.map((slot) => {
                
                // ✨ ระบบคำนวณสถานะ (2-Step Verification)
                const hasLog = slot.teaching_logs && slot.teaching_logs.length > 0;
                const booking = slot.bookings && slot.bookings.length > 0 ? slot.bookings[0] : null;
                const isVerified = booking?.student_verified === true || booking?.status === 'VERIFIED' || booking?.is_completed === true;

                return (
                  <tr key={slot.id} className={`transition-all duration-200 ${selectedIds.includes(slot.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="p-6 text-center">
                      {!slot.is_booked ? (
                        <input type="checkbox" className="w-5 h-5 rounded-md border-gray-300 text-blue-600 cursor-pointer accent-blue-600" checked={selectedIds.includes(slot.id)} onChange={() => toggleSelectOne(slot.id, slot.is_booked)} />
                      ) : (
                        <div className="w-5 h-5 mx-auto flex items-center justify-center text-gray-300" title="คิวถูกจองแล้ว ไม่สามารถลบได้"><AlertCircle size={16}/></div>
                      )}
                    </td>
                    <td className="p-6">
                       <p className="font-black text-gray-900 text-lg leading-none">ครู{slot.tutors?.name}</p>
                    </td>
                    <td className="p-6">
                      <div className="font-black text-gray-800 text-sm mb-1">{new Date(slot.start_time).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      <div className="text-blue-600 font-black text-xl flex items-center gap-1.5"><Clock size={16}/> {new Date(slot.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
                    </td>
                    <td className="p-6 text-center space-y-2">
                       <div>
                          {/* ✨ แสดงสถานะตาม Logic ใหม่ */}
                          {hasLog && isVerified ? (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 shadow-sm">
                              <CheckCircle2 size={12}/> สมบูรณ์
                            </span>
                          ) : hasLog && !isVerified ? (
                            <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 shadow-sm">
                              <Clock size={12}/> รอนักเรียนยืนยัน
                            </span>
                          ) : slot.is_booked ? (
                            <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 shadow-sm">
                              <CheckCircle2 size={12}/> ถูกจองแล้ว
                            </span>
                          ) : (
                            <span className="bg-gray-50 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                              ว่าง
                            </span>
                          )}
                       </div>
                       <div>
                          <span className={`px-3 py-1 rounded-[1rem] text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1 ${
                            slot.location_type === 'Online' ? 'bg-blue-50 text-blue-600' : 
                            slot.location_type === 'Onsite' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {slot.location_type === 'นอกสถานที่' ? <MapPin size={10}/> : <Globe size={10}/>} {slot.location_type}
                          </span>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
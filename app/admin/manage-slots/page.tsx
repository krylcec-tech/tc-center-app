'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Calendar as CalendarIcon, LayoutList, Clock, 
  Globe, Loader2, Filter, Trash, MapPin, LogOut
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
  }, [filterTutor]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: currentUser, error: profileError } = await supabase
        .from('tutors')
        .select('id, name, role') 
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) console.error("Profile fetch error:", profileError);

      // ✨ ระบบคลีน Role เหมือนหน้า Login
      const rawRole = currentUser?.role || '';
      const dbRole = rawRole.replace(/'/g, "").trim().toLowerCase(); 

      const checkIsAdmin = dbRole === 'admin';
      setIsAdmin(checkIsAdmin);
      setCurrentTutorId(currentUser?.id || null);

      let tutorsQuery = supabase.from('tutors').select('id, name'); 
      
      if (!checkIsAdmin && currentUser) {
        tutorsQuery = tutorsQuery.eq('id', currentUser.id);
      }

      const { data: tutorsData, error: tutorsError } = await tutorsQuery;
      if (tutorsError) console.error("Tutors list error:", tutorsError);

      if (tutorsData && tutorsData.length > 0) {
        setTutors(tutorsData);
        
        const defaultTutorId = checkIsAdmin 
          ? (filterTutor === 'all' ? tutorsData[0].id : filterTutor) 
          : (currentUser?.id || tutorsData[0].id);
          
        setSelectedTutor(defaultTutorId || '');
        
        if (!checkIsAdmin) {
          setFilterTutor(currentUser?.id || tutorsData[0].id);
        }
      } else {
        setTutors([]);
      }

      let query = supabase.from('slots').select('*, tutors(name)').order('start_time', { ascending: false });
      
      if (!checkIsAdmin && currentUser) {
        query = query.eq('tutor_id', currentUser.id);
      } else if (checkIsAdmin && filterTutor !== 'all') {
        query = query.eq('tutor_id', filterTutor);
      }

      const { data: slotsData, error: slotsError } = await query;
      if (!slotsError && slotsData) setSlots(slotsData);
      
    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setSelectedIds([]); 
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('ยืนยันออกจากระบบใช่ไหมครับ?')) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const addBulkSlots = async () => {
    if (!selectedTutor || !date || !startTime || !endTime) return alert("กรอกข้อมูลให้ครบก่อนนะครับ");
    
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    if (startHour >= endHour) return alert("เวลาเริ่มต้องน้อยกว่าเวลาจบ");

    const newSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const startDateTime = new Date(`${date}T${hour.toString().padStart(2, '0')}:00`).toISOString();
      newSlots.push({ 
        tutor_id: selectedTutor, 
        start_time: startDateTime, 
        is_booked: false, 
        location_type: locationType 
      });
    }

    const { error } = await supabase.from('slots').insert(newSlots);
    if (!error) { 
      fetchInitialData(); 
      alert("เพิ่มคิวสำเร็จ!"); 
    } else {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === slots.length && slots.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(slots.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`ยืนยันลบ ${selectedIds.length} รายการที่เลือก?`)) return;
    const { error } = await supabase.from('slots').delete().in('id', selectedIds);
    if (!error) { 
      fetchInitialData(); 
      alert("ลบเรียบร้อยครับ!"); 
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex flex-col gap-1">
          {/* ✨ ปุ่มย้อนกลับที่ฉลาดขึ้น: เช็ค isAdmin เพื่อเลือก Link ปลายทาง */}
          <Link 
            href={isAdmin ? "/admin" : "/tutor"} 
            className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-2 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            กลับหน้าหลัก {isAdmin ? 'Admin' : 'Tutor'}
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">จัดการคิวว่าง</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-md text-sm">
               <LayoutList size={18} /> ตาราง
            </button>
            <Link href="/admin/calendar-slots" className="text-gray-500 px-6 py-2.5 rounded-xl hover:text-blue-600 transition-all flex items-center gap-2 font-black text-sm">
               <CalendarIcon size={18} /> ปฏิทิน
            </Link>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 p-2.5 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2 font-black">
            <LogOut size={22} />
            <span className="hidden md:inline pr-1">Logout</span>
          </button>
        </div>
      </div>

      {/* ... (ส่วนที่เหลือของโค้ดเหมือนเดิม) ... */}
      {/* Form Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-5 items-end">
          <div className="flex flex-col gap-2 col-span-2 md:col-span-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">ติวเตอร์</label>
            <select 
              disabled={!isAdmin} 
              className={`border-2 p-3.5 rounded-2xl text-base font-bold outline-none transition-all ${!isAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 focus:border-blue-400'}`} 
              value={selectedTutor} 
              onChange={(e) => setSelectedTutor(e.target.value)}
            >
              {loading ? (
                <option value="">กำลังโหลด...</option>
              ) : tutors.length > 0 ? (
                tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
              ) : (
                <option value="" disabled>ไม่พบข้อมูลติวเตอร์</option>
              )}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">วันที่</label>
            <input type="date" className="border-2 p-3.5 rounded-2xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">เริ่ม</label>
            <select className="border-2 p-3.5 rounded-2xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
               <option value="">เวลา</option>
               {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">ถึง</label>
            <select className="border-2 p-3.5 rounded-2xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
               <option value="">เวลา</option>
               {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">รูปแบบ</label>
            <select className="border-2 p-3.5 rounded-2xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
               <option value="Online">Online</option>
               <option value="Onsite">Onsite</option>
               <option value="นอกสถานที่">นอกสถานที่</option>
            </select>
          </div>
          <button onClick={addBulkSlots} className="bg-blue-600 text-white p-4 rounded-2xl font-black hover:bg-blue-700 shadow-lg active:scale-95 transition-all uppercase text-xs tracking-widest">
            {isAdmin ? 'เพิ่มคิวสอน' : 'เพิ่มคิวของฉัน'}
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2">
            <span className="text-gray-400 font-black text-xs uppercase tracking-widest border-r pr-3 mr-1 flex items-center gap-1"><Filter size={14}/> {isAdmin ? 'กรอง:' : 'โปรไฟล์:'}</span>
            {isAdmin && (
              <button onClick={() => setFilterTutor('all')} className={`px-5 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-all ${filterTutor === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 border'}`}>ทั้งหมด</button>
            )}
            {tutors.map(t => (
              <button 
                key={t.id} 
                onClick={() => isAdmin && setFilterTutor(t.id)} 
                className={`px-5 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-all ${filterTutor === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 border'} ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {t.name}
              </button>
            ))}
          </div>
          
          {selectedIds.length > 0 && (
            <button onClick={deleteSelected} className="bg-red-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl w-full md:w-auto justify-center hover:bg-red-700 transition-colors">
              <Trash size={18} /> ลบที่เลือก ({selectedIds.length})
            </button>
          )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b-2 border-gray-100">
            <tr>
              <th className="p-6 w-16 text-center">
                <input type="checkbox" className="w-7 h-7 rounded-lg border-gray-300 text-blue-600 cursor-pointer" checked={slots.length > 0 && selectedIds.length === slots.length} onChange={toggleSelectAll} />
              </th>
              <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">ติวเตอร์</th>
              <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">วัน / เวลาที่สอน</th>
              <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest text-center">รูปแบบ</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" size={48} /></td></tr>
            ) : slots.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center font-bold text-gray-400 text-lg">ไม่พบข้อมูลคิวว่าง</td></tr>
            ) : slots.map((slot) => (
              <tr key={slot.id} className={`transition-all ${selectedIds.includes(slot.id) ? 'bg-blue-50/70' : 'hover:bg-gray-50'}`}>
                <td className="p-6 text-center">
                  <input type="checkbox" className="w-7 h-7 rounded-lg border-gray-300 text-blue-600 cursor-pointer" checked={selectedIds.includes(slot.id)} onChange={() => toggleSelectOne(slot.id)} />
                </td>
                <td className="p-6 font-black text-gray-800 text-xl">{slot.tutors?.name}</td>
                <td className="p-6">
                  <div className="font-black text-gray-700 text-lg mb-1">{new Date(slot.start_time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</div>
                  <div className="text-blue-600 font-black text-xl flex items-center gap-1"><Clock size={18}/> {new Date(slot.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
                </td>
                <td className="p-6 text-center">
                   <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase inline-flex items-center gap-2 ${
                     slot.location_type === 'Online' ? 'bg-green-100 text-green-700' : 
                     slot.location_type === 'Onsite' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                   }`}>
                     {slot.location_type === 'นอกสถานที่' ? <MapPin size={10}/> : <Globe size={10}/>}
                     {slot.location_type}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
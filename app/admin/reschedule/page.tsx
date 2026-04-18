'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, ArrowLeft, Calendar, Clock, RefreshCw, Loader2, 
  AlertCircle, CheckCircle2, User, Filter, X, Trash2, ShieldCheck, Save, Mail
} from 'lucide-react';
import Link from 'next/link';

export default function AdminReschedulePage() {
  const [loading, setLoading] = useState(true);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [tutorsList, setTutorsList] = useState<any[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterTutor, setFilterTutor] = useState('');
  
  // State สำหรับ Modal ย้ายเวลา
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: tutors } = await supabase.from('tutors').select('id, name').order('name');
      setTutorsList(tutors || []);
      await fetchActiveBookings();
    } catch (err: any) {
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveBookings = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          id, status, is_completed, student_id, tutor_id,
          slots!inner ( id, start_time, end_time, location_type ),
          tutors!inner ( id, name )
        `)
        .eq('is_completed', false)
        .order('slots(start_time)', { ascending: true });

      if (error) throw error;

      // ✨ ดึง student_name และ email จาก student_wallets
      const { data: walletsData } = await supabase.from('student_wallets').select('user_id, student_name, email');
      const walletMap = new Map(walletsData?.map(w => [w.user_id, w]) || []);

      const formatted = (bookingsData || []).map((item: any) => {
        const walletInfo = walletMap.get(item.student_id);
        return {
          ...item,
          student_name: walletInfo?.student_name || 'ไม่ระบุชื่อ',
          student_email: walletInfo?.email || 'ไม่มีข้อมูล Email', // ✨ เก็บ Email ไว้แสดงผล
        }
      });

      setActiveBookings(formatted);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    }
  };

  const checkOverlap = async (tutorId: string, checkStart: Date, checkEnd: Date, currentBookingId: string) => {
    const { data: activeBooks } = await supabase
      .from('bookings')
      .select(`id, student_id, slots!inner(start_time, end_time)`)
      .eq('tutor_id', tutorId)
      .eq('is_completed', false)
      .neq('id', currentBookingId);

    if (!activeBooks) return null;

    for (let b of (activeBooks as any[])) {
      const slotStart = new Date(b.slots.start_time).getTime();
      const slotEnd = new Date(b.slots.end_time).getTime();
      const newS = checkStart.getTime();
      const newE = checkEnd.getTime();

      if (newS < slotEnd && newE > slotStart) {
        const { data: wallet } = await supabase.from('student_wallets').select('student_name').eq('user_id', b.student_id).maybeSingle();
        return wallet?.student_name || 'นักเรียนท่านอื่น';
      }
    }
    return null;
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !newDate || !newStartTime || !newEndTime) return alert("กรุณากรอกข้อมูลให้ครบ");

    const startDateObj = new Date(`${newDate}T${newStartTime}:00`);
    const endDateObj = new Date(`${newDate}T${newEndTime}:00`);

    if (endDateObj <= startDateObj) return alert("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้นครับ");

    setSaving(true);
    try {
      const overlapStudent = await checkOverlap(selectedBooking.tutor_id, startDateObj, endDateObj, selectedBooking.id);
      if (overlapStudent) {
        setSaving(false);
        return alert(`⚠️ ชนคิว! ช่วงเวลานี้ "น้อง${overlapStudent}" ได้จองครู${selectedBooking.tutors.name} ไว้แล้วในช่วงนี้`);
      }

      const { error } = await supabase.from('slots').update({ 
        start_time: startDateObj.toISOString(),
        end_time: endDateObj.toISOString()
      }).eq('id', selectedBooking.slots.id);

      if (error) throw error;
      alert("ย้ายเวลาสำเร็จ!");
      setSelectedBooking(null);
      fetchActiveBookings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelLesson = async (bookingId: string, studentName: string) => {
    if (!confirm(`ยืนยันยกเลิกคลาสของ น้อง${studentName}?`)) return;
    try {
      await supabase.from('bookings').update({ status: 'CANCELLED', is_completed: true }).eq('id', bookingId);
      alert("ยกเลิกสำเร็จ");
      fetchActiveBookings();
    } catch (err: any) { alert(err.message); }
  };

  const filteredBookings = useMemo(() => {
    return activeBookings.filter(b => {
      const matchSearch = b.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.student_email.toLowerCase().includes(searchTerm.toLowerCase()) || // ✨ กรองด้วย Email ได้ด้วย
                          b.tutors.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = filterDate ? new Date(b.slots.start_time).toISOString().split('T')[0] === filterDate : true;
      const matchTutor = filterTutor ? b.tutor_id === filterTutor : true;
      return matchSearch && matchDate && matchTutor;
    });
  }, [activeBookings, searchTerm, filterDate, filterTutor]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 text-gray-900 font-sans text-left">
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="text-left">
            <Link href="/admin" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4 hover:text-blue-600 w-max transition-colors text-left"><ArrowLeft size={14}/> Back</Link>
            <h1 className="text-4xl font-black flex items-center gap-3 text-left"><RefreshCw className="text-orange-500" /> จัดการเวลาเรียน</h1>
          </div>
        </header>

        {/* Filter Section */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center text-left">
          <div className="flex-1 min-w-[200px] relative text-left">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <select className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-orange-400 outline-none appearance-none cursor-pointer" value={filterTutor} onChange={(e) => setFilterTutor(e.target.value)}>
              <option value="">เลือกติวเตอร์...</option>
              {tutorsList.map(t => <option key={t.id} value={t.id}>ครู{t.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px] relative text-left">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input type="date" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-orange-400 outline-none" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}/>
          </div>
          <div className="flex-1 min-w-[200px] relative text-left">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input type="text" placeholder="ค้นหาชื่อ / Email..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-orange-400 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          </div>
          {(filterDate || filterTutor || searchTerm) && <button onClick={() => {setFilterDate(''); setFilterTutor(''); setSearchTerm('');}} className="p-3 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-200"><X size={20}/></button>}
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden text-left">
          <div className="overflow-x-auto p-4 md:p-6">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-left">
                  <th className="px-6 text-left">ติวเตอร์</th><th className="px-6 text-left">นักเรียน</th><th className="px-6 text-left">วันเวลาเดิม (24 ชม.)</th><th className="px-6 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="text-left">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="bg-gray-50/50 hover:bg-orange-50/30 transition-colors group">
                    <td className="px-6 py-4 rounded-l-2xl font-black text-blue-700 text-left">ครู{b.tutors.name}</td>
                    <td className="px-6 py-4 font-black text-left">
                      <p className="text-gray-900">น้อง{b.student_name}</p>
                      {/* ✨ แสดง Gmail นักเรียน */}
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><Mail size={10}/> {b.student_email}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500 text-left">
                      {new Date(b.slots.start_time).toLocaleString('th-TH', { 
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                        hour12: false,
                        hourCycle: 'h23'
                      })} น.
                    </td>
                    <td className="px-6 py-4 text-right rounded-r-2xl flex justify-end gap-2 text-right">
                      <button onClick={() => handleCancelLesson(b.id, b.student_name)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                      <button onClick={() => {
                        setSelectedBooking(b);
                        const d = new Date(b.slots.start_time);
                        const ed = new Date(b.slots.end_time);
                        const toLocalDateString = (date: Date) => {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        };
                        const toLocalTimeString = (date: Date) => {
                          const hours = String(date.getHours()).padStart(2, '0');
                          const mins = String(date.getMinutes()).padStart(2, '0');
                          return `${hours}:${mins}`;
                        };
                        setNewDate(toLocalDateString(d));
                        setNewStartTime(toLocalTimeString(d));
                        setNewEndTime(toLocalTimeString(ed));
                      }} className="bg-white border border-orange-200 text-orange-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-orange-500 hover:text-white transition-all">ย้ายเวลา</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 text-left">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-gray-800 text-left"><Calendar className="text-orange-500"/> แก้ไขเวลาเรียน</h3>
            <form onSubmit={handleReschedule} className="space-y-4 text-left">
              <div className="text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block text-left">วันที่เรียน</label>
                <input required type="date" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-400 font-bold" value={newDate} onChange={(e) => setNewDate(e.target.value)}/>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-left">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block text-left">เริ่มเวลา (24 ชม.)</label>
                  <input required type="time" step="60" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-400 font-bold" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)}/>
                </div>
                <div className="text-left">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block text-left">สิ้นสุดเวลา (24 ชม.)</label>
                  <input required type="time" step="60" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-400 font-bold" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)}/>
                </div>
              </div>
              <div className="flex gap-3 pt-4 text-left">
                <button type="button" onClick={() => setSelectedBooking(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">ยกเลิก</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-200 flex justify-center items-center gap-2">
                  {saving ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>} บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
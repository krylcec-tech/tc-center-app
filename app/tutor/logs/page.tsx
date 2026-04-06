'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Clock, Loader2, 
  CheckCircle, Edit3, Save, X, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

export default function TeachingLogsPage() {
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tutorInfo, setTutorInfo] = useState<any>(null);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [tutorNote, setTutorNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tutor } = await supabase.from('tutors').select('id, name').eq('user_id', user.id).maybeSingle();
      if (!tutor) return;
      setTutorInfo(tutor);

      // 1. ดึงคิวที่ "รอดำเนินการ"
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id, status, is_completed, student_id,
          slots!inner ( id, start_time, teaching_logs ( id ) )
        `)
        .eq('tutor_id', tutor.id)
        .order('id', { ascending: false });

      // ดึงชื่อนักเรียนมาแมป
      const { data: studentsData } = await supabase.from('student_wallets').select('user_id, student_name');
      const studentMap = new Map(studentsData?.map(s => [s.user_id, s.student_name]) || []);

      const pending: any[] = [];
      
      // ✨ เพิ่ม (b: any) ตรงนี้เพื่อปลดล็อก Error ของ TypeScript
      (bookingsData || []).forEach((b: any) => {
        const slot = b.slots;
        const hasLog = slot?.teaching_logs && slot.teaching_logs.length > 0;
        const isVerified = b.status === 'VERIFIED' || b.is_completed === true;
        
        if (!hasLog && !isVerified) {
          pending.push({
            ...b,
            student_name: studentMap.get(b.student_id) || 'ไม่ระบุชื่อ',
            start_time: slot.start_time
          });
        }
      });
      setPendingBookings(pending.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));

      // 2. ดึงประวัติที่สอนเสร็จแล้ว
      const { data: history } = await supabase
        .from('teaching_logs')
        .select('*, slots(start_time)')
        .eq('tutor_id', tutor.id)
        .order('teaching_date', { ascending: false });

      setLogs(history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTeaching = async (booking: any) => {
    if (!tutorNote) return alert("กรุณากรอกสรุปการสอนสั้นๆ ก่อนยืนยันครับ");
    setIsSaving(true);
    try {
      const { error } = await supabase.from('teaching_logs').insert({
        tutor_id: tutorInfo.id, 
        slot_id: booking.slots.id,
        student_name: booking.student_name, 
        subject: 'วิชาสอน', 
        duration_hours: 1,
        teaching_date: new Date(booking.start_time).toISOString().split('T')[0],
        notes: tutorNote
      });

      if (error) throw error;
      alert("✅ บันทึกและส่งรายงานสำเร็จ!");
      setTutorNote("");
      setConfirmingId(null);
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsSaving(false); }
  };

  const handleUpdateTeachingLog = async (logId: string) => {
    if (!tutorNote) return alert("ข้อความสรุปการสอนห้ามว่างเปล่าครับ");
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('teaching_logs')
        .update({ notes: tutorNote })
        .eq('id', logId);

      if (error) throw error;
      alert("✅ แก้ไขรายงานสำเร็จ!");
      setEditingLogId(null);
      setTutorNote("");
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsSaving(false); }
  };

  const copyToClipboard = (log: any) => {
    const textToCopy = `📝 รายงานการสอนจาก TC Center\n👩‍🏫 ติวเตอร์: ครู${tutorInfo?.name}\n👤 นักเรียน: น้อง${log.student_name}\n📅 วันที่: ${new Date(log.teaching_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}\n\n✅ สรุปการเรียนวันนี้:\n${log.notes}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert("คัดลอกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-gray-900">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <Link href="/tutor" className="text-blue-600 font-black text-sm uppercase mb-2 flex items-center gap-2 group transition-all w-max">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าหลัก
          </Link>
          <h1 className="text-4xl font-black tracking-tight">Teaching & Check-in</h1>
          <p className="text-gray-500 font-bold">ยืนยันคิวสอนและบันทึกรายงานส่งผู้ปกครอง</p>
        </div>
      </div>

      {/* 🟠 ส่วนที่ 1: รายการรอเช็คอิน */}
      <section className="mb-12">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-orange-600"><Clock size={20} /> คิวที่ต้องส่งรายงาน</h2>
        <div className="grid gap-4">
          {pendingBookings.map((booking: any) => (
            <div key={booking.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-orange-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-black text-lg">น้อง{booking.student_name}</p>
                  <p className="text-xs text-blue-600 font-bold mt-1">
                    สอนเมื่อ: {new Date(booking.start_time).toLocaleDateString('th-TH')} • {new Date(booking.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                  </p>
                </div>
                <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">รอส่งรายงาน</span>
              </div>

              {confirmingId === booking.id ? (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <textarea 
                    className="w-full p-4 rounded-2xl border-2 border-blue-200 focus:border-blue-500 outline-none font-medium h-24 text-sm" 
                    placeholder="สรุปบทเรียนวันนี้และฟีดแบ็กน้อง..." 
                    value={tutorNote} 
                    onChange={(e) => setTutorNote(e.target.value)} 
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleConfirmTeaching(booking)} disabled={isSaving} className="flex-1 bg-green-600 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
                      {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} ส่งรายงาน
                    </button>
                    <button onClick={() => {setConfirmingId(null); setTutorNote("");}} className="px-6 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200">ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => {setConfirmingId(booking.id); setTutorNote(""); setEditingLogId(null);}} className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <Edit3 size={16}/> เขียนรายงานการสอน
                </button>
              )}
            </div>
          ))}
          {pendingBookings.length === 0 && <p className="text-gray-400 font-bold italic py-12 text-center bg-white rounded-[3rem] border border-dashed shadow-sm">คุณส่งรายงานครบหมดแล้วครับ เก่งมาก! 🎉</p>}
        </div>
      </section>

      {/* 🟢 ส่วนที่ 2: ประวัติที่สอนเสร็จแล้ว */}
      <section>
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-green-600"><CheckCircle size={20} /> ประวัติการสอน & รายงาน</h2>
        <div className="grid gap-4">
          {logs.map((log: any) => (
            <div key={log.id} className={`bg-white p-6 md:p-8 rounded-[2.5rem] border shadow-sm transition-all duration-300 ${editingLogId === log.id ? 'border-blue-200 ring-4 ring-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
              
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-[1.2rem] flex items-center justify-center font-black shadow-inner">1h</div>
                  <div>
                    <p className="font-black text-gray-900 text-lg leading-tight">น้อง{log.student_name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      สอนเมื่อ: {new Date(log.teaching_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* ปุ่มจัดการ */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => copyToClipboard(log)} 
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-[1rem] font-black text-xs transition-all active:scale-95 ${copiedId === log.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {copiedId === log.id ? <><Check size={14}/> คัดลอกแล้ว</> : <><Copy size={14}/> คัดลอกส่ง LINE</>}
                  </button>
                  <button 
                    onClick={() => {
                      if (editingLogId === log.id) {
                        setEditingLogId(null);
                        setTutorNote("");
                      } else {
                        setEditingLogId(log.id);
                        setTutorNote(log.notes);
                        setConfirmingId(null);
                      }
                    }} 
                    className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-[1rem] transition-all"
                    title="แก้ไขรายงาน"
                  >
                    {editingLogId === log.id ? <X size={18}/> : <Edit3 size={18}/>}
                  </button>
                </div>
              </div>

              {editingLogId === log.id ? (
                <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                  <textarea 
                    className="w-full p-4 rounded-2xl border-2 border-blue-200 focus:border-blue-500 outline-none font-medium h-32 text-sm bg-blue-50/30" 
                    value={tutorNote} 
                    onChange={(e) => setTutorNote(e.target.value)} 
                  />
                  <div className="flex justify-end">
                    <button onClick={() => handleUpdateTeachingLog(log.id)} disabled={isSaving} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-blue-700 active:scale-95">
                      {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} บันทึกการแก้ไข
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/80 p-5 rounded-2xl mt-2">
                  <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">"{log.notes}"</p>
                </div>
              )}

            </div>
          ))}
          {logs.length === 0 && <p className="text-gray-400 font-bold italic py-10 text-center">ยังไม่มีประวัติการสอน</p>}
        </div>
      </section>

    </div>
  );
}
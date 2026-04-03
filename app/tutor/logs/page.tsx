'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Clock, BookOpen, Loader2, Calendar as CalendarIcon, 
  User, CheckCircle, ChevronRight, TrendingUp, Edit3, Save, X, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

export default function TeachingLogsPage() {
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [tutorNote, setTutorNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tutor } = await supabase.from('tutors').select('id').eq('user_id', user.id).maybeSingle();
    if (!tutor) return;

    // 1. ดึงคิวจองที่ "ยังไม่ได้เช็คอิน" (is_completed: false)
    const { data: pending } = await supabase
      .from('bookings')
      .select(`*, student_wallets:student_id (student_name)`)
      .eq('tutor_id', tutor.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false });

    // 2. ดึงประวัติที่สอนเสร็จแล้ว (Teaching Logs)
    const { data: history } = await supabase
      .from('teaching_logs')
      .select('*')
      .eq('tutor_id', tutor.id)
      .order('teaching_date', { ascending: false });

    setPendingBookings(pending || []);
    setLogs(history || []);
    setLoading(false);
  };

  const handleConfirmTeaching = async (booking: any) => {
    if (!tutorNote) return alert("กรุณากรอกสรุปการสอนสั้นๆ ก่อนยืนยันครับ");
    
    setIsSaving(true);
    try {
      // เรียก RPC ที่เราสร้างไว้ใน SQL (หักชม.ไปแล้วตอนจอง ตรงนี้แค่ยืนยันและสร้าง Log)
      const { error } = await supabase.rpc('confirm_teaching_session', {
        booking_id: booking.id,
        tutor_notes: tutorNote
      });

      if (error) throw error;

      alert("✅ ยืนยันการสอนสำเร็จ!");
      setTutorNote("");
      setConfirmingId(null);
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-gray-900">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <Link href="/tutor" className="text-blue-600 font-black text-sm uppercase mb-2 flex items-center gap-2 group transition-all">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าหลัก
          </Link>
          <h1 className="text-4xl font-black tracking-tight">Teaching & Check-in</h1>
          <p className="text-gray-500 font-bold">ยืนยันคิวสอนและบันทึกรายงาน</p>
        </div>
      </div>

      {/* 🟠 ส่วนที่ 1: รายการรอเช็คอิน (ที่นักเรียนจองมา) */}
      <section className="mb-12">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-orange-600"><Clock size={20} /> คิวที่ต้องสอนวันนี้</h2>
        <div className="grid gap-4">
          {pendingBookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-orange-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-black text-lg">น้อง{booking.student_wallets?.student_name}</p>
                  <p className="text-sm text-gray-500 italic">"โน้ตจากนักเรียน: {booking.student_note || '-'}"</p>
                </div>
                <span className="bg-orange-50 text-orange-600 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase">1 HOUR</span>
              </div>

              {confirmingId === booking.id ? (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <textarea className="w-full p-4 rounded-2xl border-2 border-blue-200 focus:border-blue-500 outline-none font-medium h-24" placeholder="สรุปบทเรียนวันนี้และฟีดแบ็กน้อง..." value={tutorNote} onChange={(e) => setTutorNote(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => handleConfirmTeaching(booking)} disabled={isSaving} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black">ส่งรายงานและยืนยัน</button>
                    <button onClick={() => setConfirmingId(null)} className="px-6 bg-gray-100 rounded-2xl font-bold">ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmingId(booking.id)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all">สอนจบแล้ว - กดยืนยันเช็คอิน</button>
              )}
            </div>
          ))}
          {pendingBookings.length === 0 && <p className="text-gray-400 italic py-10 text-center bg-white rounded-3xl border border-dashed">ไม่มีคิวที่ต้องสอนในขณะนี้</p>}
        </div>
      </section>

      {/* 🟢 ส่วนที่ 2: ประวัติที่สอนเสร็จแล้ว */}
      <section>
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-green-600"><CheckCircle size={20} /> ประวัติการสอนสำเร็จ</h2>
        <div className="grid gap-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm opacity-80 flex justify-between items-center group hover:opacity-100 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center font-black">1h</div>
                <div>
                  <p className="font-black text-gray-900">{log.student_name}</p>
                  <p className="text-xs text-gray-400">{new Date(log.teaching_date).toLocaleDateString('th-TH')}</p>
                  <p className="text-sm text-gray-600 mt-1 italic font-medium">"{log.notes}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
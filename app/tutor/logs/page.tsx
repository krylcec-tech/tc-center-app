'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Clock, BookOpen, Loader2, Calendar as CalendarIcon, 
  User, CheckCircle, ChevronRight, TrendingUp, Edit3, Save, X, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

export default function TeachingLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);

  // ✨ State สำหรับการแก้ไข
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: tutor } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (tutor) {
        const { data, error } = await supabase
          .from('teaching_logs')
          .select('*')
          .eq('tutor_id', tutor.id)
          .order('teaching_date', { ascending: false });

        if (!error && data) {
          setLogs(data);
          const hours = data.reduce((sum, item) => sum + Number(item.duration_hours), 0);
          setTotalHours(hours);
        }
      }
    }
    setLoading(false);
  };

  // ✨ ฟังก์ชันจัดการการแก้ไข
  const startEditing = (log: any) => {
    setEditingId(log.id);
    setEditNote(log.notes || "");
  };

  const handleUpdate = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase
      .from('teaching_logs')
      .update({ notes: editNote })
      .eq('id', id);

    if (!error) {
      setLogs(logs.map(log => log.id === id ? { ...log, notes: editNote } : log));
      setEditingId(null);
    } else {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
    setIsSaving(false);
  };

  // ✨ ฟังก์ชันคัดลอกข้อความไปส่ง LINE
  const copyToClipboard = (log: any) => {
    const dateStr = new Date(log.teaching_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const text = `📊 รายงานการสอน [TC Center]\n📅 วันที่: ${dateStr}\n👤 นักเรียน: ${log.student_name}\n📚 วิชา: ${log.subject || 'วิชาสอน'}\n⏰ เวลา: ${log.duration_hours} ชม.\n📝 สรุปการเรียน: ${log.notes || '-'}`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto bg-[#F8FAFC] min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <Link href="/tutor" className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-2 group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            กลับหน้าหลัก Dashboard
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Teaching Logs</h1>
          <p className="text-gray-500 font-bold">ประวัติการสอนและรายงานถึงผู้ปกครอง</p>
        </div>

        <div className="bg-white px-8 py-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:scale-105">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ชั่วโมงสอนทั้งหมด</p>
            <h3 className="text-3xl font-black text-gray-900">{totalHours} <span className="text-sm text-gray-400">ชม.</span></h3>
          </div>
        </div>
      </div>

      {/* Logs List Section */}
      <div className="grid grid-cols-1 gap-6">
        {logs.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200 shadow-inner">
            <Clock className="mx-auto text-gray-200 mb-6" size={80} />
            <p className="text-gray-500 font-black text-2xl">ยังไม่มีประวัติการสอน</p>
            <Link href="/admin/calendar-slots" className="inline-block mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
              ไปหน้าปฏิทินเพื่อบันทึกการสอน
            </Link>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-6 hover:shadow-xl transition-all group">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        {log.subject || 'วิชาสอน'}
                      </span>
                      <span className="text-gray-400 text-xs font-bold flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                        <CalendarIcon size={12} /> 
                        {new Date(log.teaching_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                      <User size={20} className="text-gray-400" />
                      {log.student_name}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ระยะเวลาสอน</p>
                  <p className="text-3xl font-black text-blue-600">{log.duration_hours} <span className="text-sm font-bold">ชม.</span></p>
                </div>
              </div>

              {/* ✨ รายงานการสอน (Edit & Copy Mode) */}
              <div className="relative p-6 bg-gray-50 rounded-[2rem] border-2 border-gray-100 group-hover:border-blue-100 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <Edit3 size={14} /> รายงานผลการสอนสำหรับผู้ปกครอง
                  </p>
                  <div className="flex gap-2">
                    {/* ปุ่มคัดลอกไปส่ง LINE */}
                    <button 
                      onClick={() => copyToClipboard(log)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copiedId === log.id ? 'bg-green-500 text-white shadow-green-100' : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                      {copiedId === log.id ? <><Check size={14} /> คัดลอกแล้ว</> : <><Copy size={14} /> ก๊อปปี้ส่ง LINE</>}
                    </button>

                    {/* ปุ่มจัดการแก้ไข */}
                    {editingId !== log.id ? (
                      <button 
                        onClick={() => startEditing(log)}
                        className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 rounded-xl transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={18} /></button>
                        <button onClick={() => handleUpdate(log.id)} disabled={isSaving} className="p-1.5 bg-white border border-green-100 text-green-600 hover:bg-green-50 rounded-xl transition-all">
                          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingId === log.id ? (
                  <textarea 
                    className="w-full p-4 rounded-2xl border-2 border-blue-200 outline-none focus:border-blue-400 font-medium text-gray-700 h-32 transition-all bg-white"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="วันนี้เรียนเรื่องอะไร น้องเป็นอย่างไรบ้าง..."
                  />
                ) : (
                  <p className="text-gray-600 font-medium leading-relaxed italic">
                    {log.notes ? `"${log.notes}"` : "ไม่ได้ระบุรายละเอียดรายงาน"}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
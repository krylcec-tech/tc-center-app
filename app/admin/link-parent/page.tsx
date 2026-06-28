'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, Link as LinkIcon, Loader2, CheckCircle2, Trash2 } from 'lucide-react';

export default function LinkParentPage() {
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. ดึงผู้ปกครอง
      const { data: parentData } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('role', 'parent');
      setParents(parentData || []);

      // 2. ดึงนักเรียน
      const { data: studentData } = await supabase
        .from('student_wallets')
        .select('user_id, student_name');
      setStudents(studentData || []);

      // 3. ดึงข้อมูลที่ผูกไว้แล้ว
      const { data: linkData } = await supabase
        .from('parent_student_links')
        .select(`
          id,
          parent_id,
          student_id
        `);
      setLinks(linkData || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent || !selectedStudent) return alert('กรุณาเลือกทั้งผู้ปกครองและนักเรียน');
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('parent_student_links')
        .insert([{
          parent_id: selectedParent,
          student_id: selectedStudent
        }]);

      if (error) {
        if (error.code === '23505' || error.message.includes('unique')) {
          throw new Error('บัญชีนี้ถูกผูกกันไว้แล้วครับ!');
        }
        throw error;
      }

      alert('ผูกบัญชีสำเร็จ! 🎉');
      setSelectedParent('');
      setSelectedStudent('');
      fetchData();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (linkId: string) => {
    if (!confirm('ยืนยันการยกเลิกการผูกบัญชี?')) return;
    
    try {
      const { error } = await supabase.from('parent_student_links').delete().eq('id', linkId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Helper ฟังก์ชันหาชื่อ
  const getParentName = (id: string) => parents.find(p => p.id === id)?.full_name || 'ไม่ทราบชื่อ';
  const getStudentName = (id: string) => students.find(s => s.user_id === id)?.student_name || 'ไม่ทราบชื่อ';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-bold text-sm">
            <ArrowLeft size={16} /> กลับหน้าหลักแอดมิน
          </Link>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Users className="text-orange-500" size={32} />
            จัดการบัญชีผู้ปกครอง
          </h1>
          <p className="text-slate-500 font-bold mt-1">ผูกบัญชีผู้ปกครองเข้ากับนักเรียน (เพื่อให้ผู้ปกครองดูข้อมูลลูกได้)</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* กล่องทำรายการผูกบัญชี */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="font-black text-xl mb-6 flex items-center gap-2 text-slate-800">
              <LinkIcon size={20} className="text-blue-500"/> จับคู่บัญชี
            </h2>

            <form onSubmit={handleLink} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">1. เลือกผู้ปกครอง</label>
                <select 
                  required
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="">-- ระบุผู้ปกครอง --</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} {p.phone ? `(${p.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">2. เลือกลูก / นักเรียน</label>
                <select 
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-orange-400"
                >
                  <option value="">-- ระบุนักเรียน --</option>
                  {students.map(s => (
                    <option key={s.user_id} value={s.user_id}>น้อง{s.student_name}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-gray-900 hover:bg-blue-600 text-white font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 mt-4 disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                ยืนยันการผูกบัญชี
              </button>
            </form>
          </div>

          {/* รายการที่ผูกไว้แล้ว */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="font-black text-xl mb-6 flex items-center gap-2 text-slate-800">
              <CheckCircle2 size={20} className="text-emerald-500"/> รายการที่จับคู่แล้ว
            </h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {links.length > 0 ? links.map(link => (
                <div key={link.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group">
                  <div>
                    <p className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400"/> {getParentName(link.parent_id)}
                    </p>
                    <p className="font-bold text-xs text-orange-600 flex items-center gap-1.5 mt-1">
                      <ArrowLeft size={12} className="rotate-180"/> น้อง{getStudentName(link.student_id)}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleUnlink(link.id)}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                    title="ยกเลิกการผูก"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              )) : (
                <p className="text-center py-10 text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border border-dashed">ยังไม่มีรายการผูกบัญชี</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ShieldCheck, Users, Search, Trash2, Loader2, ArrowLeft, Mail, Phone, FileText, ExternalLink, Clock, XCircle
} from 'lucide-react';

export default function SuperAdminUsers() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingTutors, setPendingTutors] = useState<any[]>([]);
  const [approvedTutors, setApprovedTutors] = useState<any[]>([]);
  const [rejectedTutors, setRejectedTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ฟังก์ชันช่วยคำนวณหาระยะเวลาที่สมัครเข้ามา
  const getRelativeTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'ไม่ระบุเวลา';
    try {
      const date = new Date(dateTimeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'เมื่อสักครู่นี้';
      if (diffMins < 60) return `เมื่อ ${diffMins} นาทีที่แล้ว`;
      if (diffHours < 24) return `เมื่อ ${diffHours} ชั่วโมงที่แล้ว`;
      if (diffDays < 7) return `เมื่อ ${diffDays} วันที่แล้ว`;
      
      return `${date.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })} น.`;
    } catch (e) {
      return 'ไม่ทราบเวลา';
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profError } = await supabase.from('profiles').select('id, email, full_name, role');
      if (profError) throw profError;

      const { data: wallets } = await supabase.from('student_wallets').select('*');
      const { data: tutors } = await supabase.from('tutors').select('*');

      const formatted = (profiles || []).map((p: any) => {
        const wallet = wallets?.find(w => w.user_id === p.id);
        const tutorInfo = tutors?.find(t => t.id === p.id || t.user_id === p.id); 

        let rawRole = p.role || tutorInfo?.role || 'student';
        let cleanRole = rawRole.replace(/['"]/g, '').toLowerCase();

        return {
          id: p.id,
          email: p.email || 'No Email',
          name: wallet?.student_name || p.full_name || 'N/A',
          role: cleanRole, 
          tier1_online: wallet?.tier1_online_balance || 0,
          tier1_onsite: wallet?.tier1_onsite_balance || 0,
          tier2_online: wallet?.tier2_online_balance || 0,
          tier2_onsite: wallet?.tier2_onsite_balance || 0,
          tier3_online: wallet?.tier3_online_balance || 0,
          tier3_onsite: wallet?.tier3_onsite_balance || 0,
        };
      });

      setAllUsers(formatted);

      // จัดแบ่งกลุ่มของติวเตอร์ตาม Tags เพื่อแยกแต่ละแท็บ
      const pending = tutors?.filter(t => t.tags && t.tags.includes('รอการอนุมัติ')) || [];
      const approved = tutors?.filter(t => t.tags && (t.tags.includes('ติวเตอร์ใหม่') || t.tags.includes('เปลี่ยนสถานะโดยแอดมิน') || (!t.tags.includes('รอการอนุมัติ') && !t.tags.includes('ไม่อนุมัติ')))) || [];
      const rejected = tutors?.filter(t => t.tags && t.tags.includes('ไม่อนุมัติ')) || [];

      setPendingTutors(pending);
      setApprovedTutors(approved);
      setRejectedTutors(rejected);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (action: string, payload: any) => {
    setProcessingId(payload.userId);
    try {
      if (action === 'CHANGE_ROLE') {
        const { error: tutorError } = await supabase
          .from('tutors')
          .upsert({ 
            id: payload.userId, 
            role: payload.newRole, 
            email: payload.email,
            name: payload.name,
            tags: ['เปลี่ยนสถานะโดยแอดมิน'] 
          }, { 
            onConflict: 'id' 
          });

        if (tutorError) throw tutorError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: payload.newRole })
          .eq('id', payload.userId);

        if (profileError) throw profileError;
      }
      
      if (action === 'UPDATE_HOUR') {
        const amount = prompt(`ระบุจำนวนที่ต้องการเพิ่ม/ลด ในช่อง ${payload.field}:`);
        if (!amount || isNaN(Number(amount))) return;
        const { error } = await supabase.from('student_wallets')
          .update({ [payload.field]: payload.currentVal + Number(amount) })
          .eq('user_id', payload.userId);
        if (error) throw error;
      }
      fetchData(); 
    } catch (err: any) { 
      alert("Error: " + err.message); 
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`⚠️ คำเตือน! คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${userName}" ออกจากระบบทั้งหมด?\n(ข้อมูลกระเป๋าเงินและโปรไฟล์จะหายไป)`)) return;
    
    setProcessingId(userId);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      
      alert(`ลบผู้ใช้ ${userName} สำเร็จ`);
      fetchData();
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการลบผู้ใช้: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ อนุมัติการเป็นติวเตอร์
  const approveTutor = async (tutor: any) => {
    if (!confirm('อนุมัติให้ติวเตอร์เริ่มสอน?')) return;
    
    const targetId = tutor.user_id || tutor.id;
    if (!targetId) return alert('ข้อผิดพลาด: ไม่พบข้อมูล ID ที่ถูกต้องของติวเตอร์ท่านนี้ในระบบ');

    setProcessingId(tutor.id);
    try {
      const { error: tutorError } = await supabase.from('tutors').update({ 
        tags: ['ติวเตอร์ใหม่'],
        role: 'tutor' 
      }).eq('id', tutor.id);
      
      if (tutorError) throw tutorError;

      const { error: profileError } = await supabase.from('profiles').update({ 
        role: 'TUTOR' 
      }).eq('id', targetId); 
      
      if (profileError) throw profileError;

      alert('✅ อนุมัติสำเร็จ! ติวเตอร์สามารถเข้าใช้งานระบบได้แล้ว'); 
      fetchData(); 
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ❌ ไม่อนุมัติ / ยกเลิกการอนุมัติการเป็นติวเตอร์
  const rejectTutor = async (tutor: any) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการ "ไม่อนุมัติ/ยกเลิกการอนุมัติ" ติวเตอร์ท่านนี้?')) return;

    const targetId = tutor.user_id || tutor.id;
    if (!targetId) return alert('ข้อผิดพลาด: ไม่พบข้อมูล ID ที่ถูกต้องของติวเตอร์ท่านนี้ในระบบ');

    setProcessingId(tutor.id);
    try {
      // 1. ปรับ tag ติวเตอร์เป็น 'ไม่อนุมัติ'
      const { error: tutorError } = await supabase.from('tutors').update({ 
        tags: ['ไม่อนุมัติ'],
        role: 'student' 
      }).eq('id', tutor.id);
      
      if (tutorError) throw tutorError;

      // 2. ปรับบทบาทใน Profiles กลับเป็น STUDENT เพื่อบล็อกการเข้าถึงระบบ
      const { error: profileError } = await supabase.from('profiles').update({ 
        role: 'STUDENT' 
      }).eq('id', targetId); 

      if (profileError) throw profileError;

      alert('❌ ปฏิเสธการอนุมัติสำเร็จ! ข้อมูลถูกย้ายไปยังแท็บ "ยกเลิกการอนุมัติ"'); 
      fetchData(); 
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 text-left">
          <div className="text-left">
            <Link href="/admin" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
              <ArrowLeft size={14}/> Dashboard
            </Link>
            <h1 className="text-3xl font-black flex items-center gap-3">Super Admin</h1>
          </div>
          
          {/* แถบเปลี่ยนแท็บสถานะทั้ง 4 แท็บ */}
          <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-2xl border w-full xl:w-auto">
            <button onClick={() => setActiveTab('all')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
              สมาชิกทั้งหมด
            </button>
            <button onClick={() => setActiveTab('pending')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>
              กำลังดำเนินการ ({pendingTutors.length})
            </button>
            <button onClick={() => setActiveTab('approved')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase ${activeTab === 'approved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>
              อนุมัติแล้ว ({approvedTutors.length})
            </button>
            <button onClick={() => setActiveTab('rejected')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase ${activeTab === 'rejected' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}>
              ยกเลิกการอนุมัติ ({rejectedTutors.length})
            </button>
          </div>
        </div>

        {/* 1. สมาชิกทั้งหมด (All Directory) */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="font-black flex items-center gap-2"><Users size={20}/> Directory</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="ค้นหาชื่อ/Email..." className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-xs font-bold outline-none border w-64 focus:ring-2 focus:ring-blue-400 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <tr>
                    <th className="p-6 pl-10">สมาชิก & ตำแหน่ง</th>
                    <th className="p-6 text-center border-x bg-blue-50/20 w-48">ประถม-ม.ต้น</th>
                    <th className="p-6 text-center border-x bg-purple-50/20 w-48">สอบเข้า ม.4</th>
                    <th className="p-6 text-center border-x bg-orange-50/20 w-48">ม.ปลาย / มหาลัย</th>
                    <th className="p-6 text-center pr-10 w-24">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/30 transition-all">
                      <td className="p-6 pl-10 text-left">
                        <div className="mb-2">
                          <p className="font-black text-gray-900 text-sm leading-tight mb-1 text-left">{user.name}</p>
                          <p className="text-[10px] text-blue-500 font-bold flex items-center gap-1 text-left"><Mail size={10}/> {user.email}</p>
                        </div>
                        <select 
                          value={user.role} 
                          onChange={(e) => handleAction('CHANGE_ROLE', { 
                            userId: user.id, 
                            newRole: e.target.value, 
                            email: user.email,
                            name: user.name
                          })}
                          className={`text-[9px] font-black px-2 py-1 rounded-lg outline-none uppercase cursor-pointer ${user.role === 'admin' ? 'bg-red-50 text-red-600' : user.role === 'tutor' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}
                        >
                          <option value="student">Student</option>
                          <option value="tutor">Tutor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-center border-x">
                        <div className="flex flex-col gap-1 items-center">
                          <button onClick={() => handleAction('UPDATE_HOUR', { userId: user.id, field: 'tier1_online_balance', currentVal: user.tier1_online })} className="w-full max-w-[100px] bg-blue-600 text-white py-2 rounded-lg text-[9px] font-black hover:opacity-80 transition-all shadow-sm">{user.tier1_online} ON</button>
                          <button onClick={() => handleAction('UPDATE_HOUR', { userId: user.id, field: 'tier1_onsite_balance', currentVal: user.tier1_onsite })} className="w-full max-w-[100px] bg-blue-100 text-blue-700 py-1.5 rounded-lg text-[9px] font-black hover:bg-blue-200 transition-all shadow-sm mt-1">{user.tier1_onsite} SITE</button>
                        </div>
                      </td>
                      <td className="p-4 text-center border-x">
                        <div className="flex flex-col gap-1 items-center">
                          <button onClick={() => handleAction('UPDATE_HOUR', { userId: user.id, field: 'tier2_online_balance', currentVal: user.tier2_online })} className="w-full max-w-[100px] bg-purple-600 text-white py-2 rounded-lg text-[9px] font-black hover:opacity-80 transition-all shadow-sm">{user.tier2_online} ON</button>
                          <button onClick={() => handleAction('UPDATE_HOUR', { userId: user.id, field: 'tier2_onsite_balance', currentVal: user.tier2_onsite })} className="w-full max-w-[100px] bg-purple-100 text-purple-700 py-1.5 rounded-lg text-[9px] font-black hover:bg-purple-200 transition-all shadow-sm mt-1">{user.tier2_onsite} SITE</button>
                        </div>
                      </td>
                      <td className="p-4 text-center border-x">
                        <div className="flex flex-col gap-1 items-center">
                          <button 
                            onClick={() => handleAction('UPDATE_HOUR', { userId: user.id, field: 'tier3_online_balance', currentVal: user.tier3_online })} 
                            className="w-full max-w-[100px] py-2 rounded-lg text-[9px] font-black hover:opacity-80 transition-all shadow-sm"
                            style={{ backgroundColor: '#EA580C', color: 'white' }}
                          >
                            {user.tier3_online} ON
                          </button>
                          <button 
                            onClick={() => handleAction('UPDATE_HOUR', { userId: user.id, field: 'tier3_onsite_balance', currentVal: user.tier3_onsite })} 
                            className="w-full max-w-[100px] py-1.5 rounded-lg text-[9px] font-black hover:bg-orange-200 transition-all shadow-sm mt-1"
                            style={{ backgroundColor: '#FFEDD5', color: '#9A3412' }}
                          >
                            {user.tier3_onsite} SITE
                          </button>
                        </div>
                      </td>
                      <td className="p-6 text-center pr-10">
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={processingId === user.id}
                          className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                          title="ลบผู้ใช้นี้"
                        >
                          {processingId === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* 2. กำลังดำเนินการ (Pending Tutors) */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-orange-100 overflow-hidden p-6 md:p-8">
            <h2 className="font-black flex items-center gap-2 mb-6 text-orange-600">
              <Clock size={24}/> รายการขอเป็นติวเตอร์ (กำลังดำเนินการ) ({pendingTutors.length})
            </h2>
            
            {pendingTutors.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed">
                <p className="text-gray-400 font-bold">🎉 เยี่ยมมาก! ไม่มีรายการรออนุมัติค้างอยู่</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {pendingTutors.map(tutor => (
                  <div key={tutor.id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 border border-orange-100 rounded-3xl bg-orange-50/30 hover:bg-orange-50/80 transition-all gap-6">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="font-black text-gray-900 text-xl">{tutor.name || 'ไม่ระบุชื่อ'}</p>
                        {tutor.resume_url && (
                          <a 
                            href={tutor.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded-lg hover:bg-purple-200 transition-colors"
                          >
                            <ExternalLink size={12}/> ดู Resume
                          </a>
                        )}
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black rounded-lg">
                          <Clock size={12}/> ส่งมา{getRelativeTime(tutor.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 mb-4">
                        <p className="flex items-center gap-1.5"><Mail size={14} className="text-orange-400"/> {tutor.email || 'ไม่มีข้อมูลอีเมล'}</p>
                        <p className="flex items-center gap-1.5"><Phone size={14} className="text-orange-400"/> {tutor.phone || 'ไม่ระบุเบอร์โทร'}</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm text-sm text-gray-700">
                        <p className="font-bold flex items-center gap-2 mb-2 text-orange-800">
                          <FileText size={16} /> ประวัติและรายละเอียด
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed">{tutor.bio || 'ไม่ได้ระบุรายละเอียดเพิ่มเติม'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
                      <button 
                        onClick={() => approveTutor(tutor)} 
                        disabled={processingId === tutor.id}
                        className="w-full sm:w-1/2 lg:w-48 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processingId === tutor.id ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16}/>}
                        อนุมัติให้เป็นติวเตอร์
                      </button>
                      <button 
                        onClick={() => rejectTutor(tutor)} 
                        disabled={processingId === tutor.id}
                        className="w-full sm:w-1/2 lg:w-48 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processingId === tutor.id ? <Loader2 className="animate-spin" size={16}/> : <XCircle size={16}/>}
                        ไม่อนุมัติใบสมัคร
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. อนุมัติแล้ว (Approved Tutors) */}
        {activeTab === 'approved' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-emerald-100 overflow-hidden p-6 md:p-8">
            <h2 className="font-black flex items-center gap-2 mb-6 text-emerald-600">
              <ShieldCheck size={24}/> รายการติวเตอร์ (อนุมัติแล้ว) ({approvedTutors.length})
            </h2>
            
            {approvedTutors.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed">
                <p className="text-gray-400 font-bold">ไม่มีรายการติวเตอร์ที่อนุมัติแล้ว</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {approvedTutors.map(tutor => (
                  <div key={tutor.id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 border border-emerald-100 rounded-3xl bg-emerald-50/10 hover:bg-emerald-50/30 transition-all gap-6">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="font-black text-gray-900 text-xl">{tutor.name || 'ไม่ระบุชื่อ'}</p>
                        {tutor.resume_url && (
                          <a 
                            href={tutor.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded-lg hover:bg-purple-200 transition-colors"
                          >
                            <ExternalLink size={12}/> ดู Resume
                          </a>
                        )}
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg">
                          อนุมัติแล้ว
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 mb-4">
                        <p className="flex items-center gap-1.5"><Mail size={14} className="text-emerald-500"/> {tutor.email || 'ไม่มีข้อมูลอีเมล'}</p>
                        <p className="flex items-center gap-1.5"><Phone size={14} className="text-emerald-500"/> {tutor.phone || 'ไม่ระบุเบอร์โทร'}</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm text-sm text-gray-700">
                        <p className="font-bold flex items-center gap-2 mb-2 text-emerald-800">
                          <FileText size={16} /> ประวัติและรายละเอียด
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed">{tutor.bio || 'ไม่ได้ระบุรายละเอียดเพิ่มเติม'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full lg:w-auto shrink-0">
                      <button 
                        onClick={() => rejectTutor(tutor)} 
                        disabled={processingId === tutor.id}
                        className="w-full lg:w-48 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processingId === tutor.id ? <Loader2 className="animate-spin" size={16}/> : <XCircle size={16}/>}
                        ยกเลิกการอนุมัติ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. ยกเลิกการอนุมัติ / ไม่อนุมัติ (Rejected Tutors) */}
        {activeTab === 'rejected' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-red-100 overflow-hidden p-6 md:p-8">
            <h2 className="font-black flex items-center gap-2 mb-6 text-red-600">
              <XCircle size={24}/> รายการติวเตอร์ (ยกเลิกการอนุมัติ / ไม่อนุมัติ) ({rejectedTutors.length})
            </h2>
            
            {rejectedTutors.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed">
                <p className="text-gray-400 font-bold">ไม่มีรายการติวเตอร์ที่ถูกยกเลิกการอนุมัติ</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {rejectedTutors.map(tutor => (
                  <div key={tutor.id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 border border-red-100 rounded-3xl bg-red-50/10 hover:bg-red-50/30 transition-all gap-6">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="font-black text-gray-900 text-xl">{tutor.name || 'ไม่ระบุชื่อ'}</p>
                        {tutor.resume_url && (
                          <a 
                            href={tutor.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded-lg hover:bg-purple-200 transition-colors"
                          >
                            <ExternalLink size={12}/> ดู Resume
                          </a>
                        )}
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-lg">
                          ไม่อนุมัติ / ยกเลิกการอนุมัติ
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 mb-4">
                        <p className="flex items-center gap-1.5"><Mail size={14} className="text-red-400"/> {tutor.email || 'ไม่มีข้อมูลอีเมล'}</p>
                        <p className="flex items-center gap-1.5"><Phone size={14} className="text-red-400"/> {tutor.phone || 'ไม่ระบุเบอร์โทร'}</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm text-sm text-gray-700">
                        <p className="font-bold flex items-center gap-2 mb-2 text-red-800">
                          <FileText size={16} /> ประวัติและรายละเอียด
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed">{tutor.bio || 'ไม่ได้ระบุรายละเอียดเพิ่มเติม'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full lg:w-auto shrink-0">
                      <button 
                        onClick={() => approveTutor(tutor)} 
                        disabled={processingId === tutor.id}
                        className="w-full lg:w-48 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processingId === tutor.id ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16}/>}
                        อนุมัติให้เป็นติวเตอร์
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
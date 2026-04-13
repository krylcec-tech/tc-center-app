'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ShieldCheck, Users, Search, Trash2, Loader2, ArrowLeft, Mail
} from 'lucide-react';

export default function SuperAdminUsers() {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('all');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingTutors, setPendingTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profError } = await supabase.from('profiles').select('id, email, full_name, role');
      if (profError) throw profError;

      const { data: wallets } = await supabase.from('student_wallets').select('*');
      const { data: tutors } = await supabase.from('tutors').select('*');

      const formatted = (profiles || []).map((p: any) => {
        const wallet = wallets?.find(w => w.user_id === p.id);
        const tutorInfo = tutors?.find(t => t.id === p.id); // ✨ เปลี่ยนจาก t.user_id เป็น t.id

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
      const pending = tutors?.filter(t => t.tags && t.tags.includes('รอการอนุมัติ')) || [];
      setPendingTutors(pending);
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
            id: payload.userId, // ✨ เปลี่ยนจาก user_id เป็น id
            role: payload.newRole, 
            email: payload.email,
            name: payload.name,
            tags: ['เปลี่ยนสถานะโดยแอดมิน'] 
          }, { 
            onConflict: 'id' // ✨ เปลี่ยนจาก user_id เป็น id
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

  // ✨ อัปเดตฟังก์ชัน approveTutor ให้รับค่า ID มาใช้ให้ถูกต้อง
  const approveTutor = async (tutorId: string) => {
    if (!confirm('อนุมัติให้ติวเตอร์เริ่มสอน?')) return;
    setProcessingId(tutorId);
    try {
      // 1. อัปเดตตาราง tutors (เปลี่ยน tag เป็น 'ติวเตอร์ใหม่')
      const { error: tutorError } = await supabase.from('tutors').update({ 
        tags: ['ติวเตอร์ใหม่'],
        role: 'tutor' 
      }).eq('id', tutorId);
      
      if (tutorError) throw tutorError;

      // 2. อัปเดตตาราง profiles (เปลี่ยนยศให้ล็อกอินได้)
      const { error: profileError } = await supabase.from('profiles').update({ 
        role: 'TUTOR' 
      }).eq('id', tutorId); // ✨ ใช้ tutorId ได้เลย เพราะเป็น ID เดียวกัน
      
      if (profileError) throw profileError;

      alert('✅ อนุมัติสำเร็จ! ติวเตอร์สามารถเข้าใช้งานระบบได้แล้ว'); 
      fetchData(); // โหลดข้อมูลใหม่
    } catch (err: any) {
      alert(err.message);
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
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
          <div className="text-left">
            <Link href="/admin" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
              <ArrowLeft size={14}/> Dashboard
            </Link>
            <h1 className="text-3xl font-black flex items-center gap-3">Super Admin</h1>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl border">
            <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>
              รออนุมัติ ({pendingTutors.length})
            </button>
            <button onClick={() => setActiveTab('all')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
              สมาชิกทั้งหมด
            </button>
          </div>
        </div>

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
                    <th className="p-6 text-right pr-10 w-20">จัดการ</th>
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
                      <td className="p-6 text-right pr-10">
                        <button className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'pending' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-orange-100 overflow-hidden p-6 md:p-8">
            <h2 className="font-black flex items-center gap-2 mb-6 text-orange-600">
              <ShieldCheck size={24}/> รายการขอเป็นติวเตอร์ ({pendingTutors.length})
            </h2>
            
            {pendingTutors.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed">
                <p className="text-gray-400 font-bold">🎉 เยี่ยมมาก! ไม่มีรายการรออนุมัติค้างอยู่</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingTutors.map(tutor => (
                  <div key={tutor.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border border-orange-100 rounded-3xl bg-orange-50/30 hover:bg-orange-50/80 transition-all gap-4">
                    <div>
                      <p className="font-black text-gray-900 text-lg">{tutor.name || 'ไม่ระบุชื่อ'}</p>
                      <p className="text-xs text-orange-600 font-bold flex items-center gap-1 mt-1">
                        <Mail size={12}/> {tutor.email || 'ไม่มีข้อมูลอีเมล'}
                      </p>
                    </div>
                    <button 
                      // ✨ ส่งแค่ค่า ID ตัวเดียวพอ
                      onClick={() => approveTutor(tutor.id)} 
                      disabled={processingId === tutor.id}
                      className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === tutor.id ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16}/>}
                      อนุมัติให้เป็นติวเตอร์
                    </button>
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
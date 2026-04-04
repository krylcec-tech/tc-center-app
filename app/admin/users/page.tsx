'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link'; // ✨ นำเข้า Link จาก next/link
import { 
  ShieldCheck, Users, Clock, Trash2, Edit, Loader2, 
  CheckCircle, XCircle, Search, CreditCard, ChevronDown, ArrowLeft // ✨ นำเข้า ArrowLeft
} from 'lucide-react';

export default function SuperAdminUsers() {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [pendingTutors, setPendingTutors] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ฟังก์ชันโหลดข้อมูล
  const fetchData = async () => {
    setLoading(true);
    
    // โหลดคนรออนุมัติ
    const { data: pending } = await supabase
      .from('tutors')
      .select('*')
      .contains('tags', ['รอการอนุมัติ']);
    setPendingTutors(pending || []);

    // โหลดทุกคน (ดึงจาก tutors และ join กระเป๋าตังค์มาดูชั่วโมง)
    const { data: users } = await supabase
      .from('student_wallets')
      .select(`
        user_id, student_name, balance, point_balance,
        profiles:user_id (referral_code),
        tutors:user_id (role, tags, email)
      `);
    
    // แปลงข้อมูลให้สวยงาม (ใส่ u: any และเช็ก Array เพื่อลบเส้นแดง)
    const formattedUsers = (users || []).map((u: any) => {
      // ดึง refCode ออกมาอย่างปลอดภัย ไม่ว่าจะส่งมาเป็น Array หรือ Object
      const refCode = Array.isArray(u.profiles) 
        ? u.profiles[0]?.referral_code 
        : u.profiles?.referral_code;

      return {
        id: u.user_id,
        name: u.student_name,
        email: u.tutors?.[0]?.email || 'N/A',
        role: u.tutors?.[0]?.role || 'student',
        tags: u.tutors?.[0]?.tags || [],
        balance: u.balance,
        points: u.point_balance,
        refCode: refCode
      };
    });

    setAllUsers(formattedUsers);
    setLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  // --- API Handlers ---
  const handleAction = async (action: string, payload: any) => {
    setProcessingId(payload.userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(`✅ ${data.message}`);
      fetchData(); // โหลดข้อมูลใหม่
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const approveTutor = async (tutorId: string) => {
    if (!confirm('อนุมัติให้ติวเตอร์เริ่มสอน?')) return;
    setProcessingId(tutorId);
    try {
      const { error } = await supabase.from('tutors').update({ tags: ['ติวเตอร์ใหม่'] }).eq('id', tutorId);
      if (error) throw error;
      alert('✅ อนุมัติสำเร็จ'); 
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // กรองข้อมูลจากการค้นหา
  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* ✨ เพิ่มปุ่มลิงก์กลับไปหน้า Admin หลักตรงนี้ */}
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold text-xs uppercase mb-6 transition-colors w-max">
          <ArrowLeft size={16}/> กลับสู่แผงควบคุมหลัก (Dashboard)
        </Link>

        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Super Admin</h1>
              <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mt-1">User Management Center</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-[2rem] w-max border border-gray-100">
          <button onClick={() => setActiveTab('pending')} className={`px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
            ติวเตอร์รออนุมัติ ({pendingTutors.length})
          </button>
          <button onClick={() => setActiveTab('all')} className={`px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>
            ฐานข้อมูลสมาชิกทั้งหมด ({allUsers.length})
          </button>
        </div>

        {/* --- TAB 1: PENDING TUTORS --- */}
        {activeTab === 'pending' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingTutors.length === 0 ? (
               <div className="col-span-full bg-white p-12 rounded-[3rem] text-center border border-gray-100 shadow-sm">
                 <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                 <h2 className="text-xl font-black text-gray-900">ไม่มีคำขอค้างอยู่</h2>
               </div>
            ) : pendingTutors.map(tutor => (
              <div key={tutor.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black text-gray-900">{tutor.name}</h3>
                    {tutor.resume_url && (
                      <a href={tutor.resume_url} target="_blank" rel="noopener noreferrer" className="bg-blue-50 text-blue-600 p-2 rounded-xl text-[10px] font-bold">ดู Resume</a>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl mb-6 text-xs text-gray-600 font-medium">{tutor.bio}</div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => approveTutor(tutor.id)} 
                    disabled={processingId === tutor.id}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 flex justify-center items-center gap-2"
                  >
                    {processingId === tutor.id ? <Loader2 size={18} className="animate-spin" /> : null}
                    อนุมัติให้เริ่มสอน
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB 2: ALL USERS DIRECTORY --- */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-black flex items-center gap-2"><Users size={20}/> Directory</h2>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input type="text" placeholder="ค้นหาชื่อ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-400 outline-none w-64" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="p-4 pl-6">ชื่อ / อีเมล</th>
                    <th className="p-4">สถานะ (Role)</th>
                    <th className="p-4">ชั่วโมง/แต้ม</th>
                    <th className="p-4 text-right pr-6">การจัดการ (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-black text-sm text-gray-900">{user.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{user.email}</p>
                        <p className="text-[9px] text-blue-400 font-bold mt-1">Ref: {user.refCode || '-'}</p>
                      </td>
                      <td className="p-4">
                        <select 
                          value={user.role} 
                          onChange={(e) => handleAction('CHANGE_ROLE', { userId: user.id, newRole: e.target.value })}
                          disabled={processingId === user.id}
                          className={`text-xs font-black px-3 py-1.5 rounded-lg outline-none cursor-pointer ${user.role === 'admin' ? 'bg-red-50 text-red-600' : user.role === 'tutor' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}
                        >
                          <option value="student">Student</option>
                          <option value="tutor">Tutor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">ชั่วโมง</span>
                            <span className="font-black text-gray-900">{user.balance}</span>
                          </div>
                          <button 
                            onClick={() => {
                              const hrs = prompt(`ต้องการเติมชั่วโมงให้ ${user.name} กี่ชั่วโมง? (ใส่ติดลบเพื่อลด)`);
                              if (hrs && !isNaN(Number(hrs))) handleAction('ADD_HOURS', { userId: user.id, addHours: hrs });
                            }}
                            className="bg-gray-100 p-1.5 rounded-lg hover:bg-green-100 hover:text-green-600 text-gray-400 transition-colors"
                          >
                            <CreditCard size={14}/>
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button 
                          onClick={() => { if(confirm(`อันตราย! ยืนยันลบไอดี ${user.name} ถาวรหรือไม่?`)) handleAction('DELETE_USER', { userId: user.id }); }}
                          disabled={processingId === user.id || user.role === 'admin'}
                          className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          {processingId === user.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
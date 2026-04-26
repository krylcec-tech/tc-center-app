'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, Loader2, Save, X, Edit3, 
  User, GraduationCap, Store, Percent, AlertCircle, RefreshCcw
} from 'lucide-react';
import Link from 'next/link';

export default function AdminCommissionsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'student' | 'tutor'>('ALL');

  const [editingUser, setEditingUser] = useState<any>(null);
  const [newFee, setNewFee] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. ดึงโปรไฟล์ทั้งหมดที่เป็นนักเรียนหรือติวเตอร์
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['student', 'STUDENT', 'tutor', 'TUTOR'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. ดึงยอดขายของแต่ละคนเพื่อมาโชว์ประกอบการตัดสินใจ
      const { data: coursesData } = await supabase
        .from('courses')
        .select('seller_id, sales_count');

      // คำนวณยอดขายรวมของแต่ละคน
      const salesMap: any = {};
      coursesData?.forEach(course => {
        if (course.seller_id) {
          salesMap[course.seller_id] = (salesMap[course.seller_id] || 0) + (course.sales_count || 0);
        }
      });

      const formattedUsers = profilesData?.map(p => {
        const soldCount = salesMap[p.id] || 0;
        let autoFee = 30;
        if (soldCount >= 30) autoFee = 10;
        else if (soldCount >= 10) autoFee = 20;

        return {
          ...p,
          role: p.role?.toLowerCase(),
          total_sales: soldCount,
          auto_fee: autoFee
        };
      });

      setUsers(formattedUsers || []);
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      // ถ้าปล่อยว่าง หรือพิมพ์ auto ให้เซ็ตเป็น null เพื่อให้ระบบกลับไปใช้ขั้นบันได
      const feeValue = (newFee === '' || newFee.toLowerCase() === 'auto') ? null : parseInt(newFee);
      
      if (feeValue !== null && (feeValue < 0 || feeValue > 100)) {
        alert("กรุณากรอกตัวเลขระหว่าง 0 - 100");
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ custom_fee: feeValue })
        .eq('id', editingUser.id);

      if (error) throw error;

      alert('บันทึกเรทเปอร์เซ็นต์เรียบร้อยแล้ว!');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.full_name || u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = activeTab === 'ALL' || u.role === activeTab;
    return matchSearch && matchRole;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900 text-left">
      
      {/* Modal แก้ไข % */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 relative shadow-2xl">
            <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2"><Percent className="text-blue-600"/> ปรับเรทค่าธรรมเนียม</h2>
            <p className="text-sm font-bold text-gray-500 mb-6">สำหรับ: {editingUser.full_name || editingUser.email}</p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">ยอดขายปัจจุบัน</p>
                <p className="text-xl font-black text-gray-800">{editingUser.total_sales} เล่ม</p>
                <p className="text-xs font-bold text-blue-600 mt-1">เรทอัตโนมัติ: หัก {editingUser.auto_fee}%</p>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 mb-1 block">ระบุ % ที่ต้องการหัก (ใส่ตัวเลข)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="เว้นว่างไว้เพื่อใช้เรทอัตโนมัติ" 
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-black text-lg focus:border-blue-500 outline-none transition-all"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 mt-2 ml-2 flex items-start gap-1">
                  <AlertCircle size={12} className="shrink-0 mt-0.5"/> 
                  หากเว้นว่างไว้ ระบบจะคำนวณ % หักอัตโนมัติตามขั้นบันไดยอดขาย
                </p>
              </div>

              <button onClick={handleSaveFee} disabled={isSaving} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-base shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300 mt-4">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20}/>} บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link href="/admin" className="text-gray-400 font-black text-xs uppercase mb-2 flex items-center gap-2 hover:text-blue-600 transition-all group w-max">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> กลับหน้าหลัก Admin
            </Link>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 text-slate-800">
              <Percent className="text-blue-600" size={36}/> จัดการเรทหักเปอร์เซ็นต์
            </h1>
            <p className="text-gray-500 font-bold text-sm mt-1">ตั้งค่า Commission พิเศษรายบุคคล สำหรับนักเรียนและติวเตอร์</p>
          </div>
          
          <button onClick={fetchUsers} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
            <RefreshCcw size={14}/> รีเฟรชข้อมูล
          </button>
        </header>

        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            {[{id:'ALL', l:'ทั้งหมด'}, {id:'tutor', l:'ติวเตอร์'}, {id:'student', l:'นักเรียน'}].map(f => (
              <button key={f.id} onClick={() => setActiveTab(f.id as any)} className={`flex-1 md:w-auto px-6 py-2.5 rounded-[1rem] text-xs font-black transition-all ${activeTab === f.id ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{f.l}</button>
            ))}
          </div>
          <div className="relative w-full md:w-72 text-gray-900">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="ค้นหาชื่อหรืออีเมล..." className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-[1.2rem] font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => {
            const hasCustomFee = user.custom_fee !== null && user.custom_fee !== undefined;
            const currentFee = hasCustomFee ? user.custom_fee : user.auto_fee;

            return (
              <div key={user.id} className={`bg-white p-6 rounded-[2rem] border-2 transition-all group flex flex-col
                ${hasCustomFee ? 'border-amber-300 shadow-sm hover:shadow-md' : 'border-gray-100 hover:border-blue-200 hover:shadow-sm'}
              `}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 
                      ${user.role === 'tutor' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                      {user.role === 'tutor' ? <GraduationCap size={20}/> : <User size={20}/>}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 line-clamp-1">{user.full_name || 'ไม่ระบุชื่อ'}</h3>
                      <p className="text-[10px] font-bold text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1"><Store size={10}/> ยอดขายรวม</p>
                    <p className="text-lg font-black text-gray-800">{user.total_sales}</p>
                  </div>
                  <div className={`p-3 rounded-2xl ${hasCustomFee ? 'bg-amber-50' : 'bg-blue-50'}`}>
                    <p className={`text-[9px] font-black uppercase flex items-center gap-1 ${hasCustomFee ? 'text-amber-600' : 'text-blue-500'}`}>
                      <Percent size={10}/> {hasCustomFee ? 'เรทพิเศษ' : 'เรทอัตโนมัติ'}
                    </p>
                    <p className={`text-lg font-black ${hasCustomFee ? 'text-amber-700' : 'text-blue-700'}`}>หัก {currentFee}%</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-end">
                  <button 
                    onClick={() => {
                      setEditingUser(user);
                      setNewFee(hasCustomFee ? String(user.custom_fee) : '');
                    }} 
                    className="px-4 py-2.5 bg-gray-900 text-white rounded-xl font-black text-xs hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 w-full justify-center"
                  >
                    <Edit3 size={14}/> ปรับเปอร์เซ็นต์
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredUsers.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400 font-bold bg-white rounded-[3rem] border border-gray-100">
              ไม่พบผู้ใช้งานที่ค้นหา
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
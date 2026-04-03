'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, User, Wallet, Save, Loader2, 
  ArrowLeft, ChevronRight, AlertCircle, RefreshCcw
} from 'lucide-react';
import Link from 'next/link';

export default function AdminWalletManager() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // รายการฟิลด์กระเป๋าเงินทั้ง 6 แบบ
  const walletFields = [
    { key: 'tier1_online_balance', label: 'ประถม-ม.ต้น (Online)', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { key: 'tier1_onsite_balance', label: 'ประถม-ม.ต้น (Onsite)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { key: 'tier2_online_balance', label: 'สอบเข้า ม.4 (Online)', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { key: 'tier2_onsite_balance', label: 'สอบเข้า ม.4 (Onsite)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { key: 'tier3_online_balance', label: 'ม.ปลาย/มหาลัย (Online)', color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { key: 'tier3_onsite_balance', label: 'ม.ปลาย/มหาลัย (Onsite)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_wallets')
        .select('*')
        .or(`student_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(10);
      
      if (error) throw error;
      setStudents(data || []);
      if (data?.length === 0) setSelectedStudent(null);
    } catch (err: any) {
      alert("ค้นหาไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    // เตรียมค่าเริ่มต้นสำหรับการแก้ไข
    setEditValues({
      tier1_online_balance: student.tier1_online_balance || 0,
      tier1_onsite_balance: student.tier1_onsite_balance || 0,
      tier2_online_balance: student.tier2_online_balance || 0,
      tier2_onsite_balance: student.tier2_onsite_balance || 0,
      tier3_online_balance: student.tier3_online_balance || 0,
      tier3_onsite_balance: student.tier3_onsite_balance || 0,
    });
  };

  const handleUpdateWallet = async () => {
    if (!selectedStudent) return;
    if (!confirm(`ยืนยันการปรับยอดชั่วโมงของ "น้อง${selectedStudent.student_name}"?`)) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('student_wallets')
        .update({
          ...editValues,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', selectedStudent.user_id);

      if (error) throw error;

      alert('📊 ปรับปรุงยอดชั่วโมงเรียบร้อยแล้ว!');
      setSelectedStudent({ ...selectedStudent, ...editValues });
      // อัปเดตข้อมูลใน List ฝั่งซ้ายด้วย
      setStudents(students.map(s => s.user_id === selectedStudent.user_id ? { ...s, ...editValues } : s));
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-gray-400 font-black text-xs uppercase mb-2 flex items-center gap-2 hover:text-blue-600 transition-all group w-max">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> กลับหน้าหลัก Admin
            </Link>
            <h1 className="text-4xl font-black tracking-tight">จัดการกระเป๋าเงินนักเรียน 💳</h1>
            <p className="text-gray-500 font-bold">แก้ไขยอดชั่วโมงเรียน 6 ประเภทรายบุคคล</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ฝั่งซ้าย: ค้นหา */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="ชื่อน้อง หรือเบอร์โทร..." 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 font-bold border-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button onClick={handleSearch} disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18}/> : "ค้นหารายชื่อ"}
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {students.map(s => (
                <button 
                  key={s.user_id} 
                  onClick={() => selectStudent(s)}
                  className={`w-full p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${selectedStudent?.user_id === s.user_id ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                      <User size={20}/>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-sm">น้อง{s.student_name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{s.phone || 'ไม่ระบุเบอร์'}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className={selectedStudent?.user_id === s.user_id ? 'text-blue-600' : 'text-gray-200'}/>
                </button>
              ))}
              {!loading && students.length === 0 && searchQuery && (
                <p className="text-center text-gray-400 py-10 font-bold italic">ไม่พบข้อมูลนักเรียน</p>
              )}
            </div>
          </div>

          {/* ฝั่งขวา: การแก้ไข */}
          <div className="lg:col-span-8">
            {selectedStudent ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Manual Adjustment</span>
                      <h2 className="text-4xl font-black text-gray-900">น้อง{selectedStudent.student_name}</h2>
                      <p className="text-gray-400 font-bold mt-1 flex items-center gap-2"><RefreshCcw size={14}/> อัปเดตล่าสุด: {new Date(selectedStudent.updated_at).toLocaleString('th-TH')}</p>
                    </div>
                    <button 
                      onClick={handleUpdateWallet}
                      disabled={isSaving}
                      className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-green-600 transition-all shadow-lg active:scale-95 disabled:bg-gray-300"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />}
                      บันทึกค่าใหม่
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {walletFields.map((field) => (
                      <div key={field.key} className={`${field.color} p-6 rounded-[2rem] border flex flex-col gap-3 group transition-all hover:shadow-md`}>
                        <label className="text-[10px] font-black uppercase tracking-wider opacity-80">{field.label}</label>
                        <div className="flex items-end gap-2">
                          <input 
                            type="number" 
                            step="0.5"
                            value={editValues[field.key]}
                            onChange={(e) => setEditValues({...editValues, [field.key]: parseFloat(e.target.value) || 0})}
                            className="bg-white/60 w-full text-3xl font-black px-4 py-2 rounded-xl border-2 border-transparent focus:border-white focus:bg-white transition-all outline-none"
                          />
                          <span className="mb-3 font-black opacity-40 text-sm uppercase">ชม.</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                    <AlertCircle className="text-amber-600 shrink-0" size={24} />
                    <p className="text-sm text-amber-800 font-bold leading-relaxed">
                      <span className="block mb-1 font-black underline uppercase">Admin Security Gate:</span>
                      การแก้ไขยอดตรงนี้เป็นการบังคับเปลี่ยนตัวเลขในระบบโดยตรง (Override) กรุณาตรวจสอบสลิปหรือหลักฐานให้แน่ใจก่อนบันทึกครับ
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <Wallet className="text-gray-100 mb-6" size={120} />
                <h3 className="text-2xl font-black text-gray-300">กรุณาเลือกนักเรียนจากรายชื่อ <br/>เพื่อจัดการกระเป๋าเงิน</h3>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
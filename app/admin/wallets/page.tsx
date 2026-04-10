'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, User, Wallet, Save, Loader2, 
  ArrowLeft, ChevronRight, AlertCircle, RefreshCcw, 
  Star, Users, Network, Phone, GraduationCap, Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function AdminWalletManager() {
  const [activeTab, setActiveTab] = useState<'student' | 'tutor'>('student'); 
  const [loading, setLoading] = useState(true); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // State สำหรับนักเรียน
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // State สำหรับติวเตอร์
  const [tutors, setTutors] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [referralTree, setReferralTree] = useState<any[]>([]); 

  const [editValues, setEditValues] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // รายการฟิลด์กระเป๋าเงินนักเรียน
  const walletFields = [
    { key: 'tier1_online_balance', label: 'ประถม-ม.ต้น (Online)', color: 'bg-blue-50 text-blue-600 border-blue-100', unit: 'ชม.' },
    { key: 'tier1_onsite_balance', label: 'ประถม-ม.ต้น (Onsite)', color: 'bg-blue-100 text-blue-800 border-blue-200', unit: 'ชม.' },
    { key: 'tier2_online_balance', label: 'สอบเข้า ม.4 (Online)', color: 'bg-purple-50 text-purple-600 border-purple-100', unit: 'ชม.' },
    { key: 'tier2_onsite_balance', label: 'สอบเข้า ม.4 (Onsite)', color: 'bg-purple-100 text-purple-800 border-purple-200', unit: 'ชม.' },
    { key: 'tier3_online_balance', label: 'ม.ปลาย/มหาลัย (Online)', color: 'bg-orange-50 text-orange-600 border-orange-100', unit: 'ชม.' },
    { key: 'tier3_onsite_balance', label: 'ม.ปลาย/มหาลัย (Onsite)', color: 'bg-orange-100 text-orange-800 border-orange-200', unit: 'ชม.' },
    { key: 'marketing_points', label: 'แต้มร้านค้าเด็กขยัน', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', unit: 'แต้ม' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]); 

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: allProfiles } = await supabase.from('profiles').select('id, phone, full_name, referred_by');

      if (activeTab === 'student') {
        const { data: wallets } = await supabase.from('student_wallets').select('*').order('updated_at', { ascending: false }).limit(20);
        const enrichedStudents = (wallets || []).map(w => {
          const profile = allProfiles?.find(p => p.id === w.user_id);
          return { ...w, phone: w.phone || profile?.phone || 'ไม่ระบุเบอร์โทร' };
        });
        setStudents(enrichedStudents);
      } else {
        const { data: tutorsData } = await supabase.from('tutors').select('*').order('created_at', { ascending: false }).limit(20);
        const enrichedTutors = (tutorsData || []).map(t => {
          const profile = allProfiles?.find(p => p.id === t.user_id);
          return { ...t, phone: profile?.phone || 'ไม่ระบุเบอร์โทร' };
        });
        setTutors(enrichedTutors);
      }
    } catch (err: any) {
      console.error("Fetch Initial Error: ", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return fetchInitialData();
    
    setLoading(true);
    try {
      const { data: allProfiles } = await supabase.from('profiles').select('id, phone, full_name, referred_by');

      if (activeTab === 'student') {
        const { data } = await supabase.from('student_wallets').select('*')
          .or(`student_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
        
        const enrichedStudents = (data || []).map(w => {
          const profile = allProfiles?.find(p => p.id === w.user_id);
          return { ...w, phone: w.phone || profile?.phone || 'ไม่ระบุเบอร์โทร' };
        });
        setStudents(enrichedStudents);
      } else {
        const { data } = await supabase.from('tutors').select('*')
          .ilike('name', `%${searchQuery}%`);
        
        const enrichedTutors = (data || []).map(t => {
          const profile = allProfiles?.find(p => p.id === t.user_id);
          return { ...t, phone: profile?.phone || 'ไม่ระบุเบอร์โทร' };
        });
        setTutors(enrichedTutors);
      }
    } catch (err: any) {
      alert("ค้นหาไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    setEditValues({
      tier1_online_balance: student.tier1_online_balance || 0,
      tier1_onsite_balance: student.tier1_onsite_balance || 0,
      tier2_online_balance: student.tier2_online_balance || 0,
      tier2_onsite_balance: student.tier2_onsite_balance || 0,
      tier3_online_balance: student.tier3_online_balance || 0,
      tier3_onsite_balance: student.tier3_onsite_balance || 0,
      marketing_points: student.marketing_points || 0, 
    });
  };

  const selectTutor = async (tutor: any) => {
    setSelectedTutor(tutor);
    
    let tutorPoints = 0;
    try {
      // ✨ ดึงแต้มจากตาราง affiliate_wallets ตามโครงสร้างของคุณ
      const { data: wallet } = await supabase
        .from('affiliate_wallets')
        .select('points_balance')
        .eq('user_id', tutor.user_id)
        .maybeSingle();
      
      if (wallet) tutorPoints = wallet.points_balance || 0;
    } catch (e) {
      console.error(e);
    }

    setEditValues({
      points_balance: tutorPoints, // ✨ เปลี่ยนตัวแปรให้ตรงตาราง
    });

    try {
      const refCode = tutor.referral_code || tutor.id; 
      const { data: refs } = await supabase
        .from('profiles')
        .select('full_name, phone, role, created_at')
        .eq('referred_by', refCode);
      
      setReferralTree(refs || []);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'student') {
        if (!confirm(`ยืนยันการปรับยอดทั้งหมดของ "น้อง${selectedStudent.student_name}"?`)) return;
        
        const { error } = await supabase.from('student_wallets')
          .update({ ...editValues, updated_at: new Date().toISOString() })
          .eq('user_id', selectedStudent.user_id);
        if (error) throw error;
        
        alert('📊 อัปเดตข้อมูลนักเรียนเรียบร้อยแล้ว!');
        fetchInitialData();
      } else {
        if (!confirm(`ยืนยันการปรับยอด แต้มร้านค้าของ "ครู${selectedTutor.name}"?`)) return;
        
        // ✨ บันทึกแต้มติวเตอร์ลงตาราง affiliate_wallets
        const { error } = await supabase.from('affiliate_wallets').upsert({
          user_id: selectedTutor.user_id,
          points_balance: editValues.points_balance,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (error) throw error;
        
        alert('🎁 อัปเดตแต้ม Affiliate ติวเตอร์เรียบร้อยแล้ว!');
        fetchInitialData();
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-gray-900 text-left">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link href="/admin" className="text-gray-400 font-black text-xs uppercase mb-2 flex items-center gap-2 hover:text-blue-600 transition-all group w-max">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> กลับหน้าหลัก Admin
            </Link>
            <h1 className="text-4xl font-black tracking-tight">Financial & Affiliate 💎</h1>
            <p className="text-gray-500 font-bold mt-1">จัดการกระเป๋าเงิน และ แต้มร้านค้าส่วนกลาง</p>
          </div>

          <div className="flex bg-gray-200/50 p-1.5 rounded-[1.5rem] w-full md:w-auto shadow-inner">
            <button 
              onClick={() => { setActiveTab('student'); setSelectedStudent(null); setSearchQuery(''); }}
              className={`flex-1 md:w-32 py-3 rounded-[1.2rem] text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'student' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <GraduationCap size={16}/> นักเรียน
            </button>
            <button 
              onClick={() => { setActiveTab('tutor'); setSelectedTutor(null); setSearchQuery(''); }}
              className={`flex-1 md:w-32 py-3 rounded-[1.2rem] text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'tutor' ? 'bg-white text-purple-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase size={16}/> ติวเตอร์
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ฝั่งซ้าย: ค้นหา & รายชื่อ */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder={`ค้นหาชื่อหรือเบอร์โทร...`}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 font-bold border-none ${activeTab === 'student' ? 'focus:ring-blue-400' : 'focus:ring-purple-400'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button 
                onClick={handleSearch} disabled={loading} 
                className={`w-full text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-md ${activeTab === 'student' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : "ค้นหารายชื่อ"}
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
              ) : activeTab === 'student' ? (
                students.map(s => (
                  <button key={s.user_id} onClick={() => selectStudent(s)} className={`w-full p-4 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${selectedStudent?.user_id === s.user_id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-transparent bg-white hover:border-gray-200'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600 shrink-0"><User size={18}/></div>
                      <div className="text-left overflow-hidden">
                        <p className="font-black text-sm truncate">น้อง{s.student_name}</p>
                        <p className="text-[10px] font-bold text-gray-400 truncate flex items-center gap-1"><Phone size={10}/> {s.phone}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className={`shrink-0 ${selectedStudent?.user_id === s.user_id ? 'text-blue-600' : 'text-gray-200'}`}/>
                  </button>
                ))
              ) : (
                tutors.map(t => (
                  <button key={t.id} onClick={() => selectTutor(t)} className={`w-full p-4 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${selectedTutor?.id === t.id ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-transparent bg-white hover:border-gray-200'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-purple-600 shrink-0"><Briefcase size={18}/></div>
                      <div className="text-left overflow-hidden">
                        <p className="font-black text-sm truncate">ครู{t.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 truncate flex items-center gap-1"><Phone size={10}/> {t.phone}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className={`shrink-0 ${selectedTutor?.id === t.id ? 'text-purple-600' : 'text-gray-200'}`}/>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ฝั่งขวา: การแก้ไข & แสดงข้อมูล */}
          <div className="lg:col-span-8">
            {/* 🎓 ฝั่งนักเรียน */}
            {activeTab === 'student' && selectedStudent && (
              <div className="space-y-6 animate-in fade-in duration-300 text-left">
                <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 mb-10">
                    <div>
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-md">Student Wallet</span>
                      <h2 className="text-4xl font-black text-gray-900">น้อง{selectedStudent.student_name}</h2>
                      <p className="text-gray-500 font-bold mt-2 text-sm flex items-center gap-2"><Phone size={14}/> {selectedStudent.phone}</p>
                    </div>
                    <button onClick={handleUpdate} disabled={isSaving} className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg active:scale-95 disabled:bg-gray-300 shrink-0">
                      {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />} บันทึกค่าใหม่
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {walletFields.map((field) => (
                      <div key={field.key} className={`${field.color} p-6 rounded-[2rem] border flex flex-col gap-3 relative overflow-hidden text-left`}>
                        {field.key === 'marketing_points' && <Star size={64} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />}
                        <label className="text-[10px] font-black uppercase tracking-wider opacity-80 z-10">{field.label}</label>
                        <div className="flex items-end gap-2 z-10">
                          <input 
                            type="number" 
                            step={field.key === 'marketing_points' ? "1" : "0.5"} 
                            value={editValues[field.key] ?? 0} 
                            onChange={(e) => setEditValues({...editValues, [field.key]: parseFloat(e.target.value) || 0})} 
                            className="bg-white/60 w-full text-3xl font-black px-4 py-2 rounded-xl border-2 border-transparent focus:border-white focus:bg-white transition-all outline-none" 
                          />
                          <span className="mb-3 font-black opacity-40 text-sm uppercase">{field.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 💼 ฝั่งติวเตอร์ */}
            {activeTab === 'tutor' && selectedTutor && (
              <div className="space-y-6 animate-in fade-in duration-300 text-left">
                
                {/* แก้ไขแต้มร้านค้าของติวเตอร์ */}
                <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 mb-10">
                    <div>
                      <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-md">Tutor Points (Affiliate Wallets)</span>
                      <h2 className="text-4xl font-black text-gray-900">ครู{selectedTutor.name}</h2>
                      <p className="text-gray-500 font-bold mt-2 text-sm flex items-center gap-2"><Phone size={14}/> {selectedTutor.phone}</p>
                    </div>
                    <button onClick={handleUpdate} disabled={isSaving} className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-purple-700 shadow-lg active:scale-95 disabled:bg-gray-300 shrink-0">
                      {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />} บันทึกแต้ม
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-[2.5rem] border border-purple-100 flex flex-col gap-3 relative overflow-hidden">
                    <Star size={100} className="absolute -right-10 -bottom-10 opacity-5 text-purple-600 rotate-12" />
                    <label className="text-xs font-black uppercase tracking-widest text-purple-600 z-10">แต้มร้านค้าติวเตอร์ (อ้างอิงจาก affiliate_wallets)</label>
                    <div className="flex items-end gap-3 z-10 w-full md:w-1/2">
                      <input 
                        type="number" step="1"
                        value={editValues.points_balance ?? 0} // ✨ แก้ไขเป็น points_balance
                        onChange={(e) => setEditValues({...editValues, points_balance: parseInt(e.target.value) || 0})} // ✨ แก้ไขเป็น points_balance
                        className="bg-white w-full text-5xl font-black px-6 py-4 rounded-2xl border-2 border-purple-100 focus:border-purple-400 transition-all outline-none text-purple-900"
                      />
                      <span className="mb-4 font-black text-purple-300 text-lg uppercase">แต้ม</span>
                    </div>
                  </div>
                </div>

                {/* สายโยงผู้แนะนำ (Referral Tree) */}
                <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Network size={24}/></div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">สายโยงรหัสผู้แนะนำ</h3>
                      <p className="text-xs font-bold text-gray-400">รายชื่อผู้ใช้ที่สมัครผ่านรหัสของครู{selectedTutor.name}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100">
                    {referralTree.length === 0 ? (
                      <div className="text-center py-10">
                        <Users className="text-gray-300 mx-auto mb-3" size={48} />
                        <p className="text-gray-400 font-bold">ยังไม่มีผู้สมัครผ่านรหัสแนะนำนี้</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {referralTree.map((user, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-black text-gray-900 text-sm leading-tight">{user.full_name || 'ไม่ระบุชื่อ'}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center gap-1">
                                  <Phone size={10} /> {user.phone || 'ไม่ระบุเบอร์'}
                                </p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black uppercase rounded-lg">
                              {user.role === 'student' ? 'นักเรียน' : user.role === 'tutor' ? 'ติวเตอร์' : user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* หน้าต่างว่างตอนยังไม่ได้เลือก */}
            {!selectedStudent && !selectedTutor && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-10 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="w-32 h-32 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-6 rotate-3">
                  {activeTab === 'student' ? <Wallet className="text-gray-300" size={64} /> : <Network className="text-gray-300" size={64} />}
                </div>
                <h3 className="text-2xl font-black text-gray-400 mb-2">
                  กรุณาเลือก {activeTab === 'student' ? 'นักเรียน' : 'ติวเตอร์'} จากรายชื่อ
                </h3>
                <p className="text-sm text-gray-400 font-bold">เพื่อจัดการข้อมูลผ่านระบบหลังบ้าน</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
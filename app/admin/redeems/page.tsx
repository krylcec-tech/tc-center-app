'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Gift, CheckCircle, Loader2, ArrowLeft, Package, Users, GraduationCap, Calendar, Mail, Search, X
} from 'lucide-react';
import Link from 'next/link';

export default function AdminRedeemPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // State สำหรับเลือกวันที่
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // ✨ State สำหรับคำค้นหา (Search)
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchRedeems(); }, [startDate, endDate]); // โหลดใหม่เมื่อเปลี่ยนวันที่

  const fetchRedeems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('redeem_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate) query = query.gte('created_at', `${startDate}T00:00:00`);
      if (endDate) query = query.lte('created_at', `${endDate}T23:59:59`);

      const { data: redeems, error: redeemError } = await query;

      if (redeemError) throw redeemError;

      if (redeems && redeems.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');
        const { data: rewards } = await supabase.from('rewards').select('id, name, points_cost, target_group');
        const { data: studentWallets } = await supabase.from('student_wallets').select('user_id, student_name');
        const { data: tutors } = await supabase.from('tutors').select('user_id, name, email');

        const infoMap = new Map();
        profiles?.forEach(p => infoMap.set(p.id, { name: p.full_name, email: p.email }));
        studentWallets?.forEach(sw => {
          const existing = infoMap.get(sw.user_id);
          infoMap.set(sw.user_id, { ...existing, name: sw.student_name });
        });
        tutors?.forEach(t => {
          const existing = infoMap.get(t.user_id);
          infoMap.set(t.user_id, { name: t.name, email: t.email || existing?.email });
        });

        const formatted = redeems.map(item => {
          const reward = rewards?.find(r => r.id === item.reward_id);
          const userData = infoMap.get(item.user_id) || { name: 'ไม่ทราบชื่อ', email: '-' };
          
          return {
            ...item,
            display_name: userData.name,
            display_email: userData.email, 
            reward_info: reward || { name: 'รายการทั่วไป', points_cost: 0, target_group: 'N/A' }
          };
        });
        setRequests(formatted);
      } else {
        setRequests([]);
      }
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!confirm(`ยืนยันการดำเนินการสำเร็จเรียบร้อย?`)) return;
    setProcessing(id);
    try {
      const { error } = await supabase
        .from('redeem_requests')
        .update({ status: status })
        .eq('id', id);

      if (error) throw error;
      fetchRedeems();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // ✨ ฟังก์ชันที่เพิ่มใหม่: กรองข้อมูลจากคำค้นหา (ชื่อ หรือ อีเมล)
  const filteredRequests = requests.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = item.display_name?.toLowerCase().includes(searchLower);
    const emailMatch = item.display_email?.toLowerCase().includes(searchLower);
    return nameMatch || emailMatch;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-left flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <Link href="/admin" className="text-gray-400 font-black text-[10px] uppercase mb-4 flex items-center gap-2 hover:text-blue-600 w-max">
              <ArrowLeft size={14}/> Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">จัดการการแลกรางวัล <Gift className="text-orange-500" size={32} /></h1>
            <p className="text-gray-500 font-bold mt-2 text-sm">ตรวจสอบและยืนยันการแลกของรางวัล</p>
          </div>

          {/* แถบเครื่องมือค้นหาและกรองวันที่ */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            
            {/* ✨ ช่องค้นหา (Search Box) */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="ค้นหาจากชื่อ หรือ อีเมล..." 
                className="w-full pl-9 pr-8 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:border-blue-400 outline-none shadow-sm transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                  <X size={14}/>
                </button>
              )}
            </div>

            {/* ช่องเลือกวันที่ */}
            <div className="flex w-full sm:w-auto flex-wrap items-center justify-center gap-2 bg-white p-2 px-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-gray-400 uppercase hidden md:inline">กรองวันที่:</span>
              </div>
              <input 
                type="date" 
                className="bg-gray-50 text-xs font-bold px-2 py-1.5 rounded-lg outline-none border border-transparent focus:border-blue-400 transition-colors"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-gray-300 text-xs font-bold">-</span>
              <input 
                type="date" 
                className="bg-gray-50 text-xs font-bold px-2 py-1.5 rounded-lg outline-none border border-transparent focus:border-blue-400 transition-colors"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {(startDate || endDate) && (
                <button onClick={() => {setStartDate(''); setEndDate('');}} className="text-[10px] font-black text-red-500 hover:underline px-1">ล้าง</button>
              )}
            </div>
            
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase">วันที่ / ผู้แลก</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase">ของรางวัล & ประเภท</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase text-center">จัดการสถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-20 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                      <Search size={32} className="text-gray-200" />
                      <span className="font-bold">
                        {searchTerm || startDate || endDate ? 'ไม่พบรายการที่ค้นหา' : 'ไม่มีรายการแลกรางวัลในขณะนี้'}
                      </span>
                    </td>
                  </tr>
                ) : filteredRequests.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="p-6">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">
                        {new Date(item.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="font-black text-gray-900 leading-none">{item.display_name}</p>
                      <p className="text-[11px] text-blue-500 font-bold flex items-center gap-1 mt-1">
                        <Mail size={10} /> {item.display_email}
                      </p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Package size={14} className="text-blue-500" />
                        <p className="font-black text-gray-800">{item.reward_info?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600 font-black text-xs">{item.reward_info?.points_cost?.toLocaleString()} pts</span>
                        {item.reward_info?.target_group === 'TUTOR' ? (
                          <span className="bg-purple-100 text-purple-600 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1"><Users size={10}/> TUTOR</span>
                        ) : (
                          <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1"><GraduationCap size={10}/> STUDENT</span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      {item.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                          disabled={processing === item.id}
                          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-blue-700 transition-all mx-auto flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {processing === item.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          ยืนยันจ่ายแล้ว
                        </button>
                      ) : (
                        <div className="flex items-center justify-center text-green-500 gap-1 font-black text-xs bg-green-50 w-max mx-auto px-4 py-2 rounded-full border border-green-100">
                          <CheckCircle size={14} /> ดำเนินการสำเร็จ
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
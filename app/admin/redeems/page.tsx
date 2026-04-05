'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Gift, CheckCircle, Loader2, ArrowLeft, Package
} from 'lucide-react';
import Link from 'next/link';

export default function AdminRedeemPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchRedeems(); }, []);

  const fetchRedeems = async () => {
    setLoading(true);
    try {
      // 1. ดึงรายการแลกรางวัลทั้งหมด
      const { data: redeems, error: redeemError } = await supabase
        .from('redeem_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (redeemError) throw redeemError;

      if (redeems && redeems.length > 0) {
        // 2. ดึงข้อมูล Profiles และ Rewards มาทั้งหมดเพื่อเตรียมประกอบร่าง
        const { data: profiles } = await supabase.from('profiles').select('id, full_name');
        const { data: rewards } = await supabase.from('rewards').select('id, title, points_required');

        // 3. ประกอบร่างข้อมูลในโค้ด (Manual Join)
        const formatted = redeems.map(item => {
          const profile = profiles?.find(p => p.id === item.user_id);
          const reward = rewards?.find(r => r.id === item.reward_id);
          return {
            ...item,
            profiles: profile || { full_name: 'ไม่ทราบชื่อ' },
            rewards: reward || { title: 'รายการทั่วไป', points_required: 0 }
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
    if (!confirm(`ยืนยันการดำเนินการ?`)) return;
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900 text-left">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <Link href="/admin" className="text-gray-400 font-black text-[10px] uppercase mb-4 flex items-center gap-2 hover:text-blue-600 w-max">
            <ArrowLeft size={14}/> Dashboard
          </Link>
          <h1 className="text-4xl font-black flex items-center gap-3">จัดการการแลกรางวัล <Gift className="text-orange-500" /></h1>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase text-left">ผู้แลก</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase text-left">ของรางวัล</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-20 text-center text-gray-400 font-bold text-left">ไม่มีรายการแลกรางวัลในขณะนี้</td>
                  </tr>
                ) : requests.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-all text-left">
                    <td className="p-6 text-left">
                      <p className="font-black text-gray-900 text-left">{item.profiles?.full_name}</p>
                      <p className="text-[10px] text-gray-400 text-left">ID: {item.user_id?.slice(0,8)}...</p>
                    </td>
                    <td className="p-6 text-left">
                      <div className="flex items-center gap-2 text-left">
                        <Package size={14} className="text-blue-500" />
                        <p className="font-black text-gray-800 text-left">{item.rewards?.title}</p>
                      </div>
                      <p className="text-orange-600 font-black text-xs text-left">{item.rewards?.points_required?.toLocaleString()} pts</p>
                    </td>
                    <td className="p-6 text-center">
                      {item.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                          disabled={processing === item.id}
                          className="bg-blue-600 text-white px-5 py-2 rounded-xl font-black text-xs hover:bg-blue-700 transition-all mx-auto block shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {processing === item.id ? <Loader2 size={14} className="animate-spin" /> : 'ยืนยันจ่ายแล้ว'}
                        </button>
                      ) : (
                        <div className="flex items-center justify-center text-green-500 gap-1 font-black text-xs">
                          <CheckCircle size={14} /> สำเร็จแล้ว
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
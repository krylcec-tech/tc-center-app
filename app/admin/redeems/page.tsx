'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Gift, CheckCircle, XCircle, Loader2, ArrowLeft, 
  ExternalLink, User, Wallet, Search, Clock
} from 'lucide-react';
import Link from 'next/link';

export default function AdminRedeemPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchRedeems(); }, []);

  const fetchRedeems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('affiliate_transactions')
      .select(`
        *,
        affiliate_wallets (
          user_id,
          profiles ( full_name, referral_code )
        )
      `)
      .eq('type', 'REDEEM') // ดึงเฉพาะรายการถอน/แลกของ
      .order('created_at', { ascending: false });
    
    setRequests(data || []);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${status}?`)) return;
    setProcessing(id);
    const { error } = await supabase
      .from('affiliate_transactions')
      .update({ status: status }) // ตารางนี้ควรมี column status
      .eq('id', id);

    if (!error) {
      alert('อัปเดตสำเร็จ!');
      fetchRedeems();
    }
    setProcessing(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <Link href="/admin" className="text-gray-400 font-black text-[10px] uppercase mb-4 flex items-center gap-2 hover:text-blue-600 w-max"><ArrowLeft size={14}/> Dashboard</Link>
          <h1 className="text-4xl font-black flex items-center gap-3">จัดการการแลกรางวัล <Gift className="text-orange-500" /></h1>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase">ผู้แลก</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase">รายการ / จำนวน</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                  <td className="p-6">
                    <p className="font-black text-gray-900">{item.affiliate_wallets?.profiles?.full_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Code: {item.affiliate_wallets?.profiles?.referral_code}</p>
                  </td>
                  <td className="p-6">
                    <p className="font-black text-gray-800">{item.description}</p>
                    <p className="text-red-500 font-black">-{item.amount} pts</p>
                  </td>
                  <td className="p-6 text-center">
                    <button onClick={() => handleUpdateStatus(item.id, 'COMPLETED')} className="bg-green-50 text-green-600 px-4 py-2 rounded-xl font-black text-xs hover:bg-green-600 hover:text-white transition-all">จ่ายแล้ว</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
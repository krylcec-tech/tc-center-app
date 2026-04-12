'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Check, X, Loader2, ArrowLeft, Search, Landmark, 
  Clock, User, DollarSign, AlertCircle, CheckCircle2, Trash2, GraduationCap, Users
} from 'lucide-react';
import Link from 'next/link';

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'COMPLETED' | 'REJECTED' | 'ALL'>('PENDING');
  const [userTypeFilter, setUserTypeFilter] = useState<'student' | 'tutor'>('student'); 
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, userTypeFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase.from('withdraw_requests').select('*');
      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      const { data: withdrawData, error: withdrawError } = await query.order('created_at', { ascending: false });
      if (withdrawError) throw withdrawError;

      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');
      const { data: tutors } = await supabase.from('tutors').select('user_id, name');
      const { data: studentWallets } = await supabase.from('student_wallets').select('user_id, student_name');

      const enrichedData = (withdrawData || []).map(req => {
        const profile = profiles?.find(p => p.id === req.user_id);
        const tutorInfo = tutors?.find(t => t.user_id === req.user_id);
        const studentInfo = studentWallets?.find(s => s.user_id === req.user_id);
        const displayName = tutorInfo?.name || studentInfo?.student_name || profile?.full_name || 'ไม่ระบุชื่อ';
        const role = tutorInfo ? 'tutor' : 'student';
        return { ...req, displayName, email: profile?.email, userRole: role };
      });

      setRequests(enrichedData.filter(item => item.userRole === userTypeFilter));
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('ยืนยันว่าโอนเงินเรียบร้อยแล้ว?')) return;
    setProcessingId(id);
    try {
      const { error } = await supabase.from('withdraw_requests').update({ status: 'COMPLETED', updated_at: new Date() }).eq('id', id);
      if (error) throw error;
      alert('✅ บันทึกสถานะสำเร็จ');
      fetchRequests();
    } catch (err: any) { alert(err.message); } finally { setProcessingId(null); }
  };

  // ✅ ฟังก์ชัน handleReject แบบแก้ไขสมบูรณ์: คืนเงิน + เปลี่ยนสถานะ + หายจากหน้าจอ
  const handleReject = async (request: any) => {
    const reason = prompt('ระบุเหตุผลที่ปฏิเสธ (ผู้ถอนจะเห็นข้อความนี้):');
    if (reason === null || reason.trim() === '') return;

    setProcessingId(request.id);
    try {
      // 1. คืนเงินเข้า sales_balance ให้ถูกตาราง
      const table = request.userRole === 'tutor' ? 'affiliate_wallets' : 'student_wallets';
      const { data: wallet, error: walletError } = await supabase.from(table).select('sales_balance').eq('user_id', request.user_id).single();
      
      if (walletError) throw new Error("ไม่สามารถเข้าถึงข้อมูลกระเป๋าเงินได้");

      const { error: refundError } = await supabase.from(table)
        .update({ sales_balance: (wallet?.sales_balance || 0) + request.amount })
        .eq('user_id', request.user_id);
      
      if (refundError) throw refundError;

      // 2. อัปเดตสถานะคำขอในฐานข้อมูลเป็น REJECTED (จุดสำคัญที่ทำให้ปุ่มหาย)
      const { error: requestUpdateError } = await supabase
        .from('withdraw_requests')
        .update({ 
          status: 'REJECTED', 
          reject_reason: reason,
          updated_at: new Date()
        })
        .eq('id', request.id);

      if (requestUpdateError) throw requestUpdateError;

      alert('❌ ปฏิเสธและคืนเงินเข้ากระเป๋าให้ผู้ขายเรียบร้อยครับ');
      
      // 3. ดึงข้อมูลใหม่จาก DB ทันทีเพื่อให้รายการหายไปจากหน้า PENDING
      fetchRequests();

    } catch (err: any) { 
      alert("Error: " + err.message); 
    } finally { 
      setProcessingId(null); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-left text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <Link href="/admin" className="text-gray-400 font-black text-xs uppercase mb-2 flex items-center gap-2 hover:text-blue-600 w-max group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> กลับหน้า Admin
            </Link>
            <h1 className="text-4xl font-black tracking-tight">Withdrawals 💸</h1>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border w-full md:w-auto">
            <button onClick={() => setUserTypeFilter('student')} className={`flex-1 md:w-36 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${userTypeFilter === 'student' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-400'}`}><Users size={16}/> นักเรียน</button>
            <button onClick={() => setUserTypeFilter('tutor')} className={`flex-1 md:w-36 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${userTypeFilter === 'tutor' ? 'bg-purple-50 text-purple-600 shadow-sm' : 'text-gray-400'}`}><GraduationCap size={16}/> ติวเตอร์</button>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[{id:'PENDING', l:'รอโอน'}, {id:'COMPLETED', l:'โอนแล้ว'}, {id:'REJECTED', l:'ปฏิเสธ'}, {id:'ALL', l:'ทั้งหมด'}].map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${statusFilter === f.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-400 border'}`}>{f.l}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">ไม่พบรายการคำขอของ{userTypeFilter === 'tutor' ? 'ติวเตอร์' : 'นักเรียน'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map(req => (
              <div key={req.id} className={`bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 transition-all`}>
                <div className="flex items-start gap-5 flex-1 w-full">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${userTypeFilter === 'tutor' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}><DollarSign size={28}/></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black">฿{req.amount.toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${req.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{req.status}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mt-1">{req.displayName}</p>
                    <p className="text-[10px] font-bold text-gray-400">{req.email} • {new Date(req.created_at).toLocaleString('th-TH')}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border w-full md:w-72">
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-1">บัญชีปลายทาง</p>
                   <p className="text-xs font-black text-blue-600">{req.bank_info?.bank}</p>
                   <p className="text-sm font-black tracking-widest">{req.bank_info?.number}</p>
                   <p className="text-xs font-bold text-slate-500">{req.bank_info?.name}</p>
                </div>
                {req.status === 'PENDING' && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => handleReject(req)} disabled={processingId === req.id} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
                    <button onClick={() => handleApprove(req.id)} disabled={processingId === req.id} className={`flex-1 md:w-32 py-4 rounded-xl font-black text-xs text-white shadow-lg ${userTypeFilter === 'tutor' ? 'bg-purple-600' : 'bg-orange-600'}`}>โอนเงินแล้ว</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
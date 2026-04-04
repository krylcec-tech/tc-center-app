'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, XCircle, Clock, Loader2, 
  ArrowLeft, Receipt, User, BookOpen, ExternalLink, Wallet, Eye, X,
  TrendingUp, AlertCircle, Calendar // ✨ เพิ่มไอคอน Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  // ✨ State สำหรับการกรองวันที่ (ค่าเริ่มต้นคือวันนี้)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({ selectedDayTotal: 0, pendingCount: 0 });

  useEffect(() => {
    fetchOrders();
  }, [filterDate]); // 🔄 เมื่อเปลี่ยนวันที่ ให้ดึงข้อมูลใหม่ทันที

  const fetchOrders = async () => {
    setLoading(true);
    
    // กรองข้อมูลตามวันที่เลือก (Start of day - End of day)
    const startOfDay = `${filterDate}T00:00:00.000Z`;
    const endOfDay = `${filterDate}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from('course_orders')
      .select(`
        *,
        student_wallets ( student_name ),
        courses ( title, hours_count, referral_points, target_wallet_type )
      `)
      .gte('created_at', startOfDay) // ตั้งแต่เริ่มวัน
      .lte('created_at', endOfDay)   // จนถึงจบวัน
      .order('created_at', { ascending: false });
    
    if (data) {
      setOrders(data);
      
      // คำนวณยอดเงินของวันที่เลือก
      const total = data
        .filter(o => o.status === 'SUCCESS')
        .reduce((sum, o) => sum + Number(o.amount_paid), 0);
      
      const pending = data.filter(o => o.status === 'PENDING').length;
      setStats({ selectedDayTotal: total, pendingCount: pending });
    }
    setLoading(false);
  };

  const handleApprove = async (order: any) => {
    const walletLabel = order.courses?.target_wallet_type?.replace('_', ' ').toUpperCase() || 'N/A';
    if (!confirm(`ยืนยันการโอนเงิน?\nคอร์ส: ${order.courses?.title}\nจะเติมเข้ากระเป๋า: ${walletLabel}\nจำนวน: ${order.courses?.hours_count} ชม.`)) return;

    setProcessing(order.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: approveError } = await supabase.rpc('approve_course_order_v2', { 
        target_order_id: order.id,
        admin_user_id: user?.id
      });

      if (approveError) throw approveError;

      if (order.courses.referral_points > 0) {
        await supabase.rpc('distribute_points_upline', { 
          buyer_id: order.student_id, 
          base_points: order.courses.referral_points 
        });
      }

      alert('อนุมัติสำเร็จ! 🎉');
      fetchOrders();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = prompt("ระบุเหตุผลที่ปฏิเสธ:");
    if (reason === null) return;

    setProcessing(orderId);
    try {
      const { error } = await supabase
        .from('course_orders')
        .update({ status: 'REJECTED', admin_note: reason })
        .eq('id', orderId);

      if (error) throw error;
      alert("ปฏิเสธรายการแล้ว");
      fetchOrders();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      
      {/* Slip Preview Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedSlip(null)}>
          <div className="relative max-w-sm w-full bg-white rounded-[2.5rem] p-2 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
             <button onClick={() => setSelectedSlip(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black transition-all"><X size={20}/></button>
             <img src={selectedSlip} alt="slip" className="w-full h-auto rounded-[2rem]" />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <Link href="/admin" className="text-gray-400 font-black text-[10px] uppercase mb-4 flex items-center gap-2 hover:text-blue-600 transition-all w-max tracking-widest leading-none">
              <ArrowLeft size={14}/> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
              <Receipt className="text-blue-600" size={40} /> จัดการรายได้
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* ✨ ตัวเลือกวันที่ (Date Picker) */}
            <div className="flex-1 lg:flex-none bg-white p-3 px-5 rounded-[2rem] border border-blue-100 shadow-sm flex items-center gap-3">
               <Calendar className="text-blue-500" size={18}/>
               <input 
                  type="date" 
                  className="outline-none font-black text-gray-700 bg-transparent text-sm"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
               />
            </div>

            <div className="flex-1 lg:flex-none bg-white p-3 px-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
               <div className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><TrendingUp size={16}/></div>
               <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ยอดขายของวันที่เลือก</p>
                  <p className="text-lg font-black text-gray-900 leading-none">฿{stats.selectedDayTotal.toLocaleString()}</p>
               </div>
            </div>
            <div className="flex-1 lg:flex-none bg-white p-3 px-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
               <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><AlertCircle size={16}/></div>
               <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">รอตรวจ (ในวัน)</p>
                  <p className="text-lg font-black text-gray-900 leading-none">{stats.pendingCount}</p>
               </div>
            </div>
          </div>
        </header>

        {/* Table Section (เหมือนเดิมแต่ดึงข้อมูลตาม Filter) */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-900">
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">ผู้ซื้อ / เวลา</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">คอร์ส & กระเป๋า</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">สลิป</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">สถานะ</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-900">
                {orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-gray-50/30 transition-all">
                    <td className="p-8">
                      <p className="font-black text-gray-900 text-lg leading-tight">น้อง{order.student_wallets?.student_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">
                         {new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </p>
                    </td>
                    <td className="p-8">
                      <p className="font-black text-gray-800 mb-1 truncate max-w-[180px] leading-tight">{order.courses?.title}</p>
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 w-max">
                        <Wallet size={10}/> {order.courses?.target_wallet_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-8 text-center text-gray-900">
                      {order.slip_url && (
                        <button onClick={() => setSelectedSlip(order.slip_url)} className="text-blue-500 hover:scale-110 transition-transform inline-block p-2 bg-blue-50 rounded-xl">
                          <Eye size={20}/>
                        </button>
                      )}
                    </td>
                    <td className="p-8 text-center text-gray-900">
                      <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase border ${
                        order.status === 'PENDING' ? 'bg-orange-50 text-orange-500 border-orange-100' : 
                        order.status === 'SUCCESS' ? 'bg-green-50 text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100'
                      }`}>
                        {order.status === 'PENDING' ? 'รอตรวจ' : order.status === 'SUCCESS' ? 'สำเร็จ' : 'ปฏิเสธ'}
                      </span>
                    </td>
                    <td className="p-8 text-center text-gray-900">
                      {order.status === 'PENDING' && (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleApprove(order)} disabled={processing === order.id} className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-md">
                             {processing === order.id ? <Loader2 className="animate-spin" size={14}/> : 'อนุมัติ'}
                          </button>
                          <button onClick={() => handleReject(order.id)} className="bg-red-50 text-red-500 p-2.5 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                             <XCircle size={18}/>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="p-24 text-center">
                  <Calendar size={64} className="text-gray-100 mx-auto mb-4"/>
                  <p className="text-gray-400 font-black text-lg">ไม่พบรายการแจ้งโอนในวันที่ {filterDate}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
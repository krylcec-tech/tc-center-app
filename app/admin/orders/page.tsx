'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, XCircle, Clock, Loader2, 
  ArrowLeft, Receipt, User, BookOpen, ExternalLink, Wallet, Eye, X 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // ✨ State สำหรับดูรูปสลิปแบบไม่ต้องเปิดแท็บใหม่
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('course_orders')
      .select(`
        *,
        student_wallets ( student_name ),
        courses ( title, hours_count, referral_points, target_wallet_type )
      `)
      .order('created_at', { ascending: false });
    
    setOrders(data || []);
    setLoading(false);
  };

  const handleApprove = async (order: any) => {
    const walletLabel = order.courses?.target_wallet_type?.replace('_', ' ').toUpperCase() || 'N/A';
    
    if (!confirm(`ยืนยันการโอนเงิน?\nคอร์ส: ${order.courses?.title}\nจะเติมเข้ากระเป๋า: ${walletLabel}\nจำนวน: ${order.courses?.hours_count} ชม.`)) return;

    setProcessing(order.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. เรียกใช้สมองกล SQL (RPC) ตัวเทพที่คุณสร้างไว้
      const { error: approveError } = await supabase.rpc('approve_course_order_v2', { 
        target_order_id: order.id,
        admin_user_id: user?.id
      });

      if (approveError) throw approveError;

      // 2. แจกแต้มสายงาน 100 -> 10 -> 1
      if (order.courses.referral_points > 0) {
        await supabase.rpc('distribute_points_upline', { 
          buyer_id: order.student_id, 
          base_points: order.courses.referral_points 
        });
      }

      alert('อนุมัติสำเร็จ! ระบบเติมชั่วโมงเข้ากระเป๋าและแจกแต้มให้สายงานเรียบร้อย 🎉');
      fetchOrders();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm("คุณต้องการปฏิเสธรายการแจ้งโอนนี้ใช่หรือไม่?")) return;
    
    const { error } = await supabase
      .from('course_orders')
      .update({ status: 'REJECTED' }) // หรือสถานะที่คุณกำหนดไว้
      .eq('id', orderId);

    if (!error) {
      alert("ปฏิเสธรายการเรียบร้อย");
      fetchOrders();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      
      {/* --- ✨ Slip Preview Modal --- */}
      {selectedSlip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedSlip(null)}>
          <div className="relative max-w-sm w-full bg-white rounded-[2.5rem] p-2 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
             <button onClick={() => setSelectedSlip(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black transition-all">
                <X size={20}/>
             </button>
             <img src={selectedSlip} alt="slip" className="w-full h-auto rounded-[2rem]" />
             <div className="p-4 text-center">
                <p className="text-gray-400 font-bold text-xs">ตรวจสอบความถูกต้องของวันที่และยอดเงิน</p>
             </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <Link href="/admin" className="text-gray-400 font-black text-[10px] uppercase mb-4 flex items-center gap-2 hover:text-blue-600 transition-all w-max tracking-widest">
              <ArrowLeft size={14}/> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
              <Receipt className="text-blue-600" size={40} /> รายการแจ้งโอน
            </h1>
            <p className="text-gray-500 font-bold mt-1">ยืนยันการชำระเงินเพื่อเติมชั่วโมงเรียนเข้า 6 กระเป๋า</p>
          </div>

          <div className="bg-blue-50 px-6 py-4 rounded-[2rem] border border-blue-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                <Clock size={24}/>
             </div>
             <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">รอตรวจสอบ</p>
                <p className="text-2xl font-black text-blue-700">{orders.filter(o => o.status === 'PENDING').length}</p>
             </div>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">ผู้ซื้อ / วันเวลา</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">คอร์ส & กระเป๋าปลายทาง</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">หลักฐาน</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">สถานะ</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-gray-50/30 transition-all">
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                           <User size={20}/>
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-lg">น้อง{order.student_wallets?.student_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{new Date(order.created_at).toLocaleString('th-TH')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <p className="font-black text-gray-800 mb-2">{order.courses?.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 shadow-sm shadow-blue-100">
                            <Wallet size={10}/> {order.courses?.target_wallet_type?.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                           ฿{order.amount_paid.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-8">
                      {order.slip_url ? (
                        <button 
                          onClick={() => setSelectedSlip(order.slip_url)}
                          className="flex items-center gap-2 text-[11px] font-black text-blue-500 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-2xl transition-all"
                        >
                          <Eye size={14}/> ดูสลิป
                        </button>
                      ) : <span className="text-gray-300 text-xs italic">ไม่มีหลักฐาน</span>}
                    </td>
                    <td className="p-8">
                      {order.status === 'PENDING' ? (
                        <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 w-max">
                          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span> รอตรวจ
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase bg-green-50 px-4 py-2 rounded-2xl border border-green-100 w-max">
                          <CheckCircle size={14}/> สำเร็จ
                        </div>
                      )}
                    </td>
                    <td className="p-8">
                      {order.status === 'PENDING' && (
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleApprove(order)}
                            disabled={processing === order.id}
                            className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:bg-gray-200"
                          >
                            {processing === order.id ? <Loader2 className="animate-spin" size={14}/> : 'อนุมัติ'}
                          </button>
                          <button 
                            onClick={() => handleReject(order.id)}
                            className="bg-white border border-red-100 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <XCircle size={20}/>
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
                  <Receipt size={64} className="text-gray-100 mx-auto mb-4"/>
                  <p className="text-gray-400 font-black text-lg">ยังไม่มีรายการแจ้งโอนเข้ามาในขณะนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
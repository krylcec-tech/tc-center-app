'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, XCircle, Clock, Loader2, 
  ArrowLeft, Receipt, User, BookOpen, ExternalLink, Wallet 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    // ✨ ดึงข้อมูลเพิ่ม: target_wallet_type เพื่อโชว์ให้ Admin เห็นว่าจะเติมเข้าช่องไหน
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

  // 🔥 ฟังก์ชันใหม่: เรียกใช้ RPC approve_course_order_v2 เพื่อเติมเงินเข้า 6 กระเป๋า
  const handleApprove = async (order: any) => {
    const walletLabel = order.courses?.target_wallet_type?.replace('_', ' ').toUpperCase() || 'N/A';
    
    if (!confirm(`ยืนยันการโอนเงิน?\nคอร์ส: ${order.courses?.title}\nจะเติมเข้ากระเป๋า: ${walletLabel}\nจำนวน: ${order.courses?.hours_count} ชม.`)) return;

    setProcessing(order.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. เรียกใช้สมองกล SQL ตัวใหม่ที่เราสร้างไว้ (จัดให้ครบทั้งหักลบและเติมเงิน)
      const { error: approveError } = await supabase.rpc('approve_course_order_v2', { 
        target_order_id: order.id,
        admin_user_id: user?.id
      });

      if (approveError) throw approveError;

      // 2. 🚀 แจกแต้มสายงานทอดๆ 100 -> 10 -> 1 (คงเดิม)
      if (order.courses.referral_points > 0) {
        await supabase.rpc('distribute_points_upline', { 
          buyer_id: order.student_id, 
          base_points: order.courses.referral_points 
        });
      }

      alert('อนุมัติสำเร็จ! ชั่วโมงเรียนถูกเติมเข้ากระเป๋าที่ถูกต้อง และแจกแต้มเรียบร้อย 🎉');
      fetchOrders();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6 text-gray-900">
        
        <header>
          <Link href="/admin" className="text-gray-400 font-bold text-xs uppercase mb-4 flex items-center gap-2 hover:text-blue-600 w-max">
            <ArrowLeft size={16}/> กลับแผงควบคุม
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Receipt className="text-blue-600" size={32} /> รายการแจ้งโอนเงิน
          </h1>
          <p className="text-gray-500 font-bold mt-1">ตรวจสอบสลิปและอนุมัติชั่วโมงเรียนแยกตาม Tier</p>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-6 text-xs font-black text-gray-400 uppercase">วันที่ / ผู้ซื้อ</th>
                <th className="p-6 text-xs font-black text-gray-400 uppercase">คอร์ส / เติมเข้าช่อง</th>
                <th className="p-6 text-xs font-black text-gray-400 uppercase">หลักฐานสลิป</th>
                <th className="p-6 text-xs font-black text-gray-400 uppercase">สถานะ</th>
                <th className="p-6 text-xs font-black text-gray-400 uppercase text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-gray-900">น้อง{order.student_wallets?.student_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(order.created_at).toLocaleString('th-TH')}</p>
                  </td>
                  <td className="p-6">
                    <p className="font-bold text-gray-800 line-clamp-1">{order.courses?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                        {/* ✨ Badge แสดงกระเป๋าปลายทาง */}
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 border border-blue-100">
                            <Wallet size={10}/> {order.courses?.target_wallet_type?.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-black text-gray-400">฿{order.amount_paid.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    {order.slip_url ? (
                      <a href={order.slip_url} target="_blank" className="flex items-center gap-1 text-xs font-black text-blue-500 hover:text-blue-700 transition-colors">
                        <ExternalLink size={14}/> ดูสลิปโอนเงิน
                      </a>
                    ) : <span className="text-gray-300 text-xs italic">ไม่มีหลักฐาน</span>}
                  </td>
                  <td className="p-6">
                    {order.status === 'PENDING' ? (
                      <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1 rounded-full w-max border border-orange-100">
                        <Clock size={12}/>
                        <span className="text-[10px] font-black uppercase tracking-wider">รอตรวจ</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full w-max border border-green-100">
                        <CheckCircle size={12}/>
                        <span className="text-[10px] font-black uppercase tracking-wider">อนุมัติแล้ว</span>
                      </div>
                    )}
                  </td>
                  <td className="p-6">
                    {order.status === 'PENDING' && (
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleApprove(order)}
                          disabled={processing === order.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-100 font-black text-xs flex items-center gap-2 disabled:bg-gray-300"
                        >
                          {processing === order.id ? <Loader2 className="animate-spin" size={14}/> : 'อนุมัติ'}
                        </button>
                        <button className="bg-white border border-red-100 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
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
            <div className="p-20 text-center flex flex-col items-center">
                <Receipt size={48} className="text-gray-200 mb-4"/>
                <p className="text-gray-400 font-bold">ยังไม่มีรายการสั่งซื้อเข้ามาในระบบ</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
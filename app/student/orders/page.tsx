'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Receipt, Clock, CheckCircle2, XCircle, 
  ArrowLeft, Loader2, ExternalLink, ShoppingBag 
} from 'lucide-react';
import Link from 'next/link';

export default function StudentOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('course_orders')
        .select(`
          *,
          courses ( title, hours_count, image_url )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header>
          <Link href="/student" className="text-gray-400 font-black text-xs uppercase mb-4 flex items-center gap-2 hover:text-blue-600 w-max transition-all">
            <ArrowLeft size={16}/> กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Receipt className="text-blue-600" size={32} /> ประวัติการสั่งซื้อ
          </h1>
          <p className="text-gray-500 font-bold mt-1">ติดตามสถานะการเติมชั่วโมงเรียนของคุณ</p>
        </header>

        <div className="space-y-4">
          {orders.length > 0 ? orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                  {order.courses?.image_url?.[0] ? (
                    <img src={order.courses.image_url[0]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={24}/></div>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight">{order.courses?.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-blue-600 font-black text-sm">฿{order.amount_paid.toLocaleString()}</span>
                    <span className="text-gray-300 text-xs font-bold">|</span>
                    <span className="text-gray-400 text-xs font-bold">{new Date(order.created_at).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="flex flex-col md:items-end">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">สถานะรายการ</p>
                  {order.status === 'PENDING' && (
                    <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-black">
                      <Clock size={14} /> รอตรวจสอบสลิป
                    </div>
                  )}
                  {order.status === 'COMPLETED' && (
                    <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-black">
                      <CheckCircle2 size={14} /> เติมชั่วโมงสำเร็จ
                    </div>
                  )}
                  {order.status === 'REJECTED' && (
                    <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-black">
                      <XCircle size={14} /> ข้อมูลไม่ถูกต้อง
                    </div>
                  )}
                </div>
                
                {order.slip_url && (
                  <a href={order.slip_url} target="_blank" className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
                    <ExternalLink size={20} />
                  </a>
                )}
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
              <ShoppingBag className="mx-auto text-gray-200 mb-4" size={64} />
              <p className="text-gray-400 font-black text-xl">คุณยังไม่มีประวัติการสั่งซื้อ</p>
              <Link href="/student/courses" className="mt-4 inline-block text-blue-600 font-black hover:underline">ไปเลือกซื้อคอร์สแรกกันเลย!</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
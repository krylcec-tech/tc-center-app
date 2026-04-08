'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, XCircle, Clock, Loader2, 
  ArrowLeft, Receipt, User, BookOpen, ExternalLink, Wallet, Eye, X,
  TrendingUp, AlertCircle, Calendar, Search, Mail, Tag as TagIcon, Banknote, FileText
} from 'lucide-react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({ selectedDayTotal: 0, pendingCount: 0 });

  useEffect(() => {
    fetchOrders();
  }, [filterDate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const startOfDay = `${filterDate}T00:00:00.000Z`;
      const endOfDay = `${filterDate}T23:59:59.999Z`;

      const { data: ordersData, error: ordersError } = await supabase
        .from('course_orders')
        .select(`
          *,
          courses!course_id ( id, title, description, image_url, type, category, document_url, hours_count, referral_points, target_wallet_type, tags, price )
        `)
        .gte('created_at', startOfDay) 
        .lte('created_at', endOfDay)  
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData && ordersData.length > 0) {
        const studentIds = Array.from(new Set(ordersData.map(o => o.student_id)));
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds);

        const formatted = ordersData.map(order => ({
          ...order,
          profiles: profilesData?.find(p => p.id === order.student_id) || { full_name: 'ไม่ทราบชื่อ', email: '-' }
        }));

        setOrders(formatted);

        const total = formatted
          .filter(o => o.status === 'SUCCESS')
          .reduce((sum, o) => sum + Number(o.amount_paid), 0);
        const pending = formatted.filter(o => o.status === 'PENDING').length;
        setStats({ selectedDayTotal: total, pendingCount: pending });
      } else {
        setOrders([]);
        setStats({ selectedDayTotal: 0, pendingCount: 0 });
      }
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const studentName = order.profiles?.full_name?.toLowerCase() || '';
    const studentEmail = order.profiles?.email?.toLowerCase() || '';
    const courseTitle = order.courses?.title?.toLowerCase() || '';
    const searchLower = searchQuery.toLowerCase();
    return studentName.includes(searchLower) || studentEmail.includes(searchLower) || courseTitle.includes(searchLower);
  });

  const handleApprove = async (order: any) => {
    if (!confirm(`ยืนยันการอนุมัติออเดอร์: ${order.courses?.title || 'นี้'}?`)) return;
    setProcessing(order.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: approveError } = await supabase.rpc('approve_course_order_v2', { 
        target_order_id: order.id,
        admin_user_id: user?.id
      });
      if (approveError) throw approveError;

      if (order.courses?.type === 'book') {
        await supabase.from('user_books').insert([{
          user_id: order.student_id,
          title: order.courses.title,
          description: order.courses.description,
          subject: order.courses.category || 'ทั่วไป',
          level: 'ม.ปลาย', 
          source_type: 'SHOP',
          image_url: Array.isArray(order.courses.image_url) ? order.courses.image_url[0] : order.courses.image_url,
          document_url: order.courses.document_url
        }]);
      }
      alert('อนุมัติและส่งหนังสือเรียบร้อย 🎉');
      fetchOrders();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      {selectedSlip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedSlip(null)}>
          <div className="relative max-w-sm w-full bg-white rounded-[2.5rem] p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
             <button onClick={() => setSelectedSlip(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black transition-all"><X size={20}/></button>
             <img src={selectedSlip} alt="slip" className="w-full h-auto rounded-[2rem]" />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="text-left">
            <Link href="/admin" className="text-gray-400 font-black text-[10px] uppercase mb-4 flex items-center gap-2 hover:text-blue-600 w-max">
              <ArrowLeft size={14}/> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4 text-gray-900 text-left">
              <Receipt className="text-blue-600" size={40} /> จัดการรายได้
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:w-64 bg-white p-3 px-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-3">
               <Search className="text-gray-400" size={18}/>
               <input type="text" placeholder="ค้นชื่อ, Gmail หรือสินค้า..." className="outline-none font-bold text-gray-700 bg-transparent text-sm w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </div>
            <div className="bg-white p-3 px-5 rounded-[2rem] border border-blue-100 shadow-sm flex items-center gap-3">
               <Calendar className="text-blue-500" size={18}/>
               <input type="date" className="outline-none font-black text-gray-700 bg-transparent text-sm" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}/>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase">ผู้ซื้อ / Gmail</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase">รายละเอียดสินค้าที่ซื้อ</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase text-center">ยอดที่โอนมา</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase text-center">สลิป</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold">ไม่พบรายการข้อมูล</td></tr>
                ) : filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/30 transition-all">
                    <td className="p-8">
                      <p className="font-black text-gray-900 text-lg leading-tight text-left">{order.profiles?.full_name}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-blue-500">
                        <Mail size={12}/>
                        <p className="text-[11px] font-bold text-left">{order.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-2 mb-2">
                        {order.courses?.type === 'book' ? (
                          <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter border border-orange-200">
                            <BookOpen size={10}/> หนังสือ/ชีท
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter border border-blue-200">
                            <Clock size={10}/> คอร์สเรียน
                          </span>
                        )}
                        <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase">฿{order.courses?.price?.toLocaleString() || '0'} (ราคาเต็ม)</span>
                      </div>
                      <p className="font-black text-gray-800 text-base leading-tight mb-1 text-left">{order.courses?.title}</p>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mb-2 text-left italic">{order.courses?.description || 'ไม่มีคำอธิบาย'}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[9px] font-black flex items-center gap-1 uppercase">
                          <Wallet size={10}/> {order.courses?.target_wallet_type?.replace('_', ' ') || 'ทั่วไป'}
                        </span>
                        {/* ✅ แก้ไขจุดนี้: เช็กว่าเป็น Array ก่อนใช้ .map */}
                        {Array.isArray(order.courses?.tags) && order.courses?.tags.slice(0, 2).map((t: string) => (
                          <span key={t} className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-purple-100">#{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-2xl font-black text-green-600 leading-none">฿{Number(order.amount_paid).toLocaleString()}</span>
                        <span className="text-[9px] font-black text-gray-300 uppercase mt-2 tracking-widest">โอนสำเร็จ</span>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      {order.slip_url && <button onClick={() => setSelectedSlip(order.slip_url)} className="text-blue-500 p-2.5 bg-blue-50 rounded-2xl hover:scale-110 transition-transform shadow-sm border border-blue-100"><Eye size={20}/></button>}
                    </td>
                    <td className="p-8 text-center">
                      {order.status === 'PENDING' ? (
                        <button onClick={() => handleApprove(order)} disabled={processing === order.id} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                          {processing === order.id ? <Loader2 className="animate-spin" size={14}/> : 'อนุมัติรายการ'}
                        </button>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl text-[10px] font-black uppercase border ${order.status === 'SUCCESS' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                          {order.status === 'SUCCESS' ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                          {order.status === 'SUCCESS' ? 'สำเร็จแล้ว' : 'ปฏิเสธแล้ว'}
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
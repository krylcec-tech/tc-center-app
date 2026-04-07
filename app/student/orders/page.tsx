'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Receipt, Clock, CheckCircle2, XCircle, Loader2, 
  Search, BookOpen, Gift, LayoutGrid, List, ChevronRight, Info, X, ShoppingCart, Tag, Globe, MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function StudentOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-courses' | 'history' | 'rewards'>('my-courses');
  const [orders, setOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null); // สำหรับดูรายละเอียดคอร์ส

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. ดึงข้อมูลการสั่งซื้อทั้งหมด พร้อมข้อมูลคอร์ส
      const { data: ordersData } = await supabase
        .from('course_orders')
        .select(`
          *,
          courses (*)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      // 2. ดึงข้อมูลกระเป๋าแต้มสะสม
      const { data: walletData } = await supabase
        .from('affiliate_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setOrders(ordersData || []);
      setWallet(walletData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // กรองเฉพาะคอร์สที่ซื้อสำเร็จ และเป็นประเภท 'course'
  const myPurchasedCourses = orders
    .filter(o => o.status === 'SUCCESS' && o.courses?.type === 'course')
    .map(o => ({
      ...o.courses,
      order_date: o.created_at,
      image_url: Array.isArray(o.courses?.image_url) ? o.courses.image_url : (o.courses?.image_url ? [o.courses.image_url] : []),
      tags: Array.isArray(o.courses?.tags) ? o.courses.tags : []
    }));

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12 font-sans text-gray-900 pb-24">
      
      {/* --- ✨ Modal ดูรายละเอียดคอร์ส (เหมือนหน้าร้านค้า) --- */}
      {viewingItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingItem(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 bg-gray-100 text-gray-500 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
            
            <div className="flex gap-3 overflow-x-auto snap-x no-scrollbar mb-6">
              {viewingItem.image_url.map((url: string, idx: number) => (
                <img key={idx} src={url} className="w-[85%] sm:w-2/3 h-52 sm:h-64 object-cover rounded-[1.5rem] snap-center shrink-0 border border-gray-100" alt="Preview" />
              ))}
            </div>

            <div className="mb-4">
               <div className="flex flex-wrap items-center gap-2 mb-3">
                 <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border border-green-100">
                   <CheckCircle2 size={12}/> ซื้อสำเร็จเมื่อ {new Date(viewingItem.order_date).toLocaleDateString('th-TH')}
                 </span>
               </div>
               <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{viewingItem.title}</h2>
               <div className="flex flex-wrap gap-1 mb-4">
                  {viewingItem.tags.map((t: string) => (
                    <span key={t} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">#{t}</span>
                  ))}
               </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl mb-6">
              <p className="text-gray-600 text-sm font-medium whitespace-pre-wrap leading-relaxed">{viewingItem.description}</p>
            </div>

            <div className="flex gap-3">
              <Link href="/student/booking-flow" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-center shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                ไปจองเวลาเรียน
              </Link>
              <button onClick={() => setViewingItem(null)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition-all">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <Link href="/student" className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-4 group w-max">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าหลัก
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">รายการสั่งซื้อ & แต้มสะสม</h1>
        </header>

        {/* --- ✨ Tab Navigation --- */}
        <div className="flex gap-2 p-1.5 bg-gray-100 rounded-[1.5rem] mb-10 w-full sm:w-max">
          <button 
            onClick={() => setActiveTab('my-courses')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'my-courses' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid size={18}/> คอร์สของฉัน
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Receipt size={18}/> ประวัติการโอน
          </button>
          <button 
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'rewards' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Gift size={18}/> แต้มสะสม
          </button>
        </div>

        {/* --- ✨ Content: คอร์สของฉัน (Card View) --- */}
        {activeTab === 'my-courses' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {myPurchasedCourses.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100">
                <BookOpen size={64} className="mx-auto text-gray-200 mb-4"/>
                <p className="text-gray-400 font-black text-xl">ยังไม่มีคอร์สเรียนที่สั่งซื้อสำเร็จ</p>
                <Link href="/student/courses" className="text-blue-600 font-bold mt-2 inline-block hover:underline">ไปเลือกซื้อคอร์สกันเลย!</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myPurchasedCourses.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl border border-gray-100 flex flex-col h-full group transition-all overflow-hidden relative">
                    <div className="h-40 bg-gray-50 relative overflow-hidden cursor-pointer" onClick={() => setViewingItem(item)}>
                      <img src={item.image_url?.[0] || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black text-blue-600 shadow-sm uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10}/> {item.hours_count} ชม.
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-black text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setViewingItem(item)}>{item.title}</h3>
                      <p className="text-gray-400 text-xs line-clamp-2 font-medium leading-relaxed mb-4">{item.description}</p>
                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                         <button onClick={() => setViewingItem(item)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-700 transition-all flex items-center justify-center font-black text-[10px] uppercase">
                            <Info size={16} className="mr-1"/> รายละเอียด
                         </button>
                         <Link href="/student/booking-flow" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1 active:scale-95">
                            จองเรียน <ChevronRight size={14}/>
                         </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ✨ Content: ประวัติการแจ้งโอน (Table View) --- */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="p-6">วันที่สั่งซื้อ</th>
                    <th className="p-6">รายการ</th>
                    <th className="p-6">ยอดชำระ</th>
                    <th className="p-6 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="text-sm font-bold text-gray-700 hover:bg-gray-50/50 transition-colors">
                      <td className="p-6">{new Date(order.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-6">
                        <p className="text-gray-900 font-black">{order.courses?.title || 'รายการทั่วไป'}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{order.courses?.category}</p>
                      </td>
                      <td className="p-6 font-black text-blue-600 text-lg">฿{order.amount_paid?.toLocaleString()}</td>
                      <td className="p-6">
                        <div className="flex justify-center">
                          {order.status === 'PENDING' && <span className="bg-orange-50 text-orange-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border border-orange-100"><Clock size={12}/> รอตรวจสอบ</span>}
                          {order.status === 'SUCCESS' && <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border border-green-100"><CheckCircle2 size={12}/> สำเร็จ</span>}
                          {order.status === 'REJECTED' && <span className="bg-red-50 text-red-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border border-red-100"><XCircle size={12}/> ไม่ผ่าน</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p className="p-20 text-center text-gray-300 font-black">ไม่พบข้อมูลการสั่งซื้อ</p>}
            </div>
          </div>
        )}

        {/* --- ✨ Content: แต้มสะสม (Affiliate Info) --- */}
        {activeTab === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-10 rounded-[3rem] text-white shadow-xl shadow-orange-100 relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-lg font-black uppercase tracking-widest opacity-80 mb-2">แต้มสะสมปัจจุบัน</h3>
                  <p className="text-7xl font-black mb-6">{wallet?.points_balance || 0} <span className="text-xl opacity-60">PTS</span></p>
                  <Link href="/student/affiliate/shop" className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black hover:bg-gray-50 active:scale-95 transition-all inline-flex items-center gap-2 shadow-lg">
                    ไปที่ร้านค้าแลกรางวัล <ChevronRight size={20}/>
                  </Link>
               </div>
               <Gift className="absolute -bottom-10 -right-10 text-white/10" size={240}/>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-center">
              <h3 className="text-2xl font-black mb-4">สิทธิประโยชน์ของแต้ม 🎁</h3>
              <ul className="space-y-4">
                <li className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0"><CheckCircle2 size={18}/></div>
                  <p className="text-sm font-bold text-gray-600">รับแต้มทันทีเมื่อเพื่อนซื้อคอร์สผ่านรหัสของคุณ</p>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0"><CheckCircle2 size={18}/></div>
                  <p className="text-sm font-bold text-gray-600">ใช้แต้มแลกรับส่วนลดคอร์สเรียนหรือของรางวัลพิเศษ</p>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0"><CheckCircle2 size={18}/></div>
                  <p className="text-sm font-bold text-gray-600">แต้มไม่มีวันหมดอายุ สะสมได้เรื่อยๆ เลยครับ!</p>
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
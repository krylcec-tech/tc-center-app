'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Check, X, Loader2, ArrowLeft, Search, Filter, 
  ShoppingBag, BookOpen, AlertCircle, CheckCircle2, User, Clock, Trash2, Ban
} from 'lucide-react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'marketplace'>('orders');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- States ---
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SUCCESS' | 'REJECTED'>('ALL');
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [sellerTypeFilter, setSellerTypeFilter] = useState<'ALL' | 'student' | 'tutor'>('ALL');
  const [marketplaceStatusFilter, setMarketplaceStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING'); 

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const { data: ordersData } = await supabase
          .from('course_orders')
          .select('*, courses:course_id (*)')
          .order('created_at', { ascending: false });

        const { data: profiles } = await supabase.from('profiles').select('id, full_name');
        setOrders((ordersData || []).map(order => ({
          ...order,
          profiles: profiles?.find(p => p.id === order.student_id) || null
        })));
      } else {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .eq('type', 'book')
          .order('created_at', { ascending: false });
        setMarketplaceItems(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (order: any) => {
    if (!confirm('ยืนยันการอนุมัติ?')) return;
    setProcessingId(order.id);
    try {
      const { error: updateError } = await supabase
        .from('course_orders')
        .update({ status: 'SUCCESS' })
        .eq('id', order.id);

      if (updateError) {
        alert("Update Failed: " + updateError.message);
        return;
      }

      // Logic มอบสิทธิ์
      if (order.courses?.type === 'book') {
        await supabase.from('user_books').insert([{
          user_id: order.student_id,
          title: order.courses.title,
          document_url: order.courses.document_url,
          image_url: order.courses.image_url?.[0] || null,
          source_type: 'SHOP'
        }]);

        // ✨ Logic จ่ายเงินคนขาย (เพิ่มระบบ Commission ขั้นบันได)
        if (order.courses.seller_id && order.courses.seller_type !== 'institute') {
            const sellerId = order.courses.seller_id;
            
            // 1. ดึงยอดขายทั้งหมดของผู้ขายคนนี้เพื่อมาเช็ก Tier
            const { data: allItems } = await supabase.from('courses').select('sales_count').eq('seller_id', sellerId);
            const totalSoldCount = allItems?.reduce((sum, item) => sum + (item.sales_count || 0), 0) || 0;

            // 2. ดึงค่า custom_fee เผื่อ Admin ตั้งค่าแยกไว้ให้
            const { data: profile } = await supabase.from('profiles').select('custom_fee').eq('id', sellerId).maybeSingle();
            
            let platformFee = 30; // เริ่มต้นหัก 30%
            if (profile?.custom_fee !== null && profile?.custom_fee !== undefined) {
              platformFee = profile.custom_fee; // ใช้ค่าคงที่ถ้า Admin ระบุไว้
            } else {
              // ถ้า Admin ไม่ได้ระบุ ให้ลดตามยอดขาย
              if (totalSoldCount >= 30) platformFee = 10;
              else if (totalSoldCount >= 10) platformFee = 20;
            }

            // 3. คำนวณรายได้สุทธิที่คนขายจะได้ (หักค่าธรรมเนียมออก)
            const netEarnPercent = (100 - platformFee) / 100;
            const netEarn = Math.floor((order.amount_paid || 0) * netEarnPercent);
            
            const walletTable = order.courses.seller_type === 'tutor' ? 'affiliate_wallets' : 'student_wallets';
            const { data: sw } = await supabase.from(walletTable).select('sales_balance').eq('user_id', sellerId).maybeSingle();
            
            // 4. อัปเดตเงินเข้ากระเป๋าคนขาย และเพิ่มยอด sales_count ของหนังสือเล่มนี้
            if (sw) await supabase.from(walletTable).update({ sales_balance: (sw.sales_balance || 0) + netEarn }).eq('user_id', sellerId);
            await supabase.from('courses').update({ sales_count: (order.courses.sales_count || 0) + 1 }).eq('id', order.courses.id);
        }
      }

      alert('✅ อนุมัติสำเร็จ!');
      fetchData(); // ดึงข้อมูลใหม่เพื่อให้ปุ่มหายไป
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  // --- Marketplace Actions ---
  const handleApproveMarketplace = async (item: any) => {
    await supabase.from('courses').update({ approval_status: 'APPROVED', is_active: true }).eq('id', item.id);
    fetchData();
  };

  const handleRejectMarketplace = async (id: string) => {
    const reason = prompt('เหตุผลที่ไม่อนุมัติ:');
    if (!reason) return;
    await supabase.from('courses').update({ approval_status: 'REJECTED', reject_reason: reason, is_active: false }).eq('id', id);
    fetchData();
  };

  const filteredOrders = orders.filter(o => {
    const isApproved = o.status === 'SUCCESS' || o.status === 'COMPLETED';
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'SUCCESS') return isApproved;
    return o.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-left font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <Link href="/admin" className="text-gray-400 font-black text-xs uppercase mb-2 flex items-center gap-2 hover:text-blue-600 transition-all group w-max">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> กลับหน้าหลัก Admin
            </Link>
            <h1 className="text-4xl font-black tracking-tight">Order Management 📦</h1>
            <p className="text-gray-500 font-bold mt-1">จัดการคำสั่งซื้อคอร์สเรียน และ ระบบอนุมัติชีท (Marketplace)</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-gray-100">
            <button onClick={() => setActiveTab('orders')} className={`flex-1 md:w-40 py-3 rounded-[1.2rem] text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500'}`}>
              <ShoppingBag size={16}/> ออเดอร์คอร์ส
            </button>
            <button onClick={() => setActiveTab('marketplace')} className={`flex-1 md:w-40 py-3 rounded-[1.2rem] text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'marketplace' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500'}`}>
              <BookOpen size={16}/> ระบบฝากขายชีท
            </button>
          </div>
        </header>

        {activeTab === 'orders' ? (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[{id:'ALL', l:'ทั้งหมด'}, {id:'PENDING', l:'รอตรวจสอบ'}, {id:'SUCCESS', l:'อนุมัติแล้ว'}, {id:'REJECTED', l:'ยกเลิก'}].map(f => (
                  <button key={f.id} onClick={() => setStatusFilter(f.id as any)} className={`px-6 py-2.5 rounded-[1rem] text-xs font-black transition-all ${statusFilter === f.id ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{f.l}</button>
                ))}
              </div>
              <div className="relative w-full md:w-72 text-gray-900">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="ค้นหาชื่อผู้เรียน..." className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-[1.2rem] font-bold text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.filter(o => o.profiles?.full_name?.includes(searchQuery)).map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-20 h-28 bg-gray-100 rounded-xl shrink-0 overflow-hidden border">
                      {order.slip_url ? <a href={order.slip_url} target="_blank"><img src={order.slip_url} className="w-full h-full object-cover"/></a> : <div className="h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">ไม่มีสลิป</div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : (order.status === 'SUCCESS' || order.status === 'COMPLETED') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{order.status}</span>
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Clock size={10}/> {new Date(order.created_at).toLocaleString('th-TH')}</span>
                      </div>
                      <h3 className="font-black text-lg text-gray-900 leading-tight">{order.courses?.title}</h3>
                      <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-1.5"><User size={14}/> ผู้ซื้อ: {order.profiles?.full_name || 'ไม่ระบุชื่อ'}</p>
                      <p className="text-xs font-bold text-gray-400 mt-0.5">ยอดโอน: <span className="text-blue-600 font-black">฿{order.amount_paid?.toLocaleString()}</span></p>
                    </div>
                  </div>
                  {order.status === 'PENDING' && (
                    <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                       <button onClick={() => { if(confirm('ปฏิเสธ?')) { supabase.from('course_orders').update({status:'REJECTED'}).eq('id', order.id).then(()=>fetchData()) } }} className="flex-1 md:w-auto px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black">ไม่ผ่าน</button>
                       <button onClick={() => handleApproveOrder(order)} disabled={processingId === order.id} className="flex-1 md:w-auto px-10 py-3 bg-green-500 text-white rounded-2xl font-black shadow-lg">อนุมัติ</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[{id:'PENDING', l:'รอตรวจสอบ'}, {id:'APPROVED', l:'อนุมัติแล้ว'}, {id:'REJECTED', l:'ถูกปฏิเสธ'}, {id:'ALL', l:'ทั้งหมด'}].map(f => (
                  <button key={f.id} onClick={() => setMarketplaceStatusFilter(f.id as any)} className={`px-5 py-2.5 rounded-[1rem] text-xs font-black transition-all ${marketplaceStatusFilter === f.id ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{f.l}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <select value={sellerTypeFilter} onChange={(e)=>setSellerTypeFilter(e.target.value as any)} className="bg-orange-50 text-orange-600 font-black text-xs px-4 py-3 rounded-[1.2rem] border-none outline-none"><option value="ALL">ของทุกคน</option><option value="tutor">ติวเตอร์</option><option value="student">นักเรียน</option></select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {marketplaceItems.filter(i => (marketplaceStatusFilter === 'ALL' || i.approval_status === marketplaceStatusFilter) && (sellerTypeFilter === 'ALL' || i.seller_type === sellerTypeFilter)).map(item => (
                <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
                  <div className="flex items-start gap-5 flex-1 w-full">
                    <div className="w-16 h-16 bg-orange-50 text-orange-400 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border">
                      {item.image_url?.[0] ? <img src={item.image_url[0]} className="w-full h-full object-cover"/> : <BookOpen size={28}/>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${item.approval_status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{item.approval_status}</span>
                        <span className="text-[10px] font-bold text-gray-400">ส่งเมื่อ {new Date(item.created_at).toLocaleDateString('th-TH')}</span>
                      </div>
                      <h3 className="font-black text-xl text-gray-900 line-clamp-1">{item.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <p className="text-sm font-bold text-gray-500 flex items-center gap-1.5"><User size={14}/> {item.seller_name}</p>
                        <p className="text-sm font-bold text-gray-500">ราคา: ฿{item.price?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    {item.approval_status === 'PENDING' && (
                      <button onClick={() => handleApproveMarketplace(item)} className="flex-1 md:w-auto px-6 py-3 bg-orange-500 text-white rounded-xl font-black text-xs shadow-md">อนุมัติให้ขาย</button>
                    )}
                    <button onClick={() => { if(confirm('ลบถาวร?')) { supabase.from('courses').delete().eq('id',item.id).then(()=>fetchData()) } }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
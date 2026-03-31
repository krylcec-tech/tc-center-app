'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, ShoppingCart, BookOpen, Clock, 
  Tag, Loader2, PlayCircle, MessageCircle 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentCatalogPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'course' | 'book'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ✨ เช็คสถานะการเข้าสู่ระบบ

  useEffect(() => {
    checkUserStatus();
    fetchActiveItems();
  }, []);

  const checkUserStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsLoggedIn(true);
      const { data: profile } = await supabase
        .from('tutors')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const role = profile?.role?.replace(/'/g, "").trim().toLowerCase();
      setIsAdmin(role === 'admin');
    } else {
      setIsLoggedIn(false);
    }
  };

  const fetchActiveItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedData = data.map(item => ({
        ...item,
        image_url: Array.isArray(item.image_url) ? item.image_url : (item.image_url ? [item.image_url] : [])
      }));
      setItems(formattedData);
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item => {
    const matchTab = activeTab === 'all' || item.type === activeTab;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchTab && matchSearch;
  });

  const handlePurchase = async (course: any) => {
    // ✨ เช็คสิทธิ์ก่อนทำรายการ
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      if (confirm("คุณต้องสมัครสมาชิกหรือเข้าสู่ระบบก่อนทำรายการซื้อครับ\nไปยังหน้าสมัครสมาชิกเลยไหม?")) {
        router.push('/register');
      }
      return;
    }

    const confirmMsg = `ยืนยันการสั่งซื้อ: ${course.title}\nราคา: ฿${course.price.toLocaleString()}\nจำนวนที่จะได้รับ: ${course.hours_count} ชั่วโมง`;
    
    if (confirm(confirmMsg)) {
      setPurchaseLoading(true);
      try {
        // 1. บันทึกประวัติการซื้อ
        const { error: transError } = await supabase
          .from('wallet_transactions')
          .insert([{
            user_id: user.id,
            amount: course.hours_count,
            type: 'purchase',
            description: `ซื้อคอร์ส: ${course.title}`
          }]);

        if (transError) throw transError;

        // 2. ดึงยอด Wallet
        const { data: wallet } = await supabase
          .from('student_wallets')
          .select('total_hours_balance')
          .eq('user_id', user.id)
          .maybeSingle();

        const currentBalance = wallet?.total_hours_balance || 0;
        const newBalance = currentBalance + (course.hours_count || 0);

        // 3. อัปเดตยอด
        const { error: walletError } = await supabase
          .from('student_wallets')
          .upsert({ 
            user_id: user.id, 
            total_hours_balance: newBalance,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (walletError) throw walletError;

        alert(`🎉 สั่งซื้อสำเร็จ!\nยอดคงเหลือปัจจุบัน: ${newBalance} ชั่วโมง`);
        router.push('/student');

      } catch (error: any) {
        alert("เกิดข้อผิดพลาดในการสั่งซื้อ: " + error.message);
      } finally {
        setPurchaseLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans ${purchaseLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          {/* ✨ ปรับลิงก์ย้อนกลับให้รองรับ Guest */}
          <Link 
            href={!isLoggedIn ? "/" : (isAdmin ? "/admin" : "/student")} 
            className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-2 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            {!isLoggedIn ? 'กลับหน้าหลัก' : (isAdmin ? 'Admin Dashboard' : 'Dashboard')}
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">คอร์สเรียน & เอกสาร</h1>
          <p className="text-gray-500 font-bold mt-1">เลือกซื้อแพ็กเกจชั่วโมงเรียน หรือเอกสารสอบเข้าได้ที่นี่</p>
        </div>

        <div className="relative w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหาคอร์ส, วิชา..." 
            className="w-full md:w-80 pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-400 font-bold transition-all shadow-sm text-gray-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories / Tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 text-xs">
        <button onClick={() => setActiveTab('all')} className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${activeTab === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><Tag size={16} /> ทั้งหมด</button>
        <button onClick={() => setActiveTab('course')} className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${activeTab === 'course' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-blue-50'}`}><Clock size={16} /> แพ็กเกจ & คอร์สเรียน</button>
        <button onClick={() => setActiveTab('book')} className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${activeTab === 'book' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-orange-50'}`}><BookOpen size={16} /> หนังสือ & ชีทสรุป</button>
      </div>

      {/* Catalog Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
          <ShoppingCart className="mx-auto text-gray-200 mb-6" size={80} />
          <p className="text-gray-500 font-black text-2xl">ไม่พบรายการสินค้า</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-gray-900">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl border border-gray-100 flex flex-col h-full group transition-all duration-300 overflow-hidden">
              <div className="h-56 bg-gray-50 relative overflow-hidden">
                {item.image_url?.[0] ? (
                  <img src={item.image_url[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    {item.type === 'course' ? <PlayCircle size={48} /> : <BookOpen size={48} />}
                  </div>
                )}
                <div className={`absolute top-4 left-4 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1.5 ${item.type === 'course' ? 'bg-blue-600/90 text-white' : 'bg-orange-500/90 text-white'}`}>
                  {item.type === 'course' ? <Clock size={12} /> : <BookOpen size={12} />}
                  {item.category}
                </div>
                {item.type === 'course' && item.hours_count > 0 && (
                   <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl text-[11px] font-black text-blue-600 shadow-sm border border-blue-50">
                     +{item.hours_count} ชม.
                   </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-black text-xl line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-6 font-medium">{item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ราคา</span>
                    <span className="text-3xl font-black">฿{item.price.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => handlePurchase(item)}
                    disabled={purchaseLoading}
                    className={`px-6 py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all flex items-center gap-2 ${item.type === 'course' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-orange-500 text-white hover:bg-orange-600'} disabled:bg-gray-400`}
                  >
                    {purchaseLoading ? <Loader2 className="animate-spin" size={18} /> : <ShoppingCart size={18} />}
                    ซื้อเลย
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Support Banner */}
      <div className="mt-16 bg-blue-600 rounded-[3rem] p-8 md:p-12 text-center text-white shadow-xl shadow-blue-200">
        <h2 className="text-3xl font-black mb-4">มีข้อสงสัย หรือต้องการชำระเงิน?</h2>
        <p className="text-blue-100 font-bold mb-8 max-w-lg mx-auto">หากต้องการสอบถามรายละเอียดเพิ่มเติม สามารถติดต่อแอดมินปันได้โดยตรงครับ</p>
        <a href="https://lin.ee/ZSDR4B3" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#06C755] text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#05b34c] transition-all shadow-lg active:scale-95">
          <MessageCircle size={24} /> ติดต่อ LINE Official
        </a>
      </div>
    </div>
  );
}
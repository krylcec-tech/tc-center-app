'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, ShoppingCart, BookOpen, Clock, 
  Tag, Loader2, PlayCircle, MessageCircle, Gift, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentCatalogPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'course' | 'book'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  // ✨ ฟังก์ชันใหม่: ส่งไปหน้าแจ้งโอนเงิน
  const handleGoToCheckout = async (course: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      if (confirm("คุณต้องสมัครสมาชิกหรือเข้าสู่ระบบก่อนซื้อคอร์สครับ\nสมัครตอนนี้รับ 1 ชม. ฟรี (ถ้ามีรหัสแนะนำ)! ไปหน้าสมัครเลยไหม?")) {
        router.push('/register');
      }
      return;
    }

    // ส่งไปหน้าแจ้งโอนเงินที่เราทำไว้ โดยส่ง ID คอร์สไปด้วย (ถ้าคุณทำระบบรับค่าผ่าน URL)
    // หรือให้เขาไปเลือกเองในหน้าแจ้งโอนก็ได้ครับ
    router.push(`/student/courses`); 
  };

  const filteredItems = items.filter(item => {
    const matchTab = activeTab === 'all' || item.type === activeTab;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchTab && matchSearch;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <Link 
            href={!isLoggedIn ? "/" : (isAdmin ? "/admin" : "/student")} 
            className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-2 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            {!isLoggedIn ? 'กลับหน้าหลัก' : (isAdmin ? 'Admin Dashboard' : 'Dashboard')}
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">คอร์สเรียน & เอกสาร</h1>
          <p className="text-gray-500 font-bold mt-1">เลือกซื้อคอร์สเพื่อรับชั่วโมงเรียนและแต้มสะสม</p>
        </div>

        <div className="relative w-full md:w-auto text-gray-900">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหาคอร์ส..." 
            className="w-full md:w-80 pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-400 font-bold transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setActiveTab('all')} className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><Tag size={16} /> ทั้งหมด</button>
        <button onClick={() => setActiveTab('course')} className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'course' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-blue-50'}`}><Clock size={16} /> คอร์สเรียน</button>
        <button onClick={() => setActiveTab('book')} className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'book' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-orange-50'}`}><BookOpen size={16} /> หนังสือ & ชีท</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-gray-900">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl border border-gray-100 flex flex-col h-full group transition-all duration-300">
            <div className="h-52 bg-gray-50 relative overflow-hidden rounded-t-[2.5rem]">
              {item.image_url?.[0] ? (
                <img src={item.image_url[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200"><PlayCircle size={48} /></div>
              )}
              
              {/* ✨ แสดงแต้มที่จะได้รับบนภาพ (จูงใจสายงาน) */}
              {item.referral_points > 0 && (
                <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg flex items-center gap-1">
                  <Gift size={12}/> แนะนำเพื่อน รับ {item.referral_points} แต้ม
                </div>
              )}

              <div className={`absolute top-4 left-4 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1.5 ${item.type === 'course' ? 'bg-blue-600/90 text-white' : 'bg-orange-500/90 text-white'}`}>
                {item.type === 'course' ? <Clock size={12} /> : <BookOpen size={12} />}
                {item.category}
              </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <h3 className="font-black text-xl mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-2 mb-6 font-medium h-10">{item.description}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-widest">ราคาคอร์ส</span>
                  <span className="text-2xl font-black text-gray-900">฿{item.price.toLocaleString()}</span>
                </div>
                
                <button 
                  onClick={() => handleGoToCheckout(item)}
                  className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-gray-100"
                >
                  เลือกซื้อ <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Support Section */}
      <div className="mt-16 bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageCircle size={32} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">สอบถามเพิ่มเติม?</h2>
        <p className="text-gray-500 font-bold mb-8">ปรึกษาแผนการเรียน หรือแจ้งปัญหาการใช้งานได้ที่ LINE ด้านล่างนี้ครับ</p>
        <a href="https://lin.ee/ZSDR4B3" target="_blank" className="inline-flex items-center gap-3 bg-[#06C755] text-white px-10 py-4 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-green-100 transition-all active:scale-95">
          <MessageCircle size={24} /> ติดต่อ LINE Official
        </a>
      </div>
    </div>
  );
}
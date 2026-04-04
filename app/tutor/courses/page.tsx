'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, BookOpen, Gift, ChevronRight, Loader2, 
  Copy, CheckCircle2, Share2 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TutorCourseCatalog() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'course' | 'book'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. ดึง ID ของติวเตอร์ (เพื่อเอาไปทำเป็น Ref Link)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('tutors').select('id').eq('user_id', user.id).maybeSingle();
        if (profile) setTutorId(profile.id);
      }

      // 2. ดึงข้อมูลสินค้าเหมือนฝั่งนักเรียน
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setItems(data.map(item => ({
          ...item,
          image_url: Array.isArray(item.image_url) ? item.image_url : (item.image_url ? [item.image_url] : [])
        })));
      }
    } catch (err) {
      console.error("Error fetching catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (courseId: string) => {
    // ✨ สร้างลิงก์ร้านค้าฝั่งนักเรียน พร้อมแนบรหัสติวเตอร์ (?ref=...)
    const baseUrl = window.location.origin;
    const affiliateLink = `${baseUrl}/student/courses?ref=${tutorId}&course_id=${courseId}`;
    
    navigator.clipboard.writeText(affiliateLink);
    setCopiedId(courseId);
    
    // รีเซ็ตปุ่มคัดลอกหลังจาก 2 วินาที
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const filteredItems = items.filter(item => {
    const matchTab = activeTab === 'all' || item.type === activeTab;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-gray-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <Link href="/tutor/affiliate" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2 hover:text-purple-600 transition-all w-max group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            กลับหน้าระบบนายหน้า
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            คลังสินค้า <span className="text-purple-600 bg-purple-50 px-3 py-1 rounded-xl text-2xl">พร้อมแชร์</span>
          </h1>
          <p className="text-gray-500 font-bold mt-2 text-sm">คัดลอกลิงก์ด้านล่างไปส่งให้นักเรียนเพื่อรับแต้มสะสมทันทีที่มีการสั่งซื้อ!</p>
        </div>
        
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหาคอร์สหรือหนังสือ..." 
            className="w-full md:w-80 pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-purple-400 font-bold transition-all shadow-sm" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setActiveTab('all')} className={`px-6 py-3 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}>ทั้งหมด</button>
        <button onClick={() => setActiveTab('course')} className={`px-6 py-3 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'course' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-500 hover:bg-purple-50 hover:text-purple-600 border border-gray-100'}`}>คอร์สเรียน</button>
        <button onClick={() => setActiveTab('book')} className={`px-6 py-3 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'book' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-600 border border-gray-100'}`}>หนังสือ & ชีท</button>
      </div>

      {/* Grid Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full group overflow-hidden hover:shadow-xl transition-all duration-300">
            {/* Image Section */}
            <div className="h-52 bg-gray-50 relative overflow-hidden">
              <img src={item.image_url?.[0] || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
              {item.referral_points > 0 && (
                <div className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 animate-pulse">
                  <Gift size={14}/> รับ {item.referral_points} แต้ม
                </div>
              )}
            </div>
            
            {/* Content Section */}
            <div className="p-8 flex flex-col flex-1">
              <h3 className="font-black text-xl mb-2 line-clamp-1">{item.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-2 mb-6 font-medium h-10 leading-relaxed">{item.description}</p>
              
              <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center gap-4">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-widest">ราคาขาย</span>
                  <span className="text-2xl font-black text-gray-900">฿{item.price.toLocaleString()}</span>
                </div>
                
                {/* ✨ ปุ่มคัดลอกลิงก์ Affiliate */}
                <button 
                  onClick={() => handleCopyLink(item.id)}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                    copiedId === item.id 
                      ? 'bg-green-50 text-green-600 border border-green-200' 
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white border border-purple-100'
                  }`}
                >
                  {copiedId === item.id ? (
                    <><CheckCircle2 size={18} /> คัดลอกแล้ว!</>
                  ) : (
                    <><Share2 size={18} /> แชร์ลิงก์นี้</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
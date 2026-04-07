'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, ShoppingCart, BookOpen, Clock, 
  Tag, Loader2, Info, X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function PublicCatalogContent() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewingItem, setViewingItem] = useState<any>(null); // สำหรับ Modal รายละเอียด

  useEffect(() => {
    fetchActiveItems();
  }, []);

  const fetchActiveItems = async () => {
    setLoading(true);
    
    // พยายามดึงข้อมูลจริงจาก Supabase
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, price, hours_count, referral_points, type, category, image_url, target_wallet_type, tags') 
      .eq('is_active', true) 
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (!error && data && data.length > 0) {
      // ถ้าดึงข้อมูลสำเร็จ และมีข้อมูล
      const tagsSet = new Set<string>();
      const formattedItems = data.map(item => {
        let parsedTags: string[] = [];
        if (Array.isArray(item.tags)) {
          parsedTags = item.tags;
        } else if (typeof item.tags === 'string') {
          try { parsedTags = JSON.parse(item.tags); } 
          catch { parsedTags = item.tags.replace(/^{|}$/g, '').split(',').map(t => t.trim().replace(/^"|"$/g, '')).filter(Boolean); }
        }
        parsedTags.forEach(t => tagsSet.add(t));
        return {
          ...item,
          image_url: Array.isArray(item.image_url) ? item.image_url : (item.image_url ? [item.image_url] : []),
          tags: parsedTags
        };
      });
      setItems(formattedItems);
      setAvailableTags(Array.from(tagsSet));
    } else {
        // Fallback: ใช้ Mock Data ถ้าดึงไม่ได้ (ส่วนใหญ่เพราะติด RLS) หรือไม่มีข้อมูล
        console.warn("ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้ (อาจติด RLS) หรือยังไม่มีข้อมูลในตาราง ใช้ข้อมูลจำลองชั่วคราว");
        const mockData = [
            { id: '1', title: 'TGAT / TPAT Intensive เร่งรัด', type: 'course', price: 3500, description: 'สรุปเข้มเนื้อหาสำคัญ เตรียมพร้อมลงสนามสอบจริง', image_url: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800'], category: 'TCAS', tags: ['TGAT', 'TPAT'] },
            { id: '2', title: 'A-Level Math 1 ปูพื้นฐานสู่สนามสอบ', type: 'course', price: 4200, description: 'ปูพื้นฐานคณิตศาสตร์ ม.ปลาย แบบเข้าใจง่าย ไม่ต้องท่องจำ', image_url: ['https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800'], category: 'Math', tags: ['ALevel'] },
            { id: '3', title: 'หนังสือเจาะลึกข้อสอบ ชีววิทยา', type: 'book', price: 590, description: 'รวมข้อสอบเก่า 10 ปีย้อนหลัง พร้อมเฉลยละเอียด', image_url: ['https://images.unsplash.com/photo-1546410531-bea4cada6242?auto=format&fit=crop&q=80&w=800'], category: 'Biology', tags: ['ALevel'] }
        ];
        setItems(mockData);
        setAvailableTags(['TGAT', 'TPAT', 'ALevel']);
    }
    setLoading(false);
  };

  const handleActionAttempt = (e?: React.MouseEvent) => {
    if(e) e.preventDefault();
    if (confirm("กรุณาเข้าสู่ระบบก่อนดูรายละเอียดเต็มหรือสั่งซื้อครับ\n(แอบกระซิบ: สมัครสมาชิกใหม่รับสิทธิพิเศษเพียบ!)")) {
        router.push('/login');
    }
  };

  const filteredItems = items.filter(item => {
    let matchTab = false;
    if (activeTab === 'all') matchTab = true;
    else if (activeTab === 'course') matchTab = item.type === 'course';
    else if (activeTab === 'book') matchTab = item.type === 'book';
    else matchTab = item.tags && item.tags.includes(activeTab);

    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-gray-900">
      
      {/* Modal ดูรายละเอียดสินค้าแบบเต็ม (พรีวิว) */}
      {viewingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingItem(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 bg-gray-100 text-gray-500 p-2 rounded-full hover:bg-gray-200 transition-colors z-10"><X size={20}/></button>
            
            {viewingItem.image_url && viewingItem.image_url.length > 0 && (
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar mb-6 pb-2">
                {viewingItem.image_url.map((url: string, idx: number) => (
                  <img key={idx} src={url} className="w-[85%] sm:w-2/3 h-52 sm:h-64 object-cover rounded-[1.5rem] snap-center shrink-0 border border-gray-100 shadow-sm" alt={`Preview ${idx+1}`} />
                ))}
              </div>
            )}

            <div className="mb-4">
               <div className="flex flex-wrap items-center gap-2 mb-3">
                 <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1">
                   {viewingItem.type === 'course' ? <Clock size={10}/> : <BookOpen size={10}/>} {viewingItem.category}
                 </span>
                 {viewingItem.tags && viewingItem.tags.map((t: string) => (
                   <span key={t} className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-[10px] font-black uppercase">#{t}</span>
                 ))}
               </div>
               <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-2">{viewingItem.title}</h2>
            </div>

            <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl mb-6">
              <p className="text-gray-600 text-sm font-medium whitespace-pre-wrap leading-relaxed">{viewingItem.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
            </div>

            <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
               <div className="w-full sm:w-auto text-left">
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-widest">ราคา</span>
                  <span className="text-3xl font-black text-blue-600">฿{viewingItem.price.toLocaleString()}</span>
               </div>
               <button 
                 onClick={() => {
                   setViewingItem(null);
                   handleActionAttempt();
                 }} 
                 className="w-full sm:w-auto bg-gray-900 text-white px-8 py-4 rounded-[1rem] font-black text-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-200"
               >
                 เข้าสู่ระบบเพื่อสั่งซื้อ <ShoppingCart size={18} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pt-4">
        <div>
          <Link href="/" className="text-blue-600 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 mb-2 group w-max">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">คอร์สเรียน & เอกสาร</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">พรีวิวคอร์สเรียนทั้งหมดของ TC Center (ต้องเข้าสู่ระบบเพื่อสั่งซื้อ)</p>
        </div>
        
        <div className="relative w-full md:w-auto text-gray-900">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="ค้นหาคอร์ส..." className="w-full md:w-72 pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-[1rem] outline-none focus:border-blue-400 font-bold text-sm transition-all shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar items-center">
        <button onClick={() => setActiveTab('all')} className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-[1rem] font-black text-xs sm:text-sm transition-all ${activeTab === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>ทั้งหมด</button>
        <button onClick={() => setActiveTab('course')} className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-[1rem] font-black text-xs sm:text-sm transition-all ${activeTab === 'course' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-500 border border-gray-100 hover:bg-blue-50'}`}>คอร์สเรียน</button>
        <button onClick={() => setActiveTab('book')} className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-[1rem] font-black text-xs sm:text-sm transition-all ${activeTab === 'book' ? 'bg-orange-50 text-orange-600 shadow-md border-orange-100' : 'bg-white text-gray-500 border border-gray-100 hover:bg-orange-50'}`}>หนังสือ & ชีท</button>
        
        {availableTags.length > 0 && <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>}

        {availableTags.map(tag => (
          <button 
            key={tag} 
            onClick={() => setActiveTab(tag)} 
            className={`shrink-0 px-4 py-2.5 rounded-[1rem] font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1 ${activeTab === tag ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-gray-500 border border-gray-100 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200'}`}
          >
            <Tag size={12}/> {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-[1.5rem] shadow-sm hover:shadow-xl border border-gray-100 flex flex-col h-full group transition-all duration-300 overflow-hidden text-gray-900 relative">
            
            <div 
              className="h-40 sm:h-44 bg-gray-50 relative overflow-hidden cursor-pointer"
              onClick={() => setViewingItem(item)}
            >
              <img src={item.image_url?.[0] || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-[9px] font-black text-gray-700 shadow-sm flex items-center gap-1 uppercase tracking-widest">
                 {item.type === 'course' ? <Clock size={10} className="text-blue-600"/> : <BookOpen size={10} className="text-orange-500"/>} 
                 {item.category}
              </div>
            </div>
            
            <div className="p-4 sm:p-5 flex flex-col flex-1">
              <h3 className="font-black text-lg sm:text-xl mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setViewingItem(item)}>{item.title}</h3>
              
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags.map((t: string) => (
                    <span key={t} className="bg-gray-100 text-gray-500 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase">#{t}</span>
                  ))}
                </div>
              )}

              <p className={`text-gray-400 text-xs sm:text-sm line-clamp-2 font-medium leading-relaxed ${item.tags?.length > 0 ? 'h-8 sm:h-10 mb-3' : 'h-8 sm:h-10 mb-4'}`}>{item.description}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ราคา</span>
                  <span className="text-xl sm:text-2xl font-black text-gray-900 leading-none">฿{item.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setViewingItem(item)} 
                    className="p-2 sm:px-3 sm:py-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 hover:text-gray-800 transition-colors flex items-center justify-center font-black text-[10px] sm:text-xs"
                    title="ดูรายละเอียด"
                  >
                     <Info size={16} className="sm:hidden"/> 
                     <span className="hidden sm:inline">รายละเอียด</span>
                  </button>
                  <button 
                    onClick={handleActionAttempt} 
                    className="bg-gray-900 text-white p-2 sm:px-4 sm:py-2.5 rounded-xl font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-1 active:scale-95 shadow-md"
                  >
                    <span className="hidden sm:inline">สั่งซื้อ</span> <ShoppingCart size={16} className="sm:hidden"/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-gray-400 font-bold text-lg">ไม่พบรายการที่ค้นหาครับ 🥲</p>
        </div>
      )}
    </div>
  );
}

export default function PublicCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>}>
      <PublicCatalogContent />
    </Suspense>
  );
}
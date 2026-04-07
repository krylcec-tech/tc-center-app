'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, ShoppingCart, BookOpen, Clock, 
  Tag, Loader2, PlayCircle, MessageCircle, Gift, ChevronRight, X, Upload, CheckCircle2,
  Smartphone, Wallet, Info
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [selectedItem, setSelectedItem] = useState<any>(null); 
  const [viewingItem, setViewingItem] = useState<any>(null); 
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('affiliate_ref', refCode);
    }
  }, [searchParams]);

  useEffect(() => {
    checkUserStatus();
    fetchActiveItems();
  }, []);

  const checkUserStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsLoggedIn(true);
      const { data: profile } = await supabase.from('tutors').select('role').eq('user_id', user.id).maybeSingle();
      const role = profile?.role?.replace(/'/g, "").trim().toLowerCase();
      setIsAdmin(role === 'admin');
    }
  };

  const fetchActiveItems = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, price, hours_count, referral_points, type, category, image_url, target_wallet_type, tags') 
      .eq('is_active', true) 
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      const tagsSet = new Set<string>();

      const formattedItems = data.map(item => {
        let parsedTags: string[] = [];
        if (Array.isArray(item.tags)) {
          parsedTags = item.tags;
        } else if (typeof item.tags === 'string') {
          try {
            parsedTags = JSON.parse(item.tags);
          } catch {
            parsedTags = item.tags.replace(/^{|}$/g, '').split(',').map(t => t.trim().replace(/^"|"$/g, '')).filter(Boolean);
          }
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
    }
    setLoading(false);
  };

  const handleBuyClick = (item: any) => {
    if (!isLoggedIn) {
      if (confirm("กรุณาเข้าสู่ระบบก่อนสั่งซื้อครับ")) {
        router.push('/register');
      }
      return;
    }
    setSelectedItem(item);
  };

  const handleUploadSlip = async () => {
    if (!file) return alert('กรุณาแนบรูปสลิปโอนเงินครับ');
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('slips').upload(`public/${fileName}`, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('slips').getPublicUrl(`public/${fileName}`);
      const refTutorId = localStorage.getItem('affiliate_ref');

      const { error: orderError } = await supabase.from('course_orders').insert([{
        student_id: user?.id,
        course_id: selectedItem.id,
        amount_paid: selectedItem.price,
        slip_url: publicUrl,
        status: 'PENDING',
        referred_by: refTutorId || null 
      }]);

      if (orderError) throw orderError;

      setShowSuccess(true);
      setSelectedItem(null);
      setFile(null);
      localStorage.removeItem('affiliate_ref');
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setUploading(false);
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
      
      {/* 1. Modal ดูรายละเอียดสินค้าแบบเต็ม */}
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
                   handleBuyClick(viewingItem);
                 }} 
                 className="w-full sm:w-auto bg-gray-900 text-white px-8 py-4 rounded-[1rem] font-black text-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-200"
               >
                 สั่งซื้อรายการนี้ <ShoppingCart size={18} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal ชำระเงิน */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20}/></button>
            <h2 className="text-2xl font-black mb-2">ยืนยันการสั่งซื้อ</h2>
            <div className="bg-blue-50 p-4 rounded-2xl mb-6">
              <p className="text-blue-600 font-black text-base line-clamp-1">{selectedItem.title}</p>
              <p className="text-gray-500 font-bold">ยอด: <span className="text-blue-700 text-xl">฿{selectedItem.price.toLocaleString()}</span></p>
            </div>
            <div className="bg-gray-50 p-6 rounded-[2rem] mb-6 border border-gray-100 text-center shadow-inner">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest flex items-center justify-center gap-2"><Smartphone size={14}/> สแกนเพื่อชำระเงิน</p>
              <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-gray-100 mb-4 group">
                 <img src="/images/mae-manee-qr.png" alt="TC Center QR" className="w-full h-auto max-w-[180px] mx-auto rounded-lg"/>
              </div>
              <p className="font-black text-gray-800 text-sm">บจก. ทีซี เซ็นเตอร์ (ไทยแลนด์)</p>
            </div>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-[1.5rem] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden group">
                {file ? (
                  <div className="text-center p-4">
                    <CheckCircle2 className="text-green-500 mx-auto mb-1 animate-bounce" size={24} />
                    <p className="font-bold text-blue-600 text-[10px] truncate max-w-[150px]">{file.name}</p>
                  </div>
                ) : (
                  <><Upload className="text-gray-300 mb-2" size={24} /><p className="text-[9px] font-black text-gray-400 uppercase">คลิกเพื่อแนบสลิป</p></>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <button disabled={uploading} onClick={handleUploadSlip} className="w-full bg-gray-900 text-white py-4 rounded-[1rem] font-black text-base shadow-xl active:scale-95 disabled:bg-gray-200">
                {uploading ? <Loader2 className="animate-spin" /> : "ส่งหลักฐานการโอน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-blue-600 animate-in zoom-in duration-300 text-white text-center">
          <div>
            <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"><CheckCircle2 size={40} /></div>
            <h2 className="text-3xl font-black mb-2">เรียบร้อยครับ!</h2>
            <p className="text-blue-100 font-bold mb-8">ตรวจสอบสำเร็จชั่วโมงจะเข้ากระเป๋าครับ</p>
            <button onClick={() => setShowSuccess(false)} className="px-10 py-3.5 bg-white text-blue-600 rounded-xl font-black shadow-lg">กลับหน้าร้านค้า</button>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link href={!isLoggedIn ? "/" : (isAdmin ? "/admin" : "/student")} className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2 group w-max">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> กลับ
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">คอร์สเรียน & เอกสาร</h1>
        </div>
        <div className="relative w-full md:w-auto text-gray-900">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="ค้นหา..." className="w-full md:w-72 pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-[1rem] outline-none font-bold text-sm shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar items-center">
        <button onClick={() => setActiveTab('all')} className={`shrink-0 px-4 py-2.5 rounded-[1rem] font-black text-xs transition-all ${activeTab === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}>ทั้งหมด</button>
        <button onClick={() => setActiveTab('course')} className={`shrink-0 px-4 py-2.5 rounded-[1rem] font-black text-xs transition-all ${activeTab === 'course' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}>คอร์สเรียน</button>
        <button onClick={() => setActiveTab('book')} className={`shrink-0 px-4 py-2.5 rounded-[1rem] font-black text-xs transition-all ${activeTab === 'book' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-white text-gray-500 border border-gray-100'}`}>หนังสือ</button>
      </div>

      {/* ✨ อัปเดต Grid: มือถือขึ้น 2 คอลัมน์ (grid-cols-2) เพื่อให้การ์ดเล็กลงพอดีตา */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-[1.25rem] shadow-sm hover:shadow-xl border border-gray-100 flex flex-col h-full group transition-all duration-300 overflow-hidden text-gray-900 relative">
            
            {/* คลิกที่รูปเพื่อดูรายละเอียด (ลดความสูงลงในมือถือ h-28) */}
            <div 
              className="h-28 sm:h-44 bg-gray-50 relative overflow-hidden cursor-pointer"
              onClick={() => setViewingItem(item)}
            >
              <img src={item.image_url?.[0] || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              
              <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-[7px] sm:text-[9px] font-black text-gray-700 shadow-sm flex items-center gap-1 uppercase tracking-widest">
                 {item.type === 'course' ? <Clock size={8}/> : <BookOpen size={8}/>} 
                 {item.category}
              </div>
            </div>
            
            <div className="p-3 sm:p-5 flex flex-col flex-1">
              {/* ย่อหัวข้อในมือถือ text-sm */}
              <h3 className="font-black text-sm sm:text-xl mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setViewingItem(item)}>{item.title}</h3>
              
              {/* ซ่อน Description ในมือถือเพื่อให้การ์ดคอมแพค */}
              <p className="hidden sm:block text-gray-400 text-sm line-clamp-2 font-medium leading-relaxed h-10 mb-4">{item.description}</p>
              
              <div className="mt-auto pt-2 sm:pt-4 border-t border-gray-50 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase mb-0.5 sm:mb-1">ราคา</span>
                  <span className="text-base sm:text-2xl font-black text-gray-900 leading-none">฿{item.price.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* ปุ่มรายละเอียด: มือถือเหลือแค่ไอคอน */}
                  <button 
                    onClick={() => setViewingItem(item)} 
                    className="p-1.5 sm:px-3 sm:py-2.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors flex items-center justify-center font-black text-xs"
                  >
                     <Info size={14} />
                     <span className="hidden sm:inline ml-1">รายละเอียด</span>
                  </button>
                  {/* ปุ่มซื้อ: มือถือเหลือแค่ไอคอน ShoppingCart */}
                  <button 
                    onClick={() => handleBuyClick(item)} 
                    className="bg-gray-900 text-white p-1.5 sm:px-4 sm:py-2.5 rounded-lg font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-1 active:scale-95 shadow-md shadow-gray-100"
                  >
                    <ShoppingCart size={14} />
                    <span className="hidden sm:inline ml-1">ซื้อ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-gray-400 font-bold text-lg">ไม่พบรายการครับ 🥲</p>
        </div>
      )}
    </div>
  );
}

export default function StudentCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>}>
      <CatalogContent />
    </Suspense>
  );
}
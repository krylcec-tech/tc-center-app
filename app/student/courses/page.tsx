'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, ShoppingCart, BookOpen, Clock, 
  Tag, Loader2, PlayCircle, MessageCircle, Gift, ChevronRight, X, Upload, CheckCircle2,
  Smartphone, Wallet, Info, Store, Layers, Filter, User, Flame
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeSellerType, setActiveSellerType] = useState<string>('ALL');
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
      .select('id, title, description, price, original_price, hours_count, referral_points, type, category, image_url, target_wallet_type, tags, seller_type, seller_name, stock, is_unlimited') 
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
          tags: parsedTags,
          seller_type: item.seller_type || 'institute',
          original_price: item.original_price || 0
        };
      });

      setItems(formattedItems);
      setAvailableTags(Array.from(tagsSet));
    }
    setLoading(false);
  };

  const handleBuyClick = (item: any) => {
    if (!isLoggedIn) {
      if (confirm("กรุณาเข้าสู่ระบบก่อนสั่งซื้อครับ\n(แอบกระซิบ: สมัครสมาชิกใหม่รับชั่วโมงเรียนฟรีนะ!)")) {
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

    let matchSeller = false;
    if (activeSellerType === 'ALL') matchSeller = true;
    else matchSeller = item.seller_type === activeSellerType;

    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchTab && matchSearch && matchSeller;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-gray-900 relative">
      
      {/* Modal ดูรายละเอียดสินค้าแบบเต็ม */}
      {viewingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingItem(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 bg-gray-100 text-gray-500 p-2 rounded-full hover:bg-gray-200 transition-colors z-10"><X size={20}/></button>
            
            {viewingItem.image_url && viewingItem.image_url.length > 0 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-6 pb-2" style={{ touchAction: 'pan-x' }}>
                {viewingItem.image_url.map((url: string, idx: number) => (
                  <img key={idx} src={url} className="w-[85%] sm:w-2/3 h-52 sm:h-64 object-cover rounded-[1.5rem] shrink-0 border border-gray-100 shadow-sm" alt={`Preview ${idx+1}`} />
                ))}
              </div>
            )}

            <div className="mb-4">
               <div className="flex flex-wrap items-center gap-2 mb-3">
                 <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1">
                   {viewingItem.type === 'course' ? <Clock size={10}/> : <BookOpen size={10}/>} {viewingItem.category}
                 </span>
                 <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1">
                   <User size={10}/> {viewingItem.seller_name || 'TC Center'}
                 </span>
               </div>
               <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-2">{viewingItem.title}</h2>
            </div>

            <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl mb-6">
              <p className="text-gray-600 text-sm font-medium whitespace-pre-wrap leading-relaxed">{viewingItem.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
            </div>

            <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
               <div className="w-full sm:w-auto text-left flex flex-col">
                  {viewingItem.original_price > viewingItem.price && (
                    <span className="text-[10px] font-black text-gray-400 line-through tracking-widest leading-none mb-0.5">฿{viewingItem.original_price.toLocaleString()}</span>
                  )}
                  <span className={`text-3xl font-black leading-none ${viewingItem.original_price > viewingItem.price ? 'text-red-500' : 'text-blue-600'}`}>
                    ฿{viewingItem.price.toLocaleString()}
                  </span>
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

      {/* Modal ชำระเงิน */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20}/></button>
            <h2 className="text-2xl font-black mb-2">ยืนยันการสั่งซื้อ</h2>
            <div className="bg-blue-50 p-4 rounded-2xl mb-6">
              <p className="text-blue-600 font-black text-base sm:text-lg line-clamp-1">{selectedItem.title}</p>
              <p className="text-blue-400 font-bold text-xs mb-2">ผู้ขาย: {selectedItem.seller_name || 'TC Center'}</p>
              <p className="text-gray-500 font-bold">ยอดที่ต้องชำระ: <span className="text-blue-700 text-xl">฿{selectedItem.price.toLocaleString()}</span></p>
            </div>
            <div className="bg-gray-50 p-6 rounded-[2rem] mb-6 border border-gray-100 text-center shadow-inner">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest flex items-center justify-center gap-2"><Smartphone size={14}/> สแกนเพื่อชำระเงิน</p>
              <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-gray-100 mb-4 group">
                 <img src="/images/mae-manee-qr.png" alt="TC Center QR Payment" className="w-full h-auto max-w-[200px] mx-auto rounded-lg group-hover:scale-[1.02] transition-transform"/>
              </div>
              <p className="font-black text-gray-800 text-sm sm:text-base">บจก. ทีซี เซ็นเตอร์ (ไทยแลนด์)</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 mt-1 italic tracking-tight">สแกนได้ทุกแอปธนาคาร ฟรีค่าธรรมเนียม</p>
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase ml-2 flex justify-between items-center">
                <span>อัปโหลดสลิปยืนยัน</span><span className="text-blue-600 text-[9px] sm:text-[10px]">รองรับไฟล์ภาพ JPG, PNG</span>
              </label>
              <label className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-dashed border-gray-200 rounded-[1.5rem] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden group">
                {file ? (
                  <div className="text-center p-4">
                    <CheckCircle2 className="text-green-500 mx-auto mb-1 animate-bounce" size={24} />
                    <p className="font-bold text-blue-600 text-[10px] sm:text-xs truncate max-w-[180px]">{file.name}</p>
                  </div>
                ) : (
                  <><Upload className="text-gray-300 mb-2 group-hover:scale-110 transition-transform" size={24} /><p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">คลิกเพื่อแนบสลิป</p></>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <button disabled={uploading} onClick={handleUploadSlip} className="w-full bg-gray-900 text-white py-4 rounded-[1rem] font-black text-base shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-200">
                {uploading ? <Loader2 className="animate-spin" /> : "ส่งหลักฐานการโอน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-blue-600 animate-in zoom-in duration-300 text-white">
          <div className="text-center">
            <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"><CheckCircle2 size={40} /></div>
            <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">เรียบร้อยครับ!</h2>
            <p className="text-blue-100 font-bold mb-8 text-sm sm:text-base">แอดมินได้รับสลิปแล้ว กำลังตรวจสอบ<br/>ชั่วโมงจะเข้ากระเป๋าในไม่ช้านี้ครับ</p>
            <button onClick={() => setShowSuccess(false)} className="px-10 py-3.5 bg-white text-blue-600 rounded-xl font-black shadow-lg hover:bg-gray-50 active:scale-95 transition-all">กลับหน้าร้านค้า</button>
          </div>
        </div>
      )}

      {/* ✨ ส่วนหัว ย้ายมาอยู่ Layer บนสุดด้วย relative z-20 */}
      <div className="relative z-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pt-2">
          <div>
            <Link href={!isLoggedIn ? "/" : (isAdmin ? "/admin" : "/student")} className="text-blue-600 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 mb-2 group w-max">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าหลัก
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">คอร์สเรียน & เอกสาร</h1>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            {isLoggedIn && (
              <Link href="/student/seller-hub" className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-[1.2rem] hover:-translate-y-1 transition-all shadow-lg shadow-orange-200 active:scale-95 w-full justify-center md:w-auto">
                <Store size={16} /> ลงขายชีทของฉัน
              </Link>
            )}
            <div className="relative w-full md:w-72 text-gray-900">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="ค้นหาคอร์ส..." className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-[1rem] outline-none focus:border-blue-400 font-bold text-sm transition-all shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ✨ แถบหมวดหมู่หลัก ยกขึ้นมา Layer บนสุดและบังคับ Touch Action */}
        <div className="w-full overflow-x-auto hide-scrollbar mb-4" style={{ touchAction: 'pan-x' }}>
          <div className="flex gap-2 sm:gap-3 items-center pb-2 pr-4 w-max min-w-full">
            <button onClick={() => setActiveTab('all')} className={`shrink-0 px-5 sm:px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 ${activeTab === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>ทั้งหมด</button>
            <button onClick={() => setActiveTab('course')} className={`shrink-0 px-5 sm:px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 ${activeTab === 'course' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-500 border border-gray-100 hover:bg-blue-50'}`}>คอร์สเรียน</button>
            <button onClick={() => setActiveTab('book')} className={`shrink-0 px-5 sm:px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 ${activeTab === 'book' ? 'bg-orange-50 text-orange-600 shadow-md border-orange-100' : 'bg-white text-gray-500 border border-gray-100 hover:bg-orange-50'}`}>หนังสือ & ชีท</button>
            
            {availableTags.length > 0 && <div className="w-px h-6 bg-gray-200 mx-2 shrink-0"></div>}

            {availableTags.map(tag => (
              <button 
                key={tag} 
                onClick={() => setActiveTab(tag)} 
                className={`shrink-0 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 ${activeTab === tag ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-gray-500 border border-gray-100 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200'}`}
              >
                <Tag size={12}/> {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ✨ แถบกรองประเภทคนขาย ยกขึ้นมา Layer บนสุดเช่นกัน */}
        <div className="w-full overflow-x-auto hide-scrollbar mb-8" style={{ touchAction: 'pan-x' }}>
          <div className="flex gap-2 items-center bg-white p-2 rounded-full shadow-sm border border-gray-100 w-max min-w-full pr-4">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3 pr-2 flex items-center gap-1 shrink-0">
               <Filter size={12} /> กรองโดย
             </span>
             <button onClick={() => setActiveSellerType('ALL')} className={`shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black transition-all active:scale-95 ${activeSellerType === 'ALL' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>ทุกแหล่งที่มา</button>
             <button onClick={() => setActiveSellerType('institute')} className={`shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black transition-all active:scale-95 ${activeSellerType === 'institute' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>โดยสถาบัน</button>
             <button onClick={() => setActiveSellerType('tutor')} className={`shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black transition-all active:scale-95 ${activeSellerType === 'tutor' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}>โดยติวเตอร์</button>
             <button onClick={() => setActiveSellerType('student')} className={`shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black transition-all active:scale-95 ${activeSellerType === 'student' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}>โดยนักเรียน</button>
          </div>
        </div>
      </div>

      {/* Grid สินค้า */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 relative z-10">
        {filteredItems.map((item) => {
          const hasPromo = item.original_price > item.price;
          const discountPercent = hasPromo ? Math.round(((item.original_price - item.price) / item.original_price) * 100) : 0;
          const isLowStock = !item.is_unlimited && item.stock > 0 && item.stock <= 5;
          const isOutOfStock = !item.is_unlimited && item.stock <= 0;

          return (
            <div key={item.id} className={`bg-white rounded-[1.25rem] sm:rounded-[1.5rem] shadow-sm hover:shadow-xl border flex flex-col h-full group transition-all duration-300 overflow-hidden text-gray-900 relative ${hasPromo ? 'border-red-200' : 'border-gray-100'}`}>
              
              {hasPromo && (
                <div className="absolute top-0 right-0 z-20 bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-[10px] sm:text-xs px-3 py-1.5 rounded-bl-[1.2rem] shadow-md flex items-center gap-1">
                  <Flame size={12} className="animate-pulse"/> ลด {discountPercent}%
                </div>
              )}

              <div 
                className="h-28 sm:h-44 bg-gray-50 relative overflow-hidden cursor-pointer"
                onClick={() => setViewingItem(item)}
              >
                <img src={item.image_url?.[0] || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-white/90 backdrop-blur px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[7px] sm:text-[9px] font-black text-gray-700 shadow-sm flex items-center gap-1 uppercase tracking-widest">
                   {item.type === 'course' ? <Clock size={10} className="text-blue-600"/> : <BookOpen size={10} className="text-orange-500"/>} 
                   <span className="hidden xs:inline">{item.category}</span>
                </div>

                {item.type === 'book' && item.seller_type !== 'institute' && (
                  <div className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[7px] sm:text-[8px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1
                    ${item.seller_type === 'tutor' ? 'bg-purple-500 text-white' : 'bg-orange-500 text-white'}
                  `}>
                     <User size={8} /> {item.seller_name}
                  </div>
                )}

                {isLowStock && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 backdrop-blur-sm text-white text-center py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
                    🔥 รีบเลย! เหลือเพียง {item.stock} ชิ้น
                  </div>
                )}
              </div>
              
              <div className="p-3 sm:p-5 flex flex-col flex-1">
                <h3 className="font-black text-sm sm:text-xl mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setViewingItem(item)}>{item.title}</h3>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5 sm:mb-2">
                    {item.tags.map((t: string) => (
                      <span key={t} className="bg-gray-100 text-gray-500 text-[7px] sm:text-[9px] font-black px-1 py-0.5 rounded uppercase">#{t}</span>
                    ))}
                  </div>
                )}

                <p className="text-gray-400 text-[10px] sm:text-sm line-clamp-2 font-medium leading-relaxed mb-3 sm:mb-4 h-6 sm:h-10">{item.description}</p>
                
                <div className="mt-auto pt-2 sm:pt-4 border-t border-gray-50 flex justify-between items-end">
                  <div className="flex flex-col">
                    {hasPromo && <span className="text-[8px] sm:text-[10px] font-black text-gray-400 line-through tracking-widest leading-none mb-0.5">฿{item.original_price.toLocaleString()}</span>}
                    <span className={`text-sm sm:text-2xl font-black leading-none ${hasPromo ? 'text-red-500' : 'text-gray-900'}`}>
                      ฿{item.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <button 
                      onClick={() => setViewingItem(item)} 
                      className="p-1.5 sm:px-3 sm:py-2.5 bg-gray-50 text-gray-500 rounded-lg sm:rounded-xl hover:bg-gray-100 hover:text-gray-800 transition-colors flex items-center justify-center font-black active:scale-95"
                    >
                       <Info size={14} className="sm:w-4 sm:h-4" />
                       <span className="hidden sm:inline ml-1 text-xs">รายละเอียด</span>
                    </button>
                    <button 
                      onClick={() => handleBuyClick(item)} 
                      disabled={isOutOfStock}
                      className={`p-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl font-black transition-all flex items-center justify-center gap-1 shadow-md
                        ${isOutOfStock ? 'bg-gray-300 text-white cursor-not-allowed shadow-none' : 'bg-gray-900 text-white hover:bg-blue-600 active:scale-95'}
                      `}
                    >
                      <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline ml-1 text-xs">{isOutOfStock ? 'หมด' : 'ซื้อ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-20 relative z-10">
          <p className="text-gray-400 font-bold text-lg">ไม่พบรายการที่ค้นหาครับ 🥲</p>
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
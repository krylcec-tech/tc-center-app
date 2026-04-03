'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, ShoppingCart, BookOpen, Clock, 
  Tag, Loader2, PlayCircle, MessageCircle, Gift, ChevronRight, X, Upload, CheckCircle2,
  Smartphone, Wallet 
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

  const [selectedItem, setSelectedItem] = useState<any>(null); 
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
    const { data, error } = await supabase.from('courses').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (!error && data) {
      setItems(data.map(item => ({
        ...item,
        image_url: Array.isArray(item.image_url) ? item.image_url : (item.image_url ? [item.image_url] : [])
      })));
    }
    setLoading(false);
  };

  const handleBuyClick = (item: any) => {
    if (!isLoggedIn) {
      if (confirm("กรุณาเข้าสู่ระบบก่อนซื้อคอร์สครับ\nไปหน้าสมัครสมาชิกตอนนี้รับ 1 ชม. ฟรี!")) {
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

      const { error: orderError } = await supabase.from('course_orders').insert([{
        student_id: user?.id,
        course_id: selectedItem.id,
        amount_paid: selectedItem.price,
        slip_url: publicUrl,
        status: 'PENDING'
      }]);

      if (orderError) throw orderError;

      setShowSuccess(true);
      setSelectedItem(null);
      setFile(null);
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchTab = activeTab === 'all' || item.type === activeTab;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-gray-900">
      
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"><X size={24}/></button>
            
            <h2 className="text-2xl font-black mb-2">ยืนยันการสั่งซื้อ</h2>
            <div className="bg-blue-50 p-4 rounded-2xl mb-6">
              <p className="text-blue-600 font-black text-lg line-clamp-1">{selectedItem.title}</p>
              <p className="text-gray-500 font-bold">ยอดที่ต้องชำระ: <span className="text-blue-700 text-xl">฿{selectedItem.price.toLocaleString()}</span></p>
            </div>

            <div className="bg-gray-50 p-6 rounded-[2.5rem] mb-6 border border-gray-100 text-center">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest flex items-center justify-center gap-2">
                 <Smartphone size={14}/> สแกนเพื่อชำระเงิน
              </p>
              
              <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-gray-100 mb-4">
                 {/* ✨ อัปเดต Path เป็น /images/ เรียบร้อยครับ */}
                 <img 
                    src="/images/mae-manee-qr.png" 
                    alt="TC Center QR Payment" 
                    className="w-full h-auto max-w-[220px] mx-auto rounded-lg"
                 />
              </div>
              
              <p className="font-black text-gray-800">บจก. ทีซี เซ็นเตอร์ (ไทยแลนด์)</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1 italic">สแกนได้ทุกแอปธนาคาร ฟรีค่าธรรมเนียม</p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase ml-2 flex justify-between items-center">
                <span>อัปโหลดสลิปยืนยัน</span>
                <span className="text-blue-600">แนบไฟล์รูปภาพ</span>
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-[2rem] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden group">
                {file ? (
                  <div className="text-center p-4">
                    <CheckCircle2 className="text-green-500 mx-auto mb-1" size={28} />
                    <p className="font-bold text-blue-600 text-xs truncate max-w-[200px]">{file.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-300 mb-2 group-hover:scale-110 transition-transform" size={28} />
                    <p className="text-xs font-bold text-gray-400">คลิกเพื่อแนบสลิป</p>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>

              <button 
                disabled={uploading}
                onClick={handleUploadSlip}
                className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-200"
              >
                {uploading ? <Loader2 className="animate-spin" /> : "ส่งหลักฐานการโอน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-blue-600 animate-in zoom-in duration-300">
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-white text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <CheckCircle2 size={60} />
            </div>
            <h2 className="text-4xl font-black mb-2">เรียบร้อยครับ!</h2>
            <p className="text-blue-100 font-bold mb-8">แอดมินได้รับสลิปแล้ว กำลังตรวจสอบ<br/>ชั่วโมงจะเข้ากระเป๋าในไม่ช้านี้ครับ</p>
            <button onClick={() => setShowSuccess(false)} className="px-12 py-4 bg-white text-blue-600 rounded-2xl font-black hover:scale-105 transition-all">กลับหน้าร้านค้า</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <Link href={!isLoggedIn ? "/" : (isAdmin ? "/admin" : "/student")} className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-2 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            กลับหน้าหลัก
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">คอร์สเรียน & เอกสาร</h1>
        </div>
        <div className="relative w-full md:w-auto text-gray-900">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="ค้นหาคอร์ส..." className="w-full md:w-80 pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-400 font-bold transition-all shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setActiveTab('all')} className={`px-6 py-3 rounded-2xl font-black transition-all ${activeTab === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>ทั้งหมด</button>
        <button onClick={() => setActiveTab('course')} className={`px-6 py-3 rounded-2xl font-black transition-all ${activeTab === 'course' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-blue-50'}`}>คอร์สเรียน</button>
        <button onClick={() => setActiveTab('book')} className={`px-6 py-3 rounded-2xl font-black transition-all ${activeTab === 'book' ? 'bg-orange-50 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-orange-50'}`}>หนังสือ & ชีท</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl border border-gray-100 flex flex-col h-full group transition-all duration-300 overflow-hidden">
            <div className="h-52 bg-gray-50 relative overflow-hidden">
              <img src={item.image_url?.[0] || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              {item.referral_points > 0 && (
                <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg flex items-center gap-1"><Gift size={12}/> {item.referral_points} แต้ม</div>
              )}
            </div>
            <div className="p-7 flex flex-col flex-1">
              <h3 className="font-black text-xl mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-2 mb-6 font-medium h-10">{item.description}</p>
              <div className="mt-auto pt-5 border-t border-gray-50 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-widest">ราคา</span>
                  <span className="text-2xl font-black text-gray-900">฿{item.price.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => handleBuyClick(item)}
                  className="bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-gray-100"
                >
                  เลือกซื้อ <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-white rounded-[3rem] p-10 md:p-14 border border-gray-100 shadow-sm text-center">
        <h2 className="text-3xl font-black mb-2">สอบถามเรื่องการเรียน?</h2>
        <a href="https://lin.ee/ZSDR4B3" target="_blank" className="inline-flex items-center gap-3 bg-[#06C755] text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-100 transition-all hover:scale-105 active:scale-95">
          <MessageCircle size={24} /> ติดต่อ LINE Official
        </a>
      </div>
    </div>
  );
}
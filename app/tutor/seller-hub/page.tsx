'use client'
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Store, DollarSign, PlusCircle, Package, 
  Clock, CheckCircle2, AlertCircle, Loader2, Upload,
  Wallet, Landmark, User, CreditCard, ChevronRight,
  Image as ImageIcon, Link as LinkIcon, FileText, X, Layers, Trash2, BookOpen, History
} from 'lucide-react';
import Link from 'next/link';

export default function TutorSellerHub() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [tutorName, setTutorName] = useState('ติวเตอร์');
  const [myItems, setMyItems] = useState<any[]>([]);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [subject, setSubject] = useState('คณิตศาสตร์');
  const [documentLink, setDocumentLink] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const subjects = ['คณิตศาสตร์', 'ภาษาอังกฤษ', 'ภาษาไทย', 'สังคมศึกษา', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'ประวัติศาสตร์', 'ทุกวิชา'];

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. ดึงกระเป๋าเงินติวเตอร์ (affiliate_wallets)
      const { data: walletData } = await supabase.from('affiliate_wallets').select('*').eq('user_id', user.id).single();
      setWallet(walletData);

      // 2. ดึงชื่อติวเตอร์
      const { data: tutorProfile } = await supabase.from('tutors').select('name').eq('user_id', user.id).single();
      if (tutorProfile) setTutorName(tutorProfile.name);

      // 3. ดึงชีทที่วางขาย
      const { data: items } = await supabase.from('courses').select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
      setMyItems(items || []);

      // 4. ดึงประวัติถอนเงิน
      const { data: history } = await supabase.from('withdraw_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setWithdrawHistory(history || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string, title: string, salesCount: number) => {
    if (salesCount > 0) {
      alert(`⚠️ รายการนี้มียอดขายแล้ว ${salesCount} รายการ ไม่สามารถลบได้ครับ แนะนำให้ติดต่อ Admin เพื่อซ่อนรายการแทน`);
      return;
    }
    if (!confirm(`❓ ยืนยันการลบ "${title}" ?`)) return;
    setIsDeleting(id);
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      alert('🗑️ ลบรายการเรียบร้อยแล้ว');
      fetchSellerData();
    } catch (err: any) { alert('Error: ' + err.message); } finally { setIsDeleting(null); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) return alert('อัปโหลดได้สูงสุด 5 รูปครับ');
    setSelectedFiles([...selectedFiles, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newFiles = [...selectedFiles]; newFiles.splice(index, 1); setSelectedFiles(newFiles);
    const newPreviews = [...previews]; URL.revokeObjectURL(newPreviews[index]); newPreviews.splice(index, 1); setPreviews(newPreviews);
  };

  const handleUploadSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || price <= 0 || !documentLink) return alert('กรุณากรอกข้อมูลให้ครบถ้วนครับ');
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileName = `tutor-sell-${user?.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const { error: uploadError } = await supabase.storage.from('course-images').upload(`public/${fileName}`, file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(`public/${fileName}`);
          return publicUrl;
        });
        imageUrls = await Promise.all(uploadPromises);
      }
      
      const { error } = await supabase.from('courses').insert([{
        title, description, price, category: 'สรุปเนื้อหา', subject, document_url: documentLink, image_url: imageUrls,
        type: 'book', seller_id: user?.id, seller_name: tutorName,
        seller_type: 'tutor', // ระบุว่าเป็นติวเตอร์
        approval_status: 'PENDING', is_active: false 
      }]);
      
      if (error) throw error;
      alert('🚀 ส่งข้อมูลสำเร็จ! รอแอดมินตรวจสอบนะครับ');
      setTitle(''); setDescription(''); setPrice(0); setDocumentLink(''); setSelectedFiles([]); setPreviews([]);
      fetchSellerData();
    } catch (err: any) { alert("Error: " + err.message); } finally { setIsSubmitting(false); }
  };

  const handleWithdrawRequest = async () => {
    if (withdrawAmount < 100) return alert('ถอนขั้นต่ำ 100 บาทครับ');
    if (withdrawAmount > (wallet?.sales_balance || 0)) return alert('ยอดเงินไม่เพียงพอครับ');
    if (!bankName || !accountNumber || !accountName) return alert('กรุณากรอกข้อมูลบัญชีให้ครบถ้วนครับ');

    setIsWithdrawing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: withdrawError } = await supabase.from('withdraw_requests').insert([{
        user_id: user?.id, amount: withdrawAmount,
        bank_info: { bank: bankName, number: accountNumber, name: accountName }, status: 'PENDING'
      }]);
      if (withdrawError) throw withdrawError;

      // 🔴 หักเงินจากกระเป๋าติวเตอร์ (affiliate_wallets)
      await supabase.from('affiliate_wallets').update({ sales_balance: (wallet?.sales_balance || 0) - withdrawAmount }).eq('user_id', user?.id);
      
      alert('💸 ส่งคำขอถอนเงินเรียบร้อย!');
      setShowWithdrawModal(false);
      fetchSellerData();
    } catch (err: any) { alert(err.message); } finally { setIsWithdrawing(false); }
  };

  const filteredItems = myItems.filter(item => activeTab === 'ALL' ? true : item.approval_status === activeTab);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900 text-left">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link href="/tutor" className="text-gray-400 font-black text-xs uppercase mb-2 flex items-center gap-2 hover:text-purple-600 transition-all group w-max">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> กลับ Dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 text-slate-800">
              <Store className="text-purple-600" size={36}/> Seller Hub
            </h1>
            <p className="text-gray-500 font-bold text-sm">พื้นที่ฝากขายชีทและจัดการรายได้สำหรับติวเตอร์ 💸</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-purple-100 flex items-center gap-6">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
              <Wallet size={24}/>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ยอดเงินจากการขาย</p>
              <p className="text-3xl font-black text-slate-800">฿{(wallet?.sales_balance || 0).toLocaleString()}</p>
            </div>
            <button onClick={() => setShowWithdrawModal(true)} disabled={(wallet?.sales_balance || 0) < 100} className="ml-4 bg-gray-900 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-purple-600 transition-all shadow-md disabled:bg-gray-200 disabled:shadow-none">ถอนเงิน</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ฟอร์มลงขาย */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800"><PlusCircle size={20} className="text-purple-600"/> ลงขายชีททำเงิน</h2>
              <form onSubmit={handleUploadSheet} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex justify-between">ภาพประกอบ (สูงสุด 5) <span>{selectedFiles.length}/5</span></label>
                  <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative shrink-0"><img src={src} className="w-20 h-20 object-cover rounded-xl border"/><button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full"><X size={10}/></button></div>
                    ))}
                    {selectedFiles.length < 5 && <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-purple-300 transition-all"><ImageIcon size={20}/><span className="text-[8px] font-bold mt-1">เพิ่มรูป</span></button>}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                </div>
                <input required type="text" placeholder="ชื่อชีทสรุป..." className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-400 outline-none" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea placeholder="รายละเอียด..." className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-400 outline-none resize-none h-20" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="relative"><LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="url" placeholder="ลิงก์ไฟล์ (Drive/PDF)..." className="w-full pl-11 pr-4 p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-400 outline-none" value={documentLink} onChange={(e) => setDocumentLink(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" placeholder="ราคาขาย" className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-purple-600 outline-none focus:ring-2 focus:ring-purple-400" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} />
                  <select className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-400" value={subject} onChange={(e) => setSubject(e.target.value)}>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {price > 0 && <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 space-y-1"><div className="flex justify-between text-xs font-bold text-purple-400"><span>ค่าแพลตฟอร์ม (30%)</span><span className="text-red-500">- ฿{(price * 0.3).toFixed(0)}</span></div><div className="flex justify-between text-sm font-black text-purple-700 pt-2 border-t border-purple-200"><span>รายได้สุทธิ (70%)</span><span>฿{(price * 0.7).toFixed(0)}</span></div></div>}
                <button disabled={isSubmitting} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-purple-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300 shadow-xl">{isSubmitting ? <Loader2 className="animate-spin" /> : <Upload size={20}/>} ส่งให้แอดมินตรวจสอบ</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
             {/* รายการของฉัน */}
             <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                  <h2 className="text-xl font-black flex items-center gap-2"><Package size={20} className="text-purple-500"/> ชีทที่ฝากขาย</h2>
                  <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto hide-scrollbar">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(t => (
                      <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black whitespace-nowrap transition-all ${activeTab === t ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{t === 'ALL' ? 'ทั้งหมด' : t === 'PENDING' ? 'รออนุมัติ' : t === 'APPROVED' ? 'อนุมัติแล้ว' : 'ถูกปฏิเสธ'}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-300"><Layers size={48} className="mx-auto mb-2 opacity-20"/><p className="font-bold">ไม่พบรายการ</p></div>
                  ) : filteredItems.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-[1.5rem] border border-transparent hover:border-purple-200 transition-all group gap-4 relative">
                      <button onClick={() => handleDeleteItem(item.id, item.title, item.sales_count || 0)} disabled={isDeleting === item.id} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-all">{isDeleting === item.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}</button>
                      <div className="flex items-start gap-4 pr-8">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm border border-gray-100">{item.image_url?.[0] ? <img src={item.image_url[0]} className="w-full h-full object-cover" /> : <BookOpen size={20} className="text-purple-200"/>}</div>
                        <div><h3 className="font-black text-gray-900 line-clamp-1">{item.title}</h3><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-black text-purple-600">฿{item.price}</span><div className="w-1 h-1 bg-gray-300 rounded-full"></div><span className={`text-[10px] font-black uppercase ${item.approval_status === 'APPROVED' ? 'text-green-500' : item.approval_status === 'REJECTED' ? 'text-red-500' : 'text-purple-500'}`}>{item.approval_status === 'APPROVED' ? '✅ อนุมัติแล้ว' : item.approval_status === 'REJECTED' ? '❌ ถูกปฏิเสธ' : '⏳ รอตรวจสอบ'}</span></div></div>
                      </div>
                      <div className="sm:text-right border-t sm:border-none pt-3 sm:pt-0"><p className="text-[10px] font-black text-gray-400 uppercase">ยอดขาย</p><p className="text-xl font-black text-slate-800">{item.sales_count || 0}</p></div>
                    </div>
                  ))}
                </div>
             </div>

             {/* ประวัติการถอนเงิน */}
             <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2"><History size={20} className="text-blue-600"/> ประวัติการถอนเงิน</h2>
                <div className="space-y-3">
                   {withdrawHistory.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed text-gray-400 font-bold text-sm">ยังไม่มีประวัติการแจ้งถอนเงิน</div>
                   ) : (
                      withdrawHistory.map((w) => (
                        <div key={w.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${w.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : w.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                                 <DollarSign size={20}/>
                              </div>
                              <div>
                                 <p className="font-black text-slate-800">฿{w.amount.toLocaleString()}</p>
                                 <p className="text-[10px] text-gray-400 font-bold">{new Date(w.created_at).toLocaleDateString('th-TH')} • {w.bank_info?.bank}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${w.status === 'COMPLETED' ? 'bg-green-500 text-white' : w.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-purple-500 text-white'}`}>
                                 {w.status === 'COMPLETED' ? 'โอนสำเร็จ' : w.status === 'REJECTED' ? 'ไม่อนุมัติ' : 'รอแอดมินโอน'}
                              </span>
                              {w.status === 'REJECTED' && w.reject_reason && <p className="text-[8px] text-red-500 font-bold mt-1 max-w-[100px] truncate">{w.reject_reason}</p>}
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Modal ถอนเงิน */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowWithdrawModal(false)}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowWithdrawModal(false)} className="absolute top-6 right-6 text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={24}/></button>
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Landmark className="text-purple-600" /> แจ้งถอนรายได้</h2>
              <div className="space-y-5 text-left">
                <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100"><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">ยอดเงินคงเหลือ</p><p className="text-4xl font-black text-purple-700">฿{(wallet?.sales_balance || 0).toLocaleString()}</p></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex justify-between">ระบุจำนวนเงินที่จะถอน <span>ขั้นต่ำ 100.-</span></label><div className="relative mt-1"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600" size={18} /><input type="number" className="w-full pl-11 pr-4 p-4 bg-gray-50 border-none rounded-2xl font-black text-purple-700 focus:ring-2 focus:ring-purple-400 outline-none text-xl" value={withdrawAmount || ''} onChange={(e) => setWithdrawAmount(Number(e.target.value))} /></div></div>
                <div className="space-y-3 pt-2 border-t border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> ข้อมูลบัญชีธนาคาร</p><input type="text" placeholder="ชื่อธนาคาร (เช่น กสิกรไทย)" className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-400" value={bankName} onChange={(e) => setBankName(e.target.value)} /><input type="text" placeholder="เลขที่บัญชี" className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-400" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /><input type="text" placeholder="ชื่อเจ้าของบัญชี" className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-400" value={accountName} onChange={(e) => setAccountName(e.target.value)} /></div>
                <button onClick={handleWithdrawRequest} disabled={isWithdrawing || withdrawAmount < 100 || withdrawAmount > (wallet?.sales_balance || 0)} className="w-full bg-purple-600 text-white p-5 rounded-2xl font-black text-lg hover:bg-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-200 mt-4">{isWithdrawing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20}/>} ยืนยันการถอนเงิน</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
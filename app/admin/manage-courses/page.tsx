'use client'
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, Plus, Trash2, Edit3, Image as ImageIcon, 
  Book, Clock, X, Loader2, Camera, Save, Gift, Wallet, Infinity, Eye, EyeOff, Box, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ManageCoursesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [hoursCount, setHoursCount] = useState('0'); 
  const [referralPoints, setReferralPoints] = useState('0');
  const [type, setType] = useState('course'); 
  const [category, setCategory] = useState('ชั่วโมงเรียน');
  const [targetWalletType, setTargetWalletType] = useState('');
  const [stock, setStock] = useState('1');
  const [isUnlimited, setIsUnlimited] = useState(true);
  
  // ✨ เพิ่ม State สำหรับเก็บลิงก์เอกสาร Google Drive
  const [documentUrl, setDocumentUrl] = useState('');

  const walletOptions = [
    { label: 'ประถม - ม.ต้น (Online)', value: 'tier1_online' },
    { label: 'ประถม - ม.ต้น (Onsite)', value: 'tier1_onsite' },
    { label: 'สอบเข้า ม.4 (Online)', value: 'tier2_online' },
    { label: 'สอบเข้า ม.4 (Onsite)', value: 'tier2_onsite' },
    { label: 'ม.ปลาย/มหาลัย (Online)', value: 'tier3_online' },
    { label: 'ม.ปลาย/มหาลัย (Onsite)', value: 'tier3_onsite' },
  ];
  
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const formattedData = data.map(item => ({
        ...item,
        image_url: Array.isArray(item.image_url) ? item.image_url : (item.image_url ? [item.image_url] : []),
        type: item.type || 'course',
        is_active: item.is_active !== false 
      }));
      setItems(formattedData);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const filesArray = Array.from(files);
    const updatedFiles = [...imageFiles, ...filesArray].slice(0, 5);
    setImageFiles(updatedFiles);
    const newPreviews = updatedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleSave = async () => {
    if (!title || !price) return alert("กรุณากรอกชื่อและราคาครับ");
    if (type === 'course' && !targetWalletType) return alert("กรุณาเลือกประเภทกระเป๋าที่จะเติมชั่วโมงด้วยครับ");
    
    setLoading(true);
    try {
      let finalUrls = editingItem ? (editingItem.image_url || []) : [];

      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('course-assets').upload(fileName, file);
          if (uploadErr) throw uploadErr;
          const { data } = supabase.storage.from('course-assets').getPublicUrl(fileName);
          return data.publicUrl;
        });
        const newUrls = await Promise.all(uploadPromises);
        finalUrls = editingItem ? [...finalUrls, ...newUrls] : newUrls;
      }

      const payload = { 
        title, 
        description, 
        price: parseFloat(price), 
        type, 
        category, 
        image_url: finalUrls,
        hours_count: parseInt(hoursCount) || 0,
        referral_points: parseInt(referralPoints) || 0,
        target_wallet_type: type === 'course' ? targetWalletType : null,
        stock: isUnlimited ? 0 : parseInt(stock) || 0, 
        is_unlimited: isUnlimited, 
        is_active: editingItem ? editingItem.is_active : true,
        document_url: type === 'book' ? documentUrl : null // ✨ บันทึกลิงก์ (เฉพาะประเภทหนังสือ)
      };

      const { error: dbError } = editingItem 
        ? await supabase.from('courses').update(payload).eq('id', editingItem.id)
        : await supabase.from('courses').insert([payload]);

      if (dbError) throw dbError;

      alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
      resetForm();
      fetchItems();
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setHoursCount('0');
    setReferralPoints('0');
    setType('course');
    setCategory('ชั่วโมงเรียน');
    setTargetWalletType('');
    setStock('1');
    setIsUnlimited(true);
    setDocumentUrl(''); // ✨ รีเซ็ตลิงก์
    setImageFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setTitle(item.title);
    setPrice(item.price.toString());
    setHoursCount(item.hours_count?.toString() || '0');
    setReferralPoints(item.referral_points?.toString() || '0');
    setDescription(item.description || '');
    setType(item.type || 'course');
    setCategory(item.category || 'ชั่วโมงเรียน');
    setTargetWalletType(item.target_wallet_type || '');
    setStock(item.stock?.toString() || '0');
    setIsUnlimited(item.is_unlimited !== false); 
    setDocumentUrl(item.document_url || ''); // ✨ ดึงลิงก์เดิมมาแสดง
    setPreviewUrls(item.image_url || []);
    setImageFiles([]); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchItems();
    }
  };

  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchItems(); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: ' + error.message);
    }
  };

  const ItemCard = ({ item }: { item: any }) => {
    const isOutOfStock = !item.is_unlimited && item.stock <= 0;
    
    return (
      <div className={`bg-white p-5 rounded-[32px] shadow-sm border flex flex-col h-full group transition-all relative ${!item.is_active ? 'opacity-60 border-gray-200 bg-gray-50' : isOutOfStock ? 'border-red-100 bg-red-50/30' : 'border-gray-100 hover:shadow-md'}`}>
        
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={() => handleToggleVisibility(item.id, item.is_active)}
            className={`p-2 rounded-xl backdrop-blur-md shadow-sm transition-colors ${item.is_active ? 'bg-white/80 text-gray-600 hover:text-orange-500' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            title={item.is_active ? "ซ่อนจากหน้าร้าน" : "แสดงที่หน้าร้าน"}
          >
            {item.is_active ? <Eye size={18}/> : <EyeOff size={18}/>}
          </button>
        </div>

        <div className={`h-44 bg-gray-100 rounded-2xl mb-4 overflow-hidden relative ${!item.is_active ? 'grayscale' : ''}`}>
          {item.image_url?.[0] ? (
            <img src={item.image_url[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageIcon size={40}/>
            </div>
          )}
          
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 shadow-sm flex items-center gap-1">
            {item.type === 'course' ? <Clock size={10}/> : <Book size={10}/>}
            {item.category}
          </div>

          {!item.is_active && (
            <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
              <span className="bg-gray-900 text-white px-4 py-2 rounded-xl font-black text-sm tracking-widest uppercase">ซ่อนอยู่</span>
            </div>
          )}
        </div>
        
        <h3 className="font-bold text-lg text-gray-800 line-clamp-1 pr-12">{item.title}</h3>
        
        <div className="mt-2 flex flex-wrap items-center gap-2">
           {item.is_unlimited ? (
             <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg flex items-center gap-1 w-max"><Infinity size={12}/> ไม่จำกัดสต็อก</span>
           ) : isOutOfStock ? (
             <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1 w-max border border-red-100">❌ สินค้าหมดแล้ว</span>
           ) : (
             <span className="text-[10px] font-black text-gray-600 bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1 w-max"><Box size={12}/> เหลือ {item.stock} ชิ้น</span>
           )}

           {item.referral_points > 0 && (
             <span className="text-[10px] font-black text-white bg-gradient-to-r from-purple-500 to-indigo-500 px-2 py-1 rounded-lg flex items-center gap-1 w-max shadow-sm"><Gift size={10}/> {item.referral_points} pts</span>
           )}

           {/* ✨ แจ้งเตือนว่ามีลิงก์เอกสารแล้ว */}
           {item.type === 'book' && item.document_url && (
             <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg flex items-center gap-1 w-max">
               <ExternalLink size={10}/> มีลิงก์เอกสาร
             </span>
           )}
        </div>

        <div className="mt-auto pt-4 flex justify-between items-center">
          <div className="flex flex-col">
              {item.type === 'course' && <span className="text-[10px] font-black text-blue-500 uppercase">{item.hours_count} ชม.</span>}
              <span className="text-xl font-black text-gray-900">฿{item.price}</span>
          </div>
          <div className="flex gap-2 relative z-10">
            <button onClick={() => handleEdit(item)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
              <Edit3 size={18}/>
            </button>
            <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
              <Trash2 size={18}/>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans text-gray-900">
      <Link href="/admin" className="flex items-center text-blue-600 mb-8 font-bold hover:translate-x-[-4px] transition-all">
        <ArrowLeft size={20} className="mr-2" /> กลับไปหน้าควบคุม
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* --- ส่วนที่ 1: ฟอร์มกรอกข้อมูล --- */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-blue-100/20 border border-blue-50 sticky top-8">
            <h2 className="text-2xl font-black mb-8 text-gray-800 flex items-center gap-3">
              {editingItem ? <Edit3 className="text-orange-500"/> : <Plus className="text-blue-600"/>}
              {editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มสินค้า/คอร์ส'}
            </h2>
            
            <div className="space-y-6">
              <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                <button onClick={() => setType('course')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'course' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>คอร์สเรียน</button>
                <button onClick={() => setType('book')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'book' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>หนังสือ/ชีท</button>
              </div>

              {/* รูปภาพ */}
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">รูปภาพ ({previewUrls.length}/5)</label>
                <div className="grid grid-cols-3 gap-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative h-20 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                      <img src={url} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={12}/></button>
                    </div>
                  ))}
                  {previewUrls.length < 5 && (
                    <button onClick={() => fileInputRef.current?.click()} className="h-20 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all">
                      <Camera size={24}/>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="ชื่อรายการ..." className="w-full p-4 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
                
                {/* ✨ ส่วนลิงก์เอกสาร (โชว์เฉพาะถ้าเป็นหนังสือ/ชีท) */}
                {type === 'book' && (
                  <div className="space-y-1 animate-in fade-in zoom-in duration-300">
                    <label className="text-[10px] font-black text-orange-500 ml-2 uppercase flex items-center gap-1">
                      <LinkIcon size={12}/> ลิงก์ไฟล์เอกสาร (Google Drive, PDF ฯลฯ)
                    </label>
                    <input 
                      type="url" 
                      placeholder="https://drive.google.com/..." 
                      className="w-full p-4 bg-orange-50/50 rounded-2xl focus:ring-2 focus:ring-orange-400 outline-none font-bold text-gray-700 border border-orange-100" 
                      value={documentUrl} 
                      onChange={(e) => setDocumentUrl(e.target.value)} 
                    />
                  </div>
                )}

                {type === 'course' && (
                  <div className="space-y-1 animate-in fade-in zoom-in duration-300">
                    <label className="text-[10px] font-black text-blue-600 ml-2 uppercase flex items-center gap-1">
                      <Wallet size={12}/> ระบุกระเป๋าที่จะเติมชั่วโมง
                    </label>
                    <select 
                      className="w-full p-4 bg-blue-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-900 border border-blue-100" 
                      value={targetWalletType} 
                      onChange={(e) => setTargetWalletType(e.target.value)}
                    >
                      <option value="">-- เลือกประเภทกระเป๋า --</option>
                      {walletOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">ราคา (บาท)</label>
                    <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  {type === 'course' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">ชั่วโมงที่ได้รับ</label>
                      <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-gray-700" value={hoursCount} onChange={(e) => setHoursCount(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                   <div className="flex items-center gap-2">
                     <Box size={16} className="text-gray-400"/>
                     <span className="text-xs font-black text-gray-600 uppercase">จัดการสต็อก</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <input 
                       type="checkbox" 
                       id="unlimitedStock"
                       className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
                       checked={isUnlimited}
                       onChange={(e) => setIsUnlimited(e.target.checked)}
                     />
                     <label htmlFor="unlimitedStock" className="text-xs font-bold text-gray-700 cursor-pointer flex items-center gap-1">
                       <Infinity size={14} className="text-blue-500" /> ไม่จำกัดจำนวน (ขายได้เรื่อยๆ)
                     </label>
                   </div>
                   
                   {!isUnlimited && (
                     <div className="pl-8 animate-in fade-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">ระบุจำนวนชิ้นที่มี</label>
                       <input 
                         type="number" min="0" 
                         className="w-full p-3 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black border border-gray-200" 
                         value={stock} 
                         onChange={(e) => setStock(e.target.value)} 
                       />
                     </div>
                   )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-purple-500 ml-2 uppercase flex items-center gap-1"><Gift size={12}/> แต้ม Affiliate</label>
                  <input type="number" className="w-full p-4 bg-purple-50 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-black text-purple-700" value={referralPoints} onChange={(e) => setReferralPoints(e.target.value)} />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">หมวดหมู่</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option>ชั่วโมงเรียน</option>
                        <option>วิดีโอ</option>
                        <option>หนังสือ</option>
                        <option>ไฟล์ PDF</option>
                    </select>
                </div>
                
                <textarea placeholder="รายละเอียดสินค้า..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none h-24 resize-none text-gray-600 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              
              <button onClick={handleSave} disabled={loading} className={`w-full p-5 rounded-[24px] text-white font-black shadow-lg active:scale-95 flex items-center justify-center gap-3 ${loading ? 'bg-gray-400' : type === 'course' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                {editingItem ? 'บันทึกการแก้ไข' : 'ยืนยันการเพิ่มรายการ'}
              </button>
            </div>
          </div>
        </div>

        {/* --- ส่วนที่ 2: แสดงรายการคอร์ส --- */}
        <div className="lg:col-span-8 space-y-16">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><Clock size={24}/></div>
              <h2 className="text-3xl font-black text-gray-800">คอร์สเรียน & บริการ</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {items.filter(i => i.type === 'course').map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          </div>
          <hr className="border-gray-200" />
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600"><Book size={24}/></div>
              <h2 className="text-3xl font-black text-gray-800">หนังสือ & ชีทเรียน</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {items.filter(i => i.type === 'book').map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
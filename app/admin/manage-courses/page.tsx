'use client'
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, Plus, Trash2, Edit3, Image as ImageIcon, 
  Book, Clock, X, Loader2, Camera, Save, Hash, Gift, Wallet // ✨ เพิ่ม Wallet icon
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
  const [targetWalletType, setTargetWalletType] = useState(''); // ✨ State ใหม่สำหรับระบุกระเป๋า

  // ตัวเลือกกระเป๋าเงิน 6 รูปแบบ
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
        type: item.type || 'course' 
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
        is_active: true,
        hours_count: parseInt(hoursCount) || 0,
        referral_points: parseInt(referralPoints) || 0,
        target_wallet_type: type === 'course' ? targetWalletType : null // ✨ บันทึกประเภทกระเป๋า
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
    setTargetWalletType(''); // ✨ รีเซ็ต
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
    setTargetWalletType(item.target_wallet_type || ''); // ✨ ดึงค่ากระเป๋ามาโชว์
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

  const ItemCard = ({ item }: { item: any }) => (
    <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-full group">
      <div className="h-44 bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
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

        {item.referral_points > 0 && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-md flex items-center gap-1">
            <Gift size={10}/> {item.referral_points} แต้ม
          </div>
        )}

        {item.type === 'course' && (
          <div className="absolute bottom-2 right-2 bg-gray-900/80 backdrop-blur text-white px-3 py-1 rounded-lg text-[9px] font-black shadow-lg">
             {item.target_wallet_type?.replace('_', ' ').toUpperCase()}
          </div>
        )}
      </div>
      
      <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{item.title}</h3>
      <div className="mt-auto pt-4 flex justify-between items-center">
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-500 uppercase">{item.hours_count} ชม.</span>
            <span className="text-xl font-black text-gray-900">฿{item.price}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleEdit(item)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
            <Edit3 size={18}/>
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
            <Trash2 size={18}/>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans text-gray-900">
      <Link href="/admin" className="flex items-center text-blue-600 mb-8 font-bold hover:translate-x-[-4px] transition-all">
        <ArrowLeft size={20} className="mr-2" /> กลับไปหน้าควบคุม
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
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
                
                {/* ✨ ส่วนใหม่: เลือกประเภทกระเป๋า (เฉพาะถ้าเป็นคอร์ส) */}
                {type === 'course' && (
                  <div className="space-y-1">
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
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">ชั่วโมงที่ได้รับ</label>
                    <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-gray-700" value={hoursCount} onChange={(e) => setHoursCount(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-purple-500 ml-2 uppercase flex items-center gap-1"><Gift size={12}/> แต้ม Affiliate</label>
                  <input type="number" className="w-full p-4 bg-purple-50 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-black text-purple-700" value={referralPoints} onChange={(e) => setReferralPoints(e.target.value)} />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">หมวดหมู่</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option>ชั่วโมงเรียน</option>
                        <option>วิดีโอ</option>
                        <option>หนังสือ</option>
                        <option>ไฟล์ PDF</option>
                    </select>
                </div>
                
                <textarea placeholder="รายละเอียด..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none h-32 resize-none text-gray-600" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              
              <button onClick={handleSave} disabled={loading} className={`w-full p-5 rounded-[24px] text-white font-black shadow-lg active:scale-95 flex items-center justify-center gap-3 ${loading ? 'bg-gray-400' : type === 'course' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                {editingItem ? 'บันทึกการแก้ไข' : 'ยืนยันการเพิ่ม'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-16">
          {/* ส่วนแสดงรายการสินค้า แบ่งเป็น Course และ Book เหมือนเดิม */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><Clock size={24}/></div>
              <h2 className="text-3xl font-black text-gray-800">คอร์สเรียน & บริการ</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.filter(i => i.type === 'course').map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          </div>
          <hr />
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600"><Book size={24}/></div>
              <h2 className="text-3xl font-black text-gray-800">หนังสือ & ชีทเรียน</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.filter(i => i.type === 'book').map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
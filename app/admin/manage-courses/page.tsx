'use client'
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, Plus, Trash2, Edit3, Image as ImageIcon, 
  Book, Clock, X, Loader2, Camera, Save, Gift, Wallet, Infinity, Eye, EyeOff, Box, Link as LinkIcon, ExternalLink, Tag, ArrowUpCircle, GraduationCap, User
} from 'lucide-react';
import Link from 'next/link';

export default function ManageCoursesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState(''); 
  const [price, setPrice] = useState('');
  const [hoursCount, setHoursCount] = useState('0'); 
  const [referralPoints, setReferralPoints] = useState('0');
  const [type, setType] = useState('course'); 
  const [category, setCategory] = useState('ชั่วโมงเรียน');
  const [targetWalletType, setTargetWalletType] = useState('');
  const [stock, setStock] = useState('1');
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [documentUrl, setDocumentUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const [subject, setSubject] = useState('คณิตศาสตร์');
  const [level, setLevel] = useState('ม.ปลาย');
  
  const [sellerType, setSellerType] = useState('institute');
  const [sellerName, setSellerName] = useState('TC Center');

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [allAvailableTags, setAllAvailableTags] = useState<string[]>([]);

  const subjects = ['คณิตศาสตร์', 'ภาษาอังกฤษ', 'ภาษาไทย', 'สังคมศึกษา', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'ประวัติศาสตร์', 'ทั่วไป'];
  const levels = ['ประถม', 'ม.ต้น', 'ม.ปลาย', 'มหาวิทยาลัย'];

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
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      const tagsSet = new Set<string>();

      const formattedData = data.map(item => {
        let parsedTags: string[] = [];
        if (Array.isArray(item.tags)) {
          parsedTags = item.tags;
        } else if (typeof item.tags === 'string') {
          try {
            parsedTags = JSON.parse(item.tags);
          } catch {
            // ✨ แก้ปัญหาขีดแดง TypeScript ตรงนี้ (เติม t: string)
            parsedTags = item.tags.replace(/^{|}$/g, '').split(',').map((t: string) => t.trim().replace(/^"|"$/g, '')).filter(Boolean);
          }
        }

        parsedTags.forEach((t: string) => tagsSet.add(t));

        return {
          ...item,
          image_url: Array.isArray(item.image_url) ? item.image_url : (item.image_url ? [item.image_url] : []),
          type: item.type || 'course',
          is_active: item.is_active !== false,
          tags: parsedTags,
          seller_type: item.seller_type || 'institute',
          seller_name: item.seller_name || 'TC Center',
          original_price: item.original_price || 0 
        };
      });

      setItems(formattedData);
      setAllAvailableTags(Array.from(tagsSet));
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

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tag = newTagInput.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };

  const handleDeleteGlobalTag = async (tagToDelete: string) => {
    if (!confirm(`⚠️ ยืนยันการลบ Tag "${tagToDelete}" ออกจากระบบ?\n\n(การกระทำนี้จะดึง Tag นี้ออกจากทุกคอร์ส/ชีท ที่เคยถูกใส่ไว้ทั้งหมดครับ)`)) return;
    
    setLoading(true);
    try {
      const coursesToUpdate = items.filter(item => item.tags && item.tags.includes(tagToDelete));
      
      if (coursesToUpdate.length > 0) {
        const updatePromises = coursesToUpdate.map(course => {
          const updatedTags = course.tags.filter((t: string) => t !== tagToDelete);
          return supabase.from('courses').update({ tags: updatedTags }).eq('id', course.id);
        });
        await Promise.all(updatePromises);
      }
      
      setSelectedTags(prev => prev.filter(t => t !== tagToDelete));
      
      alert(`🗑️ ลบ Tag "${tagToDelete}" ออกจากระบบเรียบร้อยแล้วครับ!`);
      fetchItems(); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการลบ Tag: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !price) return alert("กรุณากรอกชื่อและราคาครับ");
    if (type === 'course' && !targetWalletType) return alert("กรุณาเลือกประเภทกระเป๋าที่จะเติมชั่วโมงด้วยครับ");
    
    let finalTagsToSave = [...selectedTags];
    const pendingTag = newTagInput.trim();
    if (pendingTag && !finalTagsToSave.includes(pendingTag)) {
      finalTagsToSave.push(pendingTag);
    }

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
        original_price: parseFloat(originalPrice) || 0,
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
        document_url: type === 'book' ? documentUrl : null,
        tags: finalTagsToSave,
        sort_order: parseInt(sortOrder) || 0,
        subject: type === 'book' ? subject : null,
        level: type === 'book' ? level : null,
        seller_type: sellerType,
        seller_name: sellerName,
        approval_status: 'APPROVED'
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
    setOriginalPrice('');
    setPrice('');
    setHoursCount('0');
    setReferralPoints('0');
    setType('course');
    setCategory('ชั่วโมงเรียน');
    setTargetWalletType('');
    setStock('1');
    setIsUnlimited(true);
    setDocumentUrl('');
    setSelectedTags([]); 
    setNewTagInput('');
    setSortOrder('0');
    setImageFiles([]);
    setPreviewUrls([]);
    setSubject('คณิตศาสตร์');
    setLevel('ม.ปลาย');
    setSellerType('institute');
    setSellerName('TC Center');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setTitle(item.title);
    setOriginalPrice(item.original_price?.toString() || '');
    setPrice(item.price.toString());
    setHoursCount(item.hours_count?.toString() || '0');
    setReferralPoints(item.referral_points?.toString() || '0');
    setDescription(item.description || '');
    setType(item.type || 'course');
    setCategory(item.category || 'ชั่วโมงเรียน');
    setTargetWalletType(item.target_wallet_type || '');
    setStock(item.stock?.toString() || '0');
    setIsUnlimited(item.is_unlimited !== false); 
    setDocumentUrl(item.document_url || ''); 
    setSelectedTags(item.tags || []); 
    setSortOrder(item.sort_order?.toString() || '0');
    setPreviewUrls(item.image_url || []);
    setSubject(item.subject || 'คณิตศาสตร์');
    setLevel(item.level || 'ม.ปลาย');
    setSellerType(item.seller_type || 'institute');
    setSellerName(item.seller_name || 'TC Center');
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
      const { error } = await supabase.from('courses').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      fetchItems(); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: ' + error.message);
    }
  };

  const ItemCard = ({ item }: { item: any }) => {
    const isOutOfStock = !item.is_unlimited && item.stock <= 0;
    const hasPromo = item.original_price > item.price; 
    
    return (
      <div className={`bg-white p-4 rounded-[24px] shadow-sm border flex flex-col h-full group transition-all relative ${!item.is_active ? 'opacity-60 border-gray-200 bg-gray-50' : isOutOfStock ? 'border-red-100 bg-red-50/30' : 'border-gray-100 hover:shadow-md hover:-translate-y-1'}`}>
        
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
          {item.sort_order > 0 && (
            <div className="bg-yellow-400 text-yellow-900 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center justify-center shadow-md">
              <ArrowUpCircle size={12} className="mr-0.5"/> ลำดับ {item.sort_order}
            </div>
          )}
          {hasPromo && (
            <div className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md animate-pulse">
              PROMO
            </div>
          )}
          <button 
            onClick={() => handleToggleVisibility(item.id, item.is_active)}
            className={`p-1.5 rounded-lg backdrop-blur-md shadow-sm transition-colors ${item.is_active ? 'bg-white/80 text-gray-600 hover:text-orange-500' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            title={item.is_active ? "ซ่อนจากหน้าร้าน" : "แสดงที่หน้าร้าน"}
          >
            {item.is_active ? <Eye size={16}/> : <EyeOff size={16}/>}
          </button>
        </div>

        <div className={`h-32 bg-gray-100 rounded-xl mb-3 overflow-hidden relative ${!item.is_active ? 'grayscale' : ''}`}>
          {item.image_url?.[0] ? (
            <img src={item.image_url[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageIcon size={32}/>
            </div>
          )}
          
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[9px] font-bold text-blue-600 shadow-sm flex items-center gap-1">
            {item.type === 'course' ? <Clock size={10}/> : <Book size={10}/>}
            {item.category}
          </div>

          {!item.is_active && (
            <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
              <span className="bg-gray-900 text-white px-3 py-1.5 rounded-lg font-black text-xs tracking-widest uppercase">ซ่อนอยู่</span>
            </div>
          )}
        </div>
        
        <h3 className="font-bold text-base text-gray-800 line-clamp-1 pr-8 leading-tight">{item.title}</h3>
        
        {item.type === 'book' && item.seller_type !== 'institute' && (
          <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-orange-500">
             <User size={10}/> โดย: {item.seller_name} ({item.seller_type === 'tutor' ? 'ติวเตอร์' : 'นักเรียน'})
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map((t: string) => (
              <span key={t} className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">#{t}</span>
            ))}
          </div>
        )}
        
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {item.is_unlimited ? (
              <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md flex items-center gap-1 w-max"><Infinity size={10}/> ไม่จำกัด</span>
            ) : isOutOfStock ? (
              <span className="text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md flex items-center gap-1 w-max border border-red-100">❌ หมดแล้ว</span>
            ) : (
              <span className="text-[9px] font-black text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-1 w-max"><Box size={10}/> {item.stock} ชิ้น</span>
            )}

            {item.referral_points > 0 && (
              <span className="text-[9px] font-black text-white bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-0.5 rounded-md flex items-center gap-1 w-max shadow-sm"><Gift size={10}/> {item.referral_points} pts</span>
            )}

            {item.type === 'book' && (
              <div className="flex gap-1">
                 <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100">{item.subject}</span>
                 <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">{item.level}</span>
              </div>
            )}
        </div>

        <div className="mt-auto pt-3 flex justify-between items-end">
          <div className="flex flex-col">
              {item.type === 'course' && <span className="text-[9px] font-black text-blue-500 uppercase mb-0.5">{item.hours_count} ชม.</span>}
              {hasPromo && <span className="text-[9px] text-gray-400 line-through leading-none">฿{item.original_price}</span>}
              <span className={`text-lg font-black leading-none mt-0.5 ${hasPromo ? 'text-red-500' : 'text-gray-900'}`}>฿{item.price}</span>
          </div>
          <div className="flex gap-1.5 relative z-10">
            <button onClick={() => handleEdit(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
              <Edit3 size={14}/>
            </button>
            <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
              <Trash2 size={14}/>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans text-gray-900">
      <Link href="/admin" className="flex items-center text-blue-600 mb-6 font-bold hover:translate-x-[-4px] transition-all text-sm w-max">
        <ArrowLeft size={16} className="mr-2" /> กลับไปหน้าควบคุม
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start">
        
        <div className="lg:col-span-4 lg:sticky lg:top-8 z-20">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-100/20 border border-blue-50 flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden">
            
            <div className="p-6 pb-4 border-b border-gray-50 shrink-0 bg-white z-10">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-3">
                {editingItem ? <Edit3 className="text-orange-500" size={24}/> : <Plus className="text-blue-600" size={24}/>}
                {editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มสินค้า/คอร์ส'}
              </h2>
            </div>
            
            <div className="p-6 pt-4 overflow-y-auto flex-1 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                <button onClick={() => setType('course')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'course' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>คอร์สเรียน</button>
                <button onClick={() => setType('book')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'book' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>หนังสือ/ชีท</button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">รูปภาพ ({previewUrls.length}/5)</label>
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                      <img src={url} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={10}/></button>
                    </div>
                  ))}
                  {previewUrls.length < 5 && (
                    <button onClick={() => fileInputRef.current?.click()} className="h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all">
                      <Camera size={20}/>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              {type === 'book' && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <label className="text-[10px] font-black text-gray-600 uppercase flex items-center gap-1"><User size={12}/> ข้อมูลผู้ขาย (Seller)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-xs font-bold shadow-sm outline-none" value={sellerType} onChange={(e) => setSellerType(e.target.value)}>
                      <option value="institute">สถาบัน (TC Center)</option>
                      <option value="tutor">ติวเตอร์</option>
                      <option value="student">นักเรียน</option>
                    </select>
                    <input 
                      type="text" placeholder="ชื่อคนขาย" 
                      className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-xs font-bold shadow-sm outline-none"
                      value={sellerName} onChange={(e) => setSellerName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {type === 'book' && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-600 uppercase">วิชา</label>
                    <select className="w-full p-2.5 bg-white rounded-xl border-none text-xs font-bold shadow-sm" value={subject} onChange={(e) => setSubject(e.target.value)}>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-600 uppercase">ระดับชั้น</label>
                    <select className="w-full p-2.5 bg-white rounded-xl border-none text-xs font-bold shadow-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
                      {levels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <input type="text" placeholder="ชื่อรายการ..." className="w-full p-3.5 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
                
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 space-y-3">
                  <label className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"><Tag size={12}/> Tag จัดหมวดหมู่</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" placeholder="พิมพ์ชื่อ Tag..." 
                      className="flex-1 p-2.5 rounded-lg border border-white focus:border-blue-400 outline-none text-xs font-bold shadow-sm" 
                      value={newTagInput} onChange={e => setNewTagInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    />
                    <button type="button" onClick={handleAddTag} className="bg-blue-600 text-white px-3 rounded-lg font-bold text-xs shadow-md active:scale-95 transition-all">เพิ่ม</button>
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedTags.map(tag => (
                        <span key={tag} className="bg-blue-600 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          {tag} <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-300"><X size={12}/></button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {allAvailableTags.length > 0 && (
                    <div className="pt-2.5 border-t border-blue-100">
                      <p className="text-[9px] font-black text-blue-400 mb-1.5 uppercase tracking-widest">คลิกเพื่อเลือก Tag ที่มีอยู่แล้ว</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allAvailableTags.filter(t => !selectedTags.includes(t)).map(tag => (
                          <div key={tag} className="flex items-stretch bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                            <button type="button" onClick={() => setSelectedTags([...selectedTags, tag])} className="px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 text-[9px] font-black transition-all">
                              + {tag}
                            </button>
                            <button type="button" onClick={() => handleDeleteGlobalTag(tag)} className="px-1.5 py-1 border-l border-gray-100 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-100 transition-all active:scale-95" title="ลบ Tag นี้ออกจากระบบอย่างถาวร">
                              <X size={10}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 ml-1 uppercase">ราคาเต็ม (ก่อนลด)</label>
                    <input type="number" placeholder="ไม่ใส่=ไม่มีโปร" className="w-full p-3.5 bg-gray-50 rounded-xl focus:ring-2 focus:ring-gray-300 outline-none font-black text-gray-400 line-through text-sm" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-red-500 ml-1 uppercase">ราคาขายจริง 🔥</label>
                    <input type="number" className="w-full p-3.5 bg-red-50 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-black text-red-600 text-sm border border-red-100" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 ml-1 uppercase flex items-center gap-1"><ArrowUpCircle size={10}/> ความสำคัญ (เลขมาก=บนสุด)</label>
                  <input type="number" className="w-full p-3.5 bg-yellow-50 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-black text-yellow-700 border border-yellow-100 text-sm" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
                </div>

                {type === 'course' && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-blue-600 ml-1 uppercase flex items-center gap-1"><Wallet size={12}/> ระบุกระเป๋าที่จะเติมชั่วโมง</label>
                      <select className="w-full p-3.5 bg-blue-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-900 border border-blue-100 text-sm" value={targetWalletType} onChange={(e) => setTargetWalletType(e.target.value)}>
                        <option value="">-- เลือกประเภทกระเป๋า --</option>
                        {walletOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 ml-1 uppercase">ชั่วโมงที่ได้รับ</label>
                      <input type="number" className="w-full p-3.5 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-gray-700 text-sm" value={hoursCount} onChange={(e) => setHoursCount(e.target.value)} />
                    </div>
                  </div>
                )}

                {type === 'book' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-500 ml-1 uppercase flex items-center gap-1"><LinkIcon size={12}/> ลิงก์ไฟล์เอกสาร (Google Drive ฯลฯ)</label>
                    <input type="url" placeholder="https://..." className="w-full p-3.5 bg-orange-50/50 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none font-bold text-gray-700 border border-orange-100 text-sm" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} />
                  </div>
                )}

                <div className="bg-gray-50 p-3.5 rounded-xl space-y-2 border border-gray-100">
                   <div className="flex items-center gap-2 mb-1">
                     <Box size={14} className="text-gray-400"/><span className="text-[10px] font-black text-gray-600 uppercase">จัดการสต็อก</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <input type="checkbox" id="unlimitedStock" className="w-4 h-4 accent-blue-600 cursor-pointer rounded" checked={isUnlimited} onChange={(e) => setIsUnlimited(e.target.checked)}/>
                     <label htmlFor="unlimitedStock" className="text-xs font-bold text-gray-700 cursor-pointer flex items-center gap-1"><Infinity size={12} className="text-blue-500" /> ไม่จำกัดจำนวน</label>
                   </div>
                   {!isUnlimited && (
                     <div className="pl-6 pt-1">
                       <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">ระบุจำนวนชิ้นที่มี</label>
                       <input type="number" min="0" className="w-full p-2.5 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-black border border-gray-200 text-sm" value={stock} onChange={(e) => setStock(e.target.value)} />
                     </div>
                   )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-purple-500 ml-1 uppercase flex items-center gap-1"><Gift size={12}/> แต้ม Affiliate</label>
                  <input type="number" className="w-full p-3.5 bg-purple-50 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-black text-purple-700 text-sm" value={referralPoints} onChange={(e) => setReferralPoints(e.target.value)} />
                </div>
                
                <textarea placeholder="รายละเอียดสินค้า..." className="w-full p-3.5 bg-gray-50 rounded-xl outline-none h-20 resize-none text-gray-600 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="p-6 bg-gray-50/80 border-t border-gray-100 shrink-0 rounded-b-[2rem] backdrop-blur-sm z-10">
              <button onClick={handleSave} disabled={loading} className={`w-full p-4 rounded-xl text-white font-black shadow-md active:scale-95 flex items-center justify-center gap-2 ${loading ? 'bg-gray-400' : type === 'course' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'} transition-all`}>
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                {editingItem ? 'บันทึกการแก้ไข' : 'ยืนยันการเพิ่มรายการ'}
              </button>
            </div>

          </div>
        </div>

        {/* 📚 ฝั่งแสดงรายการที่สร้างแล้ว (ด้านขวา) */}
        <div className="lg:col-span-8 space-y-12 text-left">
          
          {/* Section: คอร์สเรียน */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Clock size={20}/></div>
              <h2 className="text-2xl font-black text-gray-800">คอร์สเรียน & บริการ</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {items.filter(i => i.type === 'course').map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          </div>
          
          <hr className="border-gray-200" />
          
          {/* Section: หนังสือ & ชีทเรียน */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"><Book size={20}/></div>
              <h2 className="text-2xl font-black text-gray-800">หนังสือ & ชีทเรียน</h2>
            </div>
            
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
               <span className="text-xs font-bold text-gray-500 py-1 flex items-center gap-1"><User size={14}/> แหล่งที่มา:</span>
               <button className="bg-gray-800 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm">ทั้งหมด</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {items.filter(i => i.type === 'book').map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
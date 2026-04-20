'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PackagePlus, Gift, Store, Loader2, CheckCircle, Clock, 
  Users, GraduationCap, ImagePlus, X, ArrowLeft, Trash2, Eye, EyeOff,
  Infinity, Box, Edit3, Search, XCircle, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function AdminShopPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // ✨ State สำหรับการแก้ไข
  const [editingReward, setEditingReward] = useState<any>(null);
  
  // Form States
  const [rewardName, setRewardName] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [targetGroup, setTargetGroup] = useState('TUTOR');
  const [rewardStock, setRewardStock] = useState('1'); 
  const [isUnlimited, setIsUnlimited] = useState(false); 
  
  // Image Upload States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]); 

  // Data States
  const [rewards, setRewards] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  // ✨ States สำหรับตารางรับคำร้อง (Tabs & Search)
  const [requestTab, setRequestTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [requestSearch, setRequestSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. ดึงข้อมูลของรางวัล
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false });
      setRewards(rewardsData || []);

      // 2. ดึงข้อมูลคำร้องขอ
      const { data: requestsData } = await supabase
        .from('redeem_requests')
        .select(`
          *, 
          rewards ( name, points_cost, target_group )
        `)
        .order('created_at', { ascending: false });
      
      // 3. ดึงข้อมูลผู้ใช้เพื่อเอา ชื่อ และ อีเมล
      const { data: profiles } = await supabase.from('profiles').select('id, email, full_name');
      const { data: wallets } = await supabase.from('student_wallets').select('user_id, student_name');
      const { data: tutors } = await supabase.from('tutors').select('user_id, name, email');
      
      const nameMap = new Map();
      const emailMap = new Map();

      // แมปข้อมูลโปรไฟล์หลัก
      profiles?.forEach(p => {
        nameMap.set(p.id, p.full_name);
        if (p.email) emailMap.set(p.id, p.email);
      });

      // ทับด้วยข้อมูลนักเรียน (ถ้ามี)
      wallets?.forEach(w => {
        if (w.student_name) nameMap.set(w.user_id, w.student_name);
      });

      // ทับด้วยข้อมูลติวเตอร์ (ถ้ามี)
      tutors?.forEach(t => {
        if (t.name) nameMap.set(t.user_id, t.name);
        if (t.email) emailMap.set(t.user_id, t.email);
      });

      const formattedRequests = (requestsData || []).map(req => ({
        ...req,
        requester_name: nameMap.get(req.user_id) || 'ไม่ทราบชื่อ',
        requester_email: emailMap.get(req.user_id) || 'ไม่มีอีเมล'
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeExistingImage = (indexToRemove: number) => {
    setExistingImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleEdit = (reward: any) => {
    setEditingReward(reward);
    setRewardName(reward.name);
    setPointsCost(reward.points_cost.toString());
    setTargetGroup(reward.target_group);
    setRewardStock(reward.stock.toString());
    setIsUnlimited(reward.is_unlimited);
    setExistingImageUrls(reward.image_urls || []);
    setSelectedFiles([]); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingReward(null);
    setRewardName('');
    setPointsCost('');
    setTargetGroup('TUTOR');
    setRewardStock('1');
    setIsUnlimited(false);
    setSelectedFiles([]);
    setExistingImageUrls([]);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let uploadedImageUrls: string[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${targetGroup.toLowerCase()}/${fileName}`; 

          const { error: uploadError } = await supabase.storage.from('rewards').upload(filePath, file);
          if (uploadError) throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${uploadError.message}`);

          const { data: { publicUrl } } = supabase.storage.from('rewards').getPublicUrl(filePath);
          uploadedImageUrls.push(publicUrl);
        }
      }

      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      const payload = {
        name: rewardName,
        points_cost: Number(pointsCost),
        target_group: targetGroup,
        image_urls: finalImageUrls,
        stock: isUnlimited ? 0 : Number(rewardStock), 
        is_unlimited: isUnlimited 
      };

      if (editingReward) {
        const { error } = await supabase.from('rewards').update(payload).eq('id', editingReward.id);
        if (error) throw new Error(`อัปเดตข้อมูลไม่สำเร็จ: ${error.message}`);
        alert('✅ แก้ไขของรางวัลเรียบร้อย! 🎁');
      } else {
        const { error } = await supabase.from('rewards').insert([payload]);
        if (error) throw new Error(`บันทึกข้อมูลไม่สำเร็จ: ${error.message}`);
        alert('✅ เพิ่มของรางวัลเข้าระบบเรียบร้อย! 🎁');
      }
      
      cancelEdit();
      fetchData(); 

    } catch (error: any) {
      alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!confirm('ยืนยันว่าดำเนินการ (ส่งของ) ให้ผู้ใช้เรียบร้อยแล้วใช่ไหม?')) return;
    try {
      const { error } = await supabase
        .from('redeem_requests')
        .update({ status: 'COMPLETED', updated_at: new Date() })
        .eq('id', requestId);
      if (error) throw error;
      fetchData(); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // ✨ ฟังก์ชันใหม่: ปฏิเสธคำร้อง และ คืน Point
  const handleRejectRequest = async (req: any) => {
    if (!confirm(`⚠️ ยืนยันการ "ปฏิเสธ" คำร้องนี้?\n\nระบบจะเปลี่ยนสถานะเป็นปฏิเสธ และทำการคืน ${req.rewards?.points_cost} Points กลับเข้ากระเป๋าผู้ใช้อัตโนมัติครับ`)) return;
    
    setSaving(true);
    try {
      // 1. เปลี่ยนสถานะคำร้องเป็น REJECTED
      const { error: updateErr } = await supabase
        .from('redeem_requests')
        .update({ status: 'REJECTED', updated_at: new Date() })
        .eq('id', req.id);
      
      if (updateErr) throw updateErr;

      // 2. คืน Point ให้ผู้ใช้ (เช็กว่าเป็นนักเรียนหรือติวเตอร์)
      const pointsToRefund = req.rewards?.points_cost || 0;
      
      // ลองค้นหาในกระเป๋านักเรียนก่อน
      const { data: studentWallet } = await supabase.from('student_wallets').select('reward_points').eq('user_id', req.user_id).single();
      
      if (studentWallet) {
        // ถ้านักเรียนมีกระเป๋า คืนเข้า reward_points
        await supabase.from('student_wallets').update({ reward_points: (studentWallet.reward_points || 0) + pointsToRefund }).eq('user_id', req.user_id);
      } else {
        // ถ้าไม่เจอในนักเรียน ลองหาในกระเป๋าติวเตอร์
        const { data: tutorWallet } = await supabase.from('tutors').select('reward_points').eq('user_id', req.user_id).single();
        if (tutorWallet) {
          await supabase.from('tutors').update({ reward_points: (tutorWallet.reward_points || 0) + pointsToRefund }).eq('user_id', req.user_id);
        }
      }

      alert('❌ ปฏิเสธคำร้องและคืน Points ให้ผู้ใช้เรียบร้อยแล้ว!');
      fetchData();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการปฏิเสธ/คืนพอยต์: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReward = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}"?`)) return;
    try {
      const { error } = await supabase.from('rewards').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('rewards').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // ✨ กรองข้อมูลคำร้องขอตาม Tabs และ Search
  const filteredRequests = requests.filter(req => {
    // 1. กรองตาม Tabs
    if (requestTab === 'PENDING' && req.status !== 'PENDING') return false;
    if (requestTab === 'HISTORY' && req.status === 'PENDING') return false;

    // 2. กรองตามช่องค้นหา
    if (requestSearch) {
      const q = requestSearch.toLowerCase();
      const matchName = req.requester_name?.toLowerCase().includes(q) || false;
      const matchEmail = req.requester_email?.toLowerCase().includes(q) || false;
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <Link href="/admin" className="text-gray-400 font-bold text-xs uppercase mb-4 flex items-center gap-2 hover:text-blue-600 transition-colors w-max bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <ArrowLeft size={16}/> กลับแผงควบคุมหลัก
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Store className="text-blue-600" size={36} /> ระบบจัดการร้านค้า (Admin)
          </h1>
          <p className="text-gray-500 font-bold mt-2">จัดการสต็อกและคำร้องขอแลกของรางวัลแบบ Real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ส่วนที่ 1: ฟอร์มเพิ่ม/แก้ไขของรางวัล */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  {editingReward ? <Edit3 className="text-orange-500" /> : <PackagePlus className="text-green-500" />} 
                  {editingReward ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัลใหม่'}
                </h2>
                {editingReward && (
                  <button onClick={cancelEdit} className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-gray-50 rounded-full">
                    <X size={18} />
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveReward} className="space-y-4">
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">สำหรับกลุ่มเป้าหมาย</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold text-gray-700"
                    value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}
                  >
                    <option value="TUTOR">👔 ติวเตอร์ / นายหน้า</option>
                    <option value="STUDENT">🎓 ผู้ปกครอง / นักเรียน</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">ชื่อของรางวัล</label>
                  <input required type="text" placeholder="ชื่อของรางวัล..." className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                    value={rewardName} onChange={(e) => setRewardName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">แต้มที่ต้องใช้</label>
                    <input required type="number" min="1" placeholder="แต้ม..." className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                      value={pointsCost} onChange={(e) => setPointsCost(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">จำนวนในสต็อก</label>
                    <input 
                      disabled={isUnlimited}
                      required={!isUnlimited}
                      type="number" min="0" placeholder="ชิ้น..." 
                      className={`w-full px-4 py-3 rounded-xl outline-none border-2 border-transparent transition-all font-bold ${isUnlimited ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 focus:border-blue-400'}`} 
                      value={rewardStock} onChange={(e) => setRewardStock(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 px-2">
                  <input 
                    type="checkbox" 
                    id="unlimited"
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                    checked={isUnlimited}
                    onChange={(e) => setIsUnlimited(e.target.checked)}
                  />
                  <label htmlFor="unlimited" className="text-xs font-bold text-gray-600 cursor-pointer flex items-center gap-1">
                    <Infinity size={14} className="text-blue-500" /> ตั้งเป็นของรางวัลไม่จำกัดจำนวน
                  </label>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1 mb-1">
                    <ImagePlus size={12} /> อัปโหลดรูปภาพ
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-gray-50">
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="text-sm font-bold text-gray-500">
                      {selectedFiles.length > 0 ? '+ เลือกรูปภาพเพิ่ม' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}
                    </div>
                  </div>

                  {existingImageUrls.length > 0 && (
                    <div className="flex gap-3 flex-wrap mt-4">
                      {existingImageUrls.map((url, idx) => (
                        <div key={`exist-${idx}`} className="relative group">
                          <img 
                            src={url} 
                            alt="existing preview" 
                            className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm" 
                          />
                          <button 
                            type="button" 
                            onClick={() => removeExistingImage(idx)} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedFiles.length > 0 && (
                    <div className="flex gap-3 flex-wrap mt-4 border-t border-gray-100 pt-4">
                      {selectedFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="relative group">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt="new preview" 
                            className="w-16 h-16 object-cover rounded-xl border-2 border-blue-200 shadow-sm" 
                          />
                          <button 
                            type="button" 
                            onClick={() => removeFile(idx)} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* ✨ แก้ไขชื่อตัวแปรที่นี่ด้วย จาก editingItem เป็น editingReward */}
                <button disabled={saving} className={`w-full text-white py-4 rounded-xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 ${editingReward ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {saving ? <Loader2 className="animate-spin" /> : (editingReward ? <Edit3 size={20} /> : <Gift size={20} />)}
                  {saving ? 'กำลังประมวลผล...' : (editingReward ? 'บันทึกการแก้ไข' : 'บันทึกเข้าระบบ')}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
               <h2 className="text-lg font-black text-gray-900 mb-4">🎁 รายการของรางวัล</h2>
               <div className="space-y-3 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {rewards.map((reward) => {
                   const isOutOfStock = !reward.is_unlimited && reward.stock <= 0;
                   return (
                    <div key={reward.id} className={`flex flex-col p-3 rounded-xl border transition-all relative group ${reward.is_active ? (isOutOfStock ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100') : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => handleEdit(reward)} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleToggleActive(reward.id, reward.is_active)} className={`p-1.5 rounded-lg transition-colors ${reward.is_active ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}>
                          {reward.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={() => handleDeleteReward(reward.id, reward.name)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex justify-between items-start mb-2 pr-24">
                        <div>
                          <span className={`font-bold block text-sm ${reward.is_active ? (isOutOfStock ? 'text-red-600' : 'text-gray-800') : 'text-gray-500 line-through'}`}>{reward.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {reward.target_group === 'TUTOR' ? (
                              <span className="text-[9px] font-black text-blue-500 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1 w-max"><Users size={8}/> TUTOR</span>
                            ) : (
                              <span className="text-[9px] font-black text-orange-500 bg-orange-100 px-2 py-0.5 rounded flex items-center gap-1 w-max"><GraduationCap size={8}/> STUDENT</span>
                            )}
                            
                            {reward.is_unlimited ? (
                              <span className="text-[9px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded flex items-center gap-1 w-max"><Infinity size={10}/> ไม่จำกัด</span>
                            ) : isOutOfStock ? (
                              <span className="text-[9px] font-black text-white bg-red-500 px-2 py-0.5 rounded flex items-center gap-1 w-max">❌ สินค้าหมด</span>
                            ) : (
                              <span className="text-[9px] font-black text-gray-600 bg-gray-200 px-2 py-0.5 rounded flex items-center gap-1 w-max"><Box size={10}/> เหลือ {reward.stock}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-black text-gray-600 bg-white px-2 py-1 rounded-lg text-[10px] shadow-sm mt-1">{reward.points_cost} pts</span>
                      </div>
                      
                      {reward.image_urls && reward.image_urls.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {reward.image_urls.map((url: string, i: number) => (
                            <img key={i} src={url} alt="reward" className={`h-10 w-10 object-cover rounded-lg border ${reward.is_active ? 'border-gray-200' : 'border-gray-300 grayscale'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                   )
                 })}
                 {rewards.length === 0 && <p className="text-sm text-gray-400 font-bold text-center py-4">ยังไม่มีของรางวัล</p>}
               </div>
            </div>
          </div>

          {/* ส่วนที่ 2: ตารางรับคำร้อง */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 min-h-full flex flex-col">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Clock className="text-orange-500" /> คำร้องขอแลกของรางวัล
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-max">
                    <button 
                      onClick={() => setRequestTab('PENDING')}
                      className={`flex-1 px-4 py-2 rounded-lg text-[11px] font-black transition-all ${requestTab === 'PENDING' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      รอตรวจสอบ
                    </button>
                    <button 
                      onClick={() => setRequestTab('HISTORY')}
                      className={`flex-1 px-4 py-2 rounded-lg text-[11px] font-black transition-all ${requestTab === 'HISTORY' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      ประวัติการแลก
                    </button>
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="ค้นหาชื่อ, อีเมล..." 
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border-2 border-transparent rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-blue-400 transition-all"
                      value={requestSearch}
                      onChange={(e) => setRequestSearch(e.target.value)}
                    />
                    {requestSearch && (
                      <button onClick={() => setRequestSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={12}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">วันที่ขอ</th>
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">ผู้ขอแลก</th>
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">ของที่แลก</th>
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">สถานะ</th>
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 text-xs font-bold text-gray-500">
                          {new Date(req.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="py-4">
                          <p className="font-black text-sm text-blue-600 mb-0.5">{req.requester_name}</p>
                          <p className="text-[10px] font-bold text-gray-400 break-all">{req.requester_email}</p>
                        </td>
                        <td className="py-4">
                          <p className="font-black text-gray-800 text-sm mb-0.5">{req.rewards?.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{req.rewards?.points_cost} points</p>
                        </td>
                        <td className="py-4 text-center">
                          {req.status === 'PENDING' && <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black">รอตรวจสอบ</span>}
                          {req.status === 'COMPLETED' && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black">สำเร็จ</span>}
                          {req.status === 'REJECTED' && <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black">ถูกปฏิเสธ</span>}
                        </td>
                        <td className="py-4">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleApproveRequest(req.id)}
                                className="flex items-center justify-center p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-95"
                                title="อนุมัติการแลกของรางวัล"
                              >
                                <CheckCircle2 size={16} />
                              </button>

                              <button 
                                onClick={() => handleRejectRequest(req)}
                                className="flex items-center justify-center p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                                title="ปฏิเสธคำร้อง และ คืน Point"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-gray-300 font-black text-xl">-</div>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="text-center py-16">
                           <div className="flex flex-col items-center justify-center text-gray-300">
                             <Store size={40} className="mb-3 opacity-20" />
                             <p className="font-bold text-sm text-gray-400">ไม่พบข้อมูลคำร้องขอ</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
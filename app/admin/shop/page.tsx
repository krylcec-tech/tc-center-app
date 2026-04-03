'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PackagePlus, Gift, Store, Loader2, CheckCircle, Clock, 
  Users, GraduationCap, ImagePlus, X, ArrowLeft, Trash2, Eye, EyeOff 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminShopPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form States
  const [rewardName, setRewardName] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [targetGroup, setTargetGroup] = useState('TUTOR');
  
  // Image Upload States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Data States
  const [rewards, setRewards] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false });
      setRewards(rewardsData || []);

      const { data: requestsData } = await supabase
        .from('redeem_requests')
        .select(`*, rewards ( name, points_cost, target_group )`)
        .order('created_at', { ascending: false });
      setRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let uploadedImageUrls: string[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${targetGroup.toLowerCase()}/${fileName}`; 

          const { error: uploadError } = await supabase.storage
            .from('rewards')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('rewards')
            .getPublicUrl(filePath);

          uploadedImageUrls.push(publicUrl);
        }
      }

      const { error } = await supabase
        .from('rewards')
        .insert([{
          name: rewardName,
          points_cost: Number(pointsCost),
          target_group: targetGroup,
          image_urls: uploadedImageUrls
        }]);

      if (error) throw error;
      
      alert('เพิ่มของรางวัลพร้อมรูปภาพสำเร็จ! 🎉');
      
      setRewardName('');
      setPointsCost('');
      setSelectedFiles([]);
      fetchData(); 

    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!confirm('ยืนยันว่าดำเนินการให้ผู้ใช้เรียบร้อยแล้ว?')) return;
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

  // --- ฟังก์ชันใหม่: ลบของรางวัล ---
  const handleDeleteReward = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}"?\n\n(คำเตือน: หากมีคนเคยแลกของชิ้นนี้ไปแล้ว ประวัติการแลกอาจถูกลบไปด้วย แนะนำให้ใช้ปุ่ม "ซ่อน" แทนหากของหมดสต็อก)`)) return;

    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  // --- ฟังก์ชันใหม่: เปิด/ปิด การมองเห็นของรางวัล ---
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header พร้อมปุ่มกลับ (เพิ่มใหม่) */}
        <div>
          <Link href="/admin" className="text-gray-400 font-bold text-xs uppercase mb-4 flex items-center gap-2 hover:text-blue-600 transition-colors w-max bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <ArrowLeft size={16}/> กลับแผงควบคุมหลัก
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Store className="text-blue-600" size={36} /> ระบบจัดการร้านค้า (Admin)
          </h1>
          <p className="text-gray-500 font-bold mt-2">เพิ่ม/ลบ ของรางวัลและอัปโหลดแกลเลอรีรูปภาพ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ส่วนที่ 1: ฟอร์มเพิ่มของรางวัล (ซ้าย) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <PackagePlus className="text-green-500" /> เพิ่มของรางวัลใหม่
              </h2>
              <form onSubmit={handleAddReward} className="space-y-4">
                
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
                  <input required type="text" placeholder="เช่น หนังสือติวเข้มคณิตศาสตร์" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                    value={rewardName} onChange={(e) => setRewardName(e.target.value)} />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">แต้มที่ต้องใช้</label>
                  <input required type="number" min="1" placeholder="เช่น 150" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                    value={pointsCost} onChange={(e) => setPointsCost(e.target.value)} />
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1 mb-1">
                    <ImagePlus size={12} /> อัปโหลดรูปภาพ (เลือกได้หลายรูป)
                  </label>
                  
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-gray-50">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-sm font-bold text-gray-500">
                      คลิกเพื่อเลือกไฟล์รูปภาพ <br/><span className="text-xs font-normal">.jpg, .png (เลือกพร้อมกันได้หลายไฟล์)</span>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold">
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <button type="button" onClick={() => removeFile(idx)} className="text-blue-400 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button disabled={saving} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4">
                  {saving ? <Loader2 className="animate-spin" /> : <Gift size={20} />}
                  {saving ? 'กำลังอัปโหลด...' : 'บันทึกเข้าระบบ'}
                </button>
              </form>
            </div>

            {/* โชว์ของรางวัลที่มีในระบบ พร้อมปุ่มลบ/แก้ไข (อัปเดตใหม่) */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
               <h2 className="text-lg font-black text-gray-900 mb-4">🎁 ของรางวัลในระบบ</h2>
               <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
                 {rewards.map((reward) => (
                   <div key={reward.id} className={`flex flex-col p-3 rounded-xl border transition-all relative group ${reward.is_active ? 'bg-gray-50 border-gray-100' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                     
                     {/* ปุ่มจัดการ: ซ่อน/แสดง และ ลบ (แสดงเมื่อเอาเมาส์ชี้) */}
                     <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => handleToggleActive(reward.id, reward.is_active)}
                         className={`p-1.5 rounded-lg transition-colors ${reward.is_active ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                         title={reward.is_active ? 'ซ่อนจากร้านค้า' : 'แสดงในร้านค้า'}
                       >
                         {reward.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                       <button 
                         onClick={() => handleDeleteReward(reward.id, reward.name)}
                         className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                         title="ลบของรางวัล"
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>

                     <div className="flex justify-between items-start mb-2 pr-16">
                       <div>
                         <span className={`font-bold block text-sm ${reward.is_active ? 'text-gray-800' : 'text-gray-500 line-through'}`}>{reward.name}</span>
                         {reward.target_group === 'TUTOR' ? (
                           <span className="text-[10px] font-black text-blue-500 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1 w-max mt-1"><Users size={10}/> ติวเตอร์</span>
                         ) : (
                           <span className="text-[10px] font-black text-orange-500 bg-orange-100 px-2 py-0.5 rounded flex items-center gap-1 w-max mt-1"><GraduationCap size={10}/> ผู้ปกครอง</span>
                         )}
                       </div>
                       <span className="font-black text-gray-600 bg-gray-200 px-2 py-1 rounded-lg text-xs">{reward.points_cost} pts</span>
                     </div>
                     
                     {reward.image_urls && reward.image_urls.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {reward.image_urls.map((url: string, i: number) => (
                            <img key={i} src={url} alt="reward" className={`h-12 w-12 object-cover rounded-md border ${reward.is_active ? 'border-gray-200' : 'border-gray-300 grayscale'}`} />
                          ))}
                        </div>
                     )}
                   </div>
                 ))}
                 {rewards.length === 0 && <p className="text-sm text-gray-400 font-bold text-center py-4">ยังไม่มีของรางวัล</p>}
               </div>
            </div>
          </div>

          {/* ส่วนที่ 2: โต๊ะรับคำร้อง (ขวา) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 min-h-full">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="text-orange-500" /> คำร้องขอแลกของรางวัล
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="pb-3 text-sm font-black text-gray-400 uppercase">วันที่ขอ</th>
                      <th className="pb-3 text-sm font-black text-gray-400 uppercase">ของที่แลก</th>
                      <th className="pb-3 text-sm font-black text-gray-400 uppercase">สถานะ</th>
                      <th className="pb-3 text-sm font-black text-gray-400 uppercase">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length > 0 ? requests.map((req) => (
                      <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-sm font-bold text-gray-600">
                          {new Date(req.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="py-4 font-black text-gray-800">
                          {req.rewards?.name} <span className="text-xs text-blue-600 ml-1">({req.rewards?.points_cost} pts)</span>
                        </td>
                        <td className="py-4">
                          {req.status === 'PENDING' ? (
                            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-xs font-black">รอตรวจสอบ</span>
                          ) : (
                            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-xs font-black">เสร็จสิ้น</span>
                          )}
                        </td>
                        <td className="py-4">
                          {req.status === 'PENDING' && (
                            <button 
                              onClick={() => handleApproveRequest(req.id)}
                              className="flex items-center gap-1 text-xs font-black text-white bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg transition-all"
                            >
                              <CheckCircle size={14} /> อนุมัติ
                            </button>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-gray-400 font-bold">
                          ยังไม่มีคำร้องขอแลกของในขณะนี้
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
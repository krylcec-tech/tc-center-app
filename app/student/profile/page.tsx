'use client'
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, Phone, MapPin, Save, ArrowLeft, 
  Loader2, Camera, GraduationCap, Building2, Heart, Settings
} from 'lucide-react';
import Link from 'next/link';

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Profile States
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); // ✨ เพิ่ม State เก็บรูป

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wallet } = await supabase
        .from('student_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wallet) {
        setStudentName(wallet.student_name || '');
        setParentName(wallet.parent_name || '');
        setPhone(wallet.phone || '');
        setAddress(wallet.address || ''); 
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_name, avatar_url') // ✨ ดึง avatar_url มาด้วย
        .eq('id', user.id)
        .maybeSingle();
      
      if (profile) {
        setSchool(profile.school_name || '');
        setAvatarUrl(profile.avatar_url || '');
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✨ ฟังก์ชันอัปโหลดรูปโปรไฟล์
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('อัปโหลดได้เฉพาะไฟล์รูปภาพครับ');

    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const fileName = `student_${user?.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars') // ใช้ Bucket ชื่อ avatars
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(publicUrl);
    } catch (error: any) {
      alert('อัปโหลดรูปพลาด: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. อัปเดตข้อมูลใน student_wallets
      const { error: walletError } = await supabase
        .from('student_wallets')
        .update({
          student_name: studentName,
          parent_name: parentName,
          phone: phone,
          address: address
        })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      // 2. อัปเดตข้อมูลใน profiles (ชื่อโรงเรียน & รูปโปรไฟล์)
      await supabase
        .from('profiles')
        .update({ 
          school_name: school,
          avatar_url: avatarUrl // ✨ บันทึกรูปลงฐานข้อมูล
        })
        .eq('id', user.id);

      alert('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้วครับ! ✨');
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <header>
          <Link href="/student" className="text-gray-400 font-black text-xs uppercase mb-4 flex items-center gap-2 hover:text-blue-600 w-max transition-all">
            <ArrowLeft size={16}/> กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Settings className="text-blue-600" size={32} /> ตั้งค่าโปรไฟล์
          </h1>
          <p className="text-gray-500 font-bold mt-1">จัดการข้อมูลส่วนตัวและที่อยู่สำหรับจัดส่งของรางวัล</p>
        </header>

        <form onSubmit={handleUpdateProfile} className="space-y-6 pb-20">
          
          {/* ข้อมูลนักเรียน & อัปโหลดรูป */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
            
            {/* ✨ ส่วนอัปโหลดรูป */}
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="relative w-32 h-32 rounded-full bg-blue-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-blue-200" />
                )}
                <div onClick={() => imageInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                  {uploadingImage ? <Loader2 className="animate-spin text-white" size={24}/> : <Camera className="text-white" size={24}/>}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">รูปโปรไฟล์</p>
            </div>

            <div className="flex-1 space-y-6">
              <h2 className="text-xl font-black flex items-center gap-2 text-blue-600">
                <GraduationCap size={24}/> ข้อมูลนักเรียน
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">ชื่อเล่นนักเรียน</label>
                  <div className="relative">
                    <Heart className="absolute left-4 top-4 text-orange-400" size={18} />
                    <input required type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 font-bold border-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">ชื่อผู้ปกครอง</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-gray-400" size={18} />
                    <input required type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 font-bold border-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">เบอร์โทรศัพท์ติดต่อ</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 text-gray-400" size={18} />
                    <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 font-bold border-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">โรงเรียน</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-4 text-gray-400" size={18} />
                    <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 font-bold border-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนที่อยู่จัดส่ง */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black mb-8 flex items-center gap-2 text-orange-500">
              <MapPin size={24}/> ที่อยู่จัดส่งของรางวัล / หนังสือ
            </h2>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">ที่อยู่โดยละเอียด (บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์)</label>
              <textarea 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                rows={4}
                placeholder="กรุณาระบุที่อยู่ให้ชัดเจน เพื่อความถูกต้องในการส่งของรางวัลครับ"
                className="w-full p-6 bg-gray-50 rounded-[2rem] outline-none focus:ring-2 focus:ring-orange-400 font-bold border-none resize-none"
              />
            </div>
          </div>

          <button 
            disabled={saving || uploadingImage}
            className="w-full bg-blue-600 text-white py-5 rounded-[2.5rem] font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:bg-gray-400"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
            {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </form>

      </div>
    </div>
  );
}
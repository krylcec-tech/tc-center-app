'use client'
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, Camera, Save, ArrowLeft, Loader2, CheckCircle 
} from 'lucide-react';
import Link from 'next/link';

export default function TutorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
        setName(data.name);
        setPreviewUrl(data.image_url);
      }
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalImageUrl = profile.image_url;

      // 1. ถ้ามีการเลือกรูปใหม่ ให้ Upload ขึ้น Storage ก่อน
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatar/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tutor-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('tutor-images')
          .getPublicUrl(filePath);
        
        finalImageUrl = urlData.publicUrl;
      }

      // 2. อัปเดตข้อมูลลงตาราง tutors
      const { error: updateError } = await supabase
        .from('tutors')
        .update({ name, image_url: finalImageUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      
      alert("บันทึกข้อมูลเรียบร้อยครับ!");
      fetchProfile();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto bg-[#F8FAFC] min-h-screen">
      <Link href="/tutor" className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-8 group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าหลัก
      </Link>

      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 h-32 relative"></div>
        
        <div className="px-8 pb-10 -mt-16 relative">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 bg-gray-200 rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-gray-400 m-auto mt-6" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
              >
                <Camera size={20} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">ชื่อติวเตอร์</label>
              <input 
                className="w-full border-2 p-4 rounded-2xl bg-gray-50 font-bold text-lg focus:border-blue-400 outline-none transition-all mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <button 
                disabled={saving}
                onClick={handleSave}
                className="w-full bg-blue-600 text-white p-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-100 disabled:bg-gray-400 transition-all active:scale-95"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโปรไฟล์'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
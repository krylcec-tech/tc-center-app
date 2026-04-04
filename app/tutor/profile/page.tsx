'use client'
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, Phone, Save, ArrowLeft, Loader2, 
  BadgeCheck, FileText, Video, Upload, X, Link as LinkIcon, Camera
} from 'lucide-react';
import Link from 'next/link';

export default function TutorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null); // ✨ สำหรับอัปโหลดรูป
  
  // Profile States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // ✨ รูปโปรไฟล์
  const [meetingUrl, setMeetingUrl] = useState(''); // ✨ ลิงก์สอน Zoom/Meet
  
  const [resumeUrl, setResumeUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchTutorProfile();
  }, []);

  const fetchTutorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tutor } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tutor) {
        setName(tutor.name || '');
        setPhone(tutor.phone || '');
        setBio(tutor.bio || '');
        setImageUrl(tutor.image_url || '');
        setMeetingUrl(tutor.meeting_url || '');
        setResumeUrl(tutor.resume_url || '');
        setVideoUrl(tutor.video_url || '');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- ฟังก์ชันอัปโหลดรูปโปรไฟล์ ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('อัปโหลดได้เฉพาะไฟล์รูปภาพครับ');

    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${user?.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('tutor-assets') 
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('tutor-assets').getPublicUrl(fileName);
      setImageUrl(publicUrl);
    } catch (error: any) {
      alert('อัปโหลดรูปพลาด: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // --- ฟังก์ชันอัปโหลด PDF ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return alert('กรุณาอัปโหลดไฟล์เป็น PDF เท่านั้นครับ');

    setUploadingFile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `resume_${user?.id}_${Date.now()}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('tutor-assets') 
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('tutor-assets').getPublicUrl(fileName);
      setResumeUrl(publicUrl);
      alert('อัปโหลด Resume สำเร็จ!');
    } catch (error: any) {
      alert('อัปโหลดพลาด: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('tutors').update({
        name, phone, bio,
        image_url: imageUrl,
        meeting_url: meetingUrl,
        resume_url: resumeUrl,
        video_url: videoUrl,
        updated_at: new Date()
      }).eq('user_id', user?.id);

      alert('บันทึกโปรไฟล์เรียบร้อยแล้วครับ! ✨');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com')) {
      return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
    }
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    return url;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <header>
          <Link href="/tutor" className="text-gray-400 font-black text-xs uppercase mb-4 flex items-center gap-2 hover:text-purple-600 w-max transition-all">
            <ArrowLeft size={16}/> กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <BadgeCheck className="text-purple-600" size={32} /> แก้ไขข้อมูลโปรไฟล์
          </h1>
        </header>

        <form onSubmit={handleUpdateProfile} className="space-y-6 pb-20">
          
          {/* ข้อมูลพื้นฐาน & รูปโปรไฟล์ */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
            
            {/* อัปโหลดรูป */}
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="relative w-32 h-32 rounded-[2rem] bg-purple-50 border-2 border-dashed border-purple-200 flex items-center justify-center overflow-hidden group">
                {imageUrl ? (
                  <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-purple-200" />
                )}
                <div onClick={() => imageInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                  {uploadingImage ? <Loader2 className="animate-spin text-white" size={24}/> : <Camera className="text-white" size={24}/>}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">รูปโปรไฟล์</p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">ชื่อติวเตอร์</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-400 font-bold" placeholder="ครู..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">เบอร์โทรศัพท์</label>
                  <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-400 font-bold" />
                </div>
              </div>
              
              {/* ✨ เพิ่มช่องลิงก์ห้องเรียน */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 flex items-center gap-1"><LinkIcon size={12}/> ลิงก์ห้องเรียน (Zoom / Google Meet)</label>
                <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} className="w-full px-5 py-4 bg-blue-50/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-400 font-bold text-blue-800" placeholder="https://meet.google.com/..." />
              </div>
            </div>
          </div>

          {/* 📄 ส่วน Resume PDF */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-600">
              <FileText size={24}/> Resume / ผลงาน (PDF)
            </h2>
            
            {resumeUrl ? (
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm"><FileText size={20}/></div>
                  <span className="text-sm font-black text-blue-900 truncate max-w-[200px]">Resume_Uploaded.pdf</span>
                </div>
                <div className="flex gap-2">
                  <a href={resumeUrl} target="_blank" className="text-blue-600 hover:underline text-xs font-bold">ดูไฟล์</a>
                  <button type="button" onClick={() => setResumeUrl('')} className="text-red-500 hover:text-red-700"><X size={18}/></button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-[2rem] p-10 text-center hover:bg-gray-50 cursor-pointer transition-all group"
              >
                {uploadingFile ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : <Upload className="mx-auto text-gray-300 group-hover:text-blue-500 mb-2" />}
                <p className="text-sm font-bold text-gray-400 group-hover:text-blue-600">คลิกเพื่ออัปโหลดไฟล์ Resume (PDF)</p>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
              </div>
            )}
          </div>

          {/* 🎬 ส่วนวิดีโอแนะนำตัว */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-red-500">
              <Video size={24}/> วิดีโอแนะนำตัว (Link)
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 text-gray-900">Link จาก Google Drive หรือ YouTube</label>
                <input 
                  type="text" 
                  value={videoUrl} 
                  onChange={(e) => setVideoUrl(e.target.value)} 
                  placeholder="วางลิงก์ที่นี่ เช่น https://drive.google.com/file/d/..."
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-red-400 font-bold"
                />
              </div>

              {videoUrl && (
                <div className="aspect-video w-full rounded-[2rem] overflow-hidden bg-black shadow-lg">
                  <iframe 
                    src={getEmbedUrl(videoUrl)} 
                    className="w-full h-full" 
                    allow="autoplay"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          </div>

          <button 
            disabled={saving || uploadingFile || uploadingImage}
            className="w-full bg-purple-600 text-white py-5 rounded-[2.5rem] font-black text-xl shadow-xl hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:bg-gray-400"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
            {saving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์ทั้งหมด'}
          </button>
        </form>
      </div>
    </div>
  );
}
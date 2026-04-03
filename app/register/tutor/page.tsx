'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, Mail, Lock, User, Phone, Loader2, 
  ArrowLeft, GraduationCap, BookOpen, Building, FileText, Upload
} from 'lucide-react';
import Link from 'next/link';

export default function TutorRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [experience, setExperience] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState(''); // ✨ State รายละเอียดเพิ่มเติม
  const [resumeFile, setResumeFile] = useState<File | null>(null); // ✨ State สำหรับไฟล์ Resume

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // ตรวจสอบประเภทไฟล์เบื้องต้น
      if (file.type === 'application/pdf' || file.type === 'image/jpeg' || file.type === 'image/jpg') {
        setResumeFile(file);
      } else {
        alert('กรุณาอัปโหลดไฟล์ PDF หรือ JPG เท่านั้นครับ');
        e.target.value = ''; // เคลียร์ค่าทิ้ง
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. สมัครบัญชีผ่าน Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        
        let uploadedResumeUrl = null;

        // ✨ 2. ถ้ามีการแนบไฟล์ ให้ทำการอัปโหลดขึ้น Supabase Storage ก่อน
        if (resumeFile) {
          const fileExt = resumeFile.name.split('.').pop();
          const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(`public/${fileName}`, resumeFile);

          if (uploadError) {
            console.error('Upload Error:', uploadError);
            alert('อัปโหลดไฟล์ Resume ไม่สำเร็จ แต่กำลังดำเนินการสมัครในขั้นตอนถัดไป');
          } else if (uploadData) {
            // ดึง Public URL ของไฟล์ที่เพิ่งอัปโหลด
            const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(`public/${fileName}`);
            uploadedResumeUrl = publicUrlData.publicUrl;
          }
        }

        // 3. สร้าง Profile พื้นฐาน
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            referral_code: `TUTOR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          }]);

        if (profileError) throw profileError;

        // 4. เพิ่มข้อมูลลงในตาราง Tutors (ซ่อนตัวจนกว่าแอดมินจะยืนยัน)
        const combinedBio = `การศึกษา: ${university} | ประสบการณ์/วิชาที่ถนัด: ${experience} ${additionalDetails ? `| เพิ่มเติม: ${additionalDetails}` : ''}`;

        const { error: tutorError } = await supabase
          .from('tutors')
          .insert([{
            id: authData.user.id,
            name: `${fullName} (ครู${nickname})`,
            bio: combinedBio,
            image_url: 'https://cdn-icons-png.flaticon.com/512/4042/4042171.png', 
            tags: ['รอการอนุมัติ'], // ✨ แอดมินต้องเข้ามาแก้ Tag นี้เป็นชื่อวิชาทีหลัง
            grade_levels: [],
            resume_url: uploadedResumeUrl // ✨ บันทึกลิงก์ Resume ให้แอดมินกดดูได้
          }]);

        if (tutorError) throw tutorError;

        alert("🎉 ส่งใบสมัครสำเร็จ! ข้อมูลของคุณอยู่ในระบบแล้ว กรุณารอทีมงานติดต่อกลับเพื่อนัดสัมภาษณ์ครับ");
        router.push('/login');
      }
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 md:p-6 font-sans text-gray-900">
      
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 md:p-10 border border-purple-100 my-8 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-50 rounded-full blur-3xl -ml-10 -mb-10 opacity-60"></div>

        <div className="relative z-10">
          <Link href="/register" className="text-gray-400 font-bold text-xs uppercase mb-6 flex items-center gap-2 hover:text-purple-600 transition-colors w-max">
            <ArrowLeft size={16}/> กลับไปหน้าสมัครนักเรียน
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
               <GraduationCap size={24} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">สมัครเป็นติวเตอร์</h1>
          </div>
          <p className="text-gray-500 font-bold mb-8">กรอกประวัติเบื้องต้น เพื่อให้ทีมงานติดต่อสัมภาษณ์</p>

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* ข้อมูลส่วนตัว */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-purple-400 uppercase ml-4">ชื่อ-นามสกุล (จริง)</label>
              <div className="relative">
                <User className="absolute left-4 top-4 text-purple-300" size={18} />
                <input required type="text" placeholder="ชื่อ-นามสกุล" className="w-full pl-12 pr-4 py-4 bg-purple-50/50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-400 border border-transparent transition-all font-bold" 
                  value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-purple-400 uppercase ml-4">ชื่อเล่น</label>
                <input required type="text" placeholder="ชื่อเล่น" className="w-full px-5 py-4 bg-purple-50/50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-400 border border-transparent transition-all font-bold" 
                  value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-purple-400 uppercase ml-4">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-4 text-purple-300" size={18} />
                  <input required type="tel" placeholder="08x-xxx-xxxx" className="w-full pl-10 pr-4 py-4 bg-purple-50/50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-400 border border-transparent transition-all font-bold" 
                    value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-black text-purple-400 uppercase ml-4">มหาวิทยาลัย / คณะ</label>
              <div className="relative">
                <Building className="absolute left-4 top-4 text-purple-300" size={18} />
                <input required type="text" placeholder="เช่น วิศวกรรมศาสตร์ จุฬาฯ" className="w-full pl-12 pr-4 py-4 bg-purple-50/50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-400 border border-transparent transition-all font-bold" 
                  value={university} onChange={(e) => setUniversity(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-purple-400 uppercase ml-4">วิชาที่ถนัด / ประสบการณ์</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-4 text-purple-300" size={18} />
                <input required type="text" placeholder="เช่น ถนัดคณิต ม.ปลาย, ฟิสิกส์" className="w-full pl-12 pr-4 py-4 bg-purple-50/50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-400 border border-transparent transition-all font-bold" 
                  value={experience} onChange={(e) => setExperience(e.target.value)} />
              </div>
            </div>

            {/* ✨ ส่วนใหม่: รายละเอียดเพิ่มเติม และอัปโหลดไฟล์ (ไม่บังคับกรอก) */}
            <div className="space-y-3 pt-4 border-t border-purple-50">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-purple-400 uppercase ml-4 flex items-center justify-between">
                  <span>รายละเอียดเพิ่มเติม (ถ้ามี)</span>
                  <span className="text-gray-300 text-[9px]">*ไม่บังคับ</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-purple-300" size={18} />
                  <textarea 
                    placeholder="เล่าเรื่องราวความสามารถพิเศษ หรือผลงานที่ผ่านมา..." 
                    className="w-full pl-12 pr-4 py-4 bg-purple-50/50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-400 border border-transparent transition-all font-bold min-h-[100px]" 
                    value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-purple-400 uppercase ml-4 flex items-center justify-between">
                  <span>อัปโหลด Resume / Portfolio (PDF, JPG)</span>
                  <span className="text-gray-300 text-[9px]">*ไม่บังคับ</span>
                </label>
                <label className="flex items-center gap-4 w-full px-4 py-4 bg-purple-50/50 border-2 border-dashed border-purple-200 rounded-2xl cursor-pointer hover:bg-purple-100/50 transition-all group">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-500 shadow-sm group-hover:scale-110 transition-transform">
                    <Upload size={18} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-sm text-purple-900 truncate">
                      {resumeFile ? resumeFile.name : "คลิกเพื่อเลือกไฟล์..."}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {resumeFile ? "ไฟล์พร้อมอัปโหลด" : "รองรับ .PDF และ .JPG (ขนาดไม่เกิน 5MB)"}
                    </p>
                  </div>
                  <input type="file" accept=".pdf, .jpg, .jpeg" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            {/* ข้อมูลการเข้าระบบ */}
            <div className="space-y-1 pt-4 border-t border-purple-50">
              <label className="text-[10px] font-black text-purple-400 uppercase ml-4">อีเมลสำหรับเข้าสู่ระบบ</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-purple-300" size={18} />
                <input required type="email" placeholder="tutor@email.com" className="w-full pl-12 pr-4 py-4 bg-purple-50/50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-400 border border-transparent transition-all font-bold" 
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-purple-400 uppercase ml-4">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-purple-300" size={18} />
                <input required type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-purple-50/50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-400 border border-transparent transition-all font-bold" 
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button disabled={loading} className="w-full bg-purple-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2 mt-6 disabled:bg-gray-400">
              {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={22} />}
              ส่งใบสมัครให้ทีมงานพิจารณา
            </button>
            <p className="text-center text-[10px] text-gray-400 font-bold mt-3">
              *หลังจากได้ใบสมัครของคุณแล้ว ทางเราจะรีบติดต่อกลับให้เร็วที่สุด
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}
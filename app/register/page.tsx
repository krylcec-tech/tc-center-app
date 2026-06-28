'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, Mail, Lock, User, Phone, Loader2, 
  ArrowLeft, GraduationCap, Building2, Gift, CheckCircle2, 
  MessageCircle, ChevronRight, BookOpen, Users
} from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  
  // ✨ State สำหรับแยกประเภทการสมัคร (Student หรือ Parent)
  const [role, setRole] = useState<'student' | 'parent'>('student');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // ใช้เก็บชื่อคนสมัคร (ผู้ปกครอง หรือ ชื่อจริงนักเรียน)
  const [studentNickname, setStudentNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [gradeLevel, setGradeLevel] = useState(''); 
  const [referralCode, setReferralCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ดักจับกรณียังไม่เลือกระดับชั้น (เฉพาะนักเรียน)
    if (role === 'student' && !gradeLevel) {
      alert("กรุณาเลือกระดับชั้นของนักเรียนด้วยครับ");
      return;
    }

    setLoading(true);

    try {
      let referredById = null;
      let initialHours = 0;

      // 0. ตรวจสอบรหัสผู้แนะนำ (เฉพาะนักเรียน)
      if (role === 'student' && referralCode.trim() !== '') {
        const { data: referrer, error: referrerError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode.trim().toUpperCase())
          .single();

        if (referrerError || !referrer) {
          throw new Error('ไม่พบรหัสผู้แนะนำนี้ กรุณาตรวจสอบอีกครั้ง หรือเว้นว่างไว้');
        }
        
        referredById = referrer.id;
        initialHours = 1; 
      }

      // 1. สมัครใน Auth ของ Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // ✨ ดักจับกรณีอีเมลซ้ำ (ถ้าใช้อีเมลซ้ำ Supabase จะคืนค่า identities เป็น Array ว่าง)
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        alert("อีเมลนี้มีคนใช้งานในระบบแล้วครับ กรุณาใช้อีเมลอื่น หรือทำการเข้าสู่ระบบแทนครับ 📧");
        setLoading(false);
        return; // หยุดการทำงานตรงนี้ ไม่ต้องไปต่อถึงขั้นตอนสร้าง Profile
      }

      if (authData.user) {
        // ✨ ข้อมูลพื้นฐานที่จะอัปเดตลงตาราง Profile ทุก Role
        const profilePayload: any = {
          id: authData.user.id,
          role: role, // ระบุ Role ให้ชัดเจน (student หรือ parent)
          full_name: fullName, // เก็บชื่อคนสมัครลง Profile ไว้ด้วย
          phone: phone,
        };

        // ถ้าเป็นนักเรียน ให้เพิ่มข้อมูลเฉพาะของเด็กเข้าไป
        if (role === 'student') {
          const newMyReferralCode = `TC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          profilePayload.school_name = schoolName;
          profilePayload.grade_level = gradeLevel;
          profilePayload.referred_by_id = referredById;
          profilePayload.referral_code = newMyReferralCode;
        }

        // 2. บันทึก Profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([profilePayload], { onConflict: 'id' });

        if (profileError) throw profileError;

        // 3. สร้าง Wallet (✨ สร้างเฉพาะถ้าระบุว่าเป็น 'นักเรียน' เท่านั้น ผู้ปกครองไม่มี Wallet)
        if (role === 'student') {
          const { error: walletError } = await supabase
            .from('student_wallets')
            .upsert([{
              user_id: authData.user.id,
              student_name: studentNickname,
              parent_name: fullName,
              phone: phone, 
              email: email, 
              total_hours_balance: initialHours,
              marketing_points: 0
            }], { onConflict: 'user_id' });

          if (walletError) throw walletError;
        }

        setIsSuccess(true);
      }
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    setLoading(false);

    if (error) {
      alert("ส่งอีเมลไม่สำเร็จ: " + error.message);
    } else {
      alert("📧 ส่งอีเมลยืนยันไปให้ใหม่แล้ว! กรุณาตรวจสอบใน Inbox หรือ Junk Mail ครับ");
    }
  };

  // --- หน้าจอเมื่อสมัครสำเร็จ (Success State) ---
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 md:p-6 font-sans text-gray-900">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center border border-gray-100">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={40} className="text-blue-600 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">เช็กอีเมลของคุณ!</h2>
          <p className="text-gray-500 font-medium mb-8 leading-relaxed">
            เราได้ส่งลิงก์ยืนยันตัวตนไปที่ <br/>
            <span className="font-black text-blue-600 block mt-2 text-lg">{email}</span>
            <br/>
            กรุณากดลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี <br/>ก่อนเข้าสู่ระบบครับ
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/login')} 
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
            <button 
              onClick={handleResendEmail} 
              disabled={loading}
              className="w-full bg-gray-50 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              ไม่ได้รับอีเมล? ส่งอีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 md:p-6 font-sans text-gray-900">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 md:p-10 border border-gray-100 my-8 relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/login" className="text-gray-400 font-bold text-xs uppercase mb-6 flex items-center gap-2 hover:text-blue-600 transition-colors w-max">
            <ArrowLeft size={16}/> กลับไปหน้าล็อคอิน
          </Link>
          
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            {role === 'student' ? 'สมัครสำหรับนักเรียน 🎓' : 'สำหรับผู้ปกครอง 👨‍👩‍👧‍👦'}
          </h1>
          <p className="text-gray-500 font-bold mb-6">
            {role === 'student' ? 'เพื่อเข้าสู่ระบบการเรียนระดับพรีเมียม' : 'เพื่อติดตามการเรียนและชั่วโมงของบุตรหลาน'}
          </p>

          {/* ✨ Toggle สลับระหว่าง นักเรียน / ผู้ปกครอง */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 gap-1">
            <button 
              type="button" 
              onClick={() => setRole('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${role === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <User size={16} /> นักเรียน
            </button>
            <button 
              type="button" 
              onClick={() => setRole('parent')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${role === 'parent' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users size={16} /> ผู้ปกครอง
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* ข้อมูลที่ต้องกรอกทุกคน (ชื่อ, เบอร์, อีเมล, รหัสผ่าน) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-4">
                {role === 'student' ? 'ชื่อจริงผู้ปกครอง / นักเรียน' : 'ชื่อ-นามสกุล ผู้ปกครอง'}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-4 text-gray-400" size={18} />
                <input required type="text" placeholder="ชื่อ-นามสกุล" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                  value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-4">เบอร์โทรศัพท์</label>
              <div className="relative">
                <Phone className="absolute left-4 top-4 text-gray-400" size={18} />
                <input required type="tel" placeholder="08x-xxx-xxxx" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                  value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-4">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-gray-400" size={18} />
                <input required type="email" placeholder="example@email.com" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-4">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-gray-400" size={18} />
                <input required type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {/* ✨ โซนที่แสดงเฉพาะเมื่อสมัครเป็น "นักเรียน" เท่านั้น */}
            {role === 'student' && (
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-4">ชื่อเล่นนักเรียน</label>
                    <input required type="text" placeholder="ชื่อเล่น" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                      value={studentNickname} onChange={(e) => setStudentNickname(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-4">โรงเรียน</label>
                    <input required type="text" placeholder="ชื่อโรงเรียน" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                      value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-4">ระดับชั้นของนักเรียน</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-4 text-gray-400" size={18} />
                    <select 
                      required
                      value={gradeLevel} 
                      onChange={(e) => setGradeLevel(e.target.value)} 
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="" disabled>เลือกระดับชั้น...</option>
                      <option value="ประถมศึกษา">ประถมศึกษา (ป.1 - ป.6)</option>
                      <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น (ม.1 - ม.3)</option>
                      <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย (ม.4 - ม.6)</option>
                      <option value="มหาวิทยาลัย">มหาวิทยาลัย / อื่นๆ</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-[2rem] border border-blue-100 shadow-inner text-gray-900">
                    <label className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 mb-2">
                      <Gift size={14} className="animate-bounce" /> รหัสผู้แนะนำ (ถ้ามี)
                    </label>
                    <input 
                      type="text" 
                      placeholder="กรอกรหัสเพื่อรับโปรโมชั่นสุดพิเศษ!" 
                      className="w-full px-5 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-400 border-none transition-all font-black text-blue-700 placeholder:text-blue-200 uppercase tracking-widest" 
                      value={referralCode} 
                      onChange={(e) => setReferralCode(e.target.value)} 
                    />
                    {referralCode.length >= 6 && (
                      <p className="text-[9px] text-green-600 font-bold mt-2 flex items-center gap-1">
                        <CheckCircle2 size={10} /> คุณจะได้รับ 1 ชม. ฟรีเมื่อสมัครสำเร็จ
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button disabled={loading} className={`w-full text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:bg-gray-400 ${role === 'parent' ? 'bg-orange-500 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'}`}>
              {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={22} />}
              {role === 'parent' ? 'สมัครบัญชีผู้ปกครอง' : 'สมัครสมาชิกนักเรียน'}
            </button>
          </form>

          <p className="text-center mt-8 text-gray-400 font-bold text-sm">
            มีบัญชีอยู่แล้ว? <Link href="/login" className="text-blue-600 hover:underline">เข้าสู่ระบบที่นี่</Link>
          </p>
        </div>
      </div>

      {/* --- Footer Options --- */}
      <div className="w-full max-w-md space-y-3 mb-8">
        <Link href="/register/tutor" className="w-full flex items-center justify-between p-5 bg-white border border-gray-200 rounded-3xl hover:border-purple-400 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <GraduationCap size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-gray-900 text-sm">สมัครเป็นติวเตอร์</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Join our team</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-300 group-hover:text-purple-600" />
        </Link>
        <a href="https://lin.ee/ZSDR4B3" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-5 bg-[#00B900]/10 border border-[#00B900]/20 rounded-3xl hover:bg-[#00B900] hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white text-[#00B900] rounded-xl flex items-center justify-center shadow-sm">
              <MessageCircle size={20} className="fill-current" />
            </div>
            <div className="text-left">
              <h3 className="font-black text-gray-900 group-hover:text-white text-sm transition-colors">ติดต่อฝ่ายขาย / สอบถามคอร์ส</h3>
              <p className="text-[10px] font-bold text-[#00B900] group-hover:text-white/80 uppercase tracking-widest transition-colors">LINE Official Account</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-[#00B900] group-hover:text-white" />
        </a>
      </div>
    </div>
  );
}
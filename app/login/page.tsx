'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
// ลบ useRouter ออกถ้าไม่ได้ใช้จุดอื่น แต่ในที่นี้เปลี่ยนวิธี redirect เป็น window.location
import { Mail, Lock, Loader2, AlertCircle, MessageCircle, User, GraduationCap, ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [role, setRole] = useState<'tutor' | 'student'>('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const userEmail = authData.user.email;
        
        // 🚨 ไม้ตาย: ใช้ window.location.href แทน router.push 
        // เพื่อให้บราวเซอร์รีเฟรชคุกกี้ใหม่ทั้งหมด ป้องกัน Middleware ดีดกลับ
        
        if (userEmail === 'admin01@gmail.com') {
          window.location.href = '/admin';
          return;
        }

        const { data: profile } = await supabase
          .from('tutors')
          .select('role')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        const rawRole = profile?.role || '';
        const dbRole = rawRole.replace(/'/g, "").trim().toLowerCase(); 

        if (dbRole === 'admin') {
          window.location.href = '/admin';
        } 
        else if (dbRole === 'tutor' || role === 'tutor') {
          window.location.href = '/tutor'; 
        } 
        else {
          window.location.href = '/student'; 
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message === 'Invalid login credentials' 
        ? 'อีเมลหรือรหัสผ่านไม่ถูกต้องครับ' 
        : err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-gray-900">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100">
        
        <Link href="/student/courses" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-6 group hover:text-blue-600 transition-colors">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          กลับไปเลือกคอร์ส
        </Link>

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 mb-4 bg-blue-50 rounded-3xl flex items-center justify-center overflow-hidden"> 
              <img src="/images/logo.jpg" alt="TC Logo" className="w-full h-full object-contain" 
                  onError={(e) => (e.currentTarget.style.display = 'none')} />
              <span className="text-3xl font-black text-blue-600">TC</span>
          </div>
          <h1 className="text-3xl font-black text-center leading-tight">TC Center Portal</h1>
          <p className="text-blue-600 text-[10px] font-black mt-1 tracking-[0.2em] uppercase">The Convergence</p>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
          <button type="button" onClick={() => setRole('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${role === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
            <User size={18} /> นักเรียน
          </button>
          <button type="button" onClick={() => setRole('tutor')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${role === 'tutor' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
            <GraduationCap size={18} /> ติวเตอร์
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3 text-red-700 text-sm font-bold">
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">อีเมลผู้ใช้งาน</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="email" placeholder="example@email.com"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-400 transition-all font-bold"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="password" placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-400 transition-all font-bold"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-blue-100 active:scale-[0.98]">
            {loading ? <Loader2 className="animate-spin" /> : `เข้าสู่ระบบ (${role === 'tutor' ? 'ติวเตอร์' : 'นักเรียน'})`}
          </button>
        </form>

        {role === 'student' && (
          <div className="mt-6 text-center">
            <p className="text-sm font-bold text-gray-500">
              ยังไม่เป็นสมาชิก? 
              <Link href="/register" className="ml-2 text-blue-600 hover:underline inline-flex items-center gap-1">
                <UserPlus size={16} /> สมัครสมาชิกที่นี่
              </Link>
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">แจ้งปัญหาการใช้งาน</p>
          <a href="https://lin.ee/ZSDR4B3" target="_blank" rel="noopener noreferrer"
            className="w-full bg-[#06C755] text-white py-3.5 rounded-2xl font-black flex justify-center items-center gap-2 hover:bg-[#05b34c] transition-all shadow-md active:scale-[0.98]">
            <MessageCircle size={20} fill="white" /> LINE: TC Center
          </a>
        </div>
      </div>
    </div>
  );
}
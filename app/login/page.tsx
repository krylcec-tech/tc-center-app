'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Loader2, AlertCircle, MessageCircle, User, GraduationCap, ArrowLeft, UserPlus, HelpCircle, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [role, setRole] = useState<'tutor' | 'student'>('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const userEmail = authData.user.email;
        if (userEmail === 'admin01@gmail.com') { 
          window.location.href = '/admin';
          return; 
        }

        const { data: tutorProfile } = await supabase
          .from('tutors')
          .select('role')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (tutorProfile) {
          const dbRole = (tutorProfile.role || '').replace(/'/g, "").trim().toUpperCase();
          if (dbRole === 'TUTOR') {
            window.location.href = '/tutor'; 
            return;
          }
        }
        window.location.href = '/student'; 
      }
    } catch (err: any) {
      setErrorMsg(err.message === 'Invalid login credentials' 
        ? 'อีเมลหรือรหัสผ่านไม่ถูกต้องครับ' 
        : err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return alert('กรุณากรอกอีเมลที่ช่อง "อีเมลผู้ใช้งาน" ก่อนครับ');
    
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccessMsg('📧 ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้วครับ!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-gray-900">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100">
        
        <Link href="/" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-6 group hover:text-blue-600 transition-colors">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          กลับหน้าหลัก
        </Link>

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 mb-4 bg-white rounded-3xl flex items-center justify-center overflow-hidden border border-gray-100"> 
              <img src="/images/logo.png.jpg" alt="TC Center" className="w-full h-full object-contain" />
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

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-xl flex items-center gap-3 text-green-700 text-sm font-bold">
            <Loader2 className="animate-pulse" size={20} />
            <span>{successMsg}</span>
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
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">รหัสผ่าน</label>
              <button type="button" onClick={handleForgotPassword} className="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest">
                ลืมรหัสผ่าน?
              </button>
            </div>
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
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">เข้าร่วมกับเรา</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ปุ่ม LINE */}
            <a href="https://lin.ee/ZSDR4B3" target="_blank" rel="noopener noreferrer"
              className="bg-[#06C755] text-white py-3.5 rounded-2xl font-black text-xs flex justify-center items-center gap-2 hover:bg-[#05b34c] transition-all shadow-md active:scale-[0.98]">
              <MessageCircle size={18} fill="white" /> LINE: TC Center
            </a>

            {/* ✨ ปุ่มสมัครติวเตอร์ */}
            <Link href="/register/tutor"
              className="bg-slate-900 text-white py-3.5 rounded-2xl font-black text-xs flex justify-center items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]">
              <Briefcase size={18} /> สมัครเป็นติวเตอร์
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
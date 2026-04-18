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

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (userProfile) {
          const dbRole = (userProfile.role || '').replace(/'/g, "").trim().toUpperCase();
          if (dbRole === 'TUTOR') {
            window.location.href = '/tutor'; 
            return;
          } else if (dbRole === 'ADMIN') {
            window.location.href = '/admin'; 
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
    <div className="min-h-screen flex items-center justify-center p-4 font-sans text-gray-900 relative overflow-hidden" style={{background: '#F8F9FF'}}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800;900&family=Sarabun:wght@400;500;600&display=swap');
        * { font-family: 'Prompt', sans-serif; }

        .login-blob-1 {
          position: fixed;
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 65%);
          top: -200px; left: -200px;
          border-radius: 50%;
          animation: blobDrift1 12s ease-in-out infinite;
          pointer-events: none;
        }
        .login-blob-2 {
          position: fixed;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 65%);
          bottom: -150px; right: -150px;
          border-radius: 50%;
          animation: blobDrift2 15s ease-in-out infinite;
          pointer-events: none;
        }
        .login-blob-3 {
          position: fixed;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 65%);
          top: 50%; right: 10%;
          border-radius: 50%;
          animation: blobDrift1 10s ease-in-out infinite reverse;
          pointer-events: none;
        }

        @keyframes blobDrift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(40px,-30px) scale(1.05); }
          66% { transform: translate(-20px,20px) scale(0.97); }
        }
        @keyframes blobDrift2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-30px,25px) scale(1.04); }
        }

        .card-enter {
          animation: cardEnter 0.6s cubic-bezier(0.34,1.4,0.64,1) both;
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .field-row {
          animation: fieldEnter 0.5s ease both;
        }
        @keyframes fieldEnter {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .field-row:nth-child(1) { animation-delay: 0.2s; }
        .field-row:nth-child(2) { animation-delay: 0.3s; }

        .input-field {
          transition: all 0.25s ease;
          background: rgba(248,249,255,0.8);
          border: 1.5px solid rgba(226,232,240,0.8);
        }
        .input-field:focus {
          background: white;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.08);
          outline: none;
        }

        .role-tab-active {
          background: white;
          color: #2563eb;
          box-shadow: 0 4px 16px rgba(37,99,235,0.12), 0 1px 4px rgba(0,0,0,0.06);
        }
        .role-tab-inactive {
          color: #94a3b8;
        }
        .role-tab-inactive:hover {
          color: #64748b;
          background: rgba(255,255,255,0.5);
        }

        .submit-btn {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 8px 24px rgba(37,99,235,0.30), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: all 0.3s cubic-bezier(0.34,1.4,0.64,1);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .dot-grid {
          background-image: radial-gradient(circle, rgba(37,99,235,0.12) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .glass-card {
          background: rgba(255,255,255,0.80);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255,255,255,0.95);
          box-shadow:
            0 32px 80px rgba(37,99,235,0.07),
            0 8px 24px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,1);
        }

        .logo-ring {
          background: conic-gradient(from 0deg, #2563eb, #f97316, #ec4899, #2563eb);
          animation: spinRing 6s linear infinite;
        }
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .line-btn {
          background: linear-gradient(135deg, #06C755, #05b34c);
          box-shadow: 0 4px 16px rgba(6,199,85,0.25);
          transition: all 0.25s ease;
        }
        .line-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(6,199,85,0.30); }

        .tutor-btn {
          background: linear-gradient(135deg, #0f172a, #1e293b);
          box-shadow: 0 4px 16px rgba(15,23,42,0.20);
          transition: all 0.25s ease;
        }
        .tutor-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,23,42,0.25); }

        .divider-text {
          background: linear-gradient(90deg, transparent, rgba(148,163,184,0.5), transparent);
          height: 1px;
        }

        .back-btn {
          transition: all 0.2s ease;
        }
        .back-btn:hover { color: #2563eb; transform: translateX(-2px); }
        .back-btn:hover .back-arrow { transform: translateX(-3px); }
        .back-arrow { transition: transform 0.2s ease; }

        .shimmer-line {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}} />

      {/* Background Blobs */}
      <div className="login-blob-1"></div>
      <div className="login-blob-2"></div>
      <div className="login-blob-3"></div>

      {/* Dot Grid */}
      <div className="fixed inset-0 dot-grid opacity-40 pointer-events-none"></div>

      {/* Card */}
      <div className="glass-card card-enter w-full max-w-md rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
        
        {/* Card inner shimmer top edge */}
        <div className="absolute top-0 left-12 right-12 h-px shimmer-line"></div>

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-60 pointer-events-none"
          style={{background: 'radial-gradient(circle at 100% 0%, rgba(249,115,22,0.12) 0%, transparent 60%)'}}></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 opacity-50 pointer-events-none"
          style={{background: 'radial-gradient(circle at 0% 100%, rgba(37,99,235,0.10) 0%, transparent 60%)'}}></div>

        {/* Back Link */}
        <Link href="/" className="back-btn inline-flex items-center gap-2 text-slate-400 font-semibold text-xs uppercase tracking-widest mb-8 group">
          <ArrowLeft size={13} className="back-arrow" />
          กลับหน้าหลัก
        </Link>

        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          {/* Spinning ring logo */}
          <div className="relative mb-5">
            <div className="logo-ring absolute inset-0 rounded-[1.6rem]" style={{padding: '2px', margin: '-2px'}}></div>
            <div className="relative w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center border border-white/80 shadow-sm overflow-hidden">
              <img src="/images/logo.png.jpg" alt="TC Center" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            TC Center Portal
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-300"></div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{
              background: 'linear-gradient(90deg, #2563eb, #f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>The Convergence</p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-orange-300"></div>
          </div>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-8 gap-1">
          <button type="button" onClick={() => setRole('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${role === 'student' ? 'role-tab-active' : 'role-tab-inactive'}`}>
            <User size={16} /> นักเรียน
          </button>
          <button type="button" onClick={() => setRole('tutor')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${role === 'tutor' ? 'role-tab-active' : 'role-tab-inactive'}`}>
            <GraduationCap size={16} /> ติวเตอร์
          </button>
        </div>

        {/* Error / Success */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold"
            style={{background: 'rgba(254,242,242,0.9)', border: '1px solid rgba(252,165,165,0.5)', color: '#dc2626'}}>
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle size={16} />
            </div>
            <span style={{fontFamily: 'Sarabun, sans-serif'}}>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold"
            style={{background: 'rgba(240,253,244,0.9)', border: '1px solid rgba(134,239,172,0.5)', color: '#16a34a'}}>
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Loader2 className="animate-pulse" size={16} />
            </div>
            <span style={{fontFamily: 'Sarabun, sans-serif'}}>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2 field-row">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              อีเมลผู้ใช้งาน
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center pointer-events-none">
                <Mail size={15} className="text-blue-400" />
              </div>
              <input
                type="email"
                placeholder="example@email.com"
                className="input-field w-full pl-14 pr-5 py-4 rounded-2xl font-semibold text-sm text-slate-700 placeholder:text-slate-300"
                style={{fontFamily: 'Sarabun, sans-serif'}}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2 field-row">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รหัสผ่าน</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-widest transition-colors"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center pointer-events-none">
                <Lock size={15} className="text-orange-400" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field w-full pl-14 pr-5 py-4 rounded-2xl font-semibold text-sm text-slate-700 placeholder:text-slate-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-btn w-full text-white py-4 rounded-2xl font-black text-base flex justify-center items-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading
              ? <Loader2 className="animate-spin" size={20} />
              : <>
                  เข้าสู่ระบบ
                  <span className="text-sm font-semibold opacity-80 bg-white/10 px-2.5 py-0.5 rounded-full">
                    {role === 'tutor' ? 'ติวเตอร์' : 'นักเรียน'}
                  </span>
                </>
            }
          </button>
        </form>

        {/* Register Link */}
        {role === 'student' && (
          <div className="mt-5 text-center">
            <p className="text-xs font-semibold text-slate-400" style={{fontFamily: 'Sarabun, sans-serif'}}>
              ยังไม่เป็นสมาชิก?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 ml-1 hover:underline underline-offset-2 transition-colors">
                <UserPlus size={13} /> สมัครสมาชิกที่นี่
              </Link>
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="mt-8 mb-6 flex items-center gap-4">
          <div className="flex-1 divider-text"></div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest shrink-0">เข้าร่วมกับเรา</span>
          <div className="flex-1 divider-text"></div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://lin.ee/ZSDR4B3"
            target="_blank"
            rel="noopener noreferrer"
            className="line-btn text-white py-3.5 rounded-2xl font-bold text-xs flex justify-center items-center gap-2 active:scale-[0.97]"
          >
            <MessageCircle size={16} fill="white" /> LINE: TC Center
          </a>
          <Link
            href="/register/tutor"
            className="tutor-btn text-white py-3.5 rounded-2xl font-bold text-xs flex justify-center items-center gap-2 active:scale-[0.97]"
          >
            <Briefcase size={16} /> สมัครเป็นติวเตอร์
          </Link>
        </div>

      </div>
    </div>
  );
}

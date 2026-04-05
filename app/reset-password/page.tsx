'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage('เปลี่ยนรหัสผ่านสำเร็จ! กำลังพาท่านไปหน้าเข้าสู่ระบบ...');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-gray-900">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-black mb-2">ตั้งรหัสผ่านใหม่ 🔒</h1>
        <p className="text-gray-500 font-bold mb-8 text-sm">กรุณาระบุรหัสผ่านใหม่ที่ต้องการใช้งานครับ</p>

        {message && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 font-bold text-sm border-l-4 border-green-500">
            <CheckCircle2 size={20} /> {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 font-bold text-sm border-l-4 border-red-500">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">รหัสผ่านใหม่</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="password" placeholder="••••••••" required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-400 transition-all font-bold"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading || !!message}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : 'ยืนยันเปลี่ยนรหัสผ่าน'}
          </button>
        </form>
      </div>
    </div>
  );
}
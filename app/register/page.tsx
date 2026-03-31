'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, Phone, Loader2, ArrowLeft, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [studentNickname, setStudentNickname] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. สมัครสมาชิกใน Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. สร้าง Profile และ Wallet เริ่มต้น (0 ชม.) ใน student_wallets
        const { error: profileError } = await supabase
          .from('student_wallets')
          .insert([{
            user_id: authData.user.id,
            student_name: studentNickname, // ใช้ชื่อเล่นนักเรียนเป็นชื่อหลัก
            parent_name: parentName,       // เก็บชื่อผู้ปกครองไว้ติดต่อ
            phone: phone,
            total_hours_balance: 0
          }]);

        if (profileError) throw profileError;

        alert("สมัครสมาชิกสำเร็จ! 🎉 กรุณาเข้าสู่ระบบ");
        router.push('/login');
      }
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-xl p-10 border border-gray-100">
        <Link href="/student/courses" className="text-gray-400 font-bold text-xs uppercase mb-6 flex items-center gap-2 hover:text-blue-600 transition-colors">
          <ArrowLeft size={16}/> กลับไปดูคอร์ส
        </Link>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">สมัครสมาชิก 🎓</h1>
        <p className="text-gray-500 font-bold mb-8">เพื่อเริ่มจองคิวเรียนและซื้อคอร์ส</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-4">ชื่อผู้ปกครอง</label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-gray-400" size={20} />
              <input required type="text" placeholder="เช่น คุณแม่นิด" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                value={parentName} onChange={(e) => setParentName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-4">ชื่อเล่นนักเรียน</label>
            <div className="relative">
              <GraduationCap className="absolute left-4 top-4 text-gray-400" size={20} />
              <input required type="text" placeholder="เช่น น้องพิม" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                value={studentNickname} onChange={(e) => setStudentNickname(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-4">เบอร์โทรศัพท์</label>
            <div className="relative">
              <Phone className="absolute left-4 top-4 text-gray-400" size={20} />
              <input required type="tel" placeholder="08x-xxx-xxxx" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-4">อีเมล (สำหรับเข้าใช้งาน)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
              <input required type="email" placeholder="email@example.com" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-4">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
              <input required type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-400 border-2 border-transparent transition-all font-bold" 
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={24} />}
            สมัครสมาชิกเลย
          </button>
        </form>

        <p className="text-center mt-8 text-gray-500 font-bold">
          เป็นสมาชิกอยู่แล้ว? <Link href="/login" className="text-blue-600 hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
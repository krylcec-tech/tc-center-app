'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Clock, BookOpen, Calendar, ChevronRight, 
  Layout, Plus, LogOut, GraduationCap, FileText, UserPlus, Home, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState('นักเรียน');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/login';
      return;
    }

    const { data: wallet } = await supabase
      .from('student_wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (wallet) {
      setBalance(wallet.total_hours_balance || 0);
      setUserName(wallet.student_name || 'นักเรียน');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (confirm('ยืนยันออกจากระบบ?')) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl">กำลังโหลดข้อมูล...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-gray-900">
      
      {/* 🏠 Navigation Section */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:gap-3 transition-all group"
        >
          <Home size={18} /> กลับหน้าแรกเว็บไซต์
        </Link>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-50 rounded-xl text-red-500 font-black text-xs hover:bg-red-500 hover:text-white transition-all shadow-sm uppercase tracking-widest"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-10">
        <h1 className="text-4xl font-black tracking-tight mb-2">สวัสดีครับ, {userName} 👋</h1>
        <p className="text-gray-500 font-bold italic">เข้าสู่ระบบการเรียน TC Center</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Card */}
        <div className="lg:col-span-2 bg-blue-600 rounded-[3rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-blue-100 font-black uppercase tracking-widest text-xs mb-2">ชั่วโมงเรียนคงเหลือ</p>
            <h2 className="text-7xl font-black mb-8">
              {balance} <span className="text-2xl font-bold opacity-60">ชม.</span>
            </h2>
            <Link 
              href="/student/courses"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg active:scale-95"
            >
              <Plus size={20} /> ซื้อคอร์ส/เติมชั่วโมงเรียน
            </Link>
          </div>
          <Clock className="absolute -right-10 -bottom-10 text-white/10 group-hover:rotate-12 transition-transform duration-700" size={280} />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-4">
          <Link href="/student/booking-flow" className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Calendar size={28} />
              </div>
              <span className="block font-black text-lg">จองคิวเรียน</span>
            </div>
            <ChevronRight className="text-gray-300" size={24} />
          </Link>

          <Link href="/student/my-schedule" className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Layout size={28} />
              </div>
              <span className="block font-black text-lg">ตารางเรียน</span>
            </div>
            <ChevronRight className="text-gray-300" size={24} />
          </Link>
        </div>
      </div>
    </div>
  );
}
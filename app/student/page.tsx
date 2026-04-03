'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  BookOpen, 
  Calendar, 
  ChevronRight, 
  Layout, 
  Plus, 
  LogOut, 
  GraduationCap, 
  Gift, 
  Settings, 
  Menu, 
  X, 
  Receipt, 
  Wallet, 
  Globe, 
  MapPin, 
  Sparkles,
  Home,    // ✨ เพิ่มตัวนี้
  Star     // ✨ เพิ่มตัวนี้
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [userName, setUserName] = useState('นักเรียน');
  const [parentName, setParentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.replace('/login');
      return;
    }

    const { data: walletData } = await supabase
      .from('student_wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (walletData) {
      setWallet(walletData);
      setPoints(walletData.marketing_points || 0); 
      setUserName(walletData.student_name || 'นักเรียน');
      setParentName(walletData.parent_name || '');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (confirm('ยืนยันออกจากระบบ?')) {
      await supabase.auth.signOut();
      router.replace('/login');
    }
  };

  // รายการกระเป๋าเงินเพื่อใช้แสดงผลใน Grid
  const walletList = [
    { label: 'ประถม - ม.ต้น', online: wallet?.tier1_online_balance || 0, onsite: wallet?.tier1_onsite_balance || 0, color: 'from-blue-500 to-blue-600' },
    { label: 'สอบเข้า ม.4', online: wallet?.tier2_online_balance || 0, onsite: wallet?.tier2_onsite_balance || 0, color: 'from-purple-500 to-purple-600' },
    { label: 'ม.ปลาย / มหาลัย', online: wallet?.tier3_online_balance || 0, onsite: wallet?.tier3_onsite_balance || 0, color: 'from-orange-500 to-orange-600' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-blue-600 animate-pulse uppercase tracking-widest text-xs">TC Center Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-gray-900">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8">
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-4 right-4 p-2 text-gray-400"><X size={20}/></button>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">TC</div>
            <span className="text-xl font-black tracking-tight">TC Center</span>
          </div>
          <nav className="space-y-1">
            <Link href="/student" className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold transition-all"><Home size={20}/> หน้าหลัก</Link>
            <Link href="/student/booking-flow" className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><Calendar size={20}/> จองคิวเรียน</Link>
            <Link href="/student/my-schedule" className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><Layout size={20}/> ตารางเรียน</Link>
            <Link href="/student/orders" className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><Receipt size={20}/> ประวัติการสั่งซื้อ</Link>
            <Link href="/student/affiliate/shop" className="flex items-center gap-3 px-4 py-3.5 text-orange-600 hover:bg-orange-50 rounded-2xl font-black transition-all"><Gift size={20}/> ร้านค้าพอยท์</Link>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all"><LogOut size={18} /> Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2 text-gray-900">ยินดีต้อนรับ, น้อง{userName} 👋</h1>
            <p className="text-gray-400 font-bold">ผู้ปกครอง: {parentName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 text-orange-600 px-6 py-3 rounded-2xl flex items-center gap-3 border border-orange-200">
                <Star size={20} className="fill-orange-600"/>
                <div>
                    <p className="text-[10px] font-black uppercase opacity-60 leading-none">แต้มสะสม</p>
                    <p className="text-xl font-black">{points} <span className="text-xs uppercase">pts</span></p>
                </div>
            </div>
            <Link href="/student/courses" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
                <Plus size={20}/> ซื้อชั่วโมงเรียน
            </Link>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-800">
            <Wallet size={24} className="text-blue-600"/> ชั่วโมงเรียนคงเหลือแยกตาม Tier
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {walletList.map((tier, idx) => (
              <div key={idx} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className={`p-6 bg-gradient-to-r ${tier.color} text-white`}>
                  <h3 className="font-black text-lg">{tier.label}</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-gray-900">
                    <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><Globe size={12}/> Online</p>
                    <p className="text-2xl font-black text-blue-600">{tier.online} <span className="text-xs font-bold text-gray-300">ชม.</span></p>
                  </div>
                  <div className="flex flex-col gap-1 border-l pl-4 text-gray-900">
                    <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><MapPin size={12}/> Onsite</p>
                    <p className="text-2xl font-black text-green-600">{tier.onsite} <span className="text-xs font-bold text-gray-300">ชม.</span></p>
                  </div>
                </div>
                <Link href="/student/booking-flow" className="mx-6 mb-6 p-3 bg-gray-50 rounded-xl text-center text-xs font-black text-gray-500 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">
                  จองคิวระดับนี้
                </Link>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-black mb-6 text-gray-800">ทางลัดรวดเร็ว</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <Link href="/student/booking-flow" className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Calendar size={24}/></div>
                    <div><p className="font-black text-gray-900">จองคิวเรียน</p><p className="text-[10px] font-bold text-gray-400 uppercase">Book a class</p></div>
                </div>
                <ChevronRight className="text-gray-200 group-hover:text-blue-600 transition-all"/>
             </Link>

             <Link href="/student/my-schedule" className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all"><Layout size={24}/></div>
                    <div><p className="font-black text-gray-900">ตารางเรียน</p><p className="text-[10px] font-bold text-gray-400 uppercase">My Schedule</p></div>
                </div>
                <ChevronRight className="text-gray-200 group-hover:text-purple-600 transition-all"/>
             </Link>

             <Link href="/student/affiliate/shop" className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all"><Gift size={24}/></div>
                    <div><p className="font-black text-gray-900">แลกรางวัล</p><p className="text-[10px] font-bold text-gray-400 uppercase">Point Shop</p></div>
                </div>
                <ChevronRight className="text-gray-200 group-hover:text-orange-600 transition-all"/>
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Clock, BookOpen, Calendar, ChevronRight, 
  Layout, Plus, LogOut, GraduationCap, Gift, Settings, 
  Menu, X, Receipt, Wallet, Globe, MapPin, Sparkles, Home, Star, UserCircle,
  Loader2, Users, Copy, Share2 // ✨ เพิ่มไอคอน Copy และ Share2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [userName, setUserName] = useState('นักเรียน');
  const [parentName, setParentName] = useState('');
  const [referralCode, setReferralCode] = useState('TC-XXXX'); // ✨ State เก็บข้อมูลรหัสผู้แนะนำ
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
      
      // ✨ ดึงรหัสผู้แนะนำจากฐานข้อมูล (ถ้าไม่มีให้เอา ID 6 ตัวแรกมาใช้แทนชั่วคราว)
      setReferralCode(walletData.referral_code || walletData.id?.substring(0, 6).toUpperCase() || 'TC-XXXX');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (confirm('ยืนยันออกจากระบบ?')) {
      await supabase.auth.signOut();
      router.replace('/login');
    }
  };

  // ✨ ฟังก์ชันก๊อปปี้รหัสผู้แนะนำ
  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    alert('📋 คัดลอกรหัสผู้แนะนำเรียบร้อยแล้ว! ส่งให้เพื่อนได้เลย 🚀');
  };

  const walletList = [
    { id: 'tier1', label: 'ประถม - ม.ต้น', online: wallet?.tier1_online_balance || 0, onsite: wallet?.tier1_onsite_balance || 0, color: 'from-blue-500 to-blue-600' },
    { id: 'tier2', label: 'สอบเข้า ม.4', online: wallet?.tier2_online_balance || 0, onsite: wallet?.tier2_onsite_balance || 0, color: 'from-purple-500 to-purple-600' },
    { id: 'tier3', label: 'ม.ปลาย / มหาลัย', online: wallet?.tier3_online_balance || 0, onsite: wallet?.tier3_onsite_balance || 0, color: 'from-orange-500 to-orange-600' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-blue-600">
      <Loader2 className="animate-spin" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-gray-900">
      
      {/* --- 📱 Mobile Header --- */}
      <div className="lg:hidden bg-white p-4 flex justify-between items-center border-b sticky top-0 z-50 shadow-sm">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-50 rounded-xl text-gray-600 active:scale-95 transition-all">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">TC</div>
          <span className="font-black text-sm uppercase tracking-tight">Student Portal</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* --- 🧭 Sidebar Drawer --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[70] w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-out shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">TC</div>
                <span className="text-xl font-black tracking-tight">TC Center</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-gray-400"><X size={24}/></button>
          </div>

          <nav className="space-y-1">
            <Link href="/student" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold transition-all"><Home size={20}/> หน้าหลัก</Link>
            <Link href="/student/booking-flow" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><Calendar size={20}/> จองคิวเรียน</Link>
            <Link href="/student/my-schedule" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><Layout size={20}/> ตารางเรียน</Link>
            <Link href="/student/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><Receipt size={20}/> ประวัติการสั่งซื้อ</Link>
            <Link href="/student/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><Settings size={20}/> ตั้งค่าโปรไฟล์</Link>
            <Link href="/student/tutors" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-all"><Users size={20}/> ทำเนียบติวเตอร์</Link>
            <Link href="/student/affiliate/shop" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-orange-600 hover:bg-orange-50 rounded-2xl font-black transition-all mt-4 border border-orange-100"><Gift size={20}/> ร้านค้าพอยท์</Link>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all"><LogOut size={18} /> ออกจากระบบ</button>
        </div>
      </aside>

      {/* --- 🏠 Main Content --- */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">สวัสดีครับ, น้อง{userName} 👋</h1>
              <p className="text-gray-400 font-bold text-sm">ผู้ปกครอง: {parentName}</p>
              <Link href="/student/profile" className="mt-3 flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">
                <Settings size={14}/> แก้ไขข้อมูลส่วนตัว
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 text-orange-600 px-5 py-3 rounded-2xl flex items-center gap-3 border border-orange-200 shadow-sm flex-1 sm:flex-none">
                  <Star size={20} className="fill-orange-600"/>
                  <div>
                      <p className="text-[9px] font-black uppercase opacity-60 leading-none">แต้มสะสม</p>
                      <p className="text-xl font-black">{points} <span className="text-xs uppercase">pts</span></p>
                  </div>
              </div>
              <Link href="/student/courses" className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 flex-1 sm:flex-none justify-center">
                  <Plus size={18}/> เติมเวลา
              </Link>
            </div>
          </header>

          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <Wallet size={24} className="text-blue-600"/> ชั่วโมงเรียนคงเหลือ (แยกตาม Tier)
          </h2>
          
          {/* ✨ ตาราง 6-Tier Wallet */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {walletList.map((tier, idx) => (
              <div key={idx} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                <div className={`p-6 bg-gradient-to-r ${tier.color} text-white`}>
                  <h3 className="font-black text-lg">{tier.label}</h3>
                </div>
                
                {/* โชว์ยอดคงเหลือ */}
                <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-50">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><Globe size={12}/> Online</p>
                    <p className="text-2xl font-black text-blue-600">{tier.online} <span className="text-[10px] text-gray-300">ชม.</span></p>
                  </div>
                  <div className="flex flex-col gap-1 border-l pl-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><MapPin size={12}/> Onsite</p>
                    <p className="text-2xl font-black text-green-600">{tier.onsite} <span className="text-[10px] text-gray-300">ชม.</span></p>
                  </div>
                </div>
                
                <div className="flex gap-2 p-4">
                  <Link 
                    href={`/student/booking-flow?tier=${tier.id}&type=Online`} 
                    className="flex-1 p-3 bg-blue-50 rounded-2xl text-center text-xs font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                  >
                    จอง Online
                  </Link>
                  <Link 
                    href={`/student/booking-flow?tier=${tier.id}&type=Onsite`} 
                    className="flex-1 p-3 bg-green-50 rounded-2xl text-center text-xs font-black text-green-600 hover:bg-green-600 hover:text-white transition-all uppercase tracking-widest"
                  >
                    จอง Onsite
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-black mb-6">เมนูทางลัด</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
             <Link href="/student/booking-flow" className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Calendar size={28}/></div>
                    <div><p className="font-black text-gray-900 text-lg">จองคิวเรียน</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Book a class</p></div>
                </div>
                <ChevronRight className="text-gray-200 group-hover:text-blue-600" size={24}/>
             </Link>

             <Link href="/student/my-schedule" className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all"><Layout size={28}/></div>
                    <div><p className="font-black text-gray-900 text-lg">ตารางเรียน</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Schedule</p></div>
                </div>
                <ChevronRight className="text-gray-200 group-hover:text-purple-600" size={24}/>
             </Link>

             <Link href="/student/tutors" className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all"><Users size={28}/></div>
                    <div><p className="font-black text-gray-900 text-lg">ทำเนียบติวเตอร์</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tutors Catalog</p></div>
                </div>
                <ChevronRight className="text-gray-200 group-hover:text-teal-600" size={24}/>
             </Link>
          </div>

          {/* ✨ ส่วนใหม่! กล่องโชว์ Referral Code ให้ก๊อปปี้ไปแชร์ */}
          <div className="mb-4 bg-white p-6 md:p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                 <Share2 size={28} />
              </div>
              <div>
                 <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-1">ชวนเพื่อนเรียน รับแต้มฟรี! 🎁</h3>
                 <p className="text-gray-500 font-bold text-xs md:text-sm">ให้เพื่อนกรอกรหัสของคุณตอนแจ้งโอน เพื่อรับแต้ม Affiliate 100-10-1</p>
              </div>
            </div>
            
            <div className="relative z-10 flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200 w-full md:w-auto">
               <div className="px-6 py-3 bg-white rounded-xl font-black text-lg md:text-xl text-blue-600 tracking-[0.2em] border border-gray-100 w-full text-center shadow-inner">
                  {referralCode}
               </div>
               <button 
                  onClick={handleCopyReferral} 
                  className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg active:scale-95"
                  title="คัดลอกรหัส"
               >
                  <Copy size={20} />
               </button>
            </div>
            
            {/* ไอคอนตกแต่งพื้นหลัง */}
            <Sparkles className="absolute -right-5 -bottom-5 text-blue-50 opacity-50 group-hover:rotate-12 transition-transform duration-700" size={150} />
          </div>

          {/* กล่อง Affiliate Shop ด้านล่างสุด */}
          <div className="pb-10">
            <Link href="/student/affiliate/shop" className="bg-gradient-to-br from-orange-400 to-red-500 p-8 md:p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-2xl hover:shadow-orange-200 transition-all group overflow-hidden relative">
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                 <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <Gift size={40}/>
                 </div>
                 <div>
                   <h3 className="text-2xl md:text-4xl font-black text-white mb-2">ร้านค้าแลกรางวัล</h3>
                   <p className="text-orange-100 font-bold text-sm">ใช้แต้มสะสมแลกรับของรางวัลพิเศษมากมาย คุ้มสุดๆ!</p>
                 </div>
               </div>
               <div className="relative z-10 bg-white text-orange-600 px-8 py-4 rounded-2xl font-black flex items-center gap-2 group-hover:bg-orange-50 transition-colors w-full md:w-auto justify-center shadow-lg">
                 ไปแลกรางวัลกันเลย <ChevronRight size={20}/>
               </div>
               <Sparkles className="absolute -right-10 -bottom-10 text-white/10 group-hover:rotate-12 transition-transform duration-700" size={240} />
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
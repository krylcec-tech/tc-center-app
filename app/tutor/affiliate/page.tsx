'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Copy, Check, Wallet, Users, TrendingUp, History, Gift, ArrowLeft, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function AffiliateCenterPage() {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // ข้อมูลที่จะนำมาโชว์
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. ดึงข้อมูลโปรไฟล์ (เพื่อเอารหัสแนะนำ)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      // 2. ดึงจำนวนคนที่ชวนสำเร็จ (นับจากคนที่ใส่รหัสเรา)
      if (profileData) {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('referred_by_id', profileData.id);
        setReferralCount(count || 0);
      }

      // 3. ดึงกระเป๋าแต้ม
      const { data: walletData } = await supabase
        .from('affiliate_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setWallet(walletData || { points_balance: 0 }); // ถ้ายังไม่มีกระเป๋า ให้โชว์ 0 ไปก่อน

      // 4. ดึงประวัติ
      const { data: txData } = await supabase
        .from('affiliate_transactions')
        .select('*')
        .eq('wallet_id', walletData?.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      setTransactions(txData || []);

    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link href="/tutor" className="text-gray-400 font-bold text-xs uppercase mb-2 flex items-center gap-2 hover:text-blue-600 transition-colors w-max group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> กลับหน้าหลัก
            </Link>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Affiliate Center 💰</h1>
            <p className="text-gray-500 font-bold mt-1 text-sm">ชวนเพื่อนมาเรียน รับแต้มแลกเงินรางวัล</p>
          </div>
          
          <Link 
            href="/tutor/affiliate/team" 
            className="bg-blue-50 text-blue-600 px-6 py-3.5 rounded-2xl font-black hover:bg-blue-100 transition-all flex items-center justify-center gap-2 shadow-sm border border-blue-100 active:scale-95 w-full md:w-auto"
          >
            <Users size={20} /> เครือข่ายสายงานของฉัน <ChevronRight size={18} />
          </Link>
        </div>

        {/* 1. กล่องรหัสแนะนำ */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-blue-200 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Users size={200} />
          </div>
          <div className="relative z-10 text-center md:text-left w-full md:w-auto">
            <p className="text-blue-200 font-bold text-xs md:text-sm uppercase mb-2 tracking-widest">รหัสแนะนำของคุณ (Referral Code)</p>
            <div className="text-4xl md:text-6xl font-black tracking-widest">{profile?.referral_code || 'ยังไม่มีรหัส'}</div>
          </div>
          
          <button 
            onClick={handleCopy}
            className="relative z-10 w-full md:w-auto bg-white/20 hover:bg-white text-white hover:text-blue-600 backdrop-blur-md px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 active:scale-95 border border-white/30"
          >
            {copied ? <Check size={24} className="text-green-500" /> : <Copy size={24} />}
            {copied ? 'ก๊อปปี้แล้ว!' : 'คัดลอกรหัส'}
          </button>
        </div>

        {/* 2. สถิติกระเป๋าแต้ม */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-green-100 p-4 rounded-2xl text-green-600"><Wallet size={28} /></div>
            <div>
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">แต้มสะสมปัจจุบัน</p>
              <p className="text-3xl font-black text-gray-900">{wallet?.points_balance || 0} <span className="text-lg text-gray-400 font-bold">pts</span></p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 p-4 rounded-2xl text-blue-600"><Users size={28} /></div>
            <div>
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">ชวนเพื่อนสำเร็จ</p>
              <p className="text-3xl font-black text-gray-900">{referralCount} <span className="text-lg text-gray-400 font-bold">คน</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-orange-100 p-4 rounded-2xl text-orange-600"><TrendingUp size={28} /></div>
            <div>
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">รายได้โดยประมาณ</p>
              <p className="text-3xl font-black text-gray-900">฿{(wallet?.points_balance || 0) * 5}</p>
            </div>
          </div>
        </div>

        {/* ✨ 3. ทางลัดเข้าคลังสินค้า (เพิ่มใหม่ สวยงามสะดุดตา) */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-purple-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
             <BookOpen size={200} className="-mt-10 -mr-10"/>
          </div>
          <div className="relative z-10 w-full md:w-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-2">
              แชร์คอร์สเรียน รับค่าคอมฯ <span className="text-3xl">💸</span>
            </h2>
            <p className="text-indigo-100 font-medium text-sm max-w-xl leading-relaxed">
              เลือกคอร์สเรียนและหนังสือที่ใช่ คัดลอกลิงก์ไปแชร์ให้นักเรียน เมื่อมีการสั่งซื้อผ่านลิงก์ของคุณ รับแต้มสะสมเข้ากระเป๋าทันที!
            </p>
          </div>
          <Link href="/tutor/courses" className="relative z-10 w-full md:w-auto bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0">
            เปิดคลังสินค้า <ChevronRight size={18}/>
          </Link>
        </div>

        {/* 4. ประวัติ & ร้านค้าแลกรางวัล */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
              <History className="text-blue-600" /> ประวัติล่าสุด
            </h2>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-gray-800">{tx.description}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{new Date(tx.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                    <div className={`font-black text-lg ${tx.type === 'EARN' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'EARN' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 font-bold bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                ยังไม่มีประวัติการรับแต้ม
              </div>
            )}
          </div>

          <div className="bg-gradient-to-b from-purple-50 to-white rounded-[2.5rem] border border-purple-100 shadow-sm p-8 flex flex-col items-center justify-center text-center group">
            <div className="bg-white p-6 rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform">
               <Gift size={48} className="text-purple-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">แลกของรางวัล</h2>
            <p className="text-gray-500 font-bold mb-8 text-sm leading-relaxed">สะสมแต้มเพื่อแลกเป็นเงินสด<br/>หรือของรางวัลพิเศษจากระบบ</p>
            
            <Link href="/tutor/affiliate/shop" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-purple-200">
              เข้าสู่ร้านค้าแลกแต้ม <ChevronRight size={24} />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Copy, Check, Wallet, Users, TrendingUp, History, Gift, ArrowLeft, ChevronRight } from 'lucide-react';
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
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header (อัปเดตเพิ่มปุ่มดูเครือข่าย) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link href="/tutor" className="text-gray-400 font-bold text-xs uppercase mb-2 flex items-center gap-2 hover:text-blue-600 transition-colors w-max">
              <ArrowLeft size={16}/> กลับหน้าหลัก
            </Link>
            <h1 className="text-3xl font-black text-gray-900">Affiliate Center 💰</h1>
            <p className="text-gray-500 font-bold mt-1">ชวนเพื่อนมาเรียน รับแต้มแลกเงินรางวัล</p>
          </div>
          
          {/* ปุ่มทางเข้าหน้า Team (ใหม่) */}
          <Link 
            href="/tutor/affiliate/team" 
            className="bg-blue-50 text-blue-600 px-6 py-3.5 rounded-2xl font-black hover:bg-blue-100 transition-all flex items-center justify-center gap-2 shadow-sm border border-blue-100 active:scale-95 w-full md:w-auto"
          >
            <Users size={20} /> เครือข่ายสายงานของฉัน <ChevronRight size={18} />
          </Link>
        </div>

        {/* 1. กล่องรหัสแนะนำ (The Referral Hub) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-blue-200 font-bold text-sm uppercase mb-2 tracking-wider">รหัสแนะนำของคุณ (Referral Code)</p>
            <div className="text-5xl font-black tracking-widest">{profile?.referral_code || 'ยังไม่มีรหัส'}</div>
          </div>
          
          <button 
            onClick={handleCopy}
            className="w-full md:w-auto bg-white/20 hover:bg-white text-white hover:text-blue-600 backdrop-blur-md px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {copied ? <Check size={24} className="text-green-400" /> : <Copy size={24} />}
            {copied ? 'ก๊อปปี้แล้ว!' : 'คัดลอกรหัส'}
          </button>
        </div>

        {/* 2. สถิติกระเป๋าแต้ม (Stats Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-green-100 p-4 rounded-2xl text-green-600"><Wallet size={28} /></div>
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase">แต้มสะสมปัจจุบัน</p>
              <p className="text-3xl font-black text-gray-900">{wallet?.points_balance || 0} <span className="text-lg text-gray-500">pts</span></p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-2xl text-blue-600"><Users size={28} /></div>
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase">ชวนเพื่อนสำเร็จ</p>
              <p className="text-3xl font-black text-gray-900">{referralCount} <span className="text-lg text-gray-500">คน</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-orange-100 p-4 rounded-2xl text-orange-600"><TrendingUp size={28} /></div>
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase">รายได้สะสมโดยประมาณ</p>
              <p className="text-3xl font-black text-gray-900">฿{(wallet?.points_balance || 0) * 5}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 3. ประวัติการรับแต้ม */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
              <History className="text-blue-600" /> ประวัติล่าสุด
            </h2>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0">
                    <div>
                      <p className="font-bold text-gray-800">{tx.description}</p>
                      <p className="text-xs text-gray-400 font-bold">{new Date(tx.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                    <div className={`font-black ${tx.type === 'EARN' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'EARN' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 font-bold bg-gray-50 rounded-2xl">
                ยังไม่มีประวัติการทำรายการ
              </div>
            )}
          </div>

          {/* 4. ทางเข้าหน้าร้านค้า (Redeem Shop) */}
          <div className="bg-gradient-to-b from-purple-50 to-white rounded-[2rem] border border-purple-100 shadow-sm p-8 flex flex-col items-center justify-center text-center">
            <Gift size={64} className="text-purple-400 mb-4 drop-shadow-sm" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">ร้านค้าของรางวัล</h2>
            <p className="text-gray-500 font-bold mb-8 text-sm">สะสมแต้มเพื่อแลกเป็นเงินสด หรือของรางวัลพิเศษ<br/>ตรวจสอบประวัติการแลกได้ที่นี่</p>
            
            <Link href="/tutor/affiliate/shop" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
              เข้าสู่หน้าร้านค้า <ChevronRight size={24} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
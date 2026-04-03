'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Wallet, Gift, ArrowLeft, ChevronRight, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function TutorRewardShopPage() {
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  
  const [wallet, setWallet] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [redeemHistory, setRedeemHistory] = useState<any[]>([]); // ประวัติการแลกของ

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. ดึงกระเป๋าแต้ม
      const { data: walletData } = await supabase
        .from('affiliate_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setWallet(walletData || { points_balance: 0 });

      // 2. ดึงของรางวัล (เฉพาะหมวด TUTOR)
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('target_group', 'TUTOR')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });
      setRewards(rewardsData || []);

      // 3. ดึงประวัติคำร้องขอแลกของ (เฉพาะของตัวเอง)
      const { data: historyData } = await supabase
        .from('redeem_requests')
        .select(`*, rewards ( name, points_cost )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRedeemHistory(historyData || []);

    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: any) => {
    const currentPoints = wallet?.points_balance || 0;
    if (currentPoints < reward.points_cost) {
      alert('แต้มของคุณไม่เพียงพอสำหรับการแลกของรางวัลนี้ครับ 😢');
      return;
    }

    if (!confirm(`ยืนยันการแลก "${reward.name}" โดยใช้ ${reward.points_cost} แต้ม ใช่หรือไม่?`)) return;

    setRedeeming(reward.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: requestError } = await supabase.from('redeem_requests').insert([{
        user_id: user?.id,
        reward_id: reward.id,
        status: 'PENDING'
      }]);
      if (requestError) throw requestError;

      const newBalance = currentPoints - reward.points_cost;
      const { error: walletError } = await supabase.from('affiliate_wallets')
        .update({ points_balance: newBalance })
        .eq('id', wallet.id);
      if (walletError) throw walletError;

      await supabase.from('affiliate_transactions').insert([{
        wallet_id: wallet.id,
        amount: reward.points_cost,
        description: `แลกของรางวัล: ${reward.name}`,
        type: 'REDEEM'
      }]);

      alert('ส่งคำร้องสำเร็จ! 🎉 สามารถติดตามสถานะได้ที่ประวัติการแลกครับ');
      fetchShopData(); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;
  }

  const currentPoints = wallet?.points_balance || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header แบบมี Card บอกแต้ม */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div>
            <Link href="/tutor/affiliate" className="text-gray-400 font-bold text-xs uppercase mb-2 flex items-center gap-2 hover:text-purple-600 transition-colors w-max">
              <ArrowLeft size={16}/> กลับหน้า Affiliate Center
            </Link>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Gift className="text-purple-600" size={32} /> ร้านค้าของรางวัล
            </h1>
            <p className="text-gray-500 font-bold mt-1 text-sm">แลกของรางวัลพิเศษสำหรับติวเตอร์โดยเฉพาะ</p>
          </div>
          <div className="bg-purple-50 px-6 py-4 rounded-2xl border border-purple-100 flex items-center gap-4">
            <div className="bg-purple-200 p-3 rounded-xl text-purple-700"><Wallet size={24} /></div>
            <div>
              <p className="text-purple-400 font-bold text-[10px] uppercase">แต้มที่ใช้ได้</p>
              <p className="text-2xl font-black text-purple-700">{currentPoints} <span className="text-sm">pts</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ฝั่งซ้าย: แคตตาล็อกของรางวัล (กินพื้นที่ 2 ส่วน) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-black text-gray-900 ml-2">🎁 ของรางวัลทั้งหมด</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.length > 0 ? rewards.map((reward) => {
                const canAfford = currentPoints >= reward.points_cost;
                return (
                  <div key={reward.id} className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col">
                    
                    {/* แกลเลอรีรูปภาพ */}
                    {reward.image_urls && reward.image_urls.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto snap-x pb-3 scrollbar-hide mb-2 -mx-2 px-2">
                        {reward.image_urls.map((url: string, imgIdx: number) => (
                          <img 
                            key={imgIdx} src={url} alt={reward.name} 
                            className="w-full h-48 object-cover rounded-xl snap-center flex-shrink-0 border border-gray-100" 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-50 rounded-xl mb-4 flex items-center justify-center text-gray-300">
                        <Gift size={48} />
                      </div>
                    )}

                    <div className="mt-auto pt-2">
                      <h3 className="font-black text-gray-800 text-lg mb-1">{reward.name}</h3>
                      <div className="flex justify-between items-end mt-4">
                        <p className="text-purple-600 font-black bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                          {reward.points_cost} pts
                        </p>
                        <button 
                          onClick={() => handleRedeem(reward)}
                          disabled={!canAfford || redeeming === reward.id}
                          className={`px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${
                            canAfford 
                              ? 'bg-gray-900 text-white hover:bg-purple-600 active:scale-95 shadow-md' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {redeeming === reward.id ? <Loader2 className="animate-spin" size={16} /> : 'แลกเลย'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full text-center py-20 text-gray-400 font-bold bg-white rounded-[2rem] border border-dashed border-gray-200">
                  กำลังเตรียมของรางวัลสุดพิเศษ...
                </div>
              )}
            </div>
          </div>

          {/* ฝั่งขวา: ประวัติการแลกของ (กินพื้นที่ 1 ส่วน) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 sticky top-6">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="text-orange-500" /> สถานะการแลกของ
              </h2>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {redeemHistory.length > 0 ? redeemHistory.map((history) => (
                  <div key={history.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="font-black text-gray-800 mb-1">{history.rewards?.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-400 font-bold">
                        {new Date(history.created_at).toLocaleDateString('th-TH')}
                      </span>
                      
                      {/* Badge สถานะ */}
                      {history.status === 'PENDING' && (
                        <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1">
                          <Clock size={12} /> รอแอดมินอนุมัติ
                        </span>
                      )}
                      {history.status === 'COMPLETED' && (
                        <span className="bg-green-100 text-green-600 px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1">
                          <CheckCircle size={12} /> รับของแล้ว
                        </span>
                      )}
                      {history.status === 'REJECTED' && (
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1">
                          <XCircle size={12} /> ถูกยกเลิก
                        </span>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-gray-400 font-bold text-sm">
                    คุณยังไม่เคยแลกของรางวัล
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
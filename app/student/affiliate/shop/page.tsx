'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Wallet, Gift, ArrowLeft, ChevronRight, Loader2, Clock, CheckCircle, BookOpen, Star, XCircle, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function StudentRewardShopPage() {
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  
  const [wallet, setWallet] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [redeemHistory, setRedeemHistory] = useState<any[]>([]);
  
  // ✨ State สำหรับเก็บข้อมูล Leaderboard (Rank)
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. ดึงกระเป๋าแต้มของตัวเอง
      const { data: walletData } = await supabase
        .from('student_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setWallet(walletData);

      // 2. ดึงของรางวัล (เฉพาะหมวด STUDENT)
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('target_group', 'STUDENT')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });
      setRewards(rewardsData || []);

      // 3. ดึงประวัติการแลก
      const { data: historyData } = await supabase
        .from('redeem_requests')
        .select(`*, rewards ( name, points_cost )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRedeemHistory(historyData || []);

      // 4. ✨ ดึงข้อมูล Rank สำหรับ Leaderboard (ดึงเฉพาะคนที่แต้ม > 0)
      const { data: rankData } = await supabase
        .from('student_wallets')
        .select('student_name, marketing_points')
        .gt('marketing_points', 0) // ไม่เอาคนที่แต้มเป็น 0
        .order('marketing_points', { ascending: false }); // เรียงจากมากไปน้อย
      setLeaderboard(rankData || []);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: any) => {
    const currentPoints = wallet?.marketing_points || 0;
    if (currentPoints < reward.points_cost) {
      alert('แต้มสะสมของคุณยังไม่พอครับ มาพยายามสะสมเพิ่มกันนะ! 🌟');
      return;
    }

    if (!confirm(`ยืนยันการแลกรางวัล "${reward.name}" ใช่หรือไม่?`)) return;

    setRedeeming(reward.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. สร้างคำร้อง
      await supabase.from('redeem_requests').insert([{
        user_id: user?.id,
        reward_id: reward.id,
        status: 'PENDING'
      }]);

      // 2. หักแต้ม
      await supabase.from('student_wallets')
        .update({ marketing_points: currentPoints - reward.points_cost })
        .eq('user_id', user?.id);

      alert('แลกรางวัลสำเร็จ! 🎉 แอดมินจะดำเนินการส่งของ/เพิ่มชั่วโมงให้โดยเร็วที่สุดครับ');
      fetchShopData(); // โหลดข้อมูลใหม่ทั้งหมดเพื่ออัปเดตแต้มและ Rank ทันที
    } catch (error: any) {
      alert('ผิดพลาด: ' + error.message);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <Link href="/student" className="text-gray-400 font-bold text-xs uppercase mb-2 flex items-center gap-2 hover:text-blue-600 w-max mx-auto md:mx-0 transition-all">
              <ArrowLeft size={16}/> กลับหน้าหลัก
            </Link>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Star className="text-orange-500 fill-orange-500" size={32} /> ร้านค้าเด็กขยัน
            </h1>
            <p className="text-gray-500 font-bold mt-1">เปลี่ยนแต้มความขยัน เป็นของรางวัลสุดว้าว!</p>
          </div>

          <div className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] shadow-lg shadow-blue-100 text-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <p className="text-blue-200 font-bold text-xs uppercase tracking-widest mb-1 relative z-10">แต้มสะสมของคุณ</p>
            <div className="flex items-center gap-2 justify-center relative z-10">
              <span className="text-4xl font-black">{wallet?.marketing_points || 0}</span>
              <span className="text-xl font-bold opacity-80">PTS</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* === คอลัมน์ซ้าย: รายการของรางวัล (กว้าง 2 ส่วน) === */}
          <div className="lg:col-span-2 space-y-4">
             <h2 className="text-xl font-black text-gray-800 ml-2">🎁 เลือกรางวัลที่ชอบ</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {rewards.map(reward => (
                 <div key={reward.id} className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
                   {reward.image_urls?.[0] ? (
                     <div className="overflow-hidden rounded-2xl mb-4 h-44">
                       <img src={reward.image_urls[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                   ) : (
                     <div className="w-full h-44 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center group-hover:bg-blue-50 transition-colors"><BookOpen className="text-gray-200 group-hover:text-blue-200 transition-colors" size={48}/></div>
                   )}
                   <h3 className="font-black text-gray-900 text-lg mb-1">{reward.name}</h3>
                   <div className="mt-auto flex justify-between items-center pt-4">
                     <span className="text-blue-600 font-black text-xl">{reward.points_cost} <span className="text-sm font-bold text-blue-400">แต้ม</span></span>
                     <button 
                       disabled={redeeming === reward.id}
                       onClick={() => handleRedeem(reward)}
                       className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-600 transition-all active:scale-95 disabled:bg-gray-400"
                     >
                       {redeeming === reward.id ? 'กำลังแลก...' : 'แลกเลย'}
                     </button>
                   </div>
                 </div>
               ))}
               {rewards.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 font-bold bg-white rounded-[2rem] border border-dashed border-gray-200">ยังไม่มีของรางวัลในขณะนี้</div>}
             </div>
          </div>

          {/* === คอลัมน์ขวา: Leaderboard & ประวัติการแลก (กว้าง 1 ส่วน) === */}
          <div className="lg:col-span-1 space-y-6">
             
             {/* ✨ 1. ทำเนียบคนเก่ง (Leaderboard) */}
             <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-500 fill-yellow-500"/> ทำเนียบคนขยัน (Rank)
                </h2>
                
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {leaderboard.length > 0 ? leaderboard.map((student, idx) => {
                    // กำหนดสีเหรียญ/อันดับ
                    let rankStyle = "bg-white text-gray-400 border border-gray-200";
                    if (idx === 0) rankStyle = "bg-yellow-100 text-yellow-600 border-yellow-200";
                    else if (idx === 1) rankStyle = "bg-gray-200 text-gray-600 border-gray-300";
                    else if (idx === 2) rankStyle = "bg-orange-100 text-orange-600 border-orange-200";

                    return (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${idx < 3 ? 'bg-gradient-to-r from-white to-gray-50 border-gray-100' : 'bg-white border-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${rankStyle}`}>
                            {idx + 1}
                          </div>
                          <span className="font-bold text-sm text-gray-700 truncate max-w-[130px]">น้อง{student.student_name || 'ไม่ระบุชื่อ'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-blue-600">{student.marketing_points}</span>
                          <span className="text-[10px] text-gray-400 font-bold ml-1 uppercase tracking-widest">Pts</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 text-gray-400 text-sm font-bold bg-gray-50 rounded-2xl">ยังไม่มีคนสะสมแต้มเลย ลุยเลย!</div>
                  )}
                </div>
             </div>

             {/* 2. สถานะการแลกของ (History) */}
             <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600"/> สถานะการแลกของ
                </h2>
                
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {redeemHistory.length > 0 ? redeemHistory.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="font-black text-gray-800 text-sm mb-1">{item.rewards?.name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-gray-400 font-bold">{new Date(item.created_at).toLocaleDateString('th-TH')}</span>
                        {item.status === 'PENDING' && <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-1 rounded-md">รอตรวจสอบ</span>}
                        {item.status === 'COMPLETED' && <span className="text-[10px] font-black bg-green-100 text-green-600 px-2 py-1 rounded-md">ได้รับแล้ว</span>}
                        {item.status === 'REJECTED' && <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded-md">ยกเลิก</span>}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-400 text-sm font-bold bg-gray-50 rounded-2xl">คุณยังไม่เคยแลกรางวัล</div>
                  )}
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
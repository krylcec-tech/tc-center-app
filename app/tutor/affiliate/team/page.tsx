'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Network, Users, ArrowLeft, Loader2, UserCircle, Calendar, Crown, ChevronRight, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function MyNetworkPage() {
  const [loading, setLoading] = useState(true);
  const [networkTree, setNetworkTree] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalMembers: 0 });

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. ดึงลูกข่ายชั้นที่ 1 (Direct Referrals)
      const { data: tier1, error: t1Error } = await supabase
        .from('profiles')
        .select('id, created_at, email, school_name') 
        .eq('referred_by_id', user.id)
        .order('created_at', { ascending: false });

      if (t1Error) throw t1Error;

      if (tier1) {
        const fullTree = await Promise.all(tier1.map(async (member: any) => {
          // ดึงข้อมูลชื่อจาก Wallet ของชั้นที่ 1
          const { data: wallet } = await supabase
            .from('student_wallets')
            .select('student_name, parent_name')
            .eq('user_id', member.id)
            .maybeSingle();

          // ✨ ตัวแปรเก็บชื่อที่จะแสดง (ถ้าไม่มีชื่อใน wallet ให้ใช้ email แทน)
          const displayName = wallet?.student_name || member.email?.split('@')[0] || 'สมาชิกใหม่';

          // 2. ดึงลูกข่ายชั้นที่ 2 (ลูกทีมของลูกทีม)
          const { data: tier2 } = await supabase
            .from('profiles')
            .select('id, created_at, email')
            .eq('referred_by_id', member.id);

          const tier2WithNames = tier2 ? await Promise.all(tier2.map(async (sub: any) => {
             const { data: subWallet } = await supabase
               .from('student_wallets')
               .select('student_name')
               .eq('user_id', sub.id)
               .maybeSingle();
             
             return { 
               ...sub, 
               displayName: subWallet?.student_name || sub.email?.split('@')[0] || 'สมาชิกใหม่' 
             };
          })) : [];
          
          return { 
            ...member, 
            displayName,
            parent_name: wallet?.parent_name,
            sub_members: tier2WithNames 
          };
        }));

        setNetworkTree(fullTree);
        const countTier2 = fullTree.reduce((acc, curr) => acc + curr.sub_members.length, 0);
        setStats({ totalMembers: (tier1.length + countTier2) });
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <Link href="/tutor/affiliate" className="text-gray-400 font-bold text-xs uppercase mb-4 flex items-center gap-2 hover:text-purple-600 transition-colors w-max">
            <ArrowLeft size={16}/> กลับหน้า Affiliate
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <Network className="text-purple-600" size={36} /> เครือข่ายสายงาน 💰
              </h1>
              <p className="text-gray-500 font-bold mt-2 text-sm">ระบบลูกโซ่สายงาน: ดูคนที่คุณแนะนำ และสายงานที่เติบโตต่อ</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-8 py-5 rounded-3xl text-white shadow-lg shadow-purple-200 flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><Users size={28} /></div>
              <div>
                <p className="text-purple-100 font-bold text-xs uppercase tracking-wider mb-1">สมาชิกในสายงานทั้งหมด</p>
                <p className="text-3xl font-black">{stats.totalMembers} <span className="text-lg font-medium opacity-80">คน</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* รายชื่อสายงาน */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 px-2 flex items-center gap-2">
            <Share2 className="text-blue-600" size={20}/> โครงสร้างลูกทีมของคุณ
          </h2>

          {networkTree.length > 0 ? (
            networkTree.map((member) => (
              <div key={member.id} className="space-y-2">
                {/* ชั้นที่ 1 (ลูกทีมสายตรง) */}
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-black">
                      <UserCircle size={32} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">
                        {member.displayName}
                      </p>
                      <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">ระดับที่ 1 (Direct)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">เข้าร่วมเมื่อ</p>
                    <p className="text-xs font-bold text-gray-600">{new Date(member.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                </div>

                {/* ชั้นที่ 2 (ลูกโซ่ต่อจากชั้นที่ 1) */}
                {member.sub_members.length > 0 && (
                  <div className="ml-10 space-y-2 relative">
                    <div className="absolute -left-6 top-0 bottom-4 w-0.5 bg-gray-100"></div>
                    {member.sub_members.map((sub: any) => (
                      <div key={sub.id} className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-50 flex items-center justify-between relative">
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gray-100"></div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white text-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                            <Users size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 text-sm">
                              {sub.displayName}
                            </p>
                            <p className="text-[9px] font-black text-blue-400 uppercase">ระดับที่ 2 (Sub-team)</p>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 italic">สายงานของ {member.displayName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[2rem] p-20 text-center border-2 border-dashed border-gray-100">
               <Network className="mx-auto text-gray-200 mb-4" size={64}/>
               <p className="text-gray-400 font-black">ยังไม่มีสายงานในระบบ</p>
               <p className="text-gray-400 text-sm font-medium">เริ่มแชร์รหัสของคุณเพื่อสร้างเครือข่ายวันนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
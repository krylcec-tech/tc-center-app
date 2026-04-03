'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Network, Users, ArrowLeft, Loader2, UserCircle, Calendar, Crown } from 'lucide-react';
import Link from 'next/link';

export default function MyNetworkPage() {
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalMembers: 0 });

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ดึงโปรไฟล์ตัวเองก่อนเพื่อเอา ID
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      
      if (profile) {
        // ดึงรายชื่อคนที่ใส่รหัสแนะนำของเรา (ลูกทีมชั้นที่ 1)
        // เชื่อมตาราง student_wallets มาเพื่อดูชื่อเล่นเด็ก และชั่วโมงสะสม
        const { data: members } = await supabase
          .from('profiles')
          .select(`
            id,
            created_at,
            student_wallets ( student_name, parent_name, total_hours_balance )
          `)
          .eq('referred_by_id', profile.id)
          .order('created_at', { ascending: false });

        setTeamMembers(members || []);
        setStats({ totalMembers: members?.length || 0 });
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
                <Network className="text-purple-600" size={36} /> เครือข่ายของฉัน
              </h1>
              <p className="text-gray-500 font-bold mt-2 text-sm">ดูรายชื่อผู้ปกครองและนักเรียนที่คุณแนะนำเข้าสู่ระบบ</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-8 py-5 rounded-3xl text-white shadow-lg shadow-purple-200 flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><Users size={28} /></div>
              <div>
                <p className="text-purple-100 font-bold text-xs uppercase tracking-wider mb-1">ลูกทีมสายตรง</p>
                <p className="text-3xl font-black">{stats.totalMembers} <span className="text-lg font-medium opacity-80">ครอบครัว</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* รายชื่อลูกทีม */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Users className="text-blue-600" size={20}/> รายชื่อที่แนะนำสำเร็จ
            </h2>
          </div>
          
          <div className="p-2">
            {teamMembers.length > 0 ? (
              <div className="space-y-2">
                {teamMembers.map((member, idx) => {
                  const studentInfo = member.student_wallets?.[0] || {};
                  return (
                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-lg border-2 border-white shadow-sm relative">
                          {idx === 0 && <Crown size={14} className="absolute -top-2 text-orange-400" />}
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-lg">น้อง{studentInfo.student_name || 'ไม่มีข้อมูล'}</p>
                          <p className="text-xs font-bold text-gray-400">ผู้ปกครอง: {studentInfo.parent_name || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 sm:justify-end bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase">วันที่สมัคร</p>
                          <p className="font-bold text-gray-700 text-sm flex items-center gap-1 sm:justify-end">
                            <Calendar size={14} className="text-gray-400"/>
                            {new Date(member.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <Network className="text-gray-300 mx-auto mb-4" size={64} />
                <h3 className="text-xl font-black text-gray-900 mb-2">ยังไม่มีเครือข่าย</h3>
                <p className="text-gray-500 font-medium">แชร์รหัสแนะนำของคุณให้ผู้ปกครอง เพื่อเริ่มสร้างเครือข่ายรับแต้มสะสม</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
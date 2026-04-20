'use client'
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
// ✨ เพิ่ม X เข้าไปในนี้แล้วครับ!
import { Loader2, DollarSign, CheckCircle2, AlertCircle, Edit3, ArrowLeft, GraduationCap, Search, Filter, Users, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminTutorPayouts() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feeInputs, setFeeInputs] = useState<{ [key: string]: string }>({});

  const [activeTab, setActiveTab] = useState<'PENDING' | 'PAID'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutorId, setSelectedTutorId] = useState<string>('ALL');

  useEffect(() => {
    fetchVerifiedBookings();
  }, []);

  const fetchVerifiedBookings = async () => {
    setLoading(true);
    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id, status, tutor_fee, student_id, tutor_id,
          slots ( start_time, location_type ),
          tutors ( name, email, balance )
        `)
        .eq('status', 'VERIFIED');

      if (bookingsData) {
        const { data: profiles } = await supabase.from('profiles').select('id, email, full_name, grade_level');
        const { data: wallets } = await supabase.from('student_wallets').select('user_id, student_name');
        
        const formatted = bookingsData.map((b: any) => {
          const studentProfile = profiles?.find(p => p.id === b.student_id);
          const studentWallet = wallets?.find(w => w.user_id === b.student_id);
          
          return {
            ...b,
            student_name: studentWallet?.student_name || studentProfile?.full_name || 'ไม่ทราบชื่อ',
            student_email: studentProfile?.email || 'ไม่มีอีเมล',
            student_grade: studentProfile?.grade_level || 'ไม่ระบุระดับชั้น',
            start_time_obj: new Date(b.slots?.start_time || Date.now())
          };
        });

        setPayouts(formatted);
        
        const initialInputs: any = {};
        formatted.forEach(item => {
          initialInputs[item.id] = item.tutor_fee !== null ? String(item.tutor_fee) : '';
        });
        setFeeInputs(initialInputs);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async (booking: any) => {
    const inputValue = parseFloat(feeInputs[booking.id]);
    if (isNaN(inputValue) || inputValue < 0) {
      return alert('กรุณากรอกจำนวนเงินให้ถูกต้องครับ');
    }

    setSavingId(booking.id);
    try {
      const { data: tutorData } = await supabase.from('tutors').select('balance').eq('id', booking.tutor_id).single();
      let currentBalance = tutorData?.balance || 0;

      const oldFee = booking.tutor_fee || 0;
      const newBalance = currentBalance - oldFee + inputValue;

      await supabase.from('tutors').update({ balance: newBalance }).eq('id', booking.tutor_id);
      await supabase.from('bookings').update({ tutor_fee: inputValue }).eq('id', booking.id);

      alert('อัปเดตยอดเงินให้ติวเตอร์เรียบร้อยแล้วครับ! 🎉');
      fetchVerifiedBookings(); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSavingId(null);
    }
  };

  const uniqueTutors = useMemo(() => {
    const tutorsMap = new Map();
    payouts.forEach(item => {
      if (item.tutor_id && !tutorsMap.has(item.tutor_id)) {
        tutorsMap.set(item.tutor_id, item.tutors?.name || 'ไม่ทราบชื่อ');
      }
    });
    return Array.from(tutorsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [payouts]);

  const filteredPayouts = payouts.filter(item => {
    const isPaid = item.tutor_fee !== null && item.tutor_fee > 0;
    if (activeTab === 'PENDING' && isPaid) return false;
    if (activeTab === 'PAID' && !isPaid) return false;

    if (selectedTutorId !== 'ALL' && item.tutor_id !== selectedTutorId) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchStudentName = item.student_name?.toLowerCase().includes(q) || false;
      const matchStudentEmail = item.student_email?.toLowerCase().includes(q) || false;
      const matchTutorName = item.tutors?.name?.toLowerCase().includes(q) || false;
      const matchTutorEmail = item.tutors?.email?.toLowerCase().includes(q) || false;
      
      if (!matchStudentName && !matchStudentEmail && !matchTutorName && !matchTutorEmail) return false;
    }

    return true;
  }).sort((a, b) => {
    if (activeTab === 'PENDING') {
      return a.start_time_obj.getTime() - b.start_time_obj.getTime();
    } else {
      return b.start_time_obj.getTime() - a.start_time_obj.getTime();
    }
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="text-sm font-black text-slate-400 flex items-center gap-2 mb-4 hover:text-blue-600 w-max transition-colors">
          <ArrowLeft size={16}/> กลับหน้าหลัก
        </Link>
        <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3">
          เพิ่มเงินให้ติวเตอร์ <DollarSign className="text-green-500 bg-green-100 p-1.5 rounded-xl" size={36}/>
        </h1>
        <p className="text-slate-500 font-bold mb-8 text-sm">จัดการค่าสอนสำหรับคลาสที่ได้รับการยืนยัน (VERIFIED) แล้ว</p>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center z-20 relative">
          
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-max">
            <button 
              onClick={() => setActiveTab('PENDING')}
              className={`flex-1 lg:px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'PENDING' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              รอจ่ายเงิน
            </button>
            <button 
              onClick={() => setActiveTab('PAID')}
              className={`flex-1 lg:px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'PAID' ? 'bg-white shadow-sm text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              จ่ายเงินแล้ว
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-48">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Users size={16} className="text-slate-400" />
              </div>
              <select 
                value={selectedTutorId}
                onChange={(e) => setSelectedTutorId(e.target.value)}
                className="w-full pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 shadow-sm appearance-none cursor-pointer hover:bg-slate-50"
              >
                <option value="ALL">ติวเตอร์ทั้งหมด</option>
                {uniqueTutors.map(tutor => (
                  <option key={tutor.id} value={tutor.id}>ครู{tutor.name}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ, อีเมล..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14}/>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            {/* ✨ แก้ไขกลับมาเป็น table ให้ถูกต้องแล้วครับ */}
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">รายละเอียดคลาส (เวลา)</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ข้อมูลติวเตอร์</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ข้อมูลนักเรียน</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ค่าสอน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayouts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-black text-slate-800 flex items-center gap-1.5">
                         {item.start_time_obj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} 
                         <span className="text-slate-400 font-bold text-xs">•</span> 
                         <span className="text-blue-600">{item.start_time_obj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                      </p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase mt-1.5 inline-block ${item.slots?.location_type === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {item.slots?.location_type || 'ไม่ระบุ'}
                      </span>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-slate-800">ครู{item.tutors?.name || 'ไม่ทราบชื่อ'}</p>
                      <p className="text-[10px] text-slate-500 font-bold break-all">{item.tutors?.email || 'ไม่มีอีเมล'}</p>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-slate-800 mb-0.5">น้อง{item.student_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mb-1 break-all">{item.student_email}</p>
                      <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 text-[9px] font-black px-2 py-0.5 rounded-md">
                        <GraduationCap size={10}/> {item.student_grade}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                        <input 
                          type="number" 
                          placeholder="0.00"
                          className={`w-24 px-3 py-2.5 bg-white border rounded-xl text-sm font-black text-center outline-none focus:ring-2 transition-all shadow-sm
                            ${activeTab === 'PAID' ? 'border-emerald-200 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-100 bg-emerald-50/30' : 'border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-blue-100'}
                          `}
                          value={feeInputs[item.id] || ''}
                          onChange={(e) => setFeeInputs({...feeInputs, [item.id]: e.target.value})}
                        />
                        <button 
                          onClick={() => handleSaveFee(item)}
                          disabled={savingId === item.id}
                          className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50 min-w-[100px] 
                            ${item.tutor_fee !== null ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200' : 'bg-blue-600 text-white hover:bg-blue-700'}
                          `}
                        >
                          {savingId === item.id ? <Loader2 size={14} className="animate-spin"/> : (item.tutor_fee !== null ? <Edit3 size={14}/> : <CheckCircle2 size={14}/>)}
                          {item.tutor_fee !== null ? 'แก้ไขยอด' : 'ยืนยันจ่าย'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredPayouts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle size={40} className="mb-3 opacity-20" />
                        <p className="font-black text-base text-slate-500">ไม่พบข้อมูลคลาสเรียน</p>
                        <p className="text-xs font-bold mt-1">ลองเปลี่ยนเงื่อนไขการค้นหา หรือสลับแท็บดูนะครับ</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
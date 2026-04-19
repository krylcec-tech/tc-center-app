'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, DollarSign, CheckCircle2, AlertCircle, Edit3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminTutorPayouts() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // เก็บค่าเงินที่แอดมินพิมพ์ในช่อง Input
  const [feeInputs, setFeeInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchVerifiedBookings();
  }, []);

  const fetchVerifiedBookings = async () => {
    setLoading(true);
    try {
      // ดึงคลาสที่ VERIFIED แล้ว
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id, status, tutor_fee, student_id,
          tutor_id,
          slots ( start_time, location_type ),
          tutors ( name, email, balance )
        `)
        .eq('status', 'VERIFIED')
        .order('id', { ascending: false });

      if (bookingsData) {
        // ดึงข้อมูลนักเรียนมาจับคู่ (ชื่อและอีเมล)
        const { data: profiles } = await supabase.from('profiles').select('id, email, full_name');
        const { data: wallets } = await supabase.from('student_wallets').select('user_id, student_name');
        
        const formatted = bookingsData.map((b: any) => {
          const studentProfile = profiles?.find(p => p.id === b.student_id);
          const studentWallet = wallets?.find(w => w.user_id === b.student_id);
          
          return {
            ...b,
            student_name: studentWallet?.student_name || studentProfile?.full_name || 'ไม่ทราบชื่อ',
            student_email: studentProfile?.email || 'ไม่มีอีเมล'
          };
        });

        setPayouts(formatted);
        
        // ตั้งค่าเริ่มต้นให้ช่อง Input (ถ้าเคยกรอกเงินไว้แล้ว ให้โชว์เลขเดิม)
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
      // 1. ดึงยอดเงินล่าสุดของติวเตอร์
      const { data: tutorData } = await supabase.from('tutors').select('balance').eq('id', booking.tutor_id).single();
      let currentBalance = tutorData?.balance || 0;

      // 2. คำนวณยอดเงินใหม่ (หักของเก่าออกก่อน แล้วบวกของใหม่เข้าไป)
      const oldFee = booking.tutor_fee || 0;
      const newBalance = currentBalance - oldFee + inputValue;

      // 3. อัปเดตตาราง tutors (ยอดเงินรวม) และ bookings (ค่าสอนรอบนี้)
      await supabase.from('tutors').update({ balance: newBalance }).eq('id', booking.tutor_id);
      await supabase.from('bookings').update({ tutor_fee: inputValue }).eq('id', booking.id);

      alert('อัปเดตยอดเงินให้ติวเตอร์เรียบร้อยแล้วครับ! 🎉');
      fetchVerifiedBookings(); // รีเฟรชข้อมูล
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="text-sm font-black text-slate-400 flex items-center gap-2 mb-4 hover:text-blue-600"><ArrowLeft size={16}/> กลับหน้าหลัก</Link>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">เพิ่มเงินให้ติวเตอร์ <DollarSign className="text-green-500" size={32}/></h1>
        <p className="text-slate-500 font-bold mb-8">จัดการค่าสอนสำหรับคลาสที่ได้รับการยืนยัน (VERIFIED) แล้ว</p>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase">รายละเอียดคลาส</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase">ข้อมูลติวเตอร์</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase">ข้อมูลนักเรียน</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-center">ค่าสอน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payouts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5">
                      <p className="font-black text-slate-800">{new Date(item.slots.start_time).toLocaleDateString('th-TH')} • {new Date(item.slots.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                      <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase mt-1 inline-block">{item.slots.location_type}</span>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-slate-800">ครู{item.tutors.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{item.tutors.email}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-slate-800">น้อง{item.student_name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{item.student_email}</p>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                        <input 
                          type="number" 
                          placeholder="0.00"
                          className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-center outline-none focus:border-blue-500"
                          value={feeInputs[item.id] || ''}
                          onChange={(e) => setFeeInputs({...feeInputs, [item.id]: e.target.value})}
                        />
                        <button 
                          onClick={() => handleSaveFee(item)}
                          disabled={savingId === item.id}
                          className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-sm ${item.tutor_fee !== null ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                          {savingId === item.id ? <Loader2 size={14} className="animate-spin"/> : (item.tutor_fee !== null ? <Edit3 size={14}/> : <CheckCircle2 size={14}/>)}
                          {item.tutor_fee !== null ? 'แก้ไขยอด' : 'ยืนยันจ่าย'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold">ยังไม่มีคลาสที่รอการเพิ่มยอดเงินครับ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
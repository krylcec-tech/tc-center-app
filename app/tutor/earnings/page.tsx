'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Wallet, Clock, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, BadgeDollarSign, Mail, ArrowLeft, Landmark, X} from 'lucide-react';

export default function TutorEarnings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tutorData, setTutorData] = useState<any>(null);
  
  // State สำหรับการถอนเงิน
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [earningsHistory, setEarningsHistory] = useState<any[]>([]); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');

      // 1. ดึงข้อมูลติวเตอร์และยอดเงิน
      const { data: tutor } = await supabase.from('tutors').select('*').eq('user_id', user.id).single();
      setTutorData(tutor);

      if (tutor) {
        // 2. ดึงประวัติการถอนเงิน
        const { data: history } = await supabase
          .from('withdraw_requests')
          .select('*')
          .eq('user_id', tutor.user_id) 
          .order('created_at', { ascending: false });
        
        setWithdrawHistory(history || []);

        // 3. ดึงประวัติรายรับ (คลาสที่มี tutor_fee > 0)
        const { data: earnings } = await supabase
          .from('bookings')
          .select(`
            id, tutor_fee, student_id,
            slots ( start_time, location_type )
          `)
          .eq('tutor_id', tutor.id)
          .gt('tutor_fee', 0)
          .order('id', { ascending: false });

        if (earnings && earnings.length > 0) {
          const studentIds = [...new Set(earnings.map((e: any) => e.student_id))];
          
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', studentIds);
          const { data: wallets } = await supabase.from('student_wallets').select('user_id, student_name').in('user_id', studentIds);

          const formattedEarnings = earnings.map((e: any) => {
            const wallet = wallets?.find(w => w.user_id === e.student_id);
            const profile = profiles?.find(p => p.id === e.student_id);
            return {
              ...e,
              student_name: wallet?.student_name || profile?.full_name || 'ไม่ทราบชื่อ',
              student_email: profile?.email || 'ไม่มีข้อมูลอีเมล'
            };
          });
          setEarningsHistory(formattedEarnings);
        } else {
          setEarningsHistory([]);
        }
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 200) return alert('❌ ยอดถอนขั้นต่ำคือ 200 บาทครับ');
    if (amount > (tutorData?.balance || 0)) return alert('❌ ยอดเงินในกระเป๋าไม่เพียงพอครับ');
    
    // บังคับกรอกข้อมูลบัญชี
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      return alert('❌ กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วนครับ');
    }

    if (!confirm(`ยืนยันการขอถอนเงินจำนวน ${amount} บาท เข้าบัญชี ${bankName} ใช่ไหมครับ?`)) return;

    setProcessing(true);
    try {
      // ✨ ใช้โครงสร้างการ Insert แบบเดียวกับหน้า seller-hub เป๊ะๆ (ไม่มี bank_account)
      const { error: withdrawError } = await supabase.from('withdraw_requests').insert([{
        user_id: tutorData.user_id,
        amount: amount,
        bank_info: { 
          bank: bankName, 
          number: accountNumber, 
          name: accountName 
        },
        status: 'PENDING'
      }]);

      if (withdrawError) throw withdrawError;

      // หักเงินออกจากกระเป๋าติวเตอร์ (ทำทีหลังการสร้าง Order เผื่อ Error เงินจะได้ไม่หาย)
      const newBalance = tutorData.balance - amount;
      await supabase.from('tutors').update({ balance: newBalance }).eq('id', tutorData.id);

      alert('✅ ส่งคำขอถอนเงินเรียบร้อยแล้ว กรุณารอแอดมินตรวจสอบครับ');
      setWithdrawAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      fetchData(); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // รายชื่อธนาคารที่ให้เลือก
  const bankOptions = ['กสิกรไทย (KBANK)', 'ไทยพาณิชย์ (SCB)', 'กรุงไทย (KTB)', 'กรุงเทพ (BBL)', 'กรุงศรีอยุธยา (BAY)', 'ทหารไทยธนชาต (TTB)', 'ออมสิน (GSB)', 'พร้อมเพย์ (PromptPay)'];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-10 font-sans text-slate-800 pb-20">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        
        <header className="mb-6">
          <Link href="/tutor" className="text-slate-400 font-black text-[10px] uppercase mb-4 flex items-center gap-2 hover:text-blue-600 w-max transition-colors">
            <ArrowLeft size={14}/> Dashboard
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3 text-slate-900">
            รายได้ของฉัน <Wallet className="text-blue-500" size={36}/>
          </h1>
          <p className="text-slate-500 font-bold">ตรวจสอบยอดเงินเข้าจากการสอน และทำรายการถอนเงิน</p>
        </header>

        {/* ── กล่องหลัก: ยอดเงินและฟอร์มถอนเงิน ── */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] p-6 md:p-10 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="flex flex-col justify-center">
              <p className="text-blue-200 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                <BadgeDollarSign size={14}/> ยอดเงินคงเหลือที่ถอนได้
              </p>
              <h2 className="text-5xl md:text-7xl font-black tracking-tight">
                {tutorData?.balance?.toLocaleString() || 0} <span className="text-xl md:text-2xl font-bold opacity-80 uppercase ml-1">THB</span>
              </h2>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[1.5rem] space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Landmark size={18} className="text-orange-400"/>
                <p className="text-[12px] font-black text-blue-100 uppercase tracking-widest">ทำรายการถอนเงิน</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-blue-200 ml-1">จำนวนเงิน (ขั้นต่ำ 200)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-white border border-transparent rounded-xl px-4 py-2.5 text-slate-900 font-black outline-none focus:ring-2 focus:ring-blue-100"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-blue-200 ml-1">เลือกธนาคารปลายทาง</label>
                  <select 
                    className="w-full bg-white border border-transparent rounded-xl px-4 py-2.5 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  >
                    <option value="" disabled>-- เลือกธนาคาร --</option>
                    {bankOptions.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-blue-200 ml-1">เลขบัญชี / เบอร์</label>
                    <input 
                      type="text" 
                      placeholder="0123456789"
                      className="w-full bg-white border border-transparent rounded-xl px-4 py-2.5 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-blue-200 ml-1">ชื่อบัญชี</label>
                    <input 
                      type="text" 
                      placeholder="นาย ทดสอบ"
                      className="w-full bg-white border border-transparent rounded-xl px-4 py-2.5 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleWithdraw}
                  disabled={processing}
                  className="w-full mt-2 bg-orange-500 text-white px-6 py-3.5 rounded-xl font-black text-sm hover:bg-orange-400 transition-colors active:scale-95 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                >
                  {processing ? <Loader2 size={18} className="animate-spin"/> : 'ยืนยันการถอนเงิน'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ส่วนกล่องประวัติด้านล่าง ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col h-[500px]">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <ArrowDownToLine className="text-green-500" size={20}/> ประวัติรายรับ (ค่าสอน)
            </h3>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {earningsHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <BadgeDollarSign size={40} className="mb-3 opacity-20"/>
                  <p className="font-bold text-sm">ยังไม่มีประวัติรายรับจากการสอน</p>
                </div>
              ) : earningsHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl border border-slate-100 group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-[1rem] flex items-center justify-center shrink-0 shadow-sm">
                      <ArrowDownToLine size={18}/>
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm leading-tight mb-0.5">น้อง{item.student_name}</p>
                      <p className="text-[10px] font-bold text-blue-500 flex items-center gap-1 mb-2">
                        <Mail size={10} className="shrink-0"/> {item.student_email}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <span>{new Date(item.slots.start_time).toLocaleDateString('th-TH')}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className={`px-1.5 py-0.5 rounded ${item.slots.location_type === 'Online' ? 'text-blue-500 bg-blue-50' : 'text-emerald-500 bg-emerald-50'}`}>
                          {item.slots.location_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-600 text-base md:text-lg tracking-tight">+{item.tutor_fee?.toLocaleString()} ฿</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col h-[500px]">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <ArrowUpFromLine className="text-orange-500" size={20}/> ประวัติการถอนเงิน
            </h3>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {withdrawHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Clock size={40} className="mb-3 opacity-20"/>
                  <p className="font-bold text-sm">ยังไม่มีประวัติการถอนเงิน</p>
                </div>
              ) : withdrawHistory.map((item) => (
                <div key={item.id} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-slate-800 text-sm mb-0.5">ถอนเงิน</p>
                      <p className="text-[9px] font-bold text-slate-400">{new Date(item.created_at).toLocaleString('th-TH')}</p>
                    </div>
                    <p className="font-black text-slate-800 text-base">-{item.amount.toLocaleString()} ฿</p>
                  </div>
                  
                  {item.status === 'PENDING' ? (
                    <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 border border-orange-200/50">
                      <Loader2 size={12} className="animate-spin"/> กำลังรอแอดมินโอนเงิน
                    </span>
                  ) : item.status === 'REJECTED' ? (
                    <span className="bg-red-100 text-red-600 text-[10px] font-black px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 border border-red-200/50">
                      <X size={12}/> ถูกปฏิเสธ (เงินคืนแล้ว)
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-600 text-[10px] font-black px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 border border-green-200/50">
                      <CheckCircle2 size={12}/> โอนสำเร็จแล้ว
                    </span>
                  )}

                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Globe, MapPin, Navigation, 
  ChevronRight, GraduationCap, MessageCircle, Clock, CheckCircle2, User, Loader2 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BookingFlowPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Selection States
  const [locationType, setLocationType] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // ✨ States สำหรับ Wallet และ Note
  const [userBalance, setUserBalance] = useState<number>(0);
  const [studentNote, setStudentNote] = useState('');

  const tiers = [
    { 
      id: 'tier1', 
      title: 'ประถม - ม.ต้น', 
      desc: 'เนื้อหา ป.2-ป.5, สอบเข้า ม.1, เนื้อหา ม.1-ม.3',
      priceTag: 'ราคามาตรฐาน' 
    },
    { 
      id: 'tier2', 
      title: 'สอบเข้า ม.4', 
      desc: 'ติวเข้มเนื้อหาเพื่อเตรียมสอบเข้า ม.4 โรงเรียนดัง',
      priceTag: 'ราคาระดับกลาง' 
    },
    { 
      id: 'tier3', 
      title: 'ม.ปลาย / เข้ามหาวิทยาลัย', 
      desc: 'เนื้อหา ม.4-ม.6 และติวสอบเข้ามหาวิทยาลัย (TGAT/TPAT/A-Level)',
      priceTag: 'ราคาระดับสูง' 
    },
  ];

  useEffect(() => {
    if (step === 3) {
      fetchAvailableSlots();
      fetchUserBalance();
    }
  }, [step]);

  const fetchUserBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('student_wallets')
        .select('total_hours_balance')
        .eq('user_id', user.id)
        .maybeSingle();
      setUserBalance(data?.total_hours_balance || 0);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('slots')
        .select(`
          *,
          tutors!inner (
            id, name, image_url, tags, grade_levels
          )
        `)
        .eq('is_booked', false)
        .eq('location_type', locationType)
        .order('start_time', { ascending: true });

      if (error) throw error;

      if (data) {
        const currentTierTitle = tiers.find(t => t.id === gradeLevel)?.title;
        const filtered = data.filter((slot: any) => 
          slot.tutors.grade_levels?.includes(currentTierTitle)
        );
        setAvailableSlots(filtered);
      }
    } catch (err) {
      console.error("Fetch slots error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (slot: any) => {
    if (userBalance < 1) {
      alert("❌ ขออภัยครับ ชั่วโมงเรียนคงเหลือไม่เพียงพอ\nกรุณาเติมชั่วโมงเรียนก่อนจองคิวครับ");
      return router.push('/student/courses');
    }

    const confirmMsg = `ยืนยันการจองเรียนกับ ${slot.tutors.name}\nเวลา: ${new Date(slot.start_time).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}\n\n*ระบบจะหัก 1 ชั่วโมงเรียนจากยอดคงเหลือของคุณ*`;
    
    if (window.confirm(confirmMsg)) {
      setBookingLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("กรุณาล็อกอินก่อนจองครับ");

        // 1. หักชั่วโมงใน Wallet
        const { error: walletError } = await supabase
          .from('student_wallets')
          .update({ 
            total_hours_balance: userBalance - 1,
            updated_at: new Date().toISOString() 
          })
          .eq('user_id', user.id);
        
        if (walletError) throw walletError;

        // 2. บันทึก Transaction
        await supabase.from('wallet_transactions').insert([{
          user_id: user.id,
          amount: -1,
          type: 'booking',
          description: `จองเรียน: ${slot.tutors.name} (${locationType})`
        }]);

        // 3. อัปเดต Slot
        await supabase.from('slots').update({ is_booked: true }).eq('id', slot.id);

        // 4. บันทึกข้อมูลการจอง พร้อม Note ✨
        await supabase.from('bookings').insert([{
          slot_id: slot.id,
          student_id: user.id,
          tutor_id: slot.tutor_id,
          status: 'confirmed',
          student_note: studentNote // เก็บข้อความที่นักเรียนพิมพ์
        }]);

        alert("🎉 จองคิวสำเร็จ! ข้อมูลและข้อความของคุณถูกส่งถึงติวเตอร์แล้ว");
        router.push('/student');
      } catch (err: any) {
        alert("เกิดข้อผิดพลาด: " + err.message);
      } finally {
        setBookingLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header & Progress */}
        <div className="mb-10">
          <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-4 group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> {step === 1 ? 'กลับหน้าหลัก' : 'ย้อนกลับ'}
          </button>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">จองคิวเรียน</h1>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-gray-800 mb-6">1. เลือกรูปแบบการเรียน</h2>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => { setLocationType('Online'); setStep(2); }} className="bg-white p-8 rounded-[2.5rem] border-2 border-transparent hover:border-blue-500 shadow-sm flex items-center justify-between group transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all"><Globe size={32} /></div>
                  <div className="text-left text-gray-900 group-hover:text-blue-600 transition-colors">
                    <h3 className="text-xl font-black">Online</h3>
                    <p className="text-gray-500 font-bold text-sm">เรียนผ่าน Zoom / Google Meet</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300" />
              </button>
              <button onClick={() => { setLocationType('Onsite'); setStep(2); }} className="bg-white p-8 rounded-[2.5rem] border-2 border-transparent hover:border-blue-500 shadow-sm flex items-center justify-between group transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all"><MapPin size={32} /></div>
                  <div className="text-left text-gray-900 group-hover:text-blue-600 transition-colors">
                    <h3 className="text-xl font-black">Onsite (ที่สถาบัน)</h3>
                    <p className="text-gray-500 font-bold text-sm">เรียนที่ศูนย์ TC Center</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300" />
              </button>
              <a href="https://lin.ee/ZSDR4B3" target="_blank" className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200 hover:border-green-500 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 group-hover:bg-[#06C755] group-hover:text-white transition-all"><Navigation size={32} /></div>
                  <div className="text-left text-gray-900">
                    <h3 className="text-xl font-black">นอกสถานที่</h3>
                    <p className="text-gray-500 font-bold text-sm">ติดต่อผ่าน LINE (จัดการหลังบ้าน)</p>
                  </div>
                </div>
                <MessageCircle className="text-[#06C755]" />
              </a>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-black text-gray-800 mb-2">2. เลือกระดับชั้น</h2>
            <div className="flex justify-between items-center bg-gray-100 p-4 rounded-2xl">
                <span className="text-sm font-bold text-gray-500 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> รูปแบบ: {locationType}</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {tiers.map((tier) => (
                <button key={tier.id} onClick={() => { setGradeLevel(tier.id); setStep(3); }} className="bg-white p-6 rounded-[2rem] border-2 border-transparent hover:border-blue-500 shadow-sm flex flex-col gap-2 text-left transition-all group">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{tier.title}</h3>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">{tier.priceTag}</span>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">{tier.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-800">3. เลือกติวเตอร์และเวลา</h2>
                <div className="flex gap-4 mt-2">
                   <span className="text-[10px] font-black bg-gray-200 text-gray-600 px-3 py-1 rounded-full uppercase">{locationType}</span>
                   <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase">{tiers.find(t => t.id === gradeLevel)?.title}</span>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-gray-400 uppercase mb-1">ยอดคงเหลือ</p>
                 <p className="text-xl font-black text-blue-600">{userBalance} ชม.</p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
                <Clock className="mx-auto text-gray-200 mb-6" size={60} />
                <p className="text-gray-400 font-black">ขออภัยครับ ยังไม่มีคิวว่างที่ตรงเงื่อนไข</p>
                <button onClick={() => setStep(1)} className="mt-4 text-blue-600 font-bold text-sm hover:underline">เปลี่ยนเงื่อนไขการค้นหา</button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ✨ ช่องกรอก Note ก่อนเลือกคิว */}
                <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 shadow-sm">
                  <label className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MessageCircle size={16} /> สิ่งที่อยากให้เน้นเป็นพิเศษ (ถ้ามี)
                  </label>
                  <textarea 
                    placeholder="เช่น อยากเน้นเรื่องเลขยกกำลัง, มีการบ้านบทที่ 5 อยากให้ช่วยดูให้หน่อยครับ..."
                    className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none text-sm font-medium transition-all resize-none h-24 shadow-inner"
                    value={studentNote}
                    onChange={(e) => setStudentNote(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {availableSlots.map((slot) => (
                    <div key={slot.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-5 w-full">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                          {slot.tutors.image_url ? (
                            <img src={slot.tutors.image_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={24}/></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{slot.tutors.name}</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {slot.tutors.tags?.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-md uppercase">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right border-l pl-5 border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">วันที่เรียน</p>
                          <p className="font-bold text-gray-800 text-xs">
                            {new Date(slot.start_time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="font-black text-blue-600 text-xl">
                            {new Date(slot.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} น.
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleConfirmBooking(slot)}
                        disabled={bookingLoading}
                        className="w-full md:w-auto bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-gray-100 disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        {bookingLoading ? <Loader2 className="animate-spin" size={18} /> : 'จองคิวนี้'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
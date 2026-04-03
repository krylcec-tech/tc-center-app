'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Globe, MapPin, Navigation, ChevronRight, MessageCircle, 
  Clock, CheckCircle2, User, Loader2, PlayCircle, Calendar, Search, Filter, BookOpen, Sparkles, ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BookingFlowPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Selection States
  const [locationType, setLocationType] = useState(''); // Online / Onsite
  const [gradeLevel, setGradeLevel] = useState('');    // tier1 / tier2 / tier3
  const [tutors, setTutors] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [tutorSlots, setTutorSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(''); 
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [activeSubject, setActiveSubject] = useState('ทั้งหมด'); 
  
  const [userBalance, setUserBalance] = useState<number>(0);
  const [allWalletData, setAllWalletData] = useState<any>(null); // ✨ เก็บข้อมูล Wallet ทั้งหมด 6 ช่อง
  const [studentNote, setStudentNote] = useState('');

  const subjects = ['ทั้งหมด', 'คณิตศาสตร์', 'ภาษาอังกฤษ', 'วิทยาศาสตร์', 'ฟิสิกส์', 'เคมี', 'ชีววิทยา', 'ภาษาไทย' , 'คอร์สพิเศษ'];

  const tiers = [
    { id: 'tier1', title: 'ประถม - ม.ต้น', desc: 'เนื้อหา ป.2-ป.5, สอบเข้า ม.1, ม.1-ม.3', priceTag: 'ราคามาตรฐาน' },
    { id: 'tier2', title: 'สอบเข้า ม.4', desc: 'ติวเข้มเพื่อเตรียมสอบเข้า ม.4 โรงเรียนดัง', priceTag: 'ราคาระดับกลาง' },
    { id: 'tier3', title: 'ม.ปลาย / เข้ามหาวิทยาลัย', desc: 'เนื้อหา ม.4-ม.6 และ TGAT/TPAT/A-Level', priceTag: 'ราคาระดับสูง' },
  ];

  // ✨ ฟังก์ชันหาชื่อ Column ใน Database ตามเงื่อนไขที่เลือก
  const getWalletColumnName = () => {
    if (!gradeLevel || !locationType) return '';
    const suffix = locationType === 'Online' ? 'online_balance' : 'onsite_balance';
    return `${gradeLevel}_${suffix}`; // จะได้ tier1_online_balance เป็นต้น
  };

  useEffect(() => {
    if (step === 3) fetchTutors();
    if (step === 4) fetchTutorSlots();
    if (gradeLevel && locationType) fetchUserBalance();
  }, [step, gradeLevel, locationType]);

  const fetchUserBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('student_wallets').select('*').eq('user_id', user.id).maybeSingle();
      setAllWalletData(data);
      
      const columnName = getWalletColumnName();
      setUserBalance(data?.[columnName] || 0); // ดึงยอดจากกระเป๋าที่ตรงเงื่อนไข
    }
  };

  const fetchTutors = async () => {
    setLoading(true);
    const currentTierTitle = tiers.find(t => t.id === gradeLevel)?.title;
    const { data } = await supabase.from('tutors').select('*').contains('grade_levels', [currentTierTitle]);
    setTutors(data || []);
    setLoading(false);
  };

  const fetchTutorSlots = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('slots')
      .select('*')
      .eq('tutor_id', selectedTutor.id)
      .eq('is_booked', false)
      .eq('location_type', locationType)
      .order('start_time', { ascending: true });
    
    setTutorSlots(data || []);
    if (data && data.length > 0) {
      const firstSlotDate = new Date(data[0].start_time);
      setSelectedDate(firstSlotDate.toDateString());
      setSelectedMonth(firstSlotDate.getMonth());
    }
    setLoading(false);
  };

  const filteredTutors = tutors.filter(t => 
    activeSubject === 'ทั้งหมด' || t.tags?.includes(activeSubject)
  );

  const availableDates = Array.from(new Set(
    tutorSlots
      .filter(s => new Date(s.start_time).getMonth() === selectedMonth)
      .map(s => new Date(s.start_time).toDateString())
  ));

  const availableMonths = Array.from(new Set(tutorSlots.map(s => new Date(s.start_time).getMonth()))).sort((a, b) => a - b);

  const displaySlots = tutorSlots.filter(slot => 
    new Date(slot.start_time).toDateString() === selectedDate
  );

  const handleConfirmBooking = async (slot: any) => {
    const columnName = getWalletColumnName();
    if (userBalance < 1) {
        const tierTitle = tiers.find(t => t.id === gradeLevel)?.title;
        return alert(`❌ ชั่วโมงเรียน [${tierTitle}] แบบ [${locationType}] ของคุณไม่เพียงพอครับ`);
    }

    if (window.confirm(`ยืนยันจองเรียน?\nคอร์ส: ${tiers.find(t => t.id === gradeLevel)?.title}\nรูปแบบ: ${locationType}\n(ระบบจะหัก 1 ชม. จากกระเป๋าที่ตรงกัน)`)) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // ✨ อัปเดตหักชั่วโมงตาม Column ที่ถูกต้อง
        await supabase.from('student_wallets')
          .update({ [columnName]: userBalance - 1 })
          .eq('user_id', user?.id);

        await supabase.from('slots').update({ is_booked: true }).eq('id', slot.id);
        
        await supabase.from('bookings').insert([{
          slot_id: slot.id, 
          student_id: user?.id, 
          tutor_id: selectedTutor.id,
          status: 'confirmed', 
          student_note: `[${locationType}] ${studentNote}`, 
          is_completed: false
        }]);

        alert("🎉 จองสำเร็จ!");
        router.push('/student');
      } catch (err: any) { alert(err.message); }
    }
  };

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Step Indicator */}
        <div className="mb-10">
          <button onClick={() => step > 1 ? setStep(step === 4 ? 3 : step - 1) : router.back()} className="text-blue-600 font-black text-sm uppercase mb-4 flex items-center gap-2 group transition-all">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> ย้อนกลับ
          </button>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* STEP 1: Location Type */}
        {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button onClick={() => { setLocationType('Online'); setStep(2); }} className="bg-white p-10 rounded-[3rem] border-2 border-transparent hover:border-blue-500 shadow-sm transition-all group text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all"><Globe size={40} /></div>
                    <h3 className="text-2xl font-black mb-2 text-gray-900">Online</h3>
                    <p className="text-gray-400 font-bold text-sm">เรียนผ่าน Zoom / Meet</p>
                </button>

                <button onClick={() => { setLocationType('Onsite'); setStep(2); }} className="bg-white p-10 rounded-[3rem] border-2 border-transparent hover:border-purple-500 shadow-sm transition-all group text-center">
                    <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 mx-auto mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all"><MapPin size={40} /></div>
                    <h3 className="text-2xl font-black mb-2 text-gray-900">Onsite (ศูนย์)</h3>
                    <p className="text-gray-400 font-bold text-sm">เรียนที่ TC Center</p>
                </button>

                <a href="https://lin.ee/ZSDR4B3" target="_blank" className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-gray-200 hover:border-green-500 shadow-sm transition-all group text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 mx-auto mb-6 group-hover:bg-green-600 group-hover:text-white transition-all"><Navigation size={40} /></div>
                    <h3 className="text-2xl font-black mb-2 text-green-600 text-gray-900">นอกสถานที่</h3>
                    <p className="text-gray-400 font-bold text-sm">ติดต่อทาง Line (คิดเงินแยก)</p>
                </a>
            </div>
        )}

        {/* STEP 2: Grade Level */}
        {step === 2 && (
             <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
             <h2 className="text-2xl font-black mb-4 text-gray-900 text-center">เลือกระดับชั้นเรียน</h2>
             {tiers.map(tier => (
               <button key={tier.id} onClick={() => { setGradeLevel(tier.id); setStep(3); }} className="bg-white p-6 rounded-[2rem] border-2 border-transparent hover:border-blue-500 shadow-sm flex flex-col gap-2 transition-all text-left">
                  <div className="flex justify-between"><h3 className="text-xl font-black text-gray-900">{tier.title}</h3><span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">{tier.priceTag}</span></div>
                  <p className="text-gray-400 text-sm font-bold">{tier.desc}</p>
               </button>
             ))}
          </div>
        )}

        {/* STEP 3: Catalog with Subject Filter */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h2 className="text-3xl font-black text-gray-900">ค้นหาติวเตอร์ 👩‍🏫</h2>
              <div className="flex gap-2 overflow-x-auto pb-4 w-full md:w-auto no-scrollbar">
                {subjects.map(sub => (
                  <button key={sub} onClick={() => setActiveSubject(sub)}
                    className={`px-6 py-3 rounded-full text-xs font-black transition-all whitespace-nowrap border-2 flex items-center gap-2
                      ${activeSubject === sub ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : sub === 'คอร์สพิเศษ' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-orange-400 text-orange-700' : 'bg-white border-gray-100 text-gray-400'}`}>
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTutors.map(tutor => (
                  <div key={tutor.id} className="bg-white rounded-[3.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                    <div className="h-64 bg-gray-100 relative">
                      <img src={tutor.image_url || '/default-avatar.png'} className="w-full h-full object-cover" />
                      <div className="absolute bottom-4 left-4 flex gap-1 flex-wrap">
                        {tutor.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-white/90 text-blue-600 border border-blue-50">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-2xl font-black mb-1 text-gray-900">{tutor.name}</h3>
                      <p className="text-gray-400 text-xs font-bold italic line-clamp-2">"{tutor.bio || 'ติวเตอร์คุณภาพจาก TC Center'}"</p>
                      <button onClick={() => { setSelectedTutor(tutor); setStep(4); }}
                        className="mt-auto w-full bg-gray-900 text-white py-4 rounded-[1.5rem] font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                        ดูตารางสอน <ChevronRight size={18}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Detailed Calendar with Month Selector & Tier Balance */}
        {step === 4 && selectedTutor && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
            {/* Sidebar Profile */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                    <img src={selectedTutor.image_url} className="w-full h-full rounded-[2.5rem] object-cover ring-4 ring-blue-50" />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white w-8 h-8 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={14}/></div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">{selectedTutor.name}</h3>
                <div className="flex flex-wrap gap-1 justify-center mt-3">
                    {selectedTutor.tags?.map((tag: string) => (
                        <span key={tag} className="text-[8px] font-black bg-gray-50 text-gray-400 px-2 py-1 rounded-md uppercase">{tag}</span>
                    ))}
                </div>
              </div>

              {/* ✨ แสดงยอดชั่วโมงเฉพาะคอร์สที่กำลังจะจอง */}
              <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white shadow-xl">
                 <p className="text-[10px] font-black uppercase opacity-70 mb-1">สิทธิ์คงเหลือเฉพาะคอร์สนี้</p>
                 <p className="text-3xl font-black">{userBalance} <span className="text-sm font-bold opacity-60 uppercase">ชั่วโมง</span></p>
                 <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">
                       {tiers.find(t => t.id === gradeLevel)?.title} ({locationType})
                    </p>
                 </div>
              </div>

              {selectedTutor.video_url && (
                <div className="bg-black rounded-[3rem] overflow-hidden aspect-video shadow-2xl border-4 border-white">
                  <iframe src={selectedTutor.video_url.replace('view', 'preview')} className="w-full h-full" allowFullScreen></iframe>
                </div>
              )}
            </div>

            {/* Smart Calendar */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
                    <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Calendar size={20} /></div>
                        เลือกวันที่ต้องการเรียน
                    </h2>
                    
                    {/* ✨ แถบเลือกเดือน */}
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                        {availableMonths.map(m => (
                            <button key={m} onClick={() => { setSelectedMonth(m); setSelectedDate(''); }}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedMonth === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                                {monthNames[m]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar mb-8">
                  {availableDates.map(date => (
                    <button key={date} onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center min-w-[85px] py-5 px-4 rounded-[2rem] transition-all border-2 
                        ${selectedDate === date ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400'}`}>
                      <span className="text-[10px] font-black uppercase mb-1 opacity-70">{new Date(date).toLocaleDateString('th-TH', { weekday: 'short' })}</span>
                      <span className="text-2xl font-black">{new Date(date).getDate()}</span>
                      <span className="text-[10px] font-bold opacity-70">{monthNames[new Date(date).getMonth()]}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 text-gray-900">
                  {selectedDate && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center md:text-left">คิวที่ว่างในวันที่ {new Date(selectedDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displaySlots.map(slot => (
                      <button key={slot.id} onClick={() => handleConfirmBooking(slot)}
                        className="flex items-center justify-between p-6 bg-gray-50 rounded-[1.5rem] border-2 border-transparent hover:border-blue-500 hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white"><Clock size={18} /></div>
                          <span className="font-black text-lg">{new Date(slot.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                        </div>
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100"><ChevronRight size={16} /></div>
                      </button>
                    ))}
                    {!selectedDate && availableDates.length > 0 && <div className="col-span-full text-center py-10 bg-blue-50 rounded-[2rem] text-blue-600 font-bold border-2 border-dashed">กรุณาเลือกวันที่ด้านบน 👆</div>}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] text-white shadow-xl shadow-blue-100">
                <label className="text-xs font-black text-blue-100 uppercase mb-4 block flex items-center gap-2"><MessageCircle size={18}/> บอกรายละเอียดที่อยากให้เน้น</label>
                <textarea value={studentNote} onChange={(e) => setStudentNote(e.target.value)} 
                  placeholder="เช่น อยากให้ครูช่วยสรุปเรื่องเลขยกกำลัง..." 
                  className="w-full p-6 bg-white/10 backdrop-blur-md rounded-[2rem] border-2 border-white/20 outline-none focus:bg-white focus:text-gray-900 transition-all font-bold h-32"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
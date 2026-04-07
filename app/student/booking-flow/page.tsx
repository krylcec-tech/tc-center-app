'use client'
import { useState, useEffect, Suspense } from 'react'; 
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Globe, MapPin, Navigation, ChevronRight, MessageCircle, 
  Clock, CheckCircle2, User, Loader2, PlayCircle, Calendar, Search, Filter, BookOpen, Sparkles, ChevronLeft,
  Info, FileText, Video, X, MousePointer2, RotateCcw
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation'; 

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [locationType, setLocationType] = useState(''); 
  const [gradeLevel, setGradeLevel] = useState('');    
  const [tutors, setTutors] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [viewingTutor, setViewingTutor] = useState<any>(null);

  const [tutorSlots, setTutorSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(''); 
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [activeSubject, setActiveSubject] = useState('ทั้งหมด'); 
  
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  
  const [userBalance, setUserBalance] = useState<number>(0);
  const [allWalletData, setAllWalletData] = useState<any>(null); 
  const [studentNote, setStudentNote] = useState('');

  const subjects = ['ทั้งหมด', 'คณิตศาสตร์', 'ภาษาอังกฤษ', 'วิทยาศาสตร์', 'ฟิสิกส์', 'เคมี', 'ชีววิทยา', 'ภาษาไทย' , 'คอร์สพิเศษ'];

  const tiers = [
    { id: 'tier1', title: 'ประถม - ม.ต้น', desc: 'เนื้อหา ป.2-ป.5, สอบเข้า ม.1, ม.1-ม.3', priceTag: 'ราคามาตรฐาน' },
    { id: 'tier2', title: 'สอบเข้า ม.4', desc: 'ติวเข้มเพื่อเตรียมสอบเข้า ม.4 โรงเรียนดัง', priceTag: 'ราคาระดับกลาง' },
    { id: 'tier3', title: 'ม.ปลาย / เข้ามหาวิทยาลัย', desc: 'เนื้อหา ม.4-ม.6 และ TGAT/TPAT/A-Level', priceTag: 'ราคาระดับสูง' },
  ];

  useEffect(() => {
    const urlTier = searchParams.get('tier');
    const urlType = searchParams.get('type');
    if (urlTier && urlType) {
      setGradeLevel(urlTier);
      setLocationType(urlType);
      setStep(3); 
    }
  }, [searchParams]);

  const getWalletColumnName = () => {
    if (!gradeLevel || !locationType) return '';
    const suffix = locationType === 'Online' ? 'online_balance' : 'onsite_balance';
    return `${gradeLevel}_${suffix}`; 
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
      setUserBalance(data?.[columnName] || 0); 
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

  const toggleSlotSelection = (slotId: string) => {
    setSelectedSlotIds(prev => 
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const handleBulkBooking = async () => {
    if (selectedSlotIds.length === 0) return alert("กรุณาเลือกเวลาเรียนอย่างน้อย 1 ช่วงเวลาครับ");
    
    const requiredHours = selectedSlotIds.length;
    const columnName = getWalletColumnName();
    
    if (userBalance < requiredHours) {
        return alert(`❌ ชั่วโมงเรียนคงเหลือไม่พอครับ (มี ${userBalance} ชม. แต่ต้องการจอง ${requiredHours} ชม.)`);
    }

    if (window.confirm(`ยืนยันจองเรียนทั้งหมด ${requiredHours} ชั่วโมง?\n(ระบบจะหักชั่วโมงจากกระเป๋าของคุณทันที)`)) {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('student_wallets').update({ [columnName]: userBalance - requiredHours }).eq('user_id', user?.id);
        await supabase.from('slots').update({ is_booked: true }).in('id', selectedSlotIds);
        const bookingData = selectedSlotIds.map(slotId => ({
          slot_id: slotId, student_id: user?.id, tutor_id: selectedTutor.id,
          status: 'confirmed', student_note: `[${locationType}] ${studentNote}`, is_completed: false
        }));
        await supabase.from('bookings').insert(bookingData);
        alert(`🎉 จองสำเร็จทั้งหมด ${requiredHours} ช่วงเวลาแล้วครับ!`);
        router.push('/student');
      } catch (err: any) { alert(err.message); } finally { setLoading(false); }
    }
  };

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    return url;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-gray-900 pb-32">
      
      {/* Modal Profile */}
      {viewingTutor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingTutor(null)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingTutor(null)} className="absolute top-4 right-4 bg-gray-100 text-gray-500 p-2 rounded-full hover:bg-gray-200 transition-colors z-10"><X size={20}/></button>
            <div className="flex flex-col md:flex-row gap-6 mb-6">
               <img src={viewingTutor.image_url || '/default-avatar.png'} alt={viewingTutor.name} className="w-32 h-32 rounded-3xl object-cover shadow-sm border border-gray-100 mx-auto md:mx-0" />
               <div className="text-center md:text-left flex-1">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">{viewingTutor.name}</h2>
                  <div className="flex flex-wrap gap-1.5 justify-center md:justify-start mb-4">
                     {viewingTutor.tags?.map((tag: string) => (
                       <span key={tag} className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-100">#{tag}</span>
                     ))}
                  </div>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed whitespace-pre-wrap">{viewingTutor.bio || 'ติวเตอร์คุณภาพจาก TC Center ครับ'}</p>
               </div>
            </div>
            <div className="space-y-4 mb-8">
               {viewingTutor.video_url && (
                 <div className="bg-gray-900 rounded-[2rem] overflow-hidden aspect-video shadow-lg relative group">
                   <iframe src={getEmbedUrl(viewingTutor.video_url)} className="w-full h-full" allowFullScreen></iframe>
                 </div>
               )}
               {viewingTutor.resume_url && (
                 <a href={viewingTutor.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors group border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2.5 rounded-xl text-purple-600 shadow-sm group-hover:scale-110 transition-transform"><FileText size={24}/></div>
                      <span className="font-black text-purple-900 text-sm">ดู Resume / ผลงาน (PDF)</span>
                    </div>
                    <ChevronRight className="text-purple-400 group-hover:text-purple-600" />
                 </a>
               )}
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100">
               <button onClick={() => { setSelectedTutor(viewingTutor); setViewingTutor(null); setStep(4); }} 
                 className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-200">
                 จองเวลาเรียน <Calendar size={18} />
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <button onClick={() => { if (searchParams.get('tier') && step === 3) return router.back(); step > 1 ? setStep(step === 4 ? 3 : step - 1) : router.back(); }} 
            className="text-blue-600 font-black text-sm uppercase mb-4 flex items-center gap-2 group transition-all w-max">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> ย้อนกลับ
          </button>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {step === 1 && !searchParams.get('type') && (
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

        {step === 2 && !searchParams.get('tier') && (
             <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
             <h2 className="text-2xl font-black mb-4 text-gray-900 text-center">เลือกระดับชั้นเรียน</h2>
             {tiers.map(tier => (
               <button key={tier.id} onClick={() => { setGradeLevel(tier.id); setStep(3); }} className="bg-white p-6 rounded-[2rem] border-2 border-transparent hover:border-blue-500 shadow-sm flex flex-col gap-2 transition-all text-left">
                  <div className="flex justify-between items-center"><h3 className="text-xl font-black text-gray-900">{tier.title}</h3><span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">{tier.priceTag}</span></div>
                  <p className="text-gray-400 text-sm font-bold">{tier.desc}</p>
               </button>
             ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 shrink-0">ค้นหาติวเตอร์ 👩‍🏫</h2>
              <style dangerouslySetInnerHTML={{__html: `
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
              `}} />
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto items-center hide-scroll py-2">
                {subjects.map(sub => (
                  <button key={sub} onClick={() => setActiveSubject(sub)}
                    className={`shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all border-2 
                      ${activeSubject === sub ? 'bg-blue-600 border-blue-600 text-white shadow-md' : sub === 'คอร์สพิเศษ' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <Loader2 className="animate-spin mx-auto text-blue-600" size={48} /> : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {filteredTutors.map(tutor => (
                  <div key={tutor.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                    <div className="h-32 md:h-48 bg-gray-50 relative cursor-pointer overflow-hidden" onClick={() => setViewingTutor(tutor)}>
                      <img src={tutor.image_url || '/default-avatar.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                        {tutor.video_url && <div className="bg-white/90 backdrop-blur text-red-500 p-1 md:p-1.5 rounded-md shadow-sm" title="มีวิดีโอแนะนำตัว"><PlayCircle size={14}/></div>}
                        {tutor.resume_url && <div className="bg-white/90 backdrop-blur text-purple-600 p-1 md:p-1.5 rounded-md shadow-sm" title="มีเรซูเม่"><FileText size={14}/></div>}
                      </div>
                      <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap pr-4">
                        {tutor.tags?.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="backdrop-blur-md px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase bg-white/90 text-blue-600 border border-blue-50 shadow-sm line-clamp-1">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 md:p-5 flex-1 flex flex-col">
                      <h3 className="text-sm md:text-lg font-black mb-1 text-gray-900 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setViewingTutor(tutor)}>{tutor.name}</h3>
                      <p className="text-gray-400 text-[9px] md:text-xs font-medium line-clamp-2 leading-relaxed mb-3 md:mb-4">{tutor.bio || 'ติวเตอร์คุณภาพจาก TC Center'}</p>
                      <div className="mt-auto flex flex-col gap-1.5 md:gap-2">
                        <button onClick={() => setViewingTutor(tutor)}
                          className="w-full bg-gray-50 text-gray-500 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs hover:bg-gray-100 hover:text-gray-800 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <Info size={14} /> โปรไฟล์
                        </button>
                        <button onClick={() => { setSelectedTutor(tutor); setStep(4); }}
                          className="w-full bg-gray-900 text-white py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 whitespace-nowrap">
                          <Calendar size={14} /> จองเรียน
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && selectedTutor && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                    <img src={selectedTutor.image_url || '/default-avatar.png'} className="w-full h-full rounded-[2.5rem] object-cover ring-4 ring-blue-50" />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white w-8 h-8 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={14}/></div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{selectedTutor.name}</h3>
                <button onClick={() => setViewingTutor(selectedTutor)} className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto mb-4">
                  <Info size={14}/> ดูประวัติและผลงานเต็มๆ
                </button>
                <div className="flex flex-wrap gap-1 justify-center">
                    {selectedTutor.tags?.map((tag: string) => (
                        <span key={tag} className="text-[10px] font-black bg-gray-50 text-gray-400 px-2 py-1 rounded-md uppercase">{tag}</span>
                    ))}
                </div>
              </div>

              <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white shadow-xl">
                 <p className="text-[10px] font-black uppercase opacity-70 mb-1">สิทธิ์คงเหลือในกระเป๋า</p>
                 <p className="text-3xl font-black">{userBalance} <span className="text-sm font-bold opacity-60 uppercase">ชั่วโมง</span></p>
                 <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mb-2">
                       {tiers.find(t => t.id === gradeLevel)?.title} ({locationType})
                    </p>
                    {selectedSlotIds.length > 0 && (
                      <div className="bg-white/20 p-3 rounded-xl flex justify-between items-center animate-pulse">
                        <span className="text-xs font-black">เลือกไว้แล้ว:</span>
                        <span className="text-xl font-black">{selectedSlotIds.length} ชม.</span>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm relative">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
                    <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><MousePointer2 size={20} /></div>
                        เลือกเวลาเรียน
                    </h2>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar w-full md:w-auto">
                        {availableMonths.map(m => (
                            <button key={m} onClick={() => { setSelectedMonth(m); setSelectedDate(''); }}
                                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedMonth === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                                {monthNames[m]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar mb-8">
                  {availableDates.map(date => (
                    <button key={date} onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center min-w-[85px] py-5 px-4 rounded-[2rem] transition-all border-2 
                        ${selectedDate === date ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'}`}>
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
                      <button 
                        key={slot.id} 
                        onClick={() => toggleSlotSelection(slot.id)}
                        className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all group active:scale-95
                          ${selectedSlotIds.includes(slot.id) 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                            : 'bg-gray-50 border-transparent hover:border-blue-500 hover:bg-white hover:shadow-md text-gray-900'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors 
                            ${selectedSlotIds.includes(slot.id) ? 'bg-white text-blue-600' : 'bg-white text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                            <Clock size={18} />
                          </div>
                          <span className="font-black text-lg">{new Date(slot.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                        </div>
                        {selectedSlotIds.includes(slot.id) ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />}
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

      {/* Floating Action Bar */}
      {step === 4 && selectedSlotIds.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-xl z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-gray-900 text-white p-4 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center justify-between gap-4">
             <div className="flex flex-col pl-4">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">เลือกไว้</p>
               <p className="text-2xl font-black leading-none">{selectedSlotIds.length} <span className="text-xs font-bold opacity-60">ชม.</span></p>
               {/* ✨ ปุ่มยกเลิกทั้งหมด */}
               <button 
                 onClick={() => setSelectedSlotIds([])}
                 className="text-[10px] font-black text-red-400 mt-2 hover:text-red-300 flex items-center gap-1 transition-colors"
               >
                 <RotateCcw size={10}/> ยกเลิกทั้งหมด
               </button>
             </div>
             <button 
               onClick={handleBulkBooking}
               disabled={loading}
               className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[180px]"
             >
               {loading ? <Loader2 className="animate-spin" /> : <>ยืนยันจอง <ChevronRight size={20}/></>}
             </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function BookingFlowPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>}>
      <BookingContent />
    </Suspense>
  );
}
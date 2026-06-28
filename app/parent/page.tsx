'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  LogOut, Clock, BookOpen, User, Star, 
  Calendar as CalendarIcon, CheckCircle2, XCircle, RefreshCw, 
  AlertCircle, MessageCircle, MapPin, Loader2,
  CalendarDays, LayoutList, CalendarPlus, ChevronLeft, ChevronRight, X,
  Globe, Navigation, PlayCircle, Info, FileText, MousePointer2, RotateCcw,
  ArrowLeft // ✨ เพิ่ม ArrowLeft ตรงนี้ครับ
} from 'lucide-react';
import Link from 'next/link';

export default function ParentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [parentProfile, setParentProfile] = useState<any>(null);
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  // ✨ States สำหรับ UI ตารางเรียน (Dashboard)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [listTab, setListTab] = useState<'upcoming' | 'history'>('upcoming');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ✨ States สำหรับระบบจองคิวเรียน (4 ขั้นตอน)
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [step, setStep] = useState(1);
  const [locationType, setLocationType] = useState(''); 
  const [gradeLevel, setGradeLevel] = useState('');    
  const [tutors, setTutors] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [viewingTutor, setViewingTutor] = useState<any>(null);
  const [tutorSlots, setTutorSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(''); 
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(new Date().getMonth());
  const [activeSubject, setActiveSubject] = useState('ทั้งหมด'); 
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [studentNote, setStudentNote] = useState('');

  const subjects = ['ทั้งหมด', 'คณิตศาสตร์', 'ภาษาอังกฤษ', 'วิทยาศาสตร์', 'ฟิสิกส์', 'เคมี', 'ชีววิทยา', 'ภาษาไทย' , 'คอร์สพิเศษ'];
  const tiers = [
    { id: 'tier1', title: 'ประถม - ม.ต้น', desc: 'เนื้อหา ป.2-ป.5, สอบเข้า ม.1, ม.1-ม.3', priceTag: 'ราคามาตรฐาน' },
    { id: 'tier2', title: 'สอบเข้า ม.4', desc: 'ติวเข้มเพื่อเตรียมสอบเข้า ม.4 โรงเรียนดัง', priceTag: 'ราคาระดับกลาง' },
    { id: 'tier3', title: 'ม.ปลาย / เข้ามหาวิทยาลัย', desc: 'เนื้อหา ม.4-ม.6 และ TGAT/TPAT/A-Level', priceTag: 'ราคาระดับสูง' },
  ];
  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  // --- Fetch ข้อมูลหลักของ Dashboard ---
  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setParentProfile(profile);

      const { data: links } = await supabase.from('parent_student_links').select('student_id').eq('parent_id', user.id);

      if (links && links.length > 0) {
        const studentsData = [];
        for (const link of links) {
          const { data: wallet } = await supabase.from('student_wallets').select('*').eq('user_id', link.student_id).single();
          const { data: bookings } = await supabase.from('bookings').select(`
              id, status, is_student_accepted, subject_name, hours_deducted,
              slots!inner ( start_time, location_type ),
              tutors!inner ( name )
            `).eq('student_id', link.student_id).order('id', { ascending: false });

          if (wallet) studentsData.push({ id: link.student_id, wallet, bookings: bookings || [] });
        }
        setLinkedStudents(studentsData);
        if (studentsData.length > 0) setActiveStudentId(studentsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeStudent = linkedStudents.find(s => s.id === activeStudentId);

  // --- Logic การดึงข้อมูลสำหรับการจองคิว (Booking Flow) ---
  useEffect(() => {
    if (isBookingMode && step === 3) fetchTutors();
    if (isBookingMode && step === 4) fetchTutorSlots();
  }, [step, isBookingMode, gradeLevel, locationType]);

  const getWalletColumnName = () => {
    if (!gradeLevel || !locationType) return '';
    const suffix = locationType === 'Online' ? 'online_balance' : 'onsite_balance';
    return `${gradeLevel}_${suffix}`; 
  };

  const fetchTutors = async () => {
    setIsProcessing(true);
    const currentTierTitle = tiers.find(t => t.id === gradeLevel)?.title;
    
    const { data: tutorsData } = await supabase.from('tutors').select('*')
      .contains('grade_levels', [currentTierTitle]).eq('is_active', true); 
    
    if (tutorsData && tutorsData.length > 0) {
      const tutorIds = tutorsData.map(t => t.id);
      const now = new Date().toISOString();

      const { data: slotsData } = await supabase.from('slots').select('tutor_id')
        .in('tutor_id', tutorIds).eq('is_booked', false).eq('location_type', locationType).gte('start_time', now);

      const slotCounts: any = {};
      slotsData?.forEach(slot => { slotCounts[slot.tutor_id] = (slotCounts[slot.tutor_id] || 0) + 1; });

      const tutorsWithAvailability = tutorsData.map(t => ({
        ...t, hasSlots: (slotCounts[t.id] || 0) > 0
      })).sort((a, b) => {
        if (a.hasSlots === b.hasSlots) return 0;
        return a.hasSlots ? -1 : 1; 
      });

      setTutors(tutorsWithAvailability);
    } else {
      setTutors([]);
    }
    setIsProcessing(false);
  };

  const fetchTutorSlots = async () => {
    setIsProcessing(true);
    const now = new Date().toISOString(); 
    const { data } = await supabase.from('slots').select('*')
      .eq('tutor_id', selectedTutor?.id).eq('is_booked', false)
      .eq('location_type', locationType).gte('start_time', now)
      .order('start_time', { ascending: true });
    
    setTutorSlots(data || []);
    if (data && data.length > 0) {
      const firstSlotDate = new Date(data[0].start_time);
      setSelectedDate(firstSlotDate.toDateString());
      setSelectedMonthIndex(firstSlotDate.getMonth());
    }
    setIsProcessing(false);
  };

  const handleBulkBooking = async () => {
    if (selectedSlotIds.length === 0) return alert("กรุณาเลือกเวลาเรียนอย่างน้อย 1 ช่วงเวลาครับ");
    
    const requiredHours = selectedSlotIds.length;
    const columnName = getWalletColumnName();
    const currentBalance = activeStudent?.wallet?.[columnName] || 0;
    
    if (currentBalance < requiredHours) {
        return alert(`❌ ชั่วโมงเรียนคงเหลือไม่พอครับ (มี ${currentBalance} ชม. แต่ต้องการจอง ${requiredHours} ชม.)\n*กรุณาซื้อคอร์สเพิ่ม หรือเลือกจำนวนเวลาให้น้อยลงครับ`);
    }

    if (window.confirm(`ยืนยันจองเรียนทั้งหมด ${requiredHours} ชั่วโมง ให้น้อง${activeStudent?.wallet?.student_name}?\n(ระบบจะหักชั่วโมงจากกระเป๋าของน้องทันที)`)) {
      setIsProcessing(true);
      try {
        // 1. หักชั่วโมงจาก Wallet ของน้อง
        await supabase.from('student_wallets').update({ [columnName]: currentBalance - requiredHours }).eq('user_id', activeStudent?.id);
        
        // 2. จอง Slot
        await supabase.from('slots').update({ is_booked: true }).in('id', selectedSlotIds);
        
        // 3. สร้าง Booking 
        const bookingData = selectedSlotIds.map(slotId => ({
          slot_id: slotId, 
          student_id: activeStudent?.id, 
          tutor_id: selectedTutor?.id,
          status: 'PENDING', 
          student_note: `[จองโดยผู้ปกครอง] ${studentNote}`, 
          is_student_accepted: true,
          subject_name: activeSubject !== 'ทั้งหมด' ? activeSubject : 'ระบุในโน้ต',
          db_key_used: columnName,
          hours_deducted: 1
        }));
        await supabase.from('bookings').insert(bookingData);

        alert(`🎉 จองคิวสำเร็จแล้วครับ! ระบบได้จัดคิวให้น้อง ${activeStudent?.wallet?.student_name} เรียบร้อยแล้ว`);
        resetBookingFlow();
        fetchParentData(); // โหลดข้อมูลใหม่
      } catch (err: any) { 
        alert("เกิดข้อผิดพลาด: " + err.message); 
      } finally { 
        setIsProcessing(false); 
      }
    }
  };

  const resetBookingFlow = () => {
    setIsBookingMode(false);
    setStep(1);
    setLocationType('');
    setGradeLevel('');
    setSelectedTutor(null);
    setViewingTutor(null);
    setSelectedSlotIds([]);
    setStudentNote('');
  };

  // --- Helper Functions สำหรับ UI ---
  const handleLogout = async () => {
    if (confirm('ยืนยันออกจากระบบ?')) {
      await supabase.auth.signOut();
      router.replace('/login');
    }
  };

  const getActiveHours = (wallet: any) => {
    if (!wallet) return [];
    return [
      { subject: 'คณิตศาสตร์', type: 'Onsite', balance: wallet.onsite_math || 0, dbKey: 'onsite_math' },
      { subject: 'วิทยาศาสตร์', type: 'Onsite', balance: wallet.onsite_science || 0, dbKey: 'onsite_science' },
      { subject: 'ภาษาอังกฤษ', type: 'Onsite', balance: wallet.onsite_english || 0, dbKey: 'onsite_english' },
      { subject: 'ฟิสิกส์', type: 'Onsite', balance: wallet.onsite_physics || 0, dbKey: 'onsite_physics' },
      { subject: 'เคมี', type: 'Onsite', balance: wallet.onsite_chemistry || 0, dbKey: 'onsite_chemistry' },
      { subject: 'ชีววิทยา', type: 'Onsite', balance: wallet.onsite_bio || 0, dbKey: 'onsite_bio' },
      { subject: 'ภาษาไทย-สังคม', type: 'Onsite', balance: wallet.onsite_thai_soc || 0, dbKey: 'onsite_thai_soc' },
      { subject: 'คอร์สพิเศษ', type: 'Onsite', balance: wallet.onsite_special || 0, dbKey: 'onsite_special' },
      { subject: 'ประถม-ม.ต้น', type: 'Online', balance: wallet.tier1_online_balance || 0, dbKey: 'tier1_online_balance' },
      { subject: 'สอบเข้า ม.4', type: 'Online', balance: wallet.tier2_online_balance || 0, dbKey: 'tier2_online_balance' },
      { subject: 'ม.ปลาย/มหาลัย', type: 'Online', balance: wallet.tier3_online_balance || 0, dbKey: 'tier3_online_balance' },
    ].filter(h => h.balance > 0);
  };

  const renderCalendar = () => {
    if (!activeStudent) return null;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDateStr = new Date(year, month, day).toLocaleDateString('en-CA');
      const dayBookings = activeStudent?.bookings?.filter((b: any) => new Date(b.slots?.start_time).toLocaleDateString('en-CA') === currentDateStr) || [];

      days.push(
        <div key={day} className="min-h-[80px] p-1.5 md:p-2 border border-gray-100 bg-white rounded-xl flex flex-col gap-1 shadow-sm hover:shadow-md transition-all">
          <span className="text-[10px] md:text-xs font-black text-gray-400 mb-1">{day}</span>
          <div className="space-y-1">
            {dayBookings.map((b: any) => {
              const isCompleted = b.status === 'VERIFIED';
              if (b.status === 'CANCELLED') return null;
              return (
                <div key={b.id} className={`p-1.5 rounded-lg text-[9px] md:text-[10px] font-black leading-tight border shadow-sm truncate ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  <div className="flex items-center gap-1 mb-0.5"><Clock size={8}/> {new Date(b.slots?.start_time).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}</div>
                  <div className="truncate">{b.subject_name || 'วิชา'}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return days;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-orange-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black"><User size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Parent Portal</p>
              <p className="font-black text-gray-800 leading-tight">คุณ {parentProfile?.full_name || 'ผู้ปกครอง'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-black text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all">
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {linkedStudents.length === 0 ? (
          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-orange-100/50 border border-orange-50 text-center max-w-2xl mx-auto mt-20">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={40} className="text-orange-500" /></div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">ยังไม่มีข้อมูลนักเรียนที่เชื่อมต่อ</h2>
            <p className="text-gray-500 font-bold mb-8">กรุณาแจ้งชื่อ-นามสกุลของบุตรหลานผ่านทาง LINE เพื่อให้แอดมินทำการเชื่อมต่อบัญชีให้ครับ</p>
            <a href="https://lin.ee/ZSDR4B3" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#06C755] text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-[#05b34c] transition-all">
              <MessageCircle size={20} fill="white" /> ติดต่อแอดมินทาง LINE
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* โหมดแสดงผล Dashboard ปกติ */}
            {!isBookingMode && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {linkedStudents.map(student => (
                    <button key={student.id} onClick={() => setActiveStudentId(student.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all border ${activeStudentId === student.id ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-200' : 'bg-white text-gray-500 border-gray-100 hover:bg-orange-50'}`}
                    >
                      <User size={16} /> น้อง{student?.wallet?.student_name}
                    </button>
                  ))}
                </div>

                {activeStudent && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
                    <div className="lg:col-span-4 space-y-6">
                      <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-200 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                        <div className="flex items-center gap-2 mb-6 relative z-10"><Star size={24} className="fill-white"/> <h3 className="font-black text-lg">แต้มเด็กขยัน</h3></div>
                        <div className="relative z-10 flex items-baseline gap-2"><span className="text-6xl font-black">{activeStudent?.wallet?.marketing_points || 0}</span><span className="text-xl font-bold opacity-90">Pts</span></div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                        <h3 className="font-black text-gray-800 text-lg flex items-center gap-2 mb-5"><BookOpen size={20} className="text-blue-500"/> ชั่วโมงคงเหลือ</h3>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                          {getActiveHours(activeStudent?.wallet).map((h, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${h.type === 'Online' ? 'bg-blue-50/50 border-blue-100 text-blue-700' : 'bg-purple-50/50 border-purple-100 text-purple-700'}`}>
                              <div>
                                <p className="font-black text-sm mb-1">{h.subject}</p>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${h.type === 'Online' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}`}>{h.type}</span>
                              </div>
                              <div className="text-right"><span className="text-2xl font-black">{h.balance}</span><span className="text-[10px] font-bold ml-1 opacity-70">ชม.</span></div>
                            </div>
                          ))}
                          {getActiveHours(activeStudent?.wallet).length === 0 && <div className="text-center py-8 text-gray-400 font-bold bg-gray-50 rounded-2xl">ไม่มียอดชั่วโมงคงเหลือ</div>}
                        </div>
                        
                        <button onClick={() => setIsBookingMode(true)} className="w-full mt-4 bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95">
                          <CalendarPlus size={20}/> จองเวลาเรียนให้น้อง
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-8">
                      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 h-full flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                          <h3 className="font-black text-gray-800 text-xl flex items-center gap-2">
                            <CalendarIcon size={24} className="text-emerald-500"/> ตารางเรียน (น้อง{activeStudent?.wallet?.student_name})
                          </h3>
                          <div className="flex bg-gray-100 p-1.5 rounded-2xl w-max">
                            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><LayoutList size={16}/> รายการ</button>
                            <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><CalendarDays size={16}/> ปฏิทิน</button>
                          </div>
                        </div>

                        {viewMode === 'calendar' ? (
                          <div className="flex-1 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 bg-white rounded-xl shadow-sm text-gray-500 hover:text-blue-600"><ChevronLeft size={20}/></button>
                              <span className="font-black text-gray-800 text-lg uppercase tracking-wider">{currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
                              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 bg-white rounded-xl shadow-sm text-gray-500 hover:text-blue-600"><ChevronRight size={20}/></button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => <div key={d} className="text-center font-black text-gray-400 text-[10px] uppercase tracking-widest">{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1 md:gap-2 auto-rows-fr">{renderCalendar()}</div>
                            <div className="flex gap-4 mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400 justify-center">
                              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-full"></div> รอเรียน</span>
                              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-full"></div> เรียนจบแล้ว</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 animate-in fade-in duration-300">
                            <div className="flex gap-2 mb-6">
                              <button onClick={() => setListTab('upcoming')} className={`px-5 py-2.5 rounded-[1.2rem] font-black text-xs transition-all border ${listTab === 'upcoming' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}>รอเรียน</button>
                              <button onClick={() => setListTab('history')} className={`px-5 py-2.5 rounded-[1.2rem] font-black text-xs transition-all border ${listTab === 'history' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}>ประวัติ / เรียนจบแล้ว</button>
                            </div>
                            <div className="overflow-x-auto pb-4">
                              <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                  <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                                    <th className="pb-4 pl-2">วัน/เวลา</th>
                                    <th className="pb-4">วิชา/รูปแบบ</th>
                                    <th className="pb-4">ติวเตอร์</th>
                                    <th className="pb-4 text-center">สถานะ</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {activeStudent?.bookings?.filter((b: any) => listTab === 'upcoming' ? b.status === 'PENDING' : b.status !== 'PENDING').map((booking: any) => (
                                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="py-4 pl-2">
                                        <div className="font-black text-gray-800 text-sm">{new Date(booking.slots?.start_time).toLocaleDateString('th-TH')}</div>
                                        <div className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1">
                                          <Clock size={12}/> {new Date(booking.slots?.start_time).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} น.
                                        </div>
                                      </td>
                                      <td className="py-4">
                                        <div className="font-bold text-gray-800 text-sm">{booking.subject_name || 'ไม่ระบุ'}</div>
                                        <div className={`text-[9px] font-black uppercase tracking-wider w-max px-2 py-0.5 rounded-md mt-1 ${booking.slots?.location_type === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{booking.slots?.location_type}</div>
                                      </td>
                                      <td className="py-4 font-bold text-sm text-gray-600">ครู{booking.tutors?.name}</td>
                                      <td className="py-4 text-center">
                                        {booking.status === 'VERIFIED' && <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md"><CheckCircle2 size={14}/> เรียนจบแล้ว</span>}
                                        {booking.status === 'PENDING' && <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md"><RefreshCw size={14} className="animate-spin-slow"/> รอเรียน</span>}
                                        {booking.status === 'CANCELLED' && <span className="inline-flex items-center gap-1 text-[10px] font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md"><XCircle size={14}/> ยกเลิกแล้ว</span>}
                                      </td>
                                    </tr>
                                  ))}
                                  {activeStudent?.bookings?.filter((b: any) => listTab === 'upcoming' ? b.status === 'PENDING' : b.status !== 'PENDING').length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-12 text-gray-400 font-bold bg-gray-50/50 rounded-2xl">ไม่พบประวัติในหมวดหมู่นี้</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ✨ โหมดจองคิวเรียน (4 Steps Booking Flow) */}
            {isBookingMode && activeStudent && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                
                {/* ปุ่มย้อนกลับ & Progress Bar */}
                <div className="mb-8">
                  <button onClick={() => step > 1 ? setStep(step === 4 ? 3 : step - 1) : resetBookingFlow()} 
                    className="text-gray-500 font-black text-sm uppercase mb-4 flex items-center gap-2 group transition-all w-max hover:text-blue-600">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> ย้อนกลับ
                  </button>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={`h-2 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mt-6 flex items-center gap-2">
                    <CalendarPlus className="text-blue-600"/> จองเวลาเรียนให้น้อง{activeStudent?.wallet?.student_name}
                  </h2>
                </div>

                {/* Step 1: เลือกรูปแบบ */}
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
                  </div>
                )}

                {/* Step 2: เลือกระดับชั้น */}
                {step === 2 && (
                  <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                    <h2 className="text-xl font-black mb-2 text-gray-900 text-center">เลือกระดับชั้นเรียน</h2>
                    {tiers.map(tier => (
                      <button key={tier.id} onClick={() => { setGradeLevel(tier.id); setStep(3); }} className="bg-white p-6 rounded-[2rem] border-2 border-transparent hover:border-blue-500 shadow-sm flex flex-col gap-2 transition-all text-left">
                        <div className="flex justify-between items-center"><h3 className="text-lg font-black text-gray-900">{tier.title}</h3></div>
                        <p className="text-gray-400 text-xs font-bold">{tier.desc}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 3: เลือกติวเตอร์ */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex gap-2 overflow-x-auto w-full hide-scroll py-2">
                      {subjects.map(sub => (
                        <button key={sub} onClick={() => setActiveSubject(sub)}
                          className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-black transition-all border-2 
                            ${activeSubject === sub ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                          {sub}
                        </button>
                      ))}
                    </div>

                    {isProcessing ? <Loader2 className="animate-spin mx-auto text-blue-600" size={48} /> : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tutors.filter(t => activeSubject === 'ทั้งหมด' || t.tags?.includes(activeSubject)).map(tutor => (
                          <div key={tutor.id} className={`bg-white rounded-[2rem] overflow-hidden border border-gray-100 flex flex-col h-full transition-all group ${!tutor.hasSlots ? 'opacity-70' : 'hover:shadow-lg'}`}>
                            <div className="h-40 bg-gray-50 relative cursor-pointer" onClick={() => setViewingTutor(tutor)}>
                              {!tutor.hasSlots && <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm">คิวเต็ม</div>}
                              <img src={tutor.image_url || '/default-avatar.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <h3 className="text-sm font-black mb-1 text-gray-900 truncate">{tutor.name}</h3>
                              <div className="mt-auto flex flex-col gap-2 pt-3">
                                {tutor.hasSlots ? (
                                  <button onClick={() => { setSelectedTutor(tutor); setStep(4); }} className="w-full bg-gray-900 text-white py-2 rounded-xl font-black text-xs hover:bg-blue-600 transition-all">จองเวลาเรียน</button>
                                ) : (
                                  <a href="https://lin.ee/ZSDR4B3" target="_blank" className="w-full bg-green-50 text-green-600 py-2 rounded-xl font-black text-xs text-center border border-green-200">จองพิเศษ (Line)</a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: เลือกเวลาและยืนยัน */}
                {step === 4 && selectedTutor && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                        <img src={selectedTutor.image_url || '/default-avatar.png'} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                        <h3 className="font-black text-lg">{selectedTutor.name}</h3>
                      </div>
                      <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white shadow-lg">
                        <p className="text-[10px] font-black uppercase opacity-70">สิทธิ์คงเหลือ</p>
                        <p className="text-3xl font-black">{activeStudent?.wallet?.[getWalletColumnName()] || 0} <span className="text-sm">ชม.</span></p>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                      {isProcessing ? <div className="bg-white p-10 rounded-[2rem] flex justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div> : (
                        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                          <h2 className="text-xl font-black mb-4 flex items-center gap-2"><MousePointer2 size={20}/> เลือกเวลาเรียน</h2>
                          
                          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
                            {Array.from(new Set(tutorSlots.map(s => new Date(s.start_time).toDateString()))).map(date => (
                              <button key={date} onClick={() => setSelectedDate(date)}
                                className={`flex flex-col items-center min-w-[70px] py-3 px-3 rounded-2xl border-2 transition-all ${selectedDate === date ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-500'}`}>
                                <span className="text-[10px] font-black uppercase mb-1">{new Date(date).toLocaleDateString('th-TH', { weekday: 'short' })}</span>
                                <span className="text-xl font-black">{new Date(date).getDate()}</span>
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            {tutorSlots.filter(s => new Date(s.start_time).toDateString() === selectedDate).map(slot => (
                              <button key={slot.id} onClick={() => setSelectedSlotIds(prev => prev.includes(slot.id) ? prev.filter(id => id !== slot.id) : [...prev, slot.id])}
                                className={`flex items-center justify-between p-4 rounded-[1.2rem] border-2 transition-all ${selectedSlotIds.includes(slot.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-transparent hover:border-blue-400'}`}>
                                <span className="font-black text-sm">{new Date(slot.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                                {selectedSlotIds.includes(slot.id) ? <CheckCircle2 size={16}/> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"/>}
                              </button>
                            ))}
                          </div>

                          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-white">
                            <label className="text-xs font-black uppercase mb-3 flex items-center gap-2"><MessageCircle size={16}/> โน้ตฝากถึงครู (Optional)</label>
                            <textarea value={studentNote} onChange={(e) => setStudentNote(e.target.value)} 
                              className="w-full p-4 bg-white/10 backdrop-blur-md rounded-2xl outline-none focus:bg-white focus:text-gray-900 transition-all font-bold h-24" placeholder="เช่น เน้นเรื่องสมการ..." />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Bar สำหรับยืนยันการจอง */}
      {isBookingMode && step === 4 && selectedSlotIds.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-md z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-gray-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
            <div className="pl-4">
               <p className="text-[10px] font-black text-gray-400 uppercase">เวลาที่เลือก</p>
               <p className="text-xl font-black">{selectedSlotIds.length} <span className="text-xs font-bold opacity-60">ชม.</span></p>
            </div>
            <button onClick={handleBulkBooking} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg flex items-center gap-2 disabled:bg-gray-600">
              {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'ยืนยันการจอง'} <ChevronRight size={18}/>
            </button>
          </div>
        </div>
      )}

      {/* Modal ดูโปรไฟล์ติวเตอร์ */}
      {viewingTutor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingTutor(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingTutor(null)} className="absolute top-4 right-4 text-gray-500"><X/></button>
            <img src={viewingTutor.image_url || '/default-avatar.png'} className="w-24 h-24 rounded-2xl object-cover mb-4 shadow-sm" />
            <h2 className="text-2xl font-black mb-2">{viewingTutor.name}</h2>
            <div className="flex gap-1 mb-4">{viewingTutor.tags?.map((t: string) => <span key={t} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black">#{t}</span>)}</div>
            <p className="text-gray-500 text-sm font-medium mb-6">{viewingTutor.bio || 'ไม่มีประวัติ'}</p>
            <button onClick={() => { setSelectedTutor(viewingTutor); setViewingTutor(null); setStep(4); }} className="w-full bg-gray-900 text-white py-3 rounded-xl font-black hover:bg-blue-600 transition-colors">จองคิวติวเตอร์ท่านนี้</button>
          </div>
        </div>
      )}
    </div>
  );
}
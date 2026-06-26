'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft, Search, User, MapPin, MonitorPlay, CalendarPlus, 
  Clock, CheckCircle2, XCircle, BookOpen, Plus, Minus,
  RefreshCw, AlertCircle, Loader2, Phone
} from 'lucide-react';

export default function OnsiteManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [students, setStudents] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [hoursBalance, setHoursBalance] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  // ✨ State สำหรับควบคุม Tab ประวัติคิว
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const [bookingForm, setBookingForm] = useState({
    subject: '',
    type: 'Online',
    date: '',
    startTime: '',
    endTime: '',
    tutor: '',
    hoursToDeduct: 1
  });

  const timeOptions = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (bookingForm.startTime && bookingForm.endTime) {
      const startHour = parseInt(bookingForm.startTime.split(':')[0]);
      const endHour = parseInt(bookingForm.endTime.split(':')[0]);
      const diff = endHour - startHour;
      
      setBookingForm(prev => ({
        ...prev,
        hoursToDeduct: diff > 0 ? diff : 0
      }));
    }
  }, [bookingForm.startTime, bookingForm.endTime]);

  const fetchInitialData = async () => {
    setLoadingStudents(true);
    try {
      const { data: tutorsData } = await supabase.from('tutors').select('id, name').order('name');
      if (tutorsData) setTutors(tutorsData);

      const { data: wallets, error: walletsError } = await supabase
        .from('student_wallets')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (walletsError) throw walletsError;
      setStudents(wallets || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSearchStudent = async () => {
    if (!searchTerm.trim()) {
      fetchInitialData();
      return;
    }
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('student_wallets')
        .select('*')
        .or(`student_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error("Search Error: ", err.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setActiveTab('upcoming'); // รีเซ็ต Tab กลับมารอเรียนทุกครั้งที่เปลี่ยนนักเรียน
    
    const mappedHours = [
      { id: 'onsite_math', dbKey: 'onsite_math', subject: 'คณิตศาสตร์', type: 'Onsite', balance: student.onsite_math || 0 },
      { id: 'onsite_science', dbKey: 'onsite_science', subject: 'วิทยาศาสตร์', type: 'Onsite', balance: student.onsite_science || 0 },
      { id: 'onsite_english', dbKey: 'onsite_english', subject: 'ภาษาอังกฤษ', type: 'Onsite', balance: student.onsite_english || 0 },
      { id: 'onsite_physics', dbKey: 'onsite_physics', subject: 'ฟิสิกส์', type: 'Onsite', balance: student.onsite_physics || 0 },
      { id: 'onsite_chemistry', dbKey: 'onsite_chemistry', subject: 'เคมี', type: 'Onsite', balance: student.onsite_chemistry || 0 },
      { id: 'onsite_bio', dbKey: 'onsite_bio', subject: 'ชีววิทยา', type: 'Onsite', balance: student.onsite_bio || 0 },
      { id: 'onsite_thai_soc', dbKey: 'onsite_thai_soc', subject: 'ภาษาไทย-สังคม', type: 'Onsite', balance: student.onsite_thai_soc || 0 },
      { id: 'onsite_special', dbKey: 'onsite_special', subject: 'คอร์สพิเศษ', type: 'Onsite', balance: student.onsite_special || 0 },
      { id: 'tier1_online', dbKey: 'tier1_online_balance', subject: 'ประถม-ม.ต้น', type: 'Online', balance: student.tier1_online_balance || 0 },
      { id: 'tier2_online', dbKey: 'tier2_online_balance', subject: 'สอบเข้า ม.4', type: 'Online', balance: student.tier2_online_balance || 0 },
      { id: 'tier3_online', dbKey: 'tier3_online_balance', subject: 'ม.ปลาย/มหาลัย', type: 'Online', balance: student.tier3_online_balance || 0 },
    ];
    setHoursBalance(mappedHours);
    fetchStudentBookings(student.user_id);
  };

  const fetchStudentBookings = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, is_student_accepted, subject_name, db_key_used, hours_deducted,
          slots!inner ( id, start_time, location_type ),
          tutors!inner ( name )
        `)
        .eq('student_id', studentId)
        .order('id', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err: any) {
      console.error("Error fetching bookings:", err.message || err);
    }
  };

  const handleBookSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.subject) return alert('กรุณาเลือกวิชา');

    if (bookingForm.hoursToDeduct <= 0) {
      return alert('เวลาเริ่มต้น ต้องน้อยกว่า เวลาเลิกเรียนครับ!');
    }

    const targetHourIndex = hoursBalance.findIndex(
      h => h.subject === bookingForm.subject && h.type === bookingForm.type
    );

    if (targetHourIndex === -1 || hoursBalance[targetHourIndex].balance < bookingForm.hoursToDeduct) {
      return alert(`ชั่วโมง ${bookingForm.subject} (${bookingForm.type}) ไม่เพียงพอ! (ต้องการหัก ${bookingForm.hoursToDeduct} ชม.)`);
    }

    const targetHour = hoursBalance[targetHourIndex];
    setIsProcessing(true);

    try {
      const startDateTime = new Date(`${bookingForm.date}T${bookingForm.startTime}:00`).toISOString();

      const newBalance = targetHour.balance - bookingForm.hoursToDeduct;
      const { error: walletError } = await supabase
        .from('student_wallets')
        .update({ [targetHour.dbKey]: newBalance })
        .eq('user_id', selectedStudent.user_id);

      if (walletError) throw walletError;

      const { data: slotData, error: slotError } = await supabase
        .from('slots')
        .insert({
          start_time: startDateTime,
          location_type: bookingForm.type,
        })
        .select('id')
        .single();

      if (slotError) throw slotError;

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          student_id: selectedStudent.user_id,
          slot_id: slotData.id,
          tutor_id: bookingForm.tutor,
          status: 'PENDING',
          is_student_accepted: false,
          subject_name: bookingForm.subject, 
          db_key_used: targetHour.dbKey,
          hours_deducted: bookingForm.hoursToDeduct 
        });

      if (bookingError) throw bookingError;

      alert(`สร้างคิวเรียนและหัก ${bookingForm.hoursToDeduct} ชั่วโมงสำเร็จ! ✨`);
      
      const newHours = [...hoursBalance];
      newHours[targetHourIndex].balance = newBalance;
      setHoursBalance(newHours);
      
      setBookingForm(prev => ({ ...prev, startTime: '', endTime: '' }));
      setActiveTab('upcoming'); // สลับ Tab มาที่รอเรียนให้เห็นคิวที่เพิ่งจอง
      fetchStudentBookings(selectedStudent.user_id);

    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการจองคิว: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSchedule = async (scheduleId: string, dbKeyToRefund: string, hoursToRefund: number = 1) => {
    if (!confirm(`ยืนยันการยกเลิกคิว? ระบบจะคืนชั่วโมงเข้ากระเป๋านักเรียน ${hoursToRefund} ชั่วโมงทันที`)) return;
    setIsProcessing(true);

    try {
      const { error: cancelError } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', scheduleId);

      if (cancelError) throw cancelError;

      if (dbKeyToRefund) {
         const { data: currentWallet } = await supabase
           .from('student_wallets')
           .select(dbKeyToRefund)
           .eq('user_id', selectedStudent.user_id)
           .single();
         
         if (currentWallet) {
           await supabase
             .from('student_wallets')
             .update({ [dbKeyToRefund]: Number((currentWallet as any)[dbKeyToRefund]) + hoursToRefund })
             .eq('user_id', selectedStudent.user_id);
         }
      }

      alert('ยกเลิกคิวและคืนชั่วโมงสำเร็จ 🔄');
      handleSelectStudent(selectedStudent);

    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการยกเลิก: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustHourManual = async (id: string, amount: number, dbKey: string) => {
    const target = hoursBalance.find(h => h.id === id);
    if (!target) return;
    
    const newBalance = Math.max(0, target.balance + amount);
    
    try {
       await supabase
         .from('student_wallets')
         .update({ [dbKey]: newBalance })
         .eq('user_id', selectedStudent.user_id);

       setHoursBalance(hoursBalance.map(h => 
         h.id === id ? { ...h, balance: newBalance } : h
       ));
    } catch (err: any) {
       alert('ไม่สามารถปรับชั่วโมงได้: ' + err.message);
    }
  };

  // ✨ ฟิลเตอร์ข้อมูลตาม Tab ที่เลือก
  const filteredSchedules = schedules.filter(schedule => {
    if (activeTab === 'upcoming') {
      return schedule.status === 'PENDING';
    } else {
      return schedule.status === 'VERIFIED' || schedule.status === 'CANCELLED';
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      
      {/* --- Header --- */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-bold text-sm">
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <CalendarPlus className="text-blue-600" size={32} />
            ระบบจัดการคิวและชั่วโมงเรียน
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">จองคิว Onsite / Online และตัดชั่วโมงอัตโนมัติ</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* === Left Column: Search & Hours === */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="font-black text-lg mb-4 flex items-center gap-2"><User size={20} className="text-blue-600"/> ค้นหานักเรียน</h2>
            <div className="relative mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="ชื่อ, เบอร์โทร..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-[1.2rem] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchStudent()}
                />
              </div>
              <button onClick={handleSearchStudent} className="bg-blue-600 text-white px-4 rounded-[1.2rem] hover:bg-blue-700 transition-colors shrink-0 flex items-center justify-center">
                 {loadingStudents ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              </button>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {loadingStudents ? (
                <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
              ) : students.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-bold">ไม่พบรายชื่อนักเรียน</div>
              ) : (
                students.map(student => (
                  <button 
                    key={student.user_id}
                    onClick={() => handleSelectStudent(student)}
                    className={`w-full flex items-center justify-between p-3 rounded-[1rem] transition-colors border ${selectedStudent?.user_id === student.user_id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                  >
                    <div className="text-left overflow-hidden">
                      <span className="font-bold text-slate-700 block truncate">น้อง{student.student_name || 'ไม่ระบุชื่อ'}</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={10}/> {student.phone || 'ไม่ระบุเบอร์โทร'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedStudent && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] shadow-lg text-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-lg flex items-center gap-2"><BookOpen size={20} className="text-blue-400"/> กระเป๋าชั่วโมง</h2>
                <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full truncate max-w-[120px]">น้อง{selectedStudent.student_name}</span>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {hoursBalance.map(hour => (
                  <div key={hour.id} className={`bg-white/10 border p-4 rounded-[1.2rem] flex items-center justify-between backdrop-blur-sm ${hour.balance > 0 ? 'border-white/30' : 'border-white/5 opacity-50'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {hour.type === 'Online' ? <MonitorPlay size={14} className="text-blue-400"/> : <MapPin size={14} className="text-rose-400"/>}
                        <span className="font-bold text-sm">{hour.subject}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${hour.type === 'Online' ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {hour.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button onClick={() => adjustHourManual(hour.id, -1, hour.dbKey)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors"><Minus size={14}/></button>
                      <span className="text-2xl font-black w-8 text-center">{hour.balance}</span>
                      <button onClick={() => adjustHourManual(hour.id, 1, hour.dbKey)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors"><Plus size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* === Right Column: Booking Form & History === */}
        <div className="lg:col-span-8 space-y-6">
          
          {selectedStudent ? (
            <>
              {/* 3. Booking Form */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h2 className="font-black text-xl mb-6 flex items-center gap-2 text-slate-800">
                  <CalendarPlus size={24} className="text-blue-600"/> สร้างคิวเรียนให้ น้อง{selectedStudent.student_name}
                </h2>
                
                <form onSubmit={handleBookSchedule} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-2">รูปแบบการเรียน</label>
                      <div className="flex bg-slate-100 p-1.5 rounded-[1.2rem]">
                        <button 
                          type="button"
                          onClick={() => setBookingForm({...bookingForm, type: 'Online', subject: ''})}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1rem] font-bold text-sm transition-all ${bookingForm.type === 'Online' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <MonitorPlay size={16}/> Online
                        </button>
                        <button 
                          type="button"
                          onClick={() => setBookingForm({...bookingForm, type: 'Onsite', subject: ''})}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1rem] font-bold text-sm transition-all ${bookingForm.type === 'Onsite' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <MapPin size={16}/> Onsite
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-2">เลือกวิชาจากกระเป๋า</label>
                      <select 
                        required
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none"
                        value={bookingForm.subject}
                        onChange={(e) => setBookingForm({...bookingForm, subject: e.target.value})}
                      >
                        <option value="">-- เลือกวิชา --</option>
                        {hoursBalance.filter(h => h.type === bookingForm.type && h.balance > 0).map(h => (
                          <option key={h.id} value={h.subject}>{h.subject} - เหลือ {h.balance} ชม.</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-2">วันที่เรียน</label>
                      <input 
                        type="date" required
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] font-bold text-slate-700 outline-none focus:border-blue-400"
                        value={bookingForm.date} onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                      />
                    </div>
                    
                    <div className="md:col-span-2 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">เวลาเริ่ม</label>
                        <select 
                          required
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] font-bold text-slate-700 outline-none focus:border-blue-400"
                          value={bookingForm.startTime} 
                          onChange={(e) => setBookingForm({...bookingForm, startTime: e.target.value})}
                        >
                          <option value="">-- เริ่ม --</option>
                          {timeOptions.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">เวลาเลิก</label>
                        <select 
                          required
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] font-bold text-slate-700 outline-none focus:border-blue-400"
                          value={bookingForm.endTime} 
                          onChange={(e) => setBookingForm({...bookingForm, endTime: e.target.value})}
                        >
                          <option value="">-- เลิก --</option>
                          {timeOptions.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-bold text-slate-500 mb-2">เลือกติวเตอร์</label>
                      <select 
                        required
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] font-bold text-slate-700 outline-none focus:border-blue-400"
                        value={bookingForm.tutor} onChange={(e) => setBookingForm({...bookingForm, tutor: e.target.value})}
                      >
                        <option value="">-- เลือกครูผู้สอน --</option>
                        {tutors.map(tutor => (
                          <option key={tutor.id} value={tutor.id}>{tutor.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-[1.2rem] border border-amber-100 flex items-start gap-3">
                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-bold text-amber-800">
                      เมื่อกดยืนยัน ระบบจะหักชั่วโมงเรียนจากกระเป๋า <span className="text-amber-600 underline">{bookingForm.subject || '...'} ({bookingForm.type})</span> จำนวน <span className="text-lg font-black text-amber-600 mx-1">{bookingForm.hoursToDeduct}</span> ชั่วโมง โดยอัตโนมัติ
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black rounded-[1.2rem] transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <CalendarPlus size={20} />}
                    ยืนยันการสร้างคิว & หักชั่วโมง
                  </button>
                </form>
              </div>

              {/* 4. Schedules History & Cancellation */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h2 className="font-black text-xl mb-6 flex items-center gap-2 text-slate-800">
                  <Clock size={24} className="text-slate-400"/> ประวัติและสถานะคิว
                </h2>
                
                {/* ✨ ตัวเลือก Tab */}
                <div className="flex gap-2 mb-6 bg-slate-100/50 p-1.5 rounded-[1.5rem] w-max border border-slate-100">
                  <button 
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-5 py-2.5 rounded-[1.2rem] font-black text-xs transition-all ${activeTab === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    รอเรียน / รอยืนยัน
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-5 py-2.5 rounded-[1.2rem] font-black text-xs transition-all ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    เรียนจบ / ประวัติเก่า
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs font-black uppercase tracking-wider">
                        <th className="pb-3 pl-2">วัน/เวลา</th>
                        <th className="pb-3">วิชา/รูปแบบ</th>
                        <th className="pb-3">ติวเตอร์</th>
                        <th className="pb-3 text-center">สถานะ</th>
                        <th className="pb-3 text-right pr-2">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {/* ✨ เปลี่ยนมา map ผ่าน filteredSchedules แทน schedules ปกติ */}
                      {filteredSchedules.map(schedule => {
                        const dateObj = new Date(schedule.slots?.start_time);
                        const displayDate = dateObj.toLocaleDateString('th-TH');
                        const displayTime = dateObj.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) + ' น.';
                        const deducHours = schedule.hours_deducted || 1;

                        return (
                          <tr key={schedule.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 pl-2">
                              <div className="font-bold text-slate-800 text-sm">{displayDate}</div>
                              <div className="text-xs font-bold text-slate-500">{displayTime} <span className="bg-blue-100 text-blue-600 px-1 rounded ml-1">({deducHours} ชม.)</span></div>
                            </td>
                            <td className="py-4">
                              <div className="font-bold text-slate-800 text-sm">{schedule.subject_name || 'ไม่ระบุ'}</div>
                              <div className={`text-[10px] font-black uppercase tracking-wider w-max px-2 py-0.5 rounded-md mt-1 ${schedule.slots?.location_type === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                                {schedule.slots?.location_type}
                              </div>
                            </td>
                            <td className="py-4 font-bold text-sm text-slate-600">{schedule.tutors?.name}</td>
                            <td className="py-4 text-center">
                              {schedule.status === 'VERIFIED' && <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle2 size={14}/> เรียนจบแล้ว</span>}
                              {schedule.status === 'PENDING' && schedule.is_student_accepted && <span className="inline-flex items-center gap-1 text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md"><CheckCircle2 size={14}/> เด็กยืนยันแล้ว</span>}
                              {schedule.status === 'PENDING' && !schedule.is_student_accepted && <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md"><RefreshCw size={14} className="animate-spin-slow"/> รอเด็กยืนยัน</span>}
                              {schedule.status === 'CANCELLED' && <span className="inline-flex items-center gap-1 text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md"><XCircle size={14}/> ยกเลิกแล้ว</span>}
                            </td>
                            <td className="py-4 text-right pr-2">
                              {schedule.status !== 'CANCELLED' && schedule.status !== 'VERIFIED' && (
                                <button 
                                  onClick={() => handleCancelSchedule(schedule.id, schedule.db_key_used, deducHours)}
                                  disabled={isProcessing}
                                  className="text-[10px] font-black text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100 disabled:opacity-50"
                                >
                                  ยกเลิกคิว<br/>(คืน {deducHours} ชม.)
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredSchedules.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-slate-400 font-bold">ไม่พบประวัติในหมวดหมู่นี้</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white rounded-[2rem] border border-slate-200 border-dashed">
              <User size={48} className="mb-4 text-slate-300" />
              <p className="font-bold text-lg">กรุณาเลือกนักเรียนจากเมนูด้านซ้าย</p>
              <p className="text-sm mt-1">เพื่อจัดการชั่วโมงและสร้างคิวเรียน</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
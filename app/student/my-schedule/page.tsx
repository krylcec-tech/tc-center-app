'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Globe, 
  XCircle, MessageCircle, Loader2, CalendarCheck 
} from 'lucide-react';
import Link from 'next/link';

export default function MySchedulePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✨ แก้ไขจุดสำคัญ: เพิ่ม !inner เพื่อบังคับดึงข้อมูลที่มีความสัมพันธ์กันเท่านั้น
      // และตรวจสอบให้แน่ใจว่าชื่อตาราง (slots, tutors) ตรงกับในฐานข้อมูล
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          slots!inner (
            id,
            start_time,
            location_type
          ),
          tutors!inner (
            name,
            image_url
          )
        `)
        .eq('student_id', user.id)
        .order('id', { ascending: false });

      if (error) {
        console.error("🚨 Fetch Error:", error.message);
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (booking: any) => {
    // 🛡️ เช็คว่าข้อมูลครบไหมก่อนทำรายการ
    if (!booking.slots?.start_time) return;

    const startTime = new Date(booking.slots.start_time);
    const now = new Date();
    const diffInHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      alert("⚠️ ไม่สามารถยกเลิกผ่านระบบได้เนื่องจากเหลือเวลาน้อยกว่า 24 ชม.\nกรุณาติดต่อแอดมินผ่าน LINE เพื่อแจ้งเหตุจำเป็นครับ");
      window.open("https://lin.ee/ZSDR4B3", "_blank");
      return;
    }

    if (confirm(`ยืนยันการยกเลิกคิวเรียนกับ ${booking.tutors?.name || 'ติวเตอร์'}? \n*ระบบจะคืนชั่วโมงเข้ากระเป๋าให้คุณทันที*`)) {
      setCancellingId(booking.id);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. คืนชั่วโมงใน Wallet
        const { data: wallet } = await supabase.from('student_wallets')
          .select('total_hours_balance')
          .eq('user_id', user.id)
          .single();
          
        await supabase.from('student_wallets')
          .update({ total_hours_balance: (wallet?.total_hours_balance || 0) + 1 })
          .eq('user_id', user.id);

        // 2. บันทึก Transaction
        await supabase.from('wallet_transactions').insert([{
          user_id: user.id,
          amount: 1,
          type: 'cancel',
          description: `คืนชั่วโมงจากการยกเลิกเรียนกับ ${booking.tutors?.name || 'ติวเตอร์'}`
        }]);

        // 3. เปิด Slot ให้ว่างใหม่
        await supabase.from('slots').update({ is_booked: false }).eq('id', booking.slots.id);

        // 4. ลบการจอง
        await supabase.from('bookings').delete().eq('id', booking.id);

        alert("✅ ยกเลิกสำเร็จและคืนชั่วโมงเรียบร้อยแล้ว");
        fetchMyBookings();
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการยกเลิก");
      } finally {
        setCancellingId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/student" className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-6 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าหลัก
        </Link>
        
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-10 flex items-center gap-4">
          <CalendarCheck className="text-blue-600" size={40} /> ตารางเรียนของฉัน
        </h1>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></div>
        ) : bookings.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
            <Calendar className="mx-auto text-gray-200 mb-6" size={60} />
            <p className="text-gray-400 font-black text-xl">ยังไม่มีคิวเรียนที่จองไว้</p>
            <Link href="/student/booking-flow" className="mt-4 inline-block bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm">จองเรียนตอนนี้เลย</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map((item) => {
              if (!item.slots) return null; // กันพังถ้าข้อมูล slot หาย
              const isUrgent = (new Date(item.slots.start_time).getTime() - new Date().getTime()) / (1000 * 60 * 60) < 24;
              
              return (
                <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 group">
                  <div className="flex items-center gap-6 w-full">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl overflow-hidden shrink-0 border-2 border-white shadow-sm">
                      <img 
                        src={item.tutors?.image_url || 'https://via.placeholder.com/150'} 
                        className="w-full h-full object-cover" 
                        alt="tutor"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.slots.location_type === 'Online' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                           {item.slots.location_type}
                         </span>
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 leading-none mb-2">{item.tutors?.name || 'ไม่ระบุชื่อติวเตอร์'}</h3>
                      <div className="flex items-center gap-4 text-gray-500 font-bold text-sm">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(item.slots.start_time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                        <span className="flex items-center gap-1 text-blue-600"><Clock size={14}/> {new Date(item.slots.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} น.</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex gap-2">
                    {isUrgent ? (
                      <a href="https://lin.ee/ZSDR4B3" target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none bg-[#06C755] text-white px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-[#05b34c] transition-all">
                        <MessageCircle size={18} /> แจ้งแอดมิน (LINE)
                      </a>
                    ) : (
                      <button 
                        onClick={() => handleCancel(item)}
                        disabled={cancellingId === item.id}
                        className="flex-1 md:flex-none bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
                      >
                        {cancellingId === item.id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                        ยกเลิกการจอง
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
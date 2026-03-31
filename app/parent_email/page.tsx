'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; // เช็ค path ให้ตรงนะครับ

export default function ParentDashboard() {
    // ฟังก์ชันสำหรับเติมชั่วโมง (ใส่ไว้ใน Component ParentDashboard)
const topUpHours = async (amount: number) => {
  const { data, error } = await supabase
    .rpc('increment_hours', { row_id: studentData.id, num: amount }); 
    // หมายเหตุ: ต้องไปสร้าง function increment_hours ใน SQL Editor ก่อน

  if (!error) {
    alert(`เติมเงินสำเร็จ! เพิ่ม ${amount} ชั่วโมง`);
    window.location.reload(); // โหลดหน้าใหม่เพื่ออัปเดตเลข
  }
};
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchParentData = async () => {
      // 1. เช็คว่าผู้ปกครองคนนี้ Login อยู่ไหม
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // 2. ดึงข้อมูลนักเรียนที่มี parent_email ตรงกับคนที่ Login
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_email', session.user.email)
        .single();

      if (data) setStudentData(data);
      setLoading(false);
    };

    fetchParentData();
  }, [router]);

  if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-6 max-w-md mx-auto bg-blue-50 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">🏫 หน้าต่างผู้ปกครอง</h1>
      
      {studentData ? (
        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-blue-200">
          <p className="text-gray-500 text-center mb-2 font-medium">สวัสดีครับ/ค่ะ ผู้ปกครองของ</p>
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">{studentData.student_name}</h2>
          
          <div className="bg-blue-600 p-6 rounded-2xl text-center text-white shadow-inner">
            <p className="text-lg opacity-80 mb-1">จำนวนชั่วโมงคงเหลือ</p>
            <p className="text-6xl font-black">{studentData.remaining_hours}</p>
            <p className="text-lg mt-1 opacity-80">ชั่วโมง</p>
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            อัปเดตล่าสุด: {new Date(studentData.created_at).toLocaleDateString('th-TH')}
          </p>
        </div>
      ) : (
        <div className="text-center p-8 bg-white rounded-2xl border">
          <p className="text-red-500">ไม่พบข้อมูลนักเรียนที่เชื่อมโยงกับอีเมลนี้</p>
          <p className="text-gray-500 text-sm mt-2">กรุณาติดต่อ Admin เพื่อลงทะเบียนอีเมลผู้ปกครองครับ</p>
        </div>
      )}

      <button 
        onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
        className="w-full mt-6 text-gray-400 hover:text-red-500 transition font-medium"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
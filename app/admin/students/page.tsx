'use client'
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase'; // ตรวจสอบ path ให้ถูกต้องตามโครงสร้างเครื่องคุณ
import { ArrowLeft, User, Clock, Search, Mail, AlertCircle, Camera, X, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowHours, setFilterLowHours] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null); // State สำหรับโชว์ Loading ตอนอัปโหลดทีละคน
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('student_name');
    if (data) setStudents(data);
  };

  const updateHours = async (id: string, newHours: number) => {
    if (newHours < 0) return;
    const { error } = await supabase.from('students').update({ remaining_hours: newHours }).eq('id', id);
    if (!error) {
      setStudents(students.map(s => s.id === id ? { ...s, remaining_hours: newHours } : s));
    }
  };

  // --- ฟังก์ชันจัดการรูปภาพนักเรียน ---

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, studentId: string, currentImageUrl: string | null) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingId(studentId); // เริ่มโชว์ Loading ที่การ์ดของนักเรียนคนนี้

    try {
      // 1. ถ้ามีรูปเก่า ให้ลบรูปเก่าใน Storage ก่อนเพื่อประหยัดพื้นที่
      if (currentImageUrl) {
        const oldFilePath = currentImageUrl.split('/storage/v1/object/public/student-images/')[1];
        if (oldFilePath) {
          await supabase.storage.from('student-images').remove([oldFilePath]);
        }
      }

      // 2. อัปโหลดรูปใหม่
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}_${Date.now()}.${fileExt}`; // ใช้ ID นักเรียน+เวลา ตั้งชื่อไฟล์
      const filePath = `avatar/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('student-images') // **ต้องตรงกับชื่อ Bucket ที่สร้างใน Supabase**
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. ดึง Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-images')
        .getPublicUrl(filePath);

      // 4. อัปเดต DB ตาราง students คอลัมน์ image_url
      const { error: updateError } = await supabase
        .from('students')
        .update({ image_url: publicUrl })
        .eq('id', studentId);

      if (updateError) throw updateError;

      // 5. อัปเดต State หน้าจอทันที
      setStudents(students.map(s => s.id === studentId ? { ...s, image_url: publicUrl } : s));
      alert("อัปโหลดรูปภาพสำเร็จ!");

    } catch (error: any) {
      console.error('Error uploading image:', error.message);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setUploadingId(null); // ปิด Loading
      if (fileInputRef.current) fileInputRef.current.value = ''; // ล้างค่า input file
    }
  };

  const deleteStudentImage = async (studentId: string, imageUrl: string) => {
    if (!window.confirm("ต้องการลบรูปภาพนักเรียนคนนี้ใช่ไหม?")) return;
    
    setUploadingId(studentId);

    try {
      // 1. ลบไฟล์ใน Storage
      const filePath = imageUrl.split('/storage/v1/object/public/student-images/')[1];
      if (filePath) {
        await supabase.storage.from('student-images').remove([filePath]);
      }

      // 2. อัปเดต DB ให้ image_url เป็น null
      await supabase.from('students').update({ image_url: null }).eq('id', studentId);

      // 3. อัปเดต State หน้าจอ
      setStudents(students.map(s => s.id === studentId ? { ...s, image_url: null } : s));
      alert("ลบรูปภาพสำเร็จ!");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบรูปภาพ");
    } finally {
      setUploadingId(null);
    }
  };

  // --- Logic การค้นหาและคัดกรอง ---
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.parent_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isLow = filterLowHours ? s.remaining_hours <= 2 : true;
    
    return matchesSearch && isLow;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen font-sans">
      {/* Hidden File Input สำหรับ Trigger การอัปโหลด */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

      <Link href="/admin" className="flex items-center text-blue-600 mb-6 hover:underline font-medium">
        <ArrowLeft size={20} className="mr-2" /> กลับหน้าหลัก Admin
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <User className="text-blue-600" /> จัดการนักเรียน
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ หรือ อีเมล..." 
              className="pl-10 pr-4 py-2 border-2 rounded-xl outline-none focus:border-blue-400 w-full sm:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => setFilterLowHours(!filterLowHours)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              filterLowHours 
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
              : 'bg-white text-gray-600 border-2 hover:bg-gray-50'
            }`}
          >
            <AlertCircle size={18} /> {filterLowHours ? 'ดูทั้งหมด' : 'ชั่วโมงใกล้หมด'}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-transparent hover:border-blue-200 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
              
              {/* ส่วนแสดงรูปภาพและข้อมูลพื้นฐาน */}
              <div className="flex items-center gap-5 w-full md:w-auto">
                {/* Avatar / Photo */}
                <div className="relative group w-20 h-20 flex-shrink-0">
                  {uploadingId === s.id ? (
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center border-2 border-dashed">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                  ) : s.image_url ? (
                    <>
                      <img src={s.image_url} alt={s.student_name} className="w-20 h-20 rounded-3xl object-cover border-2 border-gray-100" />
                      <button onClick={() => deleteStudentImage(s.id, s.image_url)} className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition active:scale-95">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-400 border-2 border-dashed border-blue-100 group-hover:border-blue-300 transition">
                      <User size={32} />
                    </div>
                  )}
                  
                  {/* ปุ่มกล้องสำหรับอัปโหลด/เปลี่ยนรูป Overlaid บน Avatar */}
                  {uploadingId !== s.id && (
                    <button 
                      onClick={() => {
                        // Trigger file input โดยส่ง studentId และ currentImageUrl ไปด้วย
                        if (fileInputRef.current) {
                          fileInputRef.current.onchange = (e) => handleImageUpload(e as any, s.id, s.image_url);
                          fileInputRef.current.click();
                        }
                      }}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-xl p-2 shadow-lg opacity-0 group-hover:opacity-100 transition active:scale-95 hover:bg-blue-700"
                    >
                      <Camera size={16} />
                    </button>
                  )}
                </div>

                {/* ข้อมูลชื่อและอีเมล */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-2xl text-gray-800 truncate">น้อง{s.student_name}</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-0.5 truncatePolicy Definition (SQL):">
                    <Mail size={14} className="flex-shrink-0" /> <span className="truncate">{s.parent_email}</span>
                  </div>
                </div>
              </div>
              
              {/* ส่วนจัดการชั่วโมงเรียน */}
              <div className="flex items-center gap-6 w-full md:w-auto justify-between bg-gray-50 md:bg-transparent p-5 md:p-0 rounded-2xl border md:border-0 mt-2 md:mt-0">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Remaining Hours</p>
                  <div className="flex items-center gap-2 justification-end">
                    <Clock size={18} className={s.remaining_hours <= 2 ? 'text-orange-500' : 'text-blue-500'} />
                    <span className={`text-3xl font-black ${s.remaining_hours <= 2 ? 'text-orange-500' : 'text-blue-600'}`}>
                      {s.remaining_hours}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button 
                    onClick={() => updateHours(s.id, s.remaining_hours - 1)}
                    disabled={uploadingId === s.id}
                    className="w-12 h-12 flex items-center justify-center bg-white border-2 border-red-100 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-xl active:scale-95 disabled:opacity-50"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => updateHours(s.id, s.remaining_hours + 1)}
                    disabled={uploadingId === s.id}
                    className="w-12 h-12 flex items-center justify-center bg-white border-2 border-green-100 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all font-bold text-xl active:scale-95 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <Search className="mx-auto text-gray-300 mb-5" size={60} />
            <p className="text-gray-500 text-lg font-medium">ไม่พบรายชื่อนักเรียนที่ตรงกับเงื่อนไข</p>
            <p className="text-gray-400 text-sm mt-1">ลองพิมพ์ชื่ออื่น หรือยกเลิกตัวกรองดูครับ</p>
          </div>
        )}
      </div>
    </div>
  );
}
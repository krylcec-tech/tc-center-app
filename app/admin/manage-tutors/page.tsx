'use client'
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase'; 
import { 
  ArrowLeft, Trash2, BookOpen, UserPlus, Image as ImageIcon, 
  Edit2, Save, Loader2, Tag, GraduationCap, Eye, EyeOff, Mail // ✨ เพิ่ม Mail เข้ามาตรงนี้
} from 'lucide-react';
import Link from 'next/link';

// ✨ ระดับชั้นมาตรฐาน 3 ระดับ
const GRADE_LEVELS = [
  'ประถม - ม.ต้น',
  'สอบเข้า ม.4',
  'ม.ปลาย / เข้ามหาวิทยาลัย'
];

export default function ManageTutorsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState('');
  
  const [editingTutor, setEditingTutor] = useState<any>(null);
  const [tutorName, setTutorName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true); // ✨ State สำหรับซ่อน/แสดง
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: subData, error: subErr } = await supabase.from('subjects').select('*').order('name');
      if (subErr) throw subErr;
      setSubjects(subData || []);

      const { data: tutData, error: tutErr } = await supabase.from('tutors').select('*').order('name');
      if (tutErr) throw tutErr;
      setTutors(tutData || []);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    }
  };

  const uploadImage = async (file: File, oldUrl: string | null) => {
    try {
      if (oldUrl) {
        const urlParts = oldUrl.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        if (oldFileName) await supabase.storage.from('tutor-images').remove([`avatar/${oldFileName}`]);
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatar/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('tutor-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('tutor-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      throw new Error("Upload Fail: " + error.message);
    }
  };

  const toggleTag = (subjectName: string) => {
    setSelectedTags(prev => prev.includes(subjectName) ? prev.filter(t => t !== subjectName) : [...prev, subjectName]);
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]);
  };

  // ✨ ฟังก์ชัน Quick Toggle เปิด/ปิดจากรายชื่อโดยตรง
  const toggleTutorVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('tutors').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      fetchInitialData();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const handleSaveTutor = async () => {
    if (!tutorName || selectedTags.length === 0 || selectedLevels.length === 0) {
      return alert("กรุณากรอกชื่อ เลือกวิชาอย่างน้อย 1 อย่าง และเลือกระดับชั้นอย่างน้อย 1 ระดับครับ");
    }
    setLoading(true);
    try {
      let finalImageUrl = editingTutor?.image_url || null;
      if (file) finalImageUrl = await uploadImage(file, editingTutor?.image_url);

      const tutorData = {
        name: tutorName,
        tags: selectedTags, 
        grade_levels: selectedLevels,
        image_url: finalImageUrl,
        is_active: isActive, // ✨ บันทึกสถานะการซ่อน/แสดง
        role: 'tutor' 
      };

      if (editingTutor) {
        const { error } = await supabase.from('tutors').update(tutorData).eq('id', editingTutor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tutors').insert([tutorData]);
        if (error) throw error;
      }

      alert("บันทึกข้อมูลสำเร็จ! 🎉");
      resetForm();
      fetchInitialData();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingTutor(null);
    setTutorName('');
    setSelectedTags([]); 
    setSelectedLevels([]);
    setIsActive(true); // ✨ คืนค่าเริ่มต้นให้เป็นแสดงผล
    setFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-left">
      <Link href="/admin" className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-6 group w-max">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
        กลับหน้าหลัก Admin
      </Link>
      <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-8">จัดการวิชาและติวเตอร์</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* จัดการวิชา (หมวดหมู่ Tags) */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-fit sticky top-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><BookOpen size={24}/></div>
            <h2 className="text-2xl font-black text-gray-800">หมวดหมู่วิชา (Tags)</h2>
          </div>
          
          <div className="flex gap-2 mb-6">
            <input 
              placeholder="เพิ่มวิชาใหม่..."
              className="border-2 border-gray-100 p-3 rounded-2xl flex-1 focus:border-blue-400 outline-none font-bold text-sm" 
              value={newSubject} 
              onChange={(e) => setNewSubject(e.target.value)} 
            />
            <button 
              onClick={async () => {
                if(!newSubject) return;
                await supabase.from('subjects').insert([{ name: newSubject }]);
                setNewSubject('');
                fetchInitialData();
              }}
              className="bg-gray-900 text-white px-6 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-sm text-sm"
            >เพิ่ม</button>
          </div>

          <div className="flex flex-wrap gap-2">
            {subjects.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full group">
                <Tag size={14} className="text-gray-400"/>
                <span className="font-bold text-sm text-gray-700">{s.name}</span>
                <button onClick={async () => {
                  if(confirm(`ยืนยันการลบวิชา ${s.name}?`)) {
                    await supabase.from('subjects').delete().eq('id', s.id);
                    fetchInitialData();
                  }
                }} className="text-gray-300 hover:text-red-500 ml-1 transition-colors"><Trash2 size={16}/></button>
              </div>
            ))}
            {subjects.length === 0 && <p className="text-sm text-gray-400 font-bold w-full text-center py-4">ยังไม่มีวิชาในระบบ</p>}
          </div>
        </div>

        {/* จัดการติวเตอร์ */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600"><UserPlus size={24}/></div>
            <h2 className="text-2xl font-black text-gray-800">{editingTutor ? 'แก้ไขข้อมูลติวเตอร์' : 'เพิ่มติวเตอร์ใหม่'}</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl overflow-hidden flex items-center justify-center hover:border-blue-400 transition-colors cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={32}/>}
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if(f) { setFile(f); setPreviewUrl(URL.createObjectURL(f)); }
                }} />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ชื่อติวเตอร์</label>
                <input 
                  placeholder="เช่น พี่ปัน" 
                  className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-blue-400 outline-none font-black text-lg text-gray-800 transition-all" 
                  value={tutorName} 
                  onChange={(e) => setTutorName(e.target.value)} 
                />
              </div>
            </div>

            {/* ✨ สวิตช์สำหรับกำหนดสถานะ ซ่อน/แสดง */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between">
              <div>
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  {isActive ? <Eye size={14} className="text-green-500"/> : <EyeOff size={14} className="text-red-500"/>} 
                  การแสดงผลบนหน้าเว็บไซต์
                </label>
                <p className="text-xs font-bold text-gray-400">{isActive ? 'นักเรียนทุกคนสามารถมองเห็นติวเตอร์คนนี้ได้' : 'ซ่อนโปรไฟล์นี้ไว้ (เฉพาะแอดมินที่เห็น)'}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ease-in-out ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* โซนเลือกระดับชั้น (Grade Levels) */}
            <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100">
              <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><GraduationCap size={14}/> ระดับชั้นที่รับสอน</label>
              <div className="flex flex-wrap gap-2">
                {GRADE_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all active:scale-95 flex items-center gap-1.5
                      ${selectedLevels.includes(level) 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* โซนเลือก Tags วิชา */}
            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><BookOpen size={14}/> เลือกวิชาที่สอน (Tags)</label>
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleTag(s.name)}
                    className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all active:scale-95 flex items-center gap-1.5
                      ${selectedTags.includes(s.name) 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <button 
              disabled={loading}
              onClick={handleSaveTutor}
              className="w-full bg-green-500 text-white p-5 rounded-2xl font-black text-lg hover:bg-green-600 shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300"
            >
              {loading ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลติวเตอร์'}
            </button>
            
            {editingTutor && (
               <button onClick={resetForm} className="w-full py-2 text-gray-400 font-bold hover:text-red-500 transition-colors">ยกเลิกการแก้ไข</button>
            )}
          </div>

          <hr className="my-10 border-gray-100" />

          {/* รายชื่อติวเตอร์ */}
          <div>
            <h3 className="font-black text-xl mb-6 text-gray-800">รายชื่อติวเตอร์ในระบบ</h3>
            <div className="grid grid-cols-1 gap-4">
              {tutors.map(t => (
                <div key={t.id} className={`flex flex-col md:flex-row items-start justify-between p-5 bg-white border-2 border-gray-50 rounded-[2rem] hover:border-blue-100 hover:shadow-sm transition-all group gap-4 ${t.is_active === false ? 'opacity-60 bg-gray-50' : ''}`}>
                  <div className="flex items-start gap-5">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 bg-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        {t.image_url ? <img src={t.image_url} className={`w-full h-full object-cover ${t.is_active === false ? 'grayscale' : ''}`} /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><UserPlus size={24}/></div>}
                      </div>
                      {/* ✨ ป้ายบอกสถานะการซ่อน */}
                      {t.is_active === false && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase shadow-md border-2 border-white">
                          ซ่อนอยู่
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-gray-900 mb-1 flex items-center gap-2">
                        {t.name}
                        {t.is_active === false && <EyeOff size={14} className="text-red-500"/>}
                      </h4>
                      
                      {/* ✨ เพิ่มส่วนแสดง Email ของติวเตอร์ตรงนี้ */}
                      {t.email && (
                        <p className="text-[11px] text-gray-500 font-bold flex items-center gap-1 mb-2">
                          <Mail size={12} className="text-gray-400" /> {t.email}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(t.grade_levels || []).map((level: string) => (
                          <span key={level} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-lg uppercase tracking-wide border border-purple-100">
                            {level}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(t.tags || []).map((tag: string) => (
                          <span key={tag} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-wide">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* ปุ่ม Action ต่างๆ */}
                  <div className="flex gap-2 w-full md:w-auto justify-end md:self-center">
                    {/* ✨ ปุ่ม Quick Toggle ซ่อน/แสดง */}
                    <button onClick={() => toggleTutorVisibility(t.id, t.is_active !== false)} 
                      className={`p-3 rounded-xl transition-colors ${t.is_active !== false ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-600 hover:text-white'}`}
                      title={t.is_active !== false ? "ซ่อนติวเตอร์" : "แสดงติวเตอร์"}
                    >
                      {t.is_active !== false ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>

                    <button onClick={() => {
                      setEditingTutor(t);
                      setTutorName(t.name);
                      setSelectedTags(t.tags || []); 
                      setSelectedLevels(t.grade_levels || []);
                      setIsActive(t.is_active !== false); // โหลดสถานะเดิม
                      setPreviewUrl(t.image_url);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"><Edit2 size={18}/></button>
                    
                    <button onClick={async () => {
                      if(confirm(`ยืนยันการลบ ${t.name}?`)) {
                        await supabase.from('tutors').delete().eq('id', t.id);
                        fetchInitialData();
                      }
                    }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
              {tutors.length === 0 && <p className="text-center py-10 text-gray-400 font-bold border-2 border-dashed rounded-[2rem]">ยังไม่มีข้อมูลติวเตอร์</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
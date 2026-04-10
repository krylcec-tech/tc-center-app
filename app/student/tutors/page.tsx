'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, PlayCircle, X, ChevronRight, 
  Users, GraduationCap, Star, BookOpen, Loader2, 
  ArrowLeft, Video
} from 'lucide-react';
import Link from 'next/link';

export default function TutorsCatalogPage() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State สำหรับ Video Modal
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const subjects = ['ทั้งหมด', 'คณิตศาสตร์', 'ภาษาอังกฤษ', 'วิทยาศาสตร์', 'ฟิสิกส์', 'เคมี', 'ชีววิทยา', 'ภาษาไทย' , 'คอร์สพิเศษ'];

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    setLoading(true);
    // ✨ ดึงเฉพาะติวเตอร์ที่ไม่ได้ถูกซ่อน (is_active ไม่เท่ากับ false)
    const { data } = await supabase
      .from('tutors')
      .select('*')
      .neq('is_active', false) // เพิ่มบรรทัดนี้เพื่อกรองคนถูกซ่อนออก
      .order('created_at', { ascending: false });
    
    setTutors(data || []);
    setLoading(false);
  };

  // ฟังก์ชันกรองติวเตอร์ตามวิชาและช่องค้นหา
  const filteredTutors = tutors.filter(t => {
    const matchSubject = activeSubject === 'ทั้งหมด' || t.tags?.includes(activeSubject);
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (t.bio && t.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubject && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12 font-sans text-gray-900 text-left">
      
      {/* --- Video Modal --- */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-2 rounded-[2rem] w-full max-w-4xl relative shadow-2xl">
            <button 
              onClick={() => setSelectedVideo(null)} 
              className="absolute -top-12 right-0 md:-right-12 text-white bg-white/20 hover:bg-white/40 p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>
            <div className="aspect-video w-full rounded-[1.5rem] overflow-hidden bg-black">
              <iframe 
                src={selectedVideo.replace('view', 'preview')} 
                className="w-full h-full" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link href="/student" className="text-blue-600 font-black text-sm uppercase mb-4 flex items-center gap-2 group w-max hover:underline">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าหลัก
            </Link>
            <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
              <Users className="text-blue-600" size={36}/> ทำเนียบติวเตอร์
            </h1>
            <p className="text-gray-400 font-bold">ค้นหาติวเตอร์ที่ใช่ สำหรับการเรียนของคุณ</p>
          </div>
          
          {/* ช่องค้นหาชื่อ */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อติวเตอร์..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 font-bold transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* ตัวกรองรายวิชา */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-4 w-full no-scrollbar">
          {subjects.map(sub => (
            <button 
              key={sub} 
              onClick={() => setActiveSubject(sub)}
              className={`px-6 py-3 rounded-full text-xs font-black transition-all whitespace-nowrap border-2 flex items-center gap-2 shadow-sm
                ${activeSubject === sub 
                  ? 'bg-blue-600 border-blue-600 text-white scale-105' 
                  : sub === 'คอร์สพิเศษ' 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200 text-orange-600 hover:border-orange-400' 
                    : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200'}`}
            >
              {sub === 'คอร์สพิเศษ' && <Star size={14} className={activeSubject === sub ? "text-white" : "text-orange-500"} />}
              {sub}
            </button>
          ))}
        </div>

        {/* รายชื่อติวเตอร์ */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-blue-600">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-black text-sm uppercase tracking-widest animate-pulse">กำลังโหลดข้อมูลติวเตอร์...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {filteredTutors.map(tutor => (
              <div key={tutor.id} className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                
                {/* รูปภาพ และ ปุ่ม Video */}
                <div className="h-72 bg-gray-100 relative overflow-hidden">
                  <img src={tutor.image_url || '/default-avatar.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  
                  {/* เลเยอร์ไล่สีดำด้านล่างรูป */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                  
                  {tutor.video_url && (
                    <button 
                      onClick={() => setSelectedVideo(tutor.video_url)}
                      className="absolute top-4 right-4 bg-white/90 backdrop-blur text-blue-600 p-3 rounded-full shadow-lg hover:scale-110 hover:bg-blue-600 hover:text-white transition-all z-10"
                      title="ดูวิดีโอแนะนำตัว"
                    >
                      <PlayCircle size={24} />
                    </button>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 flex gap-1.5 flex-wrap z-10">
                    {tutor.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className={`backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-sm border
                        ${tag === 'คอร์สพิเศษ' ? 'bg-orange-500/90 text-white border-orange-400' : 'bg-white/90 text-blue-600 border-blue-50'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ข้อมูลติวเตอร์ */}
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-black mb-2 text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    {tutor.name}
                  </h3>
                  
                  {/* ระดับชั้นที่สอน */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tutor.grade_levels?.map((gl: string) => (
                      <span key={gl} className="text-[9px] font-black bg-gray-50 text-gray-400 px-2 py-1 rounded-md uppercase border border-gray-100">
                        {gl}
                      </span>
                    ))}
                  </div>

                  <p className="text-gray-500 text-xs font-bold italic line-clamp-3 leading-relaxed mb-6">
                    "{tutor.bio || 'ติวเตอร์คุณภาพระดับพรีเมียมจาก TC Center พร้อมดูแลการเรียนของน้องๆ อย่างใกล้ชิด'}"
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
                    {tutor.video_url ? (
                      <button 
                        onClick={() => setSelectedVideo(tutor.video_url)}
                        className="w-full bg-blue-50 text-blue-600 py-3.5 rounded-2xl font-black text-xs hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Video size={16}/> ดูวิดีโอ
                      </button>
                    ) : (
                      <div className="w-full bg-gray-50 text-gray-400 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                        ไม่มีวิดีโอ
                      </div>
                    )}
                    <Link 
                      href="/student/booking-flow"
                      className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      จองคิวเรียน
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* กรณีค้นหาแล้วไม่เจอ */}
            {!loading && filteredTutors.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <Search size={48} className="mb-4 opacity-50" />
                <p className="font-black text-lg text-gray-300">ไม่พบติวเตอร์ที่ตรงกับการค้นหา</p>
                <button onClick={() => { setActiveSubject('ทั้งหมด'); setSearchQuery(''); }} className="mt-4 text-blue-500 font-bold hover:underline">
                  ล้างการค้นหา
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
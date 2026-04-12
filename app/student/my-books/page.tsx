'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Book, Loader2, ExternalLink, Image as ImageIcon, Search, BookOpen, Filter, Tag, Layers, Sparkles, Trash2, MessageCircle, AlertTriangle, X, Store // ✨ นำเข้าไอคอน Store เพิ่มเติม
} from 'lucide-react';
import Link from 'next/link';

export default function MyBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(true); 
  
  const [activeSource, setActiveSource] = useState<'ALL' | 'SHOP' | 'STUDY' | 'REWARD'>('ALL');
  const [activeSubject, setActiveSubject] = useState('ALL');
  const [activeLevel, setActiveLevel] = useState('ALL');

  const subjects = ['คณิตศาสตร์', 'ภาษาอังกฤษ', 'ภาษาไทย', 'สังคมศึกษา', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'ประวัติศาสตร์'];
  const levels = ['ประถม', 'ม.ต้น', 'ม.ปลาย', 'มหาวิทยาลัย'];

  useEffect(() => { fetchMyBooks(); }, []);

  const fetchMyBooks = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBooks(data || []);
    } catch (err: any) {
      console.error("Error fetching books:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (id: string, title: string) => {
    const confirm1 = confirm(`❓ คุณแน่ใจนะว่าจะลบ "${title}" ?`);
    if (confirm1) {
      const confirm2 = confirm(`⚠️ คำเตือนสุดท้าย: หนังสือจะหายไปจากคลังถาวรและกู้คืนเองไม่ได้ ยืนยันการลบ?`);
      if (confirm2) {
        setDeletingId(id);
        try {
          const { error } = await supabase.from('user_books').delete().eq('id', id);
          
          if (error) throw error;

          setBooks((prev) => prev.filter(book => book.id !== id));
          
          alert('🗑️ ลบหนังสือออกจากคลังเรียบร้อยแล้ว');
        } catch (err: any) {
          alert('เกิดข้อผิดพลาด: ' + err.message + ' (โปรดเช็ก RLS Policy ใน Supabase)');
        } finally {
          setDeletingId(null);
        }
      }
    }
  };

  const filteredBooks = books.filter(book => {
    const matchSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSource = activeSource === 'ALL' || book.source_type === activeSource;
    const matchSubject = activeSubject === 'ALL' || book.subject === activeSubject;
    const matchLevel = activeLevel === 'ALL' || book.level === activeLevel;
    return matchSearch && matchSource && matchSubject && matchLevel;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]"><Loader2 className="animate-spin text-orange-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#FFFBF7] pb-32 font-sans text-gray-900 overflow-x-hidden relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* 🌟 Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 pt-8 pb-20 md:pb-24 px-6 relative border-b-4 border-orange-700/20 text-left">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-6xl mx-auto relative z-10 text-left">
          <div className="flex justify-between items-start mb-6">
            <Link href="/student" className="inline-flex items-center gap-2 text-white font-black text-[10px] md:text-xs uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full backdrop-blur-md hover:bg-black/30 transition-all shadow-md">
              <ArrowLeft size={14} /> กลับห้องเรียน
            </Link>
            {/* ✨ เพิ่มปุ่มระบบขายชีทตรงนี้ (ฝั่งขวาบน) */}
            <Link href="/student/seller-hub" className="inline-flex items-center gap-2 bg-white text-orange-600 font-black text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 rounded-full hover:scale-105 transition-all shadow-lg active:scale-95">
              <Store size={14} /> ระบบขายชีท
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-left">
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-lg leading-none mb-2">
                MY BOOKS <span className="text-orange-200">📖</span>
              </h1>
              <p className="text-orange-100 font-bold text-xs md:text-sm tracking-wide opacity-90 text-left">คลังเอกสารเรียนรู้ส่วนตัวของคุณ</p>
            </div>
            <div className="relative w-full md:w-80 group flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-200" size={18} />
                <input 
                  type="text" placeholder="ค้นหาชื่อหนังสือ..." 
                  className="pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-sm font-bold text-white placeholder:text-orange-200 focus:bg-white focus:text-orange-600 outline-none w-full transition-all shadow-lg"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
        {/* 🔍 Filter Bar */}
        <div className="bg-white p-2 md:p-3 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-white mb-10">
          <div className="flex flex-col gap-4">
            <div className="flex overflow-x-auto gap-1 hide-scrollbar scroll-pl-2 px-2">
              {[
                { id: 'ALL', label: 'ทั้งหมด', icon: Layers },
                { id: 'SHOP', label: 'ร้านค้า', icon: Tag },
                { id: 'STUDY', label: 'การเรียน', icon: BookOpen },
                { id: 'REWARD', label: 'การแลก', icon: Sparkles }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveSource(tab.id as any)} className={`px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 ${activeSource === tab.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' : 'bg-transparent text-gray-400 hover:bg-orange-50 hover:text-orange-500'}`}>
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-50 pt-4 px-2">
              <div className="bg-orange-50 p-2 rounded-lg"><Filter size={12} className="text-orange-500" /></div>
              <select value={activeSubject} onChange={(e) => setActiveSubject(e.target.value)} className="bg-gray-50 px-4 py-2 rounded-xl text-[11px] font-black border-none outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer">
                <option value="ALL">ทุกวิชา</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={activeLevel} onChange={(e) => setActiveLevel(e.target.value)} className="bg-gray-50 px-4 py-2 rounded-xl text-[11px] font-black border-none outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer">
                <option value="ALL">ทุกระดับ</option>
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {(activeSubject !== 'ALL' || activeLevel !== 'ALL') && (
                <button onClick={() => {setActiveSubject('ALL'); setActiveLevel('ALL');}} className="text-[10px] font-black text-red-500 px-3 hover:underline">Reset</button>
              )}
            </div>
          </div>
        </div>

        {/* 📚 Book Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBooks.length === 0 ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center">
               <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 text-orange-500 animate-pulse"><BookOpen size={48} /></div>
               <p className="text-gray-400 font-black text-xl tracking-tight">ไม่พบหนังสือที่คุณต้องการ</p>
            </div>
          ) : (
            filteredBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full group hover:shadow-2xl hover:shadow-orange-200/40 hover:-translate-y-2 transition-all duration-500 overflow-hidden relative text-left">
                
                <div className="h-52 bg-orange-100 relative overflow-hidden">
                  {book.image_url ? (
                    <img src={book.image_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-300"><ImageIcon size={48}/></div>
                  )}
                  <div className="absolute top-4 left-4 bg-orange-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black shadow-lg flex items-center gap-1.5 uppercase tracking-tighter">
                    <Tag size={10}/> {book.subject}
                  </div>
                </div>
                
                <div className="p-7 flex-1 flex flex-col text-left">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                      book.source_type === 'SHOP' ? 'bg-blue-100 text-blue-600' :
                      book.source_type === 'STUDY' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                    }`}>{book.source_type}</span>
                    <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">{book.level}</span>
                  </div>
                  <h3 className="font-black text-lg text-gray-800 leading-tight mb-2 group-hover:text-orange-600 transition-colors line-clamp-2 text-left">{book.title}</h3>
                  <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed mb-6 text-left">{book.description || 'เอกสารคุณภาพจาก TC Center Academy'}</p>
                  
                  <div className="mt-auto flex gap-2">
                    <a href={book.document_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-orange-500 text-white py-3.5 rounded-2xl font-black text-[11px] hover:bg-orange-600 hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 group/btn">
                      <span>เปิดอ่านไฟล์</span> <ExternalLink size={14}/>
                    </a>
                    <button 
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      disabled={deletingId === book.id}
                      className="bg-red-50 text-red-500 p-3.5 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                      title="ลบหนังสือ"
                    >
                      {deletingId === book.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🚩 คำเตือนซ้ายล่าง */}
      {showWarning && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-left-10 duration-500 text-left">
          <div className="bg-white/95 backdrop-blur-xl border border-orange-100 p-4 rounded-3xl shadow-2xl flex flex-col gap-2 max-w-[260px] relative shadow-orange-200/50 text-left">
            <button 
              onClick={() => setShowWarning(false)}
              className="absolute -top-2 -right-2 bg-white text-gray-400 p-1.5 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors shadow-md border"
            >
              <X size={14} />
            </button>
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle size={18} className="animate-bounce" />
              <span className="font-black text-[11px] uppercase tracking-tighter">คำเตือนสำหรับนักเรียน</span>
            </div>
            <p className="text-[10px] text-gray-500 font-bold leading-relaxed pr-2 text-left">
              หากหนังสือหายหรือเผลอกดลบผิดเล่ม กรุณาติดต่อแอดมินเพื่อขอรับหนังสือคืนได้ครับ
            </p>
            <Link 
              href="https://lin.ee/ZSDR4B3"
              target="_blank"
              className="flex items-center justify-center gap-2 bg-[#06C755] text-white py-2 rounded-xl text-[10px] font-black hover:scale-105 transition-all shadow-md mt-1"
            >
              <MessageCircle size={14} /> ติดต่อ Admin ผ่าน LINE
            </Link>
          </div>
        </div>
      )}

      <footer className="mt-20 py-12 bg-white text-center border-t border-orange-50">
        <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest opacity-50">The Convergence of Academic Excellence</p>
      </footer>
    </div>
  );
}
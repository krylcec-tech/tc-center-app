'use client'
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Search, Book, User, Loader2, Trash2, ArrowLeft, ExternalLink, 
  Share2, Mail, X, ImagePlus, ImageIcon, CheckCircle2, Save, Tag, GraduationCap, AlertCircle, Filter, Layers, BookOpen, Store, DollarSign, Upload, Edit, Info // ✨ เพิ่ม Info icon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TutorMySheets() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mySheets, setMySheets] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  
  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [sharingSheet, setSharingSheet] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [sharingToId, setSharingToId] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubject, setActiveSubject] = useState('ALL');
  const [activeLevel, setActiveLevel] = useState('ALL');

  // Form States (เพิ่ม/แก้ไขชีทส่วนตัว)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('คณิตศาสตร์');
  const [level, setLevel] = useState('ม.ปลาย');
  const [docUrl, setDocUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const subjects = ['คณิตศาสตร์', 'ภาษาอังกฤษ', 'ภาษาไทย', 'สังคมศึกษา', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'ประวัติศาสตร์', 'ทุกวิชา'];
  const levels = ['ประถม', 'ม.ต้น', 'ม.ปลาย', 'มหาวิทยาลัย'];

  useEffect(() => { fetchTutorData(); }, []);

  const fetchTutorData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: sheets } = await supabase.from('tutor_sheets').select('*').eq('tutor_id', user.id).order('created_at', { ascending: false });
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
      setMySheets(sheets || []);
      setAllStudents(profiles || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setSubject('คณิตศาสตร์');
    setLevel('ม.ปลาย');
    setDocUrl('');
    setSelectedFile(null);
    setCurrentImageUrl('');
  };

  const handleEditClick = (sheet: any) => {
    setEditingId(sheet.id);
    setTitle(sheet.title);
    setDescription(sheet.description || '');
    setSubject(sheet.subject);
    setLevel(sheet.level);
    setDocUrl(sheet.document_url);
    setCurrentImageUrl(sheet.image_url || '');
    setSelectedFile(null);
    setShowAddModal(true);
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm('🚨 ยืนยันการลบเอกสารนี้? (ลบแล้วไม่สามารถกู้คืนได้)')) return;
    try {
      const { error } = await supabase.from('tutor_sheets').delete().eq('id', id);
      if (error) throw error;
      alert('🗑️ ลบเอกสารเรียบร้อยครับ');
      fetchTutorData();
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let finalImgUrl = undefined;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_tutor.${fileExt}`;
        await supabase.storage.from('rewards').upload(`sheets/${fileName}`, selectedFile);
        const { data: { publicUrl } } = supabase.storage.from('rewards').getPublicUrl(`sheets/${fileName}`);
        finalImgUrl = publicUrl;
      }

      const payload: any = { title, description, subject, level, document_url: docUrl };
      if (finalImgUrl) payload.image_url = finalImgUrl;

      if (editingId) {
        const { error } = await supabase.from('tutor_sheets').update(payload).eq('id', editingId);
        if (error) throw error;
        alert('🟢 แก้ไขข้อมูลเรียบร้อย!');
      } else {
        payload.tutor_id = user?.id;
        const { error } = await supabase.from('tutor_sheets').insert([payload]);
        if (error) throw error;
        alert('🟠 บันทึกเข้าคลังเรียบร้อย!');
      }

      resetForm();
      setShowAddModal(false);
      fetchTutorData();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDirectShare = async () => {
    if (!sharingToId) return alert('กรุณาเลือกนักเรียนก่อนครับ');
    setSaving(true);
    try {
      const { error } = await supabase.from('user_books').insert([{
        user_id: sharingToId,
        title: sharingSheet.title,
        description: sharingSheet.description,
        subject: sharingSheet.subject,
        level: sharingSheet.level,
        document_url: sharingSheet.document_url,
        image_url: sharingSheet.image_url,
        source_type: 'STUDY' 
      }]);
      if (error) throw error;
      alert(`🚀 แชร์ให้นักเรียนสำเร็จ!`);
      setSharingSheet(null); setSharingToId(''); setStudentSearch('');
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const filteredSheets = mySheets.filter(sheet => {
    const matchSearch = sheet.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = activeSubject === 'ALL' || sheet.subject === activeSubject;
    const matchLevel = activeLevel === 'ALL' || sheet.level === activeLevel;
    return matchSearch && matchSubject && matchLevel;
  });

  const filteredStudents = allStudents.filter(s => 
    s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]"><Loader2 className="animate-spin text-orange-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-sans text-gray-900 pb-20 text-left relative overflow-x-hidden">
      
      {/* 🌟 Header Gradient */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 pt-12 pb-24 px-6 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4"> 
            <Link href="/tutor" className="inline-flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest bg-black/20 px-4 py-2.5 rounded-full backdrop-blur-md hover:bg-black/30 transition-all">
              <ArrowLeft size={14} /> Dashboard
            </Link>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button 
                onClick={() => { resetForm(); setShowAddModal(true); }} 
                className="flex-1 md:flex-none bg-white/20 text-white px-5 py-3 rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 hover:bg-white/30 backdrop-blur-md transition-all border border-white/20 active:scale-95"
              >
                <Plus size={18} strokeWidth={3}/> 
                <span>เพิ่มชีทส่วนตัว</span>
              </button>
              
              <Link 
                href="/tutor/seller-hub" 
                className="flex-1 md:flex-none bg-white text-orange-600 px-6 py-3 rounded-2xl font-black text-[13px] shadow-[0_10px_25px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 hover:scale-105 transition-all active:scale-95 border-b-4 border-orange-200"
              >
                <Store size={18} strokeWidth={3} className="text-orange-500"/> 
                <span>ลงขายชีททำเงิน 💸</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-lg leading-none mb-2 text-left">MY PLAYLIST <span className="text-orange-200">📂</span></h1>
              <p className="text-orange-100 font-bold text-sm tracking-wide opacity-90 text-left">คลังชีทส่วนตัวและระบบแชร์เอกสารให้นักเรียน</p>
            </div>
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-200" size={18} />
              <input 
                type="text" placeholder="ค้นหาชื่อชีทในคลัง..." 
                className="pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-sm font-bold text-white placeholder:text-orange-200 focus:bg-white focus:text-orange-600 outline-none w-full transition-all shadow-lg"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-10 relative z-20">
        <div className="bg-white p-2 md:p-3 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-white mb-10">
          <div className="flex flex-wrap items-center gap-2 px-2 py-1">
            <div className="bg-orange-50 p-2 rounded-lg"><Filter size={14} className="text-orange-500" /></div>
            <select value={activeSubject} onChange={(e) => setActiveSubject(e.target.value)} className="bg-gray-50 px-4 py-2 rounded-xl text-[11px] font-black border-none outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer">
              <option value="ALL">ทุกวิชา</option>
              {subjects.filter(s => s !== 'ทุกวิชา').map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={activeLevel} onChange={(e) => setActiveLevel(e.target.value)} className="bg-gray-50 px-4 py-2 rounded-xl text-[11px] font-black border-none outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer">
              <option value="ALL">ทุกระดับ</option>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {filteredSheets.map(sheet => (
            <div key={sheet.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden group hover:shadow-2xl hover:shadow-orange-200/40 hover:-translate-y-2 transition-all duration-500 text-left relative">
              <div className="h-48 bg-orange-100 relative">
                {sheet.image_url ? <img src={sheet.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-orange-200"><ImageIcon size={48}/></div>}
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg"><Tag size={10}/><span className="text-[9px] font-black uppercase">{sheet.subject}</span></div>
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => handleEditClick(sheet)} className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-md text-blue-600 rounded-full hover:bg-white hover:scale-110 transition-all shadow-md">
                    <Edit size={14}/>
                  </button>
                  <button onClick={() => handleDeleteSheet(sheet.id)} className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-md text-red-600 rounded-full hover:bg-red-500 hover:text-white hover:scale-110 transition-all shadow-md">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>

              <div className="p-7 flex-1 flex flex-col text-left">
                <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-max mb-2">{sheet.level}</span>
                <h3 className="font-black text-xl text-gray-800 leading-tight mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">{sheet.title}</h3>
                <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed mb-6 h-8 text-left">{sheet.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                <div className="mt-auto space-y-2">
                  <a href={sheet.document_url} target="_blank" className="w-full py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"><ExternalLink size={14}/> เปิดอ่านชีท</a>
                  <button onClick={() => setSharingSheet(sheet)} className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-95"><Share2 size={14}/> แชร์ให้นักเรียน</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ➕ Modal เพิ่ม/แก้ไขชีทส่วนตัว */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-8 md:p-10 relative shadow-2xl overflow-y-auto max-h-[90vh] text-left" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors"><X size={28}/></button>
            <h2 className="text-3xl font-black mb-2 text-gray-900 text-left">
              {editingId ? 'แก้ไขข้อมูลชีท ✏️' : 'เพิ่มชีทส่วนตัว 📚'}
            </h2>
            
            {/* ✨ ✨ ✨ แถบคำอธิบาย (Instruction Box) ✨ ✨ ✨ */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 flex items-start gap-3">
              <div className="bg-blue-600 text-white p-1.5 rounded-xl shrink-0"><Info size={16}/></div>
              <div>
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">ขั้นตอนการเตรียมลิงก์เอกสาร:</h4>
                <ol className="text-[11px] font-bold text-gray-600 space-y-1 list-decimal ml-4">
                  <li>อัปโหลดไฟล์ PDF/เอกสาร ลงใน <span className="text-blue-700">Google Drive</span> ส่วนตัวของคุณ</li>
                  <li>ตั้งค่าการแชร์ไฟล์เป็น <span className="text-blue-700">"ทุกคนที่มีลิงก์" (Anyone with the link)</span></li>
                  <li>คัดลอกลิงก์นั้นมาวางในช่อง <span className="text-blue-700">"Link เอกสาร"</span> ด้านล่างนี้ครับ</li>
                </ol>
              </div>
            </div>

            <form onSubmit={handleSaveSheet} className="space-y-5">
              <div className="relative h-44 border-2 border-dashed border-orange-100 rounded-3xl p-4 text-center bg-orange-50/30 flex flex-col items-center justify-center group hover:border-orange-400 transition-all cursor-pointer overflow-hidden text-left">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-left" />
                {selectedFile ? (
                  <img src={URL.createObjectURL(selectedFile)} className="h-full w-full object-contain rounded-lg" />
                ) : currentImageUrl ? (
                  <img src={currentImageUrl} className="h-full w-full object-contain rounded-lg opacity-80" />
                ) : (
                  <>
                    <ImagePlus size={40} className="text-orange-300 mb-2 group-hover:scale-110 transition-transform"/>
                    <p className="text-xs font-black text-orange-400 uppercase tracking-tighter">อัปโหลดรูปปกชีท</p>
                  </>
                )}
              </div>

              <input required type="text" placeholder="ชื่อชีท / หัวข้อ..." className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-base border-2 border-transparent focus:border-orange-400" value={title} onChange={(e) => setTitle(e.target.value)} />
              
              <div className="grid grid-cols-2 gap-4">
                <select className="px-5 py-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-orange-400 cursor-pointer" value={subject} onChange={(e) => setSubject(e.target.value)}>{subjects.filter(s => s !== 'ทุกวิชา').map(s => <option key={s} value={s}>{s}</option>)}</select>
                <select className="px-5 py-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-orange-400 cursor-pointer" value={level} onChange={(e) => setLevel(e.target.value)}>{levels.map(l => <option key={l} value={l}>{l}</option>)}</select>
              </div>

              <textarea rows={3} placeholder="รายละเอียดเพิ่มเติม..." className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-orange-400 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.1em] ml-1">วาง Link จาก Google Drive ที่นี่:</label>
                <input required type="url" placeholder="https://drive.google.com/..." className="w-full px-6 py-4 bg-blue-50/50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-blue-400 text-blue-600 shadow-inner" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
              </div>
              
              <button disabled={saving} className="w-full py-5 bg-orange-500 text-white rounded-[1.5rem] font-black text-lg hover:bg-orange-600 flex items-center justify-center gap-2 shadow-xl shadow-orange-200 active:scale-95 transition-all">
                {saving ? <Loader2 className="animate-spin" /> : <Save size={24}/>} 
                {saving ? 'กำลังบันทึก...' : (editingId ? 'บันทึกการแก้ไข' : 'บันทึกเข้า Playlist')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🤝 Modal แชร์ให้นักเรียน (คงเดิม) */}
      {sharingSheet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-8 relative shadow-2xl flex flex-col max-h-[90vh] text-left" onClick={e => e.stopPropagation()}>
            <button onClick={() => {setSharingSheet(null); setSharingToId(''); setStudentSearch('');}} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors z-10"><X size={28}/></button>
            <div className="text-center mb-6 shrink-0">
              <div className="w-20 h-20 bg-orange-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-orange-600 shadow-inner rotate-3"><Share2 size={36}/></div>
              <h3 className="text-2xl font-black text-gray-900 leading-tight">ส่งชีทให้นักเรียน</h3>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">ITEM: {sharingSheet.title}</p>
            </div>

            <div className="space-y-6 flex-1 flex flex-col overflow-hidden text-left">
              <div className="relative shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300" size={20}/>
                <input type="text" placeholder="ค้นชื่อนักเรียน หรือ Gmail..." className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-[1.5rem] outline-none border-2 border-transparent focus:border-orange-400 font-bold text-sm" value={studentSearch} onChange={(e) => { setStudentSearch(e.target.value); setSharingToId(''); }} />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar border-y border-gray-50 py-4 min-h-[200px] text-left">
                {studentSearch.length < 3 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 py-10">
                    <User size={32} className="text-gray-200" />
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">พิมพ์อย่างน้อย 3 ตัวอักษร</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                    <AlertCircle className="mx-auto text-red-300 mb-1" size={24}/>
                    <p className="text-gray-400 text-[11px] font-bold">ไม่พบรายชื่อนักเรียนนี้</p>
                  </div>
                ) : (
                  filteredStudents.map(student => (
                    <button key={student.id} onClick={() => setSharingToId(student.id)} className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border-2 shrink-0 ${sharingToId === student.id ? 'border-orange-500 bg-orange-50 shadow-md scale-[1.02]' : 'border-gray-50 hover:border-orange-200 bg-white'}`}>
                      <div className="flex items-center gap-3 overflow-hidden text-left">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shrink-0 ${sharingToId === student.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {student.full_name?.charAt(0)}
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="font-black text-sm text-gray-900 leading-tight truncate">{student.full_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold truncate">{student.email}</p>
                        </div>
                      </div>
                      {sharingToId === student.id && <CheckCircle2 className="text-orange-600 shrink-0" size={24}/>}
                    </button>
                  ))
                )}
              </div>

              <button onClick={handleDirectShare} disabled={!sharingToId || saving} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 shrink-0">
                {saving ? <Loader2 className="animate-spin"/> : <Share2 size={20}/>} 
                {saving ? 'กำลังแชร์...' : 'ยืนยันการส่งชีท'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
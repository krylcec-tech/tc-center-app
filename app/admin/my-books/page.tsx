'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Search, Book, User, Loader2, Trash2, ArrowLeft, ExternalLink, Globe, Mail, X, ImagePlus, ImageIcon
} from 'lucide-react';
import Link from 'next/link';

export default function AdminManageBooks() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Form States
  const [selectedUserId, setSelectedUserId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('คณิตศาสตร์');
  const [level, setLevel] = useState('ม.ปลาย');
  const [sourceType, setSourceType] = useState('STUDY');
  const [docUrl, setDocUrl] = useState('');
  const [imgUrl, setImgUrl] = useState(''); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const subjects = ['คณิตศาสตร์', 'ภาษาอังกฤษ', 'ภาษาไทย', 'สังคมศึกษา', 'เคมี', 'ฟิสิกส์', 'ชีววิทยา', 'ประวัติศาสตร์', 'ทั่วไป'];
  const levels = ['ประถม', 'ม.ต้น', 'ม.ปลาย', 'มหาวิทยาลัย'];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
      const { data: books } = await supabase.from('user_books').select('*').order('created_at', { ascending: false });
      setUsers(profiles || []);
      setAllBooks(books || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return alert('กรุณาเลือกนักเรียนก่อนครับ');
    setSaving(true);
    
    try {
      let finalImgUrl = imgUrl;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_book.${fileExt}`;
        const filePath = `book_covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('rewards')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('rewards')
          .getPublicUrl(filePath);
        
        finalImgUrl = publicUrl;
      }

      const { error } = await supabase.from('user_books').insert([{
        user_id: selectedUserId,
        title, 
        description, 
        subject, 
        level,
        source_type: sourceType,
        document_url: docUrl,
        image_url: finalImgUrl
      }]);

      if (error) throw error;
      
      alert('🎁 เพิ่มหนังสือเข้าคลังนักเรียนเรียบร้อย!');
      setTitle(''); setDescription(''); setDocUrl(''); setImgUrl('');
      setSelectedFile(null);
      fetchData();
    } catch (err: any) { 
      alert('เกิดข้อผิดพลาด: ' + err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบหนังสือเล่มนี้ออกจากคลังนักเรียน?')) return;
    try {
      const { error } = await supabase.from('user_books').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 text-left">
        <header>
          <Link href="/admin" className="text-gray-400 font-bold text-xs uppercase mb-4 flex items-center gap-2 hover:text-blue-600 transition-all w-max bg-white px-4 py-2 rounded-xl border shadow-sm">
            <ArrowLeft size={16}/> Dashboard
          </Link>
          <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3">
            จัดการคลังหนังสือรายคน <Book className="text-blue-600" />
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-800">
                <Plus size={20} className="text-green-500"/> เพิ่มหนังสือใหม่
              </h2>
              
              <form onSubmit={handleAddBook} className="space-y-4">
                
                {/* 🔍 ส่วนเลือกนักเรียน: คืนชีพ Gmail ในช่องเลือกแล้วครับ! */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1">
                    <User size={12}/> ค้นหาและเลือกนักเรียน
                  </label>
                  <input 
                    type="text"
                    placeholder="พิมพ์ชื่อ หรือ Gmail เพื่อกรอง..."
                    className="w-full px-4 py-2 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-blue-400 font-bold text-xs transition-all mb-1"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                  <select 
                    required
                    className="w-full px-4 py-3 bg-blue-50/50 rounded-xl outline-none border border-blue-100 focus:border-blue-400 font-bold text-sm" 
                    value={selectedUserId} 
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">-- เลือกนักเรียน ({filteredUsers.length} คน) --</option>
                    {filteredUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1">
                    <ImagePlus size={12}/> รูปปกหนังสือ
                  </label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-blue-400 transition-all bg-gray-50 group cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <img src={URL.createObjectURL(selectedFile)} className="h-20 w-16 object-cover rounded-lg shadow-md mb-2" />
                        <p className="text-[10px] font-bold text-blue-600 uppercase">เปลี่ยนรูปภาพ</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-2">
                        <ImagePlus size={24} className="text-gray-300 mb-1" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase">อัปโหลดรูปปก</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">ชื่อหนังสือ/ชีท</label>
                  <input required type="text" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none border focus:border-blue-400 font-bold text-sm" 
                    value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น สรุปเนื้อหาเคมี ม.6" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-xs outline-none border focus:border-blue-400" value={subject} onChange={(e) => setSubject(e.target.value)}>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-xs outline-none border focus:border-blue-400" value={level} onChange={(e) => setLevel(e.target.value)}>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <select className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-xs outline-none border focus:border-blue-400" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                  <option value="STUDY">📖 ได้จากการเรียน</option>
                  <option value="SHOP">🛒 ซื้อจาก Shop</option>
                  <option value="REWARD">🎁 ได้จากการแลก</option>
                </select>

                <div>
                  <label className="text-[10px] font-black text-blue-500 uppercase ml-2">Link เอกสาร (PDF/Drive)</label>
                  <input required type="url" className="w-full px-4 py-3 bg-blue-50/50 rounded-xl outline-none border border-blue-100 focus:border-blue-400 font-bold text-sm" 
                    value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://..." />
                </div>

                <button disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="animate-spin" /> : <Plus />} {saving ? 'กำลังบันทึก...' : 'เพิ่มลงคลังทันที'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                <h2 className="font-black flex items-center gap-2"><Globe size={18}/> ประวัติการแจกหนังสือ</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-gray-400 uppercase bg-gray-50/50 border-b">
                    <tr>
                      <th className="p-4 pl-8">รูป</th>
                      <th className="p-4">นักเรียน</th>
                      <th className="p-4">รายละเอียดหนังสือ</th>
                      <th className="p-4 text-center">ช่องทาง</th>
                      <th className="p-4 text-right pr-8">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allBooks.map(book => {
                      const student = users.find(u => u.id === book.user_id);
                      return (
                        <tr key={book.id} className="hover:bg-gray-50/30 transition-all group">
                          <td className="p-4 pl-8">
                            <div className="w-10 h-12 bg-gray-100 rounded-lg overflow-hidden border">
                              {book.image_url ? (
                                <img src={book.image_url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16}/></div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-black text-sm text-gray-900 leading-tight">{student?.full_name || 'N/A'}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{student?.email}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-black text-sm text-blue-600">{book.title}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[9px] font-black bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">{book.subject}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                              book.source_type === 'SHOP' ? 'bg-orange-100 text-orange-600' :
                              book.source_type === 'STUDY' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                            }`}>{book.source_type}</span>
                          </td>
                          <td className="p-4 text-right pr-8">
                            <div className="flex justify-end gap-1">
                              <a href={book.document_url} target="_blank" className="p-2 text-gray-300 hover:text-blue-500 transition-colors bg-gray-50 rounded-lg"><ExternalLink size={16}/></a>
                              <button onClick={() => handleDelete(book.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
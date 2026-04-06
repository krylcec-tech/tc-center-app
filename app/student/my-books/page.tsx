'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Book, Loader2, ExternalLink, Image as ImageIcon, Search, BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function MyBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyBooks();
  }, []);

  const fetchMyBooks = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 💡 ดึงออเดอร์ที่ SUCCESS ของนักเรียนคนนี้มาทั้งหมดก่อน
      // (ถอดการกรอง courses.type ออก เพื่อป้องกันบัคของ Supabase)
      const { data, error } = await supabase
        .from('course_orders') 
        .select(`
          id, status,
          courses (
            id, title, description, image_url, type, document_url, category
          )
        `)
        .eq('student_id', user.id) 
        .eq('status', 'SUCCESS') 
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✨ ให้ JavaScript คัดแยกเฉพาะที่เป็น 'book' แทน ชัวร์ 100% 
      // (ใช้ toLowerCase() เผื่อบางทีฐานข้อมูลเซฟเป็นพิมพ์ใหญ่)
      const bookOrders = (data || []).filter((order: any) => 
        order.courses && String(order.courses.type).toLowerCase() === 'book'
      );

      // จัดฟอร์แมตข้อมูลให้ใช้งานง่ายขึ้น
      const formattedBooks = bookOrders.map((order: any) => ({
        order_id: order.id,
        ...order.courses,
        image_url: Array.isArray(order.courses.image_url) 
          ? order.courses.image_url[0] 
          : order.courses.image_url
      }));

      setBooks(formattedBooks);
    } catch (err: any) {
      console.error("Error fetching books:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        
        <header className="mb-10">
          <Link href="/student" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4 hover:text-blue-600 w-max transition-colors">
            <ArrowLeft size={14} /> กลับหน้าหลัก
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-4 text-gray-900 mb-2">
                <BookOpen className="text-orange-500" size={40} /> คลังหนังสือและชีท
              </h1>
              <p className="text-gray-500 font-bold">เอกสารประกอบการเรียนทั้งหมดที่คุณสั่งซื้อไว้</p>
            </div>
            
            <div className="relative w-full md:w-72 mt-4 md:mt-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อหนังสือ/ชีท..." 
                className="pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:border-orange-400 outline-none shadow-sm w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.length === 0 ? (
            <div className="col-span-full bg-white p-16 rounded-[3rem] text-center border border-gray-50 shadow-sm flex flex-col items-center">
               <Book size={64} className="text-gray-200 mb-4" />
               <p className="text-gray-400 font-black text-xl">ยังไม่มีหนังสือหรือชีทในคลังของคุณ</p>
               <p className="text-gray-400 font-medium text-sm mt-2">เมื่อคุณสั่งซื้อและได้รับการอนุมัติ เอกสารจะแสดงที่นี่ครับ</p>
            </div>
          ) : (
            filteredBooks.map((book) => (
              <div key={book.order_id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-full group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                
                <div className="h-48 bg-gray-50 rounded-[1.5rem] mb-5 overflow-hidden relative border border-gray-100">
                  {book.image_url ? (
                    <img src={book.image_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                      <ImageIcon size={48} className="opacity-50"/>
                    </div>
                  )}
                  
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black text-orange-600 shadow-sm flex items-center gap-1.5 uppercase tracking-widest">
                    <Book size={12}/> {book.category || 'เอกสารเรียน'}
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="font-black text-xl text-gray-800 leading-tight mb-2 line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6 leading-relaxed">
                    {book.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    {book.document_url ? (
                      <a 
                        href={book.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full bg-orange-50 text-orange-600 border border-orange-100 py-3.5 rounded-2xl font-black text-sm hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <ExternalLink size={18}/> เปิดอ่านเอกสาร
                      </a>
                    ) : (
                      <button 
                        disabled
                        className="w-full bg-gray-50 text-gray-400 border border-gray-100 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <ExternalLink size={18}/> แอดมินยังไม่ได้ลงลิงก์
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
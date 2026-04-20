'use client'
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Compass, X, ShoppingCart, Calendar, Bot, BookOpen, Gift, Home, Clock
} from 'lucide-react';

export default function StudentFloatingMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (pathname === '/student') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-4 lg:bottom-8 lg:right-8 z-[999] flex flex-col items-end gap-3">
      <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'}`}>
        
        <Link href="/student" className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl px-5 py-3 rounded-full text-slate-700 hover:text-blue-600 hover:scale-105 transition-all group">
          <span className="text-[11px] font-black uppercase tracking-widest">หน้าหลัก (Dashboard)</span>
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner"><Home size={16}/></div>
        </Link>

        <Link href="/student/affiliate/shop" className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl px-5 py-3 rounded-full text-slate-700 hover:text-pink-600 hover:scale-105 transition-all group">
          <span className="text-[11px] font-black uppercase tracking-widest">แลกของรางวัล</span>
          <div className="w-9 h-9 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors shadow-inner"><Gift size={16}/></div>
        </Link>

        <Link href="/student/ai-tutor" className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl px-5 py-3 rounded-full text-slate-700 hover:text-purple-600 hover:scale-105 transition-all group">
          <span className="text-[11px] font-black uppercase tracking-widest">พี่หมี AI ช่วยสอน</span>
          <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner"><Bot size={16}/></div>
        </Link>

        <Link href="/student/my-books" className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl px-5 py-3 rounded-full text-slate-700 hover:text-orange-600 hover:scale-105 transition-all group">
          <span className="text-[11px] font-black uppercase tracking-widest">คลังชีทเรียน</span>
          <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-inner"><BookOpen size={16}/></div>
        </Link>

        <Link href="/student/courses" className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl px-5 py-3 rounded-full text-slate-700 hover:text-rose-600 hover:scale-105 transition-all group">
          <span className="text-[11px] font-black uppercase tracking-widest">ซื้อคอร์สเรียน</span>
          <div className="w-9 h-9 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shadow-inner"><ShoppingCart size={16}/></div>
        </Link>

        <Link href="/student/booking-flow" className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl px-5 py-3 rounded-full text-slate-700 hover:text-emerald-600 hover:scale-105 transition-all group">
          <span className="text-[11px] font-black uppercase tracking-widest">จองคิวเรียน</span>
          <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner"><Calendar size={16}/></div>
        </Link>

        <Link href="/student/my-schedule" className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl px-5 py-3 rounded-full text-slate-700 hover:text-cyan-600 hover:scale-105 transition-all group">
          <span className="text-[11px] font-black uppercase tracking-widest">ตารางเรียนของฉัน</span>
          <div className="w-9 h-9 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors shadow-inner"><Clock size={16}/></div>
        </Link>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all duration-300 relative z-10 hover:scale-105 active:scale-95 border-2 border-white ${isOpen ? 'bg-slate-800 text-white shadow-slate-500/40' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}
      >
        <div className={`absolute transition-all duration-300 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
          <Compass size={26} />
        </div>
        <div className={`absolute transition-all duration-300 ${isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}>
          <X size={26} />
        </div>
      </button>
    </div>
  );
}
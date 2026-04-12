'use client'
import { useState, useRef, useEffect } from 'react';
// ✨ ลบ Bot ออกเพราะเราใช้รูปภาพแทนแล้ว
import { X, Send, Sparkles, Loader2 } from 'lucide-react';

export default function FloatingAIMascot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'สวัสดีครับ! ผมคือน้อง TC AI หมีอัจฉริยะ 🐻🤖\nอยากสอบถามคอร์สเรียน หรือให้ช่วยไกด์การบ้านเรื่องไหน พิมพ์มาได้เลยครับ!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    // 🔴 ตรงนี้คือจุดเชื่อมต่อ API จริงในอนาคต
    setTimeout(() => {
      let aiResponse = '';
      
      if (userMessage.includes('การบ้าน') || userMessage.includes('เฉลย') || userMessage.includes('ตอบอะไร')) {
        aiResponse = 'เรื่องนี้ท้าทายดีนะครับ! 🧠 แต่เพื่อให้เก่งขึ้น ผมขอไม่บอกคำตอบตรงๆ นะครับ\n\nลองใบ้ให้นิดนึง: ลองทบทวนสูตรเรื่องนี้ดู หรือบอกผมหน่อยว่าตอนนี้คุณติดอยู่ตรงขั้นตอนไหน? เดี๋ยวเรามาแก้ไปด้วยกันครับ!';
      } else if (userMessage.includes('คอร์ส') || userMessage.includes('ราคา')) {
        aiResponse = 'คอร์สเรียนของเรามีตั้งแต่ระดับประถม - มหาลัยเลยครับ! สอนโดยติวเตอร์ระดับท็อป สามารถดูรายละเอียดและราคาได้ที่เมนู "ซื้อคอร์ส" ได้เลยครับ 📚 สนใจวิชาไหนเป็นพิเศษไหมครับ?';
      } else {
        aiResponse = 'น่าสนใจมากครับ! เล่ารายละเอียดเพิ่มอีกนิดได้ไหมครับ เดี๋ยวผมช่วยดูให้ ✨';
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      
      {/* 💬 หน้าต่าง Chat Box */}
      <div className={`mb-4 w-[90vw] sm:w-[380px] bg-white rounded-[2rem] shadow-2xl border border-orange-100 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header แชท */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 md:p-5 flex items-center justify-between text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 blur-xl rounded-full"></div>
          <div className="flex items-center gap-3 relative z-10">
            {/* ✨ จุดที่ 1: แก้ไอคอนในหัวแชท */}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 shadow-inner">
              <img src="/aibear.png" alt="TC AI Mascot" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-none">TC Assistant</h3>
              <p className="text-[10px] font-bold text-orange-100 flex items-center gap-1 mt-1"><Sparkles size={10}/> AI Tutor & Support</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors relative z-10"><X size={20}/></button>
        </div>

        {/* พื้นที่ข้อความ */}
        <div className="h-[350px] md:h-[400px] overflow-y-auto p-4 bg-slate-50/50 flex flex-col gap-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm shadow-md' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm whitespace-pre-wrap'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2 text-slate-400 text-sm">
                {/* ✨ แอบเอารูปน้องหมีมาใส่ตอนโหลดด้วยให้ดูน่ารัก */}
                <img src="/aibear.png" alt="Typing" className="w-5 h-5 animate-pulse object-contain"/> กำลังคิด...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ช่องพิมพ์ข้อความ */}
        <div className="p-3 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full p-1 pl-4 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <input 
              type="text" 
              placeholder="ถามคอร์สเรียน หรือ ปรึกษาการบ้าน..." 
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shrink-0"
            >
              <Send size={16} className="ml-1" />
            </button>
          </form>
        </div>
        <div className="text-center py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Powered by TC Center AI</p>
        </div>
      </div>

      {/* 🚀 ปุ่ม Mascot ลอยๆ (3D Effect) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative group animate-bounce-slow"
        style={{ animationDuration: '3s' }}
      >
        {/* เงา 3D ด้านล่าง */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/20 blur-sm rounded-[100%] group-hover:scale-75 transition-transform duration-300"></div>
        
        {/* ตัว Mascot (ใส่รูป aibear.png แทนไอคอน Bot) */}
        <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-orange-400 to-pink-500 rounded-[2rem] border-4 border-white shadow-[0_10px_25px_rgba(249,115,22,0.4)] flex items-center justify-center text-white relative z-10 transition-transform duration-300 group-hover:-translate-y-2 ${isOpen ? 'rotate-12 scale-90' : 'rotate-0'}`}>
          {/* ✨ จุดที่ 2: แก้ไอคอนบนปุ่มลอย */}
          {isOpen ? <X size={32} /> : <img src="/aibear.png" alt="AI Mascot Button" className="w-14 h-14 md:w-16 md:h-16 object-contain" />}
          
          {/* Notification Dot */}
          {!isOpen && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 border-2 border-white items-center justify-center text-[10px] font-black">1</span>
            </span>
          )}
        </div>
      </button>

      {/* CSS อนิเมชั่นลอยขึ้นลงนุ่มๆ */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(0); }
        }
        .animate-bounce-slow {
          animation: bounce-slow infinite ease-in-out;
        }
      `}} />
    </div>
  );
}
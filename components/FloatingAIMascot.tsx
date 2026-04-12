'use client'
import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, ImageIcon } from 'lucide-react';

export default function FloatingAIMascot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: 'ai', content: 'สวัสดีครับ! ผมคือน้อง TC AI หมีอัจฉริยะ 🐻🤖\nส่งรูปโจทย์ หรือพิมพ์ถามการบ้านมาได้เลยครับ! หรือจะสอบถามเกี่ยวกับรายละเอียดคอร์สอื่นๆ ได้เลยครับ' }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMessage = input.trim();
    const userImage = selectedImage;
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage, image: userImage }]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, image: userImage }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: "ขอโทษทีครับพี่ สมองผมขัดข้องนิดหน่อย ลองใหม่อีกทีนะ! 🐻" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      
      {/* 💬 หน้าต่าง Chat Box */}
      <div className={`mb-4 w-[90vw] sm:w-[380px] bg-white rounded-[2.5rem] shadow-2xl border border-orange-100 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 flex items-center justify-between text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 blur-xl rounded-full"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 shadow-inner overflow-hidden">
              <img src="/aibear.png" alt="TC AI Mascot" className="w-full h-full object-contain scale-125" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-none">TC Assistant</h3>
              <p className="text-[10px] font-bold text-orange-100 flex items-center gap-1 mt-1"><Sparkles size={10}/> AI Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors relative z-10"><X size={20}/></button>
        </div>

        <div className="h-[350px] md:h-[400px] overflow-y-auto p-4 bg-slate-50/50 flex flex-col gap-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && (
                <div className={`mb-2 max-w-[70%] p-1 rounded-2xl ${msg.role === 'user' ? 'bg-blue-100' : 'bg-slate-200'}`}>
                  <img src={msg.image} alt="uploaded" className="rounded-xl w-full h-auto object-cover" />
                </div>
              )}
              {msg.content && (
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start items-center gap-2 text-slate-400 text-sm bg-white p-3 rounded-2xl">
               <img src="/aibear.png" alt="Typing" className="w-6 h-6 animate-pulse"/> กำลังประมวลผล...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t p-3">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-orange-500 transition-colors shrink-0">
                <ImageIcon size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              <input 
                type="text" placeholder="พิมพ์ข้อความ..." 
                className="flex-1 bg-slate-50 border-none outline-none text-sm p-2 rounded-xl"
                value={input} onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center shrink-0">
                <Send size={16} />
              </button>
            </form>
        </div>
      </div>

      {/* 🚀 ส่วนที่แก้: ลบกรอบส้ม และปรับเลข 1 ให้อยู่ใกล้หมีมากขึ้น */}
      <div className="relative group">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center justify-center transition-all duration-500 animate-bounce-slow hover:scale-110 ${isOpen ? 'rotate-12' : ''}`}
        >
          {!isOpen ? (
            <div className="relative flex items-center justify-center">
              {/* เงาใต้ตัวหมี */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/10 blur-xl rounded-[100%] pointer-events-none"></div>
              
              {/* ✨ ขยายร่างน้องหมีให้ใหญ่สะใจ (w-32 ถึง w-40) */}
              <img 
                src="/aibear.png" 
                alt="AI Mascot" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.2)]" 
              />
              
              {/* ✨ ปรับตำแหน่งเลข 1: ขยับเข้ามาชิดหูหมีมากขึ้น (top-4 right-5) */}
              <span className="absolute top-4 right-5 flex h-7 w-7 z-30">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-7 w-7 bg-red-500 border-2 border-white items-center justify-center text-[11px] font-black text-white shadow-md">1</span>
              </span>
            </div>
          ) : (
            <div className="w-12 h-12 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
               <X size={24} />
            </div>
          )}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-3%); }
          50% { transform: translateY(0); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}} />
    </div>
  );
}
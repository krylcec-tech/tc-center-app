'use client'
import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, ImageIcon } from 'lucide-react';

export default function FloatingAIMascot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: 'ai', content: 'สวัสดีครับ! ผมคือน้อง TC AI หมีอัจฉริยะ 🐻🤖\nส่งรูปโจทย์ หรือพิมพ์ถามการบ้านมาได้เลยครับ! (ผมช่วยสอนนะ แต่ห้ามขอเฉลยล่ะ 😉)' }
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
      // 🚀 ส่งไปหา Gemini API ผ่าน Route ที่เราสร้างไว้
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          image: userImage 
        }),
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: "ขอโทษทีครับพี่ สมองผมขัดข้องนิดหน่อย ลองใหม่อีกทีนะ! 🐻💢" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      
      {/* 💬 หน้าต่าง Chat Box */}
      <div className={`mb-4 w-[90vw] sm:w-[380px] bg-white rounded-[2.5rem] shadow-2xl border border-orange-100 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header แชท */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 flex items-center justify-between text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 blur-xl rounded-full"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 shadow-inner">
              <img src="/aibear.png" alt="TC AI Mascot" className="w-full h-full object-contain scale-110" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-none">TC Assistant</h3>
              <p className="text-[10px] font-bold text-orange-100 flex items-center gap-1 mt-1"><Sparkles size={10}/> Gemini 1.5 Flash Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors relative z-10"><X size={20}/></button>
        </div>

        {/* พื้นที่ข้อความ */}
        <div className="h-[350px] md:h-[400px] overflow-y-auto p-4 bg-slate-50/50 flex flex-col gap-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && (
                <div className={`mb-2 max-w-[70%] p-1 rounded-2xl ${msg.role === 'user' ? 'bg-blue-100' : 'bg-slate-200'}`}>
                  <img src={msg.image} alt="uploaded" className="rounded-xl w-full h-auto object-cover shadow-sm" />
                </div>
              )}
              {msg.content && (
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm whitespace-pre-wrap'}`}>
                  {msg.content}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2 text-slate-400 text-sm">
                <img src="/aibear.png" alt="Typing" className="w-6 h-6 animate-pulse object-contain"/> กำลังประมวลผล...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ส่วนพิมพ์ข้อความและแนบรูป */}
        <div className="bg-white border-t border-slate-100 flex flex-col">
          {selectedImage && (
            <div className="p-3 bg-slate-50 border-b border-slate-100 relative flex gap-2">
              <div className="relative w-16 h-16 inline-block">
                <img src={selectedImage} alt="preview" className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm" />
                <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:scale-110 transition-transform">
                  <X size={12}/>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 self-center font-bold italic">หมีพร้อมสแกนการบ้านแล้วครับ!</p>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2 p-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[1.5rem] flex items-center p-1 pl-3 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-orange-500 transition-colors p-1.5 shrink-0"
              >
                <ImageIcon size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageChange} 
              />
              <input 
                type="text" 
                placeholder="ถามได้ทุกเรื่อง หรือส่งการบ้าน..." 
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 px-2 py-2"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:shadow-lg disabled:opacity-50 disabled:grayscale transition-all shrink-0"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
        </div>
      </div>

      {/* 🚀 ปุ่ม Mascot ลอยๆ (3D Effect) - หมีตัวใหญ่เบิ้ม */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative group animate-bounce-slow"
        style={{ animationDuration: '3s' }}
      >
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/20 blur-sm rounded-[100%] group-hover:scale-75 transition-transform duration-300"></div>
        <div className={`w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-orange-400 to-pink-500 rounded-[2.5rem] border-4 border-white shadow-[0_10px_30px_rgba(249,115,22,0.4)] flex items-center justify-center text-white relative z-10 transition-transform duration-300 group-hover:-translate-y-2 ${isOpen ? 'rotate-12 scale-90' : 'rotate-0'}`}>
          {isOpen ? (
             <X size={40} /> 
          ) : (
             <img 
               src="/aibear.png" 
               alt="AI Mascot Button" 
               className="w-full h-full object-contain scale-[1.6] md:scale-[1.8] drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)] group-hover:scale-[1.9] origin-bottom transition-transform duration-300" 
             />
          )}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-7 w-7 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-7 w-7 bg-red-500 border-[3px] border-white items-center justify-center text-[11px] font-black shadow-sm">1</span>
            </span>
          )}
        </div>
      </button>

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
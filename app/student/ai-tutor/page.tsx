'use client'
import { useState, useRef, useEffect } from 'react';
import { X, Send, ImageIcon, ArrowLeft, History, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function AITutorPage() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'ai', content: 'สวัสดีครับ! พี่หมี TC พร้อมช่วยสอนแล้ว 🐻🎓 \n\nวันนี้มีอะไรให้พี่หมีช่วยติว หรือมีโจทย์ข้อไหนสงสัย ส่งรูปมาได้เลยครับ!' }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    { icon: <BookOpen size={16} />, text: "ช่วยอธิบายเรื่องเศษส่วนหน่อย" },
    { icon: <Lightbulb size={16} />, text: "ขอโจทย์คณิตศาสตร์ ป.6" },
    { icon: <Sparkles size={16} />, text: "ช่วยตรวจการบ้านให้หน่อย" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => { setSelectedImage(reader.result as string); };
      reader.readAsDataURL(e.target.files[0]);
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
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "อูยยย ระบบขัดข้องนิดหน่อย ลองใหม่อีกครั้งนะ 🐻" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* ✨ 1. แก้ไขจุดตายของมือถือ: ใช้ h-[100dvh] และ overflow-hidden เพื่อล็อคกรอบนอกสุดไม่ให้กระเด้งเวลาคีย์บอร์ดขึ้น */
    <div className="h-[100dvh] bg-blue-50/30 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] flex flex-col font-sans overflow-hidden relative">
      
      {/* ✨ 2. Header: ใช้ shrink-0 ไม่ให้โดนบีบ */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-blue-100 p-4 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/student" className="p-2 hover:bg-blue-100 text-blue-600 rounded-full transition-colors"><ArrowLeft size={24} /></Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-orange-400 to-pink-500 rounded-2xl p-1 shadow-md flex items-center justify-center">
              <img src="/aibear.png" alt="Bear" className="w-full h-full object-contain scale-110 drop-shadow-sm" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-lg leading-none">TC AI Tutor</h2>
              <p className="text-[11px] font-bold text-orange-500 flex items-center gap-1 mt-1"><Sparkles size={10}/> ผู้ช่วยส่วนตัว</p>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm border hover:bg-red-50 transition-all tooltip" title="เริ่มบทสนทนาใหม่">
          <History size={18}/>
        </button>
      </header>

      {/* ✨ 3. Chat Space: ให้พื้นที่ตรงนี้ scroll ได้อย่างอิสระ (flex-1 overflow-y-auto) */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full scroll-smooth">
        
        {messages.length === 1 && (
          <div className="flex flex-col items-center justify-center mt-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/60 px-6 py-4 rounded-3xl shadow-sm border border-white text-center">
              <p className="text-slate-500 text-sm font-medium mb-3">💡 ลองถามพี่หมีสิครับ:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {quickPrompts.map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(prompt.text)}
                    className="flex items-center gap-2 bg-white border border-blue-100 hover:border-orange-300 hover:text-orange-500 text-slate-600 px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="text-orange-400">{prompt.icon}</span> {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            {msg.role === 'ai' && idx !== 0 && (
               <div className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center mr-2 mt-auto z-10 shrink-0">
                  <img src="/aibear.png" className="w-6 h-6 object-contain" />
               </div>
            )}
            
            <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && <img src={msg.image} className="rounded-2xl max-h-60 border-4 border-white shadow-md object-cover" />}
              
              <div className={`p-4 rounded-[1.5rem] text-sm shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-700 rounded-bl-sm border border-slate-100'}`}>
                {msg.role === 'ai' ? (
                  <ReactMarkdown 
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-extrabold text-orange-600" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 marker:text-orange-400" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 marker:text-orange-400 font-bold" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1 font-medium break-words" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span className="whitespace-pre-wrap font-medium break-words">{msg.content}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-end">
            <div className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center mr-2 z-10 shrink-0">
               <img src="/aibear.png" className="w-6 h-6 object-contain" />
            </div>
            <div className="bg-white text-slate-400 px-4 py-3 rounded-2xl rounded-bl-sm border shadow-sm flex gap-1 items-center">
               <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
               <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
               <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        {/* ดันข้อความไม่ให้ชิดขอบล่างเกินไป */}
        <div ref={messagesEndRef} className="h-6" />
      </main>

      {/* ✨ 4. Footer: ใช้ shrink-0 เพื่อให้เกาะติดขอบล่างหน้าจอเสมอ ไม่ว่าจะเกิดอะไรขึ้น */}
      <footer className="shrink-0 bg-white/95 backdrop-blur-md border-t border-blue-100 p-3 sm:p-4 z-50">
        <div className="max-w-3xl mx-auto flex flex-col gap-2 sm:gap-3 pb-safe">
          {selectedImage && (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 animate-in zoom-in-95 duration-200">
              <img src={selectedImage} className="w-full h-full object-cover rounded-xl border-2 border-orange-500 shadow-md" />
              <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"><X size={12}/></button>
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex gap-2 items-center bg-white border-2 border-blue-100 focus-within:border-orange-300 p-1 sm:p-1.5 rounded-full shadow-sm transition-colors duration-300">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 sm:p-2.5 text-blue-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors shrink-0">
              <ImageIcon size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            
            <input 
              type="text" placeholder="พิมพ์ถามการบ้าน..." 
              className="flex-1 bg-transparent outline-none text-sm px-2 font-medium text-slate-700 placeholder:text-slate-400"
              value={input} onChange={(e) => setInput(e.target.value)}
            />
            
            <button 
              type="submit" 
              disabled={!input.trim() && !selectedImage}
              className={`p-2.5 sm:p-3 rounded-full shadow-md shrink-0 transition-all duration-300 ${(!input.trim() && !selectedImage) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:scale-105 active:scale-95'}`}
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </form>
          <p className="hidden sm:block text-center text-[10px] text-slate-400 font-medium">TC AI Tutor สามารถช่วยไกด์วิธีคิดได้ แต่เรียนรู้ด้วยตัวเองจะเก่งที่สุดนะครับ! ✨</p>
        </div>
      </footer>
    </div>
  );
}
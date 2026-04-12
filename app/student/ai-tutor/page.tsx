'use client'
import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, ImageIcon, ArrowLeft, History } from 'lucide-react';
import Link from 'next/link';

export default function AITutorPage() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'ai', content: 'สวัสดีครับ! พี่หมี TC พร้อมช่วยสอนแล้ว 🐻🎓 ส่งรูปโจทย์หรือพิมพ์มาได้เลยครับ!' }
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
      setMessages(prev => [...prev, { role: 'ai', content: "ระบบขัดข้อง ลองใหม่อีกครั้งนะ 🐻" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/student" className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={24} /></Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl p-1 shadow-lg shadow-orange-200">
              <img src="/aibear.png" alt="Bear" className="w-full h-full object-contain scale-125" />
            </div>
            <h2 className="font-black text-slate-800">TC AI Tutor</h2>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="text-slate-400 hover:text-red-500"><History size={20}/></button>
      </header>

      {/* Chat Space */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && <img src={msg.image} className="rounded-2xl max-h-60 border-4 border-white shadow-sm" />}
              <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-slate-400 text-xs animate-pulse">พี่หมีกำลังคิด... 🐻</div>}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Field */}
      <footer className="bg-white border-t p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {selectedImage && (
            <div className="relative w-20 h-20">
              <img src={selectedImage} className="w-full h-full object-cover rounded-xl border-2 border-orange-500" />
              <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex gap-2 items-center bg-slate-100 p-2 rounded-2xl">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400"><ImageIcon /></button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            <input 
              type="text" placeholder="ถามการบ้านพี่หมีได้เลย..." 
              className="flex-1 bg-transparent outline-none text-sm px-2"
              value={input} onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="bg-orange-500 text-white p-3 rounded-xl shadow-md"><Send size={20}/></button>
          </form>
        </div>
      </footer>
    </div>
  );
}
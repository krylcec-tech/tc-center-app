'use client'
import { useState, useRef, useEffect } from 'react';
import { X, Send, ImageIcon, ArrowLeft, History, Sparkles, BookOpen, Lightbulb, Zap, Star } from 'lucide-react';
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
    { icon: <BookOpen size={14} />, text: "ช่วยอธิบายเรื่องเศษส่วนหน่อย", color: '#2563eb' },
    { icon: <Lightbulb size={14} />, text: "ขอโจทย์คณิตศาสตร์ ป.6", color: '#f97316' },
    { icon: <Sparkles size={14} />, text: "ช่วยตรวจการบ้านให้หน่อย", color: '#ec4899' },
    { icon: <Zap size={14} />, text: "สรุปเนื้อหาวิทยาศาสตร์", color: '#7c3aed' },
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
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      fontFamily: "'Prompt', sans-serif", overflow: 'hidden',
      background: '#F0F4FF', position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800;900&family=Sarabun:wght@400;500;600&display=swap');
        * { font-family: 'Prompt', sans-serif; box-sizing: border-box; }

        /* === Animated dot grid bg === */
        .chat-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: radial-gradient(circle, rgba(37,99,235,0.13) 1.5px, transparent 1.5px);
          background-size: 26px 26px;
        }

        /* === Deco blobs (fixed, behind everything) === */
        .blob {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
          filter: blur(0px);
        }
        .blob-1 { width: 400px; height: 400px; top: -120px; left: -100px;
          background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%);
          animation: blobDrift 14s ease-in-out infinite; }
        .blob-2 { width: 350px; height: 350px; bottom: -100px; right: -80px;
          background: radial-gradient(circle, rgba(249,115,22,0.11) 0%, transparent 70%);
          animation: blobDrift 17s ease-in-out infinite reverse; }
        .blob-3 { width: 250px; height: 250px; top: 35%; right: 5%;
          background: radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%);
          animation: blobDrift 11s ease-in-out infinite; }
        @keyframes blobDrift {
          0%,100% { transform: translate(0,0); }
          33% { transform: translate(25px, -20px); }
          66% { transform: translate(-15px, 18px); }
        }

        /* === Header === */
        .chat-header {
          background: rgba(255,255,255,0.90);
          backdrop-filter: blur(28px);
          border-bottom: 1.5px solid rgba(37,99,235,0.09);
          box-shadow: 0 4px 24px rgba(37,99,235,0.07);
          flex-shrink: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px;
        }

        /* Bear logo animation */
        .bear-ring {
          background: conic-gradient(from 0deg, #2563eb, #f97316, #ec4899, #7c3aed, #2563eb);
          animation: spinRing 5s linear infinite;
          border-radius: 16px; padding: 2.5px;
        }
        @keyframes spinRing { from{transform:rotate(0)} to{transform:rotate(360deg)} }

        .online-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 2px white, 0 0 0 4px rgba(34,197,94,0.3);
          animation: pulse 2s ease-in-out infinite;
          position: absolute; bottom: 2px; right: 2px;
        }
        @keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.3)} }

        /* === Messages area === */
        .messages-area {
          flex: 1; overflow-y: auto; position: relative; z-index: 10;
          padding: 20px 16px 8px;
          scroll-behavior: smooth;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.15); border-radius: 8px; }

        /* === Quick prompt chips === */
        .quick-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 100px;
          background: rgba(255,255,255,0.9);
          border: 1.5px solid rgba(37,99,235,0.12);
          font-size: 12px; font-weight: 700; color: #475569;
          cursor: pointer; text-decoration: none;
          transition: all 0.25s cubic-bezier(.34,1.56,.64,1);
          white-space: nowrap;
        }
        .quick-chip:hover {
          transform: translateY(-3px) scale(1.04);
          border-color: rgba(249,115,22,0.4);
          box-shadow: 0 6px 20px rgba(249,115,22,0.15);
          color: #f97316;
        }
        .quick-chip:active { transform: scale(0.97); }

        /* === Bubble styles === */
        .bubble-ai {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px);
          border: 1.5px solid rgba(255,255,255,0.95);
          box-shadow: 0 4px 20px rgba(37,99,235,0.07), 0 1px 4px rgba(0,0,0,0.03);
          border-radius: 22px 22px 22px 6px;
          padding: 14px 18px;
          color: #1e293b;
          font-size: 14px;
          line-height: 1.7;
          max-width: 82%;
          animation: bubbleIn .4s cubic-bezier(.34,1.56,.64,1) both;
        }

        .bubble-user {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-radius: 22px 22px 6px 22px;
          padding: 13px 18px;
          color: white;
          font-size: 14px;
          line-height: 1.65;
          max-width: 78%;
          box-shadow: 0 6px 20px rgba(37,99,235,0.28);
          animation: bubbleInRight .4s cubic-bezier(.34,1.56,.64,1) both;
        }

        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(12px) scale(.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bubbleInRight {
          from { opacity: 0; transform: translateY(12px) translateX(10px) scale(.95); }
          to { opacity: 1; transform: translateY(0) translateX(0) scale(1); }
        }

        /* === Bear avatar === */
        .bear-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #fed7aa, #fdba74);
          border: 2px solid white;
          box-shadow: 0 3px 10px rgba(249,115,22,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
        }

        /* === Typing indicator === */
        .typing-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #ec4899);
          display: inline-block;
          animation: typingBounce .7s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: .15s; }
        .typing-dot:nth-child(3) { animation-delay: .30s; }
        @keyframes typingBounce {
          0%,60%,100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }

        /* === Footer / Input area === */
        .chat-footer {
          background: rgba(255,255,255,0.94);
          backdrop-filter: blur(28px);
          border-top: 1.5px solid rgba(37,99,235,0.09);
          box-shadow: 0 -8px 32px rgba(37,99,235,0.07);
          flex-shrink: 0; z-index: 50;
          padding: 12px 16px;
          padding-bottom: max(env(safe-area-inset-bottom), 14px);
        }

        .input-shell {
          display: flex; align-items: center; gap: 8px;
          background: rgba(248,250,255,0.9);
          border: 2px solid rgba(37,99,235,0.12);
          border-radius: 100px;
          padding: 6px 6px 6px 14px;
          transition: all .25s ease;
          box-shadow: 0 2px 12px rgba(37,99,235,0.07);
        }
        .input-shell:focus-within {
          border-color: rgba(249,115,22,0.45);
          box-shadow: 0 4px 20px rgba(249,115,22,0.12);
          background: white;
        }

        .send-btn {
          width: 42px; height: 42px; border-radius: 50%;
          border: none; cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all .25s cubic-bezier(.34,1.56,.64,1);
        }
        .send-btn.active {
          background: linear-gradient(135deg, #f97316, #ec4899);
          box-shadow: 0 6px 18px rgba(249,115,22,0.38);
        }
        .send-btn.active:hover { transform: scale(1.1); }
        .send-btn.active:active { transform: scale(.95); }
        .send-btn.inactive { background: #e2e8f0; cursor: not-allowed; }

        .img-btn {
          width: 36px; height: 36px; border-radius: 50%; border: none;
          background: transparent; cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #93c5fd; transition: all .2s ease;
        }
        .img-btn:hover { background: rgba(37,99,235,0.08); color: #2563eb; transform: scale(1.1); }

        /* === Intro card === */
        .intro-card {
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255,255,255,0.95);
          border-radius: 24px;
          box-shadow: 0 4px 24px rgba(37,99,235,0.07);
          padding: 24px; text-align: center;
          animation: fadeUp .7s cubic-bezier(.34,1.4,.64,1) both;
        }
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(20px) scale(.97); }
          to { opacity:1; transform: translateY(0) scale(1); }
        }

        /* === Message row === */
        .msg-row { display: flex; margin-bottom: 14px; }
        .msg-row.ai { justify-content: flex-start; align-items: flex-end; gap: 9px; }
        .msg-row.user { justify-content: flex-end; }

        /* Markdown inside AI bubble */
        .ai-md p { margin: 0 0 8px; white-space: pre-wrap; word-break: break-word; }
        .ai-md p:last-child { margin-bottom: 0; }
        .ai-md strong { font-weight: 800; color: #f97316; }
        .ai-md ul { list-style: disc; padding-left: 20px; margin: 6px 0 10px; }
        .ai-md ol { list-style: decimal; padding-left: 20px; margin: 6px 0 10px; font-weight: 700; }
        .ai-md li { padding-left: 4px; margin-bottom: 4px; font-weight: 500; word-break: break-word; }
        .ai-md ul li::marker { color: #f97316; }
        .ai-md ol li::marker { color: #f97316; }

        /* Reset history button */
        .reset-btn {
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(255,255,255,0.9);
          border: 1.5px solid rgba(37,99,235,0.12);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #94a3b8;
          transition: all .2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .reset-btn:hover { color: #ef4444; border-color: rgba(239,68,68,0.3); background: rgba(254,242,242,0.9); transform: rotate(15deg); }

        /* Image preview */
        .img-preview {
          position: relative; display: inline-block;
          animation: zoomIn .3s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes zoomIn { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }

        /* Stars decorative */
        .star-deco {
          position: absolute; pointer-events: none;
          animation: twinkle 2.5s ease-in-out infinite;
        }
        @keyframes twinkle { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.9;transform:scale(1.25)} }
      `}</style>

      {/* Ambient blobs */}
      <div className="blob blob-1"/>
      <div className="blob blob-2"/>
      <div className="blob blob-3"/>
      <div className="chat-bg"/>

      {/* Decorative stars */}
      <div className="star-deco" style={{top:80,right:60,animationDelay:'0s'}}><Star size={14} color="#f97316" fill="#f97316" opacity={0.4}/></div>
      <div className="star-deco" style={{top:160,left:80,animationDelay:'.8s'}}><Star size={10} color="#2563eb" fill="#2563eb" opacity={0.35}/></div>
      <div className="star-deco" style={{bottom:180,right:100,animationDelay:'1.4s'}}><Star size={12} color="#ec4899" fill="#ec4899" opacity={0.35}/></div>

      {/* ===== HEADER ===== */}
      <header className="chat-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Link href="/student" style={{width:36,height:36,borderRadius:12,background:'rgba(37,99,235,0.07)',display:'flex',alignItems:'center',justifyContent:'center',color:'#2563eb',textDecoration:'none',transition:'all .2s',flexShrink:0}}>
            <ArrowLeft size={20}/>
          </Link>

          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {/* Spinning ring around bear */}
            <div style={{position:'relative'}}>
              <div className="bear-ring">
                <div style={{width:42,height:42,background:'white',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                  <img src="/aibear.png" alt="Bear" style={{width:'100%',height:'100%',objectFit:'contain',transform:'scale(1.1)'}}
                    onError={(e:any) => { e.target.style.display='none'; e.target.parentNode.textContent='🐻'; }}
                  />
                </div>
              </div>
              <div className="online-dot"/>
            </div>

            <div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <h2 style={{fontWeight:900,fontSize:17,color:'#0f172a',lineHeight:1,margin:0}}>TC AI Tutor</h2>
                <span style={{fontSize:9,fontWeight:800,background:'linear-gradient(135deg,#f97316,#ec4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',textTransform:'uppercase',letterSpacing:'0.08em'}}>BETA</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4,marginTop:3}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}/>
                <p style={{fontSize:11,fontWeight:700,color:'#22c55e',margin:0}}>พี่หมีออนไลน์อยู่</p>
              </div>
            </div>
          </div>
        </div>

        <button
          className="reset-btn"
          onClick={() => setMessages([messages[0]])}
          title="เริ่มบทสนทนาใหม่"
        >
          <History size={17}/>
        </button>
      </header>

      {/* ===== MESSAGES ===== */}
      <main className="messages-area">
        <div style={{maxWidth:720,margin:'0 auto',display:'flex',flexDirection:'column'}}>

          {/* Welcome / Quick prompts */}
          {messages.length === 1 && (
            <div style={{marginBottom:24}}>
              <div className="intro-card" style={{marginBottom:16}}>
                {/* Bear hero */}
                <div style={{position:'relative',display:'inline-block',marginBottom:16}}>
                  <div style={{width:80,height:80,borderRadius:24,background:'linear-gradient(135deg,#fff7ed,#fed7aa)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto',boxShadow:'0 8px 28px rgba(249,115,22,0.2)',overflow:'hidden'}}>
                    <img src="/aibear.png" alt="Bear" style={{width:'90%',height:'90%',objectFit:'contain',transform:'scale(1.1)'}}
                      onError={(e:any) => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="font-size:40px">🐻</span>'; }}
                    />
                  </div>
                  <div style={{position:'absolute',top:-8,right:-8}}><Star size={16} color="#f97316" fill="#f97316"/></div>
                  <div style={{position:'absolute',bottom:-6,left:-6}}><Star size={12} color="#7c3aed" fill="#7c3aed"/></div>
                </div>
                <h3 style={{fontWeight:900,fontSize:18,color:'#0f172a',margin:'0 0 6px'}}>พี่หมีพร้อมสอนแล้ว! 🎓</h3>
                <p style={{fontSize:13,color:'#64748b',margin:0,fontFamily:"'Sarabun',sans-serif",lineHeight:1.6}}>ถามได้ทุกวิชา ส่งรูปโจทย์มาได้เลย<br/>พี่หมีจะช่วยอธิบายให้เข้าใจ ✨</p>
              </div>

              <p style={{textAlign:'center',fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:10,letterSpacing:'0.05em',textTransform:'uppercase'}}>💡 ลองถามพี่หมีดูสิ</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
                {quickPrompts.map((p,i) => (
                  <button key={i} className="quick-chip" onClick={() => setInput(p.text)}>
                    <span style={{color:p.color}}>{p.icon}</span>
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`msg-row ${msg.role}`}>
              {msg.role === 'ai' && idx > 0 && (
                <div className="bear-avatar">
                  <img src="/aibear.png" style={{width:'100%',height:'100%',objectFit:'contain'}}
                    onError={(e:any) => { e.target.style.display='none'; e.target.parentNode.textContent='🐻'; }}
                  />
                </div>
              )}
              {/* Spacer so AI bubble aligns when no avatar (first message) */}
              {msg.role === 'ai' && idx === 0 && <div style={{width:34,flexShrink:0}}/>}

              <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:msg.role==='user'?'flex-end':'flex-start',maxWidth:'100%'}}>
                {msg.image && (
                  <img src={msg.image} style={{borderRadius:16,maxHeight:220,maxWidth:'80%',border:'3px solid white',boxShadow:'0 6px 20px rgba(0,0,0,0.12)',objectFit:'cover'}}/>
                )}
                <div className={msg.role === 'ai' ? 'bubble-ai' : 'bubble-user'}>
                  {msg.role === 'ai' ? (
                    <div className="ai-md">
                      <ReactMarkdown
                        components={{
                          p: ({node,...props}) => <p {...props}/>,
                          strong: ({node,...props}) => <strong {...props}/>,
                          ul: ({node,...props}) => <ul {...props}/>,
                          ol: ({node,...props}) => <ol {...props}/>,
                          li: ({node,...props}) => <li {...props}/>,
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span style={{whiteSpace:'pre-wrap',fontWeight:600,wordBreak:'break-word'}}>{msg.content}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="msg-row ai">
              <div className="bear-avatar">
                <img src="/aibear.png" style={{width:'100%',height:'100%',objectFit:'contain'}}
                  onError={(e:any) => { e.target.style.display='none'; e.target.parentNode.textContent='🐻'; }}
                />
              </div>
              <div className="bubble-ai" style={{padding:'14px 20px',display:'flex',alignItems:'center',gap:5}}>
                <span className="typing-dot"/>
                <span className="typing-dot"/>
                <span className="typing-dot"/>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} style={{height:8}}/>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="chat-footer">
        <div style={{maxWidth:720,margin:'0 auto'}}>

          {/* Image preview */}
          {selectedImage && (
            <div style={{marginBottom:10}}>
              <div className="img-preview">
                <img src={selectedImage} style={{width:64,height:64,objectFit:'cover',borderRadius:14,border:'2.5px solid',borderColor:'#f97316',boxShadow:'0 4px 14px rgba(249,115,22,0.3)'}}/>
                <button
                  onClick={() => setSelectedImage(null)}
                  style={{position:'absolute',top:-8,right:-8,width:22,height:22,borderRadius:'50%',background:'#ef4444',border:'2px solid white',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(239,68,68,0.4)'}}
                >
                  <X size={11} color="white"/>
                </button>
              </div>
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSend} style={{display:'contents'}}>
            <div className="input-shell">
              <button type="button" className="img-btn" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={20}/>
              </button>
              <input type="file" ref={fileInputRef} style={{display:'none'}} accept="image/*" onChange={handleImageChange}/>

              <input
                type="text"
                placeholder="พิมพ์ถามการบ้านได้เลย..."
                style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:14,fontWeight:600,color:'#1e293b',minWidth:0}}
                value={input}
                onChange={e => setInput(e.target.value)}
              />

              <button
                type="submit"
                className={`send-btn ${(!input.trim() && !selectedImage) ? 'inactive' : 'active'}`}
                disabled={!input.trim() && !selectedImage}
              >
                <Send size={17} color={(!input.trim() && !selectedImage) ? '#94a3b8' : 'white'}/>
              </button>
            </div>
          </form>

          <p style={{textAlign:'center',fontSize:10,color:'#cbd5e1',fontWeight:600,marginTop:8,display:'none'}} className="sm-show">
            TC AI Tutor ช่วยแนะนำวิธีคิด ฝึกทำเองจะเก่งที่สุด! ✨
          </p>
        </div>
      </footer>

      <style>{`.sm-show { display: block; } @media(max-width:600px){.sm-show{display:none}}`}</style>
    </div>
  );
}

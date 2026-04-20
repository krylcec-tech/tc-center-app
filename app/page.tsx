'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  User, Sparkles, ChevronRight, GraduationCap, Users, Star,
  MessageCircle, Menu, X, LayoutDashboard, Heart, Rocket,
  BookOpen, Zap, Brain
} from 'lucide-react';
import FloatingAIMascot from '@/components/FloatingAIMascot';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('STUDENT');
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeSubject, setActiveSubject] = useState(0);

  const [studentsCount, setStudentsCount] = useState<number>(150); 
  const [tutorsCount, setTutorsCount] = useState<number>(20);      

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveSubject(p => (p + 1) % 4), 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const { count: tCount } = await supabase
          .from('tutors')
          .select('*', { count: 'exact', head: true });

        const { count: sCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .not('role', 'in', '("admin","ADMIN","tutor","TUTOR")');

        if (tCount !== null) setTutorsCount(20 + tCount);
        if (sCount !== null) setStudentsCount(150 + sCount);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchRealStats();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
        if (profile) setUserRole((profile.role || 'STUDENT').toUpperCase());
      } else { setUser(null); }
      setLoading(false);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) setUserRole('STUDENT');
    });
    return () => subscription.unsubscribe();
  }, []);

  const getDashboardUrl = () => {
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'TUTOR') return '/tutor';
    return '/student';
  };
  
  const getDashboardText = () => {
    if (userRole === 'ADMIN') return 'Admin Panel';
    if (userRole === 'TUTOR') return 'Tutor Dashboard';
    return 'ห้องเรียนของฉัน';
  };

  const subjects = [
    { label: 'คณิตศาสตร์', emoji: '🔢', color: '#2563eb' },
    { label: 'วิทยาศาสตร์', emoji: '🔬', color: '#059669' },
    { label: 'ภาษาต่างประเทศ', emoji: '📝', color: '#7c3aed' },
    { label: 'ฟิสิกส์-เคมี-ชีวะ', emoji: '⚡', color: '#f97316' },
  ];

  const HeroIllustration = () => (
    <div className="illo-container" style={{position:'relative',width:'100%',maxWidth:480}}>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:380,height:380,borderRadius:'50%',background:'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(249,115,22,0.06))',border:'2px dashed rgba(37,99,235,0.15)',animation:'bd2 8s ease-in-out infinite'}}/>
      <svg viewBox="0 0 400 380" style={{width:'100%',maxWidth:440,position:'relative',zIndex:5}} xmlns="http://www.w3.org/2000/svg">
        <rect x="80" y="280" width="240" height="14" rx="7" fill="#e2e8f0"/>
        <rect x="100" y="260" width="200" height="22" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
        <rect x="104" y="263" width="92" height="16" rx="3" fill="#eff6ff"/>
        <rect x="200" y="263" width="92" height="16" rx="3" fill="#fff7ed"/>
        <line x1="200" y1="263" x2="200" y2="279" stroke="#e2e8f0" strokeWidth="1"/>
        <line x1="112" y1="268" x2="188" y2="268" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="112" y1="273" x2="170" y2="273" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="208" y1="268" x2="284" y2="268" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="208" y1="273" x2="260" y2="273" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="90" y="180" width="80" height="90" rx="20" fill="#2563eb"/>
        <path d="M130 180 L118 195 L130 200 L142 195 Z" fill="white"/>
        <rect x="120" y="160" width="20" height="24" rx="8" fill="#fbbf24"/>
        <ellipse cx="130" cy="145" rx="36" ry="34" fill="#fbbf24"/>
        <path d="M96 130 Q98 105 130 100 Q162 105 164 130 Q155 118 130 116 Q105 118 96 130Z" fill="#1e293b"/>
        <ellipse cx="118" cy="140" rx="6" ry="7" fill="white"/>
        <ellipse cx="142" cy="140" rx="6" ry="7" fill="white"/>
        <circle cx="120" cy="141" r="4" fill="#1e293b"/>
        <circle cx="144" cy="141" r="4" fill="#1e293b"/>
        <circle cx="121" cy="139" r="1.5" fill="white"/>
        <circle cx="145" cy="139" r="1.5" fill="white"/>
        <path d="M120 153 Q130 162 140 153" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="108" cy="152" rx="8" ry="5" fill="#f87171" opacity="0.4"/>
        <ellipse cx="152" cy="152" rx="8" ry="5" fill="#f87171" opacity="0.4"/>
        <rect x="109" y="134" width="16" height="12" rx="4" fill="none" stroke="#1e293b" strokeWidth="2"/>
        <rect x="133" y="134" width="16" height="12" rx="4" fill="none" stroke="#1e293b" strokeWidth="2"/>
        <line x1="125" y1="140" x2="133" y2="140" stroke="#1e293b" strokeWidth="2"/>
        <line x1="93" y1="138" x2="109" y2="138" stroke="#1e293b" strokeWidth="1.5"/>
        <line x1="149" y1="138" x2="163" y2="138" stroke="#1e293b" strokeWidth="1.5"/>
        <path d="M168 205 Q190 215 195 230" stroke="#fbbf24" strokeWidth="14" strokeLinecap="round" fill="none"/>
        <rect x="188" y="225" width="8" height="36" rx="4" fill="#fcd34d" transform="rotate(-30,192,243)"/>
        <polygon points="192,255 196,255 194,265" fill="#f97316"/>
        <rect x="188" y="223" width="8" height="6" rx="2" fill="#94a3b8" transform="rotate(-30,192,226)"/>
        <path d="M92 205 Q70 215 75 240" stroke="#fbbf24" strokeWidth="14" strokeLinecap="round" fill="none"/>
        <ellipse cx="76" cy="244" rx="12" ry="9" fill="#fbbf24"/>
        <path d="M100 185 Q115 220 110 260" stroke="#1d4ed8" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M160 185 Q145 220 150 260" stroke="#1d4ed8" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <rect x="235" y="175" width="85" height="100" rx="22" fill="#7c3aed"/>
        <rect x="248" y="195" width="58" height="42" rx="10" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
        <circle cx="263" cy="208" r="4" fill="#34d399"/>
        <circle cx="278" cy="208" r="4" fill="#fbbf24" opacity="0.9"/>
        <circle cx="293" cy="208" r="4" fill="#f87171" opacity="0.9"/>
        <rect x="258" y="220" width="40" height="6" rx="3" fill="rgba(255,255,255,0.3)"/>
        <rect x="258" y="220" width="26" height="6" rx="3" fill="#34d399"/>
        <rect x="265" y="155" width="24" height="22" rx="5" fill="#6d28d9"/>
        <rect x="230" y="100" width="95" height="60" rx="22" fill="#6d28d9"/>
        <line x1="277" y1="100" x2="277" y2="78" stroke="#6d28d9" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="277" cy="72" r="8" fill="#f97316"/>
        <circle cx="277" cy="72" r="4" fill="white" opacity="0.7"/>
        <rect x="225" y="112" width="8" height="30" rx="4" fill="#5b21b6"/>
        <rect x="322" y="112" width="8" height="30" rx="4" fill="#5b21b6"/>
        <rect x="242" y="112" rx="10" width="32" height="28" fill="#0f172a"/>
        <rect x="280" y="112" rx="10" width="32" height="28" fill="#0f172a"/>
        <rect x="246" y="116" rx="7" width="24" height="20" fill="#38bdf8" opacity="0.9"/>
        <rect x="284" y="116" rx="7" width="24" height="20" fill="#38bdf8" opacity="0.9"/>
        <line x1="246" y1="126" x2="270" y2="126" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round"/>
        <line x1="284" y1="126" x2="308" y2="126" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round"/>
        <path d="M252 147 Q278 158 308 147" stroke="#34d399" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <rect x="318" y="185" width="20" height="60" rx="10" fill="#6d28d9"/>
        <ellipse cx="328" cy="250" rx="12" ry="10" fill="#5b21b6"/>
        <rect x="212" y="185" width="20" height="60" rx="10" fill="#6d28d9"/>
        <ellipse cx="222" cy="250" rx="12" ry="10" fill="#5b21b6"/>
        <rect x="300" y="55" width="85" height="44" rx="14" fill="white" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5"/>
        <path d="M310 99 L305 112 L320 99Z" fill="white"/>
        <text x="342" y="73" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">TC AI</text>
        <text x="342" y="88" textAnchor="middle" fontSize="10" fill="#64748b">พร้อมช่วย!</text>
        <g style={{animation:'eduFloat 3s ease-in-out infinite'}}><text x="45" y="155" fontSize="22">⭐</text></g>
        <g style={{animation:'eduFloat 4s ease-in-out 1s infinite'}}><text x="350" y="310" fontSize="18">✨</text></g>
        <g style={{animation:'eduFloat 5s ease-in-out .5s infinite'}}><text x="30" y="230" fontSize="13" fill="#7c3aed" fontWeight="700">E=mc²</text></g>
        <g style={{animation:'eduFloat 3.5s ease-in-out 1.5s infinite'}}><text x="355" y="170" fontSize="26" fill="#2563eb" fontWeight="900">+</text></g>
        <g style={{animation:'eduFloat 4.5s ease-in-out .2s infinite'}}><text x="48" y="295" fontSize="22">💡</text></g>
        <g style={{animation:'eduFloat 4s ease-in-out 2s infinite'}}><text x="355" y="235" fontSize="18">⚛️</text></g>
      </svg>
      <div style={{position:'absolute',top:10,left:-10,background:'white',borderRadius:16,padding:'10px 16px',boxShadow:'0 8px 28px rgba(124,58,237,0.2)',border:'1.5px solid rgba(124,58,237,0.15)',display:'flex',alignItems:'center',gap:8,animation:'tfFloat1 4s ease-in-out infinite',zIndex:10}}>
        <span style={{fontSize:20}}>🤖</span>
        <div>
          <p style={{margin:0,fontSize:11,fontWeight:900,color:'#6d28d9'}}>TC AI Tutor</p>
          <p style={{margin:0,fontSize:10,color:'#94a3b8',fontFamily:"'Sarabun',sans-serif"}}>ตอบทุกคำถาม 24/7</p>
        </div>
      </div>
      <div style={{position:'absolute',bottom:40,right:-10,background:'white',borderRadius:16,padding:'10px 16px',boxShadow:'0 8px 28px rgba(249,115,22,0.2)',border:'1.5px solid rgba(249,115,22,0.15)',display:'flex',alignItems:'center',gap:8,animation:'tfFloat2 5s ease-in-out infinite',zIndex:10}}>
        <span style={{fontSize:20}}>🔥</span>
        <div>
          <p style={{margin:0,fontSize:11,fontWeight:900,color:'#ea580c'}}>Streak 14 วัน!</p>
          <p style={{margin:0,fontSize:10,color:'#94a3b8',fontFamily:"'Sarabun',sans-serif"}}>เก่งมากเลย ต่อไปเลย</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFF', fontFamily: "'Prompt', sans-serif", overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800;900&family=Sarabun:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }

        .page-bg {
          background-color: #FAFBFF;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          min-height: 100vh;
        }

        .blob { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; }
        .b1 { width:700px;height:700px;top:-200px;left:-180px; background:radial-gradient(circle,rgba(37,99,235,0.09) 0%,transparent 65%); animation:bd1 16s ease-in-out infinite; }
        .b2 { width:550px;height:550px;bottom:-150px;right:-130px; background:radial-gradient(circle,rgba(249,115,22,0.10) 0%,transparent 65%); animation:bd2 19s ease-in-out infinite; }
        .b3 { width:400px;height:400px;top:40%;right:8%; background:radial-gradient(circle,rgba(236,72,153,0.07) 0%,transparent 65%); animation:bd1 13s ease-in-out infinite reverse; }
        .b4 { width:300px;height:300px;top:60%;left:5%; background:radial-gradient(circle,rgba(5,150,105,0.07) 0%,transparent 65%); animation:bd2 10s ease-in-out infinite; }
        @keyframes bd1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(35px,-25px)} 66%{transform:translate(-20px,22px)} }
        @keyframes bd2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,22px)} }

        .nav-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: all .4s ease;
          padding: 16px 24px;
        }
        .nav-bar.scrolled { padding: 8px 24px; }

        .nav-inner {
          max-width: 1240px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(28px);
          border: 1.5px solid rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 10px 20px;
          box-shadow: 0 4px 32px rgba(37,99,235,0.08);
          transition: all .4s ease;
        }

        .logo-ring {
          background: conic-gradient(from 0deg,#2563eb,#f97316,#ec4899,#7c3aed,#2563eb);
          animation: spin 6s linear infinite;
          border-radius: 14px; padding: 2.5px;
        }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px; border-radius: 14px;
          background: linear-gradient(135deg,#2563eb,#1d4ed8);
          color: white; font-weight: 800; font-size: 14px;
          text-decoration: none; border: none; cursor: pointer;
          box-shadow: 0 6px 20px rgba(37,99,235,0.32);
          transition: all .3s cubic-bezier(.34,1.56,.64,1);
          position: relative; overflow: hidden;
        }
        .btn-primary:hover { transform: translateY(-2px) scale(1.03); }

        .btn-orange {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px; border-radius: 14px;
          background: linear-gradient(135deg,#f97316,#ec4899);
          color: white; font-weight: 800; font-size: 14px;
          text-decoration: none; border: none; cursor: pointer;
          box-shadow: 0 6px 20px rgba(249,115,22,0.32);
          transition: all .3s cubic-bezier(.34,1.56,.64,1);
        }

        .shimmer-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

        .hero { position: relative; padding: 160px 24px 80px; overflow: hidden; }

        .hero-title {
          font-size: clamp(36px, 6vw, 76px);
          font-weight: 900;
          line-height: 1.12;
          color: #0f172a;
          letter-spacing: -0.03em;
          margin: 0 0 24px;
        }
        .grad-orange { background: linear-gradient(135deg,#f97316,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .grad-blue   { background: linear-gradient(135deg,#2563eb,#7c3aed); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        .subject-ticker-wrap {
          display: inline-flex; align-items: center; gap: 6px; padding: 5px 5px 5px 10px;
          background: rgba(255,255,255,0.9); border: 1.5px solid rgba(37,99,235,0.12);
          border-radius: 100px; box-shadow: 0 4px 16px rgba(37,99,235,0.08);
          margin-bottom: 28px;
        }
        .subject-ticker-inner { display: flex; gap: 6px; }

        .hero-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; max-width: 1240px; margin: 0 auto; }
        .hero-text-col { display: flex; flex-direction: column; }
        .hero-ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 36px; }

        .stats-bar {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255,255,255,0.95);
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(37,99,235,0.08);
          margin: 48px auto 0; max-width: 700px;
          overflow: hidden;
        }
        .stat-item { flex: 1; padding: 20px 24px; text-align: center; position: relative; }
        .stat-val { font-size: 28px; font-weight: 900; color: #0f172a; line-height: 1; margin-bottom: 4px; }
        .stat-lbl { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; }

        /* ✨ ✨ MOBILE OVERRIDES (แก้เฉพาะมือถือ) ✨ ✨ */
        .mobile-illo-only { display: none; }
        .desktop-illo-only { display: flex; align-items: center; justify-content: center; position: relative; }

        @media(max-width: 900px) {
          .hero-layout { grid-template-columns: 1fr; text-align: center; }
          .hero-text-col { align-items: center; }
          .hero-ctas { justify-content: center; margin-top: 24px; }
          .desktop-illo-only { display: none; }
          .mobile-illo-only { display: flex; justify-content: center; width: 100%; margin: 20px 0; }
          /* ✨ ย่อรูปภาพลง 20% เฉพาะในมือถือ */
          .mobile-illo-only .illo-container { transform: scale(0.85); margin: -30px 0; }
        }

        @media(max-width: 640px) {
          /* 1. Navbar มินิมอล */
          .nav-bar { padding: 8px 12px !important; }
          .nav-inner { padding: 5px 8px !important; border-radius: 12px !important; }
          .logo-box { width: 28px !important; height: 28px !important; border-radius: 8px !important; }
          .logo-img { height: 18px !important; }
          .logo-title { font-size: 13px !important; }
          .logo-sub { display: none !important; }
          
          /* 2. ปุ่มใน Navbar เล็กลง */
          .nav-login-btn { padding: 6px 10px !important; font-size: 11px !important; border-radius: 8px !important; border: none !important; background: transparent !important; }
          .nav-register-btn { padding: 8px 14px !important; font-size: 11px !important; border-radius: 10px !important; box-shadow: 0 4px 12px rgba(249,115,22,0.2) !important; }
          .nav-btn-icon { width: 12px !important; height: 12px !important; }
          .mobile-menu-btn { width: 32px !important; height: 32px !important; border-radius: 8px !important; }

          /* 3. Hero Layout (สลับลำดับ: หัวข้อ -> ปุ่ม -> รูป) */
          .hero { padding: 100px 16px 30px !important; }
          .hero-title { font-size: 32px !important; margin-bottom: 12px !important; }
          .hero-eyebrow { padding: 5px 12px !important; font-size: 10px !important; margin-bottom: 16px !important; }
          
          /* 4. กล่องวิชา มินิมอล (ลดความรก) */
          .subject-ticker-wrap {
            background: transparent !important; border: none !important; box-shadow: none !important;
            flex-direction: row !important; flex-wrap: wrap !important; justify-content: center !important;
            padding: 0 !important; gap: 6px !important; margin-bottom: 24px !important;
          }
          .subject-ticker-inner { flex-wrap: wrap; justify-content: center; gap: 5px !important; }
          .subject-item-pill { 
            padding: 4px 10px !important; font-size: 10px !important; 
            background: white !important; border: 1px solid rgba(37,99,235,0.1) !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
          }

          /* Stats Box Grid 2x2 */
          .stats-bar { display: grid; grid-template-columns: 1fr 1fr; border-radius: 16px; margin-top: 32px !important; }
          .stat-item { padding: 12px !important; }
          .stat-val { font-size: 20px !important; }
        }
      `}</style>

      <div className="blob b1"/><div className="blob b2"/><div className="blob b3"/><div className="blob b4"/>

      <nav className={`nav-bar ${scrolled ? 'scrolled' : ''}`}>
        <div className={`nav-inner ${scrolled ? 'scrolled' : ''}`}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
            <div className="logo-ring">
              <div className="logo-box" style={{width:34,height:34,background:'white',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <img src="/icon.png" alt="TC" className="logo-img" style={{height:24,width:'auto',objectFit:'contain'}}
                  onError={(e:any)=>{e.target.style.display='none';e.target.parentNode.innerHTML='<span style="font-weight:900;font-size:12px;color:#2563eb">TC</span>';}}
                />
              </div>
            </div>
            <div>
              <p className="logo-title" style={{fontWeight:900,fontSize:17,background:'linear-gradient(135deg,#2563eb,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',lineHeight:1,margin:0,letterSpacing:'0.05em'}}>TC CENTER</p>
              <p className="logo-sub" style={{fontSize:9,fontWeight:700,color:'#f97316',letterSpacing:'0.18em',textTransform:'uppercase',margin:'3px 0 0'}}>The Convergence</p>
            </div>
          </Link>

          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {!loading && (user ? (
              <a href={getDashboardUrl()} className="btn-primary nav-register-btn">
                <LayoutDashboard className="nav-btn-icon" size={14}/> {getDashboardText()}
              </a>
            ) : (
              <>
                <Link href="/login" className="nav-login-btn" style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,color:'#2563eb',fontWeight:700,fontSize:13,textDecoration:'none'}}>
                  เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="btn-orange nav-register-btn">
                  <div className="shimmer-overlay"/>
                  <Rocket className="nav-btn-icon" size={14}/> <span style={{position:'relative'}}>เริ่มเรียนฟรี!</span>
                </Link>
              </>
            ))}
            <button onClick={()=>setIsMobileMenuOpen(!isMobileMenuOpen)} className="md-hide mobile-menu-btn" style={{width:38,height:38,borderRadius:10,border:'1.5px solid rgba(37,99,235,0.12)',background:'rgba(255,255,255,0.9)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#475569'}}>
              {isMobileMenuOpen ? <X size={18} color="#f97316"/> : <Menu size={18}/>}
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hero page-bg">
        <div className="hero-layout">
          <div className="hero-text-col" style={{position:'relative',zIndex:10}}>
            <div className="hero-eyebrow">
              <span>🎓</span>
              <span>TC แพลตฟอร์มติวครบจบในที่เดียว</span>
            </div>

            <h1 className="hero-title">
              เก่งขึ้น{' '}
              <span className="grad-orange">รอบด้าน!</span>
              <br/>
              สอบติด{' '}
              <span className="grad-blue">คณะในฝัน</span>
              {' '}🎯
            </h1>

            {/* ✨ ลำดับใหม่ใน Mobile: ปุ่ม CTA ขึ้นมาก่อนรูปภาพ */}
            <div className="hero-ctas" style={{marginTop: 0, marginBottom: '10px'}}>
              <a href={user ? getDashboardUrl() : "/register"} className="btn-primary" style={{padding: '14px 32px', fontSize: '16px'}}>
                <div className="shimmer-overlay"/>
                <Sparkles size={18} color="#fcd34d"/>
                <span style={{position:'relative'}}>{user ? "เข้าห้องเรียน" : "เริ่มเรียนฟรีวันนี้!"}</span>
              </a>
            </div>

            <div className="mobile-illo-only">
              <HeroIllustration />
            </div>

            <div className="subject-ticker-wrap">
              <div className="subject-ticker-inner">
                {subjects.map((s,i) => (
                  <div key={i} className="subject-item-pill" style={{
                    background: i === activeSubject ? s.color : 'rgba(255,255,255,0.9)',
                    color: i === activeSubject ? 'white' : '#64748b',
                    border: `1px solid ${i === activeSubject ? s.color : 'rgba(37,99,235,0.1)'}`
                  }}>
                    {s.emoji} {s.label}
                  </div>
                ))}
              </div>
            </div>

            <p style={{fontSize:15,color:'#64748b',lineHeight:1.6,maxWidth:480,margin:'0 0 20px',fontFamily:"'Sarabun',sans-serif",fontWeight:500}}>
              จัดตารางเรียนเองได้ มีคอร์สตั้งแต่ประถมถึงมหาลัย พร้อมดูแลทุกก้าว 🚀
            </p>

            <div className="hero-ctas md-show">
               <Link href="https://lin.ee/ZSDR4B3" target="_blank" className="btn-line">
                <MessageCircle size={17} color="#16a34a"/> ปรึกษาแอดมิน LINE
              </Link>
            </div>
          </div>

          <div className="desktop-illo-only">
            <HeroIllustration />
          </div>
        </div>

        <div style={{position:'relative',zIndex:10,maxWidth:1240,margin:'48px auto 0',padding:'0 24px'}}>
          <div className="stats-bar">
            {[
              {val:`${studentsCount.toLocaleString()}+`,lbl:'นักเรียน',emoji:'🎓'},
              {val:'98%',lbl:'ผ่านสอบ',emoji:'⭐'},
              {val:`${tutorsCount.toLocaleString()}+`,lbl:'ติวเตอร์',emoji:'👨‍🏫'},
              {val:'พี่หมี TC',lbl:'AI ช่วยสอน',emoji:'🤖'},
            ].map((s,i) => (
              <div className="stat-item" key={i}>
                <div style={{fontSize:20,marginBottom:4}}>{s.emoji}</div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-lbl" style={{fontSize:'9px'}}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div style={{maxWidth:600,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:12}}>
            <div className="logo-ring" style={{animation:'spin 8s linear infinite'}}>
              <div style={{width:32,height:32,background:'white',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:10,fontWeight:900,color:'#2563eb'}}>TC</span>
              </div>
            </div>
            <span style={{fontWeight:900,fontSize:18,color:'#0f172a'}}>TC CENTER</span>
            <Heart size={14} color="#ec4899" fill="#ec4899"/>
          </div>
          <p style={{fontSize:11,color:'#94a3b8',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',margin:'0 0 16px'}}>The Convergence of Academic Excellence</p>
          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
            {['#2563eb','#f97316','#ec4899','#7c3aed','#059669'].map((c,i) => (
              <div key={i} style={{width:8,height:8,borderRadius:'50%',background:c,animation:`pulse ${1.5+i*.2}s ease-in-out infinite`,animationDelay:`${i*0.2}s`}}/>
            ))}
          </div>
        </div>
      </footer>

      <FloatingAIMascot/>
    </div>
  );
}
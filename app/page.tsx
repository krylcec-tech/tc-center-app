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

  // ✨ Component รูปภาพ ใช้ซ้ำได้ทั้งจอคอมและมือถือ
  const HeroIllustration = () => (
    <div className="illo-container" style={{position:'relative',width:'100%'}}>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'85%',height:'85%',borderRadius:'50%',background:'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(249,115,22,0.06))',border:'2px dashed rgba(37,99,235,0.15)',animation:'bd2 8s ease-in-out infinite'}}/>
      <svg viewBox="0 0 400 380" style={{width:'100%',position:'relative',zIndex:5}} xmlns="http://www.w3.org/2000/svg">
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

        .btn-line {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px; border-radius: 14px;
          background: rgba(240,253,244,0.95);
          color: #15803d; font-weight: 800; font-size: 14px;
          text-decoration: none; border: 1.5px solid rgba(34,197,94,0.3);
          transition: all .3s cubic-bezier(.34,1.56,.64,1);
        }
        .btn-line:hover { transform: translateY(-2px); background: rgba(220,252,231,1); box-shadow: 0 10px 28px rgba(34,197,94,0.2); }

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
        .subject-item-pill {
          padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 800; transition: all .4s ease;
        }

        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 18px; border-radius: 100px;
          background: rgba(255,255,255,0.9);
          border: 1.5px solid rgba(249,115,22,0.25);
          font-size: 12px; font-weight: 700; color: #ea580c;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 16px rgba(249,115,22,0.12);
          animation: eyebrowPulse 2.5s ease-in-out infinite;
          margin-bottom: 24px;
        }
        @keyframes eyebrowPulse { 0%,100%{box-shadow:0 4px 16px rgba(249,115,22,0.12)} 50%{box-shadow:0 4px 24px rgba(249,115,22,0.28)} }

        .edu-float {
          position: absolute; pointer-events: none;
          animation: eduFloat 4s ease-in-out infinite;
        }
        @keyframes eduFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(4deg)} }

        .section { position: relative; z-index: 10; padding: 0 24px 80px; max-width: 1240px; margin: 0 auto; }
        .section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 16px; border-radius: 100px;
          background: rgba(37,99,235,0.07);
          border: 1px solid rgba(37,99,235,0.15);
          font-size: 11px; font-weight: 800; color: #2563eb;
          text-transform: uppercase; letter-spacing: .08em;
          margin-bottom: 12px;
        }
        .section-title { font-size: clamp(28px,4vw,40px); font-weight: 900; color: #0f172a; margin: 0 0 40px; }

        .edu-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }

        .edu-card {
          border-radius: 28px; padding: 32px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255,255,255,0.95);
          box-shadow: 0 4px 24px rgba(37,99,235,0.06);
          text-decoration: none; color: inherit;
          display: flex; flex-direction: column;
          transition: all .4s cubic-bezier(.34,1.4,.64,1);
          position: relative; overflow: hidden;
        }
        .edu-card:hover { transform: translateY(-10px); box-shadow: 0 20px 56px rgba(37,99,235,0.13); }
        .edu-card .card-bg-accent {
          position: absolute; top:-40px; right:-40px;
          width: 120px; height: 120px; border-radius: 50%;
          transition: transform .6s ease;
        }
        .edu-card:hover .card-bg-accent { transform: scale(2); }

        .card-icon-wrap {
          width: 60px; height: 60px; border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px; position: relative; z-index: 1;
          transition: all .3s cubic-bezier(.34,1.56,.64,1);
        }
        .edu-card:hover .card-icon-wrap { transform: scale(1.12) rotate(-4deg); }

        .card-emoji { font-size: 36px; position: absolute; top:-12px; right:-4px; z-index: 2; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15)); }

        .card-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 100px;
          font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: .08em;
          margin-bottom: 14px; width: fit-content;
        }

        .card-title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0 0 10px; line-height: 1.3; }
        .card-desc { font-size: 13px; color: #64748b; line-height: 1.65; margin: 0 0 24px; font-family:'Sarabun',sans-serif; flex: 1; }
        .card-cta { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800; margin-top: auto; }
        .cta-arrow {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: transform .25s ease;
        }
        .edu-card:hover .cta-arrow { transform: translateX(4px); }

        .ai-section {
          position: relative; z-index: 10; padding: 0 24px 80px;
          max-width: 1240px; margin: 0 auto;
        }
        .ai-banner {
          border-radius: 32px; overflow: hidden; position: relative;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
          padding: 56px 48px;
          box-shadow: 0 24px 80px rgba(15,23,42,0.3);
        }
        .ai-grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px);
          background-size: 32px 32px;
        }
        .ai-glow-1 { position: absolute; top:-100px; left:-100px; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 65%); pointer-events:none; }
        .ai-glow-2 { position: absolute; bottom:-100px; right:-50px; width:350px; height:350px; border-radius:50%; background:radial-gradient(circle,rgba(249,115,22,0.15) 0%,transparent 65%); pointer-events:none; }

        .subject-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 40px; }
        .subject-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 100px;
          font-size: 13px; font-weight: 700;
          border: 1.5px solid; cursor: default;
          transition: all .25s ease;
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.75);
          border-color: rgba(255,255,255,0.1);
        }
        .subject-pill:hover { background: rgba(255,255,255,0.12); color: white; }

        .testimonial-float {
          position: absolute;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 16px 20px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          border: 1.5px solid rgba(255,255,255,1);
          min-width: 200px; max-width: 240px;
          pointer-events: none;
        }
        .tf-top { top: 24px; right: 24px; animation: tfFloat1 5s ease-in-out infinite; }
        .tf-bot { bottom: 32px; right: 40px; animation: tfFloat2 6s ease-in-out infinite; }
        @keyframes tfFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes tfFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }

        .mobile-menu {
          position: fixed; top: 80px; left: 16px; right: 16px; z-index: 99;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(32px);
          border-radius: 24px;
          border: 1.5px solid rgba(255,255,255,0.95);
          box-shadow: 0 20px 60px rgba(37,99,235,0.12);
          padding: 20px; display: flex; flex-direction: column; gap: 10px;
          animation: menuDrop .3s cubic-bezier(.34,1.4,.64,1) both;
        }
        @keyframes menuDrop { from{opacity:0;transform:translateY(-12px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .mobile-link {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 16px; border-radius: 16px;
          font-weight: 700; font-size: 14px; color: #1e293b;
          text-decoration: none; background: rgba(248,250,255,0.8);
          border: 1.5px solid rgba(37,99,235,0.08);
          transition: all .2s ease;
        }
        .mobile-link:hover { background: rgba(37,99,235,0.06); border-color: rgba(37,99,235,0.2); }

        .footer { background: white; border-top: 1.5px solid rgba(37,99,235,0.08); padding: 48px 24px; text-align: center; }

        .card-scroll {
          display: flex; gap: 16px; overflow-x: auto;
          scroll-snap-type: x mandatory; padding-bottom: 8px;
          margin: 0 -24px; padding-left: 24px; padding-right: 24px;
        }
        .card-scroll::-webkit-scrollbar { display: none; }
        .card-scroll .edu-card { min-width: min(80vw,320px); scroll-snap-align: start; flex-shrink: 0; }
        @media(min-width:601px) { .card-scroll { display: grid; grid-template-columns: repeat(3,1fr); margin: 0; padding: 0; } .card-scroll .edu-card { min-width: auto; } }

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
        .stat-item:not(:last-child)::after { content:''; position:absolute; right:0; top:20%; bottom:20%; width:1px; background:rgba(37,99,235,0.1); }
        .stat-val { font-size: 28px; font-weight: 900; color: #0f172a; line-height: 1; margin-bottom: 4px; }
        .stat-lbl { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; }

        /* ✨ ✨ MOBILE OVERRIDES (แก้เฉพาะมือถือ) ✨ ✨ */
        .mobile-illo-only { display: none; }
        .desktop-illo-only { display: flex; align-items: center; justify-content: center; position: relative; }

        @media(max-width: 900px) {
          .hero-layout { grid-template-columns: 1fr; text-align: center; }
          .hero-text-col { align-items: center; }
          .hero-ctas { justify-content: center; }
          .desktop-illo-only { display: none; }
          
          /* ✨ แสดงรูปภาพแทรกกลาง (เฉพาะมือถือ) */
          .mobile-illo-only { display: flex; justify-content: center; width: 100%; }
          
          /* ✨ ย่อรูปภาพลงโดยคุม max-width ให้แคบลง (เนียนกว่า scale) */
          .mobile-illo-only .illo-container { max-width: 300px !important; margin: -20px auto -10px auto; }
          
          .edu-grid { grid-template-columns: repeat(2,1fr); }
          .ai-inner { grid-template-columns: 1fr !important; }
        }

        @media(max-width: 640px) {
          /* 1. Navbar มินิมอล & แคบลง */
          .nav-bar { padding: 8px 16px !important; }
          .nav-inner { padding: 6px 10px !important; border-radius: 16px !important; }
          .logo-box { width: 28px !important; height: 28px !important; border-radius: 8px !important; }
          .logo-img { height: 18px !important; }
          .logo-title { font-size: 14px !important; }
          .logo-sub { display: none !important; } /* ซ่อนคำว่า The Convergence เพื่อประหยัดพื้นที่ */
          
          /* ปุ่มใน Navbar เล็กลง */
          .nav-login-btn { padding: 6px 10px !important; font-size: 12px !important; border-radius: 8px !important; border: none !important; background: transparent !important; }
          .nav-register-btn { padding: 6px 12px !important; font-size: 12px !important; border-radius: 10px !important; box-shadow: 0 4px 12px rgba(249,115,22,0.2) !important; }
          .nav-btn-icon { width: 14px !important; height: 14px !important; }
          .mobile-menu-btn { width: 32px !important; height: 32px !important; border-radius: 8px !important; }

          /* 2. Hero Layout & ลำดับ */
          .hero { padding: 100px 16px 40px !important; }
          .hero-title { font-size: 32px !important; margin-bottom: 16px !important; line-height: 1.2 !important; }
          .hero-eyebrow { padding: 6px 14px !important; font-size: 11px !important; margin-bottom: 16px !important; }
          
          /* 3. กล่องวิชา (มินิมอล ถอดกล่องขาวทิ้ง) */
          .subject-ticker-wrap {
            background: transparent !important; border: none !important; box-shadow: none !important;
            flex-direction: column !important; align-items: center !important;
            padding: 0 !important; margin-bottom: 20px !important; gap: 8px !important;
          }
          .subject-ticker-inner { flex-wrap: wrap !important; justify-content: center !important; gap: 6px !important; }
          .subject-item-pill { 
            padding: 4px 10px !important; font-size: 11px !important; 
            background: white !important; border: 1px solid rgba(37,99,235,0.1) !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
          }

          /* 4. Stats Box Grid 2x2 */
          .stats-bar { 
            display: grid !important; grid-template-columns: 1fr 1fr !important; 
            border-radius: 16px !important; padding: 0 !important; gap: 0 !important;
          }
          .stat-item { padding: 16px 12px !important; border-bottom: 1px solid rgba(37,99,235,0.05); border-right: 1px solid rgba(37,99,235,0.05); }
          .stat-item:nth-child(2n) { border-right: none; }
          .stat-item:nth-last-child(-n+2) { border-bottom: none; }
          .stat-item::after { display: none !important; }
          .stat-val { font-size: 24px !important; }

          .edu-grid { grid-template-columns: 1fr; }
          .ai-banner { padding: 24px 20px; }
          .subject-row { justify-content: center; }
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

          <div style={{display:'none',alignItems:'center',gap:4,background:'rgba(248,250,255,0.8)',padding:'6px',borderRadius:14,border:'1px solid rgba(37,99,235,0.08)'}} className="lg-show">
            <Link href="/student/courses" className="nav-link">
              <BookOpen size={15} color="#2563eb"/> คอร์สเรียน
            </Link>
            <div style={{width:1,height:16,background:'rgba(37,99,235,0.12)',margin:'0 4px'}}/>
            <Link href="#" className="nav-link">
              <Users size={15} color="#ec4899"/> ทีมติวเตอร์
            </Link>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {!loading && (user ? (
              <a href={getDashboardUrl()} className="btn-primary nav-register-btn">
                <LayoutDashboard className="nav-btn-icon" size={14}/> {getDashboardText()}
              </a>
            ) : (
              <>
                <Link href="/login" className="md-show nav-login-btn" style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,color:'#2563eb',fontWeight:700,fontSize:13,textDecoration:'none'}}>
                  <User className="nav-btn-icon" size={14}/> เข้าสู่ระบบ
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

        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <Link href="/student/courses" className="mobile-link" onClick={()=>setIsMobileMenuOpen(false)}>
              <span style={{width:36,height:36,borderRadius:10,background:'rgba(37,99,235,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>📖</span>
              คอร์สเรียนทั้งหมด
            </Link>
            <div style={{height:1,background:'rgba(37,99,235,0.07)',margin:'4px 0'}}/>
            {user ? (
              <a href={getDashboardUrl()} className="mobile-link" onClick={()=>setIsMobileMenuOpen(false)} style={{background:'linear-gradient(135deg,#2563eb,#1d4ed8)',color:'white',border:'none',justifyContent:'center'}}>
                <LayoutDashboard size={18}/> {getDashboardText()}
              </a>
            ) : (
              <>
                <Link href="/login" className="mobile-link" onClick={()=>setIsMobileMenuOpen(false)} style={{justifyContent:'center'}}>
                  <User size={16}/> เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="mobile-link" onClick={()=>setIsMobileMenuOpen(false)} style={{background:'linear-gradient(135deg,#f97316,#ec4899)',color:'white',border:'none',justifyContent:'center'}}>
                  <Rocket size={16}/> สมัครเรียนออนไลน์ ✨
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hero page-bg">
        <div className="hero-layout">
          <div className="hero-text-col" style={{position:'relative',zIndex:10}}>
            
            {/* 1. Eyebrow */}
            <div className="hero-eyebrow">
              <span>🎓</span>
              <span>TC แพลตฟอร์มติวครบจบในที่เดียว</span>
            </div>

            {/* 2. Title */}
            <h1 className="hero-title">
              เก่งขึ้น{' '}
              <span className="grad-orange">รอบด้าน!</span>
              <br/>
              สอบติด{' '}
              <span className="grad-blue">คณะในฝัน</span>
              {' '}🎯
            </h1>

            {/* 3. รูปภาพ (แสดงแทรกเฉพาะในมือถือ ย่อขนาดลง) */}
            <div className="mobile-illo-only">
              <HeroIllustration />
            </div>

            {/* 4. Subject Ticker (แบบมินิมอล ถอดกล่องขาวทิ้งในมือถือ) */}
            <div className="subject-ticker-wrap">
              <span style={{fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em'}}>ติวได้ทุกวิชา:</span>
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

            {/* 5. Description */}
            <p style={{fontSize:15,color:'#64748b',lineHeight:1.6,maxWidth:480,margin:'0 0 24px',fontFamily:"'Sarabun',sans-serif",fontWeight:500}}>
              จัดตารางเรียนเองได้ มีคอร์สตั้งแต่ประถมถึงมหาลัย พร้อมดูแลทุกก้าว 🚀
            </p>

            {/* 6. Buttons */}
            <div className="hero-ctas">
              <a href={user ? getDashboardUrl() : "/register"} className="btn-primary" style={{padding: '14px 28px'}}>
                <div className="shimmer-overlay"/>
                <Sparkles size={16} color="#fcd34d"/>
                <span style={{position:'relative'}}>{user ? "เข้าห้องเรียน" : "เริ่มเรียนฟรีวันนี้!"}</span>
              </a>
              <Link href="https://lin.ee/ZSDR4B3" target="_blank" className="btn-line" style={{padding: '14px 28px'}}>
                <MessageCircle size={16} color="#16a34a"/> ปรึกษาแอดมิน
              </Link>
            </div>
          </div>

          {/* Right: Illustration (เฉพาะ Desktop) */}
          <div className="desktop-illo-only">
            <HeroIllustration />
          </div>
        </div>

        {/* Stats bar */}
        <div style={{position:'relative',zIndex:10,maxWidth:1240,margin:'48px auto 0',padding:'0 24px'}}>
          <div className="stats-bar">
            {[
              {val:`${studentsCount.toLocaleString()}+`,lbl:'นักเรียน',emoji:'🎓'},
              {val:'98%',lbl:'ผ่านสอบ',emoji:'⭐'},
              {val:`${tutorsCount.toLocaleString()}+`,lbl:'ติวเตอร์',emoji:'👨‍🏫'},
              {val:'พี่หมี TC',lbl:'AI ช่วยสอน',emoji:'🤖'},
            ].map((s,i) => (
              <div className="stat-item" key={i}>
                <div style={{fontSize:22,marginBottom:6}}>{s.emoji}</div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <div style={{position:'relative',zIndex:10,maxWidth:1240,margin:'0 auto',padding:'60px 24px 80px'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div className="section-tag"><Zap size={11}/> ทำไมต้อง TC Center</div>
          <h2 className="section-title">ครบ จบ ที่เดียว 🏆</h2>
        </div>

        <div className="card-scroll">
          {[
            {emoji:'📚',icon:GraduationCap,title:'คอร์สเรียนครบสูตร',desc:'เนื้อหาแน่น ย่อยง่าย พร้อมลุยทุกสนามสอบ ตั้งแต่ป.1 จนถึงมหาวิทยาลัย ออกแบบโดยครูผู้เชี่ยวชาญ',link:'/student/courses',accent:'#2563eb',accentLight:'rgba(37,99,235,0.08)',tag:'คอร์สใหม่ทุกสัปดาห์',iconGrad:'linear-gradient(135deg,#2563eb,#1d4ed8)'},
            {emoji:'👨‍🏫',icon:Users,title:'ติวเตอร์สุดปัง',desc:'เรียนกับพี่ๆ ใจดีจากมหาลัยชั้นนำ สอนสนุก เข้าใจง่าย ดูแลรายบุคคล ไม่ทิ้งกัน',link:'#',accent:'#ec4899',accentLight:'rgba(236,72,153,0.08)',tag:'50+ ติวเตอร์คุณภาพ',iconGrad:'linear-gradient(135deg,#ec4899,#be185d)'},
            {emoji:'🤖',icon:Brain,title:'AI ติวเตอร์ พี่หมี TC',desc:'พี่หมี TC AI พร้อมตอบทุกคำถาม ส่งรูปโจทย์มาได้เลย อธิบายทีละขั้นตอน ไม่มีเบื่อ',link:'/student/ai-tutor',accent:'#7c3aed',accentLight:'rgba(124,58,237,0.08)',tag:'ตอบได้ทุกวิชา',iconGrad:'linear-gradient(135deg,#7c3aed,#4f46e5)'},
          ].map((c,i) => (
            <Link key={i} href={c.link} className="edu-card">
              <div className="card-bg-accent" style={{background:`radial-gradient(circle,${c.accentLight},transparent)`}}/>
              <div style={{position:'relative',marginBottom:8}}>
                <div className="card-icon-wrap" style={{background:c.iconGrad,boxShadow:`0 8px 24px ${c.accentLight.replace('.08','0.3')}`}}>
                  <c.icon size={28} color="white" strokeWidth={2.5}/>
                </div>
                <span className="card-emoji">{c.emoji}</span>
              </div>
              <div className="card-tag" style={{background:c.accentLight,color:c.accent,border:`1px solid ${c.accentLight.replace('.08','0.2')}`}}>
                <Star size={9} fill={c.accent} color={c.accent}/> {c.tag}
              </div>
              <h3 className="card-title">{c.title}</h3>
              <p className="card-desc">{c.desc}</p>
              <div className="card-cta" style={{color:c.accent}}>
                ดูรายละเอียด
                <div className="cta-arrow" style={{background:c.accentLight}}>
                  <ChevronRight size={14} color={c.accent}/>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════ AI SECTION ═══════════════ */}
      <div className="ai-section">
        <div className="ai-banner">
          <div className="ai-grid-bg"/>
          <div className="ai-glow-1"/>
          <div className="ai-glow-2"/>

          <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:40,alignItems:'center',position:'relative',zIndex:10}} className="ai-inner">

            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',borderRadius:100,background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.25)',marginBottom:20}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'#34d399',display:'inline-block',animation:'pulse 1.5s infinite'}}/>
                <span style={{fontSize:11,fontWeight:700,color:'#a5b4fc',textTransform:'uppercase',letterSpacing:'0.1em'}}>New Feature</span>
              </div>

              <h2 style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,color:'white',margin:'0 0 16px',lineHeight:1.2}}>
                พี่หมี{' '}
                <span style={{background:'linear-gradient(135deg,#f97316,#ec4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>TC AI</span>
                {' '}พร้อมช่วยสอน 🐻🤖
              </h2>
              <p style={{fontSize:15,color:'rgba(255,255,255,0.65)',lineHeight:1.7,margin:'0 0 28px',maxWidth:480,fontFamily:"'Sarabun',sans-serif"}}>
                ถามได้ทุกวิชา ส่งรูปโจทย์มา AI จะอธิบายทีละขั้นตอน ไม่มีวันหยุด ไม่มีเบื่อ!
              </p>

              <div className="subject-row">
                {['🔢 คณิต','🔬 วิทย์','📝 อังกฤษ','⚡ ฟิสิกส์','🧪 เคมี','📐 เรขา','📊 สถิติ','🌏 คอร์สพิเศษ'].map((s,i) => (
                  <div key={i} className="subject-pill">{s}</div>
                ))}
              </div>

              <Link href="/student/ai-tutor" className="btn-orange" style={{display:'inline-flex'}}>
                <div className="shimmer-overlay"/>
                <Brain size={17}/>
                <span style={{position:'relative'}}>ลองคุยกับพี่หมี AI เลย!</span>
              </Link>
            </div>

            {/* AI character preview */}
            <div style={{position:'relative',display:'none',flexDirection:'column',alignItems:'center'}} className="ai-char-show">
              <svg width="180" height="220" viewBox="0 0 180 220" xmlns="http://www.w3.org/2000/svg">
                <rect x="45" y="130" width="90" height="80" rx="20" fill="#7c3aed"/>
                <rect x="58" y="148" width="64" height="44" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
                <circle cx="72" cy="160" r="4" fill="#34d399"/>
                <circle cx="90" cy="160" r="4" fill="#fbbf24"/>
                <rect x="68" y="173" width="44" height="6" rx="3" fill="rgba(255,255,255,0.25)"/>
                <rect x="68" y="173" width="30" height="6" rx="3" fill="#34d399"/>
                <rect x="78" y="108" width="24" height="24" rx="5" fill="#6d28d9"/>
                <rect x="35" y="50" width="110" height="62" rx="24" fill="#6d28d9"/>
                <line x1="90" y1="50" x2="90" y2="28" stroke="#6d28d9" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="90" cy="20" r="10" fill="#f97316"/>
                <circle cx="90" cy="20" r="5" fill="white" opacity=".7"/>
                <rect x="30" y="62" width="8" height="32" rx="4" fill="#5b21b6"/>
                <rect x="142" y="62" width="8" height="32" rx="4" fill="#5b21b6"/>
                <rect x="50" y="60" rx="10" width="34" height="28" fill="#0f172a"/>
                <rect x="96" y="60" rx="10" width="34" height="28" fill="#0f172a"/>
                <rect x="54" y="64" rx="7" width="26" height="20" fill="#38bdf8" opacity=".9"/>
                <rect x="100" y="64" rx="7" width="26" height="20" fill="#38bdf8" opacity=".9"/>
                <path d="M56 95 Q90 108 124 95" stroke="#34d399" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <rect x="133" y="140" width="18" height="55" rx="9" fill="#6d28d9"/>
                <rect x="29" y="140" width="18" height="55" rx="9" fill="#6d28d9"/>
              </svg>

              <div className="testimonial-float" style={{position:'relative',margin:'12px 0',animation:'tfFloat1 4s ease-in-out infinite'}}>
                <p style={{margin:0,fontSize:12,fontWeight:700,color:'#0f172a'}}>💬 "พี่หมีอธิบายดีมาก!"</p>
                <p style={{margin:'4px 0 0',fontSize:11,color:'#64748b',fontFamily:"'Sarabun',sans-serif"}}>น้องมิน ม.5 สอบได้ A</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="footer">
        <div style={{maxWidth:600,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:12}}>
            <div className="logo-ring" style={{animation:'spin 8s linear infinite'}}>
              <div style={{width:32,height:32,background:'white',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:10,fontWeight:900,color:'#2563eb'}}>TC</span>
              </div>
            </div>
            <span style={{fontWeight:900,fontSize:18,color:'#0f172a',letterSpacing:'0.05em'}}>TC CENTER</span>
            <Heart size={14} color="#ec4899" fill="#ec4899"/>
          </div>
          <p style={{fontSize:11,color:'#94a3b8',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'Sarabun',sans-serif",margin:'0 0 16px'}}>The Convergence of Academic Excellence</p>
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
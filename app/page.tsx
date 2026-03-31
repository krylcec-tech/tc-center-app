'use client'
import React from 'react';
import Link from 'next/link';
import { 
  Star, ArrowRight, PlayCircle, MessageCircle, 
  Trophy, CheckCircle2, ChevronRight, Award
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 selection:bg-blue-200">
      
      {/* 🌟 Top Banner (แถบโปรโมชั่นด้านบนสุด สไตล์เว็บไทยชอบมี) */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-center py-2.5 text-xs md:text-sm font-black tracking-wide flex justify-center items-center gap-2">
        <span>🔥โปรโมชั่นอีก มากมายใน เพจ TC Center</span>
        <Link href="/register" className="bg-white text-blue-600 px-3 py-1 rounded-full text-[10px] uppercase hover:scale-105 transition-transform">
          สมัครเลย
        </Link>
      </div>

      {/* 🌟 Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          {/* Logo */}
            <div className="flex items-center gap-3">
              {/* 👇 เปลี่ยนตรงนี้เป็นรูปโลโก้ของคุณ */}
              <img src="/images/logo.png.jpg" alt="TC Center Logo" className="h-12 w-auto object-contain" />
              
              <div className="flex flex-col">
                <span className="text-xl font-black text-blue-900 leading-none">TC CENTER</span>
                <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase mt-0.5">The Convergence</span>
              </div>
            </div>
          
          {/* Menu */}
          <div className="hidden lg:flex items-center gap-8 font-black text-sm text-gray-600">
            <Link href="/student/courses" className="hover:text-blue-600 transition-colors">คอร์สเรียนทั้งหมด</Link>
            <Link href="#tutors" className="hover:text-blue-600 transition-colors">ทีมติวเตอร์ของเรา</Link>
            <Link href="#reviews" className="hover:text-blue-600 transition-colors">รีวิวความสำเร็จ</Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden md:flex px-5 py-2.5 font-black text-sm text-gray-500 hover:text-blue-600 transition-all">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="px-6 py-2.5 bg-blue-600 text-white font-black text-sm rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
              สมัครเรียนออนไลน์
            </Link>
          </div>
        </div>
      </nav>

      {/* 🌟 Hero Section (สว่างๆ สดใส) */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden bg-gradient-to-b from-white to-[#F8FAFC]">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-50 -z-10 translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-100 rounded-full blur-[80px] opacity-50 -z-10 -translate-x-1/2 translate-y-1/4"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left z-10 relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-xs font-black mb-6 border border-orange-200">
              <Award size={16} /> การันตีคุณภาพด้วยทีมติวเตอร์ระดับประเทศ
            </div>
            <h1 className="text-5xl lg:text-[4.5rem] font-black leading-[1.1] mb-6 text-gray-900 tracking-tight">
              เก่งขึ้น <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">จนครูทัก</span> <br />
              สอบติดคณะในฝัน!
            </h1>
            <p className="text-lg text-gray-600 font-medium mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              เรียนสนุก เข้าใจง่าย ได้เทคนิคแพรวพราว ไม่น่าเบื่อ! 
              พร้อมระบบจองคิวเรียนและเอกสารประกอบการเรียนที่ครบครันที่สุด
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/student/courses" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-black rounded-full flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95 text-lg">
                ดูคอร์สเรียนเลย <ChevronRight size={20} />
              </Link>
              <Link href="https://lin.ee/ZSDR4B3" target="_blank" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-black rounded-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm border border-gray-200 active:scale-95 text-lg">
                <MessageCircle size={20} className="text-[#06C755]" /> ปรึกษาแอดมินฟรี
              </Link>
            </div>
          </div>
          
          {/* Hero Image / Video Box */}
          <div className="relative z-10 mx-auto w-full max-w-[500px] lg:max-w-none">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white bg-blue-50 aspect-[4/3] lg:aspect-video flex items-center justify-center group cursor-pointer">
              {/* ใส่รูปปกคลิปของสถาบันตรงนี้ */}
              <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" alt="Students learning" />
              <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-blue-900/30 transition-colors"></div>
              
              {/* Play Button Mockup */}
              <div className="relative w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/30 group-hover:scale-110 transition-transform">
                <PlayCircle size={40} fill="currentColor" className="ml-1" />
              </div>

              {/* Badges ลอยๆ เพิ่มความน่ารัก */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow-lg flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 size={18}/></div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-500 uppercase">สอนโดย</p>
                  <p className="text-sm font-black text-gray-900 leading-none">ผู้เชี่ยวชาญเฉพาะทาง</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 Review Section (สไตล์การ์ดสีขาว ตัดกรอบเงาอ่อนๆ) */}
      <section id="reviews" className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-blue-900">รีวิวความสำเร็จจากน้องๆ</h2>
            <p className="text-gray-500 font-bold text-lg">ส่วนหนึ่งของรอยยิ้มและความภาคภูมิใจที่ TC Center</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { name: "น้องริว", text: "ที่นี่มีเทคนิคคิดลัดเยอะมาก ช่วยให้ผมทำโจทย์ได้เร็วขึ้น และนำไปใช้ทำข้อสอบได้จริง ตรงจุดสุดๆ", school: "ติด วิศวะฯ จุฬาฯ", badge: "ที่ 1 ประเทศ" },
              { name: "น้องชีตรอง", text: "ได้ Trick และแนวข้อสอบที่หลากหลาย รวมถึงยังสามารถนำความรู้ไปประยุกต์สอนเพื่อนๆ ได้ด้วยครับ", school: "ติด แพทย์ ศิริราชฯ", badge: "คะแนนเต็ม 100" },
              { name: "น้องพิม", text: "พี่ๆ สอนเข้าใจง่าย มีโจทย์ให้ทำเยอะ รู้สึกว่าตัวเองเป็นระบบมากขึ้น ชอบฟังพี่ๆ เล่าเรื่องสุดๆ ค่ะ", school: "เตรียมอุดมศึกษา", badge: "สอบเข้า ม.4" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 bg-blue-50 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <img src={`https://i.pravatar.cc/150?img=${idx+30}`} className="w-full h-full object-cover" alt={item.name} />
                </div>
                <h4 className="font-black text-xl text-gray-900 mb-1">{item.name}</h4>
                <div className="flex gap-1 mb-6 text-yellow-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-gray-600 font-medium mb-8 leading-relaxed text-sm flex-1">"{item.text}"</p>
                <div className="flex gap-2 w-full">
                  <span className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-[11px] font-black uppercase">{item.badge}</span>
                  <span className="flex-1 bg-cyan-50 text-cyan-600 py-2 rounded-xl text-[11px] font-black uppercase">{item.school}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-black text-sm shadow-md hover:bg-blue-700 transition-colors">ดูรีวิวทั้งหมด</button>
          </div>
        </div>
      </section>

      {/* 🌟 Tutor Section (สไตล์การ์ดสีน้ำเงินเจาะทะลุ แบบเว็บติวเตอร์ชอบใช้) */}
      <section id="tutors" className="py-20 bg-gradient-to-b from-[#F8FAFC] to-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-blue-900">การันตีคุณภาพด้วยทีมติวเตอร์ระดับประเทศ</h2>
            <p className="text-gray-500 font-bold text-lg">เรียนกับตัวจริง รู้ลึก รู้จริง พร้อมถ่ายทอดทุกเทคนิค</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: 'พี่ช้าง MATH', fullname: 'อ.มนตรี นิรันดร์ศิริพงศ์' },
              { name: 'พี่กอล์ฟ MATH', fullname: 'อ.ชวลิต กุลคีรีรัตน์' },
              { name: 'พี่เอ๋ MATH', fullname: 'อ.วิเศษ กี่สุขพันธ์' },
              { name: 'พี่ภูมิ MATH', fullname: 'อ.สิทธิเดช เลนุกูล' }
            ].map((tutor, i) => (
              <div key={i} className="bg-[#007AFC] rounded-[2rem] md:rounded-[2.5rem] pt-8 px-4 pb-4 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/20 transition-all">
                {/* 📌 เปลี่ยน src ด้านล่างนี้เป็นรูปติวเตอร์พื้นใส (PNG) ของคุณ */}
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white/20 rounded-full mb-4 border-4 border-white/30 overflow-hidden z-10 group-hover:scale-105 transition-transform">
                    <img src={`https://i.pravatar.cc/200?img=${i+11}`} className="w-full h-full object-cover" alt={tutor.name} />
                </div>
                
                {/* กล่องชื่อสีขาว */}
                <div className="bg-white w-full py-4 px-2 rounded-2xl md:rounded-3xl z-20 shadow-sm">
                  <h4 className="font-black text-blue-600 text-base md:text-lg mb-1">{tutor.name}</h4>
                  <p className="text-gray-500 text-[9px] md:text-[10px] font-black">{tutor.fullname}</p>
                </div>
                
                {/* ลายกราฟิกพื้นหลัง */}
                <div className="absolute top-0 right-0 opacity-10 text-white font-black text-9xl -translate-y-4 translate-x-4 select-none">TC</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🌟 Footer CTA (แถบชวนสมัครเรียน สีสว่างๆ เป็นมิตร) */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[3rem] p-10 md:p-16 text-center text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
            <Trophy className="mx-auto text-yellow-300 mb-6 opacity-80" size={64} />
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">พร้อมที่จะอัปเกรดคะแนนหรือยัง?</h2>
            <p className="text-blue-100 font-bold mb-10 text-lg md:text-xl max-w-2xl mx-auto">
              มาร่วมเป็นส่วนหนึ่งของความสำเร็จ สมัครเรียนวันนี้เพื่อรับสิทธิพิเศษก่อนใคร!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register" className="bg-white text-blue-600 px-10 py-4 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-lg">
                สมัครสมาชิกเลย
              </Link>
              <Link href="https://lin.ee/ZSDR4B3" target="_blank" className="bg-blue-700/50 backdrop-blur border border-blue-400/50 text-white px-10 py-4 rounded-full font-black text-lg hover:bg-blue-700/80 transition-colors flex items-center justify-center gap-2">
                <MessageCircle size={20} /> สอบถามเพิ่มเติม
              </Link>
            </div>
            
            {/* กราฟิกตกแต่ง */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-400/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          </div>
        </div>
      </section>

      {/* Footer กะทัดรัด */}
      <footer className="bg-gray-50 py-8 border-t border-gray-200 text-center">
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
          © 2026 TC CENTER LEARNING HUB. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
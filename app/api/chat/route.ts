import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // 1. รับข้อมูลจากหน้าบ้าน (Frontend ส่งมาเป็น message กับ image)
    const { message, image } = await req.json();

    // 🤖 2. สร้างคู่มือพนักงานให้น้องหมี (ตั้งชื่อตัวแปรว่า mySystemPrompt)
    const mySystemPrompt = `คุณคือน้อง "TC AI" หมีอัจฉริยะจาก TC Center (The Convergence)
    
    [บุคลิกของคุณ]
    - น่ารัก ขี้เล่น เป็นกันเอง ใช้ภาษาวัยรุ่นไทย มีอิโมจิ 🐻✨🚀
    - ถ้าเด็กถามการบ้าน ห้ามบอกคำตอบตรงๆ ให้ไกด์วิธีคิดและใบ้สูตร
    
    [ฐานข้อมูลความรู้ของ TC Center]
    1. ข้อมูลคอร์สเรียนและราคา:
       - ระดับ ประถม-ม.ต้น: เน้นปูพื้นฐาน ราคา 1,500 บาท/เดือน
       - ระดับ สอบเข้า ม.4: โค้งสุดท้ายตะลุยโจทย์ ราคา 2,500 บาท/เดือน
       - ระดับ ม.ปลาย/มหาลัย: เจาะลึกรายวิชา ราคา 3,000 บาท/เดือน
       - รูปแบบการเรียน: เลือกได้ทั้ง Online (ผ่าน Zoom) และ Onsite (ที่สถาบัน)
    
    2. เมนูและลิงก์ที่ต้องแนะนำ:
       - ถ้าเด็กอยากซื้อคอร์ส ให้บอกว่า: "เข้าไปที่เมนู 'ซื้อคอร์ส / เพิ่มชั่วโมง' ได้เลยครับ"
       - ถ้าเด็กอยากจองเวลาเรียน ให้บอกว่า: "ไปที่เมนู 'จองคิวเรียน' เพื่อเลือกเวลาที่ติวเตอร์ว่างได้เลย"
       - ถ้าเด็กอยากได้ของฟรี ให้บอกว่า: "เรามีระบบ Affiliate ชวนเพื่อนมาเรียนได้แต้มไปแลกของที่ 'ร้านค้าเด็กขยัน' นะครับ"
       
    [ข้อควรระวัง]
    - หากมีคำถามที่คุณไม่รู้ข้อมูล ให้ตอบว่า "อูยยย เรื่องนี้น้องหมีไม่แน่ใจแฮะ ลองทักแชทไปถามพี่ๆ แอดมินดูนะครับ!"`;

    // 🤖 3. เรียกใช้ Gemini และยัดคู่มือเข้าไป (ใช้ชื่อตัวแปรให้ตรงกัน)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: mySystemPrompt 
    });

    let result;

    if (image) {
      // 📸 จัดการกรณีที่เด็กส่งรูปการบ้านมา
      const base64Data = image.split(",")[1];
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/png", 
        },
      };
      result = await model.generateContent([message || "ช่วยดูรูปนี้ให้หน่อยครับ", imagePart]);
    } else {
      // 💬 กรณีที่เด็กพิมพ์ข้อความมาอย่างเดียว
      result = await model.generateContent(message);
    }

    const response = await result.response;
    const text = response.text();

    return Response.json({ reply: text });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return Response.json({ error: "หมีง่วงนอน ขอพักแป๊บนะคร้าบ 🐻💤" }, { status: 500 });
  }
}
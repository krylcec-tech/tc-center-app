export async function POST(req: Request) {
  try {
    console.log("🟢 [Backend] สตาร์ทเครื่อง! ตรวจสอบ API Key...");
    
    // ✨ 1. ใช้ .trim() ตัดช่องว่างที่เผลอก๊อปติดมาทิ้งให้หมด! (ตัวการใหญ่)
    const apiKey = process.env.GEMINI_API_KEY?.trim(); 
    
    if (!apiKey) {
      console.log("❌ ไม่พบ API Key");
      return Response.json({ error: "Missing API Key" }, { status: 500 });
    }

    // 💡 2. ถาม Google เลยว่า "คีย์นี้ใช้อะไรได้บ้าง?" (List Models)
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    if (!listData.models) {
        console.error("🚨 [Google API Error] รหัสนี้ใช้ไม่ได้ ข้อมูลจาก Google:", listData);
        return Response.json({ error: "Google ไม่อนุมัติ API Key นี้" }, { status: 500 });
    }

    // 💡 3. กรองชื่อรุ่นที่เอาไว้แชทได้ออกมา
    const availableModels = listData.models
        .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
        .map((m: any) => m.name); // จะได้ชื่อเป๊ะๆ เช่น "models/gemini-1.5-flash"

    console.log(`✅ คีย์ปกติดี! มีสมองให้เลือก ${availableModels.length} รุ่น`);

    // 💡 4. เลือกรุ่นที่ดีที่สุด (มีอันไหนใช้อันนั้น)
    let selectedModel = availableModels[0]; 
    for (const model of availableModels) {
        if (model.includes("gemini-1.5-flash")) {
            selectedModel = model;
            break;
        }
    }

    console.log(`🚀 ระบบบังคับใช้สมองรุ่น: ${selectedModel}`);

    // 💡 5. เตรียมคำสั่ง
    const { message, image } = await req.json();
    const persona = `[คู่มือ]: คุณคือน้อง "TC AI" หมีอัจฉริยะจาก TC Center ช่วยสอนการบ้านโดยไม่เฉลยคำตอบตรงๆ ให้ไกด์วิธีคิด ใช้ภาษาวัยรุ่นน่ารักๆ มีอิโมจิ 🐻\n\nข้อความจากนักเรียน: `;
    
    let parts: any[] = [{ text: persona + (message || "สวัสดี") }];
    if (image && image.includes(",")) {
      const base64Data = image.split(",")[1];
      parts.push({ inline_data: { mime_type: "image/png", data: base64Data } });
      console.log("📸 แนบรูปภาพสำเร็จ");
    }

    // 💡 6. ยิงตรงหา Google ด้วยรุ่นที่หาเจอ
    const chatUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`;
    
    const chatRes = await fetch(chatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: parts }] })
    });

    const chatData = await chatRes.json();

    if (!chatRes.ok) {
       console.error("❌ [Google Reject]:", chatData);
       return Response.json({ error: "Google ปฏิเสธตอนตอบคำถาม" }, { status: 500 });
    }

    const replyText = chatData.candidates[0].content.parts[0].text;
    console.log("✅ [Backend] น้องหมีตอบกลับสำเร็จปิ๊ง!");
    
    return Response.json({ reply: replyText });

  } catch (error: any) {
    console.error("❌ [System Error]:", error);
    return Response.json({ error: "ระบบล่ม" }, { status: 500 });
  }
}
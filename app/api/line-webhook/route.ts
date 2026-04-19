import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = body.events; // LINE จะส่งข้อมูลมาในก้อน events

    if (events && events.length > 0) {
      for (const event of events) {
        
        // ถ้ามีคนพิมพ์แชทเข้ามาในกลุ่ม
        if (event.type === 'message' && event.message.type === 'text') {
          const groupId = event.source.groupId; // 👈 นี่คือสิ่งที่เราต้องการ!
          const userMessage = event.message.text.trim();

          // ถ้าพิมพ์คำว่า "ขอไอดีกลุ่ม" ให้บอทตอบกลับ
          if (groupId && userMessage === 'ขอไอดีกลุ่ม') {
            const replyToken = event.replyToken;
            
            // 🔴 เอา Channel Access Token จากสเต็ป 1 มาใส่ตรงนี้ครับ
            const CHANNEL_ACCESS_TOKEN = "yFsSzXQaoTo2i0AzAbxUN1Urd/xptcgOEJpJRjgx35lzYdOpBEzBsMwzgp/1dBLXS2I5m1/b/lqNO0bdRvn4N07nmrRggCnnhLoB+WgfSu63oRbVCiB5D7jUJZ4ZY2QZiqiDsd73OtaPNCP+I4e7ugdB04t89/1O/w1cDnyilFU=";

            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
              },
              body: JSON.stringify({
                replyToken: replyToken,
                messages: [{
                  type: 'text',
                  text: `รหัสกลุ่มของคุณคือ:\n${groupId}\n\n(ก๊อปปี้รหัสนี้ไปให้ทีม Dev ได้เลยครับ CEO! 😎)`
                }]
              })
            });
          }
        }
      }
    }

    // ต้องตอบกลับ LINE ว่ารับข้อมูลสำเร็จ
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
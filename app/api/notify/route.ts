import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    // 🔑 Token และ Group ID ที่คุณให้มา
    const CHANNEL_ACCESS_TOKEN = "yFsSzXQaoTo2i0AzAbxUN1Urd/xptcgOEJpJRjgx35lzYdOpBEzBsMwzgp/1dBLXS2I5m1/b/lqNO0bdRvn4N07nmrRggCnnhLoB+WgfSu63oRbVCiB5D7jUJZ4ZY2QZiqiDsd73OtaPNCP+I4e7ugdB04t89/1O/w1cDnyilFU="; 
    const GROUP_ID = "C52ec7de0f5960df3a3a110e61b1108dc";

    // ยิงข้อความผ่าน LINE Messaging API
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: GROUP_ID,
        messages: [{ 
          type: 'text', 
          text: message 
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('LINE API Error:', errorData);
      throw new Error('ส่งแจ้งเตือนเข้ากลุ่ม LINE ไม่สำเร็จ');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notify API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
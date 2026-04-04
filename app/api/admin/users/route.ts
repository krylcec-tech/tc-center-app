import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ใช้ Service Role Key เพื่อให้มีสิทธิ์ทะลวง Database ได้ทุกตาราง
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { action, userId, newRole, addHours } = await request.json();

    if (action === 'DELETE_USER') {
      // 1. ลบจากตารางลูกก่อน (ป้องกัน Foreign Key Error)
      await supabaseAdmin.from('bookings').delete().eq('student_id', userId);
      await supabaseAdmin.from('student_wallets').delete().eq('user_id', userId);
      await supabaseAdmin.from('tutors').delete().eq('id', userId);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      
      // 2. ลบออกจากระบบ Authentication
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return NextResponse.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
    }

    if (action === 'CHANGE_ROLE') {
      // อัปเดตสิทธิ์ในตาราง tutors
      const { error } = await supabaseAdmin.from('tutors')
        .update({ role: newRole })
        .eq('user_id', userId);
      if (error) throw error;
      return NextResponse.json({ message: 'เปลี่ยนสิทธิ์สำเร็จ' });
    }

    if (action === 'ADD_HOURS') {
      // ดึงชั่วโมงเดิมมาก่อน
      const { data: wallet } = await supabaseAdmin.from('student_wallets').select('balance').eq('user_id', userId).single();
      const currentBalance = wallet?.balance || 0;
      
      // อัปเดตชั่วโมงใหม่
      const { error } = await supabaseAdmin.from('student_wallets')
        .update({ balance: currentBalance + Number(addHours) })
        .eq('user_id', userId);
      if (error) throw error;
      return NextResponse.json({ message: 'เติมชั่วโมงสำเร็จ' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
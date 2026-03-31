import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,   // สำคัญมาก: สั่งให้จำ Session ไว้ใน Browser
    autoRefreshToken: true, // ให้รีเฟรช Token อัตโนมัติเมื่อหมดอายุ
    detectSessionInUrl: true // ช่วยในการจัดการพวก Magic Link หรือการยืนยันอีเมล
  }
})
// แก้ไขไฟล์สำหรับสร้าง Supabase Client (SSR Edition)
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true, // ✅ บังคับให้จำการล็อกอินไว้ในเครื่อง
      autoRefreshToken: true, // ✅ ต่ออายุตั๋วล็อกอินอัตโนมัติ ไม่ต้องกรอกรหัสใหม่
      detectSessionInUrl: true, // ✅ ช่วยให้ระบบจำได้เวลาคลิกลิงก์ยืนยันจากอีเมล
    }
  }
)
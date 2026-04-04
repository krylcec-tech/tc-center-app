'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Receipt, Wallet, Clock, CheckCircle2, 
  XCircle, Loader2, Package, Gift, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

export default function StudentOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'points'>('orders');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. ดึงประวัติการสั่งซื้อคอร์ส
      const { data: ordersData } = await supabase
        .from('course_orders')
        .select('*, courses(title, price)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      // 2. ดึงประวัติแต้ม Affiliate
      const { data: wallet } = await supabase
        .from('affiliate_wallets')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wallet) {
        const { data: txData } = await supabase
          .from('affiliate_transactions')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false });
        setTransactions(txData || []);
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <Link href="/student" className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4 hover:text-blue-600 transition-all w-max">
            <ArrowLeft size={16}/> กลับหน้าหลัก
          </Link>
          <h1 className="text-4xl font-black tracking-tight">ประวัติการทำรายการ</h1>
        </header>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-max border border-gray-200">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
          >
            การสั่งซื้อคอร์ส
          </button>
          <button 
            onClick={() => setActiveTab('points')}
            className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'points' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
          >
            แต้มสะสม & รางวัล
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100 shadow-sm">
                <Package size={48} className="text-gray-200 mx-auto mb-4"/>
                <p className="text-gray-400 font-bold">ยังไม่เคยมีประวัติการสั่งซื้อครับ</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Receipt size={28}/>
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-gray-900 leading-tight">{order.courses?.title}</h3>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase">
                        {new Date(order.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                    <p className="text-2xl font-black text-gray-900">฿{order.amount_paid?.toLocaleString()}</p>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                      order.status === 'SUCCESS' ? 'bg-green-50 text-green-600 border-green-100' : 
                      order.status === 'PENDING' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-red-50 text-red-500 border-red-100'
                    }`}>
                      {order.status === 'SUCCESS' ? 'ชำระเงินสำเร็จ' : order.status === 'PENDING' ? 'รอตรวจสอบสลิป' : 'ถูกปฏิเสธ'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100 shadow-sm">
                <Gift size={48} className="text-gray-200 mx-auto mb-4"/>
                <p className="text-gray-400 font-bold">ยังไม่มีความเคลื่อนไหวของแต้มครับ</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'EARN' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {tx.type === 'EARN' ? <Gift size={24}/> : <Clock size={24}/>}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 leading-tight">{tx.description}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{new Date(tx.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${tx.type === 'EARN' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'EARN' ? '+' : '-'}{tx.amount}
                    </p>
                    <p className="text-[10px] font-black text-gray-300 uppercase">Points</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
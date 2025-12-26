import React, { useState, useMemo, useEffect } from 'react';
import { Order, Product, InventoryRecord, DailyClosingRecord } from '../types';
import { supabase } from '../lib/supabase';
import { X, TrendingUp, List, BarChart3, Cloud, RefreshCw, Trash2, ClipboardList, Save, Calendar, Search, PieChart as PieChartIcon, Eye, User, Phone, FileText, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[]; // 從 App 傳來的本地訂單
  soldOutIds: string[];
  products: Product[];
  onUpdateRemark: (orderId: string, remark: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onClearAllOrders: () => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({ 
  isOpen, 
  onClose, 
  orders: localOrders, // 重新命名為 localOrders
  soldOutIds, 
  products, 
  onUpdateRemark, 
  onDeleteOrder,
  onClearAllOrders
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'inventory'>('overview');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // --- 新增：雲端資料同步 ---
  const [remoteOrders, setRemoteOrders] = useState<Order[] | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);

  // 核心邏輯：如果有抓到雲端資料就用雲端的，否則用本地的
  const ordersToUse = remoteOrders || localOrders;

  // Inventory State
  const [inventoryData, setInventoryData] = useState<Record<string, InventoryRecord>>({});

  // History Report State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); 
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [historyRecords, setHistoryRecords] = useState<DailyClosingRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isClosingDay, setIsClosingDay] = useState(false);

  // --- Functions ---

  const handleFetchRealtimeOrders = async () => {
    setLoadingRemote(true);
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('date', todayStr)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 轉換資料格式
      const formattedOrders: Order[] = (data || []).map(row => ({
        id: row.id,
        timestamp: new Date(row.created_at).getTime(),
        items: row.content, // JSONB
        totalPrice: row.total_price,
        totalCost: row.total_cost,
        totalProfit: row.total_profit,
        paymentMethod: row.payment_method,
        customer: row.customer,
        remarks: row.remarks
      }));

      setRemoteOrders(formattedOrders);
      alert(`已同步雲端數據！\n目前共有 ${formattedOrders.length} 筆交易。`);
    } catch (err: any) {
      console.error(err);
      alert('同步失敗: ' + err.message);
    } finally {
      setLoadingRemote(false);
    }
  };

  // --- Calculations ---

  const inventoryRows = useMemo(() => {
    if (!isOpen) return [];

    return products.map(product => {
      const record = inventoryData[product.id] || { opening: 0, closing: 0, waste: 0 };
      
      const salesQty = Math.max(0, record.opening - record.closing - record.waste);
      
      const isFixedUnit = (product.fixedPrices && product.fixedPrices.length > 0) || product.id === 'ss_combo_200';
      
      const refPrice = isFixedUnit 
        ? (product.fixedPrices ? product.fixedPrices[0].price : 200) 
        : product.defaultSellingPricePer600g;

      let estRevenue = 0;
      if (isFixedUnit) {
        estRevenue = salesQty * refPrice;
      } else {
        estRevenue = salesQty * refPrice;
      }

      // 使用 ordersToUse 計算
      const actualRevenue = ordersToUse.reduce((sum, order) => {
        if (order.paymentMethod === 'WASTE') return sum;

        const productTotal = order.items
          .filter(item => item.productId === product.id)
          .reduce((itemSum, item) => itemSum + item.price, 0);
        return sum + productTotal;
      }, 0);

      const diff = actualRevenue - Math.round(estRevenue);

      const systemSoldGrams = ordersToUse.reduce((sum, order) => {
         const items = order.items.filter(item => item.productId === product.id);
         return sum + items.reduce((iSum, i) => iSum + (i.weightGrams || 0), 0);
      }, 0);
      
      const systemSoldUnit = isFixedUnit 
        ? ordersToUse.reduce((sum, order) => sum + order.items.filter(i => i.productId === product.id).reduce((q, i) => q + i.quantity, 0), 0)
        : Number((systemSoldGrams / 600).toFixed(2));

      return {
        product,
        record,
        isFixedUnit,
        refPrice,
        salesQty,     
        systemSoldUnit, 
        estRevenue: Math.round(estRevenue),
        actualRevenue,
        diff
      };
    });
  }, [products, inventoryData, ordersToUse, isOpen]);

  const totalInventoryDiff = useMemo(() => {
      return inventoryRows.reduce((sum, row) => sum + row.diff, 0);
  }, [inventoryRows]);

  const totalWasteCost = useMemo(() => {
    return ordersToUse
      .filter(o => o.paymentMethod === 'WASTE')
      .reduce((sum, o) => sum + o.totalCost, 0);
  }, [ordersToUse]);

  // --- Handlers ---

  const handleInventoryChange = (productId: string, field: keyof InventoryRecord, value: string) => {
    const numVal = parseFloat(value) || 0;
    setInventoryData(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { opening: 0, closing: 0, waste: 0 }),
        [field]: numVal
      }
    }));
  };

  const handleFetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('daily_closings')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setHistoryRecords(data || []);
    } catch (err: any) {
      alert(`讀取歷史資料失敗: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'reports') {
      handleFetchHistory();
    }
  }, [isOpen, activeTab]);

  const handleCloseDay = async () => {
    if (!window.confirm('確定要執行本日結帳嗎？\n\n1. 營收數據將存入雲端。\n2. 本日訂單將會「清空」。\n3. 請確認盤點資料已輸入完成(若有)。')) return;
    
    setIsClosingDay(true);
    
    const totalSalesCash = ordersToUse.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.totalPrice, 0);
    const totalSalesLine = ordersToUse.filter(o => o.paymentMethod === 'LINE_PAY').reduce((sum, o) => sum + o.totalPrice, 0);
    const totalRevenue = totalSalesCash + totalSalesLine;
    const totalCost = ordersToUse.reduce((sum, o) => sum + o.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const todayStr = new Date().toISOString().split('T')[0];

    const record: DailyClosingRecord = {
      date: todayStr,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      total_cost: totalCost,
      order_count: ordersToUse.length,
      inventory_variance: totalInventoryDiff !== 0 ? totalInventoryDiff : -totalWasteCost, 
      note: `日結 - 現金:${totalSalesCash}, LINE:${totalSalesLine}, 系統損耗:${totalWasteCost}`
    };

    try {
      const { error } = await supabase
        .from('daily_closings')
        .upsert(record, { onConflict: 'date' });

      if (error) throw error;

      alert(`✅ ${todayStr} 結帳成功！\n資料已同步，本日訂單將自動清空。`);
      onClearAllOrders();
      onClose();

    } catch (err: any) {
      console.error(err);
      alert(`❌ 結帳失敗: ${err.message}`);
    } finally {
      setIsClosingDay(false);
    }
  };

  const handleDeleteClick = (orderId: string) => {
    if (remoteOrders) {
      alert("檢視雲端資料時無法在此刪除，請回到現場平板操作，或使用 Supabase 後台。");
      return;
    }
    if (window.confirm('確定要刪除這筆交易紀錄嗎？\n刪除後營收金額將會扣除，且無法復原。')) {
      onDeleteOrder(orderId);
    }
  };

  const handleExportInventory = () => {
    console.log("Inventory Rows:", inventoryRows);
    alert("庫存資料已輸出至 Console");
  };

  if (!isOpen) return null;

  const totalSalesCash = ordersToUse.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.totalPrice, 0);
  const totalSalesLine = ordersToUse.filter(o => o.paymentMethod === 'LINE_PAY').reduce((sum, o) => sum + o.totalPrice, 0);
  const totalRevenue = totalSalesCash + totalSalesLine;
  const totalProfit = ordersToUse.reduce((sum, o) => sum + o.totalProfit, 0);

  const paymentData = [
    { name: '現金', value: totalSalesCash, color: '#10b981' },
    { name: 'Line Pay', value: totalSalesLine, color: '#00b900' },
  ];

  const historyTotalRevenue = historyRecords.reduce((sum, r) => sum + r.total_revenue, 0);
  const historyTotalProfit = historyRecords.reduce((sum, r) => sum + r.total_profit, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-gray-900 text-white rounded-3xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl border border-gray-700 overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black flex items-center gap-3">
               <TrendingUp className="text-blue-400" size={28} /> 
               管理後台
            </h2>
            <nav className="flex bg-gray-700 rounded-lg p-1 ml-4">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <BarChart3 size={16} /> 本日概覽
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <ClipboardList size={16} /> 庫存盤點 & 結帳
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Cloud size={16} /> 歷史報表
              </button>
            </nav>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-900">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="h-full overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 no-scrollbar">
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 space-y-6">
                  
                  {/* ✅ 按鈕加在這裡！ */}
                  <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest flex justify-between items-center">
                    本日即時營收
                    <button 
                      onClick={handleFetchRealtimeOrders}
                      disabled={loadingRemote}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all
                        ${remoteOrders ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}
                        disabled:opacity-50
                      `}
                    >
                      {loadingRemote ? <RefreshCw className="animate-spin" size={12}/> : <Cloud size={12}/>}
                      {remoteOrders ? '已顯示雲端數據' : '同步雲端'}
                    </button>
                  </h3>

                  <div>
                    <span className="text-5xl font-black text-blue-400">${totalRevenue.toLocaleString()}</span>
                    <p className="text-gray-500 text-xs mt-1 font-bold">總營業額 (TWD)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-900/30">
                      <p className="text-blue-300 text-sm font-bold">預估淨利</p>
                      <p className="text-2xl font-mono font-bold text-blue-200">${Math.round(totalProfit).toLocaleString()}</p>
                    </div>
                    <div className="bg-red-900/20 p-4 rounded-xl border border-red-900/30">
                      <p className="text-red-300 text-sm font-bold">損耗/報廢成本</p>
                      <p className="text-2xl font-mono font-bold text-red-200">-${totalWasteCost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 flex flex-col h-80">
                   <h3 className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                      <PieChartIcon size={14} className="text-purple-400" /> 支付方式佔比
                   </h3>
                   <div className="flex-1 min-h-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {paymentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => `$${value.toLocaleString()}`}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 flex-1 h-[600px] flex flex-col">
                  <h3 className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                    <List size={14} className="text-green-500" /> 本日訂單紀錄 ({ordersToUse.length})
                  </h3>
                  <div className="overflow-y-auto no-scrollbar space-y-2 flex-1">
                    {ordersToUse.length === 0 ? <p className="text-gray-500 italic">尚無訂單</p> : 
                      ordersToUse.map(order => (
                          <div key={order.id} className="bg-gray-900/50 p-3 rounded-xl border border-gray-700 flex justify-between items-center group hover:bg-gray-800 transition-colors">
                            <div className="flex-1">
                               <div className="flex gap-2 items-center mb-1">
                                 <span className="text-xs font-mono text-gray-500">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                 {order.paymentMethod === 'WASTE' ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-red-800 text-red-500">損耗</span>
                                 ) : (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${order.paymentMethod === 'LINE_PAY' ? 'border-green-800 text-green-500' : 'border-blue-800 text-blue-500'}`}>
                                      {order.paymentMethod === 'LINE_PAY' ? 'LINE' : '現金'}
                                    </span>
                                 )}
                                 {order.customer && (order.customer.name || order.customer.phone) && (
                                   <span className="text-[10px] bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                     <User size={10} /> {order.customer.name || '客戶'}
                                   </span>
                                 )}
                               </div>
                               <div className={`text-sm font-bold ${order.paymentMethod === 'WASTE' ? 'text-red-400 line-through' : 'text-gray-300'}`}>
                                  ${order.totalPrice} 
                                  <span className="text-xs font-normal text-gray-500 ml-2">({order.items.length} 項)</span>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => setViewingOrder(order)} 
                                 className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700"
                               >
                                 <Eye size={18} />
                               </button>
                               {/* 只在本地模式顯示刪除按鈕 */}
                               {!remoteOrders && (
                                 <button 
                                   onClick={() => handleDeleteClick(order.id)} 
                                   className="text-red-900 hover:text-red-500 p-2 opacity-50 hover:opacity-100 transition-opacity"
                                 >
                                   <Trash2 size={18} />
                                 </button>
                               )}
                            </div>
                          </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPORTS (Supabase History) */}
          {activeTab === 'reports' && (
             <div className="h-full flex flex-col p-6">
                <div className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 border border-gray-700">
                   <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-blue-400" />
                      <span className="text-sm font-bold text-gray-300">日期範圍：</span>
                   </div>
                   <input 
                     type="date" 
                     value={startDate} 
                     onChange={e => setStartDate(e.target.value)}
                     className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                   />
                   <span className="text-gray-500">~</span>
                   <input 
                     type="date" 
                     value={endDate} 
                     onChange={e => setEndDate(e.target.value)}
                     className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                   />
                   <button 
                     onClick={handleFetchHistory}
                     disabled={loadingHistory}
                     className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50"
                   >
                     {loadingHistory ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                     查詢
                   </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                   <div className="bg-gradient-to-br from-blue-900/40 to-gray-900 border border-blue-500/30 p-4 rounded-xl">
                      <p className="text-blue-300 text-xs font-bold uppercase">區間總營收</p>
                      <p className="text-2xl font-black text-white mt-1">${historyTotalRevenue.toLocaleString()}</p>
                   </div>
                   <div className="bg-gradient-to-br from-emerald-900/40 to-gray-900 border border-emerald-500/30 p-4 rounded-xl">
                      <p className="text-emerald-300 text-xs font-bold uppercase">區間總淨利</p>
                      <p className="text-2xl font-black text-white mt-1">${historyTotalProfit.toLocaleString()}</p>
                   </div>
                </div>

                <div className="flex-1 overflow-auto rounded-xl border border-gray-700/50 shadow-inner bg-gray-900/50 no-scrollbar relative">
                   {loadingHistory && (
                     <div className="absolute inset-0 bg-gray-900/80 z-20 flex items-center justify-center">
                        <RefreshCw size={48} className="text-blue-500 animate-spin" />
                     </div>
                   )}
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-800 sticky top-0 z-10 text-xs uppercase text-gray-400 font-bold tracking-wider">
                         <tr>
                            <th className="p-4 border-b border-gray-700">日期</th>
                            <th className="p-4 border-b border-gray-700 text-right">總營收</th>
                            <th className="p-4 border-b border-gray-700 text-right">總成本</th>
                            <th className="p-4 border-b border-gray-700 text-right">淨利</th>
                            <th className="p-4 border-b border-gray-700 text-right">訂單數</th>
                            <th className="p-4 border-b border-gray-700 text-right">盤點損溢</th>
                            <th className="p-4 border-b border-gray-700 text-left">備註</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 text-sm">
                         {historyRecords.length === 0 ? (
                           <tr><td colSpan={7} className="p-8 text-center text-gray-500 italic">無資料，請調整日期範圍查詢</td></tr>
                         ) : (
                           historyRecords.map(record => (
                              <tr key={record.id} className="hover:bg-gray-800/30 transition-colors">
                                 <td className="p-4 font-bold text-gray-200">{record.date}</td>
                                 <td className="p-4 text-right font-mono text-blue-300">${record.total_revenue.toLocaleString()}</td>
                                 <td className="p-4 text-right font-mono text-gray-400">${record.total_cost.toLocaleString()}</td>
                                 <td className="p-4 text-right font-mono text-emerald-400 font-bold">${record.total_profit.toLocaleString()}</td>
                                 <td className="p-4 text-right text-gray-300">{record.order_count}</td>
                                 <td className={`p-4 text-right font-mono font-bold ${record.inventory_variance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {record.inventory_variance > 0 ? '+' : ''}{record.inventory_variance}
                                 </td>
                                 <td className="p-4 text-gray-500 truncate max-w-xs" title={record.note || ''}>{record.note || '-'}</td>
                              </tr>
                           ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {/* TAB 3: INVENTORY & CLOSE */}
          {activeTab === 'inventory' && (
            <div className="h-full flex flex-col p-6 overflow-hidden relative">
               <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-xl mb-4 flex justify-between items-center shrink-0">
                  <div className="text-sm text-blue-200">
                     <p className="font-bold">盤點說明</p>
                     <p className="opacity-70">
                       請輸入
                       <span className="text-yellow-400 font-bold mx-1">台斤</span>
                       (固定單位輸入個數)。系統將自動換算。
                     </p>
                  </div>
                  <button 
                    onClick={handleExportInventory}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-bold transition-all text-xs"
                  >
                    <Save size={16} /> Console Log
                  </button>
               </div>

               <div className="flex-1 overflow-auto rounded-xl border border-gray-700/50 shadow-inner bg-gray-900/50 no-scrollbar mb-16">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-gray-800 sticky top-0 z-10 text-xs uppercase text-gray-400 font-bold tracking-wider">
                        <tr>
                           <th className="p-4 border-b border-gray-700 min-w-[140px]">商品名稱</th>
                           <th className="p-4 border-b border-gray-700 text-center w-24 text-yellow-500">期初</th>
                           <th className="p-4 border-b border-gray-700 text-center w-24 text-yellow-500">期末</th>
                           <th className="p-4 border-b border-gray-700 text-center w-24 text-red-400">損耗</th>
                           <th className="p-4 border-b border-gray-700 text-right bg-gray-800/80 text-blue-300">盤點量</th>
                           <th className="p-4 border-b border-gray-700 text-right text-gray-500">系統銷量</th>
                           <th className="p-4 border-b border-gray-700 text-right">預估營收</th>
                           <th className="p-4 border-b border-gray-700 text-right">實際營收</th>
                           <th className="p-4 border-b border-gray-700 text-right">差異金額</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-800 text-sm">
                        {inventoryRows.map((row) => (
                           <tr key={row.product.id} className="hover:bg-gray-800/30 transition-colors">
                              <td className="p-4 font-bold text-gray-200">
                                 {row.product.name}
                                 <div className="text-[10px] text-gray-500 font-normal">{row.isFixedUnit ? '(單位: 份)' : '(單位: 台斤)'}</div>
                              </td>
                              <td className="p-2 text-center">
                                 <input 
                                    type="number" 
                                    className="w-20 bg-gray-800 border border-gray-600 rounded p-1 text-center focus:border-yellow-500 focus:outline-none text-white font-mono"
                                    value={row.record.opening || ''}
                                    placeholder="0"
                                    onChange={(e) => handleInventoryChange(row.product.id, 'opening', e.target.value)}
                                 />
                              </td>
                              <td className="p-2 text-center">
                                 <input 
                                    type="number" 
                                    className="w-20 bg-gray-800 border border-gray-600 rounded p-1 text-center focus:border-yellow-500 focus:outline-none text-white font-mono"
                                    value={row.record.closing || ''}
                                    placeholder="0"
                                    onChange={(e) => handleInventoryChange(row.product.id, 'closing', e.target.value)}
                                 />
                              </td>
                              <td className="p-2 text-center">
                                 <input 
                                    type="number" 
                                    className="w-20 bg-gray-800 border border-gray-600 rounded p-1 text-center focus:border-red-500 focus:outline-none text-white font-mono"
                                    value={row.record.waste || ''}
                                    placeholder="0"
                                    onChange={(e) => handleInventoryChange(row.product.id, 'waste', e.target.value)}
                                 />
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-blue-300 bg-gray-800/20">
                                 {row.salesQty} {row.isFixedUnit ? '' : '斤'}
                              </td>
                              <td className="p-4 text-right font-mono text-gray-500 text-xs">
                                 {row.systemSoldUnit} {row.isFixedUnit ? '' : '斤'}
                              </td>
                              <td className="p-4 text-right font-mono text-gray-400">
                                 ${row.estRevenue.toLocaleString()}
                              </td>
                              <td className="p-4 text-right font-mono text-gray-200">
                                 ${row.actualRevenue.toLocaleString()}
                              </td>
                              <td className={`p-4 text-right font-black font-mono ${row.diff < 0 ? 'text-red-500' : row.diff > 0 ? 'text-green-500' : 'text-gray-600'}`}>
                                 {row.diff > 0 ? '+' : ''}{row.diff.toLocaleString()}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                     <tfoot className="bg-gray-800 sticky bottom-0 z-10 font-bold border-t border-gray-600">
                        <tr>
                           <td colSpan={8} className="p-4 text-right text-gray-300">本日總盤點差異金額</td>
                           <td className={`p-4 text-right font-black text-lg ${totalInventoryDiff < 0 ? 'text-red-400' : totalInventoryDiff > 0 ? 'text-green-400' : 'text-white'}`}>
                              {totalInventoryDiff > 0 ? '+' : ''}{totalInventoryDiff.toLocaleString()}
                           </td>
                        </tr>
                     </tfoot>
                  </table>
               </div>
               
               {/* Close Day Button Area */}
               <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-gray-900/90 backdrop-blur border border-gray-700 p-2 rounded-2xl shadow-2xl">
                  <div className="px-4 text-right">
                     <p className="text-[10px] text-gray-400 font-bold uppercase">Ready to close?</p>
                     <p className="text-sm font-bold text-gray-200">本日結算作業</p>
                  </div>
                  <button 
                     onClick={handleCloseDay}
                     disabled={isClosingDay}
                     className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-red-900/50 flex items-center gap-2 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isClosingDay ? <RefreshCw className="animate-spin" /> : <Cloud size={20} />}
                     執行日結並封存
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* --- 訂單詳情彈窗 Overlay --- */}
      {viewingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-gray-900">
             <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                <div>
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <FileText size={20} className="text-blue-400"/>
                     訂單詳情
                   </h3>
                   <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                     <Clock size={12}/>
                     {new Date(viewingOrder.timestamp).toLocaleString()}
                   </p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                  <X size={20}/>
                </button>
             </div>

             <div className="p-0 max-h-[70vh] overflow-y-auto bg-gray-50">
                {viewingOrder.customer && (viewingOrder.customer.name || viewingOrder.customer.phone) && (
                  <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                     <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-1">
                       <User size={14}/> 客戶資料
                     </h4>
                     <div className="flex gap-4">
                        {viewingOrder.customer.name && (
                          <div>
                            <span className="text-xs text-indigo-400">姓名</span>
                            <p className="font-bold text-indigo-900">{viewingOrder.customer.name}</p>
                          </div>
                        )}
                        {viewingOrder.customer.phone && (
                          <div>
                            <span className="text-xs text-indigo-400">電話</span>
                            <p className="font-bold text-indigo-900 flex items-center gap-1">
                              <Phone size={12}/> {viewingOrder.customer.phone}
                            </p>
                          </div>
                        )}
                     </div>
                  </div>
                )}

                <div className="p-4">
                   <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">購買項目</h4>
                   <div className="space-y-2">
                     {viewingOrder.items.map((item, idx) => (
                       <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold text-gray-800">
                                  {item.productName} 
                                  <span className="text-gray-400 text-xs font-normal ml-1">x{item.quantity}</span>
                                </p>
                                {item.modifiers && item.modifiers.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.modifiers.map(m => (
                                      <span key={m} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{m}</span>
                                    ))}
                                  </div>
                                )}
                             </div>
                             <p className="font-bold text-gray-700">${item.price}</p>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>

                {viewingOrder.remarks && (
                   <div className="px-4 pb-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">備註</h4>
                      <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-100">
                        {viewingOrder.remarks}
                      </div>
                   </div>
                )}
             </div>

             <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-sm font-bold text-gray-500">支付方式</span>
                   <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                     viewingOrder.paymentMethod === 'LINE_PAY' ? 'bg-green-100 text-green-700' : 
                     viewingOrder.paymentMethod === 'WASTE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                   }`}>
                     {viewingOrder.paymentMethod === 'LINE_PAY' ? 'LINE Pay' : 
                      viewingOrder.paymentMethod === 'WASTE' ? '損耗/報廢' : '現金'}
                   </span>
                </div>
                <div className="flex justify-between items-center text-xl">
                   <span className="font-black text-gray-800">總金額</span>
                   <span className={`font-black ${viewingOrder.paymentMethod === 'WASTE' ? 'text-red-500 line-through' : 'text-blue-600'}`}>
                     ${viewingOrder.totalPrice}
                   </span>
                </div>
                {viewingOrder.paymentMethod === 'WASTE' && (
                  <p className="text-center text-xs text-red-500 font-bold mt-2">此訂單不計入營收</p>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

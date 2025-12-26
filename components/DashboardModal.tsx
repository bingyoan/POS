import React, { useState, useMemo, useEffect } from 'react';
import { Order, Product, InventoryRecord, DailyClosingRecord } from '../types';
import { supabase } from '../lib/supabase';
import { X, TrendingUp, List, BarChart3, Cloud, RefreshCw, Trash2, ClipboardList, Save, Calendar, Search, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  soldOutIds: string[];
  products: Product[];
  onUpdateRemark: (orderId: string, remark: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onClearAllOrders: () => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({ 
  isOpen, 
  onClose, 
  orders, 
  soldOutIds, 
  products, 
  onUpdateRemark, 
  onDeleteOrder,
  onClearAllOrders
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'inventory'>('overview');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [remarkText, setRemarkText] = useState('');
  
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

  // --- Calculations ---

  // Inventory Rows Logic
  const inventoryRows = useMemo(() => {
    if (!isOpen) return [];

    return products.map(product => {
      const record = inventoryData[product.id] || { opening: 0, closing: 0, waste: 0 };
      
      // ✅ 邏輯修改：這裡計算出的 salesQty 是使用者輸入的單位 (秤重=台斤, 固定=個)
      const salesQty = Math.max(0, record.opening - record.closing - record.waste);
      
      const isFixedUnit = (product.fixedPrices && product.fixedPrices.length > 0) || product.id === 'ss_combo_200';
      
      // 參考價格：如果是固定單位就是單價，如果是秤重就是「每台斤售價」
      const refPrice = isFixedUnit 
        ? (product.fixedPrices ? product.fixedPrices[0].price : 200) 
        : product.defaultSellingPricePer600g;

      let estRevenue = 0;
      if (isFixedUnit) {
        // 固定單位 (個)：數量 x 單價
        estRevenue = salesQty * refPrice;
      } else {
        // ✅ 秤重單位 (台斤)：因為 salesQty 已經是台斤了，直接 x 每斤售價
        // 不用再除以 600 了！
        estRevenue = salesQty * refPrice;
      }

      const actualRevenue = orders.reduce((sum, order) => {
        if (order.paymentMethod === 'WASTE') return sum;

        const productTotal = order.items
          .filter(item => item.productId === product.id)
          .reduce((itemSum, item) => itemSum + item.price, 0);
        return sum + productTotal;
      }, 0);

      const diff = actualRevenue - Math.round(estRevenue);

      // 為了顯示方便，計算一個「系統紀錄的銷售量 (轉成台斤/個)」
      // 這樣阿姨可以看出「系統覺得賣了幾斤」vs「我實際少了幾斤」
      const systemSoldGrams = orders.reduce((sum, order) => {
         // 包含 WASTE 也要算進去系統扣除的量，這樣比對庫存才準
         const items = order.items.filter(item => item.productId === product.id);
         return sum + items.reduce((iSum, i) => iSum + (i.weightGrams || 0), 0);
      }, 0);
      
      const systemSoldUnit = isFixedUnit 
        ? orders.reduce((sum, order) => sum + order.items.filter(i => i.productId === product.id).reduce((q, i) => q + i.quantity, 0), 0)
        : Number((systemSoldGrams / 600).toFixed(2)); // ✅ 公克轉台斤

      return {
        product,
        record,
        isFixedUnit,
        refPrice,
        salesQty,     // 實際盤點出的銷售量 (台斤/個)
        systemSoldUnit, // 系統紀錄的銷售量 (台斤/個)
        estRevenue: Math.round(estRevenue),
        actualRevenue,
        diff
      };
    });
  }, [products, inventoryData, orders, isOpen]);

  const totalInventoryDiff = useMemo(() => {
      return inventoryRows.reduce((sum, row) => sum + row.diff, 0);
  }, [inventoryRows]);

  const totalWasteCost = useMemo(() => {
    return orders
      .filter(o => o.paymentMethod === 'WASTE')
      .reduce((sum, o) => sum + o.totalCost, 0);
  }, [orders]);

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
    
    const totalSalesCash = orders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.totalPrice, 0);
    const totalSalesLine = orders.filter(o => o.paymentMethod === 'LINE_PAY').reduce((sum, o) => sum + o.totalPrice, 0);
    const totalRevenue = totalSalesCash + totalSalesLine;
    const totalCost = orders.reduce((sum, o) => sum + o.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const todayStr = new Date().toISOString().split('T')[0];

    const record: DailyClosingRecord = {
      date: todayStr,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      total_cost: totalCost,
      order_count: orders.length,
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
    if (window.confirm('確定要刪除這筆交易紀錄嗎？\n刪除後營收金額將會扣除，且無法復原。')) {
      onDeleteOrder(orderId);
    }
  };

  const handleExportInventory = () => {
    console.log("Inventory Rows:", inventoryRows);
    alert("庫存資料已輸出至 Console");
  };

  if (!isOpen) return null;

  const totalSalesCash = orders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.totalPrice, 0);
  const totalSalesLine = orders.filter(o => o.paymentMethod === 'LINE_PAY').reduce((sum, o) => sum + o.totalPrice, 0);
  const totalRevenue = totalSalesCash + totalSalesLine;
  const totalProfit = orders.reduce((sum, o) => sum + o.totalProfit, 0);

  const paymentData = [
    { name: '現金', value: totalSalesCash, color: '#10b981' },
    { name: 'Line Pay', value: totalSalesLine, color: '#00b900' },
  ];

  const historyTotalRevenue = historyRecords.reduce((sum, r) => sum + r.total_revenue, 0);
  const historyTotalProfit = historyRecords.reduce((sum, r) => sum + r.total_profit, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-gray-900 text-white rounded-3xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl border border-gray-700 overflow-hidden">
        
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
                  <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">本日即時營收</h3>
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
                    <List size={14} className="text-green-500" /> 本日訂單紀錄 ({orders.length})
                  </h3>
                  <div className="overflow-y-auto no-scrollbar space-y-2 flex-1">
                    {orders.length === 0 ? <p className="text-gray-500 italic">尚無訂單</p> : 
                      orders.map(order => (
                          <div key={order.id} className="bg-gray-900/50 p-3 rounded-xl border border-gray-700 flex justify-between items-center">
                            <div>
                               <div className="flex gap-2 items-center mb-1">
                                 <span className="text-xs font-mono text-gray-500">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                 {order.paymentMethod === 'WASTE' ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-red-800 text-red-500">損耗</span>
                                 ) : (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${order.paymentMethod === 'LINE_PAY' ? 'border-green-800 text-green-500' : 'border-blue-800 text-blue-500'}`}>
                                      {order.paymentMethod === 'LINE_PAY' ? 'LINE' : '現金'}
                                    </span>
                                 )}
                               </div>
                               <div className={`text-sm font-bold ${order.paymentMethod === 'WASTE' ? 'text-red-400 line-through' : 'text-gray-300'}`}>
                                  ${order.totalPrice} 
                                  <span className="text-xs font-normal text-gray-500 ml-2">({order.items.length} 項)</span>
                               </div>
                               {order.paymentMethod === 'WASTE' && (
                                 <div className="text-xs text-red-500 font-bold">成本: -${order.totalCost}</div>
                               )}
                            </div>
                            <button onClick={() => handleDeleteClick(order.id)} className="text-red-900 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                          </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPORTS */}
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
                              {/* 盤點出的銷售量 */}
                              <td className="p-4 text-right font-mono font-bold text-blue-300 bg-gray-800/20">
                                 {row.salesQty} {row.isFixedUnit ? '' : '斤'}
                              </td>
                              {/* 系統紀錄的銷售量 (參考用) */}
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
    </div>
  );
};

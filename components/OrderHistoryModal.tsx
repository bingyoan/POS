import React, { useState } from 'react';
import { Order } from '../types';
import { X, ClipboardList, Trash2, FileText, User, Phone, Clock } from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onDeleteOrder: (orderId: string) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  orders, 
  onDeleteOrder 
}) => {
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleDeleteClick = (orderId: string) => {
    if (window.confirm('確定要刪除這筆錯誤的訂單嗎？\n庫存將會自動加回。')) {
      onDeleteOrder(orderId);
      if (viewingOrder?.id === orderId) {
        setViewingOrder(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="p-4 bg-gray-800 text-white flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="text-yellow-400" /> 今日訂單紀錄
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* 左側列表 */}
          <div className={`flex-1 overflow-y-auto p-4 bg-gray-50 border-r border-gray-200 ${viewingOrder ? 'hidden md:block' : 'block'}`}>
             {orders.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <ClipboardList size={48} className="mb-2 opacity-20"/>
                 <p>今天還沒有訂單喔</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {orders.map(order => (
                   <div key={order.id} onClick={() => setViewingOrder(order)} className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${viewingOrder?.id === order.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                     <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                         <span className="font-mono text-gray-500 text-sm bg-gray-100 px-2 py-0.5 rounded">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         {order.paymentMethod === 'WASTE' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-red-800 text-red-600 bg-red-50 font-bold">損耗</span>
                         ) : (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${order.paymentMethod === 'LINE_PAY' ? 'border-green-600 text-green-600 bg-green-50' : 'border-blue-600 text-blue-600 bg-blue-50'}`}>{order.paymentMethod === 'LINE_PAY' ? 'LINE' : '現金'}</span>
                         )}
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(order.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                     </div>
                     <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-600">共 {order.items.length} 項商品 {order.customer?.name && <span className="ml-2 text-blue-600 font-bold">({order.customer.name})</span>}</div>
                        <div className={`text-lg font-black ${order.paymentMethod === 'WASTE' ? 'text-red-400 line-through' : 'text-gray-800'}`}>${order.totalPrice}</div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
          {/* 右側詳情 */}
          <div className={`flex-1 bg-white flex-col ${viewingOrder ? 'flex fixed inset-0 z-50 md:static md:z-auto' : 'hidden md:flex'}`}>
             {viewingOrder ? (
               <>
                 <div className="md:hidden p-4 border-b flex justify-between items-center bg-gray-50">
                    <span className="font-bold text-gray-700">訂單詳情</span>
                    <button onClick={() => setViewingOrder(null)} className="p-2 bg-gray-200 rounded-full"><X size={20}/></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2"><FileText className="text-blue-500"/> 訂單內容</h3>
                          <p className="text-gray-500 mt-1 flex items-center gap-1"><Clock size={14}/> {new Date(viewingOrder.timestamp).toLocaleString()}</p>
                       </div>
                    </div>
                    {viewingOrder.customer && (viewingOrder.customer.name || viewingOrder.customer.phone) && (
                      <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                         <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-1"><User size={14}/> 客戶資料</h4>
                         <div className="flex gap-4">
                            {viewingOrder.customer.name && <p className="font-bold text-indigo-900">{viewingOrder.customer.name}</p>}
                            {viewingOrder.customer.phone && <p className="font-bold text-indigo-900 flex items-center gap-1"><Phone size={12}/> {viewingOrder.customer.phone}</p>}
                         </div>
                      </div>
                    )}
                    <div className="space-y-3 mb-6">
                       {viewingOrder.items.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0">
                            <div>
                               <div className="font-bold text-gray-800 text-lg">{item.productName} <span className="text-gray-400 text-sm ml-2">x{item.quantity}</span></div>
                               {item.modifiers && item.modifiers.length > 0 && (<div className="flex gap-1 mt-1">{item.modifiers.map(m => (<span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{m}</span>))}</div>)}
                            </div>
                            <div className="font-bold text-gray-600">${item.price}</div>
                         </div>
                       ))}
                    </div>
                    <div className="border-t-2 border-dashed border-gray-200 pt-4 flex justify-between items-center">
                       <span className="text-gray-500 font-bold">總金額</span>
                       <span className={`text-3xl font-black ${viewingOrder.paymentMethod === 'WASTE' ? 'text-red-400 line-through' : 'text-blue-600'}`}>${viewingOrder.totalPrice}</span>
                    </div>
                    <button onClick={() => handleDeleteClick(viewingOrder.id)} className="w-full mt-8 py-3 bg-white border-2 border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 hover:border-red-500 transition-all flex justify-center items-center gap-2"><Trash2 size={20}/> 刪除此筆訂單 (退回庫存)</button>
                 </div>
               </>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-300"><FileText size={64} className="mb-4 opacity-20"/><p>請點擊左側訂單查看明細</p></div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

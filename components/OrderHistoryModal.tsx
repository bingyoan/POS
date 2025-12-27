import React from 'react';
import { Order } from '../types';
import { X, Trash2, Clock, User, FileText, AlertTriangle } from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onDeleteOrder: (orderId: string) => void;
  onClearAllOrders: () => void; // ✅ 新增這個 prop
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  onDeleteOrder,
  onClearAllOrders // ✅ 接收
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            📋 今日訂單 ({orders.length})
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {orders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FileText size={48} className="mx-auto mb-2 opacity-20" />
              <p>目前沒有訂單</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Clock size={14} />
                      {new Date(order.timestamp).toLocaleTimeString()}
                      <span className={`px-2 py-0.5 rounded text-xs font-bold
                        ${order.paymentMethod === 'LINE_PAY' ? 'bg-green-100 text-green-700' : 
                          order.paymentMethod === 'WASTE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {order.paymentMethod === 'LINE_PAY' ? 'LINE' : order.paymentMethod === 'WASTE' ? '損耗' : '現金'}
                      </span>
                    </div>
                    {order.customer && (order.customer.name || order.customer.phone) && (
                      <div className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit mb-1">
                        <User size={12} /> {order.customer.name} {order.customer.phone}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${order.paymentMethod === 'WASTE' ? 'text-red-400 line-through' : 'text-blue-600'}`}>
                      ${order.totalPrice}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-700 border-t border-gray-100 pt-2">
                  {order.items.map((item, idx) => (
                    <span key={idx} className="mr-2 inline-block">
                      {item.productName} x{item.quantity}
                    </span>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => {
                      if(window.confirm('確定要刪除這筆訂單嗎？')) onDeleteOrder(order.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ✅ 新增底部清空按鈕 */}
        {orders.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-white shrink-0">
            <button 
              onClick={onClearAllOrders}
              className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 size={20} />
              強制清空今日訂單 (給明天用)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { HeldOrder } from '../types';
import { X, Play, Trash2, Clock, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onResume: (orderId: string) => void;
  onDelete: (orderId: string) => void;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({
  isOpen,
  onClose,
  heldOrders,
  onResume,
  onDelete
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            📦 寄放/掛單列表 ({heldOrders.length})
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-gray-50">
          {heldOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>目前沒有寄放的訂單</p>
            </div>
          ) : (
            heldOrders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-800">
                        {order.customer.name || '未留名'}
                      </span>
                      {order.isPaid ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-green-200">
                          <CheckCircle size={10} /> 已付款
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-red-200">
                          <AlertCircle size={10} /> 未付款
                        </span>
                      )}
                    </div>
                    {order.customer.phone && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone size={12} /> {order.customer.phone}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(order.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl text-blue-600">
                      ${order.items.reduce((sum, item) => sum + item.price, 0)}
                    </p>
                    <p className="text-xs text-gray-500">{order.items.length} 樣商品</p>
                  </div>
                </div>

                {/* 簡單顯示商品摘要 */}
                <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                  {order.items.map(i => i.productName).join('、')}
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => onResume(order.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play size={16} /> 取單結帳
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('確定要刪除這筆掛單嗎？無法復原喔！')) {
                        onDelete(order.id);
                      }
                    }}
                    className="px-4 bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

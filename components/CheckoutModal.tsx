import React, { useMemo } from 'react';
import { CartItem } from '../types';
import { ShoppingBag, X, CheckCircle2 } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cart: CartItem[];
  total: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirm, cart, total }) => {
  // Group combo items for display (Logic shared with CartSidebar for consistency)
  const displayItems = useMemo(() => {
    const groups: { [key: string]: CartItem[] } = {};
    const singles: CartItem[] = [];

    cart.forEach(item => {
      if (item.comboId) {
        if (!groups[item.comboId]) groups[item.comboId] = [];
        groups[item.comboId].push(item);
      } else {
        singles.push(item);
      }
    });

    return { groups, singles };
  }, [cart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-gray-800">
            <ShoppingBag className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold">確認訂單</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Order Summary List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">購買項目</h3>
          
          {cart.length === 0 && (
            <p className="text-center text-gray-400 py-4">購物車是空的</p>
          )}

          {/* Singles */}
          {displayItems.singles.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div>
                <div className="font-medium text-gray-800 flex items-center gap-2">
                  {item.productName}
                  {item.quantity > 1 && (
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-bold">
                      x{item.quantity}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {item.type === 'standard_box' ? '盒裝' : '秤重'} 
                  {item.weightGrams ? ` · 總計 ${item.weightGrams}g` : ''}
                </div>
              </div>
              <div className="font-bold text-gray-900">${item.price}</div>
            </div>
          ))}

          {/* Combos */}
          {(Object.entries(displayItems.groups) as [string, CartItem[]][]).map(([comboId, items]) => (
            <div key={comboId} className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-indigo-200">
                <span className="font-bold text-indigo-800 text-sm">綜合鯊魚煙套餐</span>
                <span className="font-bold text-indigo-900">$200</span>
              </div>
              <ul className="text-sm text-indigo-700 space-y-1 pl-2">
                {items.map(item => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    {item.productName}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer / Total / Action */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-end mb-6">
            <span className="text-gray-600 font-medium">總計金額</span>
            <span className="text-3xl font-extrabold text-blue-600">${total}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-white hover:border-gray-400 transition-all"
            >
              再看看
            </button>
            <button 
              onClick={onConfirm}
              className="py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              確認結帳
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
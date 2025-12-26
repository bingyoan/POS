import React, { useMemo, useState, useEffect } from 'react';
import { CartItem, PaymentMethod, Customer } from '../types';
import { MODIFIERS } from '../constants';
import { Trash2, ShoppingBag, DollarSign, Archive, TimerReset, Banknote, CreditCard, Delete, UserCircle, AlertTriangle } from 'lucide-react';

interface CartSidebarProps {
  cart: CartItem[];
  heldOrderCount: number;
  onRemoveItem: (id: string) => void;
  onAddModifier: (itemId: string, modifier: string) => void;
  onCheckout: (received: number, method: PaymentMethod, customer?: Customer) => void;
  onHoldOrder: () => void;
  onResumeOrder: () => void;
  onClearCart: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ 
  cart, 
  heldOrderCount,
  onRemoveItem, 
  onAddModifier,
  onCheckout, 
  onHoldOrder,
  onResumeOrder,
  onClearCart
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '' });
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  useEffect(() => {
    if (cart.length === 0) {
      setCashReceived(0);
      setCustomer({ name: '', phone: '' });
      setShowCustomerInput(false);
    }
  }, [cart.length]);

  const handleQuickCash = (amount: number) => {
    setCashReceived(prev => prev + amount);
  };

  const handleNumInput = (num: number) => {
    if (cashReceived > 99999) return;
    setCashReceived(prev => prev * 10 + num);
  };

  const handleBackspace = () => {
    setCashReceived(prev => Math.floor(prev / 10));
  };

  const change = cashReceived > 0 ? cashReceived - total : 0;
  const isEnough = paymentMethod === 'LINE_PAY' || (cashReceived > 0 && cashReceived >= total);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full">
      {/* 1. Header */}
      <div className="p-3 bg-gray-800 text-white flex justify-between items-center shadow-md shrink-0">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <ShoppingBag size={20} /> 結帳清單
        </h2>
        <div className="flex gap-2">
           {heldOrderCount > 0 && cart.length === 0 && (
             <button onClick={onResumeOrder} className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded flex items-center gap-1 text-sm animate-pulse">
               <TimerReset size={16} /> 取單 (1)
             </button>
           )}
           {cart.length > 0 && (
             <button onClick={onHoldOrder} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded flex items-center gap-1 text-sm">
               <Archive size={16} /> 掛單
             </button>
           )}
           {cart.length > 0 && (
             <button onClick={onClearCart} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded flex items-center gap-1 text-sm">
               清空
             </button>
           )}
        </div>
      </div>

      {/* 2. Cart Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50 no-scrollbar">
        {cart.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-gray-400">
             <ShoppingBag size={48} className="mb-4 opacity-30" />
             <p>購物車空空如也</p>
           </div>
        )}

        {cart.map(item => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  {item.productName}
                  {item.quantity > 1 && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">x{item.quantity}</span>}
                </div>
                <div className="text-sm text-gray-500 font-bold">
                   NT${item.price / item.quantity} {item.type === 'custom_weight' ? '(秤重)' : ''}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <span className="font-bold text-lg text-blue-700">NT${item.price}</span>
                 <button onClick={() => onRemoveItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
              </div>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-1">
              {MODIFIERS.map(mod => {
                const isActive = item.modifiers?.includes(mod);
                return (
                  <button 
                    key={mod}
                    onClick={() => onAddModifier(item.id, mod)}
                    className={`text-xs px-2 py-1 rounded-full border transition-all font-bold
                      ${isActive ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Payment Control Panel */}
      <div className="bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] shrink-0 z-30">
        
        {/* Customer Input Toggle */}
        <div className="px-2 pt-2">
          <button 
            onClick={() => setShowCustomerInput(!showCustomerInput)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all
              ${showCustomerInput ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
          >
            <UserCircle size={16} />
            {customer.name || customer.phone ? `客資: ${customer.name} ${customer.phone}` : '登記客戶資料'}
          </button>
          
          {showCustomerInput && (
            <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-blue-50 rounded-lg animate-in fade-in slide-in

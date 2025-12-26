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
            <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-blue-50 rounded-lg animate-in fade-in slide-in-from-top-2">
              <input 
                placeholder="客戶姓名"
                className="px-3 py-2 rounded border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customer.name}
                onChange={e => setCustomer({...customer, name: e.target.value})}
              />
              <input 
                placeholder="聯絡電話"
                className="px-3 py-2 rounded border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customer.phone}
                onChange={e => setCustomer({...customer, phone: e.target.value})}
              />
            </div>
          )}
        </div>

        {/* Total & Method */}
        <div className="flex justify-between items-center p-2">
           <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center gap-1 px-3 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'CASH' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}
              >
                <Banknote size={16}/> 現金
              </button>
              <button 
                onClick={() => setPaymentMethod('LINE_PAY')}
                className={`flex items-center gap-1 px-3 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'LINE_PAY' ? 'bg-green-500 shadow text-white' : 'text-gray-500'}`}
              >
                <CreditCard size={16}/> Line Pay
              </button>
           </div>
           <div className="text-right">
              <span className="text-gray-500 text-xs block font-bold">結帳總額</span>
              <span className="text-2xl font-black text-blue-600">NT${total}</span>
           </div>
        </div>

        {/* --- 新增：報廢登記按鈕 (放在結帳區塊上方) --- */}
        <div className="px-2 pb-2">
           <button 
             onClick={() => {
               if(window.confirm('確定要將購物車內容登記為「損耗/報廢」嗎？\n(營收將記為 $0，但會扣除庫存)')) {
                 onCheckout(0, 'WASTE', customer);
               }
             }}
             disabled={cart.length === 0}
             className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-500 font-bold text-sm border border-gray-200 transition-colors disabled:opacity-50"
           >
             <AlertTriangle size={16} />
             登記為損耗/報廢 (不計營收)
           </button>
        </div>
        {/* ------------------------------------------- */}

        {/* CASH MODE */}
        {paymentMethod === 'CASH' && (
          <div className="bg-gray-100 p-2 border-t border-gray-200">
              <div className="bg-white border-2 border-blue-200 rounded-lg px-3 py-2 mb-2 flex justify-between items-center shadow-inner">
                 <span className="text-gray-500 text-sm font-bold">實收:</span>
                 <div className="text-right">
                    <span className="text-2xl font-black text-gray-800 tracking-wider">NT${cashReceived}</span>
                    {cashReceived > 0 && (
                      <span className={`block text-sm font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                         {change < 0 ? `不足 ${Math.abs(change)}` : `找零 NT$${change}`}
                      </span>
                    )}
                 </div>
              </div>

              <div className="flex gap-2 h-44">
                 <div className="flex flex-col gap-1.5 w-1/4">
                    <button onClick={() => handleQuickCash(100)} className="flex-1 bg-white border border-gray-300 rounded-lg font-black text-blue-700 hover:bg-blue-50 active:scale-95 transition-all text-xs">+$100</button>
                    <button onClick={() => handleQuickCash(500)} className="flex-1 bg-white border border-gray-300 rounded-lg font-black text-blue-700 hover:bg-blue-50 active:scale-95 transition-all text-xs">+$500</button>
                    <button onClick={() => handleQuickCash(1000)} className="flex-1 bg-white border border-gray-300 rounded-lg font-black text-blue-700 hover:bg-blue-50 active:scale-95 transition-all text-xs">+$1000</button>
                 </div>
                 <div className="grid grid-cols-3 gap-1.5 w-3/4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button key={num} onClick={() => handleNumInput(num)} className="bg-white rounded-lg shadow-sm font-black text-lg text-gray-800 active:bg-gray-200 transition-all">{num}</button>
                    ))}
                    <button onClick={() => setCashReceived(0)} className="bg-red-100 text-red-600 rounded-lg font-bold active:scale-95 text-xs">重設</button>
                    <button onClick={() => handleNumInput(0)} className="bg-white rounded-lg shadow-sm font-black text-lg text-gray-800 active:bg-gray-200 transition-all">0</button>
                    <button onClick={handleBackspace} className="bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center active:scale-95"><Delete size={18} /></button>
                 </div>
              </div>
          </div>
        )}

        <div className="p-2 bg-white border-t border-gray-200">
          <button 
            disabled={!isEnough || cart.length === 0}
            onClick={() => onCheckout(paymentMethod === 'CASH' ? cashReceived : total, paymentMethod, customer)}
            className={`w-full py-3 rounded-xl text-xl font-black text-white shadow-lg transition-all flex justify-center items-center gap-2
              ${!isEnough || cart.length === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 active:scale-95'}`}
          >
            <DollarSign size={24} />
            確認結帳 {paymentMethod === 'CASH' && cashReceived > 0 && change >= 0 ? `(找 ${change})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

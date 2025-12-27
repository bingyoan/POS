import React, { useState, useEffect } from 'react';
import { PRODUCTS } from './constants';
import { Product, CartItem, Order, Category, PaymentMethod, Customer, HeldOrder } from './types';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { CustomWeightModal } from './components/CustomWeightModal';
import { DashboardModal } from './components/DashboardModal';
import { ComboModal } from './components/ComboModal';
import { PinModal } from './components/PinModal'; 
import { OrderHistoryModal } from './components/OrderHistoryModal'; 
import { HeldOrdersModal } from './components/HeldOrdersModal'; // ✅ 新增
import { Settings, ChefHat, LayoutGrid, ClipboardList } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  // --- Data State ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pos_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [soldOutIds, setSoldOutIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('pos_sold_out');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('pos_orders_today');
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ 修改：支援多筆寄放訂單 (HeldOrder[])
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    const saved = localStorage.getItem('pos_held_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pos_orders_today', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pos_sold_out', JSON.stringify(soldOutIds));
  }, [soldOutIds]);

  // ✅ 新增：儲存寄放訂單
  useEffect(() => {
    localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
  }, [heldOrders]);

  // --- UI State ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false); // ✅ 新增

  // --- Core Logic ---

  const handleToggleSoldOut = (id: string) => {
    setSoldOutIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (price: number, weight: number, type: 'standard_box' | 'custom_weight') => {
    if (!selectedProduct) return;
    
    // 技巧：如果是三色蛋這種固定單位的，weight 我們會在 UI 層設為 1 (單位)
    // 但為了讓 costPer600g 計算正確，如果它是固定單位的，我們可以調整算法
    // 不過最簡單的方式是：三色蛋的 costPer600g = 70，我們把 1 塊當作 600g 的倍率 (1單位)
    // 這裡維持原樣，只要在 constants 裡設定好 costPer600g 即可
    const unitCost = (selectedProduct.costPer600g / 600) * weight;
    
    const existingIndex = cart.findIndex(item => 
      item.productId === selectedProduct.id &&
      item.type === type &&
      item.price / item.quantity === price
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      const item = newCart[existingIndex];
      newCart[existingIndex] = {
        ...item,
        quantity: item.quantity + 1,
        weightGrams: (item.weightGrams || 0) + weight,
        price: item.price + price,
        cost: item.cost + unitCost
      };
      setCart(newCart);
    } else {
      const newItem: CartItem = {
        id: uuidv4(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        type,
        quantity: 1,
        weightGrams: weight,
        price,
        cost: unitCost,
        modifiers: []
      };
      setCart([...cart, newItem]);
    }
    setSelectedProduct(null);
  };

  const handleOpenComboModal = () => {
    setIsComboModalOpen(true);
  };

  const handleConfirmCombo = (cartItems: CartItem[]) => {
    if (cartItems.length > 0) {
      setCart(prev => [...prev, ...cartItems]);
      setIsComboModalOpen(false);
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.id === 'ss_combo_200') {
      handleOpenComboModal();
    } else {
      setSelectedProduct(product);
    }
  };

  const handleAddModifier = (itemId: string, modifier: string) => {
    setCart(cart.map(item => {
      if (item.id !== itemId) return item;
      const currentMods = item.modifiers || [];
      const newMods = currentMods.includes(modifier) 
        ? currentMods.filter(m => m !== modifier)
        : [...currentMods, modifier];
      return { ...item, modifiers: newMods };
    }));
  };

  const handleCheckout = async (received: number, method: PaymentMethod, customer?: Customer) => {
    const isWaste = method === 'WASTE';
    const totalRevenue = isWaste ? 0 : cart.reduce((sum, item) => sum + item.price, 0);
    const totalCost = cart.reduce((sum, item) => sum + item.cost, 0);
    const todayStr = new Date().toISOString().split('T')[0];

    const newOrder: Order = {
      id: uuidv4(),
      timestamp: Date.now(),
      items: [...cart],
      totalPrice: totalRevenue,
      totalCost: totalCost,
      totalProfit: totalRevenue - totalCost,
      paymentMethod: method,
      customer: customer && (customer.name || customer.phone) ? customer : undefined
    };

    setOrders([newOrder, ...orders]);
    setCart([]);

    try {
      await supabase.from('orders').insert({
        id: newOrder.id,
        date: todayStr,
        content: newOrder.items,
        total_price: newOrder.totalPrice,
        total_cost: newOrder.totalCost,
        total_profit: newOrder.totalProfit,
        payment_method: newOrder.paymentMethod,
        customer: newOrder.customer,
        remarks: newOrder.remarks
      });
    } catch (error) {
      console.error('雲端備份失敗:', error);
    }
  };

  const handleUpdateOrderRemark = (orderId: string, remark: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, remarks: remark } : o));
  };
  
  const handleDeleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    try {
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (error) {
      console.error('雲端刪除失敗:', error);
    }
  };

  const handleClearAllOrders = () => {
    setOrders([]);
    localStorage.removeItem('pos_orders_today');
  };

  // ✅ 新增：處理寄放訂單
  const handleHoldOrder = (customer: Customer, isPaid: boolean) => {
    if (cart.length === 0) return;
    
    const newHeldOrder: HeldOrder = {
      id: uuidv4(),
      timestamp: Date.now(),
      items: [...cart],
      customer,
      isPaid
    };

    setHeldOrders(prev => [newHeldOrder, ...prev]);
    setCart([]);
    alert(`✅ 已將「${customer.name || '客人'}」的訂單寄放！\n(狀態：${isPaid ? '已付' : '未付'})`);
  };

  const handleResumeOrder = (heldOrderId: string) => {
    const orderToResume = heldOrders.find(o => o.id === heldOrderId);
    if (!orderToResume) return;

    if (cart.length > 0) {
      if(!window.confirm('購物車內還有商品，確定要覆蓋嗎？')) return;
    }

    setCart(orderToResume.items);
    setHeldOrders(prev => prev.filter(o => o.id !== heldOrderId));
    setIsHeldOrdersModalOpen(false);
  };

  const handleDeleteHeldOrder = (heldOrderId: string) => {
    setHeldOrders(prev => prev.filter(o => o.id !== heldOrderId));
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      <div className="flex-1 flex flex-col h-full overflow-hidden w-[70%] border-r border-gray-300">
        <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl text-white">
              <ChefHat size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">市場海味 POS</h1>
              <p className="text-sm text-gray-500 font-bold">貨幣單位：台幣 (TWD)</p>
            </div>
          </div>
          
          <div className="flex gap-4">
             {/* 綜合鯊魚煙 $200 */}
             <button 
               onClick={handleOpenComboModal}
               className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-8 py-3 rounded-xl font-black text-xl shadow-lg flex items-center gap-2 transform transition-transform active:scale-95 border-b-4 border-yellow-600"
             >
               <LayoutGrid size={24} />
               綜合鯊魚煙 $200
             </button>

             {/* 阿姨用的：今日訂單 */}
             <button 
               onClick={() => setIsOrderHistoryOpen(true)}
               className="p-3 rounded-xl bg-white border-2 border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm flex items-center gap-2"
             >
               <ClipboardList size={24} />
               <span className="hidden md:inline font-bold">今日訂單</span>
               {orders.length > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{orders.length}</span>}
             </button>

             {/* 老闆用的：後台設置 */}
             <button 
              onClick={() => setIsPinModalOpen(true)}
              className="p-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative"
            >
              <Settings size={24} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex gap-4">
           {/* 左側商品區 */}
           <div className="flex-1 bg-green-50/50 rounded-2xl p-4 border border-green-100">
              <h2 className="text-green-800 font-black text-xl mb-4 flex items-center gap-2">
                 <span className="w-4 h-4 rounded-full bg-green-500"></span>
                 涼拌小菜 (綠區)
              </h2>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {PRODUCTS.filter(p => p.category === Category.SMALL_DISH).map(p => (
                   <ProductCard 
                     key={p.id} 
                     product={p} 
                     isSoldOut={soldOutIds.includes(p.id)}
                     onToggleSoldOut={handleToggleSoldOut}
                     onClick={handleProductClick}
                   />
                ))}
              </div>
           </div>

           {/* 右側商品區 */}
           <div className="flex-1 bg-red-50/50 rounded-2xl p-4 border border-red-100">
              <h2 className="text-red-800 font-black text-xl mb-4 flex items-center gap-2">
                 <span className="w-4 h-4 rounded-full bg-red-500"></span>
                 鯊魚煙 (紅區)
              </h2>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {PRODUCTS.filter(p => p.category === Category.SHARK_SMOKE).map(p => (
                   <ProductCard 
                     key={p.id} 
                     product={p} 
                     isSoldOut={soldOutIds.includes(p.id)}
                     onToggleSoldOut={handleToggleSoldOut}
                     onClick={handleProductClick}
                   />
                ))}
              </div>
           </div>
        </div>
      </div>

      <div className="w-[30%] h-full bg-white relative shadow-2xl z-20">
        <CartSidebar 
          cart={cart}
          heldOrderCount={heldOrders.length} // ✅ 修改：傳入寄放訂單數量
          onRemoveItem={(id) => setCart(cart.filter(i => i.id !== id))}
          onAddModifier={handleAddModifier}
          onCheckout={handleCheckout}
          onHoldOrder={handleHoldOrder} // ✅ 修改：使用新的處理函式
          onResumeOrder={() => setIsHeldOrdersModalOpen(true)} // ✅ 修改：打開寄放列表
          onClearCart={() => setCart([])}
        />
      </div>

      <CustomWeightModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onConfirm={handleAddToCart}
      />

      <PinModal 
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => setIsDashboardOpen(true)}
        correctPin="8888" 
      />

      <DashboardModal 
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        orders={orders}
        soldOutIds={soldOutIds}
        products={PRODUCTS}
        onUpdateRemark={handleUpdateOrderRemark}
        onDeleteOrder={handleDeleteOrder}
        onClearAllOrders={handleClearAllOrders}
      />

      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
        orders={orders}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* ✅ 新增：寄放訂單列表視窗 */}
      <HeldOrdersModal
        isOpen={isHeldOrdersModalOpen}
        onClose={() => setIsHeldOrdersModalOpen(false)}
        heldOrders={heldOrders}
        onResume={handleResumeOrder}
        onDelete={handleDeleteHeldOrder}
      />

      <ComboModal 
        products={PRODUCTS} 
        isOpen={isComboModalOpen} 
        onClose={() => setIsComboModalOpen(false)} 
        onConfirm={handleConfirmCombo} 
      />
    </div>
  );
};

export default App;

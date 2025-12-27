import React, { useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { X, Check, Utensils } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ComboModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cartItems: CartItem[]) => void;
}

// ✅ 1. 正確定義五種原料的 ID (絕對不會再抓錯)
const COMBO_COMPONENTS = [
  { label: '肉', id: 'ss_bellymeat', name: '鯊魚腹肉' },
  { label: '皮', id: 'ss_sharkskin', name: '鯊魚皮' },
  { label: '肚', id: 'ss_sharkbelly', name: '鯊魚肚' },
  { label: '翅', id: 'ss_finhead', name: '鯊魚翅頭' },
  { label: '蛋', id: 'ss_roe', name: '紅甘魚卵' },
];

export const ComboModal: React.FC<ComboModalProps> = ({ 
  products, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setSelectedIds([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 4) return; // 最多選 4 樣
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // ✅ 2. 核心：智慧定價演算法
  const calculatePrices = (ids: string[]): { [key: string]: number } => {
    const count = ids.length;
    const priceMap: { [key: string]: number } = {};
    
    const hasMeat = ids.includes('ss_bellymeat'); // 有肉
    const hasRoe = ids.includes('ss_roe');       // 有蛋

    // --- 情境 A: 選 2 樣 (例如：肉+肚) ---
    // 規則：各 100 元
    if (count === 2) {
      ids.forEach(id => priceMap[id] = 100);
    } 
    // --- 情境 B: 選 4 樣 ---
    // 規則：各 50 元
    else if (count === 4) {
      ids.forEach(id => priceMap[id] = 50);
    }
    // --- 情境 C: 選 3 樣 (最複雜的情況) ---
    else if (count === 3) {
      if (hasMeat) {
        if (hasRoe) {
          // 規則：肉(80) + 蛋(70) + 其他(50)
          priceMap['ss_bellymeat'] = 80;
          priceMap['ss_roe'] = 70;
          // 剩下的那個設為 50
          const otherId = ids.find(id => id !== 'ss_bellymeat' && id !== 'ss_roe');
          if (otherId) priceMap[otherId] = 50;
        } else {
          // 規則：肉(80) + 其他(60) + 其他(60)
          priceMap['ss_bellymeat'] = 80;
          ids.forEach(id => {
            if (id !== 'ss_bellymeat') priceMap[id] = 60;
          });
        }
      } else {
        // 沒有肉的情況 (比較少見)，平均分配 (66, 67, 67)
        const avg = Math.floor(200 / 3);
        ids.forEach((id, index) => {
          priceMap[id] = index === 0 ? 200 - (avg * 2) : avg;
        });
      }
    } 
    // --- 其他情況 (只選1樣或超過4樣) ---
    else if (count > 0) {
      // 平均分配
      const avg = Math.floor(200 / count);
      const remainder = 200 - (avg * count);
      ids.forEach((id, index) => {
        priceMap[id] = index === 0 ? avg + remainder : avg;
      });
    }

    return priceMap;
  };

  const handleConfirmClick = () => {
    if (selectedIds.length < 2) {
      alert("綜合鯊魚煙請至少選擇 2 樣！");
      return;
    }

    // 取得計算後的價格
    const priceMap = calculatePrices(selectedIds);
    const cartItems: CartItem[] = [];

    selectedIds.forEach((id) => {
      // 從產品列表找詳細資料，確保名稱正確
      // 這裡會去對應 constants.ts 裡的資料
      const product = products.find(p => p.id === id);
      const computedPrice = priceMap[id];

      if (product) {
        cartItems.push({
          id: uuidv4(),
          productId: product.id,
          productName: `(綜)${product.name}`, // 加上 (綜) 標記
          type: 'standard_box',
          quantity: 1,
          price: computedPrice,
          // 成本計算：
          // 這邊使用 (售價 / 每斤原售價) 來反推大概的重量成本
          // 例如：肉分配到 $80，原價 $360/斤。 $80/$360 = 0.22斤。
          // 這樣扣庫存會比較接近真實切出去的量。
          cost: product.defaultSellingPricePer600g > 0 
            ? (computedPrice / product.defaultSellingPricePer600g) * product.costPer600g
            : 0, 
          modifiers: []
        });
      }
    });

    onConfirm(cartItems);
    setSelectedIds([]); 
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Utensils size={24} className="text-yellow-400"/>
            綜合鯊魚煙組合 $200
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-center text-gray-500 mb-6 font-bold">
            請任選 2 ~ 4 樣 (總價固定 $200)
          </p>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            {COMBO_COMPONENTS.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border-4 transition-all
                    ${isSelected 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner scale-95' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                >
                  <span className="text-3xl font-black">{item.label}</span>
                  <span className="text-xs font-bold">{item.name}</span>
                  {isSelected && <Check size={20} className="text-blue-600 absolute top-2 right-2" />}
                </button>
              );
            })}
          </div>

          {/* 預覽區：即時顯示目前的組合價格分配 */}
          <div className="mb-4 bg-gray-100 p-3 rounded-lg text-sm text-gray-600">
             <div className="flex justify-between font-bold mb-1">
               <span>目前組合:</span>
               <span>{selectedIds.length} 樣</span>
             </div>
             {selectedIds.length >= 2 ? (
                <div className="space-y-1">
                  {selectedIds.map(id => {
                     const prices = calculatePrices(selectedIds);
                     const name = COMBO_COMPONENTS.find(c => c.id === id)?.name;
                     return (
                       <div key={id} className="flex justify-between border-b border-gray-200 pb-1 last:border-0">
                          <span>{name}</span>
                          <span className="font-mono text-blue-600">${prices[id]}</span>
                       </div>
                     )
                  })}
                  <div className="flex justify-between border-t border-gray-300 pt-1 font-black text-gray-800">
                    <span>總計</span>
                    <span>$200</span>
                  </div>
                </div>
             ) : (
               <div className="text-center text-gray-400 py-2">請至少選擇 2 樣</div>
             )}
          </div>

          <button
            onClick={handleConfirmClick}
            disabled={selectedIds.length < 2}
            className={`w-full py-4 rounded-xl text-xl font-black shadow-lg transition-all flex items-center justify-center gap-2
              ${selectedIds.length >= 2 
                ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 translate-y-0' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            確認組合
          </button>
        </div>
      </div>
    </div>
  );
};

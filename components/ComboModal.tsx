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

// ✅ 這裡定義正確的對應關係 (最重要的修改)
const COMBO_COMPONENTS = [
  { label: '肉', id: 'ss_bellymeat', name: '鯊魚腹肉' },
  { label: '皮', id: 'ss_sharkskin', name: '鯊魚皮' },  // 修正：確保是鯊魚皮，不是海蜇皮
  { label: '肚', id: 'ss_sharkbelly', name: '鯊魚肚' },
  { label: '翅', id: 'ss_finhead', name: '鯊魚翅頭' },
  { label: '蛋', id: 'ss_roe', name: '紅甘魚卵' },      // 修正：確保對應到紅甘魚卵
];

export const ComboModal: React.FC<ComboModalProps> = ({ 
  products, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 每次打開時清空選擇
  useEffect(() => {
    if (isOpen) setSelectedIds([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 3) return; // 最多選 3 樣
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleConfirmClick = () => {
    if (selectedIds.length === 0) return;

    // 建立購物車項目
    // 邏輯：建立一個主要項目「綜合鯊魚煙」，然後把選到的內容放在備註或 modifiers 裡
    // 這樣價格 $200 才會準確，庫存扣除我們用平均值 (之後可在後台邏輯微調)
    
    // 1. 找出選中的項目名稱
    const selectedNames = selectedIds.map(id => {
      const component = COMBO_COMPONENTS.find(c => c.id === id);
      return component ? component.name : '';
    });

    // 2. 建立「綜合鯊魚煙」的主項目
    // 我們直接使用 'ss_combo_200' 這個產品 ID (需確保 constants.ts 有這項)
    const comboProduct = products.find(p => p.id === 'ss_combo_200');
    
    if (!comboProduct) {
      alert("系統錯誤：找不到綜合鯊魚煙的產品設定");
      return;
    }

    const cartItems: CartItem[] = [];

    // 為了讓庫存扣得準，我們這裡做一個變通：
    // 我們不直接加「綜合鯊魚煙」這一個商品，而是把這 $200 拆分給選到的 3 樣東西
    // 這樣後台盤點時，「鯊魚皮」、「腹肉」的重量才會被扣掉！
    
    const count = selectedIds.length;
    // 平均分配價格，最後一個項目吸收餘數
    const basePrice = Math.floor(200 / count);
    const remainder = 200 - (basePrice * count);

    selectedIds.forEach((id, index) => {
      const product = products.find(p => p.id === id);
      const isLast = index === selectedIds.length - 1;
      const price = isLast ? basePrice + remainder : basePrice; // 確保總和是 200

      if (product) {
        cartItems.push({
          id: uuidv4(),
          productId: product.id,
          productName: `(綜)${product.name}`, // 標記這是綜合拼盤裡的
          type: 'standard_box', // 視為固定份量
          quantity: 1,
          price: price,
          cost: (product.costPer600g / 600) * (600 / 3 / 4), // 粗估成本：假設一盒共半斤(300g)，三樣平分每樣 100g
          modifiers: []
        });
      }
    });

    onConfirm(cartItems);
    setSelectedIds([]); // 清空
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Utensils size={24} className="text-yellow-400"/>
            綜合鯊魚煙組合
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-center text-gray-500 mb-6 font-bold">請選擇 3 樣 (總價 $200)</p>
          
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

          <button
            onClick={handleConfirmClick}
            disabled={selectedIds.length === 0}
            className={`w-full py-4 rounded-xl text-xl font-black shadow-lg transition-all flex items-center justify-center gap-2
              ${selectedIds.length > 0 
                ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 translate-y-0' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            確認組合 ${selectedIds.length > 0 ? '200' : '0'}
          </button>
        </div>
      </div>
    </div>
  );
};

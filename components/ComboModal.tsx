import React from 'react';
import { X, LayoutGrid } from 'lucide-react';
import { Product, CartItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ComboModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  // 修改這裡：傳回來的不再是 Product[]，而是計算好的 CartItem[]
  onConfirm: (items: CartItem[]) => void; 
}

// 定義組合的設定檔 (配方表)
// 邏輯：為了讓總價湊齊 200，部分 $50 的項目我微調成 $60，確保帳目平衡
const COMBO_PRESETS = [
  {
    name: ' 皮組合(肉+皮+肚)',
    description: '肉80 / 皮60 / 肚60',
    items: [
      { nameKeyword: '腹肉', price: 80 },
      { nameKeyword: '皮', price: 60 },
      { nameKeyword: '肚', price: 60 } // 原50湊整數
    ]
  },
  {
    name: '皮組合 (肉+皮+翅頭)',
    description: '肉80 / 皮60 / 翅頭60',
    items: [
      { nameKeyword: '腹肉', price: 80 },
      { nameKeyword: '皮', price: 60 },
      { nameKeyword: '翅頭', price: 60 } // 原50湊整數
    ]
  },
  {
    name: '蛋組合(肉+蛋+肚)',
    description: '肉80 / 蛋70 / 肚50',
    items: [
      { nameKeyword: '腹肉', price: 80 },
      { nameKeyword: '魚蛋', price: 70 },
      { nameKeyword: '肚', price: 50 }
    ]
  },
  {
    name: '蛋組合(肉+蛋+翅頭)',
    description: '肉80 / 蛋70 / 翅頭50',
    items: [
      { nameKeyword: '腹肉', price: 80 },
      { nameKeyword: '魚蛋', price: 70 },
      { nameKeyword: '翅頭', price: 50 }
    ]
  },
  {
    name: '雙拼 (肉+肚)',
    description: '肉100 / 肚100',
    items: [
      { nameKeyword: '腹肉', price: 100 },
      { nameKeyword: '肚', price: 100 }
    ]
  },
  {
    name: '皮蛋組合 (肉+皮+蛋)',
    description: '肉80 / 皮60 / 蛋60',
    items: [
      { nameKeyword: '腹肉', price: 80 },
      { nameKeyword: '皮', price: 60 },
      { nameKeyword: '魚蛋', price: 60 }
    ]
  },
  {
    name: '全肉大餐',
    description: '鯊魚腹肉 200',
    items: [
      { nameKeyword: '腹肉', price: 200 }
    ]
  }
];

export const ComboModal: React.FC<ComboModalProps> = ({ products, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  // 核心邏輯：將「價格」轉換回「重量」
  const handleSelectPreset = (preset: typeof COMBO_PRESETS[0]) => {
    const cartItems: CartItem[] = [];

    preset.items.forEach(presetItem => {
      // 1. 在產品列表中模糊搜尋對應的商品 (例如 "腹肉" -> "鯊魚腹肉")
      const product = products.find(p => p.name.includes(presetItem.nameKeyword));
      
      if (product) {
        // 2. 反推重量公式： (分配金額 / 每斤售價) * 600克
        // 例如：肉80元，每斤300元 => (80/300)*600 = 160克
        const estimatedWeight = Math.round((presetItem.price / product.defaultSellingPricePer600g) * 600);
        
        // 3. 計算成本 (依重量)
        const itemCost = Math.round((product.costPer600g / 600) * estimatedWeight);

        cartItems.push({
          id: uuidv4(),
          productId: product.id,
          productName: `${product.name} (拼)`, // 標記為拼盤
          type: 'combo_part', // 記得在 types.ts 加這個，或者暫時用 standard_box
          quantity: 1,
          weightGrams: estimatedWeight, // 這是扣庫存的關鍵！
          price: presetItem.price,
          cost: itemCost,
          modifiers: [`${preset.name}`]
        });
      }
    });

    onConfirm(cartItems);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="bg-yellow-400 p-6 flex justify-between items-center shadow-md">
          <h2 className="text-2xl font-black text-yellow-900 flex items-center gap-3">
            <LayoutGrid size={28} />
            請選擇 $200 組合內容
          </h2>
          <button onClick={onClose} className="bg-white/30 p-2 rounded-full hover:bg-white/50 transition-colors">
            <X size={24} className="text-yellow-900" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMBO_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(preset)}
                className="flex flex-col items-start p-6 bg-white border-2 border-yellow-100 rounded-2xl hover:border-yellow-500 hover:shadow-lg transition-all group text-left active:scale-[0.98]"
              >
                <div className="flex justify-between w-full mb-2">
                  <span className="font-black text-xl text-gray-800 group-hover:text-yellow-700">
                    {preset.name}
                  </span>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold text-sm">
                    $200
                  </span>
                </div>
                <div className="text-gray-500 font-medium">
                  {preset.description}
                </div>
                {/* 顯示詳細內容條 */}
                <div className="mt-3 flex gap-2 w-full">
                  {preset.items.map((item, i) => (
                    <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {item.nameKeyword} ${item.price}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 text-center text-gray-400 text-sm">
          點擊上方組合，系統將自動計算對應重量並扣除庫存
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { PRICING_RULES } from '../constants';
import { Scale, Package, Calculator, X } from 'lucide-react';

interface CustomWeightModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number, weight: number, type: 'standard_box' | 'custom_weight') => void;
}

export const CustomWeightModal: React.FC<CustomWeightModalProps> = ({ product, isOpen, onClose, onConfirm }) => {
  const [tab, setTab] = useState<'standard' | 'price' | 'weight'>('standard');
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedFixedPrice, setSelectedFixedPrice] = useState<number | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setTab('standard');
      setSelectedFixedPrice(null);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const isShark = product.category === Category.SHARK_SMOKE;
  const standardPrice = isShark ? PRICING_RULES.shark.standardBoxPrice : PRICING_RULES.smallDish.standardBoxPrice;
  const minPrice = isShark ? PRICING_RULES.shark.minCustomPrice : PRICING_RULES.smallDish.minCustomPrice;

  const getCalculatedValues = () => {
    const pricePerGram = product.defaultSellingPricePer600g / 600;

    if (tab === 'standard') {
      // Handle products with multiple fixed prices (like Dried Fish)
      const currentPrice = selectedFixedPrice || (product.fixedPrices ? product.fixedPrices[0].price : standardPrice);
      return { price: currentPrice, weight: Math.round(currentPrice / pricePerGram) };
    }

    const val = parseFloat(inputValue);
    if (tab === 'price') {
      if (isNaN(val) || val <= 0) return { price: 0, weight: 0 };
      return { price: Math.round(val), weight: Math.round(val / pricePerGram) };
    }
    if (tab === 'weight') {
      if (isNaN(val) || val <= 0) return { price: 0, weight: 0 };
      return { price: Math.round(val * pricePerGram), weight: Math.round(val) };
    }
    return { price: 0, weight: 0 };
  };

  const { price, weight } = getCalculatedValues();
  const isValid = tab === 'standard' || price >= minPrice;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => {
        if(e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`p-4 flex justify-between items-center ${isShark ? 'bg-red-500' : 'bg-emerald-600'}`}>
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold text-white">{product.name}</h3>
            <span className="text-white/80 text-xs font-bold">成本 ${product.costPer600g} / 售價 ${product.defaultSellingPricePer600g} (斤)</span>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-gray-100">
          <button 
            onClick={() => setTab('standard')}
            className={`flex-1 py-4 rounded-xl font-bold text-lg flex flex-col items-center justify-center gap-1 transition-all ${tab === 'standard' ? 'bg-white shadow-md text-blue-600 ring-2 ring-blue-500' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <Package size={24} />
            <span>固定規格</span>
          </button>
          <button 
             onClick={() => { setTab('price'); setInputValue(''); }}
             className={`flex-1 py-4 rounded-xl font-bold text-lg flex flex-col items-center justify-center gap-1 transition-all ${tab === 'price' ? 'bg-white shadow-md text-blue-600 ring-2 ring-blue-500' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <span className="text-2xl">NT$</span>
            <span>輸入金額</span>
          </button>
          <button 
             onClick={() => { setTab('weight'); setInputValue(''); }}
             className={`flex-1 py-4 rounded-xl font-bold text-lg flex flex-col items-center justify-center gap-1 transition-all ${tab === 'weight' ? 'bg-white shadow-md text-blue-600 ring-2 ring-blue-500' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <Scale size={24} />
            <span>輸入重量</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          {tab === 'standard' ? (
            <div className="flex flex-col gap-4 py-4">
               {!product.fixedPrices ? (
                 <div className="text-center">
                    <p className="text-gray-500 text-lg font-bold">標準盒裝價格</p>
                    <p className="text-6xl font-black text-gray-800 mt-2">NT${standardPrice}</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 gap-4">
                   {product.fixedPrices.map((fp) => (
                     <button
                       key={fp.label}
                       onClick={() => setSelectedFixedPrice(fp.price)}
                       className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                         (selectedFixedPrice === fp.price || (!selectedFixedPrice && fp.price === product.fixedPrices![0].price))
                           ? 'border-blue-500 bg-blue-50' 
                           : 'border-gray-200 hover:bg-gray-50'
                       }`}
                     >
                       <span className="text-gray-500 font-bold mb-1">{fp.label}</span>
                       <span className="text-3xl font-black text-gray-800">NT${fp.price}</span>
                     </button>
                   ))}
                 </div>
               )}
            </div>
          ) : (
             <div className="mb-6">
                <label className="block text-center text-gray-500 mb-2 font-medium">
                  請輸入 {tab === 'price' ? '購買金額 (元)' : '秤重重量 (克)'}
                </label>
                <div className="relative max-w-xs mx-auto">
                  <input
                    type="number"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full text-5xl font-black p-4 border-b-4 border-blue-500 focus:outline-none text-center bg-gray-50 rounded-t-xl"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                {!isValid && price > 0 && (
                   <p className="text-red-500 font-bold text-center mt-2">最低消費金額 NT${minPrice}</p>
                )}
             </div>
          )}

          {/* Result Preview */}
          <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center mb-6 border border-blue-100 shadow-inner">
            <div>
               <p className="text-gray-500 text-sm font-bold">預估重量</p>
               <p className="text-3xl font-black text-gray-800">{weight} g</p>
            </div>
            <div className="text-right">
               <p className="text-gray-500 text-sm font-bold">加入金額</p>
               <p className="text-4xl font-black text-blue-600">NT${price}</p>
            </div>
          </div>

          <button 
            onClick={() => onConfirm(price, weight, tab === 'standard' ? 'standard_box' : 'custom_weight')}
            disabled={!isValid}
            className={`w-full py-5 rounded-xl text-2xl font-bold text-white shadow-lg transition-all transform active:scale-95
              ${isValid 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                : 'bg-gray-300 cursor-not-allowed shadow-none'}`}
          >
            確認加入購物車
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { PRICING_RULES } from '../constants';
import { X, Scale, AlertTriangle } from 'lucide-react';

interface CustomWeightModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number, weight: number, type: 'standard_box' | 'custom_weight') => void;
}

export const CustomWeightModal: React.FC<CustomWeightModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  // 輸入模式：'price' (算重量) 或 'weight' (算價格)
  const [inputMode, setInputMode] = useState<'price' | 'weight'>('price');
  
  // 數值狀態
  const [inputValue, setInputValue] = useState<string>(''); // 用字串處理輸入比較好控制
  const [calculatedValue, setCalculatedValue] = useState<number>(0);

  // 台斤/兩 專用狀態 (當 inputMode === 'weight' 時使用)
  const [cattyInput, setCattyInput] = useState<string>(''); // 斤
  const [taelInput, setTaelInput] = useState<string>('');   // 兩

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setCalculatedValue(0);
      setCattyInput('');
      setTaelInput('');
      setInputMode('price'); // 預設用金額輸入
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // 取得此商品的最低價格限制
  const minPrice = product.category === Category.SHARK_SMOKE 
    ? PRICING_RULES.shark.minCustomPrice 
    : PRICING_RULES.smallDish.minCustomPrice;

  // 計算邏輯
  const pricePerCatty = product.defaultSellingPricePer600g || 300; // 預設一斤300避免除以0

  // 當輸入改變時的即時計算
  useEffect(() => {
    if (inputMode === 'price') {
      // 輸入金額 -> 算重量
      const price = parseFloat(inputValue) || 0;
      // 公式：金額 / 單價 * 600g
      const weight = (price / pricePerCatty) * 600;
      setCalculatedValue(weight);
    } else {
      // 輸入重量(斤/兩) -> 算金額
      const catty = parseFloat(cattyInput) || 0;
      const tael = parseFloat(taelInput) || 0;
      const totalCatty = catty + (tael / 16);
      
      // 公式：總台斤 * 單價
      const price = Math.round(totalCatty * pricePerCatty);
      setCalculatedValue(price);
    }
  }, [inputValue, cattyInput, taelInput, inputMode, pricePerCatty]);

  const handleConfirm = () => {
    let finalPrice = 0;
    let finalWeight = 0;

    if (inputMode === 'price') {
      finalPrice = parseFloat(inputValue) || 0;
      finalWeight = calculatedValue;
    } else {
      finalPrice = calculatedValue;
      // 轉換輸入的斤兩為公克
      const catty = parseFloat(cattyInput) || 0;
      const tael = parseFloat(taelInput) || 0;
      finalWeight = (catty * 600) + (tael * 37.5);
    }

    if (finalPrice <= 0) return;

    // ✅ 修正：就算低於低消，也允許加入 (為了報廢或是熟客少切)
    // 我們只在 UI 上顯示警告，但不擋住 onConfirm
    onConfirm(finalPrice, finalWeight, 'custom_weight');
    onClose();
  };

  const handleNumClick = (num: number) => {
    if (inputMode === 'price') {
      setInputValue(prev => prev + num.toString());
    } else {
      // 這裡簡化處理，焦點在哪就輸入哪，目前先假設只能點擊輸入框輸入
    }
  };

  const currentPrice = inputMode === 'price' ? (parseFloat(inputValue) || 0) : calculatedValue;
  const isBelowMin = currentPrice > 0 && currentPrice < minPrice;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Scale size={24} className="text-yellow-400"/>
            {product.name} - 秤重計價
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* 切換模式 */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setInputMode('price')}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${inputMode === 'price' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              輸入金額 ($)
            </button>
            <button 
              onClick={() => setInputMode('weight')}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${inputMode === 'weight' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              輸入重量 (斤/兩)
            </button>
          </div>

          {/* 輸入區 */}
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
            {inputMode === 'price' ? (
              <div>
                <p className="text-sm text-gray-500 font-bold mb-1">請輸入價格</p>
                <div className="relative inline-block w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-blue-300">$</span>
                  <input 
                    type="number" 
                    autoFocus
                    className="w-full text-5xl font-black text-center bg-transparent focus:outline-none text-blue-800 placeholder-blue-200"
                    placeholder="0"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                  />
                </div>
                <p className="mt-2 text-gray-500 font-mono">
                  ≈ {calculatedValue > 0 ? (calculatedValue / 600 * 16).toFixed(1) : 0} 兩 
                  ({calculatedValue.toFixed(0)}g)
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 font-bold mb-4">請輸入重量</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex-1">
                    <input 
                      type="number" 
                      autoFocus
                      className="w-full text-4xl font-black text-center border-b-2 border-blue-300 focus:border-blue-600 bg-transparent focus:outline-none"
                      placeholder="0"
                      value={cattyInput}
                      onChange={e => setCattyInput(e.target.value)}
                    />
                    <span className="text-xs text-gray-500 font-bold mt-1 block">台斤</span>
                  </div>
                  <span className="text-2xl text-gray-300 font-light">:</span>
                  <div className="flex-1">
                    <input 
                      type="number" 
                      className="w-full text-4xl font-black text-center border-b-2 border-blue-300 focus:border-blue-600 bg-transparent focus:outline-none"
                      placeholder="0"
                      value={taelInput}
                      onChange={e => setTaelInput(e.target.value)}
                    />
                    <span className="text-xs text-gray-500 font-bold mt-1 block">台兩</span>
                  </div>
                </div>
                <p className="mt-4 text-3xl font-black text-blue-600">
                  = ${calculatedValue}
                </p>
              </div>
            )}
          </div>

          {/* 警告訊息 (如果低於低消) */}
          {isBelowMin && (
            <div className="flex items-center gap-2 p-3 bg-orange-100 text-orange-700 rounded-lg text-sm font-bold animate-pulse">
              <AlertTriangle size={18} />
              <span>注意：金額低於建議售價 (${minPrice})</span>
            </div>
          )}

          {/* 確認按鈕 */}
          <button
            onClick={handleConfirm}
            // ✅ 修正：只有金額 <= 0 才禁止，低於低消依然可以按 (報廢用)
            disabled={currentPrice <= 0}
            className={`w-full py-4 rounded-xl text-xl font-black shadow-lg transition-all flex items-center justify-center gap-2
              ${currentPrice <= 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : isBelowMin 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' // 低於低消變橘色
                  : 'bg-blue-600 hover:bg-blue-700 text-white'     // 正常變藍色
              }`}
          >
            {isBelowMin ? '確認加入 (低於低消)' : '確認加入購物車'}
          </button>

        </div>
      </div>
    </div>
  );
};

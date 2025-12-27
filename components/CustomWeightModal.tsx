import React, { useState, useEffect, useRef } from 'react';
import { Product, Category } from '../types';
import { PRICING_RULES } from '../constants';
import { X, Scale, Package } from 'lucide-react';

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
  const [priceStr, setPriceStr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 當視窗打開時，重置輸入並聚焦
  useEffect(() => {
    if (isOpen) {
      setPriceStr('');
      // 如果沒有固定選項(只能秤重)，自動聚焦輸入框
      if (!product?.fixedPrices || product.fixedPrices.length === 0) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      }
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const pricePerCatty = product.defaultSellingPricePer600g || 300;
  
  // --- 1. 處理「固定價格 (盒裝)」點擊 ---
  const handleFixedPriceClick = (price: number) => {
    // 盒裝通常是固定單位，但我們還是算一個參考重量給系統 (依照金額比例)
    const estimatedWeight = (price / pricePerCatty) * 600;
    onConfirm(price, estimatedWeight, 'standard_box');
    onClose();
  };

  // --- 2. 處理「自訂金額 (秤重/報廢)」輸入 ---
  const currentPrice = parseFloat(priceStr) || 0;
  const estimatedWeight = (currentPrice / pricePerCatty) * 600;
  const estimatedTael = (estimatedWeight / 600) * 16;

  const handleCustomSubmit = () => {
    if (currentPrice <= 0) return;
    // 這裡允許任何金額，方便報廢或零賣
    onConfirm(currentPrice, estimatedWeight, 'custom_weight');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSubmit();
    }
  };

  // 快捷金額按鈕 (給自訂輸入用)
  const quickAmounts = [50, 100, 150, 200, 300];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Scale size={24} className="text-yellow-400"/>
            {product.name}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* 區塊 A: 固定選項 (如果有的話，例如小魚乾、鴨賞) */}
          {product.fixedPrices && product.fixedPrices.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                <Package size={14}/> 快速選擇 (盒裝)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {product.fixedPrices.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleFixedPriceClick(option.price)}
                    className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-800 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 flex flex-col items-center justify-center shadow-sm"
                  >
                    <span>{option.label}</span>
                    <span className="text-blue-600 text-sm">${option.price}</span>
                  </button>
                ))}
              </div>
              
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold">或 輸入其他金額</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
            </div>
          )}

          {/* 區塊 B: 自訂輸入 (秤重/損耗) */}
          <div>
            {!product.fixedPrices && (
               <p className="text-gray-500 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                 <Scale size={14}/> 輸入金額 (秤重/損耗)
               </p>
            )}
            
            <div className="relative mb-4">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">$</span>
              <input 
                ref={inputRef}
                type="number" 
                inputMode="decimal"
                className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl py-3 text-center text-4xl font-black text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="0"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={(e) => e.target.select()}
              />
            </div>
            
            {/* 快捷按鈕 */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => setPriceStr(amount.toString())}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 rounded-lg text-sm transition-colors"
                >
                  {amount}
                </button>
              ))}
            </div>

            <p className="text-center text-gray-400 text-xs font-mono mb-4">
              約 {estimatedTael.toFixed(1)} 兩 ({estimatedWeight.toFixed(0)}g)
            </p>

            <button
              onClick={handleCustomSubmit}
              disabled={currentPrice <= 0}
              className={`w-full py-3 rounded-xl text-lg font-black shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95
                ${currentPrice > 0 
                  ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`
              }
            >
              確認加入
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

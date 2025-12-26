
import React, { useRef, useState } from 'react';
import { Product, Category } from '../types';

interface ProductCardProps {
  product: Product;
  isSoldOut: boolean;
  onToggleSoldOut: (id: string) => void;
  onClick: (product: Product) => void;
  // Combo mode props
  isComboMode?: boolean;
  isSelectedInCombo?: boolean;
  onSelectForCombo?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isSoldOut, 
  onToggleSoldOut,
  onClick,
  isComboMode,
  isSelectedInCombo,
  onSelectForCombo
}) => {
  const isShark = product.category === Category.SHARK_SMOKE;
  const timerRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  // --- Long Press Logic ---
  const handlePointerDown = () => {
    if (isComboMode) return; // Disable long press in combo mode
    setIsPressing(true);
    timerRef.current = window.setTimeout(() => {
      onToggleSoldOut(product.id);
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
      setIsPressing(false);
    }, 1500); // 1.5 seconds long press
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  };

  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  };

  const handleClick = () => {
    if (isComboMode && onSelectForCombo) {
      if (!isSoldOut) onSelectForCombo(product);
      return;
    }
    if (!isSoldOut) onClick(product);
  };

  // --- Styles ---
  let bgClass = "bg-white";
  let borderClass = "border-gray-200";
  let textClass = "text-gray-800";

  if (isSoldOut) {
    bgClass = "bg-gray-200";
    textClass = "text-gray-400";
    borderClass = "border-gray-300";
  } else if (isShark) {
    // Red Theme for Shark
    bgClass = isSelectedInCombo ? "bg-red-100" : "bg-white hover:bg-red-50";
    borderClass = isSelectedInCombo ? "border-red-500 border-4" : "border-red-200 border-l-8";
    textClass = "text-gray-900";
  } else {
    // Green Theme for Side Dishes
    bgClass = "bg-white hover:bg-green-50";
    borderClass = "border-green-200 border-l-8";
    textClass = "text-gray-900";
  }

  // Visual cue for pressing
  const scaleClass = isPressing ? "scale-95" : "scale-100";

  return (
    <div
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerLeave}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onClick={handleClick}
      className={`
        relative h-32 rounded-xl shadow-md transition-all duration-200 cursor-pointer select-none flex flex-col justify-center items-center p-2
        ${bgClass} ${borderClass} ${scaleClass}
      `}
    >
      <h3 className={`text-2xl font-black text-center leading-tight ${textClass}`}>
        {product.name}
      </h3>
      
      {!isSoldOut && (
        <span className="text-sm font-medium text-gray-400 mt-2">
           ${product.defaultSellingPricePer600g}/斤
        </span>
      )}

      {isSoldOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 rounded-xl">
           <span className="bg-gray-800 text-white px-3 py-1 rounded-lg font-bold text-lg transform -rotate-12">
             售完
           </span>
        </div>
      )}
      
      {isSelectedInCombo && (
        <div className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm">
          ✓
        </div>
      )}
    </div>
  );
};

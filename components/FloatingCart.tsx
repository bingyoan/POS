import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';

interface FloatingCartProps {
  count: number;
  total: number;
  onClick: () => void;
}

export const FloatingCart: React.FC<FloatingCartProps> = ({ count, total, onClick }) => {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center lg:hidden animate-fade-in-up">
      <button 
        onClick={onClick}
        className="w-full max-w-md bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between hover:bg-gray-800 transition-all border border-gray-700/50 backdrop-blur-md bg-opacity-95"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-900/50">
              <ShoppingBag size={22} />
            </div>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-gray-900">
              {count}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-400 font-medium">目前累計</span>
            <span className="text-xl font-bold text-white tracking-wide">${total}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 pl-4 border-l border-gray-700">
          <span className="text-sm font-bold text-blue-400">查看明細</span>
          <ChevronRight size={16} className="text-blue-400" />
        </div>
      </button>
    </div>
  );
};

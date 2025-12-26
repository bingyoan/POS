
import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { X, Check } from 'lucide-react';

interface ComboModalProps {
  products: Product[]; // Only shark products passed here
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedProducts: Product[]) => void;
}

export const ComboModal: React.FC<ComboModalProps> = ({ products, isOpen, onClose, onConfirm }) => {
  const [selected, setSelected] = useState<Product[]>([]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) setSelected([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (product: Product) => {
    if (selected.find(p => p.id === product.id)) {
      setSelected(selected.filter(p => p.id !== product.id));
    } else {
      if (selected.length < 4) {
        setSelected([...selected, product]);
      }
    }
  };

  const isComplete = selected.length >= 2 && selected.length <= 4;
  
  // Filter out the combo placeholder itself from the options
  const selectionOptions = products.filter(p => 
    p.category === Category.SHARK_SMOKE && p.id !== 'ss_combo_200'
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-yellow-400 flex justify-between items-center shadow-md z-10">
          <div>
            <h3 className="text-2xl font-black text-yellow-900">綜合鯊魚煙拼盤 ($200)</h3>
            <p className="text-yellow-800 font-bold">請選擇內容物 (2 ~ 4 樣) - 目前已選: {selected.length}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-yellow-500 rounded-full text-white hover:bg-yellow-600">
            <X size={24} />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {selectionOptions.map(product => {
               const isSelected = !!selected.find(p => p.id === product.id);
               return (
                 <button
                   key={product.id}
                   onClick={() => handleToggle(product)}
                   className={`h-40 rounded-xl flex flex-col items-center justify-center p-4 transition-all relative border-4
                     ${isSelected 
                       ? 'bg-yellow-100 border-yellow-500 shadow-md transform scale-95' 
                       : 'bg-white border-gray-200 hover:border-yellow-200'}`}
                 >
                   <span className="text-2xl font-black text-gray-800">{product.name}</span>
                   {isSelected && (
                     <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1">
                       <Check size={20} />
                     </div>
                   )}
                 </button>
               )
             })}
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200">
          <button 
            disabled={!isComplete}
            onClick={() => {
              if (isComplete) {
                onConfirm(selected);
              }
            }}
            className={`w-full py-4 rounded-xl text-2xl font-black transition-all
              ${isComplete 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            {isComplete ? '確認加入拼盤' : selected.length < 2 ? `還差 ${2 - selected.length} 樣` : '已達上限'}
          </button>
        </div>
      </div>
    </div>
  );
};

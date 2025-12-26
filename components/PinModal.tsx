import React, { useState, useEffect } from 'react';
import { X, Lock, Delete } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin?: string;
}

export const PinModal: React.FC<PinModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  correctPin = '8888' // 預設密碼 8888
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setError(false);
    }
  }, [isOpen]);

  const handleNum = (num: string) => {
    if (input.length < 4) {
      setInput(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (input === correctPin) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gray-900 p-6 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X size={24} />
          </button>
          <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-400">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">店長權限鎖定</h2>
          <p className="text-gray-400 text-sm mt-1">請輸入 4 位數管理密碼</p>
        </div>
        <div className="bg-gray-100 p-6 flex justify-center">
          <div className={`flex gap-3 ${error ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${i < input.length ? 'bg-gray-800 border-gray-800' : 'bg-transparent border-gray-400'} ${error ? 'border-red-500 bg-red-100' : ''}`}/>
            ))}
          </div>
        </div>
        {error && <p className="text-center text-red-500 text-sm font-bold -mt-4 mb-4">密碼錯誤，請重試</p>}
        <div className="p-6 grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleNum(num.toString())} className="h-16 rounded-xl bg-gray-50 font-black text-2xl text-gray-700 hover:bg-gray-200 active:scale-95 transition-all shadow-sm border border-gray-100">{num}</button>
          ))}
          <button onClick={handleDelete} className="h-16 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all"><Delete size={24}/></button>
          <button onClick={() => handleNum('0')} className="h-16 rounded-xl bg-gray-50 font-black text-2xl text-gray-700 hover:bg-gray-200 active:scale-95 transition-all shadow-sm border border-gray-100">0</button>
          <button onClick={handleEnter} className="h-16 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200">確認</button>
        </div>
      </div>
    </div>
  );
};

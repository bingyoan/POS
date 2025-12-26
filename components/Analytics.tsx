import React, { useState, useEffect } from 'react';
import { Order, Product } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateBusinessInsight } from '../services/geminiService';
import { Sparkles, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface AnalyticsProps {
  orders: Order[];
  products: Product[];
  onClose: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Analytics: React.FC<AnalyticsProps> = ({ orders, products, onClose }) => {
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalCost = orders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Prepare Chart Data
  const itemSalesMap: Record<string, number> = {};
  orders.forEach(o => {
    o.items.forEach(i => {
      itemSalesMap[i.productName] = (itemSalesMap[i.productName] || 0) + i.price;
    });
  });
  
  const barData = Object.entries(itemSalesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  const categorySalesMap = { 'Small Dish': 0, 'Smoked Shark': 0 };
  orders.forEach(o => {
    o.items.forEach(i => {
       const prod = products.find(p => p.id === i.productId);
       if (prod) {
           const cat = prod.category === 'Small Dish' ? 'Small Dish' : 'Smoked Shark';
           categorySalesMap[cat] += i.price;
       }
    });
  });

  const pieData = [
    { name: '小菜', value: categorySalesMap['Small Dish'] },
    { name: '鯊魚煙', value: categorySalesMap['Smoked Shark'] },
  ];

  const handleGetInsight = async () => {
    setLoadingInsight(true);
    const text = await generateBusinessInsight(orders, products);
    setInsight(text);
    setLoadingInsight(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="text-blue-600" />
            營收報表
          </h1>
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium">
            返回收銀台
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">總營收</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">總毛利 (預估)</p>
                <p className="text-2xl font-bold text-gray-900">${Math.round(totalProfit).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">毛利率</p>
                <p className="text-2xl font-bold text-gray-900">{profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
            <h3 className="text-lg font-bold text-gray-800 mb-4">熱銷商品排行 (金額)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
            <h3 className="text-lg font-bold text-gray-800 mb-4">類別銷售佔比</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gemini Insight Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-1">
          <div className="bg-white rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
                <Sparkles size={24} className="text-purple-500" />
                AI 智慧營運顧問
              </h3>
              <button 
                onClick={handleGetInsight}
                disabled={loadingInsight}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all
                  ${loadingInsight 
                    ? 'bg-gray-100 text-gray-400 cursor-wait' 
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
              >
                {loadingInsight ? '分析中...' : '生成分析報告'}
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 min-h-[150px] border border-gray-100">
              {insight ? (
                <div className="prose prose-indigo text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {insight}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <Sparkles size={32} className="opacity-20" />
                  <p>點擊按鈕，讓 AI 為您的生意提供專業建議</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

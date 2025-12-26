import { GoogleGenAI } from "@google/genai";
import { Order, Product } from "../types";

export const generateBusinessInsight = async (orders: Order[], products: Product[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not found. Unable to generate insights.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare data summary
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalProfit = orders.reduce((sum, o) => sum + o.totalProfit, 0);
  
  const itemSales: Record<string, { qty: number, revenue: number }> = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!itemSales[item.productName]) {
        itemSales[item.productName] = { qty: 0, revenue: 0 };
      }
      itemSales[item.productName].qty += 1;
      itemSales[item.productName].revenue += item.price;
    });
  });

  const summary = `
    Total Revenue: $${totalRevenue}
    Total Profit: $${totalProfit}
    Profit Margin: ${((totalProfit / totalRevenue) * 100).toFixed(1)}%
    Item Sales Breakdown: ${JSON.stringify(itemSales)}
    Product Costs (per 600g): ${JSON.stringify(products.map(p => ({ name: p.name, cost: p.costPer600g })))}
  `;

  const prompt = `
    You are an expert restaurant consultant for a Taiwanese street food stall selling Smoked Shark and Small Dishes.
    Analyze the following sales data and cost structure:
    ${summary}

    Please provide a concise, encouraging, and actionable daily report in Traditional Chinese (Taiwan).
    Include:
    1. A brief performance summary (Good/Average/Needs Improvement).
    2. Which items are the "Stars" (high profit/vol) vs "Dogs" (low profit/vol).
    3. One specific recommendation to improve profit margin tomorrow based on the cost data (e.g., promote X more because it has lower cost).
    
    Keep it friendly and under 200 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "無法產生分析報告。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "分析服務暫時無法使用。";
  }
};

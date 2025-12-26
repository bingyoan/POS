export enum Category {
  SMALL_DISH = 'Small Dish',
  SHARK_SMOKE = 'Smoked Shark'
}

// ✅ 修改這裡：新增 'WASTE' (報廢/損耗)
export type PaymentMethod = 'CASH' | 'LINE_PAY' | 'WASTE';

export interface Customer {
  name: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  costPer600g: number;
  defaultSellingPricePer600g: number;
  fixedPrices?: { label: string, price: number }[];
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  type: 'standard_box' | 'custom_weight' | 'combo_part';
  quantity: number;
  weightGrams?: number;
  price: number;
  cost: number;
  isCombo?: boolean;
  comboId?: string;
  modifiers?: string[];
}

export interface Order {
  id: string;
  timestamp: number;
  items: CartItem[];
  totalPrice: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  customer?: Customer;
  remarks?: string;
}

export interface SalesReport {
  totalRevenue: number;
  totalProfit: number;
  topSellingItem: string;
  lowMarginItem: string;
}

export interface InventoryRecord {
  opening: number; // 期初
  closing: number; // 期末
  waste: number;   // 損耗
}

export interface DailyClosingRecord {
  id?: number;
  date: string; // YYYY-MM-DD
  total_revenue: number;
  total_profit: number;
  total_cost: number;
  order_count: number;
  inventory_variance: number;
  note?: string;
  created_at?: string;
}

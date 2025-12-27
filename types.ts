export enum Category {
  SMALL_DISH = 'small_dish',
  SHARK_SMOKE = 'shark_smoke'
}

export type PaymentMethod = 'CASH' | 'LINE_PAY' | 'WASTE';

export interface FixedPriceOption {
  label: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  costPer600g: number;
  defaultSellingPricePer600g: number;
  fixedPrices?: FixedPriceOption[];
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  type: 'standard_box' | 'custom_weight';
  quantity: number;
  weightGrams?: number;
  price: number;
  cost: number;
  modifiers?: string[];
}

export interface Customer {
  name: string;
  phone: string;
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

// ✅ 新增：寄放訂單的格式
export interface HeldOrder {
  id: string;
  timestamp: number;
  items: CartItem[];
  customer: Customer;
  isPaid: boolean;
}

export interface InventoryRecord {
  opening: number; // 期初 (台斤 or 個)
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

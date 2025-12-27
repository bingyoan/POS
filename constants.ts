import { Category, Product } from './types';

export const PRODUCTS: Product[] = [
  // Small Dishes (涼拌小菜)
  { 
    id: 'sd_driedfish_orig', 
    name: '小魚干 (原味)', 
    category: Category.SMALL_DISH, 
    costPer600g: 235, 
    defaultSellingPricePer600g: 650,
    fixedPrices: [
      { label: '1 盒', price: 130 },
      { label: '2 盒 (特價)', price: 250 },
      { label: '1 袋', price: 180 },
      { label: '2 袋 (特價)', price: 350 }
    ]
  },
  { 
    id: 'sd_driedfish_spicy', 
    name: '小魚干 (辣味)', 
    category: Category.SMALL_DISH, 
    costPer600g: 235, 
    defaultSellingPricePer600g: 650,
    fixedPrices: [
      { label: '1 盒', price: 130 },
      { label: '2 盒 (特價)', price: 250 },
      { label: '1 袋', price: 180 },
      { label: '2 袋 (特價)', price: 350 }
    ]
  },
  { 
    id: 'sd_pomelo_radish', 
    name: '柚香蘿蔔', 
    category: Category.SMALL_DISH, 
    costPer600g: 145, 
    // ✅ 修正這裡：設定每斤售價 $300，這樣系統才知道一盒 $100 等於多少重量
    defaultSellingPricePer600g: 300, 
    fixedPrices: [
      { label: '1 盒', price: 100 }
    ]
  },
  { 
    id: 'sd_3eggs', 
    name: '三色蛋', 
    category: Category.SMALL_DISH, 
    // 技巧：因為是按「塊」賣，我們把 1 塊當作 1 單位(600g) 來算成本
    // 成本 70/塊 -> 設定 costPer600g = 70
    costPer600g: 70, 
    defaultSellingPricePer600g: 0, 
    fixedPrices: [
      { label: '1 塊', price: 150 }
    ]
  },
  { id: 'sd_jellyfish', name: '海蜇皮', category: Category.SMALL_DISH, costPer600g: 130, defaultSellingPricePer600g: 300 },
  { id: 'sd_pigscalp', name: '豬頭皮', category: Category.SMALL_DISH, costPer600g: 100, defaultSellingPricePer600g: 300 },
  { id: 'sd_pigliver', name: '麻油豬肝', category: Category.SMALL_DISH, costPer600g: 95, defaultSellingPricePer600g: 300 },
  { id: 'sd_peanuts', name: '蒜拌花生', category: Category.SMALL_DISH, costPer600g: 100, defaultSellingPricePer600g: 300 },
  { id: 'sd_chickenfeet', name: '豆瓣滷鳳爪', category: Category.SMALL_DISH, costPer600g: 100, defaultSellingPricePer600g: 300 },
  { id: 'sd_fishskin', name: '醋溜魚皮', category: Category.SMALL_DISH, costPer600g: 90, defaultSellingPricePer600g: 300 },

  // Smoked Shark (鯊魚煙)
  { 
    id: 'ss_combo_200', 
    name: '綜合鯊魚煙', 
    category: Category.SHARK_SMOKE, 
    costPer600g: 0, 
    defaultSellingPricePer600g: 0, 
    fixedPrices: [{ label: '固定', price: 200 }]
  },
  { id: 'ss_sharkskin', name: '鯊魚皮', category: Category.SHARK_SMOKE, costPer600g: 120, defaultSellingPricePer600g: 360 },
  { id: 'ss_sharkbelly', name: '鯊魚肚', category: Category.SHARK_SMOKE, costPer600g: 120, defaultSellingPricePer600g: 360 },
  { id: 'ss_finhead', name: '鯊魚翅頭', category: Category.SHARK_SMOKE, costPer600g: 250, defaultSellingPricePer600g: 550 },
  { id: 'ss_halftendon', name: '鯊魚半筋半肉', category: Category.SHARK_SMOKE, costPer600g: 100, defaultSellingPricePer600g: 360 },
  { id: 'ss_bellymeat', name: '鯊魚腹肉', category: Category.SHARK_SMOKE, costPer600g: 150, defaultSellingPricePer600g: 360 },
  { id: 'ss_roe', name: '紅甘魚卵', category: Category.SHARK_SMOKE, costPer600g: 400, defaultSellingPricePer600g: 700 },
];

export const PRICING_RULES = {
  smallDish: {
    standardBoxPrice: 100,
    minCustomPrice: 1,
  },
  shark: {
    standardBoxPrice: 100,
    minCustomPrice: 1,
  },
  combo: {
    price: 200,
    itemCount: 3,
    weightPerItemEst: 150,
  }
};

export const MODIFIERS = ['多薑絲', '不加醬', '加辣', '芥末多', '不要芥末'];

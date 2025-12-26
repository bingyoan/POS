
import { Category, Product } from './types';

export const PRODUCTS: Product[] = [
  // Small Dishes (涼拌小菜)
  { 
    id: 'sd_driedfish', 
    name: '小魚干', 
    category: Category.SMALL_DISH, 
    costPer600g: 235, 
    defaultSellingPricePer600g: 650,
    fixedPrices: [
      { label: '標準盒', price: 130 },
      { label: '特惠包', price: 180 }
    ]
  },
  { id: 'sd_jellyfish', name: '海蜇皮', category: Category.SMALL_DISH, costPer600g: 130, defaultSellingPricePer600g: 300 },
  { id: 'sd_pigscalp', name: '豬頭皮', category: Category.SMALL_DISH, costPer600g: 100, defaultSellingPricePer600g: 300 },
  { id: 'sd_pigliver', name: '麻油豬肝', category: Category.SMALL_DISH, costPer600g: 80, defaultSellingPricePer600g: 300 },
  { id: 'sd_peanuts', name: '蒜拌花生', category: Category.SMALL_DISH, costPer600g: 100, defaultSellingPricePer600g: 300 },
  { id: 'sd_chickenfeet', name: '豆瓣滷鳳爪', category: Category.SMALL_DISH, costPer600g: 90, defaultSellingPricePer600g: 300 },
  { id: 'sd_fishskin', name: '醋溜魚皮', category: Category.SMALL_DISH, costPer600g: 90, defaultSellingPricePer600g: 300 },

  // Smoked Shark (鯊魚煙)
  { 
    id: 'ss_combo_200', 
    name: '綜合鯊魚煙', 
    category: Category.SHARK_SMOKE, 
    costPer600g: 0, // Calculated dynamically
    defaultSellingPricePer600g: 0, // Fixed price item
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
    minCustomPrice: 50,
  },
  shark: {
    standardBoxPrice: 100,
    minCustomPrice: 100,
  },
  combo: {
    price: 200,
    itemCount: 3,
    weightPerItemEst: 150,
  }
};

export const MODIFIERS = ['多薑絲', '不加醬', '加辣', '芥末多'];

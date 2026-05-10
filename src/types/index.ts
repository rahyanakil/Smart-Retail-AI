export type Role = 'ADMIN' | 'OWNER' | 'CASHIER';
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'DIGITAL_WALLET';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  storeId: string | null;
  isActive: boolean;
  createdAt: string;
  store?: Store | null;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StoreWithCounts extends Store {
  _count: {
    users: number;
    products: number;
    sales: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAlert: number;
  sku: string;
  barcode?: string;
  category?: string;
  imageUrl?: string;
  isActive: boolean;
  storeId: string;
  store?: Store;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'sku'>;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  cashierId: string;
  cashier: Pick<User, 'id' | 'name'>;
  storeId: string;
  store: Pick<Store, 'id' | 'name'>;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthPercent: number;
  };
  sales: {
    today: number;
    todayRevenue: number;
    thisMonth: number;
    lastMonth: number;
  };
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    lowStockItems: Array<Pick<Product, 'id' | 'name' | 'sku' | 'stock' | 'lowStockAlert'>>;
  };
  users?: number;
  stores?: number;
  recentSales: Sale[];
}

export interface InvoiceItem {
  productId: string;
  name: string;
  sku: string;
  category?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  receiptNumber: string;
  date: string;
  cashier: { id: string; name: string; email: string };
  store: { id: string; name: string; address?: string | null; phone?: string | null };
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  status: SaleStatus;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  maxStock: number;
  category?: string | null;
}

export interface InventoryStats {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
  retailValue: number;
  potentialProfit: number;
  categoriesCount: number;
  categories: { name: string; count: number }[];
}

export interface StockLog {
  id: string;
  productId: string;
  userId: string;
  user: { id: string; name: string };
  adjustmentType: 'ADD' | 'REMOVE' | 'SET';
  quantityBefore: number;
  quantityAfter: number;
  reason?: string | null;
  createdAt: string;
}

export interface CategoryStat {
  name: string;
  count: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  count: number;
}

export interface TopProduct {
  product: Pick<Product, 'id' | 'name' | 'sku' | 'category' | 'price'> | undefined;
  totalQuantity: number;
  totalRevenue: number;
}

// ── AI Types ──────────────────────────────────────────────────────────────────

export interface SalesForecast {
  period: string;
  predictedRevenue: { min: number; max: number; expected: number };
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  weeklyBreakdown: Array<{
    week: string;
    expectedRevenue: number;
    confidence: 'high' | 'medium' | 'low';
  }>;
  keyFactors: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface BusinessInsight {
  category: 'revenue' | 'inventory' | 'operations' | 'growth';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
}

export interface BusinessInsights {
  healthScore: number;
  healthLabel: string;
  summary: string;
  insights: BusinessInsight[];
  opportunities: string[];
  risks: string[];
  generatedAt: string;
}

export interface RestockItem {
  productId: string;
  name: string;
  sku: string;
  currentStock: number;
  recommendedReorderQty: number;
  estimatedDaysLeft: number;
  urgency: 'critical' | 'high' | 'medium';
  reason: string;
  estimatedCost: number;
}

export interface RestockRecommendations {
  summary: string;
  totalAtRisk: number;
  criticalCount: number;
  highCount: number;
  items: RestockItem[];
  totalInvestmentEstimate: number;
  generatedAt: string;
}

export interface CustomerBehavior {
  peakHours: Array<{ hour: string; label: string; orderCount: number; revenueShare: number }>;
  peakDays: Array<{ day: string; orderCount: number; revenueShare: number }>;
  averageBasketSize: number;
  averageTransactionValue: number;
  paymentMethodSplit: Record<string, number>;
  topCategories: Array<{ category: string; orderCount: number; revenueShare: number }>;
  insights: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface AiStatus {
  configured: boolean;
  model: string;
  provider: string;
}

// ── Chat / Copilot ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  error?: boolean;
  timestamp: Date;
}

export interface Permission { code: string; description?: string }
export interface User {
  id: string; email: string; full_name: string; is_active: boolean;
  role: { id: number; name: string; permissions: Permission[] };
}
export interface TokenPair { access_token: string; refresh_token: string; token_type: string; user: User }
export interface Page<T> { items: T[]; total: number; page: number; size: number; pages: number }
export interface Category { id: number; name: string; description?: string }
export interface Supplier { id: number; name: string; email?: string; phone?: string; address?: string; tax_id?: string }
export interface Product {
  id: number; sku: string; barcode?: string; name: string; description?: string;
  category_id: number; supplier_id?: number; category: Category; supplier?: Supplier;
  price: string; cost: string; quantity: number; minimum_stock: number;
  maximum_stock?: number; image_url?: string; expiry_date?: string; created_at: string; updated_at: string;
}
export interface Transaction {
  id: number; product_id: number; transaction_type: string; quantity: number;
  quantity_before: number; quantity_after: number; notes?: string; created_at: string;
}
export interface Dashboard {
  total_products: number; low_stock: number; out_of_stock: number; today_sales: number;
  today_revenue: string; monthly_revenue: string; inventory_value: string;
  revenue_chart: { date: string; revenue: number }[];
  top_products: { name: string; quantity: number }[];
  recent_transactions: Transaction[];
}


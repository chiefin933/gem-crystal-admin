const API_BASE = '/api';
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthHeader(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(typeof err.error === 'string' ? err.error : err.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ──────── Admin Auth ───────────────────────────────────────────────────────

export async function loginAdmin(email: string, password: string) {
  return apiRequest<{
    token: string;
    admin: { id: string; email: string; name: string; role: 'OWNER' | 'CASHIER' };
  }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchAdminMe() {
  return apiRequest<{ id: string; email: string; name: string; role: 'OWNER' | 'CASHIER' }>('/admin/me');
}

export async function fetchAdminStats() {
  return apiRequest<{
    totalProducts: number; totalOrders: number; totalRevenue: number;
    ecomRevenue: number; posRevenue: number; pendingOrders: number;
    avgOrderValue: number; activeCoupons: number;
    mpesaRevenue: number; cashRevenue: number; cardRevenue: number;
    ecomMpesaRevenue: number; posMpesaRevenue: number; posCashRevenue: number;
    salesByDay: Array<{ date: string; revenue: number }>;
    salesPeriods: {
      timeZone: string;
      generatedAt: string;
      periods: Array<{
        key: 'today' | 'yesterday' | 'last7Days' | 'last30Days';
        label: string;
        description: string;
        revenue: number;
        transactions: number;
      }>;
    };
    topProducts: Array<{ title: string; units: number; revenue: number }>;
    slowProducts: Array<{ title: string; units: number; revenue: number }>;
    lowStockVariants: Array<{
      variantId: string; sku: string; size: string; color: string;
      stockQuantity: number; productTitle: string; productCategory: string;
    }>;
  }>('/admin/stats');
}

// ──────── Products ─────────────────────────────────────────────────────────

export interface ProductPayload {
  title: string;
  gender: 'women' | 'men' | 'unisex';
  category: string;
  price: number;
  salePrice?: number;
  description: string;
  fabricCare?: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  stockPerVariant?: number;
}

export async function fetchProducts(filters?: any) {
  const params = new URLSearchParams();
  if (filters?.gender && filters.gender !== 'all') params.set('gender', filters.gender);
  if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  return apiRequest<any[]>(`/products${qs ? '?' + qs : ''}`);
}

export async function createProduct(payload: ProductPayload) {
  return apiRequest<any>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>) {
  return apiRequest<any>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string) {
  return apiRequest<{ success: boolean }>(`/products/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadProductImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));

  const res = await fetch(`${API_BASE}/upload/images`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(typeof err.error === 'string' ? err.error : err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.urls;
}

export async function adjustVariantStock(variantId: string, delta: number, reason: string) {
  return apiRequest<{ success: boolean; data: { id: string; stockQuantity: number } }>(`/products/variant/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ variantId, delta, reason }),
  });
}

// ──────── Audit Logs ───────────────────────────────────────────────────────

export async function fetchAuditLogs(page = 1, limit = 50, category = 'ALL') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), category });
  return apiRequest<{
    data: Array<{
      id: string;
      actor: string;
      action: string;
      details: string;
      ipAddress: string | null;
      createdAt: string;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/pos/audit-logs?${params}`);
}

// ──────── Orders ───────────────────────────────────────────────────────────

export async function fetchOrders(page = 1, limit = 50) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiRequest<{
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/orders?${params}`);
}

export async function updateOrderStatus(orderId: string, payload: {
  fulfillmentStatus?: string;
  mpesaReceipt?: string;
}) {
  return apiRequest<any>(`/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ──────── Coupons ──────────────────────────────────────────────────────────

export async function fetchCoupons() {
  return apiRequest<any[]>('/coupons');
}

export async function createCoupon(payload: {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
  expiryDate: string;
  usageLimit?: number;
}) {
  return apiRequest<any>('/coupons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleCoupon(code: string) {
  return apiRequest<any>(`/coupons/${code}/toggle`, {
    method: 'PATCH',
  });
}

export async function deleteCoupon(code: string) {
  return apiRequest<{ success: boolean }>(`/coupons/${code}`, {
    method: 'DELETE',
  });
}

// ──────── Unmatched Payments ───────────────────────────────────────────────

export async function fetchUnmatchedPayments() {
  return apiRequest<{
    data: Array<{
      id: string;
      mpesaReceipt: string;
      amount: number;
      phone: string;
      payerName: string | null;
      receivedAt: string;
      status: string;
      resolutionNote: string | null;
      resolvedAt: string | null;
      resolvedBy: string | null;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/orders/unmatched-payments');
}

export async function resolveUnmatchedPayment(
  id: string,
  action: 'ASSIGNED' | 'IGNORED',
  note: string,
  targetType?: 'ORDER' | 'POS_SALE',
  targetRef?: string,
) {
  return apiRequest<{ success: boolean }>(`/orders/unmatched-payments/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action, note, targetType, targetRef }),
  });
}

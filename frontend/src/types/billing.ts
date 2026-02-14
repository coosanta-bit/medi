export interface ProductRead {
  id: string;
  type: string;
  name: string;
  price: number;
  currency: string;
  config_json: Record<string, unknown> | null;
  active: boolean;
}

export interface ProductListResponse {
  items: ProductRead[];
}

export interface OrderRead {
  id: string;
  company_id: string;
  product_id: string;
  product_name: string | null;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  items: OrderRead[];
  total: number;
}

export interface PaymentRead {
  id: string;
  order_id: string;
  pg: string | null;
  pg_tid: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export interface PaymentListResponse {
  items: PaymentRead[];
  total: number;
}

export interface EntitlementRead {
  id: string;
  company_id: string;
  type: string;
  balance: number;
  start_at: string | null;
  end_at: string | null;
  order_id: string | null;
  created_at: string;
}

export interface EntitlementListResponse {
  items: EntitlementRead[];
}

export interface InvoiceRead {
  id: string;
  company_id: string;
  order_id: string;
  status: string;
  requested_at: string;
  issued_at: string | null;
  created_at: string;
}

export interface InvoiceListResponse {
  items: InvoiceRead[];
  total: number;
}

"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Package,
  Receipt,
  Zap,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import {
  getLabel,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PRODUCT_TYPES,
} from "@/lib/constants";
import type {
  ProductRead,
  ProductListResponse,
  OrderRead,
  OrderListResponse,
  PaymentRead,
  PaymentListResponse,
  EntitlementRead,
  EntitlementListResponse,
  InvoiceRead,
} from "@/types/billing";

export default function BillingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">결제 / 상품</h1>

      <Tabs defaultValue="products">
        <TabsList className="mb-4">
          <TabsTrigger value="products">상품</TabsTrigger>
          <TabsTrigger value="orders">주문 내역</TabsTrigger>
          <TabsTrigger value="payments">결제 내역</TabsTrigger>
          <TabsTrigger value="entitlements">보유 혜택</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>
        <TabsContent value="entitlements">
          <EntitlementsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Products Tab ---

function ProductsTab() {
  const [products, setProducts] = useState<ProductRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRead | null>(
    null
  );
  const [orderResult, setOrderResult] = useState<OrderRead | null>(null);

  useEffect(() => {
    api
      .get<ProductListResponse>("/billing/products")
      .then((data) => setProducts(data.items))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = (product: ProductRead) => {
    setSelectedProduct(product);
    setOrderResult(null);
    setShowConfirm(true);
  };

  const confirmPurchase = async () => {
    if (!selectedProduct) return;
    setPurchasing(selectedProduct.id);
    try {
      const order = await api.post<OrderRead>("/billing/orders", {
        product_id: selectedProduct.id,
      });
      setOrderResult(order);
    } catch (err) {
      alert(err instanceof Error ? err.message : "주문 생성에 실패했습니다");
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-[180px] rounded-lg border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {products.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {p.type === "BOOST" ? (
                      <Zap className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-blue-500" />
                    )}
                    {p.name}
                  </CardTitle>
                  <Badge variant="outline">
                    {getLabel(PRODUCT_TYPES, p.type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-1">
                  {p.price.toLocaleString()}원
                </p>
                {p.config_json && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {p.type === "BOOST" &&
                      `${p.config_json.days || 7}일간 상단 노출`}
                    {p.type === "CREDIT" &&
                      `인재 열람권 ${p.config_json.credits || 10}회`}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={() => handlePurchase(p)}
                  disabled={purchasing === p.id}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {purchasing === p.id ? "처리 중..." : "구매하기"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">
            등록된 상품이 없습니다
          </p>
        </div>
      )}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {orderResult ? "주문 완료" : "구매 확인"}
            </DialogTitle>
          </DialogHeader>
          {orderResult ? (
            <div className="space-y-3">
              <p className="text-sm">주문이 생성되었습니다.</p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">주문번호</span>
                  <span className="font-mono text-xs">
                    {orderResult.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">금액</span>
                  <span>{orderResult.amount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상태</span>
                  <Badge variant="secondary">
                    {getLabel(ORDER_STATUSES, orderResult.status)}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                * MVP에서는 PG 결제창 대신 웹훅으로 결제가 확정됩니다.
              </p>
              <Button
                className="w-full"
                onClick={() => setShowConfirm(false)}
              >
                확인
              </Button>
            </div>
          ) : selectedProduct ? (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상품</span>
                  <span className="font-medium">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">금액</span>
                  <span className="font-bold">
                    {selectedProduct.price.toLocaleString()}원
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1"
                  onClick={confirmPurchase}
                  disabled={!!purchasing}
                >
                  {purchasing ? "처리 중..." : "주문하기"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Orders Tab ---

function OrdersTab() {
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<OrderListResponse>("/billing/orders")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestInvoice = async (orderId: string) => {
    try {
      await api.post<InvoiceRead>("/billing/invoices/request", {
        order_id: orderId,
      });
      alert("세금계산서 발행이 요청되었습니다");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "세금계산서 요청에 실패했습니다"
      );
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        총 {data?.total || 0}건
      </p>

      {data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {order.product_name || "상품"}
                    </p>
                    <Badge
                      variant={
                        order.status === "PAID"
                          ? "default"
                          : order.status === "CREATED"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {getLabel(ORDER_STATUSES, order.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.amount.toLocaleString()}원 ·{" "}
                    {new Date(order.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                {order.status === "PAID" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestInvoice(order.id)}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    세금계산서
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="주문 내역이 없습니다" />
      )}
    </div>
  );
}

// --- Payments Tab ---

function PaymentsTab() {
  const [data, setData] = useState<PaymentListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PaymentListResponse>("/billing/payments")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        총 {data?.total || 0}건
      </p>

      {data && data.items.length > 0 ? (
        <div className="space-y-2">
          {data.items.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center gap-4">
                <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        p.status === "PAID"
                          ? "default"
                          : p.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {getLabel(PAYMENT_STATUSES, p.status)}
                    </Badge>
                    {p.pg && (
                      <span className="text-xs text-muted-foreground">
                        {p.pg}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.pg_tid && `TID: ${p.pg_tid} · `}
                    {new Date(p.created_at).toLocaleDateString("ko-KR")}
                    {p.paid_at &&
                      ` · 결제: ${new Date(p.paid_at).toLocaleDateString("ko-KR")}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="결제 내역이 없습니다" />
      )}
    </div>
  );
}

// --- Entitlements Tab ---

function EntitlementsTab() {
  const [data, setData] = useState<EntitlementListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<EntitlementListResponse>("/billing/entitlements")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const items = data?.items || [];

  return (
    <div>
      {items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((e) => {
            const isExpired = e.end_at && new Date(e.end_at) < new Date();
            return (
              <Card
                key={e.id}
                className={isExpired ? "opacity-60" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {e.type === "BOOST" ? (
                        <Zap className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-blue-500" />
                      )}
                      <span className="font-medium">
                        {getLabel(PRODUCT_TYPES, e.type)}
                      </span>
                    </div>
                    {isExpired && (
                      <Badge variant="secondary" className="text-xs">
                        만료
                      </Badge>
                    )}
                  </div>

                  {e.type === "CREDIT" && (
                    <p className="text-2xl font-bold">
                      {e.balance.toLocaleString()}
                      <span className="text-sm text-muted-foreground ml-1">
                        회 남음
                      </span>
                    </p>
                  )}

                  {e.type === "BOOST" && (
                    <div className="text-sm">
                      {e.start_at && (
                        <p>
                          시작:{" "}
                          {new Date(e.start_at).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                      {e.end_at && (
                        <p>
                          종료:{" "}
                          {new Date(e.end_at).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState message="보유 혜택이 없습니다" />
      )}
    </div>
  );
}

// --- Shared ---

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] rounded-lg border bg-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

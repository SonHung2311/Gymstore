import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/orders";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import type { Order, OrderItem } from "../../types";

// ── Constants ─────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ["pending", "confirmed", "shipping", "delivered", "cancelled"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  pending_verification: "Chờ xác nhận TT",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  pending_verification: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  refunded: "bg-gray-100 text-gray-600",
};

const FLOW_STEPS: OrderStatus[] = ["pending", "confirmed", "shipping", "delivered"];

// ── Order Detail Drawer ───────────────────────────────────────────────────────

function OrderDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient();
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [statusError, setStatusError] = useState("");

  // Sync local payment status when the live order prop updates
  useEffect(() => {
    setPaymentStatus(order.payment_status);
  }, [order.payment_status]);

  const statusMutation = useMutation({
    mutationFn: (status: string) => adminApi.updateOrderStatus(order.id, status),
    onSuccess: () => {
      setStatusError("");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: () => setStatusError("Cập nhật thất bại, vui lòng thử lại."),
  });

  const paymentMutation = useMutation({
    mutationFn: (status: string) => adminApi.updatePaymentStatus(order.id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  const addr = order.shipping_address;
  const currentStepIdx = FLOW_STEPS.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-light sticky top-0 bg-white z-10">
          <div>
            <p className="font-bold text-lg text-dark tracking-wider">{order.display_id}</p>
            <p className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleDateString("vi-VN", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-dark p-1 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">

          {/* Recipient info */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Người nhận</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="font-medium">{addr.name}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{addr.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span className="text-gray-600">{addr.address}, {addr.city}</span>
              </div>
              {order.note && (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                  <span className="text-gray-500 italic">"{order.note}"</span>
                </div>
              )}
            </div>
          </section>

          {/* Items */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sản phẩm</p>
            <div className="space-y-3">
              {order.items.map((item: OrderItem) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface shrink-0">
                    {item.product.images[0] ? (
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-light" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.unit_price.toLocaleString("vi-VN")}₫ × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-primary shrink-0">
                    {item.subtotal.toLocaleString("vi-VN")}₫
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-light mt-3 pt-3 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Tổng cộng</span>
              <span className="text-base font-bold text-primary">
                {order.total_amount.toLocaleString("vi-VN")}₫
              </span>
            </div>
          </section>

          {/* Order status stepper */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Trạng thái đơn</p>
            {isCancelled ? (
              <div className="flex items-center gap-2 py-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-sm font-medium text-red-600">Đơn hàng đã hủy</span>
              </div>
            ) : (
              <div className="relative">
                {/* Progress line */}
                <div className="absolute top-3.5 left-3.5 right-3.5 h-0.5 bg-light z-0" />
                <div
                  className="absolute top-3.5 left-3.5 h-0.5 bg-primary z-0 transition-all"
                  style={{ width: `${(currentStepIdx / (FLOW_STEPS.length - 1)) * 100}%` }}
                />
                <div className="relative z-10 flex justify-between">
                  {FLOW_STEPS.map((step, idx) => {
                    const isDone = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const isNext = idx === currentStepIdx + 1;
                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5 w-16">
                        <button
                          type="button"
                          disabled={statusMutation.isPending || (!isNext && !isCurrent)}
                          onClick={() => isNext && statusMutation.mutate(step)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all
                            ${isDone ? "bg-primary border-primary" : ""}
                            ${isCurrent ? "bg-white border-primary ring-2 ring-primary/30" : ""}
                            ${isNext ? "bg-white border-light hover:border-primary cursor-pointer" : ""}
                            ${!isDone && !isCurrent && !isNext ? "bg-white border-light cursor-default" : ""}
                          `}
                        >
                          {isDone ? (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          ) : isCurrent ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          ) : null}
                        </button>
                        <span className={`text-xs text-center leading-tight ${isCurrent ? "text-primary font-semibold" : isDone ? "text-primary" : "text-gray-400"}`}>
                          {ORDER_STATUS_LABELS[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cancel button */}
            {(order.status === "pending" || order.status === "confirmed") && (
              <button
                onClick={() => { setStatusError(""); statusMutation.mutate("cancelled"); }}
                disabled={statusMutation.isPending}
                className="mt-4 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {statusMutation.isPending ? "Đang hủy..." : "Hủy đơn hàng"}
              </button>
            )}

            {/* Status error feedback */}
            {statusError && (
              <p className="mt-2 text-xs text-red-500">{statusError}</p>
            )}
          </section>

          {/* Payment */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Thanh toán</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Phương thức</span>
                <span className="font-medium">
                  {order.payment_method === "bank_transfer" ? "Chuyển khoản" : "COD (tiền mặt)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="input flex-1 text-sm"
                >
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="pending_verification">Chờ xác nhận TT</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="refunded">Đã hoàn tiền</option>
                </select>
                <button
                  onClick={() => paymentMutation.mutate(paymentStatus)}
                  disabled={paymentStatus === order.payment_status || paymentMutation.isPending}
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-40 shrink-0"
                >
                  {paymentMutation.isPending ? "..." : "Lưu"}
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type FilterMode = "order" | "payment";

export default function AdminOrders() {
  const qc = useQueryClient();
  const [filterMode, setFilterMode] = useState<FilterMode>("order");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin", "orders", statusFilter, paymentFilter],
    queryFn: () =>
      adminApi.listOrders({
        status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
      }).then((r) => r.data),
  });

  // Always pass the freshest order data to the drawer (so stepper/status updates immediately)
  const liveOrder = selectedOrder
    ? ((orders as Order[] | undefined)?.find((o) => o.id === selectedOrder.id) ?? selectedOrder)
    : null;

  const confirmPaymentMutation = useMutation({
    mutationFn: (id: string) => adminApi.updatePaymentStatus(id, "paid"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Quản lý đơn hàng</h1>

        {/* Filter mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => { setFilterMode("order"); setPaymentFilter(""); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterMode === "order" ? "bg-dark text-white" : "bg-white border border-light text-dark hover:bg-surface"
            }`}
          >
            Lọc theo trạng thái đơn
          </button>
          <button
            onClick={() => { setFilterMode("payment"); setStatusFilter(""); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterMode === "payment" ? "bg-dark text-white" : "bg-white border border-light text-dark hover:bg-surface"
            }`}
          >
            Lọc theo thanh toán
          </button>
        </div>

        {/* Filter tabs */}
        {filterMode === "order" ? (
          <div className="flex gap-2 flex-wrap">
            {(["", ...ORDER_STATUSES] as string[]).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === s ? "bg-primary text-white" : "bg-white border border-light text-dark hover:bg-surface"
                }`}>
                {s === "" ? "Tất cả" : ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {(["", "unpaid", "pending_verification", "paid", "refunded"] as string[]).map((s) => (
              <button key={s} onClick={() => setPaymentFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  paymentFilter === s ? "bg-primary text-white" : "bg-white border border-light text-dark hover:bg-surface"
                }`}>
                {s === "" ? "Tất cả" : PAYMENT_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-light/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Mã đơn</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Người nhận</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Ngày đặt</th>
                  <th className="text-right px-4 py-3 font-semibold">Tổng tiền</th>
                  <th className="text-center px-4 py-3 font-semibold hidden sm:table-cell">Thanh toán</th>
                  <th className="text-center px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {(orders as Order[] | undefined)?.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="border-t border-light hover:bg-surface/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-bold tracking-wider text-dark">
                      {order.display_id}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="font-medium text-sm">{order.shipping_address.name}</p>
                      <p className="text-xs text-gray-400">{order.shipping_address.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {order.total_amount.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-400">
                          {order.payment_method === "bank_transfer" ? "Chuyển khoản" : "COD"}
                        </span>
                        <span className={`badge text-xs ${PAYMENT_STATUS_COLORS[order.payment_status] ?? "bg-gray-100 text-gray-600"}`}>
                          {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge value={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-secondary hover:text-primary text-xs font-medium"
                        >
                          Chi tiết
                        </button>
                        {order.payment_method === "bank_transfer" &&
                          order.payment_status === "pending_verification" && (
                          <button
                            onClick={() => confirmPaymentMutation.mutate(order.id)}
                            disabled={confirmPaymentMutation.isPending}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            ✓ Nhận tiền
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(orders as Order[] | undefined)?.length === 0 && (
              <p className="text-center text-gray-400 py-8">Không có đơn hàng nào</p>
            )}
          </div>
        )}
      </div>

      {liveOrder && (
        <OrderDrawer
          order={liveOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}

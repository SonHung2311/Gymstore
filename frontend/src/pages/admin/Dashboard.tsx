import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/orders";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import type { Order, RevenueEntry, TopProduct } from "../../types";

// ── Mini bar chart ────────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: RevenueEntry[] }) {
  const last7 = [...data].slice(0, 7).reverse();
  const maxRev = Math.max(...last7.map((r) => r.revenue), 1);
  const W = 300;
  const H = 80;
  const barW = 28;
  const gap = (W - barW * last7.length) / (last7.length + 1);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" style={{ maxHeight: 120 }}>
        {last7.map((r, i) => {
          const barH = Math.max((r.revenue / maxRev) * H, 2);
          const x = gap + i * (barW + gap);
          const y = H - barH;
          const label = r.date.slice(5); // MM-DD
          return (
            <g key={r.date}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={4}
                className="fill-primary opacity-80 hover:opacity-100 transition-opacity"
              >
                <title>{r.date}: {r.revenue.toLocaleString("vi-VN")}₫ · {r.orders} đơn</title>
              </rect>
              <text
                x={x + barW / 2} y={H + 16}
                textAnchor="middle"
                fontSize={9}
                className="fill-gray-400"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, accent, to,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
  to?: string;
}) {
  const inner = (
    <div className={`card p-5 flex items-start gap-4 transition-shadow ${to ? "hover:shadow-md cursor-pointer" : ""}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-primary text-white" : "bg-light text-primary"}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className={`text-2xl font-bold truncate ${accent ? "text-primary" : "text-dark"}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {to && (
        <svg className="w-4 h-4 text-gray-300 shrink-0 ml-auto mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
        </svg>
      )}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Chưa TT",
  pending_verification: "Chờ xác nhận TT",
  paid: "Đã TT",
  refunded: "Đã hoàn",
};
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  pending_verification: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  refunded: "bg-gray-100 text-gray-600",
};

export default function Dashboard() {
  const qc = useQueryClient();

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => adminApi.revenue().then((r) => r.data as RevenueEntry[]),
  });

  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ["admin", "top-products"],
    queryFn: () => adminApi.topProducts().then((r) => r.data as TopProduct[]),
  });

  const { data: orders } = useQuery({
    queryKey: ["admin", "orders-dashboard"],
    queryFn: () => adminApi.listOrders().then((r) => r.data as Order[]),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "orders-dashboard"] });
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  const confirmOrderMutation = useMutation({
    mutationFn: (id: string) => adminApi.updateOrderStatus(id, "confirmed"),
    onSuccess: invalidate,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (id: string) => adminApi.updatePaymentStatus(id, "paid"),
    onSuccess: invalidate,
  });

  // ── Derived data
  const totalRevenue = revenue?.reduce((s, r) => s + r.revenue, 0) ?? 0;
  const totalOrders = revenue?.reduce((s, r) => s + r.orders, 0) ?? 0;

  const pendingCount = orders?.filter((o) => o.status === "pending").length ?? 0;
  const pendingPaymentCount = orders?.filter((o) => o.payment_status === "pending_verification").length ?? 0;

  const actionItems = orders?.filter(
    (o) => o.status === "pending" || o.payment_status === "pending_verification"
  ) ?? [];

  const recentOrders = orders?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Doanh thu (30 ngày)"
          value={totalRevenue.toLocaleString("vi-VN") + "₫"}
          accent
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          }
        />
        <KpiCard
          label="Đơn hàng (30 ngày)"
          value={totalOrders}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          }
        />
        <KpiCard
          label="Chờ xác nhận"
          value={pendingCount}
          sub={pendingCount > 0 ? "đơn cần duyệt →" : "Không có đơn"}
          to="/admin/orders"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <KpiCard
          label="Chờ nhận tiền"
          value={pendingPaymentCount}
          sub={pendingPaymentCount > 0 ? "chuyển khoản cần duyệt →" : "Không có"}
          to="/admin/orders"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
          }
        />
      </div>

      {/* ── Cần xử lý ngay ── */}
      {actionItems.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-light bg-yellow-50/50">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <h2 className="font-semibold text-sm text-yellow-800">Cần xử lý ngay</h2>
            <span className="ml-auto bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {actionItems.length}
            </span>
          </div>
          <div className="divide-y divide-light">
            {actionItems.map((order) => (
              <div key={order.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-dark tracking-wider">{order.display_id}</span>
                    <span className="text-gray-400 text-xs">·</span>
                    <span className="text-sm text-gray-600">{order.shipping_address.name}</span>
                    <span className="text-sm font-semibold text-primary">{order.total_amount.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge value={order.status} />
                    <span className={`badge text-xs ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                      {order.payment_method === "bank_transfer" ? "CK" : "COD"} · {PAYMENT_STATUS_LABELS[order.payment_status]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {order.status === "pending" && (
                    <button
                      onClick={() => confirmOrderMutation.mutate(order.id)}
                      disabled={confirmOrderMutation.isPending}
                      className="text-xs bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      ✓ Xác nhận
                    </button>
                  )}
                  {order.payment_status === "pending_verification" && (
                    <button
                      onClick={() => confirmPaymentMutation.mutate(order.id)}
                      disabled={confirmPaymentMutation.isPending}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      ✓ Nhận tiền
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts + Top products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="card p-5">
          <h2 className="text-base font-semibold mb-4">Doanh thu 7 ngày gần nhất</h2>
          {revLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : revenue && revenue.length > 0 ? (
            <>
              <RevenueChart data={revenue} />
              <div className="mt-4 divide-y divide-light/50">
                {revenue.slice(0, 7).map((r) => (
                  <div key={r.date} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-500">{r.date}</span>
                    <span className="text-gray-400">{r.orders} đơn</span>
                    <span className="font-medium text-primary">{r.revenue.toLocaleString("vi-VN")}₫</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu doanh thu</p>
          )}
        </div>

        {/* Top products */}
        <div className="card p-5">
          <h2 className="text-base font-semibold mb-4">Sản phẩm bán chạy nhất</h2>
          {topLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxSold = topProducts[0].sold;
                const pct = Math.round((p.sold / maxSold) * 100);
                return (
                  <div key={p.product_id}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-5 h-5 rounded-full bg-light text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{p.sold} SP</span>
                      <span className="text-sm font-semibold text-primary shrink-0">{p.revenue.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="ml-8 h-1.5 rounded-full bg-light overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* ── Recent orders ── */}
      {recentOrders.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-light">
            <h2 className="text-base font-semibold">Đơn hàng gần nhất</h2>
            <Link to="/admin/orders" className="text-xs text-secondary hover:text-primary font-medium">
              Xem tất cả →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-light/30">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Mã đơn</th>
                <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs hidden sm:table-cell">Người nhận</th>
                <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs hidden md:table-cell">Ngày đặt</th>
                <th className="text-right px-5 py-2.5 font-medium text-gray-500 text-xs">Tổng</th>
                <th className="text-center px-5 py-2.5 font-medium text-gray-500 text-xs hidden sm:table-cell">Thanh toán</th>
                <th className="text-center px-5 py-2.5 font-medium text-gray-500 text-xs">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-light hover:bg-surface/40 transition-colors">
                  <td className="px-5 py-3 font-bold tracking-wider text-dark text-sm">{order.display_id}</td>
                  <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">{order.shipping_address.name}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {new Date(order.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-primary">
                    {order.total_amount.toLocaleString("vi-VN")}₫
                  </td>
                  <td className="px-5 py-3 text-center hidden sm:table-cell">
                    <span className={`badge text-xs ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                      {PAYMENT_STATUS_LABELS[order.payment_status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Badge value={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

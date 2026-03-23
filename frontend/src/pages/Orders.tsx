import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ordersApi } from "../api/orders";
import { useAuthStore } from "../store/authStore";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";

export default function Orders() {
  const { user } = useAuthStore();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.list().then((r) => r.data),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="text-lg text-gray-500 mb-4">Bạn cần đăng nhập để xem đơn hàng</p>
        <Link to="/login" className="btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-semibold mb-8">Lịch sử đơn hàng</h1>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg text-gray-500 mb-6">Bạn chưa có đơn hàng nào</p>
          <Link to="/store" className="btn-primary">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/store/orders/${order.id}`} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div>
                <p className="font-bold tracking-wider text-dark mb-0.5">{order.display_id}</p>
                <p className="text-sm text-gray-400">
                  {new Date(order.created_at).toLocaleDateString("vi-VN")} • {order.items.length} sản phẩm
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-primary">
                  {order.total_amount.toLocaleString("vi-VN")}₫
                </span>
                <Badge value={order.status} />
                <Badge value={order.payment_status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

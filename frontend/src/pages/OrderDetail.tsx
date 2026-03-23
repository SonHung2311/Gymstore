import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ordersApi } from "../api/orders";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";

const PLACEHOLDER = "https://placehold.co/64x64/DEB887/8B4513?text=Gym";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid:               "Chưa thanh toán",
  pending_verification: "Đang xác nhận",
  paid:                 "Đã thanh toán",
  refunded:             "Đã hoàn tiền",
};
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid:               "bg-red-100 text-red-700",
  pending_verification: "bg-yellow-100 text-yellow-700",
  paid:                 "bg-green-100 text-green-700",
  refunded:             "bg-gray-100 text-gray-600",
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const justPaid = searchParams.get("paid") === "1";

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (!order) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 mb-4">Không tìm thấy đơn hàng</p>
        <Link to="/store/orders" className="btn-primary">← Danh sách đơn hàng</Link>
      </div>
    );
  }

  const addr = order.shipping_address as { name: string; phone: string; address: string; city: string };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/store/orders" className="text-sm text-secondary hover:text-primary mb-6 inline-block">
        ← Danh sách đơn hàng
      </Link>

      {justPaid && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6 text-center font-medium">
          🎉 Thanh toán thành công! Đơn hàng của bạn đang được xử lý.
        </div>
      )}

      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Mã đơn hàng</p>
          <h1 className="text-2xl font-bold tracking-wider text-dark">{order.display_id}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Đặt ngày {new Date(order.created_at).toLocaleDateString("vi-VN", { dateStyle: "long" })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-start">
          <Badge value={order.status} />
          <Badge value={order.payment_method === "bank_transfer" ? "Chuyển khoản" : "COD"} />
          <span className={`badge ${PAYMENT_STATUS_COLORS[order.payment_status] ?? "bg-gray-100 text-gray-600"}`}>
            {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
          </span>
        </div>
      </div>

      {order.payment_method === "bank_transfer" && order.payment_status === "unpaid" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-yellow-700">Đơn hàng chưa được thanh toán.</p>
          <Link to={`/store/payment/${order.id}`} className="btn-primary text-sm !px-4 !py-2 shrink-0">
            Thanh toán ngay →
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {/* Items */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Sản phẩm đã đặt</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <img
                  src={item.product.images[0] || PLACEHOLDER}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product.name}</p>
                  {item.variant_attributes && Object.keys(item.variant_attributes).length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {Object.entries(item.variant_attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    {item.unit_price.toLocaleString("vi-VN")}₫ × {item.quantity}
                  </p>
                </div>
                <span className="font-semibold text-primary shrink-0">
                  {item.subtotal.toLocaleString("vi-VN")}₫
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-light mt-4 pt-4 space-y-2">
            {order.discount_amount > 0 && (
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính</span>
                  <span>{(order.total_amount + order.discount_amount).toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 items-center">
                  <span className="flex items-center gap-1.5">
                    Giảm giá
                    {order.coupon_code && (
                      <span className="bg-green-100 text-green-700 text-xs font-mono px-1.5 py-0.5 rounded">
                        {order.coupon_code}
                      </span>
                    )}
                  </span>
                  <span>-{order.discount_amount.toLocaleString("vi-VN")}₫</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-light pt-2">
              <span>Tổng cộng</span>
              <span className="text-primary">{order.total_amount.toLocaleString("vi-VN")}₫</span>
            </div>
          </div>
        </div>

        {/* Shipping info */}
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Thông tin giao hàng</h2>
          <div className="text-sm space-y-1.5 text-gray-600">
            <p><span className="font-medium text-dark">Người nhận:</span> {addr.name}</p>
            <p><span className="font-medium text-dark">Điện thoại:</span> {addr.phone}</p>
            <p><span className="font-medium text-dark">Địa chỉ:</span> {addr.address}</p>
            <p><span className="font-medium text-dark">Tỉnh/TP:</span> {addr.city}</p>
            {order.note && <p><span className="font-medium text-dark">Ghi chú:</span> {order.note}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ordersApi } from "../api/orders";
import Spinner from "../components/ui/Spinner";

const BANK_ID       = import.meta.env.VITE_BANK_ID        || "BIDV";
const BANK_ACCOUNT  = import.meta.env.VITE_BANK_ACCOUNT_NO || "1234567890";
const BANK_NAME     = import.meta.env.VITE_BANK_ACCOUNT_NAME || "GYM STORE";
const BANK_TEMPLATE = import.meta.env.VITE_BANK_TEMPLATE  || "compact";

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.get(id!).then((r) => r.data),
    enabled: !!id,
    // Poll every 5s while payment is not yet confirmed
    refetchInterval: (query) => {
      const status = query.state.data?.payment_status;
      return status === "paid" || status === "refunded" ? false : 5000;
    },
  });

  // Redirect to order detail once payment is confirmed
  useEffect(() => {
    if (order?.payment_status === "paid") {
      navigate(`/store/orders/${id}?paid=1`, { replace: true });
    }
  }, [order?.payment_status, id, navigate]);

  const notifyMutation = useMutation({
    mutationFn: () => ordersApi.notifyPayment(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
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

  const qrUrl =
    `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-${BANK_TEMPLATE}.png` +
    `?amount=${Math.round(order.total_amount)}&addInfo=${encodeURIComponent(order.display_id)}`;

  const isPending = order.payment_status === "pending_verification";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold text-dark">Đặt hàng thành công!</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Vui lòng hoàn tất thanh toán để đơn hàng được xử lý
        </p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Order summary */}
        <div className="flex justify-between items-center bg-surface rounded-xl p-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Mã đơn hàng</p>
            <p className="font-bold text-xl tracking-wider text-dark">{order.display_id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Số tiền</p>
            <p className="font-bold text-xl text-primary">{order.total_amount.toLocaleString("vi-VN")}₫</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          <img
            src={qrUrl}
            alt="VietQR"
            className="w-56 h-56 rounded-xl border border-light object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <p className="text-xs text-gray-400">Quét mã bằng app ngân hàng của bạn</p>
        </div>

        {/* Bank info */}
        <div className="bg-surface rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Ngân hàng</span>
            <span className="font-medium">{BANK_ID}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Số tài khoản</span>
            <span className="font-medium font-mono">{BANK_ACCOUNT}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Chủ tài khoản</span>
            <span className="font-medium">{BANK_NAME}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Số tiền</span>
            <span className="font-bold text-primary">{order.total_amount.toLocaleString("vi-VN")}₫</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nội dung CK</span>
            <span className="font-bold tracking-wider">{order.display_id}</span>
          </div>
        </div>

        {/* Status / action */}
        {isPending ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-700 font-medium mb-1">
              <Spinner className="w-4 h-4 border-yellow-500 border-t-transparent" />
              Đang chờ xác nhận thanh toán...
            </div>
            <p className="text-xs text-yellow-600">Admin sẽ xác nhận trong thời gian sớm nhất</p>
          </div>
        ) : (
          <button
            onClick={() => notifyMutation.mutate()}
            disabled={notifyMutation.isPending}
            className="btn-primary w-full py-3 text-base"
          >
            {notifyMutation.isPending ? "Đang gửi..." : "✓ Tôi đã chuyển khoản"}
          </button>
        )}

        <Link
          to={`/store/orders/${id}`}
          className="block text-center text-sm text-secondary hover:text-primary"
        >
          Xem chi tiết đơn hàng →
        </Link>
      </div>
    </div>
  );
}

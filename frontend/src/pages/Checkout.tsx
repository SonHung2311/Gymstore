import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ordersApi } from "../api/orders";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";

export default function Checkout() {
  const { cart, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.full_name || "",
    phone: user?.phone || "",
    address: "",
    city: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const couponRef = useRef<HTMLInputElement>(null);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await ordersApi.validateVoucher(code);
      if (res.data.valid) {
        setCouponApplied({ code: code.toUpperCase(), discount: res.data.discount_amount, message: res.data.message });
        setCouponError("");
      } else {
        setCouponApplied(null);
        setCouponError(res.data.message);
      }
    } catch {
      setCouponApplied(null);
      setCouponError("Không thể kiểm tra mã giảm giá");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (cart.items.length === 0) { navigate("/store/cart"); return; }

    setLoading(true);
    setError("");
    try {
      const order = await ordersApi.checkout({
        payment_method: paymentMethod,
        shipping_address: form,
        note: note || undefined,
        coupon_code: couponApplied?.code,
      });
      clearCart();
      if (paymentMethod === "bank_transfer") {
        navigate(`/store/payment/${order.data.id}`);
      } else {
        navigate(`/store/orders/${order.data.id}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Có lỗi xảy ra khi đặt hàng");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="text-lg text-gray-500 mb-4">Bạn cần đăng nhập để đặt hàng</p>
        <Link to="/login" className="btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-lg text-gray-500 mb-4">Giỏ hàng trống</p>
        <Link to="/store" className="btn-primary">Xem sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-semibold mb-8">Thanh toán</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Shipping info */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Thông tin giao hàng</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Họ tên <span className="text-red-500">*</span></label>
                <input className="input" required value={form.name}
                  onChange={(e) => update("name", e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                <input className="input" required value={form.phone}
                  onChange={(e) => update("phone", e.target.value)} placeholder="0912345678" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ <span className="text-red-500">*</span></label>
              <input className="input" required value={form.address}
                onChange={(e) => update("address", e.target.value)} placeholder="Số nhà, tên đường, phường/xã" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố <span className="text-red-500">*</span></label>
              <input className="input" required value={form.city}
                onChange={(e) => update("city", e.target.value)} placeholder="Hà Nội, TP.HCM..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú</label>
              <textarea className="input resize-none" rows={2} value={note}
                onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú đặc biệt..." />
            </div>
          </div>

          {/* Payment method */}
          <div className="card p-6 space-y-3">
            <h2 className="text-lg font-semibold">Phương thức thanh toán</h2>
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
              style={{ borderColor: paymentMethod === "cod" ? "#8B4513" : "#DEB887" }}>
              <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")} className="accent-primary" />
              <div>
                <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                <p className="text-sm text-gray-500">Trả tiền mặt khi nhận hàng</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
              style={{ borderColor: paymentMethod === "bank_transfer" ? "#8B4513" : "#DEB887" }}>
              <input type="radio" name="payment" value="bank_transfer" checked={paymentMethod === "bank_transfer"}
                onChange={() => setPaymentMethod("bank_transfer")} className="accent-primary" />
              <div>
                <p className="font-medium">Chuyển khoản ngân hàng (QR Code)</p>
                <p className="text-sm text-gray-500">Quét mã QR VietQR để thanh toán</p>
              </div>
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
            {loading ? "Đang xử lý..." : "✓ Đặt hàng"}
          </button>
        </form>

        {/* Order summary */}
        <div className="card p-6 h-fit space-y-4">
          <h2 className="text-lg font-semibold">Đơn hàng của bạn</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cart.items.map((item) => {
              const unitPrice = item.variant?.price != null ? item.variant.price : item.product.price;
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="truncate mr-2 text-gray-600">
                    <p>{item.product.name} x{item.quantity}</p>
                    {item.variant && Object.keys(item.variant.attributes).length > 0 && (
                      <p className="text-xs text-gray-400">{Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-medium">{(unitPrice * item.quantity).toLocaleString("vi-VN")}₫</span>
                </div>
              );
            })}
          </div>

          {/* Coupon input */}
          <div className="border-t border-light pt-4 space-y-2">
            <p className="text-sm font-medium">Mã giảm giá</p>
            {couponApplied ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-700 flex-1">{couponApplied.code} — {couponApplied.message}</span>
                <button type="button" onClick={() => { setCouponApplied(null); setCouponInput(""); }}
                  className="text-green-600 hover:text-green-800 ml-1 text-lg leading-none">×</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={couponRef}
                  className="input flex-1 uppercase text-sm"
                  placeholder="Nhập mã..."
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                />
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                  className="btn-secondary text-sm !px-3 !py-2 shrink-0">
                  {couponLoading ? "..." : "Áp dụng"}
                </button>
              </div>
            )}
            {couponError && <p className="text-xs text-red-600">{couponError}</p>}
          </div>

          <div className="border-t border-light pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span>
              <span>{cart.total.toLocaleString("vi-VN")}₫</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá</span>
                <span>-{couponApplied.discount.toLocaleString("vi-VN")}₫</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-light pt-2">
              <span>Tổng cộng</span>
              <span className="text-primary">
                {(cart.total - (couponApplied?.discount ?? 0)).toLocaleString("vi-VN")}₫
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

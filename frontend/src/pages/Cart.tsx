import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartApi } from "../api/cart";
import { useCartStore } from "../store/cartStore";
import Spinner from "../components/ui/Spinner";
import { useState } from "react";

const PLACEHOLDER = "https://placehold.co/80x80/DEB887/8B4513?text=Gym";

export default function Cart() {
  const { cart, setCart } = useCartStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cartApi.get().then((r) => {
      setCart(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [setCart]);

  const handleUpdate = async (itemId: number, qty: number) => {
    try {
      const res = await cartApi.updateItem(itemId, qty);
      setCart(res.data);
    } catch {
      // Item may have been removed; refresh cart
      const res = await cartApi.get();
      setCart(res.data);
    }
  };

  const handleRemove = async (itemId: number) => {
    const res = await cartApi.removeItem(itemId);
    setCart(res.data);
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-semibold mb-8">Giỏ hàng</h1>

      {cart.items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-lg text-gray-500 mb-6">Giỏ hàng trống</p>
          <Link to="/store" className="btn-primary">Tiếp tục mua sắm</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="card p-4 flex items-center gap-4">
                <img
                  src={item.product.images[0] || PLACEHOLDER}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/store/products/${item.product.slug}`}
                    className="font-medium text-dark hover:text-secondary line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  {item.variant && Object.keys(item.variant.attributes).length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}
                  <p className="text-primary font-semibold mt-1">
                    {(item.variant?.price != null ? item.variant.price : item.product.price).toLocaleString("vi-VN")}₫
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-light rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity - 1)}
                      className="px-2.5 py-1.5 hover:bg-surface transition-colors font-bold text-sm"
                    >
                      −
                    </button>
                    <span className="px-3 py-1.5 border-x border-light text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity + 1)}
                      className="px-2.5 py-1.5 hover:bg-surface transition-colors font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                    aria-label="Xóa"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card p-6 h-fit space-y-4">
            <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>
            <div className="space-y-2 text-sm">
              {cart.items.map((item) => {
                const unitPrice = item.variant?.price != null ? item.variant.price : item.product.price;
                return (
                  <div key={item.id} className="flex justify-between text-gray-600">
                    <span className="truncate mr-2">{item.product.name} x{item.quantity}</span>
                    <span className="shrink-0">{(unitPrice * item.quantity).toLocaleString("vi-VN")}₫</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-light pt-4 flex justify-between font-bold text-lg">
              <span>Tổng cộng</span>
              <span className="text-primary">{cart.total.toLocaleString("vi-VN")}₫</span>
            </div>
            <button
              onClick={() => navigate("/store/checkout")}
              className="btn-primary w-full text-base py-3"
            >
              Tiến hành thanh toán →
            </button>
            <Link to="/store" className="btn-secondary w-full text-center block text-sm">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

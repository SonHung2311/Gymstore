import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import { cartApi } from "../../api/cart";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const { setCart } = useCartStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      const token = data.access_token;
      localStorage.setItem("token", token);

      const userRes = await authApi.me();
      setAuth(token, userRes.data);

      // Merge guest cart into user account
      const sessionId = localStorage.getItem("session_id");
      if (sessionId) {
        try {
          const cartRes = await cartApi.merge(sessionId);
          setCart(cartRes.data);
          localStorage.removeItem("session_id");
        } catch {
          // Non-critical: ignore merge failure
        }
      }

      navigate(userRes.data.role === "admin" ? "/admin" : "/");
    } catch {
      setError("Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl mb-6 text-center">Đăng nhập</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-secondary hover:text-primary">
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-secondary font-medium">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

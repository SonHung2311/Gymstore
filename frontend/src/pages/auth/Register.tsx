import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      localStorage.setItem("token", data.access_token);
      const userRes = await authApi.me();
      setAuth(data.access_token, userRes.data);
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl mb-6 text-center">Đăng ký tài khoản</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Họ tên</label>
            <input className="input" type="text" value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
            <input className="input" type="email" required value={form.email}
              onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <input className="input" type="tel" value={form.phone}
              onChange={(e) => update("phone", e.target.value)} placeholder="0912345678" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu <span className="text-red-500">*</span></label>
            <input className="input" type="password" required minLength={6} value={form.password}
              onChange={(e) => update("password", e.target.value)} placeholder="Tối thiểu 6 ký tự" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-secondary font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

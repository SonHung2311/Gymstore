import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authApi.forgotPassword(email);
      // Dev mode: backend returns the token directly
      if (res.data.reset_token) setToken(res.data.reset_token);
      setStep("reset");
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.resetPassword(token, newPassword);
      setStep("done");
    } catch {
      setError("Token không hợp lệ hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl mb-2 text-center">Quên mật khẩu</h1>

        {step === "request" && (
          <>
            <p className="text-sm text-gray-500 text-center mb-6">
              Nhập email để nhận link đặt lại mật khẩu
            </p>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
            <form onSubmit={handleRequest} className="space-y-4">
              <input className="input" type="email" required placeholder="Email của bạn"
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Đang xử lý..." : "Gửi yêu cầu"}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <p className="text-sm text-gray-500 text-center mb-6">
              Nhập token và mật khẩu mới
            </p>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Token</label>
                <input className="input" type="text" required value={token}
                  onChange={(e) => setToken(e.target.value)} placeholder="Reset token" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
                <input className="input" type="password" required minLength={6} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium mb-4">Mật khẩu đã được cập nhật!</p>
            <Link to="/login" className="btn-primary inline-block">Đăng nhập ngay</Link>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-secondary">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

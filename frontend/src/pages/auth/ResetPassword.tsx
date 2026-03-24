import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-md text-center">
          <p className="text-red-500 font-medium mb-4">Link không hợp lệ hoặc đã hết hạn.</p>
          <Link to="/forgot-password" className="btn-primary inline-block">Yêu cầu link mới</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError("Mật khẩu xác nhận không khớp"); return; }
    setLoading(true); setError("");
    try {
      await authApi.resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch {
      setError("Link không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-dark mb-2">Đặt lại thành công!</h2>
          <p className="text-sm text-gray-500">Đang chuyển về trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl mb-2 text-center">Mật khẩu mới</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Nhập mật khẩu mới cho tài khoản của bạn</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
            <input className="input" type="password" required minLength={6}
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
            <input className="input" type="password" required minLength={6}
              placeholder="Nhập lại mật khẩu"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-secondary">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

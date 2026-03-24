import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-dark mb-2">Kiểm tra email của bạn</h2>
          <p className="text-sm text-gray-500 mb-1">
            Chúng tôi đã gửi link đặt lại mật khẩu đến
          </p>
          <p className="text-sm font-medium text-dark mb-4">{email}</p>
          <p className="text-xs text-gray-400 mb-6">Link có hiệu lực trong 30 phút. Kiểm tra thư mục spam nếu không thấy.</p>
          <Link to="/login" className="text-secondary text-sm">← Quay lại đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl mb-2 text-center">Quên mật khẩu</h1>
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

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-secondary">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

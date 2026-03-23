import { NavLink, Outlet, Navigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const NAV = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Sản phẩm" },
  { to: "/admin/orders", label: "Đơn hàng" },
  { to: "/admin/vouchers", label: "Voucher" },
  { to: "/admin/users", label: "Người dùng" },
  { to: "/admin/posts", label: "Bài viết" },
  { to: "/admin/banners", label: "Banner" },
  { to: "/admin/chat", label: "Chăm sóc KH" },
];

export default function AdminLayout() {
  const { user } = useAuthStore();

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 bg-dark text-white shrink-0 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <p className="font-semibold text-light">Admin Panel</p>
          <p className="text-xs text-white/50 mt-0.5">{user.email}</p>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Xem website
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-surface p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

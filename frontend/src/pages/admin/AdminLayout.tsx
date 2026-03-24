import { NavLink, Outlet, Navigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

type NavItem = { to: string; label: string; end?: boolean; icon: string };

const NAV: NavItem[] = [
  {
    to: "/admin", label: "Thống kê", end: true,
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    to: "/admin/products", label: "Sản phẩm",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    to: "/admin/orders", label: "Đơn hàng",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  },
  {
    to: "/admin/vouchers", label: "Voucher",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  },
  {
    to: "/admin/users", label: "Người dùng",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    to: "/admin/posts", label: "Bài viết",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    to: "/admin/banners", label: "Banner",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    to: "/admin/tags", label: "Thẻ CĐ",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  },
  {
    to: "/admin/chat", label: "Chăm sóc KH",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
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
          <p className="font-semibold text-white text-sm">Admin Panel</p>
          <p className="text-xs text-white/40 mt-0.5 truncate">{user.email}</p>
        </div>
        <nav className="p-3 space-y-0.5 flex-1">
          {NAV.map((item, idx) => (
            <div key={item.to}>
              {idx === 1 && <hr className="border-white/10 my-2" />}
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <svg
                  className="w-[17px] h-[17px] shrink-0"
                  fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-[17px] h-[17px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

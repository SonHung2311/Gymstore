import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { chatApi } from "../../api/chat";

const NAV_LINKS = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/store", label: "Gian hàng" },
  { to: "/community", label: "Cộng đồng" },
  { to: "/contact", label: "Liên hệ" },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ["chat-unread"],
    queryFn: () => chatApi.getUnreadCount().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.count ?? 0;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-bold text-white tracking-tight">💪 GymStore</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.filter((item) => !(item.to === "/contact" && user?.role === "admin")).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {item.label}
                {item.to === "/contact" && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              to="/store/cart"
              className="relative p-2 text-white hover:text-light transition-colors"
              aria-label="Giỏ hàng"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 005.4 17H19M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"
                />
              </svg>
              {cart.item_count > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cart.item_count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                {user.role === "admin" && (
                  <Link to="/admin" className="text-sm bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                    Admin
                  </Link>
                )}
                <Link to="/store/orders" className="text-sm text-white/80 hover:text-white transition-colors">Đơn hàng</Link>
                <span className="text-white/40">|</span>
                <Link to={`/community/profile/${user.id}`} className="text-white text-sm font-medium truncate max-w-[120px] hover:underline">
                  {user.full_name || user.email.split("@")[0]}
                </Link>
                <button onClick={handleLogout} className="text-sm text-white/70 hover:text-white transition-colors">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="text-white/80 hover:text-white text-sm transition-colors">Đăng nhập</Link>
                <Link to="/register" className="bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-white/20 space-y-1">
            {NAV_LINKS.filter((item) => !(item.to === "/contact" && user?.role === "admin")).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive ? "bg-white/20 text-white" : "text-white/80"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="border-t border-white/20 pt-2 mt-2">
              {user ? (
                <>
                  <Link to={`/community/profile/${user.id}`} onClick={() => setMobileOpen(false)} className="block px-4 py-1.5 text-white text-sm font-medium hover:underline">{user.full_name || user.email}</Link>
                  {user.role === "admin" && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-white font-medium text-sm">Admin Panel →</Link>
                  )}
                  <Link to="/store/orders" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-white/80 text-sm">Đơn hàng</Link>
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2 text-white/80 text-sm">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-white/80 text-sm">Đăng nhập</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-white/80 text-sm">Đăng ký</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

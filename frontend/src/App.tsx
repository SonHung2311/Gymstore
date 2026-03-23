import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { authApi } from "./api/auth";
import { cartApi } from "./api/cart";
import Layout from "./components/layout/Layout";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminChat from "./pages/admin/AdminChat";
import ContactPage from "./pages/contact/ContactPage";
import AdminVouchers from "./pages/admin/AdminVouchers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import Dashboard from "./pages/admin/Dashboard";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import OrderDetail from "./pages/OrderDetail";
import Orders from "./pages/Orders";
import PaymentPage from "./pages/PaymentPage";
import ProductDetail from "./pages/ProductDetail";
import Store from "./pages/Store";
import Community from "./pages/community/Community";
import PostDetail from "./pages/community/PostDetail";
import ProfilePage from "./pages/community/ProfilePage";
import { useAuthStore } from "./store/authStore";
import { useCartStore } from "./store/cartStore";

function ensureSessionId() {
  if (!localStorage.getItem("session_id")) {
    localStorage.setItem("session_id", crypto.randomUUID());
  }
}

export default function App() {
  const { token, setAuth, logout } = useAuthStore();
  const { setCart } = useCartStore();

  useEffect(() => {
    ensureSessionId();
    if (token) {
      authApi.me().then((r) => setAuth(token, r.data)).catch(() => logout());
    }
    cartApi.get().then((r) => setCart(r.data)).catch(() => {});
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Store sub-section */}
        <Route path="/store" element={<Store />} />
        <Route path="/store/products/:slug" element={<ProductDetail />} />
        <Route path="/store/cart" element={<Cart />} />
        <Route path="/store/checkout" element={<Checkout />} />
        <Route path="/store/orders" element={<Orders />} />
        <Route path="/store/orders/:id" element={<OrderDetail />} />
        <Route path="/store/payment/:id" element={<PaymentPage />} />

        {/* Community sub-section */}
        <Route path="/community" element={<Community />} />
        <Route path="/community/posts/:id" element={<PostDetail />} />
        <Route path="/community/profile/:userId" element={<ProfilePage />} />

        {/* Contact / Chat */}
        <Route path="/contact" element={<ContactPage />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="vouchers" element={<AdminVouchers />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="chat" element={<AdminChat />} />
      </Route>
    </Routes>
  );
}

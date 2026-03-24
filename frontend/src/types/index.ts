export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "user" | "admin";
  is_active: boolean;
  avatar: string | null;
  bio: string | null;
}

export interface UserPublicProfile {
  id: string;
  full_name: string | null;
  avatar: string | null;
  bio: string | null;
  post_count: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface AttributeType {
  id: number;
  name: string;
  values: string[];
  display_order: number;
}

export interface ProductAttribute {
  id: number;
  name: string;
  values: string[];
  display_order: number;
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  attributes: Record<string, string>;
  price: number | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  category: Category | null;
  created_at: string;
  avg_rating: number | null;
  review_count: number;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  author: { id: string; full_name: string | null; avatar: string | null };
  created_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CartItem {
  id: number;
  product: Product;
  variant_id: string | null;
  variant: ProductVariant | null;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export interface OrderItem {
  id: number;
  product: Product;
  variant_id: string | null;
  variant_attributes: Record<string, string> | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  display_id: string;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  total_amount: number;
  payment_method: "cod" | "bank_transfer";
  payment_status: "unpaid" | "pending_verification" | "paid" | "refunded";
  shipping_address: ShippingAddress;
  note: string | null;
  coupon_code: string | null;
  discount_amount: number;
  items: OrderItem[];
  created_at: string;
}

export interface Voucher {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  applies_to: "all" | "category" | "product";
  category_id: number | null;
  product_id: string | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthorInfo {
  id: string;
  full_name: string | null;
  avatar: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  tags: string[];
  like_count: number;
  comment_count: number;
  author: AuthorInfo;
  liked_by_me: boolean;
  created_at: string;
}

export interface PostListResponse {
  items: Post[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Comment {
  id: string;
  content: string;
  author: AuthorInfo;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  cta: string;
  link: string;
  bg: string;
  display_page: string; // "all" | "home" | "store" | "community"
}

export interface BannerAdmin extends Banner {
  subtitle: string | null;
  is_active: boolean;
  order: number;
  display_page: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  role: "user" | "admin";
  is_active: boolean;
  avatar: string | null;
  created_at: string;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface HomeData {
  banners: Banner[];
  top_products: Pick<Product, "id" | "name" | "slug" | "price" | "images" | "category">[];
  trending_posts: (Pick<Post, "id" | "title" | "tags" | "like_count" | "comment_count" | "created_at"> & { author: AuthorInfo })[];
}

export interface UserMini {
  id: string;
  full_name: string | null;
  avatar: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender: UserMini;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | "audio" | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  other_user: UserMini;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface RevenueEntry {
  date: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  sold: number;
  revenue: number;
}

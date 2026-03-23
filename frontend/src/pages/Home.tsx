import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { homeApi } from "../api/community";
import HeroCarousel from "../components/ui/HeroCarousel";
import Spinner from "../components/ui/Spinner";
import { TAG_COLORS } from "../constants/tags";

const PLACEHOLDER = "https://placehold.co/400x300/DEB887/8B4513?text=Gym+Store";

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: () => homeApi.getData().then((r) => r.data),
  });

  return (
    <div>
      {/* ── Hero Carousel ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-gradient-to-br from-primary to-secondary py-24 flex justify-center">
          <Spinner className="border-white border-t-transparent" />
        </div>
      ) : (
        <HeroCarousel banners={data?.banners ?? []} />
      )}

      {/* ── Featured Products ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Sản phẩm nổi bật</h2>
          <Link to="/store" className="text-secondary hover:text-primary text-sm font-medium">
            Xem tất cả →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {data?.top_products.map((p) => (
              <Link
                key={p.id}
                to={`/store/products/${p.slug}`}
                className="card group flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden bg-surface">
                  <img
                    src={p.images[0] || PLACEHOLDER}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 flex flex-col flex-1">
                  {p.category && (
                    <span className="text-xs text-accent font-medium uppercase tracking-wide mb-0.5">
                      {p.category.name}
                    </span>
                  )}
                  <p className="text-dark font-medium text-sm line-clamp-2 flex-1">{p.name}</p>
                  <p className="text-primary font-bold mt-2">
                    {p.price.toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Community Trending ────────────────────────────────────── */}
      <section className="bg-light/30 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Hoạt động cộng đồng</h2>
            <Link to="/community" className="text-secondary hover:text-primary text-sm font-medium">
              Khám phá →
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : data?.trending_posts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">Chưa có bài viết nào.</p>
              <Link to="/community" className="btn-primary">Đăng bài đầu tiên</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data?.trending_posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/community/posts/${post.id}`}
                  className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span key={tag} className={`badge ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-semibold text-dark line-clamp-2">{post.title}</h3>
                  <div className="flex items-center justify-between mt-auto text-xs text-gray-400">
                    <span>{post.author.full_name || "Ẩn danh"}</span>
                    <span className="flex gap-3">
                      <span>❤ {post.like_count}</span>
                      <span>💬 {post.comment_count}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── About / Features ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-semibold text-center mb-10">Tại sao chọn GymStore?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "🏋️", title: "Thiết bị chuyên nghiệp", desc: "Nguồn hàng chính hãng, kiểm định chất lượng nghiêm ngặt." },
            { icon: "🚚", title: "Giao hàng toàn quốc", desc: "Vận chuyển nhanh, đóng gói chắc chắn, bảo hành 12 tháng." },
            { icon: "💬", title: "Cộng đồng năng động", desc: "Chia sẻ lộ trình, kinh nghiệm và động lực cùng hàng nghìn thành viên." },
            { icon: "🔒", title: "Thanh toán an toàn", desc: "Hỗ trợ COD và thanh toán online, bảo mật tuyệt đối." },
          ].map((f) => (
            <div key={f.title} className="card p-6 text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2 text-dark">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

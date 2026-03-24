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

  const homeBanners = (data?.banners ?? []).filter(
    (b) => b.display_page === "home" || b.display_page === "all"
  );

  return (
    <div>
      {/* ── Hero Carousel ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-gradient-to-br from-primary to-secondary py-24 flex justify-center">
          <Spinner className="border-white border-t-transparent" />
        </div>
      ) : (
        <HeroCarousel banners={homeBanners} />
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
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        {post.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                        </svg>
                        {post.comment_count}
                      </span>
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
            { icon: null, title: "Cộng đồng năng động", desc: "Chia sẻ lộ trình, kinh nghiệm và động lực cùng hàng nghìn thành viên." },
            { icon: "🔒", title: "Thanh toán an toàn", desc: "Hỗ trợ COD và thanh toán online, bảo mật tuyệt đối." },
          ].map((f) => (
            <div key={f.title} className="card p-6 text-center">
              <div className="text-4xl mb-3 flex justify-center">
                {f.icon ?? (
                  <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                  </svg>
                )}
              </div>
              <h3 className="font-semibold mb-2 text-dark">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

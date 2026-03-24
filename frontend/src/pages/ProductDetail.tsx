import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { productsApi } from "../api/products";
import { cartApi } from "../api/cart";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/ui/Spinner";
import type { ProductReview, ProductVariant } from "../types";

const PLACEHOLDER = "https://placehold.co/600x400/DEB887/8B4513?text=Gym+Store";

// ── Star components ────────────────────────────────────────────────────────────

function StarDisplay({ value, size = 4 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-${size} h-${size} ${i <= Math.round(value) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <svg className={`w-7 h-7 transition-colors ${i <= (hover || value) ? "text-yellow-400" : "text-gray-200 hover:text-yellow-200"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </span>
  );
}

// ── Stock badge ────────────────────────────────────────────────────────────────

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0)
    return <p className="text-sm font-medium text-red-500">✗ Hết hàng</p>;
  if (qty <= 5)
    return <p className="text-sm font-medium text-amber-600">⚠ Còn {qty} sản phẩm (gần hết)</p>;
  return <p className="text-sm font-medium text-green-600">✓ Còn hàng ({qty} sản phẩm)</p>;
}

// ── Author avatar ──────────────────────────────────────────────────────────────

function ReviewAvatar({ avatar, name }: { avatar: string | null; name: string | null }) {
  const [err, setErr] = useState(false);
  const initials = (name ?? "?")[0].toUpperCase();
  if (avatar && !err) {
    return <img src={avatar} alt={name ?? ""} onError={() => setErr(true)} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  }
  return (
    <span className="w-9 h-9 rounded-full bg-light flex items-center justify-center text-primary font-bold text-sm shrink-0">
      {initials}
    </span>
  );
}

// ── Image lightbox ─────────────────────────────────────────────────────────────

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl leading-none"
      >×</button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-5xl leading-none px-2"
        >‹</button>
      )}

      {/* Image */}
      <img
        src={images[index]}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-5xl leading-none px-2"
        >›</button>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 flex gap-1.5">
          {images.map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setCart } = useCartStore();
  const qc = useQueryClient();

  const [selectedImg, setSelectedImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState("");
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  // Review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productsApi.get(slug!).then((r) => r.data),
    enabled: !!slug,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", slug],
    queryFn: () => productsApi.getReviews(slug!).then((r) => r.data),
    enabled: !!slug,
  });

  const submitMutation = useMutation({
    mutationFn: () => productsApi.submitReview(slug!, { rating, comment: comment || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", slug] });
      qc.invalidateQueries({ queryKey: ["product", slug] });
      setRating(0);
      setComment("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => productsApi.deleteReview(slug!, reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", slug] });
      qc.invalidateQueries({ queryKey: ["product", slug] });
    },
  });

  // Derive selectedVariant from selectedAttrs
  const activeVariants = product?.variants?.filter((v) => v.is_active) ?? [];
  const hasVariants = activeVariants.length > 0;
  const hasAttributes = (product?.attributes?.length ?? 0) > 0;

  const selectedVariant: ProductVariant | null = hasVariants
    ? activeVariants.find((v) => {
        const keys = Object.keys(v.attributes);
        return keys.length > 0 && keys.every((k) => v.attributes[k] === selectedAttrs[k]);
      }) ?? null
    : null;

  const allAttrsSelected = !hasVariants || (
    product?.attributes?.every((attr) => selectedAttrs[attr.name] !== undefined) ?? false
  );

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      const res = await cartApi.addItem(product.id, qty, selectedVariant?.id);
      setCart(res.data);
      setAddedMsg("Đã thêm vào giỏ hàng!");
      setTimeout(() => setAddedMsg(""), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setAddedMsg(msg || "Có lỗi xảy ra");
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (isError || !product) {
    return (
      <div className="text-center py-24">
        <p className="text-lg text-gray-500 mb-4">Không tìm thấy sản phẩm</p>
        <Link to="/store" className="btn-primary">← Quay lại</Link>
      </div>
    );
  }

  const myReview = user ? reviews.find((r: ProductReview) => r.author.id === user.id) : undefined;
  const displayImages = product.images.length > 0 ? product.images : [PLACEHOLDER];

  // Effective stock for quantity selector
  const effectiveStock = hasVariants
    ? (selectedVariant?.stock_quantity ?? 0)
    : product.stock_quantity;
  const inStock = effectiveStock > 0 && (!hasVariants || (allAttrsSelected && selectedVariant != null));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-secondary">Trang chủ</Link>
        {" / "}
        <Link to="/store" className="hover:text-secondary">Sản phẩm</Link>
        {" / "}
        <span className="text-dark">{product.name}</span>
      </nav>

      {/* ── Top section: image + info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div>
          <div
            className="rounded-xl overflow-hidden aspect-[4/3] bg-surface cursor-zoom-in relative group"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={displayImages[selectedImg]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              🔍 Phóng to
            </div>
          </div>
          {displayImages.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {displayImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === selectedImg ? "border-primary ring-2 ring-primary/30" : "border-light hover:border-primary/50"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          {product.category && (
            <span className="badge bg-light text-primary">{product.category.name}</span>
          )}
          <h1 className="text-3xl font-bold text-dark">{product.name}</h1>

          {/* Rating summary */}
          <div className="flex items-center gap-2">
            {product.avg_rating != null ? (
              <>
                <StarDisplay value={product.avg_rating} />
                <span className="text-sm font-semibold text-dark">{product.avg_rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">· {product.review_count} đánh giá</span>
              </>
            ) : (
              <span className="text-sm text-gray-400">Chưa có đánh giá</span>
            )}
          </div>

          {/* Variant selector */}
          {hasVariants && hasAttributes && (
            <div className="space-y-3">
              {product.attributes.map((attr) => (
                <div key={attr.id}>
                  <p className="text-sm font-medium mb-1.5">
                    {attr.name}
                    {selectedAttrs[attr.name] && (
                      <span className="ml-2 text-primary font-semibold">{selectedAttrs[attr.name]}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((val) => {
                      const isSelected = selectedAttrs[attr.name] === val;
                      const testAttrs = { ...selectedAttrs, [attr.name]: val };
                      const matchingVariant = activeVariants.find((v) =>
                        Object.entries(testAttrs).every(([k, vv]) => v.attributes[k] === vv)
                      );
                      const outOfStock = matchingVariant !== undefined && matchingVariant.stock_quantity === 0;
                      return (
                        <button
                          key={val}
                          onClick={() => setSelectedAttrs((prev) => ({ ...prev, [attr.name]: val }))}
                          disabled={outOfStock}
                          className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : outOfStock
                              ? "border-light bg-surface text-gray-300 line-through cursor-not-allowed"
                              : "border-light hover:border-primary/50 text-dark"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attributes defined but no variants yet */}
          {hasAttributes && !hasVariants && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
              <p className="text-sm text-amber-700">Sản phẩm này chưa có biến thể nào. Liên hệ shop để biết thêm.</p>
            </div>
          )}

          {/* Price (variant-aware) */}
          <p className="text-4xl font-bold text-primary">
            {(selectedVariant?.price != null ? selectedVariant.price : product.price).toLocaleString("vi-VN")}₫
          </p>

          {/* Stock badge */}
          {hasVariants ? (
            !allAttrsSelected
              ? <p className="text-sm text-gray-400">Chọn các thuộc tính để xem tồn kho</p>
              : !selectedVariant
              ? <p className="text-sm font-medium text-red-500">✗ Tổ hợp này tạm hết hàng</p>
              : <StockBadge qty={selectedVariant.stock_quantity} />
          ) : (
            <StockBadge qty={product.stock_quantity} />
          )}

          {/* Quantity + Add to cart */}
          {inStock && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <label className="font-medium text-sm">Số lượng:</label>
                <div className="flex items-center border border-light rounded-lg overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-surface transition-colors font-bold">−</button>
                  <span className="px-4 py-2 border-x border-light font-medium">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(effectiveStock, qty + 1))}
                    className="px-3 py-2 hover:bg-surface transition-colors font-bold"
                  >+</button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding || (hasVariants && !allAttrsSelected)}
                className="btn-primary w-full text-base py-3 disabled:opacity-60"
              >
                {adding ? "Đang thêm..." : "🛒 Thêm vào giỏ hàng"}
              </button>

              {addedMsg && (
                <div className={`text-sm font-medium text-center py-2 rounded-lg ${
                  addedMsg.includes("lỗi") || addedMsg.includes("Có") ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"
                }`}>
                  {addedMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-dark mb-4 pb-2 border-b border-light">Mô tả sản phẩm</h2>
        {product.description ? (
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed
            [&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-dark [&_h3]:font-semibold
            [&_a]:text-secondary [&_a]:no-underline hover:[&_a]:underline
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_blockquote]:border-l-4 [&_blockquote]:border-light [&_blockquote]:pl-4 [&_blockquote]:text-gray-500
            [&_code]:bg-surface [&_code]:px-1.5 [&_code]:rounded [&_pre]:bg-surface [&_pre]:p-4 [&_pre]:rounded-xl">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-400 italic text-sm">Chưa có mô tả sản phẩm.</p>
        )}
      </section>

      {/* ── Spec table: attributes without variants ── */}
      {hasAttributes && !hasVariants && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-dark mb-4 pb-2 border-b border-light">Thông số sản phẩm</h2>
          <div className="rounded-xl overflow-hidden border border-light">
            <table className="w-full text-sm">
              <tbody>
                {product.attributes.map((attr, i) => (
                  <tr key={attr.id} className={i % 2 === 0 ? "bg-surface" : "bg-white"}>
                    <td className="px-4 py-3 font-medium text-dark w-1/3">{attr.name}</td>
                    <td className="px-4 py-3 text-gray-600">{attr.values.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      <section>
        <h2 className="text-xl font-bold text-dark mb-4 pb-2 border-b border-light">
          Đánh giá ({product.review_count})
        </h2>

        {/* Avg rating bar */}
        {product.avg_rating != null && (
          <div className="flex items-center gap-4 mb-6 p-4 bg-surface rounded-xl">
            <div className="text-center">
              <p className="text-4xl font-bold text-dark">{product.avg_rating.toFixed(1)}</p>
              <StarDisplay value={product.avg_rating} size={5} />
              <p className="text-xs text-gray-400 mt-1">{product.review_count} đánh giá</p>
            </div>
          </div>
        )}

        {/* Review form */}
        {user ? (
          myReview ? null : (
            <div className="card p-5 mb-6">
              <p className="font-semibold text-sm mb-3">Viết đánh giá của bạn</p>
              <div className="flex items-center gap-3 mb-3">
                <StarPicker value={rating} onChange={setRating} />
                {rating > 0 && (
                  <span className="text-sm text-gray-500">
                    {["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc"][rating]}
                  </span>
                )}
              </div>
              <textarea
                className="input resize-none w-full text-sm"
                rows={3}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này... (tuỳ chọn)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                onClick={() => submitMutation.mutate()}
                disabled={rating === 0 || submitMutation.isPending}
                className="btn-primary mt-3 text-sm disabled:opacity-50"
              >
                {submitMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          )
        ) : (
          <div className="text-center py-5 mb-6 bg-surface rounded-xl">
            <p className="text-gray-500 text-sm mb-2">Đăng nhập để đánh giá sản phẩm</p>
            <button onClick={() => navigate("/login")} className="btn-secondary text-sm">Đăng nhập</button>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r: ProductReview) => (
              <div key={r.id} className="flex gap-3 p-4 rounded-xl border border-light">
                <Link to={`/community/profile/${r.author.id}`} className="shrink-0">
                  <ReviewAvatar avatar={r.author.avatar} name={r.author.full_name} />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <Link to={`/community/profile/${r.author.id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                        {r.author.full_name ?? "Người dùng"}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarDisplay value={r.rating} size={3} />
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                    {(user?.id === r.author.id || user?.role === "admin") && (
                      <button
                        onClick={() => deleteMutation.mutate(r.id)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <Lightbox
          images={displayImages}
          index={selectedImg}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setSelectedImg((i) => (i - 1 + displayImages.length) % displayImages.length)}
          onNext={() => setSelectedImg((i) => (i + 1) % displayImages.length)}
        />
      )}
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { uploadApi } from "../../api/community";
import { adminApi } from "../../api/orders";
import { productsApi } from "../../api/products";
import Spinner from "../../components/ui/Spinner";
import type { AttributeType, Category, Product, ProductAttribute, ProductReview, ProductVariant } from "../../types";

// ── Types ─────────────────────────────────────────────────────────────────────

type AdminTab = "products" | "categories" | "attributes";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  category_id: string;
  images: string[];
  is_active: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: "", description: "", price: "", stock_quantity: "",
  category_id: "", images: [], is_active: true,
};

function toApiPayload(f: ProductForm) {
  return {
    name: f.name,
    description: f.description || null,
    price: parseFloat(f.price),
    stock_quantity: parseInt(f.stock_quantity) || 0,
    category_id: f.category_id ? parseInt(f.category_id) : null,
    images: f.images,
    is_active: f.is_active,
  };
}

// Slug preview for categories (mirrors backend logic)
function previewSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(value) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ── Reviews Modal ─────────────────────────────────────────────────────────────

function ReviewsModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin", "reviews", product.slug],
    queryFn: () => productsApi.getReviews(product.slug).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => productsApi.deleteReview(product.slug, reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews", product.slug] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Đánh giá sản phẩm</h2>
            <p className="text-sm text-gray-500">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-dark text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : reviews.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Sản phẩm này chưa có đánh giá nào.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r: ProductReview) => (
                <div key={r.id} className="flex gap-3 p-3 rounded-lg border border-light">
                  <div className="w-8 h-8 rounded-full bg-light flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {(r.author.full_name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{r.author.full_name ?? "Người dùng"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Stars value={r.rating} />
                          <span className="text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(r.id)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                      >
                        Xóa
                      </button>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Image Gallery ─────────────────────────────────────────────────────────────

function ImageGallery({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadMedia(file);
      onChange([...images, res.data.url]);
    } finally {
      setUploading(false);
    }
  };

  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; setDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragOver(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); dragCounter.current = 0; setDragOver(false);
    const file = e.dataTransfer.files[0]; if (file) upload(file);
  };

  return (
    <div
      onDragEnter={onDragEnter} onDragLeave={onDragLeave}
      onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed p-3 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-light"}`}
    >
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-light group shrink-0">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none">×</button>
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-20 h-20 rounded-lg border border-dashed border-gray-200 hover:border-primary hover:bg-surface flex flex-col items-center justify-center gap-1 transition-colors shrink-0">
          {uploading ? <Spinner /> : (
            <>
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.75 5.75 0 0 1 1.72 11.096H6.75Z" />
              </svg>
              <span className="text-xs text-gray-300">Thêm</span>
            </>
          )}
        </button>
      </div>
      {dragOver && <p className="text-center text-primary text-xs font-medium mt-2">Thả ảnh vào đây</p>}
      {images.length === 0 && !dragOver && <p className="text-center text-gray-300 text-xs mt-2">Kéo thả ảnh vào đây hoặc bấm "Thêm"</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  );
}

// ── Products Panel ────────────────────────────────────────────────────────────

// ── Product Variants Section ──────────────────────────────────────────────────

function ProductVariantsSection({ product }: { product: Product }) {
  const qc = useQueryClient();
  const [attrModal, setAttrModal] = useState<{ open: boolean; attr: ProductAttribute | null }>({ open: false, attr: null });
  const [variantModal, setVariantModal] = useState<{ open: boolean; variant: ProductVariant | null }>({ open: false, variant: null });

  const { data: attrs = [] } = useQuery({
    queryKey: ["product-attrs", product.id],
    queryFn: () => productsApi.listProductAttributes(product.id).then((r) => r.data),
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["product-variants", product.id],
    queryFn: () => productsApi.listProductVariants(product.id).then((r) => r.data),
  });

  const { data: attrTypes = [] } = useQuery({
    queryKey: ["attribute-types"],
    queryFn: () => productsApi.listAttributeTypes().then((r) => r.data),
  });

  const createAttrMut = useMutation({
    mutationFn: (d: { name: string; values: string[] }) =>
      productsApi.createProductAttribute(product.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product-attrs", product.id] }); setAttrModal({ open: false, attr: null }); },
  });

  const updateAttrMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; values: string[] } }) =>
      productsApi.updateProductAttribute(product.id, id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product-attrs", product.id] }); setAttrModal({ open: false, attr: null }); },
  });

  const deleteAttrMut = useMutation({
    mutationFn: (id: number) => productsApi.deleteProductAttribute(product.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-attrs", product.id] });
      qc.invalidateQueries({ queryKey: ["product-variants", product.id] });
    },
  });

  const createVariantMut = useMutation({
    mutationFn: (d: { attributes: Record<string, string>; price: number | null; stock_quantity: number; sku: string | null; is_active: boolean }) =>
      productsApi.createProductVariant(product.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product-variants", product.id] }); setVariantModal({ open: false, variant: null }); },
  });

  const updateVariantMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { attributes: Record<string, string>; price: number | null; stock_quantity: number; sku: string | null; is_active: boolean } }) =>
      productsApi.updateProductVariant(product.id, id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product-variants", product.id] }); setVariantModal({ open: false, variant: null }); },
  });

  const deleteVariantMut = useMutation({
    mutationFn: (id: string) => productsApi.deleteProductVariant(product.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product-variants", product.id] }),
  });

  // Attribute modal internal state
  const [attrName, setAttrName] = useState("");
  const [attrValues, setAttrValues] = useState<string[]>([]);
  const [attrValueInput, setAttrValueInput] = useState("");

  const openAttrCreate = () => { setAttrName(""); setAttrValues([]); setAttrValueInput(""); setAttrModal({ open: true, attr: null }); };
  const openAttrEdit = (a: ProductAttribute) => { setAttrName(a.name); setAttrValues([...a.values]); setAttrValueInput(""); setAttrModal({ open: true, attr: a }); };
  const saveAttr = () => {
    if (!attrName.trim() || attrValues.length === 0) return;
    const data = { name: attrName.trim(), values: attrValues };
    if (attrModal.attr) updateAttrMut.mutate({ id: attrModal.attr.id, data });
    else createAttrMut.mutate(data);
  };

  // Variant modal state
  const [vAttrs, setVAttrs] = useState<Record<string, string>>({});
  const [vPrice, setVPrice] = useState("");
  const [vStock, setVStock] = useState("0");
  const [vSku, setVSku] = useState("");
  const [vActive, setVActive] = useState(true);

  const openVariantCreate = () => {
    const initial: Record<string, string> = {};
    attrs.forEach((a) => { initial[a.name] = ""; });
    setVAttrs(initial); setVPrice(""); setVStock("0"); setVSku(""); setVActive(true);
    setVariantModal({ open: true, variant: null });
  };
  const openVariantEdit = (v: ProductVariant) => {
    setVAttrs({ ...v.attributes }); setVPrice(v.price != null ? String(v.price) : "");
    setVStock(String(v.stock_quantity)); setVSku(v.sku || ""); setVActive(v.is_active);
    setVariantModal({ open: true, variant: v });
  };
  const saveVariant = () => {
    const data = {
      attributes: vAttrs,
      price: vPrice ? parseFloat(vPrice) : null,
      stock_quantity: parseInt(vStock) || 0,
      sku: vSku || null,
      is_active: vActive,
    };
    if (variantModal.variant) updateVariantMut.mutate({ id: variantModal.variant.id, data });
    else createVariantMut.mutate(data);
  };

  // Duplicate detection: check if selected attr combo already exists in another variant
  const isDuplicate = variants.some((v) =>
    v.id !== variantModal.variant?.id &&
    attrs.length > 0 &&
    attrs.every((a) => vAttrs[a.name] && v.attributes[a.name] === vAttrs[a.name])
  );

  return (
    <div className="border-t-2 border-dashed border-light pt-5 space-y-5">

      {/* ── Attributes ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-dark">Thuộc tính</p>
            <p className="text-xs text-gray-400 mt-0.5">Dùng để tạo biến thể (Size, Màu…)</p>
          </div>
          <div className="flex gap-1.5">
            {attrTypes.length > 0 && (
              <select
                className="text-xs border border-light rounded-lg px-2 py-1.5 bg-white"
                onChange={(e) => {
                  const t = attrTypes.find((at) => String(at.id) === e.target.value);
                  if (t) { setAttrName(t.name); setAttrValues([...t.values]); setAttrValueInput(""); setAttrModal({ open: true, attr: null }); }
                  e.target.value = "";
                }}
                defaultValue=""
              >
                <option value="" disabled>+ Từ template</option>
                {attrTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <button type="button" onClick={openAttrCreate} className="text-xs px-2.5 py-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 font-medium">
              + Tùy chỉnh
            </button>
          </div>
        </div>

        {attrs.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-3 border border-dashed border-light rounded-lg">
            Chưa có thuộc tính. Thêm để bật tính năng biến thể.
          </p>
        ) : (
          <div className="rounded-xl border border-light overflow-hidden">
            {attrs.map((a, i) => (
              <div key={a.id} className={`flex items-center gap-3 px-3 py-2.5 text-xs ${i > 0 ? "border-t border-light" : ""}`}>
                <span className="font-semibold text-dark w-20 shrink-0 truncate">{a.name}</span>
                <div className="flex-1 flex flex-wrap gap-1 min-w-0">
                  {a.values.map((val) => (
                    <span key={val} className="px-1.5 py-0.5 bg-light text-primary rounded text-xs">{val}</span>
                  ))}
                </div>
                <button type="button" onClick={() => openAttrEdit(a)} className="text-secondary hover:text-primary shrink-0 font-medium">Sửa</button>
                <button type="button" onClick={() => deleteAttrMut.mutate(a.id)} className="text-red-400 hover:text-red-600 shrink-0">Xóa</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Variants ── */}
      {attrs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-dark">Biến thể <span className="text-gray-400 font-normal">({variants.length})</span></p>
              {variants.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Kho tổng: {variants.filter(v => v.is_active).reduce((s, v) => s + v.stock_quantity, 0)}
                </p>
              )}
            </div>
            <button type="button" onClick={openVariantCreate} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium">
              + Thêm biến thể
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-3 border border-dashed border-light rounded-lg">
              Chưa có biến thể nào.
            </p>
          ) : (
            <div className="rounded-xl border border-light overflow-hidden max-h-52 overflow-y-auto">
              {variants.map((v, i) => (
                <div key={v.id} className={`flex items-center gap-2 px-3 py-2.5 text-xs ${i > 0 ? "border-t border-light" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark truncate">
                      {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(" · ") || "—"}
                    </p>
                    <p className="text-gray-400 mt-0.5">
                      {v.price != null ? `${Number(v.price).toLocaleString("vi-VN")}₫` : "Giá mặc định"}
                      {" · "}
                      <span className={v.stock_quantity === 0 ? "text-red-400" : v.stock_quantity <= 5 ? "text-amber-500" : "text-green-600"}>
                        Kho: {v.stock_quantity}
                      </span>
                      {v.sku && ` · ${v.sku}`}
                    </p>
                  </div>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-xs font-medium ${v.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {v.is_active ? "Bán" : "Ẩn"}
                  </span>
                  <button type="button" onClick={() => openVariantEdit(v)} className="text-secondary hover:text-primary shrink-0 font-medium">Sửa</button>
                  <button type="button" onClick={() => { if (confirm("Xóa biến thể này?")) deleteVariantMut.mutate(v.id); }} className="text-red-400 hover:text-red-600 shrink-0">Xóa</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attribute modal */}
      {attrModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{attrModal.attr ? "Sửa thuộc tính" : "Thêm thuộc tính"}</h3>
              <button type="button" onClick={() => setAttrModal({ open: false, attr: null })} className="text-gray-400 hover:text-dark text-xl leading-none">×</button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên thuộc tính</label>
              <input className="input" value={attrName} onChange={(e) => setAttrName(e.target.value)} placeholder="Size, Màu sắc..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giá trị</label>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 border border-light rounded-lg bg-surface">
                {attrValues.map((v) => (
                  <span key={v} className="flex items-center gap-1 bg-white border border-light rounded px-2 py-0.5 text-sm">
                    {v}
                    <button type="button" onClick={() => setAttrValues((prev) => prev.filter((x) => x !== v))} className="text-gray-400 hover:text-red-500 leading-none">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input flex-1 text-sm" value={attrValueInput}
                  onChange={(e) => setAttrValueInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = attrValueInput.trim();
                      if (v && !attrValues.includes(v)) setAttrValues((prev) => [...prev, v]);
                      setAttrValueInput("");
                    }
                  }}
                  placeholder="Nhập giá trị rồi Enter..." />
                <button type="button" onClick={() => {
                  const v = attrValueInput.trim();
                  if (v && !attrValues.includes(v)) setAttrValues((prev) => [...prev, v]);
                  setAttrValueInput("");
                }} className="btn-secondary text-sm !px-3">+</button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAttrModal({ open: false, attr: null })} className="btn-secondary text-sm">Hủy</button>
              <button type="button" onClick={saveAttr} disabled={!attrName.trim() || attrValues.length === 0} className="btn-primary text-sm disabled:opacity-50">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Variant modal */}
      {variantModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{variantModal.variant ? "Sửa biến thể" : "Thêm biến thể"}</h3>
              <button type="button" onClick={() => setVariantModal({ open: false, variant: null })} className="text-gray-400 hover:text-dark text-xl leading-none">×</button>
            </div>
            {attrs.map((a) => (
              <div key={a.id}>
                <label className="block text-sm font-medium mb-1">{a.name}</label>
                <select className="input" value={vAttrs[a.name] || ""} onChange={(e) => setVAttrs((prev) => ({ ...prev, [a.name]: e.target.value }))}>
                  <option value="">-- Chọn --</option>
                  {a.values.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Giá (₫, trống = mặc định)</label>
                <input className="input text-sm" type="number" min="0" value={vPrice} onChange={(e) => setVPrice(e.target.value)} placeholder="Giá mặc định" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tồn kho</label>
                <input className="input text-sm" type="number" min="0" value={vStock} onChange={(e) => setVStock(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU (tuỳ chọn)</label>
              <input className="input text-sm" value={vSku} onChange={(e) => setVSku(e.target.value)} placeholder="SKU-001" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={vActive} onChange={(e) => setVActive(e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm">Kích hoạt</span>
            </label>
            {isDuplicate && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                Tổ hợp thuộc tính này đã tồn tại. Vui lòng chọn tổ hợp khác.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setVariantModal({ open: false, variant: null })} className="btn-secondary text-sm">Hủy</button>
              <button type="button" onClick={saveVariant} disabled={attrs.some((a) => !vAttrs[a.name]) || isDuplicate} className="btn-primary text-sm disabled:opacity-50">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PRODUCT_PAGE_SIZES = [10, 25, 50];

function ProductsPanel() {
  const qc = useQueryClient();

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showDescPreview, setShowDescPreview] = useState(false);
  const [reviewsProduct, setReviewsProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", page, pageSize],
    queryFn: () => adminApi.listProducts({ limit: pageSize, page }).then((r) => r.data as { items: Product[]; total: number; pages: number }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.categories().then((r) => r.data),
  });

  const update = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setEditProduct(null); setForm(EMPTY_FORM); setShowDescPreview(false); setError(""); setSuccessMsg(""); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description || "", price: String(p.price), stock_quantity: String(p.stock_quantity), category_id: p.category ? String(p.category.id) : "", images: [...p.images], is_active: p.is_active });
    setShowDescPreview(false); setError(""); setSuccessMsg(""); setShowForm(true);
  };
  const closeForm = () => setShowForm(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(""); setSuccessMsg("");
    try {
      if (editProduct) {
        await adminApi.updateProduct(editProduct.id, toApiPayload(form));
        qc.invalidateQueries({ queryKey: ["admin", "products"] });
        closeForm();
      } else {
        const res = await adminApi.createProduct(toApiPayload(form));
        const newProduct = res.data as Product;
        qc.invalidateQueries({ queryKey: ["admin", "products"] });
        // Switch to edit mode so user can immediately add attributes/variants
        setEditProduct(newProduct);
        setSuccessMsg("Tạo sản phẩm thành công! Bạn có thể thêm thuộc tính và biến thể bên dưới.");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Có lỗi xảy ra");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return;
    await adminApi.deleteProduct(id);
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{total} sản phẩm</p>
          <button onClick={openCreate} className="btn-primary">+ Thêm sản phẩm</button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-light/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-dark">Tên sản phẩm</th>
                    <th className="text-left px-4 py-3 font-semibold text-dark hidden md:table-cell">Danh mục</th>
                    <th className="text-right px-4 py-3 font-semibold text-dark">Giá</th>
                    <th className="text-right px-4 py-3 font-semibold text-dark hidden sm:table-cell">Tồn kho</th>
                    <th className="text-center px-4 py-3 font-semibold text-dark hidden md:table-cell">Đánh giá</th>
                    <th className="text-center px-4 py-3 font-semibold text-dark">Trạng thái</th>
                    <th className="text-right px-4 py-3 font-semibold text-dark">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((p) => (
                    <tr key={p.id} className="border-t border-light hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.category?.name || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">{p.price.toLocaleString("vi-VN")}₫</td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {(() => {
                          const activeVariants = p.variants?.filter((v) => v.is_active) ?? [];
                          const stock = activeVariants.length > 0
                            ? activeVariants.reduce((s, v) => s + v.stock_quantity, 0)
                            : p.stock_quantity;
                          return (
                            <span className={stock === 0 ? "text-red-500" : stock <= 5 ? "text-amber-600" : "text-dark"}>
                              {stock}
                              {activeVariants.length > 0 && (
                                <span className="text-xs text-gray-400 ml-1">({activeVariants.length} ptb)</span>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        {p.avg_rating != null ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <Stars value={p.avg_rating} />
                            <span className="text-xs text-gray-400">{p.avg_rating} · {p.review_count}</span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${p.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                          {p.is_active ? "Đang bán" : "Ẩn"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => setReviewsProduct(p)} className="text-blue-400 hover:text-blue-600 text-xs font-medium">Đánh giá</button>
                        <button onClick={() => openEdit(p)} className="text-secondary hover:text-primary text-xs font-medium">Sửa</button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="text-red-400 hover:text-red-600 text-xs font-medium">Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {total > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Hiển thị {from}–{to} trong {total}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">Hiển thị:</span>
                    <select
                      className="border border-light rounded-lg px-2 py-1 text-sm bg-white"
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    >
                      {PRODUCT_PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {data && data.pages > 1 && (
                    <div className="flex items-center gap-1">
                      <button disabled={page === 1} onClick={() => setPage(page - 1)}
                        className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">‹</button>
                      {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => setPage(p)}
                          className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${p === page ? "bg-primary text-white border border-primary" : "border border-light bg-white hover:bg-surface"}`}>
                          {p}
                        </button>
                      ))}
                      <button disabled={page === data.pages} onClick={() => setPage(page + 1)}
                        className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">›</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {reviewsProduct && <ReviewsModal product={reviewsProduct} onClose={() => setReviewsProduct(null)} />}

      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-light shrink-0">
              <h2 className="text-lg font-semibold">{editProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-dark p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
              {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">✓ {successMsg}</div>}

              <div>
                <label className="block text-sm font-medium mb-1.5">Tên sản phẩm <span className="text-red-400">*</span></label>
                <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Giá (₫) <span className="text-red-400">*</span></label>
                  <input className="input" type="number" min={0} required value={form.price} onChange={(e) => update("price", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tồn kho</label>
                  <input className="input" type="number" min={0} value={form.stock_quantity} onChange={(e) => update("stock_quantity", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Danh mục</label>
                <select className="input" value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
                  <option value="">Không có danh mục</option>
                  {(categories as Category[] | undefined)?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Mô tả</label>
                  {form.description && (
                    <button type="button" onClick={() => setShowDescPreview((v) => !v)}
                      className="text-xs text-gray-400 hover:text-primary flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      {showDescPreview ? "Ẩn" : "Xem trước"}
                    </button>
                  )}
                </div>
                {showDescPreview ? (
                  <div className="input min-h-[8rem] prose prose-sm max-w-none overflow-y-auto [&_h1]:text-primary [&_h2]:text-primary [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                    <ReactMarkdown>{form.description}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea className="input resize-none font-mono text-sm" rows={5}
                    placeholder="Hỗ trợ Markdown: **đậm**, # Tiêu đề, - danh sách..."
                    value={form.description} onChange={(e) => update("description", e.target.value)} />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Ảnh sản phẩm</label>
                <ImageGallery images={form.images} onChange={(imgs) => update("images", imgs)} />
              </div>

              {editProduct && <ProductVariantsSection product={editProduct} />}

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div onClick={() => update("is_active", !form.is_active)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.is_active ? "bg-primary" : "bg-gray-200"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-sm font-medium">{form.is_active ? "Đang bán" : "Đã ẩn"}</span>
              </label>
            </form>

            <div className="px-6 py-4 border-t border-light flex gap-3 shrink-0">
              <button type="submit" form="" onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? "Đang lưu..." : editProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </button>
              {editProduct && successMsg && (
                <button type="button" onClick={closeForm} className="btn-primary px-5 bg-green-600 hover:bg-green-700 border-green-600">Xong</button>
              )}
              <button type="button" onClick={closeForm} className="btn-secondary px-5">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Categories Panel ──────────────────────────────────────────────────────────

function CategoryModal({ initial, onClose }: { initial?: Category; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? "");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => initial ? productsApi.updateCategory(initial.id, name.trim()) : productsApi.createCategory(name.trim()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); onClose(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Có lỗi xảy ra");
    },
  });

  const slug = previewSlug(name);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-dark">{initial ? "Sửa danh mục" : "Thêm danh mục"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
        <input className="input w-full" placeholder="Ví dụ: Thiết bị tập" value={name} autoFocus
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) mutation.mutate(); }} />
        {name && <p className="text-xs text-gray-400 mt-1">Slug: <span className="font-mono">{slug || "—"}</span></p>}
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
          <button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}
            className="btn-primary flex-1 disabled:opacity-50">
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

const LIST_PAGE_SIZES = [10, 20, 50];

function CategoriesPanel() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"add" | Category | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.adminListCategories().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const handleDelete = (cat: Category) => {
    if (window.confirm(`Xóa danh mục "${cat.name}"?\nCác sản phẩm thuộc danh mục này sẽ không còn danh mục.`))
      deleteMutation.mutate(cat.id);
  };

  const allCats = categories as Category[];
  const total = allCats.length;
  const pages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const paginated = allCats.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{total} danh mục</p>
        <button onClick={() => setModal("add")} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm danh mục
        </button>
      </div>
      <div className="card overflow-hidden">
        {isLoading ? <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
          : total === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Chưa có danh mục nào.{" "}
              <button onClick={() => setModal("add")} className="text-primary hover:underline">Thêm ngay</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Tên</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Slug</th>
                  <th className="px-5 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light">
                {paginated.map((cat) => (
                  <tr key={cat.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-dark">{cat.name}</td>
                    <td className="px-5 py-3 hidden sm:table-cell"><span className="font-mono text-xs text-gray-400">{cat.slug}</span></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setModal(cat)} className="text-xs text-secondary hover:text-primary transition-colors font-medium">Sửa</button>
                        <button onClick={() => handleDelete(cat)} disabled={deleteMutation.isPending}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium disabled:opacity-50">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Hiển thị {from}–{to} trong {total}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">Hiển thị:</span>
              <select className="border border-light rounded-lg px-2 py-1 text-sm bg-white"
                value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {LIST_PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}
                  className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${p === page ? "bg-primary text-white border border-primary" : "border border-light bg-white hover:bg-surface"}`}>
                    {p}
                  </button>
                ))}
                <button disabled={page === pages} onClick={() => setPage(page + 1)}
                  className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">›</button>
              </div>
            )}
          </div>
        </div>
      )}
      {modal === "add" && <CategoryModal onClose={() => setModal(null)} />}
      {modal && modal !== "add" && <CategoryModal initial={modal as Category} onClose={() => setModal(null)} />}
    </div>
  );
}

// ── Attributes Panel ──────────────────────────────────────────────────────────

function AttributeModal({ initial, onClose }: { initial?: AttributeType; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? "");
  const [values, setValues] = useState<string[]>(initial?.values ?? []);
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");

  const addValue = () => {
    const v = inputVal.trim();
    if (v && !values.includes(v)) { setValues([...values, v]); }
    setInputVal("");
  };

  const mutation = useMutation({
    mutationFn: () => initial
      ? productsApi.updateAttributeType(initial.id, { name: name.trim(), values })
      : productsApi.createAttributeType({ name: name.trim(), values }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-types"] }); onClose(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Có lỗi xảy ra");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-dark">{initial ? "Sửa thuộc tính" : "Thêm thuộc tính"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên thuộc tính *</label>
            <input className="input w-full" placeholder="Ví dụ: Size, Màu sắc, Hương vị" value={name} autoFocus
              onChange={(e) => { setName(e.target.value); setError(""); }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Giá trị</label>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Nhập giá trị rồi Enter" value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue(); } }} />
              <button type="button" onClick={addValue} className="btn-secondary px-3 text-sm">+</button>
            </div>
            {values.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {values.map((v) => (
                  <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-light rounded-full text-xs font-medium">
                    {v}
                    <button type="button" onClick={() => setValues(values.filter((x) => x !== v))}
                      className="text-gray-400 hover:text-red-500 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            {values.length === 0 && <p className="text-xs text-gray-400 mt-1">Chưa có giá trị nào</p>}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
          <button onClick={() => mutation.mutate()} disabled={!name.trim() || values.length === 0 || mutation.isPending}
            className="btn-primary flex-1 disabled:opacity-50">
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AttributesPanel() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"add" | AttributeType | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: attrs = [], isLoading } = useQuery({
    queryKey: ["attribute-types"],
    queryFn: () => productsApi.listAttributeTypes().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteAttributeType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attribute-types"] }),
  });

  const handleDelete = (attr: AttributeType) => {
    if (window.confirm(`Xóa thuộc tính "${attr.name}"?`)) deleteMutation.mutate(attr.id);
  };

  const allAttrs = attrs as AttributeType[];
  const total = allAttrs.length;
  const pages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const paginated = allAttrs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">{total} thuộc tính</p>
        <div className="flex gap-2">
          <button onClick={() => setModal("add")} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm thuộc tính
          </button>
        </div>
      </div>
      <div className="card overflow-hidden">
        {isLoading ? <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
          : total === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Chưa có thuộc tính nào.{" "}
              <button onClick={() => setModal("add")} className="text-primary hover:underline">Thêm ngay</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Tên thuộc tính</th>
                  <th className="px-5 py-3 font-medium">Các giá trị</th>
                  <th className="px-5 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light">
                {paginated.map((attr) => (
                  <tr key={attr.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-dark">{attr.name}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {attr.values.map((v) => (
                          <span key={v} className="px-2 py-0.5 bg-surface border border-light rounded-full text-xs">{v}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setModal(attr)} className="text-xs text-secondary hover:text-primary transition-colors font-medium">Sửa</button>
                        <button onClick={() => handleDelete(attr)} disabled={deleteMutation.isPending}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium disabled:opacity-50">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Hiển thị {from}–{to} trong {total}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">Hiển thị:</span>
              <select className="border border-light rounded-lg px-2 py-1 text-sm bg-white"
                value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {LIST_PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}
                  className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${p === page ? "bg-primary text-white border border-primary" : "border border-light bg-white hover:bg-surface"}`}>
                    {p}
                  </button>
                ))}
                <button disabled={page === pages} onClick={() => setPage(page + 1)}
                  className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">›</button>
              </div>
            )}
          </div>
        </div>
      )}
      {modal === "add" && <AttributeModal onClose={() => setModal(null)} />}
      {modal && modal !== "add" && <AttributeModal initial={modal as AttributeType} onClose={() => setModal(null)} />}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

const TABS: { key: AdminTab; label: string }[] = [
  { key: "products", label: "Quản lý sản phẩm" },
  { key: "categories", label: "Nhóm sản phẩm" },
  { key: "attributes", label: "Thuộc tính" },
];

export default function AdminProducts() {
  const [activeTab, setActiveTab] = useState<AdminTab>("products");

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-dark">Sản phẩm</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-light mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "products" && <ProductsPanel />}
      {activeTab === "categories" && <CategoriesPanel />}
      {activeTab === "attributes" && <AttributesPanel />}
    </div>
  );
}

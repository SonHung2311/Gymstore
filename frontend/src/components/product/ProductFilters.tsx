import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../../api/products";

interface Filters {
  search: string;
  category_id: string;
  min_price: string;
  max_price: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function ProductFilters({ filters, onChange }: Props) {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.categories().then((r) => r.data),
  });

  const update = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <aside className="space-y-5">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-dark mb-1">Tìm kiếm</label>
        <input
          className="input"
          type="text"
          placeholder="Tên sản phẩm..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-dark mb-1">Danh mục</label>
        <select
          className="input"
          value={filters.category_id}
          onChange={(e) => update("category_id", e.target.value)}
        >
          <option value="">Tất cả</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-sm font-medium text-dark mb-1">Giá tối thiểu (₫)</label>
        <input
          className="input"
          type="number"
          min={0}
          placeholder="0"
          value={filters.min_price}
          onChange={(e) => update("min_price", e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark mb-1">Giá tối đa (₫)</label>
        <input
          className="input"
          type="number"
          min={0}
          placeholder="Không giới hạn"
          value={filters.max_price}
          onChange={(e) => update("max_price", e.target.value)}
        />
      </div>

      <button
        className="btn-secondary w-full"
        onClick={() => onChange({ search: "", category_id: "", min_price: "", max_price: "" })}
      >
        Xóa bộ lọc
      </button>
    </aside>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { productsApi } from "../api/products";
import ProductCard from "../components/product/ProductCard";
import ProductFilters from "../components/product/ProductFilters";
import Spinner from "../components/ui/Spinner";

const LIMIT = 12;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category_id: searchParams.get("category_id") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
  });
  const [page, setPage] = useState(1);

  // Sync URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    setSearchParams(params, { replace: true });
    setPage(1);
  }, [filters]);

  const queryParams = {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.category_id ? { category_id: Number(filters.category_id) } : {}),
    ...(filters.min_price ? { min_price: Number(filters.min_price) } : {}),
    ...(filters.max_price ? { max_price: Number(filters.max_price) } : {}),
    page,
    limit: LIMIT,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => productsApi.list(queryParams).then((r) => r.data),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-semibold mb-8">Sản phẩm</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <div className="lg:w-64 shrink-0">
          <ProductFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg">Không tìm thấy sản phẩm nào</p>
              <p className="text-sm mt-2">Thử thay đổi bộ lọc</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  Tìm thấy <span className="font-medium text-dark">{data?.total}</span> sản phẩm
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40"
                  >
                    ← Trước
                  </button>
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-primary text-white"
                          : "bg-white border border-light text-dark hover:bg-surface"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page === data.pages}
                    onClick={() => setPage(page + 1)}
                    className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

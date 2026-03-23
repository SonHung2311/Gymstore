import { Link } from "react-router-dom";
import type { Product } from "../../types";
import { useCartStore } from "../../store/cartStore";
import { cartApi } from "../../api/cart";

const PLACEHOLDER = "https://placehold.co/400x300/DEB887/8B4513?text=Gym+Store";

interface Props {
  product: Product;
  basePath?: string;  // defaults to /store
}

export default function ProductCard({ product, basePath = "/store" }: Props) {
  const { setCart } = useCartStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await cartApi.addItem(product.id);
      setCart(res.data);
    } catch {
      // Silently ignore; user can retry from product detail page
    }
  };

  return (
    <Link to={`${basePath}/products/${product.slug}`} className="card group flex flex-col hover:shadow-md transition-shadow">
      {/* Product image */}
      <div className="aspect-[4/3] overflow-hidden bg-surface">
        <img
          src={product.images[0] || PLACEHOLDER}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <span className="text-xs text-accent font-medium uppercase tracking-wide mb-1">
            {product.category.name}
          </span>
        )}
        <h3 className="text-dark font-semibold line-clamp-2 mb-2 flex-1">{product.name}</h3>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-primary font-bold text-lg">
            {product.price.toLocaleString("vi-VN")}₫
          </span>
          {product.stock_quantity > 0 ? (
            <button
              onClick={handleAddToCart}
              className="btn-primary text-sm !px-3 !py-1.5"
            >
              Thêm vào giỏ
            </button>
          ) : (
            <span className="text-sm text-gray-400 font-medium">Hết hàng</span>
          )}
        </div>
      </div>
    </Link>
  );
}

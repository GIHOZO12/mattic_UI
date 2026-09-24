import { useState } from "react";
import { ArrowUpRight, Heart } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { wishlistService } from "../../api/services";
import { useAuth, useBag, useToast } from "../../context/AppContext";
import { Image, Price } from "../common/UI";

export default function ProductCard({ product }) {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, refresh, loading: bagLoading } = useBag();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const saved = wishlist?.items?.find((item) => item.product === product.id);
  const image =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const toggle = async () => {
    if (!user) {
      navigate(
        `/login?next=${encodeURIComponent(location.pathname + location.search)}`,
      );
      return;
    }
    if (user.role !== "CUSTOMER") {
      notify("Sign in with a customer account to save products.", "error");
      return;
    }
    setBusy(true);
    try {
      if (saved) await wishlistService.remove(saved.id);
      else await wishlistService.add(product.id);
      await refresh();
      notify(
        saved ? "Removed from your wishlist." : "Saved for another occasion.",
      );
    } catch (error) {
      notify(error, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="product-card">
      <div className="product-picture">
        <Link
          to={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
        >
          <Image src={image?.image} alt={image?.alt_text || product.name} />
        </Link>
        {product.sale_price !== null && product.sale_price !== undefined && (
          <span className="product-tag">The considered price</span>
        )}
        <button
          className={`wish-button ${saved ? "saved" : ""}`}
          onClick={toggle}
          disabled={busy || authLoading || bagLoading}
          aria-label={`${saved ? "Remove" : "Save"} ${product.name} ${saved ? "from" : "to"} wishlist`}
          aria-pressed={Boolean(saved)}
          data-tooltip={saved ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        <Link to={`/products/${product.slug}`} className="product-quick">
          Discover
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="product-meta">
        <div>
          <p className="product-category">{product.category?.name}</p>
          <Link to={`/products/${product.slug}`}>
            <h3>{product.name}</h3>
          </Link>
        </div>
        <Price value={product.current_price} original={product.base_price} />
      </div>
      <div className="product-swatches">
        {product.available_colors?.slice(0, 5).map((color) => (
          <span
            key={color.id}
            style={{ backgroundColor: color.hex_code }}
            title={color.name}
            aria-label={color.name}
          />
        ))}
        {!product.in_stock && <small>Currently unavailable</small>}
      </div>
    </article>
  );
}

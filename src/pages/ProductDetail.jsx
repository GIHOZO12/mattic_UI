import { useEffect, useState } from "react";
import { ArrowRight, Heart, ShieldCheck, Smartphone, Star } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { cartService, productService, wishlistService } from "../api/services";
import { useAuth, useBag, useStore, useToast } from "../context/AppContext";
import { useAction, useResource } from "../hooks/useResource";
import { selectVariant } from "../utils/format";
import {
  Breadcrumbs,
  Button,
  ErrorState,
  Image,
  Price,
  QuantitySelector,
  Skeleton,
} from "../components/common/UI";

export default function ProductDetail() {
  const { slug } = useParams();
  const resource = useResource(
    ["product", slug],
    (signal) => productService.detail(slug, signal),
    true,
    15000,
  );
  const product = resource.data;
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const { refresh, wishlist, loading: bagLoading } = useBag();
  const { colors, settings } = useStore();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const action = useAction();
  useEffect(() => {
    const first =
      product?.variants?.find((v) => v.is_available && v.stock_quantity > 0) ||
      product?.variants?.[0];
    setSize((previous) =>
      product?.variants?.some((v) => v.size === previous)
        ? previous
        : first?.size || "",
    );
    setColor((previous) =>
      product?.variants?.some((v) => v.color === previous)
        ? previous
        : first?.color || "",
    );
  }, [product]);
  useEffect(() => {
    const variant = selectVariant(product?.variants || [], size, color);
    setQuantity((previous) => Math.min(previous, variant?.stock_quantity || 1));
  }, [product, size, color]);
  useEffect(() => {
    setSize("");
    setColor("");
    setQuantity(1);
    setImageIndex(0);
  }, [slug]);
  if (resource.loading)
    return (
      <div className="container page-space">
        <Skeleton count={2} />
      </div>
    );
  if (resource.error)
    return (
      <div className="container page-space">
        <ErrorState error={resource.error} retry={resource.reload} />
      </div>
    );
  if (!product) return null;
  const variants = product.variants || [];
  const selected = selectVariant(variants, size, color);
  const sizeChoices = [
    ...new Map(
      variants.map((v) => [v.size, { id: v.size, name: v.size_name }]),
    ).values(),
  ];
  const colorChoices = [
    ...new Map(
      variants.map((v) => [v.color, { id: v.color, name: v.color_name }]),
    ).values(),
  ];
  const images = [...product.images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  const saved = wishlist?.items?.find((item) => item.product === product.id);
  const requireCustomer = () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return false;
    }
    if (user.role !== "CUSTOMER") {
      notify("Please use a customer account for shopping.", "error");
      return false;
    }
    return true;
  };
  const addToBag = () => {
    if ((user && !requireCustomer()) || !selected) return;
    action.run(async () => {
      await cartService.add(selected.id, quantity);
      await refresh();
      notify("A good choice. Added to your bag.");
    });
  };
  const save = () => {
    if (!requireCustomer()) return;
    action.run(async () => {
      if (saved) await wishlistService.remove(saved.id);
      else await wishlistService.add(product.id);
      await refresh();
      notify(saved ? "Removed from your wishlist." : "Saved to your wishlist.");
    });
  };
  return (
    <div className="container page-space">
      <Breadcrumbs
        items={[
          { label: "Shop", to: "/shop" },
          {
            label: product.category.name,
            to: `/shop/${product.category.slug}`,
          },
          { label: product.name },
        ]}
      />
      <div className="product-detail">
        <div className="gallery">
          <div className="gallery-main">
            <Image
              eager
              src={images[imageIndex]?.image}
              alt={images[imageIndex]?.alt_text || product.name}
            />
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((image, i) => (
                <button
                  key={image.id}
                  className={i === imageIndex ? "selected" : ""}
                  onClick={() => setImageIndex(i)}
                  aria-label={`View product image ${i + 1}`}
                  aria-pressed={i === imageIndex}
                >
                  <Image src={image.image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-purchase">
          <p className="eyebrow">{product.category.name}</p>
          <h1>{product.name}</h1>
          <Price
            value={selected?.effective_price ?? product.current_price}
            original={selected?.price == null ? product.base_price : null}
          />
          <p className="product-description">
            {product.short_description ||
              "A considered addition to your wardrobe. Explore the details and find your fit."}
          </p>
          {product.review_count > 0 && (
            <a className="rating-link" href="#reviews">
              <Star size={16} fill="currentColor" />
              {product.average_rating} · {product.review_count} reviews
            </a>
          )}
          <fieldset className="variant-group">
            <legend>
              Color{" "}
              <span>{colorChoices.find((c) => c.id === color)?.name}</span>
            </legend>
            <div className="swatch-buttons">
              {colorChoices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={color === c.id ? "selected" : ""}
                  aria-label={`Color: ${c.name}`}
                  disabled={
                    !variants.some(
                      (v) =>
                        v.color === c.id &&
                        v.is_available &&
                        v.stock_quantity > 0,
                    )
                  }
                  data-tooltip={`${c.name}${variants.some((v) => v.color === c.id && v.is_available && v.stock_quantity > 0) ? "" : " — sold out"}`}
                  aria-pressed={color === c.id}
                  onClick={() => {
                    setColor(c.id);
                    const match =
                      selectVariant(variants, size, c.id) ||
                      variants.find(
                        (v) =>
                          v.color === c.id &&
                          v.is_available &&
                          v.stock_quantity > 0,
                      );
                    setSize(match?.size || size);
                    setQuantity(1);
                  }}
                >
                  <span
                    style={{
                      backgroundColor:
                        colors.find((v) => v.id === c.id)?.hex_code ||
                        "#c8cbc9",
                    }}
                  />
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="variant-group">
            <legend>
              Size
              <Link to="/info/size-guide">
                Size guide <ArrowRight size={12} />
              </Link>
            </legend>
            <div className="size-buttons">
              {sizeChoices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={!selectVariant(variants, s.id, color)}
                  className={size === s.id ? "selected" : ""}
                  aria-pressed={size === s.id}
                  aria-label={`Size ${s.name}${selectVariant(variants, s.id, color) ? "" : " — unavailable"}`}
                  onClick={() => {
                    setSize(s.id);
                    setQuantity(1);
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </fieldset>
          <p
            role="status"
            className={`stock-label ${selected ? "" : "unavailable"}`}
          >
            <span />
            {selected
              ? `In stock · ${selected.stock_quantity} available`
              : "This combination is currently unavailable"}
          </p>
          <div className="purchase-actions">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={selected?.stock_quantity || 1}
              disabled={!selected || action.busy}
            />
            <Button
              onClick={addToBag}
              disabled={!selected || authLoading}
              busy={action.busy}
            >
              Add to bag <ArrowUpRightIcon />
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={save}
            busy={action.busy}
            disabled={authLoading || bagLoading}
          >
            <Heart size={17} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved to wishlist" : "Add to wishlist"}
          </Button>
          <ErrorState error={action.error} compact />
          <div className="purchase-notes">
            <span>
              <Smartphone size={17} />
              Pay with MTN MoMo
            </span>
            <span>
              <ShieldCheck size={17} />
              Track your order online
            </span>
          </div>
          <div className="product-accordions">
            <details open>
              <summary>The details</summary>
              <p>
                {product.description ||
                  "Product details will be added by the store."}
              </p>
              {product.material && <p>Material: {product.material}</p>}
            </details>
            <details>
              <summary>Delivery & ordering</summary>
              <p>
                Your final shipping fee is confirmed at checkout. Payment is
                verified manually before your order is prepared.
              </p>
              {settings?.support_phone && (
                <p>Need help? {settings.support_phone}</p>
              )}
              <Link to="/info/delivery">More about delivery</Link>
            </details>
            <details>
              <summary>Finding your fit</summary>
              <p>
                Choose from the sizes listed above. For specific garment
                measurements, contact the store before ordering.
              </p>
              <Link to="/info/size-guide">Read the size guide</Link>
            </details>
          </div>
        </div>
      </div>
      <section id="reviews" className="section product-reviews">
        <div className="section-header">
          <h2>Worn. Loved. Reviewed.</h2>
          <span>{product.review_count} approved reviews</span>
        </div>
        {product.reviews?.length ? (
          product.reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <span
                aria-label={`${review.rating} out of 5 stars`}
                className="stars"
              >
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </span>
              <h3>{review.title}</h3>
              <p>{review.comment}</p>
              <small>{review.customer_name || "Verified purchaser"}</small>
            </article>
          ))
        ) : (
          <p className="muted">
            Be the first to share your thoughts. Reviews open after your order
            is delivered.
          </p>
        )}
      </section>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={17} className="-rotate-45" />;
}

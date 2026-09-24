import { EmptyState, ErrorState, Skeleton } from "../common/UI";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products = [],
  loading,
  error,
  retry,
  count = 4,
}) {
  if (loading) return <Skeleton count={count} />;
  if (error) return <ErrorState error={error} retry={retry} />;
  if (!products.length)
    return (
      <EmptyState
        title="Nothing here just yet."
        message="Try a different selection, or explore the rest of the collection."
      />
    );
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

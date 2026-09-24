import { Trash2 } from "lucide-react";
import { productService, wishlistService } from "../api/services";
import { useBag, useToast } from "../context/AppContext";
import { useAction, useResource } from "../hooks/useResource";
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeading,
  Skeleton,
} from "../components/common/UI";
import ProductCard from "../components/product/ProductCard";

function SavedProduct({ item }) {
  const resource = useResource(["saved-product", item.product], (signal) =>
    productService.detail(item.product, signal),
  );
  const { refresh } = useBag();
  const notify = useToast();
  const action = useAction();
  if (resource.loading) return <div className="skeleton" />;
  if (resource.error)
    return (
      <div className="panel">
        <h3>{item.product_name}</h3>
        <p className="muted">This saved piece is currently unavailable.</p>
        <Button
          variant="outline"
          busy={action.busy}
          onClick={() =>
            action.run(async () => {
              await wishlistService.remove(item.id);
              await refresh();
              notify("Removed from wishlist.");
            })
          }
        >
          <Trash2 size={15} />
          Remove saved item
        </Button>
        <ErrorState error={action.error} compact />
      </div>
    );
  return <ProductCard product={resource.data} />;
}
export default function Wishlist({ embedded = false }) {
  const { wishlist, error, loading, refresh } = useBag();
  return (
    <div className={embedded ? "" : "container page-space"}>
      <PageHeading eyebrow="KEEP A GOOD THING CLOSE" title="Your wishlist." />
      {loading && !wishlist ? (
        <Skeleton />
      ) : error ? (
        <ErrorState error={error} retry={() => refresh().catch(() => {})} />
      ) : !wishlist?.items?.length ? (
        <EmptyState
          title="For the ones you keep thinking about."
          message="Tap the heart on a piece you love. You’ll find it here."
        />
      ) : (
        <div className="product-grid">
          {wishlist.items.map((item) => (
            <SavedProduct key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

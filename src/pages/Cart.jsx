import { ArrowRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cartService, productService } from "../api/services";
import { useBag, useToast } from "../context/AppContext";
import { useAction, useResource } from "../hooks/useResource";
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  Image,
  PageHeading,
  Price,
  QuantitySelector,
  Skeleton,
} from "../components/common/UI";
import OrderSummary from "../components/checkout/OrderSummary";

export function BagItem({ item, readOnly = false }) {
  const product = useResource(
    ["cart-product", item.variant.product],
    (signal) => productService.detail(item.variant.product, signal),
  );
  const { refresh } = useBag();
  const action = useAction();
  const notify = useToast();
  const data = product.data;
  const image = data?.images?.find((i) => i.is_primary) || data?.images?.[0];
  const update = (quantity) =>
    action.run(async () => {
      await cartService.update(item.id, quantity);
      await refresh();
    });
  const remove = () =>
    action.run(async () => {
      await cartService.remove(item.id);
      await refresh();
      notify("Removed from your bag.");
    });
  return (
    <article className="bag-item">
      <Link
        to={`/products/${data?.slug || item.variant.product}`}
        className="bag-image"
      >
        <Image src={image?.image} alt={data?.name || item.variant.sku} />
      </Link>
      <div className="bag-description">
        <p className="eyebrow">{data?.category?.name || "YOUR SELECTION"}</p>
        <Link to={`/products/${data?.slug || item.variant.product}`}>
          <h3>{data?.name || item.variant.sku}</h3>
        </Link>
        <p>
          {item.variant.color_name} <span>/</span> Size {item.variant.size_name}
        </p>
        <Price value={item.unit_price} />
        <ErrorState error={action.error} compact />
        {product.error && (
          <small>
            This product is no longer available in the public catalog. Remove it
            before checking out.
          </small>
        )}
      </div>
      <div className="bag-controls">
        {readOnly ? (
          <span>Qty {item.quantity}</span>
        ) : (
          <QuantitySelector
            value={item.quantity}
            max={item.variant.stock_quantity}
            onChange={update}
            disabled={action.busy}
          />
        )}
        <Price value={item.subtotal} />
        {!readOnly && (
          <button
            className="text-button muted"
            onClick={remove}
            disabled={action.busy}
          >
            <Trash2 size={14} />
            Remove
          </button>
        )}
      </div>
    </article>
  );
}

export default function Cart() {
  const { cart, loading, error, refresh } = useBag();
  return (
    <div className="container page-space">
      <PageHeading eyebrow="YOUR GOOD CHOICES" title="The shopping bag.">
        {cart?.total_quantity || 0} pieces, waiting for their next occasion.
      </PageHeading>
      {loading && !cart ? (
        <Skeleton rows count={3} />
      ) : error ? (
        <ErrorState error={error} retry={() => refresh().catch(() => {})} />
      ) : !cart?.items?.length ? (
        <EmptyState
          title="Your bag has possibilities."
          message="Find a piece you love. We’ll keep it here for you."
        />
      ) : (
        <div className="checkout-layout">
          <div>
            {cart.items.map((item) => (
              <BagItem item={item} key={item.id} />
            ))}
            <Link className="text-link mt-6" to="/shop">
              Continue exploring
              <ArrowRight size={16} />
            </Link>
          </div>
          <OrderSummary cart={cart}>
            <ButtonLink to="/checkout" className="w-full">
              Continue to checkout
              <ArrowRight size={16} />
            </ButtonLink>
          </OrderSummary>
        </div>
      )}
    </div>
  );
}

import { ArrowRight, RefreshCw } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AppContext";
import { orderService } from "../api/services";
import { useResource } from "../hooks/useResource";
import { canSubmitPayment, formatDate } from "../utils/format";
import {
  Badge,
  Breadcrumbs,
  Button,
  ButtonLink,
  ErrorState,
  PageHeading,
  Price,
  Skeleton,
} from "../components/common/UI";
import { AddressText } from "../components/account/AddressBook";
import {
  OrderProgress,
  PrivateProof,
  ReviewForm,
} from "../components/account/OrderComponents";
import OrderSummary from "../components/checkout/OrderSummary";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const resource = useResource(["order", id], (signal) =>
    orderService.detail(id, signal),
  );
  if (resource.loading) return <Skeleton rows count={3} />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const order = resource.data;
  if (!order) return null;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "My orders", to: user ? "/account/orders" : "/orders" },
          { label: order.order_number },
        ]}
      />
      <PageHeading
        eyebrow={formatDate(order.created_at)}
        title="Your order, every step."
        action={
          <Button variant="outline" onClick={resource.reload}>
            <RefreshCw size={15} />
            Refresh
          </Button>
        }
      >
        <span className="order-number">{order.order_number}</span>
      </PageHeading>
      <div className="button-row mb-8">
        <Badge status={order.status} />
        <Badge status={order.payment_status} />
      </div>
      <OrderProgress order={order} />
      {canSubmitPayment(order) && (
        <div className="payment-reminder">
          <div>
            <h2>
              {order.payment.status === "REJECTED"
                ? "We need a clearer picture."
                : "Ready when you are."}
            </h2>
            <p>
              {order.payment.status === "REJECTED"
                ? order.payment.admin_note ||
                  "Please submit a new payment screenshot."
                : "Complete your MoMo payment and upload your screenshot to confirm your order."}
            </p>
          </div>
          <ButtonLink to={`/payment/${id}`}>
            {order.payment.status === "REJECTED"
              ? "Resubmit payment proof"
              : "Complete payment"}
            <ArrowRight size={16} />
          </ButtonLink>
        </div>
      )}
      <div className="order-detail-layout">
        <div className="panel">
          <h2>The pieces you chose</h2>
          {order.items.map((item) => (
            <div className="order-line" key={item.id}>
              <div>
                <h3>{item.product_name}</h3>
                <p>
                  {item.color} / Size {item.size} / Qty {item.quantity}
                </p>
                <small>{item.sku}</small>
              </div>
              <Price value={item.subtotal} currency={order.payment.currency} />
            </div>
          ))}
          {user &&
            order.status === "DELIVERED" &&
            [...new Map(order.items.map((i) => [i.product, i])).values()].map(
              (item) => <ReviewForm key={item.product} item={item} />,
            )}
          <h3 className="mt-8">Delivery address</h3>
          <div className="address-text mt-3">
            <AddressText
              address={{
                ...order.shipping_address,
                full_name: order.customer_name,
                phone_number: order.customer_phone,
              }}
            />
          </div>
          {order.customer_note && (
            <p className="mt-4">Your note: {order.customer_note}</p>
          )}
        </div>
        <OrderSummary order={order} />
      </div>
      {order.payment.screenshot_url && (
        <details className="panel mt-6">
          <summary>Your payment proof</summary>
          <PrivateProof payment={order.payment} />
        </details>
      )}
    </>
  );
}

import { Check, Copy, ArrowRight, Smartphone } from "lucide-react";
import { useParams } from "react-router-dom";
import { orderService } from "../api/services";
import { useAuth, useToast } from "../context/AppContext";
import { useResource } from "../hooks/useResource";
import { canSubmitPayment } from "../utils/format";
import {
  Badge,
  Button,
  ButtonLink,
  ErrorState,
  PageHeading,
  Price,
  Skeleton,
} from "../components/common/UI";
import PaymentProofUploader from "../components/checkout/PaymentProofUploader";
import OrderSummary from "../components/checkout/OrderSummary";

export default function Payment() {
  const { id } = useParams();
  const { user } = useAuth();
  const order = useResource(["payment-order", id], (signal) =>
    orderService.detail(id, signal),
  );
  const notify = useToast();
  if (order.loading)
    return (
      <div className="container page-space">
        <Skeleton rows count={3} />
      </div>
    );
  if (order.error)
    return (
      <div className="container page-space">
        <ErrorState error={order.error} retry={order.reload} />
      </div>
    );
  const data = order.data;
  if (!data) return null;
  const instructions = data.payment.instructions_snapshot;
  const submitted = data.payment.status === "SUBMITTED";
  if (!canSubmitPayment(data))
    return (
      <div className="container page-space">
        <div className="payment-success">
          <div className="success-symbol">
            <Check size={32} />
          </div>
          <p className="eyebrow">{data.order_number}</p>
          <h1>
            {submitted ? "Payment submitted." : "Your order is up to date."}
          </h1>
          <p>
            {submitted
              ? "Your payment proof has been received and is awaiting verification."
              : "Visit your order to see its current payment and delivery status."}
          </p>
          {!user && (
            <p>
              Keep your order number. You can return to My orders in this
              browser to check progress.
            </p>
          )}
          <Badge status={data.payment.status} />
          <ButtonLink to={user ? `/account/orders/${id}` : `/orders/${id}`}>
            View your order
            <ArrowRight size={16} />
          </ButtonLink>
        </div>
      </div>
    );
  return (
    <div className="container page-space">
      <PageHeading eyebrow="ONE LAST STEP" title="Pay with MTN Mobile Money.">
        Order {data.order_number}
        {!user && (
          <span className="form-note block">
            Keep your order number and use this browser to return to your order.
          </span>
        )}
      </PageHeading>
      <div className="checkout-layout">
        <div>
          <div className="momo-card">
            <div className="momo-brand">
              <Smartphone size={25} />
              <span>MTN Mobile Money</span>
            </div>
            <p className="eyebrow">YOUR ORDER TOTAL</p>
            <Price value={data.total_amount} currency={data.payment.currency} />
            <div className="merchant-code">
              <span>Pay to {instructions.merchant_name}</span>
              <small>Mobile Money number</small>
              <strong>{instructions.momo_phone_number || "0784888458"}</strong>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      instructions.momo_phone_number || "0784888458",
                    );
                    notify("Mobile Money number copied.");
                  } catch {
                    notify(
                      "Copy is unavailable. Select and copy the number shown above.",
                      "error",
                    );
                  }
                }}
              >
                <Copy size={15} />
                Copy number
              </Button>
            </div>
            <h2>How to pay</h2>
            <p className="payment-instructions">
              {instructions.payment_instructions}
            </p>
            <p className="form-note">
              Pay the exact amount shown above. Your order is confirmed after
              the store verifies your payment.
            </p>
          </div>
          {data.payment.status === "REJECTED" && (
            <div className="error-state">
              <div>
                <strong>Please submit a new screenshot</strong>
                <p>
                  {data.payment.admin_note ||
                    "The store could not verify your previous proof."}
                </p>
              </div>
            </div>
          )}
          <PaymentProofUploader
            orderId={id}
            onSuccess={() => {
              order.reload();
              notify("Payment proof submitted.");
            }}
          />
        </div>
        <OrderSummary order={data} />
      </div>
    </div>
  );
}

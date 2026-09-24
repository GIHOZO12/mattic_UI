import { useState } from "react";
import { ArrowRight, Check, RefreshCw, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { dashboardService } from "../../api/services";
import { useAction, useResource } from "../../hooks/useResource";
import { useStore, useToast } from "../../context/AppContext";
import { formatDate, nextOrderStatus, statusLabel } from "../../utils/format";
import {
  Badge,
  Breadcrumbs,
  Button,
  ConfirmDialog,
  ErrorState,
  Field,
  PageHeading,
  Price,
  Skeleton,
} from "../../components/common/UI";
import { AddressText } from "../../components/account/AddressBook";
import {
  OrderProgress,
  PrivateProof,
} from "../../components/account/OrderComponents";
import OrderSummary from "../../components/checkout/OrderSummary";
import { useAdminReferences } from "./AdminContext";
import ResourceForm from "./ResourceForm";
import { resources } from "./resources";

export function AdminPaymentDetail() {
  const { id } = useParams();
  const resource = useResource(["admin-payment", id], (signal) =>
    dashboardService.detail("payments", id, signal),
  );
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState(null);
  const action = useAction();
  const notify = useToast();
  const refs = useAdminReferences();
  if (resource.loading) return <Skeleton rows count={3} />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const payment = resource.data;
  if (!payment) return null;
  const confirm = () =>
    action.run(async () => {
      if (decision === "verify") await dashboardService.verify(id, note);
      else await dashboardService.reject(id, note);
      setDecision(null);
      resource.reload();
      refs.reload();
      notify(
        decision === "verify"
          ? "Payment verified. Order confirmed and stock updated."
          : "Payment rejected. The customer can submit new proof.",
      );
    });
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Payments", to: "/dashboard/payments" },
          { label: payment.order_number },
        ]}
      />
      <PageHeading
        eyebrow="PAYMENT REVIEW"
        title="Take a closer look."
        action={
          <Button variant="outline" onClick={resource.reload}>
            <RefreshCw size={15} />
            Refresh
          </Button>
        }
      >
        {payment.order_number}
      </PageHeading>
      <div className="payment-review-layout">
        <section className="panel">
          <h2>Submitted screenshot</h2>
          <PrivateProof payment={payment} />
        </section>
        <aside className="panel payment-review-details">
          <Badge status={payment.status} />
          <p className="eyebrow mt-8">EXPECTED AMOUNT</p>
          <Price value={payment.amount} currency={payment.currency} />
          <dl className="detail-list">
            <div>
              <dt>Customer</dt>
              <dd>{payment.customer}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatDate(payment.submitted_at)}</dd>
            </div>
            <div>
              <dt>Transaction reference</dt>
              <dd>{payment.transaction_reference || "Not provided"}</dd>
            </div>
          </dl>
          <Link to={`/dashboard/orders/${payment.order}`} className="text-link">
            Open order
            <ArrowRight size={15} />
          </Link>
          {payment.status === "SUBMITTED" ? (
            <>
              <div className="review-note">
                Check the amount and reference against the merchant’s
                transaction records before confirming.
              </div>
              <Field label="Verification / rejection note">
                <textarea
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  placeholder="Add context for this decision. Rejection notes are visible to the customer."
                />
              </Field>
              <div className="button-row">
                <Button
                  variant="outline"
                  onClick={() => setDecision("reject")}
                  disabled={action.busy}
                >
                  <X size={16} />
                  Reject payment
                </Button>
                <Button
                  onClick={() => setDecision("verify")}
                  disabled={action.busy}
                >
                  <Check size={16} />
                  Verify payment
                </Button>
              </div>
            </>
          ) : (
            <div className="review-note">
              <p>{payment.admin_note || "No decision note was added."}</p>
              {payment.verified_at && (
                <span>Verified {formatDate(payment.verified_at)}</span>
              )}
            </div>
          )}
          <ErrorState error={action.error} compact />
        </aside>
      </div>
      <ConfirmDialog
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
        busy={action.busy}
        danger={decision === "reject"}
        title={
          decision === "verify"
            ? "Verify this payment?"
            : "Reject this payment?"
        }
        message={
          decision === "verify"
            ? "Confirm you checked the payment in your merchant records. Django will confirm the order and deduct its stock once."
            : "The customer will see your note and may upload a new screenshot."
        }
        onConfirm={confirm}
      />
    </>
  );
}

export function AdminOrderDetail() {
  const { id } = useParams();
  const resource = useResource(["admin-order", id], (signal) =>
    dashboardService.detail("orders", id, signal),
  );
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState("");
  const action = useAction();
  const notify = useToast();
  if (resource.loading) return <Skeleton rows count={3} />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const order = resource.data;
  if (!order) return null;
  const next = nextOrderStatus(order);
  const cancellable =
    ["PENDING_PAYMENT", "PAYMENT_SUBMITTED"].includes(order.status) &&
    order.payment_status !== "PAID";
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Orders", to: "/dashboard/orders" },
          { label: order.order_number },
        ]}
      />
      <PageHeading
        eyebrow={formatDate(order.created_at)}
        title={order.order_number}
      >
        <span>{order.customer_email}</span>
      </PageHeading>
      <div className="button-row mb-8">
        <Badge status={order.status} />
        <Badge status={order.payment_status} />
      </div>
      <OrderProgress order={order} />
      <div className="order-detail-layout">
        <section className="panel">
          <h2>The order</h2>
          {order.items.map((item) => (
            <div className="order-line" key={item.id}>
              <div>
                <h3>{item.product_name}</h3>
                <p>
                  {item.color} / {item.size} / Qty {item.quantity}
                </p>
                <small>{item.sku}</small>
              </div>
              <Price value={item.subtotal} currency={order.payment.currency} />
            </div>
          ))}
          <h3 className="mt-8">Deliver to</h3>
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
            <div className="review-note">
              Customer note: {order.customer_note}
            </div>
          )}
          <Link
            className="text-link mt-6"
            to={`/dashboard/payments/${order.payment.id}`}
          >
            View payment & screenshot
            <ArrowRight size={15} />
          </Link>
        </section>
        <OrderSummary order={order} />
      </div>
      <section className="panel mt-6">
        <h2>Move the order forward</h2>
        <p className="muted mb-6">
          Payment must be verified before fulfillment. Only the next valid
          delivery step is available.
        </p>
        {order.admin_note && (
          <p className="review-note">Last note: {order.admin_note}</p>
        )}
        <Field label="Order note">
          <textarea
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <div className="button-row">
          {next && (
            <Button onClick={() => setTarget(next)}>
              Mark as {statusLabel(next)}
              <ArrowRight size={16} />
            </Button>
          )}
          {cancellable && (
            <Button variant="outline" onClick={() => setTarget("CANCELLED")}>
              Cancel unpaid order
            </Button>
          )}
          {!next && !cancellable && <Badge status={order.status} />}
        </div>
        <ErrorState error={action.error} compact />
      </section>
      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        busy={action.busy}
        danger={target === "CANCELLED"}
        title={`Mark this order ${statusLabel(target)}?`}
        message="The customer will see the updated order status."
        onConfirm={() =>
          action.run(async () => {
            await dashboardService.transition(id, target, note);
            setTarget(null);
            resource.reload();
            notify("Order status updated.");
          })
        }
      />
    </>
  );
}

export function AdminCustomerDetail() {
  const { id } = useParams();
  const resource = useResource(["admin-customer", id], (signal) =>
    dashboardService.detail("customers", id, signal),
  );
  if (resource.loading) return <Skeleton rows count={3} />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const customer = resource.data;
  if (!customer) return null;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Customers", to: "/dashboard/customers" },
          { label: customer.email },
        ]}
      />
      <PageHeading
        eyebrow="YOUR CUSTOMER"
        title={
          `${customer.first_name} ${customer.last_name}`.trim() ||
          customer.email
        }
      >
        {customer.email} · Joined {formatDate(customer.date_joined)}
      </PageHeading>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Orders</span>
          <strong>{customer.number_of_orders}</strong>
        </div>
        <div className="stat-card">
          <span>Paid purchases</span>
          <Price value={customer.total_spent} />
        </div>
        <div className="stat-card">
          <span>Phone</span>
          <strong className="small">
            {customer.phone_number || "Not provided"}
          </strong>
        </div>
      </div>
      <section className="panel mt-8">
        <h2>Recent orders</h2>
        {customer.recent_orders?.length ? (
          customer.recent_orders.map((order) => (
            <Link
              className="order-line"
              key={order.id}
              to={`/dashboard/orders/${order.id}`}
            >
              <strong>{order.order_number}</strong>
              <Badge status={order.status} />
              <Price
                value={order.total_amount}
                currency={order.payment.currency}
              />
              <ArrowRight size={16} />
            </Link>
          ))
        ) : (
          <p className="muted">This customer has not placed an order yet.</p>
        )}
      </section>
    </>
  );
}

export function AdminSettings({ payment = false }) {
  const name = payment ? "payment-settings" : "settings";
  const resource = useResource(["admin-settings", name], () =>
    dashboardService.all(name),
  );
  const store = useStore();
  const notify = useToast();
  if (resource.loading) return <Skeleton rows count={3} />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const record =
    resource.data?.find((row) => (payment ? row.is_active : row.active)) ||
    resource.data?.[0];
  return (
    <>
      <PageHeading eyebrow="THE STORE ESSENTIALS" title={resources[name].title}>
        {resources[name].description}
      </PageHeading>
      {payment && (
        <div className="review-note mb-8">
          The published code and instructions are shown during checkout.
          Existing orders retain their original payment instructions. Keep the
          currency consistent with your store settings.
        </div>
      )}
      <section className="panel max-w-4xl">
        <ResourceForm
          key={`${name}-${record?.updated_at || "new"}`}
          resource={name}
          config={resources[name]}
          record={record}
          onSaved={() => {
            resource.reload();
            store.refresh();
            notify("Store settings saved.");
          }}
        />
      </section>
    </>
  );
}

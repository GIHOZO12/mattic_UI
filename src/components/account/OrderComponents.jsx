import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, Check, Download, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { paymentService, reviewService } from "../../api/services";
import { useAction, useResource } from "../../hooks/useResource";
import { useAuth, useToast } from "../../context/AppContext";
import { formatDate, statusLabel } from "../../utils/format";
import {
  Badge,
  Button,
  ErrorState,
  Field,
  Price,
  Skeleton,
} from "../common/UI";

export function OrderCard({ order }) {
  const { user } = useAuth();
  return (
    <Link
      className="order-card"
      to={user ? `/account/orders/${order.id}` : `/orders/${order.id}`}
    >
      <div>
        <p className="eyebrow">{formatDate(order.created_at)}</p>
        <h3>{order.order_number}</h3>
        <span>
          {order.items.length} {order.items.length === 1 ? "piece" : "pieces"}
        </span>
      </div>
      <div>
        <Price value={order.total_amount} currency={order.payment?.currency} />
        <Badge status={order.status} />
        <span className="muted text-sm">
          {statusLabel(order.payment_status)}
        </span>
      </div>
      <ArrowRight size={18} />
    </Link>
  );
}

export function OrderProgress({ order }) {
  const steps = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const current = steps.indexOf(order.status);
  if (order.status === "CANCELLED")
    return (
      <div className="panel">
        <Badge status="CANCELLED" />
        <p>This order has been cancelled.</p>
      </div>
    );
  return (
    <ol className="order-progress" aria-label="Order progress">
      {steps.map((step, i) => (
        <li
          key={step}
          className={i <= current ? "complete" : ""}
          aria-current={i === current ? "step" : undefined}
        >
          <span>{i <= current ? <Check size={16} /> : `0${i + 1}`}</span>
          <strong>{statusLabel(step)}</strong>
        </li>
      ))}
    </ol>
  );
}

export function PrivateProof({ payment }) {
  const resource = useResource(
    ["private-proof", payment.id, payment.submitted_at],
    () => paymentService.download(payment.id),
    Boolean(payment.screenshot_url),
  );
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!resource.data) {
      setUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(resource.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [resource.data]);
  if (!payment.screenshot_url)
    return <p className="muted">No payment screenshot has been submitted.</p>;
  if (resource.loading) return <Skeleton rows count={2} />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  return (
    <div className="private-proof">
      {url && (
        <>
          <img src={url} alt="Submitted payment screenshot" />
          <a
            href={url}
            download={`payment-${payment.id}`}
            className="text-link"
          >
            <Download size={16} />
            Download screenshot
          </a>
        </>
      )}
    </div>
  );
}

export function ReviewForm({ item }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { rating: "5" } });
  const [done, setDone] = useState(false);
  const action = useAction();
  const notify = useToast();
  if (done)
    return (
      <div className="review-thanks">
        <Check size={18} />
        <p>Thank you. Your review is waiting for approval.</p>
      </div>
    );
  return (
    <details className="review-form">
      <summary>
        <Star size={16} />
        Review {item.product_name}
      </summary>
      <form
        onSubmit={handleSubmit((values) =>
          action.run(async () => {
            await reviewService.create({
              ...values,
              rating: Number(values.rating),
              product: item.product,
            });
            setDone(true);
            notify("Review submitted for moderation.");
          }),
        )}
      >
        <Field label="Your rating">
          <select {...register("rating")}>
            <option value="5">★★★★★ — Excellent</option>
            <option value="4">★★★★☆ — Very good</option>
            <option value="3">★★★☆☆ — Good</option>
            <option value="2">★★☆☆☆ — Fair</option>
            <option value="1">★☆☆☆☆ — Disappointing</option>
          </select>
        </Field>
        <Field label="Review title" error={errors.title}>
          <input
            maxLength={160}
            {...register("title", { required: "Add a short title." })}
          />
        </Field>
        <Field label="Tell us about your piece" error={errors.comment}>
          <textarea
            rows={3}
            {...register("comment", { required: "Share your experience." })}
          />
        </Field>
        <ErrorState error={action.error} compact />
        <Button type="submit" busy={action.busy}>
          Submit review
        </Button>
      </form>
    </details>
  );
}

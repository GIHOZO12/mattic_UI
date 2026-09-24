import { useEffect, useId, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  LoaderCircle,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { errorMessage, mediaUrl } from "../../api/client";
import { formatMoney, statusLabel } from "../../utils/format";
import { useStore } from "../../context/AppContext";

export function Button({
  children,
  variant = "primary",
  busy,
  className = "",
  disabled,
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function ButtonLink({
  children,
  to,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <Link to={to} className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </Link>
  );
}
export function Price({ value, original, currency, className = "" }) {
  const store = useStore();
  return (
    <span className={`price ${className}`}>
      <span>{formatMoney(value, currency || store.currency)}</span>
      {original != null && Number(original) > Number(value) && (
        <del>{formatMoney(original, currency || store.currency)}</del>
      )}
    </span>
  );
}
export function Badge({ status, children }) {
  return (
    <span className={`badge status-${String(status || "").toLowerCase()}`}>
      {children || statusLabel(status)}
    </span>
  );
}
export function ErrorState({ error, retry, compact = false }) {
  if (!error) return null;
  return (
    <div role="alert" className={`error-state ${compact ? "compact" : ""}`}>
      <AlertCircle size={20} />
      <div>
        <strong>We couldn’t complete that request</strong>
        <p>{errorMessage(error)}</p>
        {retry && (
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
export function Skeleton({ count = 4, rows = false }) {
  return (
    <div
      aria-label="Loading"
      aria-busy="true"
      className={rows ? "skeleton-rows" : "product-grid"}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skeleton ${rows ? "row" : ""}`} />
      ))}
    </div>
  );
}
export function EmptyState({
  title = "A little room for something new.",
  message,
  link = "/shop",
  action = "Explore the collection",
}) {
  return (
    <div className="empty-state">
      <ShoppingBag size={32} strokeWidth={1} />
      <h2>{title}</h2>
      <p>{message}</p>
      {link && (
        <ButtonLink to={link} variant="outline">
          {action}
          <ArrowRight size={16} />
        </ButtonLink>
      )}
    </div>
  );
}
export function SectionHeader({
  eyebrow,
  title,
  link,
  action = "View all",
  children,
}) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {children}
      </div>
      {link && (
        <Link className="text-link" to={link}>
          {action}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function PageHeading({ eyebrow, title, children, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {children && <div className="page-description">{children}</div>}
      </div>
      {action}
    </div>
  );
}
export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <Link to="/">Home</Link>
      {items.map((item, i) => (
        <span key={i}>
          <span aria-hidden="true">/</span>
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function Image({
  src,
  alt = "",
  className = "",
  eager = false,
  ...props
}) {
  return (
    <img
      src={mediaUrl(src)}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/images/product-placeholder.svg";
      }}
      {...props}
    />
  );
}
export function QuantitySelector({
  value,
  onChange,
  max = 10000,
  disabled = false,
}) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={14} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
export function Pagination({ page, data, onChange }) {
  if (!data || (!data.previous && !data.next)) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <Button
        variant="outline"
        disabled={!data.previous}
        onClick={() => onChange(page - 1)}
      >
        <ArrowLeft size={16} />
        Previous
      </Button>
      <span>Page {page}</span>
      <Button
        variant="outline"
        disabled={!data.next}
        onClick={() => onChange(page + 1)}
      >
        Next
        <ArrowRight size={16} />
      </Button>
    </nav>
  );
}
export function Modal({ open, onClose, title, children, wide = false }) {
  const ref = useRef(null);
  const heading = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) {
      const before = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = before;
      };
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby={heading}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-heading">
          <h2 id={heading}>{title}</h2>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  busy,
  danger = false,
}) {
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title}>
      <p className="muted mb-8">{message}</p>
      <div className="button-row justify-end">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Keep it
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={onConfirm}
          busy={busy}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
export function Field({ label, error, hint, children, className = "" }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && (
        <small className="field-error" role="alert">
          {error.message || error}
        </small>
      )}
    </label>
  );
}

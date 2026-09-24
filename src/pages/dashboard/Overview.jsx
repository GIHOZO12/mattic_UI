import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CreditCard,
  Package,
  Shirt,
  Users,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { dashboardService } from "../../api/services";
import { useResource } from "../../hooks/useResource";
import { useAuth, useStore } from "../../context/AppContext";
import { formatMoney } from "../../utils/format";
import {
  Badge,
  ErrorState,
  PageHeading,
  Price,
  Skeleton,
} from "../../components/common/UI";

export function SalesChart({ rows = [] }) {
  const { currency } = useStore();
  const max = Math.max(1, ...rows.map((row) => Number(row.revenue)));
  return (
    <div className="sales-chart">
      <div className="chart-caption">
        <span>Daily confirmed revenue</span>
        <span>{currency}</span>
      </div>
      {rows.length ? (
        <div className="chart-bars">
          {rows.slice(-30).map((row) => (
            <div className="chart-column" key={row.date}>
              <div className="chart-bar-track">
                <div
                  className="chart-bar"
                  tabIndex={0}
                  aria-label={`${row.date}: ${formatMoney(row.revenue, currency)}`}
                  style={{
                    height: `${Math.max(2, (Number(row.revenue) / max) * 100)}%`,
                  }}
                >
                  <span className="chart-tooltip">
                    {row.date}
                    <br />
                    {formatMoney(row.revenue, currency)}
                  </span>
                </div>
              </div>
              <small>{row.date.slice(5)}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="chart-empty">
          <span />
          Revenue will appear here after your first verified payment.
        </div>
      )}
    </div>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const summary = useResource("dashboard-summary", () =>
    dashboardService.summary(),
  );
  const report = useResource("dashboard-report", () =>
    dashboardService.report({}),
  );
  const pending = useResource("dashboard-pending", (signal) =>
    dashboardService.list("payments", { status: "SUBMITTED" }, signal),
  );
  const inventory = useResource("dashboard-low-stock", (signal) =>
    dashboardService.list("inventory", { low_stock: true }, signal),
  );
  if (summary.loading) return <Skeleton rows count={5} />;
  if (summary.error)
    return <ErrorState error={summary.error} retry={summary.reload} />;
  const data = summary.data;
  if (!data) return null;
  return (
    <>
      <PageHeading
        eyebrow="A FRESH PERSPECTIVE"
        title={`Hello, ${user.first_name || "store owner"}.`}
        action={
          <Link className="btn btn-outline" to="/shop">
            Visit your store
            <ArrowUpRight size={16} />
          </Link>
        }
      >
        Here’s what’s happening in your store.
      </PageHeading>
      <div className="stat-grid">
        {[
          ["Today’s sales", data.today_sales, CreditCard, true],
          ["Total revenue", data.total_sales, CreditCard, true],
          ["Orders today", data.orders_today, Package],
          ["Pending payments", data.pending_payment_verifications, CreditCard],
          ["Processing orders", data.processing_orders, Package],
          ["Customers", data.total_customers, Users],
          ["Products", data.total_products, Shirt],
          ["Low-stock products", data.low_stock_products, Boxes],
        ].map(([label, value, Icon, money], i) => (
          <div
            className={`stat-card ${i === 0 ? "highlight" : ""}`}
            key={label}
          >
            <div>
              <span>{label}</span>
              <Icon size={18} />
            </div>
            {money ? <Price value={value} /> : <strong>{value}</strong>}
            <small>
              {i < 2 ? "Verified purchases only" : "Live store data"}
            </small>
          </div>
        ))}
      </div>
      <div className="dashboard-split mt-8">
        <section className="panel">
          <div className="section-header compact">
            <h2>A view of your sales</h2>
            <Link to="/dashboard/reports" className="text-link">
              Full report
              <ArrowRight size={14} />
            </Link>
          </div>
          {report.loading ? (
            <Skeleton rows count={2} />
          ) : report.error ? (
            <ErrorState error={report.error} retry={report.reload} />
          ) : (
            <SalesChart rows={report.data?.recent_sales_trend} />
          )}
        </section>
        <section className="panel powder-panel">
          <p className="eyebrow">READY FOR YOUR REVIEW</p>
          <h2>
            Payment
            <br />
            verification.
          </h2>
          <p className="muted mt-4">
            Keep orders moving. Review screenshots and confirm received
            payments.
          </p>
          {pending.error ? (
            <ErrorState error={pending.error} retry={pending.reload} compact />
          ) : (
            pending.data?.results?.slice(0, 3).map((payment) => (
              <Link
                className="mini-row"
                key={payment.id}
                to={`/dashboard/payments/${payment.id}`}
              >
                <span>{payment.order_number}</span>
                <ArrowRight size={15} />
              </Link>
            ))
          )}
          <Link
            className="btn btn-dark mt-6"
            to="/dashboard/payments?status=SUBMITTED"
          >
            Review payments
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <section className="panel mt-8">
        <div className="section-header compact">
          <h2>Recent orders</h2>
          <Link className="text-link" to="/dashboard/orders">
            View all
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      className="text-link"
                      to={`/dashboard/orders/${order.id}`}
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td>{order.customer_email}</td>
                  <td>
                    <Price
                      value={order.total_amount}
                      currency={order.payment.currency}
                    />
                  </td>
                  <td>
                    <Badge status={order.payment_status} />
                  </td>
                  <td>
                    <Badge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.recent_orders.length && (
            <p className="empty-inline">
              Your first order is the start of something good.
            </p>
          )}
        </div>
      </section>
      <div className="dashboard-split mt-8">
        <section className="panel">
          <div className="section-header compact">
            <h2>Stock to watch</h2>
            <Link
              to="/dashboard/inventory?low_stock=true"
              className="text-link"
            >
              Inventory
              <ArrowRight size={14} />
            </Link>
          </div>
          {inventory.error ? (
            <ErrorState error={inventory.error} retry={inventory.reload} />
          ) : inventory.data?.results?.length ? (
            inventory.data.results.slice(0, 5).map((row) => (
              <div className="mini-row" key={row.id}>
                <span>
                  {row.sku}
                  <small>
                    {row.size_name} / {row.color_name}
                  </small>
                </span>
                <Badge>{row.stock_quantity} left</Badge>
              </div>
            ))
          ) : (
            <p className="muted">No low-stock variants to review.</p>
          )}
        </section>
        <section className="panel">
          <h2>Top pieces</h2>
          {data.top_selling_products.length ? (
            data.top_selling_products.map((product, i) => (
              <div className="mini-row" key={`${product.product_id}-${i}`}>
                <span>
                  <small>0{i + 1}</small>
                  {product.product_name}
                </span>
                <span>{product.quantity} sold</span>
              </div>
            ))
          ) : (
            <p className="muted mt-6">
              Your best-selling pieces will appear after verified sales.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

export function Reports() {
  const [params, setParams] = useSearchParams();
  const dates = Object.fromEntries(params);
  const report = useResource(["sales-report", dates], () =>
    dashboardService.report(dates),
  );
  const dateChange = (name, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next);
  };
  return (
    <>
      <PageHeading eyebrow="THE BIGGER PICTURE" title="Store reports.">
        Revenue from verified, paid orders. Dates follow Africa/Kigali time.
      </PageHeading>
      <div className="admin-toolbar">
        <label className="date-filter">
          From
          <input
            type="date"
            value={dates.date_from || ""}
            onChange={(e) => dateChange("date_from", e.target.value)}
          />
        </label>
        <label className="date-filter">
          To
          <input
            type="date"
            value={dates.date_to || ""}
            onChange={(e) => dateChange("date_to", e.target.value)}
          />
        </label>
      </div>
      {report.loading ? (
        <Skeleton rows count={4} />
      ) : report.error ? (
        <ErrorState error={report.error} retry={report.reload} />
      ) : (
        report.data && (
          <>
            <div className="stat-grid">
              {[
                ["Total revenue", "total_revenue", true],
                ["Paid orders", "paid_orders"],
                ["Average order", "average_order_value", true],
                ["New customers", "new_customers"],
                ["Delivered orders", "delivered_orders"],
                ["Cancelled orders", "cancelled_orders"],
              ].map(([label, key, money]) => (
                <div className="stat-card" key={key}>
                  <span>{label}</span>
                  {money ? (
                    <Price value={report.data[key]} />
                  ) : (
                    <strong>{report.data[key]}</strong>
                  )}
                </div>
              ))}
            </div>
            <section className="panel mt-8">
              <h2>Sales over time</h2>
              <SalesChart rows={report.data.recent_sales_trend} />
            </section>
            <div className="dashboard-split mt-8">
              {[
                [
                  "Best-selling products",
                  report.data.best_selling_products,
                  "product_name",
                ],
                [
                  "Best-selling categories",
                  report.data.best_selling_categories,
                  "category_name",
                ],
              ].map(([title, rows, label]) => (
                <section className="panel" key={title}>
                  <h2>{title}</h2>
                  <p className="muted text-sm">
                    Item sales before order discounts and delivery.
                  </p>
                  {rows.length ? (
                    rows.map((row, i) => (
                      <div className="mini-row" key={i}>
                        <span>
                          {row[label]}
                          <small>{row.quantity} pieces</small>
                        </span>
                        <Price value={row.gross_item_sales} />
                      </div>
                    ))
                  ) : (
                    <p className="empty-inline">
                      No verified sales in this period.
                    </p>
                  )}
                </section>
              ))}
            </div>
          </>
        )
      )}
    </>
  );
}

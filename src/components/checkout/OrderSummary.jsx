import { Price } from "../common/UI";

export default function OrderSummary({ order, cart, children }) {
  return (
    <aside className="order-summary">
      <p className="eyebrow">A GOOD SELECTION</p>
      <h2>Order summary</h2>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>
            <Price
              value={order?.subtotal ?? cart?.subtotal}
              currency={order?.payment?.currency}
            />
          </dd>
        </div>
        <div>
          <dt>Discount</dt>
          <dd>
            {order ? (
              <Price
                value={order.discount}
                currency={order.payment?.currency}
              />
            ) : (
              "Applied at checkout"
            )}
          </dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>
            {order ? (
              <Price
                value={order.shipping_cost}
                currency={order.payment?.currency}
              />
            ) : (
              "Confirmed at checkout"
            )}
          </dd>
        </div>
        {order && (
          <div className="summary-total">
            <dt>Total</dt>
            <dd>
              <Price
                value={order.total_amount}
                currency={order.payment?.currency}
              />
            </dd>
          </div>
        )}
      </dl>
      {!order && (
        <p className="summary-note">
          Discounts, delivery and the final total are confirmed when your order
          is created.
        </p>
      )}
      {children}
      <div className="summary-payment">
        <span className="tiny-lime" />
        MTN Mobile Money<span>Manual verification</span>
      </div>
    </aside>
  );
}

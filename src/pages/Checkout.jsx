import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Smartphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { orderService } from "../api/services";
import { useAuth, useBag } from "../context/AppContext";
import { useAction } from "../hooks/useResource";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  PageHeading,
  Skeleton,
} from "../components/common/UI";
import AddressBook, {
  AddressText,
  GuestAddressForm,
} from "../components/account/AddressBook";
import OrderSummary from "../components/checkout/OrderSummary";
import { BagItem } from "./Cart";

export default function Checkout() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(null);
  const { cart, loading, error, refresh } = useBag();
  const action = useAction();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const submit = (data) =>
    action.run(async () => {
      const order = await orderService.checkout({
        ...data,
        ...(user
          ? { shipping_address_id: address.id }
          : { guest_address: address }),
      });
      navigate(`/payment/${order.id}`, { replace: true });
      refresh().catch(() => {});
    });
  if (loading && !cart)
    return (
      <div className="container page-space">
        <Skeleton rows count={3} />
      </div>
    );
  if (error)
    return (
      <div className="container page-space">
        <ErrorState error={error} retry={() => refresh().catch(() => {})} />
      </div>
    );
  if (!cart?.items?.length)
    return (
      <div className="container page-space">
        <EmptyState
          title="Your bag is empty."
          message="Add a piece to your bag before checking out."
        />
      </div>
    );
  return (
    <div className="container page-space">
      <PageHeading eyebrow="THE NEXT STEP" title="Make it yours." />
      <ol className="checkout-steps">
        {["Delivery", "Review", "Payment"].map((label, i) => (
          <li key={label} className={step >= i + 1 ? "active" : ""}>
            <span>{step > i + 1 ? <Check size={16} /> : `0${i + 1}`}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="checkout-layout">
        <div>
          {step === 1 ? (
            user ? (
              <>
                <AddressBook
                  selecting
                  selected={address}
                  onSelect={setAddress}
                />
                <Button
                  className="mt-8"
                  disabled={!address}
                  onClick={() => setStep(2)}
                >
                  Review your order
                  <ArrowRight size={16} />
                </Button>
              </>
            ) : (
              <GuestAddressForm
                address={address}
                onContinue={(value) => {
                  setAddress(value);
                  setStep(2);
                }}
              />
            )
          ) : (
            <form onSubmit={handleSubmit(submit)}>
              <div className="section-header compact">
                <h2>Your selection</h2>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setStep(1)}
                >
                  Change address
                </button>
              </div>
              <div className="panel address-text mb-6">
                <AddressText address={address} />
              </div>
              {cart.items.map((item) => (
                <BagItem key={item.id} item={item} readOnly />
              ))}
              <div className="field-grid mt-8">
                <Field
                  label="Coupon code"
                  hint="Your discount is validated when the order is created."
                >
                  <input
                    placeholder="Have a code?"
                    {...register("coupon_code")}
                  />
                </Field>
                <Field label="A note for the store (optional)">
                  <input
                    maxLength={2000}
                    placeholder="Anything we should know?"
                    {...register("customer_note")}
                  />
                </Field>
              </div>
              <div className="payment-option">
                <Smartphone size={24} />
                <div>
                  <strong>MTN Mobile Money</strong>
                  <p>
                    Pay on your phone, then upload your payment screenshot for
                    verification.
                  </p>
                </div>
                <Check size={20} />
              </div>
              <ErrorState error={action.error} compact />
              <Button className="w-full mt-6" type="submit" busy={action.busy}>
                Create order & continue to payment
                <ArrowRight size={16} />
              </Button>
              <p className="form-note">
                You’ll see the exact total and merchant instructions on the next
                page. No money is charged by this button.
              </p>
            </form>
          )}
        </div>
        <OrderSummary cart={cart} />
      </div>
    </div>
  );
}

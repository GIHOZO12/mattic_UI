import {
  ArrowRight,
  Heart,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { authService, orderService } from "../api/services";
import { useAuth, useBag, useToast } from "../context/AppContext";
import { useAction, useResource } from "../hooks/useResource";
import {
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  Field,
  PageHeading,
  Pagination,
  Skeleton,
} from "../components/common/UI";
import { OrderCard } from "../components/account/OrderComponents";

export function AccountLayout() {
  const { logout } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  return (
    <div className="container page-space account-layout">
      <aside className="account-sidebar">
        <p className="eyebrow">YOUR SUIT AND TIE FASHION SHOP</p>
        <nav aria-label="Account navigation">
          {[
            [LayoutGrid, "Overview", "/account"],
            [Package, "Orders", "/account/orders"],
            [Heart, "Wishlist", "/account/wishlist"],
            [MapPin, "Addresses", "/account/addresses"],
            [UserRound, "Profile", "/account/profile"],
          ].map(([Icon, label, to]) => (
            <NavLink end key={to} to={to}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={async () => {
              try {
                await logout();
              } catch {
                notify(
                  "Signed out on this device. Token revocation could not reach the server.",
                  "error",
                );
              }
              navigate("/login");
            }}
          >
            <LogOut size={18} />
            Sign out
          </button>
        </nav>
      </aside>
      <div className="account-content">
        <Outlet />
      </div>
    </div>
  );
}

export function AccountOverview() {
  const { user } = useAuth();
  const { wishlist } = useBag();
  const orders = useResource("account-recent", (signal) =>
    orderService.list({}, signal),
  );
  return (
    <>
      <PageHeading
        eyebrow="GOOD TO SEE YOU"
        title={`Hello, ${user.first_name || "there"}.`}
      >
        Your pieces. Your orders. Your next occasion.
      </PageHeading>
      <div className="account-stats">
        <Link to="/account/orders">
          <Package size={22} />
          <strong>{orders.data?.count ?? "—"}</strong>
          <span>Orders</span>
          <ArrowRight size={16} />
        </Link>
        <Link to="/account/wishlist">
          <Heart size={22} />
          <strong>{wishlist?.items?.length ?? "—"}</strong>
          <span>Saved pieces</span>
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="section-header compact">
        <h2>Recent orders</h2>
        <Link to="/account/orders" className="text-link">
          View all
          <ArrowRight size={14} />
        </Link>
      </div>
      {orders.loading ? (
        <Skeleton rows count={3} />
      ) : orders.error ? (
        <ErrorState error={orders.error} retry={orders.reload} />
      ) : orders.data?.results?.length ? (
        orders.data.results
          .slice(0, 3)
          .map((order) => <OrderCard order={order} key={order.id} />)
      ) : (
        <EmptyState
          title="Your next chapter is unwritten."
          message="Your orders will appear here once you find something you love."
        />
      )}
    </>
  );
}

export function AccountOrders({ guest = false }) {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const orders = useResource(["account-orders", page], (signal) =>
    orderService.list({ page }, signal),
  );
  return (
    <>
      <PageHeading eyebrow="FROM OUR STORE TO YOUR DOOR" title="Your orders.">
        {guest &&
          "Guest orders are available in the browser you used to place them. Keep your order number for support."}
      </PageHeading>
      {orders.loading ? (
        <Skeleton rows count={3} />
      ) : orders.error ? (
        <ErrorState error={orders.error} retry={orders.reload} />
      ) : orders.data?.results?.length ? (
        orders.data.results.map((order) => (
          <OrderCard order={order} key={order.id} />
        ))
      ) : (
        <EmptyState
          title="Nothing on the way. Yet."
          message="Start exploring the collection to place your first order."
        />
      )}
      <Pagination
        data={orders.data}
        page={page}
        onChange={(page) => setParams({ page })}
      />
    </>
  );
}

export function Profile() {
  const { user, setUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: user });
  const action = useAction();
  const notify = useToast();
  return (
    <>
      <PageHeading eyebrow="THE PERSONAL DETAILS" title="Your profile." />
      <form
        className="panel max-w-2xl"
        onSubmit={handleSubmit((values) =>
          action.run(async () => {
            const updated = await authService.update(values);
            setUser(updated);
            notify("Your profile has been updated.");
          }),
        )}
      >
        <div className="field-grid">
          <Field label="First name" error={errors.first_name}>
            <input
              autoComplete="given-name"
              {...register("first_name", {
                required: "Enter your first name.",
              })}
            />
          </Field>
          <Field label="Last name" error={errors.last_name}>
            <input autoComplete="family-name" {...register("last_name")} />
          </Field>
        </div>
        <Field
          label="Email address"
          hint="Contact the store if you need to change your account email."
        >
          <input value={user.email} type="email" disabled />
        </Field>
        <Field label="Phone number">
          <input type="tel" autoComplete="tel" {...register("phone_number")} />
        </Field>
        <ErrorState error={action.error} compact />
        <Button busy={action.busy} type="submit">
          Save changes
        </Button>
      </form>
      <ButtonLink variant="text" to="/shop">
        Back to the collection
        <ArrowRight size={16} />
      </ButtonLink>
    </>
  );
}

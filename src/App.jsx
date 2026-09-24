import { Component, Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AppProviders } from "./context/AppContext";
import StoreLayout from "./components/layout/StoreLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import IconTooltips from "./components/common/IconTooltips";
import { Button, Skeleton } from "./components/common/UI";
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Search = lazy(() => import("./pages/Search"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
function RouteScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
const Auth = lazy(() => import("./pages/Auth"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Payment = lazy(() => import("./pages/Payment"));
const Info = lazy(() => import("./pages/Info"));
const AddressBook = lazy(() => import("./components/account/AddressBook"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const named = (loader, name) =>
  lazy(() => loader().then((module) => ({ default: module[name] })));
const AccountLayout = named(() => import("./pages/Account"), "AccountLayout");
const AccountOverview = named(
  () => import("./pages/Account"),
  "AccountOverview",
);
const AccountOrders = named(() => import("./pages/Account"), "AccountOrders");
const Profile = named(() => import("./pages/Account"), "Profile");
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const Reports = named(() => import("./pages/dashboard/Overview"), "Reports");
const ResourcePage = lazy(() => import("./pages/dashboard/ResourcePage"));
const ProductEditor = lazy(() => import("./pages/dashboard/ProductEditor"));
const AdminPaymentDetail = named(
  () => import("./pages/dashboard/ManagementDetails"),
  "AdminPaymentDetail",
);
const AdminOrderDetail = named(
  () => import("./pages/dashboard/ManagementDetails"),
  "AdminOrderDetail",
);
const AdminCustomerDetail = named(
  () => import("./pages/dashboard/ManagementDetails"),
  "AdminCustomerDetail",
);
const AdminSettings = named(
  () => import("./pages/dashboard/ManagementDetails"),
  "AdminSettings",
);

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Application rendering error:", error);
  }
  render() {
    return this.state.failed ? (
      <div className="container page-space empty-state">
        <h1>This page needs a fresh start.</h1>
        <p>
          Please reload the page. If the issue continues, contact the store.
        </p>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteScroll />
      <IconTooltips />
      <ErrorBoundary>
        <AppProviders>
          <Suspense
            fallback={
              <div className="container page-space">
                <Skeleton rows count={3} />
              </div>
            }
          >
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="shop/:categorySlug" element={<Shop />} />
                <Route path="search" element={<Search />} />
                <Route path="products/:slug" element={<ProductDetail />} />
                <Route path="login" element={<Auth />} />
                <Route path="register" element={<Auth register />} />
                <Route path="info/:page" element={<Info />} />
                <Route element={<ProtectedRoute allowGuest />}>
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="payment/:id" element={<Payment />} />
                  <Route
                    path="orders"
                    element={
                      <div className="container page-space">
                        <AccountOrders guest />
                      </div>
                    }
                  />
                  <Route
                    path="orders/:id"
                    element={
                      <div className="container page-space">
                        <OrderDetail />
                      </div>
                    }
                  />
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route path="wishlist" element={<Wishlist />} />
                  <Route path="account" element={<AccountLayout />}>
                    <Route index element={<AccountOverview />} />
                    <Route path="orders" element={<AccountOrders />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                    <Route path="wishlist" element={<Wishlist embedded />} />
                    <Route path="addresses" element={<AddressBook />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>
                </Route>
                <Route path="*" element={<Info />} />
              </Route>
              <Route element={<ProtectedRoute admin />}>
                <Route path="dashboard" element={<DashboardLayout />}>
                  <Route index element={<Overview />} />
                  <Route path="products/:id" element={<ProductEditor />} />
                  <Route path="orders/:id" element={<AdminOrderDetail />} />
                  <Route path="payments/:id" element={<AdminPaymentDetail />} />
                  <Route
                    path="customers/:id"
                    element={<AdminCustomerDetail />}
                  />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route
                    path="payment-settings"
                    element={<AdminSettings payment />}
                  />
                  <Route path=":resource" element={<ResourcePage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </AppProviders>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

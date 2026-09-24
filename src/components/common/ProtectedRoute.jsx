import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AppContext";
import { ButtonLink, EmptyState, Skeleton } from "./UI";

export default function ProtectedRoute({ admin = false, allowGuest = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="container page-space">
        <Skeleton rows count={3} />
      </div>
    );
  if (!user && allowGuest && !admin) return <Outlet />;
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (admin && !user.can_access_dashboard)
    return (
      <div className="container page-space">
        <EmptyState
          title="This area is for the store owner."
          message="Your customer account is ready to use in the storefront."
        />
      </div>
    );
  if (!admin && user.role !== "CUSTOMER")
    return (
      <div className="container page-space">
        <EmptyState
          title="You’re signed in as the store owner."
          message="Use a customer account to place personal orders."
          link={null}
        />
        <div className="text-center">
          <ButtonLink to="/dashboard">Open dashboard</ButtonLink>
        </div>
      </div>
    );
  return <Outlet />;
}

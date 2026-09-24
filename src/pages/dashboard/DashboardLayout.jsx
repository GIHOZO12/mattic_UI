import { useEffect, useRef, useState } from "react";
import { ThemeControl } from "../../context/ThemeContext";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Palette,
  Ruler,
  Settings,
  Shirt,
  Smartphone,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth, useToast } from "../../context/AppContext";
import { Logo } from "../../components/layout/StoreLayout";
import { AdminReferences } from "./AdminContext";

const links = [
  [LayoutDashboard, "Overview", ""],
  [Shirt, "Products", "products"],
  [FolderTree, "Categories", "categories"],
  [Tag, "Brands", "brands"],
  [Ruler, "Sizes", "sizes"],
  [Palette, "Colors", "colors"],
  [Package, "Orders", "orders"],
  [CreditCard, "Payments", "payments"],
  [Boxes, "Inventory", "inventory"],
  [Users, "Customers", "customers"],
  [Tag, "Coupons", "coupons"],
  [Star, "Reviews", "reviews"],
  [BarChart3, "Reports", "reports"],
  [Settings, "Store settings", "settings"],
  [Smartphone, "Mobile Money", "payment-settings"],
];
export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const sidebar = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      [...sidebar.current.querySelectorAll("a, button")].filter(
        (element) => element.offsetParent !== null,
      );
    focusable()[0]?.focus();
    const key = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    document.addEventListener("keydown", key);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [open]);
  const { user, logout } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <AdminReferences>
      <a className="skip-link" href="#dashboard-content">
        Skip to dashboard content
      </a>
      <div className="dashboard-shell">
        {open && (
          <button
            className="sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
        )}
        <aside
          ref={sidebar}
          role={open ? "dialog" : undefined}
          aria-modal={open ? true : undefined}
          aria-label="Store navigation"
          id="dashboard-navigation"
          className={`dashboard-sidebar ${open ? "open" : ""}`}
        >
          <div className="dashboard-logo">
            <Logo />
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>
          <span className="dashboard-label">THE STORE STUDIO</span>
          <nav aria-label="Dashboard navigation">
            {links.map(([Icon, label, route]) => (
              <NavLink
                key={route}
                to={`/dashboard${route ? `/${route}` : ""}`}
                end={!route}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} strokeWidth={1.6} />
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            className="dashboard-logout"
            onClick={async () => {
              try {
                await logout();
              } catch {
                notify(
                  "Signed out on this device. The server could not revoke the refresh token.",
                  "error",
                );
              }
              navigate("/login");
            }}
          >
            <LogOut size={18} />
            Sign out
          </button>
          <div className="dashboard-owner">
            <span>
              {(user.first_name || user.email).slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user.first_name || "Store owner"}</strong>
              <small>Administrator</small>
            </div>
          </div>
        </aside>
        <div className="dashboard-main" inert={open}>
          <header className="dashboard-topbar">
            <button
              className="icon-button mobile-menu-button"
              aria-label="Open dashboard navigation"
              aria-expanded={open}
              aria-controls="dashboard-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="dashboard-location">
              Store studio{" "}
              <span className="muted">
                /{" "}
                {location.pathname.split("/")[2]?.replaceAll("-", " ") ||
                  "Overview"}
              </span>
            </span>
            <ThemeControl />
            <Link
              to="/"
              className="text-link dashboard-store-link"
              aria-label="Visit storefront"
            >
              <span>Visit storefront</span>
              <ArrowUpRight size={15} />
            </Link>
          </header>
          <main id="dashboard-content" className="dashboard-content">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminReferences>
  );
}

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Heart,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShoppingBag,
  UserRound,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useBag, useStore } from "../../context/AppContext";

import { mediaUrl } from "../../api/client";
import { ThemeControl } from "../../context/ThemeContext";

export const brandName =
  import.meta.env.VITE_BRAND_NAME || "Suit and Tie Fashion Shop";
export const siteUrl =
  import.meta.env.VITE_SITE_URL || "https://suitandtiefashionshop.com";
const supportPhone = "+250784888458";
const whatsappUrl = `https://wa.me/${supportPhone.replace("+", "")}`;
export function Logo({ light = false }) {
  const { settings } = useStore();
  return (
    <Link
      to="/"
      className={`logo ${light ? "light" : ""}`}
      aria-label={`${brandName} home`}
    >
      {settings?.logo ? (
        <img
          src={mediaUrl(settings.logo)}
          alt={settings.store_name || brandName}
        />
      ) : (
        <>
          {brandName === "Suit and Tie Fashion Shop" ? (
            <span className="logo-wordmark">
              Suit and Tie
              <span className="logo-subline">
                Fashion Shop<span className="logo-dot">.</span>
              </span>
            </span>
          ) : (
            brandName
          )}
        </>
      )}
    </Link>
  );
}

export function Header() {
  const { categories } = useStore();
  const { user } = useAuth();
  const { cart } = useBag();
  const [mobile, setMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setMobile(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") setMobile(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const links = categories
    .filter((category) => !category.parent)
    .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))
    .slice(0, 6);
  return (
    <>
      <div className="announcement">
        <a className="announcement-contact" href={`tel:${supportPhone}`}>
          <Phone size={15} aria-hidden="true" />
          <span>Support & quick orders</span>
          <strong>Tel: {supportPhone}</strong>
        </a>
        <Link to="/shop">
          Discover the collection <ArrowUpRight size={12} />
        </Link>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link to="/shop">All</Link>
            {links.slice(0, 5).map((category) => (
              <Link key={category.id} to={`/shop/${category.slug}`}>
                {category.name}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <ThemeControl />
            <Link
              className="icon-button"
              to="/search"
              aria-label="Search products"
              data-tooltip="Search"
            >
              <Search size={20} />
            </Link>
            <Link
              className="icon-button desktop-action"
              to={user?.can_access_dashboard ? "/dashboard" : "/account"}
              aria-label="My account"
              data-tooltip={
                user
                  ? user.can_access_dashboard
                    ? "Dashboard"
                    : "My account"
                  : "Login"
              }
            >
              <UserRound size={20} />
            </Link>
            <Link
              className="icon-button desktop-action"
              to="/wishlist"
              aria-label="Wishlist"
            >
              <Heart size={20} />
            </Link>
            <Link
              className="bag-link icon-button"
              to="/cart"
              aria-label={`Shopping bag, ${cart?.total_quantity || 0} items`}
              data-tooltip="Shopping bag"
            >
              <ShoppingBag size={20} />
              <span>{cart?.total_quantity || 0}</span>
            </Link>
            <button
              className="icon-button mobile-menu-button"
              aria-expanded={mobile}
              aria-controls="mobile-navigation"
              aria-label={mobile ? "Close menu" : "Open menu"}
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {mobile && (
          <nav
            id="mobile-navigation"
            className="mobile-navigation"
            aria-label="Mobile navigation"
          >
            <Link to="/shop">All</Link>
            {links.map((category) => (
              <Link key={category.id} to={`/shop/${category.slug}`}>
                {category.name}
                <ArrowRight size={16} />
              </Link>
            ))}
            <Link to="/account">My account</Link>
            <Link to={user ? "/account/orders" : "/orders"}>My orders</Link>
            <Link to="/wishlist">Wishlist</Link>
            {user?.can_access_dashboard && (
              <button onClick={() => navigate("/dashboard")}>
                Store dashboard
              </button>
            )}
          </nav>
        )}
      </header>
    </>
  );
}

export function Footer() {
  const { user } = useAuth();
  const { categories, settings } = useStore();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>
            Good clothes.
            <br />
            Great possibilities.
          </p>
          <span>Style for every occasion.</span>
        </div>
        <div>
          <h3>The collection</h3>
          {categories
            .filter((c) => !c.parent)
            .slice(0, 5)
            .map((c) => (
              <Link to={`/shop/${c.slug}`} key={c.id}>
                {c.name}
              </Link>
            ))}
          <Link to="/shop">Shop all</Link>
        </div>
        <div>
          <h3>Here to help</h3>
          <Link to={user ? "/account/orders" : "/orders"}>My orders</Link>
          {["Contact", "Delivery", "Size guide", "Returns"].map((label) => (
            <Link
              key={label}
              to={`/info/${label.toLowerCase().replaceAll(" ", "-")}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div>
          <h3>About the shop</h3>
          {["About", "Terms", "Privacy"].map((label) => (
            <Link key={label} to={`/info/${label.toLowerCase()}`}>
              {label}
            </Link>
          ))}
          <a href={siteUrl}>{new URL(siteUrl).hostname}</a>
          {settings?.support_email && (
            <a href={`mailto:${settings.support_email}`}>
              {settings.support_email}
            </a>
          )}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {brandName}. All rights reserved.
        </span>
        <span>Thoughtfully selected. Confidently worn.</span>
        <span className="payment-label">
          MTN Mobile Money <span className="tiny-lime" />
        </span>
      </div>
    </footer>
  );
}

export default function StoreLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
      <a
        className="whatsapp-button"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Message us on WhatsApp at ${supportPhone} (opens in a new tab)`}
        data-tooltip="Message us on WhatsApp"
      >
        <MessageCircle size={25} aria-hidden="true" />
      </a>
    </>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clearTokens,
  errorMessage,
  getRefresh,
  refreshSession,
} from "../api/client";
import {
  authService,
  cartService,
  referenceService,
  wishlistService,
} from "../api/services";
import { useResource } from "../hooks/useResource";

const AuthContext = createContext(null);
const StoreContext = createContext(null);
const BagContext = createContext(null);
const ToastContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export const useStore = () => useContext(StoreContext);
export const useBag = () => useContext(BagContext);
export const useToast = () => useContext(ToastContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    const logoutEvent = () => setUser(null);
    window.addEventListener("suitandtiefashionshop:logout", logoutEvent);
    (async () => {
      try {
        if (getRefresh()) {
          await refreshSession();
          const me = await authService.me();
          if (live) setUser(me);
        }
      } catch {
        if (live) setUser(null);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
      window.removeEventListener("suitandtiefashionshop:logout", logoutEvent);
    };
  }, []);
  const login = async (values) => {
    await authService.login(values);
    const me = await authService.me();
    setUser(me);
    return me;
  };
  const logout = async () => {
    try {
      if (getRefresh()) await authService.logout();
    } finally {
      clearTokens();
      setUser(null);
    }
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function StoreProvider({ children }) {
  const store = useResource("store-settings", (signal) =>
    referenceService.store(signal),
  );
  const categories = useResource("categories", (signal) =>
    referenceService.all("categories", signal),
  );
  const references = useResource("references", (signal) =>
    Promise.all(
      ["brands", "sizes", "colors"].map((name) =>
        referenceService.all(name, signal),
      ),
    ),
  );
  const value = useMemo(
    () => ({
      settings: store.data,
      storeError: store.error,
      categories: categories.data || [],
      categoryState: categories,
      brands: references.data?.[0] || [],
      sizes: references.data?.[1] || [],
      colors: references.data?.[2] || [],
      referenceError: references.error,
      currency: store.data?.currency || "RWF",
      refresh: () => {
        store.reload();
        categories.reload();
        references.reload();
      },
    }),
    [store, categories, references],
  );
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

function BagProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const refresh = useCallback(async () => {
    const started = user?.id;
    if (authLoading || (user && user.role !== "CUSTOMER")) {
      setCart(null);
      setWishlist(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [bag, saved] = await Promise.all([
        cartService.get(),
        user ? wishlistService.get() : Promise.resolve(null),
      ]);
      if (currentUser.current === started) {
        setCart(bag);
        setWishlist(saved);
      }
    } catch (err) {
      if (currentUser.current === started) setError(err);
      throw err;
    } finally {
      if (currentUser.current === started) setLoading(false);
    }
  }, [user, authLoading]);
  useEffect(() => {
    setCart(null);
    setWishlist(null);
    refresh().catch(() => {});
  }, [refresh]);
  return (
    <BagContext.Provider value={{ cart, wishlist, loading, error, refresh }}>
      {children}
    </BagContext.Provider>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((items) => [
      ...items.slice(-2),
      {
        id,
        message: typeof message === "string" ? message : errorMessage(message),
        type,
      },
    ]);
    setTimeout(
      () => setToasts((items) => items.filter((item) => item.id !== id)),
      5500,
    );
  }, []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() =>
                setToasts((items) =>
                  items.filter((item) => item.id !== toast.id),
                )
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <StoreProvider>
          <BagProvider>{children}</BagProvider>
        </StoreProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

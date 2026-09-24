import { createContext, useContext } from "react";
import { dashboardService } from "../../api/services";
import { useResource } from "../../hooks/useResource";

const Context = createContext(null);
const names = ["products", "categories", "brands", "sizes", "colors"];
export const useAdminReferences = () => useContext(Context);
export function AdminReferences({ children }) {
  const resource = useResource("admin-references", async (signal) =>
    Object.fromEntries(
      await Promise.all(
        names.map(async (name) => [
          name,
          await dashboardService.all(name, {}, signal),
        ]),
      ),
    ),
  );
  return (
    <Context.Provider
      value={{
        data: resource.data || {},
        loading: resource.loading,
        error: resource.error,
        reload: resource.reload,
      }}
    >
      {children}
    </Context.Provider>
  );
}

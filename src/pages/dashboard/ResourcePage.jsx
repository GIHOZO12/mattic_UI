import { useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { dashboardService } from "../../api/services";
import { useAction, useDebounced, useResource } from "../../hooks/useResource";
import { useStore, useToast } from "../../context/AppContext";
import { formatDate } from "../../utils/format";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Modal,
  PageHeading,
  Pagination,
  Price,
  Skeleton,
} from "../../components/common/UI";
import { useAdminReferences } from "./AdminContext";
import ResourceForm from "./ResourceForm";
import { columnLabels, resources } from "./resources";

export function Cell({ column, row }) {
  const { data } = useAdminReferences();
  const value = row[column];
  if (value == null || value === "") return <span className="muted">—</span>;
  if (["status", "payment_status"].includes(column))
    return <Badge status={value} />;
  if (typeof value === "boolean")
    return (
      <Badge status={value ? "CONFIRMED" : "PENDING"}>
        {value ? "Yes" : "No"}
      </Badge>
    );
  if (
    [
      "base_price",
      "sale_price",
      "total_amount",
      "amount",
      "total_spent",
    ].includes(column)
  )
    return (
      <Price value={value} currency={row.currency || row.payment?.currency} />
    );
  if (column.endsWith("_at") || ["end_date", "date_joined"].includes(column))
    return formatDate(value);
  if (column === "hex_code")
    return (
      <span className="cell-swatch">
        <i style={{ backgroundColor: value }} />
        {value}
      </span>
    );
  const relation = {
    product: "products",
    category: "categories",
    parent: "categories",
    size: "sizes",
    color: "colors",
  }[column];
  if (relation)
    return (
      data[relation]?.find((item) => item.id === value)?.name || `#${value}`
    );
  return String(value);
}

export default function ResourcePage({ name }) {
  const params = useParams();
  const resource = name || params.resource;
  return <ResourceListing key={resource} name={resource} />;
}

function ResourceListing({ name }) {
  const params = useParams();
  const resource = name || params.resource;
  const config = resources[resource];
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const debounced = useDebounced(query);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const page = Number(searchParams.get("page")) || 1;
  const filter = {
    ...Object.fromEntries(searchParams),
    ...(config?.search ? { search: debounced } : {}),
    page,
  };
  const listing = useResource(
    ["admin-list", resource, filter],
    (signal) => dashboardService.list(resource, filter, signal),
    Boolean(config),
  );
  const references = useAdminReferences();
  const store = useStore();
  const action = useAction();
  const notify = useToast();
  const navigate = useNavigate();
  if (!config || !config.columns)
    return (
      <EmptyState
        title="This page is not here."
        link="/dashboard"
        action="Back to overview"
      />
    );
  const update = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };
  const saved = () => {
    setEditing(undefined);
    listing.reload();
    references.reload();
    store.refresh();
    notify("Changes saved.");
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR STORE, CONSIDERED"
        title={config.title}
        action={
          !config.readOnly &&
          !config.noCreate && (
            <Button
              onClick={() =>
                resource === "products"
                  ? navigate("/dashboard/products/new")
                  : setEditing(null)
              }
            >
              <Plus size={17} />
              Add{" "}
              {resource === "inventory"
                ? "variant"
                : config.title
                    .toLowerCase()
                    .replace(/ies$/, "y")
                    .replace(/s$/, "")}
            </Button>
          )
        }
      >
        {config.description}
      </PageHeading>
      <div className="admin-toolbar">
        {config.search && (
          <label className="admin-search">
            <Search size={17} />
            <input
              aria-label={`Search ${config.title.toLowerCase()}`}
              placeholder={`Search ${config.title.toLowerCase()}…`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                update("page", "");
              }}
            />
          </label>
        )}
        {config.filters?.map((item) => (
          <select
            key={item.name}
            aria-label={item.label}
            value={searchParams.get(item.name) || ""}
            onChange={(e) => update(item.name, e.target.value)}
          >
            <option value="">All {item.label.toLowerCase()}</option>
            {item.options.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ))}
        {config.dateFilter && (
          <>
            <label className="date-filter">
              From
              <input
                type="date"
                value={searchParams.get("date_from") || ""}
                onChange={(e) => update("date_from", e.target.value)}
              />
            </label>
            <label className="date-filter">
              To
              <input
                type="date"
                value={searchParams.get("date_to") || ""}
                onChange={(e) => update("date_to", e.target.value)}
              />
            </label>
          </>
        )}
      </div>
      {listing.loading ? (
        <Skeleton rows count={4} />
      ) : listing.error ? (
        <ErrorState error={listing.error} retry={listing.reload} />
      ) : !listing.data?.results?.length ? (
        <EmptyState
          title={`No ${config.title.toLowerCase()} here yet.`}
          message="Try another filter or add your first record."
          link={null}
        />
      ) : (
        <div className="table-wrap responsive-admin-table">
          <table>
            <thead>
              <tr>
                {config.columns.map((column) => (
                  <th key={column}>
                    {columnLabels[column] || column.replaceAll("_", " ")}
                  </th>
                ))}
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {listing.data.results.map((row) => (
                <tr key={row.id}>
                  {config.columns.map((column) => (
                    <td
                      key={column}
                      data-label={
                        columnLabels[column] || column.replaceAll("_", " ")
                      }
                    >
                      <Cell column={column} row={row} />
                    </td>
                  ))}
                  <td data-label="Actions">
                    <div className="table-actions">
                      {config.readOnly ? (
                        <Link
                          className="icon-button"
                          to={`/dashboard/${resource}/${row.id}`}
                          aria-label={`View ${row.order_number || row.email || row.id}`}
                        >
                          <Eye size={17} />
                        </Link>
                      ) : (
                        <>
                          <button
                            className="icon-button"
                            aria-label={`Edit ${row.name || row.sku || row.code || row.id}`}
                            onClick={() =>
                              resource === "products"
                                ? navigate(`/dashboard/products/${row.id}`)
                                : setEditing(row)
                            }
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Delete ${row.name || row.sku || row.code || row.id}`}
                            onClick={() => setDeleting(row)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        data={listing.data}
        page={page}
        onChange={(next) => {
          const p = new URLSearchParams(searchParams);
          p.set("page", next);
          setSearchParams(p);
        }}
      />
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        wide
        title={
          editing
            ? `Edit ${config.title.toLowerCase()}`
            : `Add to ${config.title.toLowerCase()}`
        }
      >
        {editing !== undefined && (
          <>
            {resource === "reviews" && (
              <div className="panel mb-6">
                <h3>{editing?.title}</h3>
                <p>{editing?.comment}</p>
                <p>{editing?.rating} / 5 stars</p>
              </div>
            )}
            <ResourceForm
              key={editing?.id || "new"}
              resource={resource}
              config={config}
              record={editing}
              onSaved={saved}
              onCancel={() => setEditing(undefined)}
            />
          </>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        danger
        busy={action.busy}
        onClose={() => setDeleting(null)}
        title="Delete this record?"
        message="This cannot be undone. Records required for order history are protected by the store."
        onConfirm={() =>
          action.run(async () => {
            await dashboardService.remove(resource, deleting.id);
            setDeleting(null);
            saved();
          })
        }
      />
      <ErrorState error={action.error} compact />
    </>
  );
}

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { productService } from "../api/services";
import { useStore } from "../context/AppContext";
import { useResource } from "../hooks/useResource";
import {
  Breadcrumbs,
  Button,
  ErrorState,
  Field,
  Modal,
  PageHeading,
  Pagination,
} from "../components/common/UI";
import ProductGrid from "../components/product/ProductGrid";

function FilterPanel({ filters, onApply, onReset, categorySlug }) {
  const { categories, brands, sizes, colors, referenceError } = useStore();
  return (
    <form
      className="filter-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <div className="filter-heading">
        <h2>Refine your selection</h2>
        <button type="button" className="text-button" onClick={onReset}>
          Reset
        </button>
      </div>
      <ErrorState error={referenceError} compact />
      <Field label="Category">
        <select
          name="category"
          defaultValue={filters.category || categorySlug || ""}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.parent ? "— " : ""}
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Brand">
        <select name="brand" defaultValue={filters.brand || ""}>
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </Field>
      <fieldset className="filter-group">
        <legend>Size</legend>
        <div className="size-options">
          {sizes.map((size) => (
            <label key={size.id}>
              <input
                type="radio"
                name="size"
                value={size.id}
                defaultChecked={String(filters.size) === String(size.id)}
              />
              <span>{size.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="filter-group">
        <legend>Color</legend>
        <div className="color-options">
          {colors.map((color) => (
            <label key={color.id} title={color.name}>
              <input
                type="radio"
                name="color"
                value={color.id}
                defaultChecked={String(filters.color) === String(color.id)}
              />
              <span
                className="filter-swatch"
                style={{ "--swatch": color.hex_code }}
              />
              <small>{color.name}</small>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="filter-group">
        <legend>Price range</legend>
        <div className="field-grid">
          <Field label="From">
            <input
              aria-label="Minimum price"
              type="number"
              name="min_price"
              min="0"
              defaultValue={filters.min_price || ""}
              placeholder="Min"
            />
          </Field>
          <Field label="To">
            <input
              aria-label="Maximum price"
              type="number"
              name="max_price"
              min="0"
              defaultValue={filters.max_price || ""}
              placeholder="Max"
            />
          </Field>
        </div>
      </fieldset>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="in_stock"
          value="true"
          defaultChecked={filters.in_stock === "true"}
        />
        In stock only
      </label>
      <Button className="w-full" type="submit">
        Apply filters
      </Button>
    </form>
  );
}

export default function Shop() {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [search, setSearch] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const { categories } = useStore();
  const filters = Object.fromEntries(search);
  const selectedCategory = filters.category || categorySlug;
  const category = categories.find(
    (item) =>
      item.slug === selectedCategory || String(item.id) === selectedCategory,
  );
  const params = {
    ...filters,
    ...(selectedCategory ? { category: selectedCategory } : {}),
    ordering: filters.ordering || "-created_at",
  };
  const products = useResource(["shop", params], (signal) =>
    productService.list(params, signal),
  );
  const update = (changes) => {
    const next = new URLSearchParams(search);
    next.delete("page");
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    setSearch(next);
  };
  const apply = (values) => {
    const next = new URLSearchParams();
    if (filters.ordering) next.set("ordering", filters.ordering);
    Object.entries(values).forEach(([k, v]) => {
      if (v) next.set(k, v);
    });
    navigate(`/shop?${next.toString()}`);
    setDrawer(false);
  };
  const reset = () => {
    navigate("/shop");
    setDrawer(false);
  };
  const active = Object.entries(filters).filter(
    ([key]) => !["ordering", "page"].includes(key),
  );
  return (
    <div className="container page-space">
      <Breadcrumbs
        items={[
          { label: "The collection", to: category ? "/shop" : undefined },
          ...(category ? [{ label: category.name }] : []),
        ]}
      />
      <PageHeading
        eyebrow="THE SUIT AND TIE FASHION SHOP COLLECTION"
        title={
          category?.name ||
          (filters.featured
            ? "The considered edit."
            : "Find your next favorite.")
        }
      >
        {category?.description ||
          "Considered pieces. Endless possibilities. Make room for a wardrobe that feels like you."}
      </PageHeading>
      <div className="shop-toolbar">
        <span>
          {products.loading
            ? "Finding your pieces…"
            : `${products.data?.count || 0} pieces`}
        </span>
        <div>
          <button
            className="btn btn-outline filter-trigger"
            onClick={() => setDrawer(true)}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
          <label className="sort-control">
            <span>Sort by</span>
            <select
              aria-label="Sort products"
              value={filters.ordering || "-created_at"}
              onChange={(e) => update({ ordering: e.target.value })}
            >
              <option value="-created_at">Newest first</option>
              <option value="-sold_quantity">Best selling</option>
              <option value="price">Price: low to high</option>
              <option value="-price">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>
      {active.length > 0 && (
        <div className="active-filters">
          {active.map(([key, value]) => (
            <button key={key} onClick={() => update({ [key]: "" })}>
              {key.replaceAll("_", " ")}: {value}
              <X size={12} />
            </button>
          ))}
          <button onClick={reset}>Clear all</button>
        </div>
      )}
      <div className="shop-layout">
        <aside className="desktop-filters">
          <FilterPanel
            key={search.toString() + categorySlug}
            filters={filters}
            categorySlug={categorySlug}
            onApply={apply}
            onReset={reset}
          />
        </aside>
        <div className="shop-results">
          <ProductGrid
            products={products.data?.results}
            loading={products.loading}
            error={products.error}
            retry={products.reload}
            count={6}
          />
          <Pagination
            data={products.data}
            page={Number(filters.page) || 1}
            onChange={(page) => {
              const next = new URLSearchParams(search);
              next.set("page", page);
              setSearch(next);
              window.scrollTo(0, 0);
            }}
          />
        </div>
      </div>
      <Modal
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Find your fit"
      >
        <FilterPanel
          key={search.toString() + categorySlug}
          filters={filters}
          categorySlug={categorySlug}
          onApply={apply}
          onReset={reset}
        />
      </Modal>
    </div>
  );
}

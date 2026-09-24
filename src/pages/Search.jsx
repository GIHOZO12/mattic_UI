import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { productService } from "../api/services";
import { useDebounced, useResource } from "../hooks/useResource";
import { PageHeading, Pagination } from "../components/common/UI";
import ProductGrid from "../components/product/ProductGrid";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const page = Number(params.get("page")) || 1;
  const setQuery = (value) =>
    setParams(value ? { q: value } : {}, { replace: true });
  const setPage = (value) => setParams({ q: query, page: value });
  const debounced = useDebounced(query.trim());
  const results = useResource(
    ["search", debounced, page],
    (signal) => productService.list({ search: debounced, page }, signal),
    debounced.length >= 2,
  );
  return (
    <div className="container page-space">
      <PageHeading
        eyebrow="LOOKING FOR SOMETHING?"
        title="Let’s find your next piece."
      />
      <label className="search-input">
        <SearchIcon size={24} />
        <input
          type="search"
          autoFocus
          placeholder="Try a shirt, a suit, a fresh perspective…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          aria-label="Search products"
        />
      </label>
      {debounced.length < 2 ? (
        <div className="search-hint">
          <p>Search by name, description, brand, or category.</p>
          <span>Start with at least two characters.</span>
        </div>
      ) : (
        <>
          <p className="muted mb-6">
            {results.loading
              ? "Searching the collection…"
              : `${results.data?.count || 0} results for “${debounced}”`}
          </p>
          <ProductGrid
            products={results.data?.results}
            loading={results.loading}
            error={results.error}
            retry={results.reload}
          />
          <Pagination data={results.data} page={page} onChange={setPage} />
        </>
      )}
    </div>
  );
}

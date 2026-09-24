import { useState } from "react";
import { ImagePlus, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { dashboardService } from "../../api/services";
import { useStore, useToast } from "../../context/AppContext";
import { useAction, useResource } from "../../hooks/useResource";
import {
  Breadcrumbs,
  Button,
  ConfirmDialog,
  ErrorState,
  Field,
  Image,
  Modal,
  PageHeading,
  Skeleton,
} from "../../components/common/UI";
import { useAdminReferences } from "./AdminContext";
import ResourceForm from "./ResourceForm";
import { resources } from "./resources";

function StockUpdate({ variant, onSaved }) {
  const [quantity, setQuantity] = useState(variant.stock_quantity);
  const [available, setAvailable] = useState(variant.is_available);
  const action = useAction();
  const notify = useToast();
  return (
    <form
      className="stock-update"
      onSubmit={(event) => {
        event.preventDefault();
        action.run(async () => {
          const saved = await dashboardService.update("variants", variant.id, {
            stock_quantity: Number(quantity),
            is_available: available,
          });
          onSaved(saved);
          notify(
            "Stock updated. Storefront availability will refresh automatically.",
          );
        });
      }}
    >
      <Field label="Stock">
        <input
          type="number"
          min="0"
          max="2147483647"
          step="1"
          required
          disabled={action.busy}
          aria-label={`Stock for ${variant.size_name} ${variant.color_name}`}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </Field>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={available}
          disabled={action.busy}
          onChange={(e) => setAvailable(e.target.checked)}
        />
        Available for purchase
      </label>
      <Button
        type="submit"
        variant="outline"
        busy={action.busy}
        disabled={
          String(quantity) === String(variant.stock_quantity) &&
          available === variant.is_available
        }
      >
        Update stock
      </Button>
      <ErrorState error={action.error} compact />
    </form>
  );
}

function ProductAssets({ productId }) {
  const variants = useResource(["product-variants", productId], () =>
    dashboardService.all("variants", { product: productId }),
  );
  const images = useResource(["product-images", productId], () =>
    dashboardService.all("images", { product: productId }),
  );
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const action = useAction();
  const notify = useToast();
  const refs = useAdminReferences();
  const refresh = () => {
    variants.reload();
    images.reload();
    refs.reload();
  };
  const upload = (file) => {
    if (!file) return;
    action.run(async () => {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Product images must be 5 MB or smaller.");
      const data = new FormData();
      data.append("product", productId);
      data.append("image", file);
      data.append("is_primary", !images.data?.length);
      await dashboardService.create("images", data);
      images.reload();
      notify("Product image uploaded.");
    });
  };
  return (
    <>
      <section className="panel mt-8">
        <div className="section-header compact">
          <div>
            <p className="eyebrow">THE FIRST IMPRESSION</p>
            <h2>Product photography</h2>
          </div>
          <label className="btn btn-outline file-button">
            <ImagePlus size={16} />
            Upload image
            <input
              aria-label="Upload product image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={action.busy}
              onChange={(e) => {
                upload(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {images.loading ? (
          <Skeleton rows count={2} />
        ) : images.error ? (
          <ErrorState error={images.error} retry={images.reload} />
        ) : images.data?.length ? (
          <div className="admin-image-grid">
            {images.data.map((image) => (
              <div className="admin-image" key={image.id}>
                <Image
                  src={image.image}
                  alt={image.alt_text || "Product image"}
                />
                <Field label="Display order">
                  <input
                    type="number"
                    min="0"
                    aria-label={`Image ${image.id} display order`}
                    defaultValue={image.sort_order}
                    onBlur={(e) => {
                      if (e.target.value !== String(image.sort_order))
                        action.run(async () => {
                          await dashboardService.update("images", image.id, {
                            sort_order: Number(e.target.value),
                          });
                          images.reload();
                        });
                    }}
                  />
                </Field>
                <div className="button-row">
                  <button
                    className={`text-button ${image.is_primary ? "text-lime-dark" : ""}`}
                    disabled={image.is_primary || action.busy}
                    onClick={() =>
                      action.run(async () => {
                        await dashboardService.update("images", image.id, {
                          is_primary: true,
                        });
                        images.reload();
                      })
                    }
                  >
                    <Star size={14} />
                    {image.is_primary ? "Primary image" : "Make primary"}
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Delete product image"
                    onClick={() =>
                      setDeleting({ resource: "images", id: image.id })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Add your first product image. JPG, PNG or WEBP, up to 5 MB.
          </p>
        )}
      </section>
      <section className="panel mt-8">
        <div className="section-header compact">
          <div>
            <p className="eyebrow">A FIT FOR EVERY CUSTOMER</p>
            <h2>Sizes, colors & stock</h2>
          </div>
          <Button variant="outline" onClick={() => setEditing(null)}>
            <Plus size={16} />
            Add variant
          </Button>
        </div>
        <p className="muted mb-6">
          Each size and color combination has its own stock. Leave the variant
          price empty to use the product price.
        </p>
        {variants.loading ? (
          <Skeleton rows count={2} />
        ) : variants.error ? (
          <ErrorState error={variants.error} retry={variants.reload} />
        ) : variants.data?.length ? (
          <div className="table-wrap responsive-admin-table variant-table">
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Color</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Price override</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.data.map((variant) => (
                  <tr key={variant.id}>
                    <td data-label="Size">{variant.size_name}</td>
                    <td data-label="Color">{variant.color_name}</td>
                    <td data-label="SKU">{variant.sku}</td>
                    <td data-label="Stock" className="variant-stock-cell">
                      <StockUpdate
                        key={`${variant.id}-${variant.updated_at}`}
                        variant={variant}
                        onSaved={(saved) =>
                          variants.updateData((rows) =>
                            rows.map((row) =>
                              row.id === saved.id ? saved : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td data-label="Price override">
                      {variant.price || "Product price"}
                    </td>
                    <td data-label="Actions">
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${variant.sku}`}
                          onClick={() => setEditing(variant)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${variant.sku}`}
                          onClick={() =>
                            setDeleting({
                              resource: "variants",
                              id: variant.id,
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            Add a variant so customers can choose their size and add this
            product to their bag.
          </p>
        )}
      </section>
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? "Edit product variant" : "Add a size and color"}
      >
        {editing !== undefined && (
          <ResourceForm
            resource="variants"
            config={resources.inventory}
            record={editing}
            fixed={{ product: Number(productId) }}
            onCancel={() => setEditing(undefined)}
            onSaved={() => {
              setEditing(undefined);
              refresh();
              notify("Variant saved.");
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        danger
        busy={action.busy}
        onClose={() => setDeleting(null)}
        title="Delete this product detail?"
        message="Ordered variants are protected. Product photos will be removed from the storefront."
        onConfirm={() =>
          action.run(async () => {
            await dashboardService.remove(deleting.resource, deleting.id);
            setDeleting(null);
            refresh();
          })
        }
      />
      <ErrorState error={action.error} compact />
    </>
  );
}

export default function ProductEditor() {
  const { id } = useParams();
  const creating = id === "new";
  const resource = useResource(
    ["edit-product", id],
    (signal) => dashboardService.detail("products", id, signal),
    !creating,
  );
  const navigate = useNavigate();
  const refs = useAdminReferences();
  const store = useStore();
  const notify = useToast();
  if (resource.loading) return <Skeleton rows count={3} />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Products", to: "/dashboard/products" },
          { label: creating ? "Add product" : resource.data?.name },
        ]}
      />
      <PageHeading
        eyebrow="THE DETAILS MATTER"
        title={creating ? "A new addition." : "Refine your piece."}
      >
        Add your product photo, details, and stock for each size and color. Your
        main photo will appear on the storefront.
      </PageHeading>
      <section className="panel">
        <ResourceForm
          key={id}
          resource="products"
          config={resources.products}
          record={resource.data}
          onSaved={(saved) => {
            refs.reload();
            store.refresh();
            notify("Product saved.");
            if (creating)
              navigate(`/dashboard/products/${saved.id}`, { replace: true });
            else resource.reload();
          }}
        />
      </section>
      {!creating && (
        <ProductAssets key={resource.data?.updated_at} productId={id} />
      )}
    </>
  );
}

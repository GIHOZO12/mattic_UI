import { Plus, Trash2 } from "lucide-react";
import { Button, Field } from "../../components/common/UI";

export default function StockFields({ rows, onChange, references, category }) {
  const sizes = (references.sizes || []).filter(
    (size) =>
      size.is_active &&
      (!size.category || String(size.category) === String(category)),
  );
  const colors = (references.colors || []).filter((color) => color.is_active);
  const update = (index, field, value) =>
    onChange(
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  return (
    <section className="stock-entry-section">
      <div className="section-header compact">
        <div>
          <h2>Sizes, colors & stock</h2>
          <p>
            Add a row for each size and color. For shoes, enter sizes such as
            42, 43, 44 or 45.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onChange([
              ...rows,
              {
                size_name: "",
                color: "",
                stock_quantity: 0,
                is_available: true,
              },
            ])
          }
        >
          <Plus size={16} />
          Add size
        </Button>
      </div>
      {rows.length === 0 && (
        <p className="muted">
          Add sizes now, or save the product and add stock later. Customers can
          buy only combinations with available stock.
        </p>
      )}
      <datalist id="product-size-suggestions">
        {sizes.map((size) => (
          <option key={size.id} value={size.name} />
        ))}
      </datalist>
      {rows.map((row, index) => (
        <div className="stock-entry-row" key={index}>
          <Field label="Size">
            <input
              aria-label={`Size ${index + 1}`}
              list="product-size-suggestions"
              placeholder="e.g. 42 or M"
              maxLength={30}
              required
              value={row.size_name}
              onChange={(e) => update(index, "size_name", e.target.value)}
            />
          </Field>
          <Field label="Color">
            <select
              aria-label={`Color ${index + 1}`}
              required
              value={row.color}
              onChange={(e) => update(index, "color", e.target.value)}
            >
              <option value="">Select color</option>
              {colors.map((color) => (
                <option value={color.id} key={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stock quantity">
            <input
              aria-label={`Stock quantity ${index + 1}`}
              type="number"
              min="0"
              max="2147483647"
              step="1"
              required
              value={row.stock_quantity}
              onChange={(e) => update(index, "stock_quantity", e.target.value)}
            />
          </Field>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={row.is_available}
              onChange={(e) => update(index, "is_available", e.target.checked)}
            />
            Available for purchase
          </label>
          <button
            type="button"
            className="icon-button"
            aria-label={`Remove size row ${index + 1}`}
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <p className="form-note">
        Set stock to 0 for sold-out sizes. Turn off “Available for purchase” to
        withdraw a combination. Stock codes are generated automatically.
      </p>
    </section>
  );
}

import { useForm } from "react-hook-form";
import { useState } from "react";
import ImageUploadField from "./ImageUploadField";
import StockFields from "./StockFields";
import { dashboardService } from "../../api/services";
import { useAction } from "../../hooks/useResource";
import { Button, ErrorState, Field, Image } from "../../components/common/UI";
import { useAdminReferences } from "./AdminContext";

function localDate(value) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export default function ResourceForm({
  resource,
  config,
  record,
  onSaved,
  onCancel,
  fixed = {},
}) {
  const references = useAdminReferences();
  const [stockRows, setStockRows] = useState([]);
  const defaults = Object.fromEntries(
    config.fields.map((field) => [
      field.name,
      field.type === "file"
        ? undefined
        : field.type === "datetime-local" && record?.[field.name]
          ? localDate(record[field.name])
          : (record?.[field.name] ??
            fixed[field.name] ??
            field.default ??
            (field.type === "checkbox" ? false : "")),
    ]),
  );
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: defaults });
  const action = useAction();
  const submit = (values) =>
    action.run(async () => {
      const data = { ...fixed };
      let hasFile = false;
      for (const field of config.fields) {
        if (field.name in fixed || (field.createOnly && record?.id)) continue;
        let value = values[field.name];
        if (field.type === "file") {
          if (value?.[0]) {
            const file = value[0];
            if (file.size > 5 * 1024 * 1024)
              throw new Error(`${field.label} must be 5 MB or smaller.`);
            data[field.name] = file;
            hasFile = true;
          }
          continue;
        }
        if (field.nullable && value === "") value = null;
        else if (field.type === "number" && value !== "") value = Number(value);
        else if (field.type === "select" && field.source && value !== "")
          value = Number(value);
        else if (field.type === "datetime-local" && value)
          value = new Date(value).toISOString();
        data[field.name] = value;
      }
      let body = data;
      if (resource === "products" && stockRows.length) {
        data.new_variants = stockRows.map((row) => ({
          ...row,
          color: Number(row.color),
          stock_quantity: Number(row.stock_quantity),
        }));
      }
      if (hasFile) {
        body = new FormData();
        Object.entries(data).forEach(([name, value]) =>
          body.append(
            name,
            value === null
              ? ""
              : Array.isArray(value)
                ? JSON.stringify(value)
                : value,
          ),
        );
      }
      const saved = record?.id
        ? await dashboardService.update(resource, record.id, body)
        : await dashboardService.create(resource, body);
      await onSaved(saved);
      setStockRows([]);
    });
  return (
    <form onSubmit={handleSubmit(submit)} className="resource-form">
      <ErrorState error={references.error} retry={references.reload} compact />
      <div className="field-grid">
        {config.fields
          .filter(
            (field) =>
              !(field.name in fixed) && !(field.createOnly && record?.id),
          )
          .map((field) => {
            const validation = {
              required: field.required ? `${field.label} is required.` : false,
              ...(field.min !== undefined
                ? {
                    min: {
                      value: field.min,
                      message: "Use zero or a positive value.",
                    },
                  }
                : {}),
              ...(field.pattern
                ? {
                    pattern: {
                      value: field.pattern,
                      message: "Use a six-digit color such as #FFFFFF.",
                    },
                  }
                : {}),
            };
            if (field.type === "checkbox")
              return (
                <label className="checkbox-label" key={field.name}>
                  <input type="checkbox" {...register(field.name)} />
                  {field.label}
                </label>
              );
            const input =
              field.type === "file" ? (
                <ImageUploadField
                  registration={register(field.name, {
                    ...validation,
                    validate: (files) =>
                      !files?.[0] ||
                      (files[0].size <= 5 * 1024 * 1024 &&
                        ["image/jpeg", "image/png", "image/webp"].includes(
                          files[0].type,
                        )) ||
                      "Choose a JPG, PNG or WEBP image up to 5 MB.",
                  })}
                  label={field.label}
                  disabled={action.busy}
                />
              ) : field.type === "select" ? (
                <select {...register(field.name, validation)}>
                  <option value="">
                    {field.nullable ? "None" : "Select…"}
                  </option>
                  {(
                    field.options ||
                    (references.data[field.source] || [])
                      .filter(
                        (item) =>
                          !(
                            resource === "categories" &&
                            field.name === "parent" &&
                            item.id === record?.id
                          ),
                      )
                      .map((item) => [
                        item.id,
                        `${item.parent ? "— " : ""}${item.name || item.sku}`,
                      ])
                  ).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea rows={5} {...register(field.name, validation)} />
              ) : (
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  step={
                    field.step || (field.type === "number" ? "1" : undefined)
                  }
                  min={field.min}
                  maxLength={field.maxLength}
                  accept={
                    field.type === "file"
                      ? "image/jpeg,image/png,image/webp"
                      : undefined
                  }
                  {...register(field.name, validation)}
                />
              );
            return (
              <Field
                key={field.name}
                label={field.label}
                error={errors[field.name]}
                hint={field.hint}
                className={
                  ["textarea", "file"].includes(field.type) ? "full-span" : ""
                }
              >
                {field.type === "file" && record?.[field.name] && (
                  <Image
                    className="form-image-preview"
                    src={record[field.name]}
                    alt={`Current ${field.label}`}
                  />
                )}
                {input}
              </Field>
            );
          })}
      </div>
      {resource === "products" && (
        <StockFields
          rows={stockRows}
          onChange={setStockRows}
          references={references.data}
          category={watch("category")}
        />
      )}
      <ErrorState error={action.error} compact />
      <div className="button-row justify-end">
        {onCancel && (
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={action.busy}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" busy={action.busy}>
          Save {resource === "inventory" ? "variant" : "changes"}
        </Button>
      </div>
    </form>
  );
}

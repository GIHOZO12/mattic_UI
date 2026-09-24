import { useState } from "react";
import { useForm } from "react-hook-form";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { addressService } from "../../api/services";
import { useAction, useResource } from "../../hooks/useResource";
import { useToast } from "../../context/AppContext";
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Field,
  Modal,
  Skeleton,
} from "../common/UI";

const fields = [
  ["full_name", "Full name", true],
  ["phone_number", "Phone number", true],
  ["country", "Country", true],
  ["province", "Province", true],
  ["district", "District", true],
  ["sector", "Sector", true],
  ["cell", "Cell"],
  ["village", "Village"],
  ["street_or_landmark", "Street or landmark"],
  ["additional_information", "Additional information"],
];
function AddressForm({ address, saved, close }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: address || { country: "Rwanda", is_default: false },
  });
  const action = useAction();
  const submit = (data) =>
    action.run(async () => {
      const result = address?.id
        ? await addressService.update(address.id, data)
        : await addressService.create(data);
      await saved(result);
      close();
    });
  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="field-grid">
        {fields.map(([name, label, required]) => (
          <Field key={name} label={label} error={errors[name]}>
            <input
              type={name === "phone_number" ? "tel" : "text"}
              {...register(name, {
                required: required ? `${label} is required.` : false,
              })}
            />
          </Field>
        ))}
      </div>
      <label className="checkbox-label">
        <input type="checkbox" {...register("is_default")} />
        Make this my default address
      </label>
      <ErrorState error={action.error} compact />
      <div className="button-row justify-end">
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" busy={action.busy}>
          Save address
        </Button>
      </div>
    </form>
  );
}

export function GuestAddressForm({ address, onContinue }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: address || { country: "Rwanda" } });
  return (
    <form onSubmit={handleSubmit(onContinue)}>
      <div className="section-header compact">
        <h2>Where shall we send it?</h2>
      </div>
      <p className="muted mb-6">
        Checkout as a guest. No account or password needed.
      </p>
      <div className="field-grid">
        {fields.map(([name, label, required]) => (
          <Field key={name} label={label} error={errors[name]}>
            <input
              type={name === "phone_number" ? "tel" : "text"}
              maxLength={
                name === "full_name"
                  ? 160
                  : name === "phone_number"
                    ? 30
                    : name === "street_or_landmark"
                      ? 255
                      : name === "additional_information"
                        ? 2000
                        : 80
              }
              {...register(name, {
                required: required ? `${label} is required.` : false,
                validate: (value) =>
                  !required ||
                  Boolean(value?.trim()) ||
                  `${label} is required.`,
              })}
            />
          </Field>
        ))}
      </div>
      <Button className="mt-8" type="submit">
        Review your order
      </Button>
    </form>
  );
}

export function AddressText({ address }) {
  return (
    <>
      <strong>{address.full_name || address.customer_name}</strong>
      <span>{address.phone_number || address.customer_phone}</span>
      <span>
        {[address.street_or_landmark, address.village, address.cell]
          .filter(Boolean)
          .join(", ")}
      </span>
      <span>
        {[address.sector, address.district, address.province, address.country]
          .filter(Boolean)
          .join(", ")}
      </span>
      {address.additional_information && (
        <span>{address.additional_information}</span>
      )}
    </>
  );
}

export default function AddressBook({ selecting = false, selected, onSelect }) {
  const resource = useResource("addresses", () => addressService.all());
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const action = useAction();
  const notify = useToast();
  const saved = async (address) => {
    resource.reload();
    if (selecting) onSelect(address);
    notify("Address saved.");
  };
  return (
    <div>
      <div className="section-header compact">
        <h2>{selecting ? "Where shall we send it?" : "Your addresses"}</h2>
        <Button variant="outline" onClick={() => setEditing(null)}>
          <Plus size={16} />
          Add address
        </Button>
      </div>
      {resource.loading ? (
        <Skeleton rows count={2} />
      ) : resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : !resource.data?.length ? (
        <div className="empty-inline">
          <MapPin size={25} />
          <p>Add your first delivery address to get started.</p>
        </div>
      ) : (
        <div className="address-grid">
          {resource.data.map((address) => (
            <article
              key={address.id}
              className={`address-card ${selected?.id === address.id ? "selected" : ""}`}
            >
              {selecting && (
                <label className="address-select">
                  <input
                    type="radio"
                    name="delivery-address"
                    checked={selected?.id === address.id}
                    onChange={() => onSelect(address)}
                  />
                  Deliver here
                </label>
              )}
              <div className="address-text">
                <AddressText address={address} />
              </div>
              {address.is_default && (
                <span className="badge">Default address</span>
              )}
              <div className="address-actions">
                <button onClick={() => setEditing(address)}>
                  <Pencil size={14} />
                  Edit
                </button>
                <button onClick={() => setDeleting(address)}>
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Modal
        open={editing !== undefined}
        title={editing ? "Edit your address" : "Add a delivery address"}
        onClose={() => setEditing(undefined)}
      >
        {editing !== undefined && (
          <AddressForm
            address={editing}
            saved={saved}
            close={() => setEditing(undefined)}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        busy={action.busy}
        danger
        title="Remove this address?"
        message="Existing orders will keep their saved delivery details."
        onConfirm={() =>
          action.run(async () => {
            await addressService.remove(deleting.id);
            if (selected?.id === deleting.id) onSelect?.(null);
            setDeleting(null);
            resource.reload();
            notify("Address removed.");
          })
        }
      />
      <ErrorState error={action.error} compact />
    </div>
  );
}

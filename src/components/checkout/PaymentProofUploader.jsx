import { useEffect, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { Button, ErrorState, Field } from "../common/UI";
import { useAction } from "../../hooks/useResource";
import { paymentService } from "../../api/services";

export default function PaymentProofUploader({ orderId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [reference, setReference] = useState("");
  const action = useAction();
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const choose = (candidate) => {
    setFileError("");
    if (!candidate) return;
    if (
      !/\.(jpe?g|png|webp)$/i.test(candidate.name) ||
      !["image/jpeg", "image/png", "image/webp"].includes(candidate.type)
    ) {
      setFileError("Choose a JPG, PNG or WEBP image.");
      return;
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setFileError("Your screenshot must be 5 MB or smaller.");
      return;
    }
    setFile(candidate);
  };
  const submit = (event) => {
    event.preventDefault();
    if (!file) {
      setFileError("Choose your payment screenshot first.");
      return;
    }
    action.run(async () => {
      const data = new FormData();
      data.append("screenshot", file);
      data.append("transaction_reference", reference);
      const order = await paymentService.submit(orderId, data);
      onSuccess(order);
    });
  };
  return (
    <form className="proof-form" onSubmit={submit}>
      <h2>Upload your payment proof</h2>
      <p className="muted">
        Make sure the amount and transaction details are easy to read.
      </p>
      {preview ? (
        <div className="proof-preview">
          <img src={preview} alt="Your payment screenshot preview" />
          <button
            className="icon-button"
            type="button"
            aria-label="Remove selected screenshot"
            onClick={() => setFile(null)}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <label
          className="upload-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            choose(e.dataTransfer.files[0]);
          }}
        >
          <ImagePlus size={30} strokeWidth={1.2} />
          <strong>Drop your screenshot here</strong>
          <span>or choose an image</span>
          <small>JPG, PNG or WEBP · Up to 5 MB</small>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choose payment screenshot"
            onChange={(e) => choose(e.target.files[0])}
          />
        </label>
      )}
      {fileError && (
        <p className="field-error" role="alert">
          {fileError}
        </p>
      )}
      <Field label="Transaction reference (optional)">
        <input
          maxLength={120}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Reference from your payment receipt"
        />
      </Field>
      <ErrorState error={action.error} compact />
      <Button
        className="w-full"
        type="submit"
        disabled={!file}
        busy={action.busy}
      >
        <Upload size={17} />
        Submit payment proof
      </Button>
    </form>
  );
}

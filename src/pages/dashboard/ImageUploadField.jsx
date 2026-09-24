import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";

export default function ImageUploadField({ registration, label, disabled }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (
      !file ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="image-upload-field">
      <div className="image-upload-preview">
        {preview ? (
          <img src={preview} alt={`Selected ${label.toLowerCase()} preview`} />
        ) : (
          <ImagePlus size={30} aria-hidden="true" />
        )}
        <div>
          <strong>{file ? file.name : "Choose a clear photo"}</strong>
          <span>
            {file
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB - Choose another file to replace it.`
              : "Preview your photo here before saving."}
          </span>
        </div>
      </div>
      <input
        {...registration}
        type="file"
        aria-label={label}
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(event) => {
          registration.onChange(event);
          setFile(event.target.files?.[0] || null);
        }}
      />
    </div>
  );
}

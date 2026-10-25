"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { imageFileError } from "@/lib/policies";
import { FormError } from "./form-error";
import { Icon } from "./icons";

function ImagePreview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  // This local blob is created and released by the effect; it never reaches an image optimizer.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={image}
      className="upload-preview-image"
      alt={`Preview of ${file.name}`}
      width={180}
      height={140}
    />
  );
}

export function ImageUpload({ productId }: { productId: number }) {
  const router = useRouter();
  const inputId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<File | null>(null);
  function clearSelection() {
    formRef.current?.reset();
    setSelected(null);
    setError("");
    setMessage("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const invalid = imageFileError(selected);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/products/${productId}/image`, {
        method: "POST",
        body: new FormData(form),
      });
      const body = await response.json();
      if (response.status === 401) {
        router.replace(`/login?expired=1&next=/products/${productId}`);
        router.refresh();
        return;
      }
      if (!response.ok)
        throw new Error(body.errors?.image?.[0] || body.message);
      form.reset();
      setSelected(null);
      setMessage("Image updated. Your collection is looking good.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="upload-panel" aria-labelledby={`${inputId}-heading`}>
      <div>
        <span className="eyebrow">MAKE IT PICTURE PERFECT</span>
        <h2 id={`${inputId}-heading`}>Product image</h2>
        <p>Preview your image before replacing the current one.</p>
      </div>
      <form ref={formRef} onSubmit={submit} aria-busy={pending}>
        <label className="file-picker" htmlFor={inputId}>
          <Icon name="upload" size={26} />
          <span>
            {selected ? "Choose a different image" : "Choose an image"}
          </span>
          <small>JPEG, PNG, or WebP · Up to 5 MB</small>
          <input
            id={inputId}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            disabled={pending}
            aria-invalid={!!error}
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              const invalid = imageFileError(file);
              setError(invalid || "");
              setMessage("");
              setSelected(invalid ? null : file);
              if (invalid) event.target.value = "";
            }}
          />
        </label>
        {selected ? (
          <div className="upload-preview">
            <ImagePreview file={selected} />
            <div>
              <strong>{selected.name}</strong>
              <p>
                {Math.ceil(selected.size / 1024).toLocaleString("en-US")} KB ·
                Ready to upload
              </p>
              <button
                className="text-button"
                type="button"
                disabled={pending}
                onClick={clearSelection}
              >
                Clear selection
              </button>
            </div>
          </div>
        ) : null}
        <button
          className="button primary"
          disabled={pending || !selected}
          type="submit"
        >
          {pending ? "Uploading…" : "Update image"}
          <Icon name="upload" size={17} />
        </button>
        <FormError message={error} />
        <p className={message ? "success-message" : "sr-only"} role="status">
          {pending ? "Uploading your image. Please wait." : message}
        </p>
      </form>
    </section>
  );
}

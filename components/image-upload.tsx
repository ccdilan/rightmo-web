"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MAX_IMAGE_BYTES } from "@/lib/policies";
import { Icon } from "./icons";
export function ImageUpload({ productId }: { productId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("image");
    if (!(file instanceof File) || !file.size || file.size > MAX_IMAGE_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Choose a JPEG, PNG, or WebP image up to 5 MB."); return; }
    setPending(true);
    try {
      const response = await fetch(`/api/products/${productId}/image`, { method: "POST", body: data });
      const body = await response.json();
      if (response.status === 401) { router.replace(`/login?expired=1&next=/products/${productId}`); router.refresh(); return; }
      if (!response.ok) throw new Error(body.errors?.image?.[0] || body.message);
      form.reset(); setFileName(""); setMessage("Image updated. Your collection is looking good."); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Upload failed. Please try again."); }
    finally { setPending(false); }
  }
  return <section className="upload-panel"><div><span className="eyebrow">MAKE IT PICTURE PERFECT</span><h2>Product image</h2><p>Give this product a fresh perspective.</p></div><form onSubmit={submit}><label className="file-picker" htmlFor="product-image"><Icon name="upload" size={26} /><span>{fileName || "Choose an image"}</span><small>JPEG, PNG, or WebP · Up to 5 MB</small><input id="product-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required disabled={pending} onChange={event => { setFileName(event.target.files?.[0]?.name || ""); setError(""); setMessage(""); }} /></label><button className="button primary" disabled={pending || !fileName} type="submit">{pending ? "Uploading…" : "Update image"}<Icon name="upload" size={17} /></button>{error ? <p className="error-message" role="alert">{error}</p> : null}{message ? <p className="success-message" role="status">{message}</p> : null}</form></section>;
}

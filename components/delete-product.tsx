"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";

export function DeleteProduct({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const dialogId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (response.status === 401) {
        dialog.current?.close();
        router.replace(`/login?expired=1&next=/products/${id}`);
        router.refresh();
        return;
      }
      if (!response.ok && response.status !== 404) {
        const body = await response.json();
        throw new Error(
          body.message || "We couldn't delete this product. Please try again.",
        );
      }
      dialog.current?.close();
      router.replace("/dashboard?notice=deleted");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't delete this product. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <button
        className="button danger-outline"
        type="button"
        onClick={() => {
          setError("");
          dialog.current?.showModal();
        }}
      >
        <Icon name="trash" size={17} />
        Delete product
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <span className="danger-icon">
          <Icon name="trash" size={24} />
        </span>
        <h2 id={`${dialogId}-title`}>Delete this product?</h2>
        <p id={`${dialogId}-description`}>
          <strong>{name}</strong> and its image will be permanently removed from
          the shared catalog. This cannot be undone.
        </p>
        {error ? (
          <p className="error-message" role="alert">
            {error}
          </p>
        ) : null}
        <div className="form-actions">
          <button
            className="button secondary"
            type="button"
            autoFocus
            disabled={pending}
            onClick={() => dialog.current?.close()}
          >
            Keep product
          </button>
          <button
            className="button danger"
            type="button"
            disabled={pending}
            onClick={remove}
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </dialog>
    </>
  );
}

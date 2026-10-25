"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ManagedCategory, ApiErrorBody } from "@/lib/types";
import { FormError } from "./form-error";
import { Icon } from "./icons";

type Action =
  | { type: "create" }
  | { type: "edit" | "delete"; category: ManagedCategory };
export function CategoryManager({
  categories,
}: {
  categories: ManagedCategory[];
}) {
  const router = useRouter();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  useEffect(() => {
    const element = dialog.current;
    if (action) element?.showModal();
    return () => element?.close();
  }, [action]);
  function open(next: Action) {
    setError("");
    setFields({});
    setMessage("");
    setAction(next);
  }
  function close() {
    if (!pending) setAction(null);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action || pending) return;
    const current = action;
    const name = String(
      new FormData(event.currentTarget).get("name") || "",
    ).trim();
    setPending(true);
    setError("");
    setFields({});
    try {
      const response = await fetch(
        current.type === "create"
          ? "/api/categories"
          : `/api/categories/${current.category.id}`,
        {
          method:
            current.type === "create"
              ? "POST"
              : current.type === "edit"
                ? "PATCH"
                : "DELETE",
          ...(current.type === "delete"
            ? {}
            : {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
              }),
        },
      );
      if (response.status === 401) {
        setAction(null);
        router.replace("/login?expired=1&next=/categories");
        router.refresh();
        return;
      }
      const body =
        response.status === 204
          ? null
          : ((await response.json()) as ApiErrorBody & {
              data?: ManagedCategory;
            });
      if (!response.ok) {
        setFields(body?.errors || {});
        if (response.status === 404 || response.status === 409) router.refresh();
        throw new Error(
          body?.message || "We couldn't save this change. Please try again.",
        );
      }
      setAction(null);
      setMessage(
        current.type === "delete"
          ? "Category deleted."
          : current.type === "create"
            ? "Category created. It is now available when adding or editing products."
            : "Category updated. Existing products keep their category assignment.",
      );
      if (current.type === "create") setSearch("");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't save this change. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  const visible = categories.filter((category) =>
    category.name
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const selected = action && action.type !== "create" ? action.category : null;
  const deleting = action?.type === "delete";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">KEEP YOUR COLLECTION ORGANIZED</span>
          <h1>
            Categories<span className="heading-dot">.</span>
          </h1>
          <p>Create and manage the categories shared by your workspace.</p>
        </div>
        <div className="heading-actions">
          <span className="collection-count">
            {categories.length} categories
          </span>
          <button
            className="button primary"
            type="button"
            onClick={() => open({ type: "create" })}
          >
            <Icon name="plus" size={17} />
            Add category
          </button>
        </div>
      </div>
      <p className="notice">
        Renaming keeps products in their current category. To delete a category,
        move its products to another category first.
      </p>
      {message ? (
        <p className="success-message" role="status">
          {message}
        </p>
      ) : null}
      <div className="category-search">
        <label htmlFor={`${id}-search`}>Find a category</label>
        <input
          id={`${id}-search`}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search categories…"
        />
      </div>
      <p className="category-result-count" role="status">
        {visible.length} of {categories.length} categories
      </p>
      <div className="category-grid">
        {visible.map((category) => (
          <section
            className="category-card"
            key={category.id}
            aria-labelledby={`${id}-category-${category.id}`}
          >
            <div className="category-card-heading">
              <span className="workspace-icon">
                <Icon name="box" />
              </span>
              <div>
                <h2 id={`${id}-category-${category.id}`}>{category.name}</h2>
                <p>
                  {category.products_count}{" "}
                  {category.products_count === 1 ? "product" : "products"}
                </p>
              </div>
            </div>
            <div className="category-card-actions">
              <button
                type="button"
                className="button secondary small"
                aria-label={`Edit ${category.name}`}
                onClick={() => open({ type: "edit", category })}
              >
                <Icon name="edit" size={16} />
                Edit
              </button>
              <button
                type="button"
                className="button danger-outline small"
                disabled={category.products_count > 0}
                aria-label={`Delete ${category.name}`}
                aria-describedby={
                  category.products_count > 0
                    ? `${id}-used-${category.id}`
                    : undefined
                }
                onClick={() => open({ type: "delete", category })}
              >
                <Icon name="trash" size={16} />
                Delete
              </button>
              <Link
                href={`/dashboard?category_id=${category.id}`}
                className="category-products-link"
              >
                View products
                <Icon name="arrow" size={14} />
              </Link>
            </div>
            {category.products_count > 0 ? (
              <p className="control-hint" id={`${id}-used-${category.id}`}>
                Move products before deleting this category.
              </p>
            ) : (
              <p className="control-hint">
                No products assigned. This category can be deleted.
              </p>
            )}
          </section>
        ))}
      </div>
      {!visible.length ? (
        <div className="empty-state">
          <Icon name="box" size={36} />
          <h2>
            {categories.length
              ? "No matching categories."
              : "Create your first category."}
          </h2>
          <p>
            {categories.length
              ? "Try another name or clear your search."
              : "Categories help everyone organize and discover products."}
          </p>
          <button
            className="button secondary"
            type="button"
            onClick={() =>
              categories.length ? setSearch("") : open({ type: "create" })
            }
          >
            {categories.length ? "Clear search" : "Add category"}
          </button>
        </div>
      ) : null}
      <dialog
        ref={dialog}
        onClose={() => setAction(null)}
        className="confirm-dialog category-dialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <form
          key={`${action?.type}-${selected?.id || "new"}`}
          onSubmit={submit}
          aria-busy={pending}
        >
          <h2 id={`${id}-title`}>
            {deleting
              ? "Delete this category?"
              : selected
                ? "Edit category"
                : "Add category"}
          </h2>
          <p id={`${id}-description`}>
            {deleting
              ? `${selected?.name} will be permanently removed. This cannot be undone.`
              : "Use a unique name of up to 120 characters."}
          </p>
          {!deleting ? (
            <div className="field">
              <label htmlFor={`${id}-name`}>Category name</label>
              <input
                id={`${id}-name`}
                name="name"
                defaultValue={selected?.name || ""}
                required
                maxLength={120}
                disabled={pending}
                autoFocus
                aria-invalid={!!fields.name}
                aria-describedby={fields.name ? `${id}-name-error` : undefined}
              />
              {fields.name ? (
                <p id={`${id}-name-error`} className="field-error">
                  {fields.name[0]}
                </p>
              ) : null}
            </div>
          ) : null}
          <FormError
            message={error}
            fields={fields}
            targets={{ name: `${id}-name` }}
          />
          {deleting && selected ? (
            <Link
              className="category-products-link"
              href={`/dashboard?category_id=${selected.id}`}
              onClick={close}
            >
              View products in this category
              <Icon name="arrow" size={14} />
            </Link>
          ) : null}
          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              autoFocus={deleting}
              disabled={pending}
              onClick={close}
            >
              {deleting ? "Keep category" : "Cancel"}
            </button>
            <button
              className={`button ${deleting ? "danger" : "primary"}`}
              type="submit"
              disabled={
                pending || (deleting && (selected?.products_count || 0) > 0)
              }
            >
              {pending
                ? deleting
                  ? "Deleting…"
                  : "Saving…"
                : deleting
                  ? "Delete permanently"
                  : selected
                    ? "Save changes"
                    : "Create category"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

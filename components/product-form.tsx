"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import type { ApiErrorBody, Category, Product } from "@/lib/types";
import { FormError } from "./form-error";
import { Icon } from "./icons";

type FieldName = "name" | "description" | "category_id" | "price" | "rating";

export function ProductForm({
  categories,
  currency,
  product,
}: {
  categories: Category[];
  currency: string;
  product?: Product;
}) {
  const router = useRouter();
  const formId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [missing, setMissing] = useState(false);
  const [descriptionLength, setDescriptionLength] = useState(
    product?.description?.length || 0,
  );
  const returnTo = product ? `/products/${product.id}/edit` : "/products/new";
  const cancelHref = product ? `/products/${product.id}` : "/dashboard";
  function accessibility(field: FieldName) {
    return {
      "aria-invalid": !!fields[field],
      "aria-describedby": fields[field]
        ? `${formId}-${field}-error`
        : undefined,
    };
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setPending(true);
    setError("");
    setFields({});
    try {
      const response = await fetch(
        product ? `/api/products/${product.id}` : "/api/products",
        {
          method: product ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(values.get("name") || "").trim(),
            description: String(values.get("description") || "").trim() || null,
            category_id: Number(values.get("category_id")),
            price: values.get("price"),
            rating: Number(values.get("rating")),
          }),
        },
      );
      const body = (await response.json()) as { data?: Product } & ApiErrorBody;
      if (response.status === 401) {
        router.replace(`/login?expired=1&next=${encodeURIComponent(returnTo)}`);
        router.refresh();
        return;
      }
      if (!response.ok) {
        setFields(body.errors || {});
        if (response.status === 404) {
          setMissing(true);
          throw new Error(
            "This product is no longer in the catalog. Return to the collection to continue.",
          );
        }
        throw new Error(
          body.message || "We couldn't save this product. Please try again.",
        );
      }
      if (!body.data)
        throw new Error(
          "The product response was incomplete. Refresh the collection before trying again.",
        );
      if (!product) {
        form.reset();
        setDescriptionLength(0);
      }
      router.replace(
        `/products/${body.data.id}?notice=${product ? "updated" : "created"}`,
      );
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't save this product. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="product-form" onSubmit={submit} aria-busy={pending}>
      <p className="form-guidance">
        All fields are required except the description. Changes are visible to
        everyone in the workspace.
      </p>
      <fieldset disabled={pending || missing} className="product-form-fields">
        <legend className="sr-only">Product information</legend>
        <div className="field full-width">
          <label htmlFor={formId + "-name"}>Product name</label>
          <input
            id={formId + "-name"}
            name="name"
            defaultValue={product?.name || ""}
            required
            maxLength={160}
            placeholder="e.g. Studio Wireless Headphones"
            {...accessibility("name")}
          />
          {fields.name ? (
            <p id={formId + "-name-error"} className="field-error">
              {fields.name[0]}
            </p>
          ) : null}
        </div>
        <div className="field full-width">
          <label htmlFor={formId + "-category"}>Category</label>
          <select
            id={formId + "-category"}
            name="category_id"
            defaultValue={product?.category.id ?? ""}
            required
            {...accessibility("category_id")}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fields.category_id ? (
            <p id={formId + "-category_id-error"} className="field-error">
              {fields.category_id[0]}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor={formId + "-price"}>Price ({currency})</label>
          <input
            id={formId + "-price"}
            name="price"
            type="number"
            inputMode="decimal"
            min="0"
            max="9999999999.99"
            step="0.01"
            defaultValue={product?.price ?? ""}
            required
            placeholder="0.00"
            {...accessibility("price")}
          />
          {fields.price ? (
            <p id={formId + "-price-error"} className="field-error">
              {fields.price[0]}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor={formId + "-rating"}>Rating (0–5)</label>
          <input
            id={formId + "-rating"}
            name="rating"
            type="number"
            inputMode="decimal"
            min="0"
            max="5"
            step="0.1"
            defaultValue={product?.rating ?? 0}
            required
            {...accessibility("rating")}
          />
          {fields.rating ? (
            <p id={formId + "-rating-error"} className="field-error">
              {fields.rating[0]}
            </p>
          ) : null}
        </div>
        <div className="field full-width">
          <label htmlFor={formId + "-description"}>
            Description <span className="optional-label">optional</span>
          </label>
          <textarea
            id={formId + "-description"}
            name="description"
            rows={6}
            maxLength={10000}
            defaultValue={product?.description || ""}
            placeholder="What makes this product worth a closer look?"
            {...accessibility("description")}
            aria-describedby={`${formId}-description-hint${fields.description ? ` ${formId}-description-error` : ""}`}
            onChange={(event) =>
              setDescriptionLength(event.currentTarget.value.length)
            }
          />
          <p id={`${formId}-description-hint`} className="description-hint">
            <span>Include useful features, materials, or care details.</span>
            <span>{descriptionLength.toLocaleString("en-US")} / 10,000</span>
          </p>
          {fields.description ? (
            <p id={formId + "-description-error"} className="field-error">
              {fields.description[0]}
            </p>
          ) : null}
        </div>
      </fieldset>
      <FormError
        message={error}
        fields={fields}
        targets={{
          name: `${formId}-name`,
          category_id: `${formId}-category`,
          price: `${formId}-price`,
          rating: `${formId}-rating`,
          description: `${formId}-description`,
        }}
      />
      {!categories.length ? (
        <p className="notice" role="status">
          No categories are available yet. Please try again once a category has
          been added.
        </p>
      ) : null}
      <div className="form-actions">
        <Link
          className="button secondary"
          href={missing ? "/dashboard" : cancelHref}
        >
          {missing ? "Back to collection" : "Cancel"}
        </Link>
        <button
          className="button primary"
          type="submit"
          disabled={pending || missing || !categories.length}
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          <Icon name="check" size={17} />
        </button>
      </div>
    </form>
  );
}

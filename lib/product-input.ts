const editableFields = [
  "name",
  "description",
  "category_id",
  "price",
  "rating",
] as const;

export function productInput(
  body: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    editableFields
      .filter((field) => Object.hasOwn(body, field))
      .map((field) => [field, body[field]]),
  );
}

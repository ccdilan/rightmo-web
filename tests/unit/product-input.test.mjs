import test from "node:test";
import assert from "node:assert/strict";
import { productInput } from "../../lib/product-input.ts";

test("product mutations preserve omitted fields and exclude persistence fields", () => {
  const inherited = Object.create({ name: "Inherited name" });
  Object.assign(inherited, {
    description: null,
    price: "0.00",
    id: 9,
    image_path: "other-product.png",
    created_at: "2026-01-01",
  });
  assert.deepEqual(productInput(inherited), {
    description: null,
    price: "0.00",
  });
  assert.deepEqual(
    productInput({ name: "Product", category_id: 2, rating: 0 }),
    { name: "Product", category_id: 2, rating: 0 },
  );
});

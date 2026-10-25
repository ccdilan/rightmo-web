import test from "node:test";
import assert from "node:assert/strict";
import {
  queryFromForm,
  selectedCategories,
  withoutFilter,
  pageNumbers,
} from "../../lib/catalog-query.ts";
import { catalogQuery } from "../../lib/policies.ts";

test("combined filters round trip repeated categories and reset the page", () => {
  const form = new FormData();
  for (const [key, value] of [
    ["search", " studio wireless "],
    ["category_ids[]", "2"],
    ["category_ids[]", "3"],
    ["min_price", "0"],
    ["max_price", "99.99"],
    ["min_rating", "4.5"],
    ["sort", "price:asc"],
    ["per_page", "24"],
    ["page", "9"],
  ])
    form.append(key, value);
  const query = queryFromForm(form);
  assert.deepEqual(selectedCategories(query), ["2", "3"]);
  assert.equal(query.get("search"), "studio wireless");
  assert.equal(query.get("min_price"), "0");
  assert.equal(query.get("sort_direction"), "asc");
  assert.equal(query.get("per_page"), "24");
  assert.equal(query.has("page"), false);
  assert.equal(
    catalogQuery({
      "category_ids[]": ["2", "3"],
      min_rating: "4.5",
      page: "3",
      password: "secret",
    }).toString(),
    "category_ids%5B%5D=2&category_ids%5B%5D=3&min_rating=4.5&page=3",
  );
});
test("removing one category keeps other criteria and resets pagination", () => {
  const query = new URLSearchParams(
    "category_ids[]=2&category_ids[]=3&min_rating=4&search=studio&page=5",
  );
  const result = withoutFilter(query, "category_ids[]", "2");
  assert.deepEqual(selectedCategories(result), ["3"]);
  assert.equal(result.get("min_rating"), "4");
  assert.equal(result.get("search"), "studio");
  assert.equal(result.has("page"), false);
  assert.equal(query.get("page"), "5");
  assert.deepEqual(selectedCategories(new URLSearchParams("category_id=7")), [
    "7",
  ]);
});
test("pagination stays bounded for large and out-of-range page numbers", () => {
  assert.deepEqual(pageNumbers(1, 1), [1]);
  assert.deepEqual(pageNumbers(5, 100), [1, null, 4, 5, 6, null, 100]);
  assert.deepEqual(pageNumbers(1000, 3), [1, null, 3]);
});

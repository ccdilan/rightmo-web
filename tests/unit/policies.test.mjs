import test from "node:test";
import assert from "node:assert/strict";
import {
  safeReturnTo,
  isSameOrigin,
  catalogQuery,
} from "../../lib/policies.ts";
test("return URLs only allow local catalog routes", () => {
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/api/auth/logout",
    "/login",
    "/products/new/edit",
    "/products/12/delete",
    "/products/example/edit",
    "/%2f%2fevil.test",
    " /dashboard",
    null,
  ])
    assert.equal(safeReturnTo(value), "/dashboard");
  assert.equal(safeReturnTo("/products/12"), "/products/12");
  assert.equal(safeReturnTo("/products/new"), "/products/new");
  assert.equal(safeReturnTo("/categories"), "/categories");
  assert.equal(safeReturnTo("/categories/unknown"), "/dashboard");
  assert.equal(safeReturnTo("/products/12/edit"), "/products/12/edit");
  assert.equal(
    safeReturnTo("/dashboard?search=lamp&page=2"),
    "/dashboard?search=lamp&page=2",
  );
});
test("mutation origin must match exactly", () => {
  assert.equal(
    isSameOrigin("http://localhost:3000", "http://localhost:3000"),
    true,
  );
  for (const value of [
    null,
    "null",
    "https://evil.test",
    "http://localhost:3001",
    "http://localhost:3000.evil.test",
  ])
    assert.equal(isSameOrigin(value, "http://localhost:3000"), false);
});
test("catalog parameters preserve filters and reject unknown or repeated values", () => {
  const query = catalogQuery({
    search: " desk ",
    category_id: "2",
    page: "3",
    min_price: "0",
    max_price: "",
    token: "secret",
    sort_by: ["price", "rating"],
  });
  assert.equal(
    query.toString(),
    "search=desk&category_id=2&page=3&min_price=0",
  );
});

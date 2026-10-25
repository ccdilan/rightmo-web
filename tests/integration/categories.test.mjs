import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const web = process.env.E2E_BASE_URL || "http://localhost:3000";
const origin = new URL(web).origin;

test("category management supports CRUD, protects references and refreshes product forms", async () => {
  const login = await fetch(`${web}/api/auth/login`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.E2E_EMAIL || "demo@rightmo.test",
      password: process.env.E2E_PASSWORD || "RightmoDemo!2026",
      next: "/categories",
    }),
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).redirect, "/categories");
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const headers = {
    Origin: origin,
    Cookie: cookie,
    "Content-Type": "application/json",
  };
  const mutate = (path, method, data, overrides = {}) =>
    fetch(`${web}/api/${path}`, {
      method,
      headers: { ...headers, ...overrides },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
  const page = async (path) =>
    (
      await fetch(`${web}${path}`, {
        headers: { Cookie: cookie },
        redirect: "manual",
      })
    ).text();
  const name = `ZZZ Category integration ${randomUUID()}`;
  let categoryId, productId;
  try {
    const protectedPage = await fetch(`${web}/categories`, {
      redirect: "manual",
    });
    assert.ok(
      (
        protectedPage.headers.get("location") || (await protectedPage.text())
      ).includes("/login"),
    );
    for (const [path, method] of [
      ["categories", "POST"],
      ["categories/1", "PATCH"],
      ["categories/1", "DELETE"],
    ]) {
      assert.equal(
        (
          await mutate(path, method, undefined, {
            Origin: "https://untrusted.test",
          })
        ).status,
        403,
      );
      assert.equal(
        (await mutate(path, method, undefined, { Cookie: "" })).status,
        401,
      );
    }
    assert.equal(
      (await mutate("categories", "POST", { name: " " })).status,
      422,
    );
    assert.equal(
      (await mutate("categories", "POST", { name: "x".repeat(9000) })).status,
      413,
    );
    assert.equal(
      (await mutate("categories/invalid", "PATCH", { name })).status,
      404,
    );
    const created = await mutate("categories", "POST", {
      name: ` ${name} `,
      id: 999999,
    });
    assert.equal(created.status, 201);
    const category = (await created.json()).data;
    categoryId = category.id;
    assert.equal(category.name, name);
    assert.equal(category.products_count, 0);
    assert.notEqual(categoryId, 999999);
    assert.ok((await page("/categories")).includes(name));
    assert.ok((await page("/products/new")).includes(name));
    const duplicate = await mutate("categories", "POST", {
      name: name.toUpperCase(),
    });
    assert.equal(duplicate.status, 422);
    assert.ok((await duplicate.json()).errors.name);
    assert.equal(
      (await mutate(`categories/${categoryId}`, "PATCH", { name })).status,
      200,
    );
    const product = await mutate("products", "POST", {
      name: `Category fixture ${randomUUID()}`,
      category_id: categoryId,
      price: "5.00",
      rating: 4,
    });
    assert.equal(product.status, 201);
    productId = (await product.json()).data.id;
    const updated = await mutate(`categories/${categoryId}`, "PATCH", {
      name: `${name} renamed`,
      products_count: 0,
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).data.products_count, 1);
    assert.ok(
      (await page(`/products/${productId}`)).includes(`${name} renamed`),
    );
    assert.ok(
      (await page(`/products/${productId}/edit`)).includes(`${name} renamed`),
    );
    const blocked = await mutate(`categories/${categoryId}`, "DELETE");
    assert.equal(blocked.status, 409);
    assert.match((await blocked.json()).message, /contains products/);
    assert.ok((await page("/categories")).includes(`${name} renamed`));
    assert.equal((await mutate(`products/${productId}`, "DELETE")).status, 204);
    productId = undefined;
    assert.equal(
      (await mutate(`categories/${categoryId}`, "DELETE")).status,
      204,
    );
    const deletedId = categoryId;
    categoryId = undefined;
    assert.equal(
      (await mutate(`categories/${deletedId}`, "DELETE")).status,
      404,
    );
    assert.ok(!(await page("/products/new")).includes(`${name} renamed`));
    assert.ok(!(await page("/categories")).includes(`${name} renamed`));
  } finally {
    if (productId)
      assert.equal(
        (await mutate(`products/${productId}`, "DELETE")).status,
        204,
      );
    if (categoryId)
      assert.equal(
        (await mutate(`categories/${categoryId}`, "DELETE")).status,
        204,
      );
    await mutate("auth/logout", "POST");
  }
  for (const [path, method] of [
    ["categories", "POST"],
    ["categories/1", "PATCH"],
    ["categories/1", "DELETE"],
  ]) {
    const expired = await mutate(
      path,
      method,
      method === "DELETE" ? undefined : { name: "Expired" },
    );
    assert.equal(expired.status, 401);
    assert.match(expired.headers.get("set-cookie"), /Max-Age=0/i);
  }
});

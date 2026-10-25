import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const web = process.env.E2E_BASE_URL || "http://localhost:3000";
const api = process.env.E2E_API_URL || "http://localhost:8080";
const credentials = {
  email: process.env.E2E_EMAIL || "demo@rightmo.test",
  password: process.env.E2E_PASSWORD || "RightmoDemo!2026",
};
const origin = new URL(web).origin;
async function login() {
  const response = await fetch(`${web}/api/auth/login`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  assert.equal(response.status, 200);
  return response;
}
test("the workspace protects sessions and supports product CRUD and image updates", async () => {
  const blocked = await fetch(`${web}/api/auth/login`, {
    method: "POST",
    headers: {
      Origin: "https://untrusted.test",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
  assert.equal(blocked.status, 403);
  const response = await login();
  const cookieHeader = response.headers.get("set-cookie");
  assert.match(cookieHeader, /HttpOnly/i);
  assert.match(cookieHeader, /SameSite=lax/i);
  assert.doesNotMatch(cookieHeader, /Domain=/i);
  const cookie = cookieHeader.split(";")[0];
  const body = await response.json();
  assert.equal(body.redirect, "/dashboard");
  assert.equal(body.token, undefined);
  assert.equal(body.user.email, credentials.email);
  assert.doesNotMatch(JSON.stringify(body), /Bearer|expires_at/);
  const directLogin = await fetch(`${api}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(credentials),
  });
  assert.equal(directLogin.status, 200);
  const token = (await directLogin.json()).data.token;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const categories = await (
    await fetch(`${api}/api/v1/categories`, { headers })
  ).json();
  const mutationHeaders = {
    Origin: origin,
    Cookie: cookie,
    "Content-Type": "application/json",
  };
  const mutate = (path, method, body, overrides = {}) =>
    fetch(`${web}/api/products${path}`, {
      method,
      headers: { ...mutationHeaders, ...overrides },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  let id;
  let deleted = false;
  try {
    for (const [path, method] of [
      ["", "POST"],
      ["/1", "PATCH"],
      ["/1", "DELETE"],
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
        (await mutate(path, method, undefined, { Origin: "" })).status,
        403,
      );
      assert.equal(
        (await mutate(path, method, undefined, { Cookie: "" })).status,
        401,
      );
    }
    for (const path of ["/products/new", "/products/1/edit"]) {
      const protectedPage = await fetch(`${web}${path}`, {
        redirect: "manual",
      });
      const content = await protectedPage.text();
      assert.ok(
        (protectedPage.headers.get("location") || content).includes("/login"),
      );
      assert.ok(!content.includes('name="name"'));
    }
    const newForm = await (
      await fetch(`${web}/products/new`, { headers: { Cookie: cookie } })
    ).text();
    assert.ok(newForm.includes('name="name"'));
    assert.ok(newForm.includes("Create product"));
    const invalidFields = await mutate("", "POST", {
      name: " ",
      category_id: 999999999,
      price: "-1",
      rating: 6,
    });
    assert.equal(invalidFields.status, 422);
    const validation = await invalidFields.json();
    for (const field of ["name", "category_id", "price", "rating"])
      assert.ok(validation.errors[field]);
    const malformed = await fetch(`${web}/api/products`, {
      method: "POST",
      headers: mutationHeaders,
      body: "{",
    });
    assert.equal(malformed.status, 422);
    assert.equal((await mutate("", "POST", [])).status, 422);
    assert.equal(
      (await mutate("", "POST", { description: "x".repeat(65536) })).status,
      413,
    );
    assert.equal((await mutate("/not-an-id", "PATCH", {})).status, 404);
    assert.equal(
      (await mutate("/999999999", "PATCH", { name: "Missing" })).status,
      404,
    );
    const name = `Integration ${randomUUID()}`;
    const created = await fetch(`${web}/api/products`, {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({
        name,
        description: "界".repeat(10000),
        image_path: "not-allowed.png",
        category_id: categories.data[0].id,
        price: "25.00",
        rating: 4.5,
      }),
    });
    assert.equal(created.status, 201);
    const initialProduct = (await created.json()).data;
    id = initialProduct.id;
    assert.equal(initialProduct.name, name);
    assert.equal(initialProduct.description.length, 10000);
    assert.equal(initialProduct.image_url, null);
    assert.equal(initialProduct.image_path, undefined);
    const duplicate = await mutate("", "POST", {
      name: name.toUpperCase(),
      category_id: categories.data[0].id,
      price: "25.00",
      rating: 4.5,
    });
    assert.equal(duplicate.status, 422);
    assert.ok((await duplicate.json()).errors.name);
    const editForm = await (
      await fetch(`${web}/products/${id}/edit`, { headers: { Cookie: cookie } })
    ).text();
    assert.ok(editForm.includes(name));
    assert.ok(editForm.includes("Save changes"));
    const updated = await mutate(`/${id}`, "PATCH", {
      name,
      price: "31.25",
      rating: 3.7,
      description: null,
      category_id: categories.data[1].id,
    });
    assert.equal(updated.status, 200);
    const updatedProduct = (await updated.json()).data;
    assert.equal(updatedProduct.price, "31.25");
    assert.equal(updatedProduct.rating, 3.7);
    assert.equal(updatedProduct.description, null);
    assert.equal(updatedProduct.category.id, categories.data[1].id);
    const partial = await mutate(`/${id}`, "PATCH", {
      name: `${name} edited`,
      image_path: "forged.png",
      id: 999999999,
    });
    assert.equal(partial.status, 200);
    const partialProduct = (await partial.json()).data;
    assert.equal(partialProduct.id, id);
    assert.equal(partialProduct.price, "31.25");
    assert.equal(partialProduct.category.id, categories.data[1].id);
    assert.equal(partialProduct.image_url, null);
    const persisted = await (
      await fetch(`${api}/api/v1/products/${id}`, { headers })
    ).json();
    assert.deepEqual(persisted.data, partialProduct);
    assert.equal(
      (await mutate(`/${id}`, "PATCH", { price: "-1" })).status,
      422,
    );
    const dashboard = await fetch(`${web}/dashboard?search=Integration`, {
      headers: { Cookie: cookie },
    });
    assert.equal(dashboard.status, 200);
    const html = await dashboard.text();
    assert.match(html, /Product catalog/);
    assert.ok(html.includes(`${name} edited`));
    assert.ok(html.includes("31.25"));
    assert.doesNotMatch(
      html,
      new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    const invalid = new FormData();
    invalid.set(
      "image",
      new Blob(["not an image"], { type: "image/png" }),
      "fake.png",
    );
    const invalidResponse = await fetch(`${web}/api/products/${id}/image`, {
      method: "POST",
      headers: { Origin: origin, Cookie: cookie },
      body: invalid,
    });
    assert.equal(invalidResponse.status, 422);
    const upload = new FormData();
    upload.set(
      "image",
      new Blob(
        [
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jY1cAAAAASUVORK5CYII=",
            "base64",
          ),
        ],
        { type: "image/png" },
      ),
      "product.png",
    );
    const uploaded = await fetch(`${web}/api/products/${id}/image`, {
      method: "POST",
      headers: { Origin: origin, Cookie: cookie },
      body: upload,
    });
    assert.equal(uploaded.status, 200, await uploaded.clone().text());
    const product = (await uploaded.json()).data;
    assert.ok(product.image_url);
    assert.equal((await fetch(product.image_url)).status, 200);
    const details = await (
      await fetch(`${web}/products/${id}`, { headers: { Cookie: cookie } })
    ).text();
    assert.ok(details.includes(product.name));
    assert.ok(details.includes(product.image_url));
    const removed = await mutate(`/${id}`, "DELETE");
    assert.equal(removed.status, 204);
    deleted = true;
    assert.equal(await removed.text(), "");
    assert.equal(
      (await fetch(`${api}/api/v1/products/${id}`, { headers })).status,
      404,
    );
    assert.equal((await fetch(product.image_url)).status, 404);
    assert.equal((await mutate(`/${id}`, "DELETE")).status, 404);
    const afterDelete = await (
      await fetch(`${web}/dashboard?search=${encodeURIComponent(name)}`, {
        headers: { Cookie: cookie },
      })
    ).text();
    assert.ok(!afterDelete.includes(`/products/${id}`));
    const missingEdit = await (
      await fetch(`${web}/products/${id}/edit`, { headers: { Cookie: cookie } })
    ).text();
    assert.ok(!missingEdit.includes('name="name"'));
    const rejectedLogout = await fetch(`${web}/api/auth/logout`, {
      method: "POST",
      headers: { Origin: "https://untrusted.test", Cookie: cookie },
    });
    assert.equal(rejectedLogout.status, 403);
    const logout = await fetch(`${web}/api/auth/logout`, {
      method: "POST",
      headers: { Origin: origin, Cookie: cookie },
    });
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
    for (const [path, method] of [
      ["", "POST"],
      [`/${id}`, "PATCH"],
      [`/${id}`, "DELETE"],
    ]) {
      const expired = await mutate(
        path,
        method,
        method === "DELETE" ? undefined : { name: "Expired" },
      );
      assert.equal(expired.status, 401);
      assert.match(expired.headers.get("set-cookie"), /Max-Age=0/i);
    }
    const stale = await (
      await fetch(`${web}/dashboard`, {
        headers: { Cookie: cookie },
        redirect: "manual",
      })
    ).text();
    assert.ok(stale.includes("/login") && !stale.includes(product.name));
  } finally {
    if (id && !deleted)
      assert.equal(
        (
          await fetch(`${api}/api/v1/products/${id}`, {
            method: "DELETE",
            headers,
          })
        ).status,
        204,
      );
    await fetch(`${api}/api/v1/auth/logout`, { method: "POST", headers });
  }
});

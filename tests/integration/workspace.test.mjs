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
test("the workspace protects sessions, rejects CSRF, and updates images", async () => {
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
  let id;
  try {
    const created = await fetch(`${api}/api/v1/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: `Integration ${randomUUID()}`,
        category_id: categories.data[0].id,
        price: "25.00",
        rating: 4.5,
      }),
    });
    assert.equal(created.status, 201);
    id = (await created.json()).data.id;
    const dashboard = await fetch(`${web}/dashboard?search=Integration`, {
      headers: { Cookie: cookie },
    });
    assert.equal(dashboard.status, 200);
    const html = await dashboard.text();
    assert.match(html, /Product catalog/);
    assert.match(html, /Integration/);
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
    const stale = await (
      await fetch(`${web}/dashboard`, {
        headers: { Cookie: cookie },
        redirect: "manual",
      })
    ).text();
    assert.ok(stale.includes("/login") && !stale.includes(product.name));
  } finally {
    if (id)
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

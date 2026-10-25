import test from "node:test";
import assert from "node:assert/strict";
import { imageFileError } from "../../lib/policies.ts";

test("image preflight rejects empty, unsupported and oversized selections", () => {
  assert.match(imageFileError(null), /Choose an image/);
  assert.match(
    imageFileError({ size: 0, type: "image/png" }),
    /Choose an image/,
  );
  assert.match(
    imageFileError({ size: 8, type: "image/svg+xml" }),
    /JPEG, PNG, or WebP/,
  );
  assert.match(
    imageFileError({ size: 5 * 1024 * 1024 + 1, type: "image/jpeg" }),
    /too large/,
  );
  for (const type of ["image/png", "image/jpeg", "image/webp"])
    assert.equal(imageFileError({ size: 5 * 1024 * 1024, type }), null);
});

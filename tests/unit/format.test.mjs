import test from "node:test";
import assert from "node:assert/strict";
import { createPriceFormatter, formatPrice } from "../../lib/format.ts";

test("currency formatting preserves decimal prices across a reused formatter", () => {
  const usd = createPriceFormatter("USD");
  assert.deepEqual(["0.00", "12.30", "9999999999.99"].map(usd), [
    "$0.00",
    "$12.30",
    "$9,999,999,999.99",
  ]);
  const eur = createPriceFormatter("EUR");
  assert.equal(eur("25.50"), "€25.50");
  assert.equal(usd("25.50"), "$25.50");
  assert.equal(formatPrice("12.30", "USD"), "$12.30");
});

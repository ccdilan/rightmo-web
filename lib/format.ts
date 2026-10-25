export function createPriceFormatter(
  currency: string,
): (price: string) => string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  });
  return (price: string) => formatter.format(Number(price));
}

export function formatPrice(price: string, currency: string): string {
  return createPriceFormatter(currency)(price);
}

export function displayCurrency(): string {
  return process.env.DISPLAY_CURRENCY || "USD";
}

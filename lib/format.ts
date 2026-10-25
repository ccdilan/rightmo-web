export function formatPrice(price: string, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(price));
}
export function displayCurrency(): string { return process.env.DISPLAY_CURRENCY || "USD"; }

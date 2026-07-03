const SYMBOLS: Record<string, string> = { eur: "€", usd: "$", gbp: "£" };

/** Format integer cents as a currency string, e.g. 2000 -> "€20.00". */
export function formatMoney(cents: number, currency = "eur"): string {
  const symbol = SYMBOLS[currency.toLowerCase()] ?? "";
  const amount = (cents / 100).toFixed(2);
  return symbol ? `${symbol}${amount}` : `${amount} ${currency.toUpperCase()}`;
}

/** Locale-aware alternative used where Intl is available. */
export function formatMoneyIntl(cents: number, currency = "eur", locale = "en-IE"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return formatMoney(cents, currency);
  }
}
